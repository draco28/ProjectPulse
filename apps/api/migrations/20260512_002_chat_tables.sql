-- Sprint 9: AI Chat tables (Phase 4 deliverable, deferred from Sprint 8 spec)
--
-- Stores chat conversations and messages for the desktop AI chat interface.
-- Conversations are scoped to projects; messages cascade-delete with the
-- conversation, conversations cascade-delete with the project.

CREATE TABLE IF NOT EXISTS chat_conversations (
    id          TEXT PRIMARY KEY,
    "projectId" INTEGER NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    title       TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_project
    ON chat_conversations ("projectId", "updatedAt" DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
    id               SERIAL PRIMARY KEY,
    "conversationId" TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content          TEXT NOT NULL,
    "tokenCount"     INTEGER,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
    ON chat_messages ("conversationId", "createdAt" ASC);
