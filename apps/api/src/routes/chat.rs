//! Sprint 9: Chat API routes — conversation CRUD + streaming message endpoint.
//!
//! - POST   /api/v1/chat/conversations              — create
//! - GET    /api/v1/chat/conversations              — list
//! - POST   /api/v1/chat/conversations/:id/messages — send + stream response (SSE)
//! - GET    /api/v1/chat/conversations/:id/messages — get history

use std::convert::Infallible;
use std::time::Duration;

use axum::extract::{Path, Query, State};
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::Response;
use axum::{Extension, Json};
use futures::{Stream, StreamExt};

use crate::error::AppError;
use crate::middleware::auth::{require_project_access, AuthContext};
use crate::models::chat::*;
use crate::response;
use crate::services::chat_service::{self, ChatStreamEvent};
use crate::state::AppState;

// ============================================================================
// POST /api/v1/chat/conversations — create
// ============================================================================

pub async fn create_conversation(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<CreateConversationRequest>,
) -> Result<Response, AppError> {
    require_project_access(&auth, req.project_id)?;
    let conversation = chat_service::create_conversation(&state.db, req).await?;
    Ok(response::created(conversation))
}

// ============================================================================
// GET /api/v1/chat/conversations?projectId= — list
// ============================================================================

pub async fn list_conversations(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Query(params): Query<ListConversationsParams>,
) -> Result<Response, AppError> {
    require_project_access(&auth, params.project_id)?;
    let result = chat_service::list_conversations(
        &state.db,
        params.project_id,
        params.limit.unwrap_or(50),
    )
    .await?;
    Ok(response::success(result))
}

// ============================================================================
// GET /api/v1/chat/conversations/:id/messages — history
// ============================================================================

pub async fn get_messages(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<String>,
    Query(params): Query<ListMessagesParams>,
) -> Result<Response, AppError> {
    let project_id = chat_service::get_conversation_project(&state.db, &id).await?;
    require_project_access(&auth, project_id)?;
    let result = chat_service::list_messages(&state.db, &id, params.limit.unwrap_or(100)).await?;
    Ok(response::success(result))
}

// ============================================================================
// POST /api/v1/chat/conversations/:id/messages — send + stream (SSE)
// ============================================================================

pub async fn send_message(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthContext>,
    Path(id): Path<String>,
    Json(req): Json<SendMessageRequest>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, AppError> {
    // Auth
    let project_id = chat_service::get_conversation_project(&state.db, &id).await?;
    require_project_access(&auth, project_id)?;

    if req.content.trim().is_empty() {
        return Err(AppError::Validation("message content is required".into()));
    }

    // LLM must be configured
    let llm = state
        .llm
        .clone()
        .ok_or_else(|| AppError::BadRequest(
            "Chat is unavailable: LLM_API_KEY is not configured. \
             Set the environment variable on the API server.".to_string()
        ))?;

    let llm_model = state.config.llm_model.clone();

    // Build the chat stream — pass the already-authorized project_id down
    // so the service doesn't re-query (auth-hardening: service is only ever
    // called with an authenticated project_id from a verified route).
    let chat_stream = chat_service::send_message_stream(
        state.db.clone(),
        state.rag.clone(),
        llm,
        llm_model,
        project_id,
        id,
        req.content,
    )
    .await?;

    // Convert ChatStreamEvent → SSE Event
    let sse_stream = chat_stream.map(|event| {
        let evt = match event {
            ChatStreamEvent::Token(token) => Event::default()
                .event("token")
                .json_data(serde_json::json!({ "token": token }))
                .unwrap_or_else(|_| Event::default()),
            ChatStreamEvent::Done {
                message_id,
                full_content,
            } => Event::default()
                .event("done")
                .json_data(serde_json::json!({
                    "messageId": message_id,
                    "fullContent": full_content,
                }))
                .unwrap_or_else(|_| Event::default()),
            ChatStreamEvent::Error(msg) => Event::default()
                .event("error")
                .json_data(serde_json::json!({ "error": msg }))
                .unwrap_or_else(|_| Event::default()),
        };
        Ok(evt)
    });

    Ok(Sse::new(sse_stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(15))))
}
