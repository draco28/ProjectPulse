//! Sprint 9: Tauri IPC commands for AI Chat.
//!
//! The desktop frontend invokes these from JS. They proxy HTTP to the Axum
//! API and, for `send_message`, parse the SSE stream and re-emit each token
//! as a Tauri event (`chat://token`). Streaming over IPC return values isn't
//! supported by Tauri, so we use the event channel instead.

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

use crate::error::AppError;
use crate::state::AppState;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChatTokenEvent {
    pub conversation_id: String,
    pub token: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChatDoneEvent {
    pub conversation_id: String,
    pub message_id: i64,
    pub full_content: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChatErrorEvent {
    pub conversation_id: String,
    pub error: String,
}

#[derive(Debug, Deserialize)]
struct ApiEnvelope<T> {
    data: Option<T>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationDto {
    pub id: String,
    pub project_id: i32,
    pub title: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Validate a conversation_id before inserting into a URL.
/// CUID2 produces alphanumeric strings ~24 chars; we accept a generous bound.
fn validate_conversation_id(id: &str) -> Result<(), AppError> {
    if id.is_empty() || id.len() > 64 {
        return Err(AppError::Internal("invalid conversation id".to_string()));
    }
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err(AppError::Internal("invalid conversation id".to_string()));
    }
    Ok(())
}

/// Create a new chat conversation. Returns the conversation DTO.
#[tauri::command]
pub async fn start_chat(
    state: State<'_, AppState>,
    project_id: i32,
    title: Option<String>,
) -> Result<ConversationDto, AppError> {
    let url = format!("{}/chat/conversations", state.api_base_url);
    let mut req = state.http.post(&url).json(&serde_json::json!({
        "projectId": project_id,
        "title": title,
    }));
    if !state.api_token.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", state.api_token));
    }
    let resp = req
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("chat create failed: {}", e)))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let body = resp.text().await.unwrap_or_default();
        return Err(AppError::Internal(format!(
            "chat create HTTP {}: {}",
            status, body
        )));
    }

    let envelope: ApiEnvelope<ConversationDto> = resp
        .json()
        .await
        .map_err(|e| AppError::Internal(format!("invalid response: {}", e)))?;
    envelope
        .data
        .ok_or_else(|| AppError::Internal("empty response data".to_string()))
}

/// Send a message and relay the SSE stream as Tauri events.
///
/// Events emitted:
/// - `chat://token`  — { conversationId, token } on every text chunk
/// - `chat://done`   — { conversationId, messageId, fullContent } when complete
/// - `chat://error`  — { conversationId, error } on upstream failures
#[tauri::command]
pub async fn send_message(
    app: AppHandle,
    state: State<'_, AppState>,
    conversation_id: String,
    content: String,
) -> Result<(), AppError> {
    // Issue 7 fix: prevent path traversal via malformed conversation_id
    validate_conversation_id(&conversation_id)?;

    let url = format!(
        "{}/chat/conversations/{}/messages",
        state.api_base_url, conversation_id
    );
    let mut req = state
        .http
        .post(&url)
        .header("Accept", "text/event-stream")
        .json(&serde_json::json!({ "content": content }));
    if !state.api_token.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", state.api_token));
    }

    let resp = req
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("send_message HTTP failed: {}", e)))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let body = resp.text().await.unwrap_or_default();
        let _ = app.emit(
            "chat://error",
            ChatErrorEvent {
                conversation_id: conversation_id.clone(),
                error: format!("HTTP {}: {}", status, body),
            },
        );
        return Err(AppError::Internal(format!("HTTP {}", status)));
    }

    // Spawn background task to consume the SSE stream and emit events
    let conv_id = conversation_id.clone();
    let app_clone = app.clone();
    tokio::spawn(async move {
        let mut byte_stream = resp.bytes_stream();
        let mut buffer = String::new();
        let mut current_event = String::new();
        let mut current_data = String::new();

        use futures_util::StreamExt as _;
        while let Some(chunk) = byte_stream.next().await {
            let bytes = match chunk {
                Ok(b) => b,
                Err(e) => {
                    let _ = app_clone.emit(
                        "chat://error",
                        ChatErrorEvent {
                            conversation_id: conv_id.clone(),
                            error: format!("stream error: {}", e),
                        },
                    );
                    return;
                }
            };
            let s = String::from_utf8_lossy(&bytes);
            buffer.push_str(&s);

            // SSE events are delimited by blank lines. Process complete lines.
            while let Some(newline_idx) = buffer.find('\n') {
                let line = buffer[..newline_idx].trim_end_matches('\r').to_string();
                buffer.drain(..=newline_idx);

                if line.is_empty() {
                    // End of an event — dispatch
                    if !current_event.is_empty() && !current_data.is_empty() {
                        dispatch_sse_event(&app_clone, &conv_id, &current_event, &current_data);
                    }
                    current_event.clear();
                    current_data.clear();
                } else if let Some(rest) = line.strip_prefix("event:") {
                    current_event = rest.trim().to_string();
                } else if let Some(rest) = line.strip_prefix("data:") {
                    if !current_data.is_empty() {
                        current_data.push('\n');
                    }
                    current_data.push_str(rest.trim());
                }
                // ignore "id:", ":comment", etc.
            }
        }

        // Flush trailing event if any
        if !current_event.is_empty() && !current_data.is_empty() {
            dispatch_sse_event(&app_clone, &conv_id, &current_event, &current_data);
        }
    });

    Ok(())
}

