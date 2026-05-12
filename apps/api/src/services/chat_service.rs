//! Sprint 9: Chat service — conversation lifecycle + streaming completion.
//!
//! Storage: chat_conversations + chat_messages tables.
//! LLM: direct `LlmProvider::chat_stream` (bypasses HiveMind for simple chat).
//! Context: RAG snippets prepended as a system message via `RagService::get_context`.

use std::pin::Pin;
use std::sync::Arc;

use futures::Stream;
use pulsehive_core::llm::{LlmChunk, LlmConfig, LlmProvider, Message};
use sqlx::PgPool;

use crate::error::AppError;
use crate::models::chat::*;
use crate::services::rag_search::RagService;

const CONTEXT_HISTORY_LIMIT: i64 = 20;
const RAG_TOKEN_BUDGET: usize = 2000;

/// Create a new conversation row. Returns the inserted conversation.
pub async fn create_conversation(
    db: &PgPool,
    req: CreateConversationRequest,
) -> Result<ConversationResponse, AppError> {
    let id = cuid2::create_id();
    let row: (String, String) = sqlx::query_as(
        r#"INSERT INTO chat_conversations (id, "projectId", title, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING "createdAt"::text, "updatedAt"::text"#,
    )
    .bind(&id)
    .bind(req.project_id)
    .bind(&req.title)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    Ok(ConversationResponse {
        id,
        project_id: req.project_id,
        title: req.title,
        created_at: row.0,
        updated_at: row.1,
    })
}

/// List conversations for a project, newest first.
pub async fn list_conversations(
    db: &PgPool,
    project_id: i32,
    limit: i32,
) -> Result<ListConversationsResponse, AppError> {
    let limit = limit.clamp(1, 100);

    let rows: Vec<(String, i32, Option<String>, String, String)> = sqlx::query_as(
        r#"SELECT id, "projectId", title, "createdAt"::text, "updatedAt"::text
           FROM chat_conversations
           WHERE "projectId" = $1
           ORDER BY "updatedAt" DESC
           LIMIT $2"#,
    )
    .bind(project_id)
    .bind(limit as i64)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(ListConversationsResponse {
        conversations: rows
            .into_iter()
            .map(|(id, project_id, title, created_at, updated_at)| ConversationResponse {
                id,
                project_id,
                title,
                created_at,
                updated_at,
            })
            .collect(),
    })
}

/// Get the project_id for a conversation, returning NotFound if missing.
pub async fn get_conversation_project(
    db: &PgPool,
    conversation_id: &str,
) -> Result<i32, AppError> {
    let row: Option<(i32,)> = sqlx::query_as(
        r#"SELECT "projectId" FROM chat_conversations WHERE id = $1"#,
    )
    .bind(conversation_id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Database)?;

    row.map(|(pid,)| pid)
        .ok_or_else(|| AppError::NotFound(format!("conversation {} not found", conversation_id)))
}

/// List messages in a conversation, oldest first.
pub async fn list_messages(
    db: &PgPool,
    conversation_id: &str,
    limit: i32,
) -> Result<ListMessagesResponse, AppError> {
    let limit = limit.clamp(1, 500);
    let rows: Vec<(i32, String, String, String, Option<i32>, String)> = sqlx::query_as(
        r#"SELECT id, "conversationId", role, content, "tokenCount", "createdAt"::text
           FROM chat_messages
           WHERE "conversationId" = $1
           ORDER BY "createdAt" ASC, id ASC
           LIMIT $2"#,
    )
    .bind(conversation_id)
    .bind(limit as i64)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    Ok(ListMessagesResponse {
        messages: rows
            .into_iter()
            .map(|(id, conversation_id, role, content, token_count, created_at)| MessageResponse {
                id,
                conversation_id,
                role,
                content,
                token_count,
                created_at,
            })
            .collect(),
    })
}

