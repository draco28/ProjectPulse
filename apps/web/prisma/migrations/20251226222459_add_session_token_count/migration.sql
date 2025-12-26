-- Add tokenCount field to AgentSession (Sprint 15: Phase F)
-- This tracks total tokens used in each agent work session
ALTER TABLE "agent_sessions" ADD COLUMN "tokenCount" INTEGER;
