-- Sprint 10: Add tool-level permissions to ProjectToken
-- blockedTools: Array of tool names this token is NOT allowed to execute
-- allowedTools: If non-empty, ONLY these tools can be executed (whitelist mode)

-- AlterTable
ALTER TABLE "project_tokens" ADD COLUMN "blockedTools" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "project_tokens" ADD COLUMN "allowedTools" TEXT[] DEFAULT ARRAY[]::TEXT[];