fn dispatch_sse_event(app: &AppHandle, conv_id: &str, event_name: &str, data: &str) {
    let parsed: serde_json::Value = match serde_json::from_str(data) {
        Ok(v) => v,
        Err(_) => return,
    };

    match event_name {
        "token" => {
            if let Some(token) = parsed.get("token").and_then(|v| v.as_str()) {
                let _ = app.emit(
                    "chat://token",
                    ChatTokenEvent {
                        conversation_id: conv_id.to_string(),
                        token: token.to_string(),
                    },
                );
            }
        }
        "done" => {
            let _ = app.emit(
                "chat://done",
                ChatDoneEvent {
                    conversation_id: conv_id.to_string(),
                    message_id: parsed.get("messageId").and_then(|v| v.as_i64()).unwrap_or(0),
                    full_content: parsed
                        .get("fullContent")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string(),
                },
            );
        }
        "error" => {
            let _ = app.emit(
                "chat://error",
                ChatErrorEvent {
                    conversation_id: conv_id.to_string(),
                    error: parsed
                        .get("error")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown error")
                        .to_string(),
                },
            );
        }
        _ => {}
    }
}

/// Get conversation history. Returns raw JSON for the frontend to parse.
#[tauri::command]
pub async fn get_history(
    state: State<'_, AppState>,
    conversation_id: String,
    limit: Option<i32>,
) -> Result<serde_json::Value, AppError> {
    validate_conversation_id(&conversation_id)?;
    let mut url = format!(
        "{}/chat/conversations/{}/messages",
        state.api_base_url, conversation_id
    );
    if let Some(l) = limit {
        url.push_str(&format!("?limit={}", l));
    }
    let mut req = state.http.get(&url);
    if !state.api_token.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", state.api_token));
    }
    let resp = req
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("get_history failed: {}", e)))?;

    if !resp.status().is_success() {
        return Err(AppError::Internal(format!("HTTP {}", resp.status().as_u16())));
    }

    resp.json::<serde_json::Value>()
        .await
        .map_err(|e| AppError::Internal(format!("invalid response: {}", e)))
}

/// List conversations for a project.
#[tauri::command]
pub async fn list_conversations(
    state: State<'_, AppState>,
    project_id: i32,
    limit: Option<i32>,
) -> Result<serde_json::Value, AppError> {
    let mut url = format!("{}/chat/conversations?projectId={}", state.api_base_url, project_id);
    if let Some(l) = limit {
        url.push_str(&format!("&limit={}", l));
    }
    let mut req = state.http.get(&url);
    if !state.api_token.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", state.api_token));
    }
    let resp = req
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("list_conversations failed: {}", e)))?;

    if !resp.status().is_success() {
        return Err(AppError::Internal(format!("HTTP {}", resp.status().as_u16())));
    }

    resp.json::<serde_json::Value>()
        .await
        .map_err(|e| AppError::Internal(format!("invalid response: {}", e)))
}