/// Append a single message and return its id.
async fn insert_message(
    db: &PgPool,
    conversation_id: &str,
    role: &str,
    content: &str,
) -> Result<i32, AppError> {
    let row: (i32,) = sqlx::query_as(
        r#"INSERT INTO chat_messages ("conversationId", role, content, "createdAt")
           VALUES ($1, $2, $3, NOW())
           RETURNING id"#,
    )
    .bind(conversation_id)
    .bind(role)
    .bind(content)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;

    // Bump conversation updatedAt
    sqlx::query(r#"UPDATE chat_conversations SET "updatedAt" = NOW() WHERE id = $1"#)
        .bind(conversation_id)
        .execute(db)
        .await
        .map_err(AppError::Database)?;

    Ok(row.0)
}

/// Fetch recent conversation history as PulseHive `Message`s for LLM context.
async fn build_history(
    db: &PgPool,
    conversation_id: &str,
) -> Result<Vec<Message>, AppError> {
    let rows: Vec<(String, String)> = sqlx::query_as(
        r#"SELECT role, content
           FROM chat_messages
           WHERE "conversationId" = $1
           ORDER BY "createdAt" DESC, id DESC
           LIMIT $2"#,
    )
    .bind(conversation_id)
    .bind(CONTEXT_HISTORY_LIMIT)
    .fetch_all(db)
    .await
    .map_err(AppError::Database)?;

    // Reverse to chronological order. We deliberately drop any stored
    // "system" messages here — the baseline system prompt is owned by this
    // service (prepended below) and we don't want to risk a double system
    // header if a future code path stores system rows.
    let mut messages: Vec<Message> = rows
        .into_iter()
        .rev()
        .filter_map(|(role, content)| match role.as_str() {
            "user" => Some(Message::User { content }),
            "assistant" => Some(Message::Assistant {
                content: Some(content),
                tool_calls: Vec::new(),
            }),
            // "system" stored rows are intentionally ignored — see comment above.
            _ => None,
        })
        .collect();

    // Always include a baseline system prompt at index 0
    messages.insert(
        0,
        Message::System {
            content: "You are the ProjectPulse Assistant. \
                     Help the user understand and work with their project. \
                     Use the provided RAG context to ground your answers when relevant. \
                     Be concise and practical."
                .to_string(),
        },
    );

    Ok(messages)
}

/// Event yielded by the chat stream — frontend converts these to SSE.
#[derive(Debug, Clone)]
pub enum ChatStreamEvent {
    /// A text token from the assistant.
    Token(String),
    /// Stream complete; the full assistant message has been stored with `message_id`.
    Done { message_id: i32, full_content: String },
    /// Non-fatal upstream error (LLM provider, RAG, etc.) — frontend can display.
    Error(String),
}

/// Send a user message and stream the assistant response.
///
/// `project_id` is passed in (resolved + authorized by the route handler) so
/// we don't re-query the conversation here. This is both an efficiency win
/// and a hardening — the service only ever sees an authenticated project_id.
///
/// Side effects:
/// 1. Inserts the user message immediately.
/// 2. Assembles RAG context for the project.
/// 3. Streams tokens from the LLM provider.
/// 4. After the stream completes, inserts the assistant message and emits `Done`.
pub async fn send_message_stream(
    db: PgPool,
    rag: Arc<dyn RagService>,
    llm: Arc<dyn LlmProvider>,
    llm_model: String,
    project_id: i32,
    conversation_id: String,
    user_content: String,
) -> Result<Pin<Box<dyn Stream<Item = ChatStreamEvent> + Send>>, AppError> {
    // Persist the user message before streaming
    let _user_message_id = insert_message(&db, &conversation_id, "user", &user_content).await?;

    // 2. Pull conversation history
    let mut messages = build_history(&db, &conversation_id).await?;

    // 3. Best-effort RAG context (don't fail the chat if RAG is unavailable)
    let rag_context = rag
        .get_context(&user_content, project_id, RAG_TOKEN_BUDGET)
        .await
        .ok();

    if let Some(ctx) = rag_context {
        if !ctx.context.trim().is_empty() {
            // Insert RAG context after the baseline system prompt, before history
            messages.insert(
                1,
                Message::System {
                    content: format!(
                        "Relevant project context (from RAG):\n\n{}",
                        ctx.context
                    ),
                },
            );
        }
    }

    let config = LlmConfig::new("openrouter", &llm_model);
    let mut stream = llm
        .chat_stream(messages, Vec::new(), &config)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("LLM stream init failed: {}", e)))?;

    // 4. Wrap the LlmChunk stream into our ChatStreamEvent stream
    let event_stream = async_stream::stream! {
        use futures::StreamExt as _;
        let mut full = String::new();

        while let Some(chunk_result) = stream.next().await {
            match chunk_result {
                Ok(LlmChunk::Text(token)) => {
                    full.push_str(&token);
                    yield ChatStreamEvent::Token(token);
                }
                Ok(LlmChunk::Done) => break,
                Ok(_) => {} // Tool calls not used in chat
                Err(e) => {
                    yield ChatStreamEvent::Error(e.to_string());
                    return;
                }
            }
        }

        // Persist the assistant message
        match insert_message(&db, &conversation_id, "assistant", &full).await {
            Ok(message_id) => {
                yield ChatStreamEvent::Done { message_id, full_content: full };
            }
            Err(e) => {
                yield ChatStreamEvent::Error(format!("failed to store assistant message: {}", e));
            }
        }
    };

    Ok(Box::pin(event_stream))
}
