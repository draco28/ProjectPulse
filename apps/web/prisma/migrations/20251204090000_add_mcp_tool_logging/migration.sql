-- Sprint 11.5: MCP Tool Logging for Admin Dashboard
-- This migration adds tables for tracking MCP tool invocations

-- CreateTable: Individual tool call records (high volume, 30-day retention)
CREATE TABLE "mcp_tool_logs" (
    "id" BIGSERIAL NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "toolName" VARCHAR(100) NOT NULL,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_tool_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Daily aggregated statistics (permanent retention)
CREATE TABLE "mcp_tool_aggregates" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "projectId" INTEGER NOT NULL,
    "toolName" VARCHAR(100) NOT NULL,
    "callCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" INTEGER NOT NULL DEFAULT 0,
    "minDuration" INTEGER NOT NULL DEFAULT 0,
    "maxDuration" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mcp_tool_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: mcp_tool_logs indexes for efficient querying
CREATE INDEX "mcp_tool_logs_tokenId_idx" ON "mcp_tool_logs"("tokenId");
CREATE INDEX "mcp_tool_logs_projectId_idx" ON "mcp_tool_logs"("projectId");
CREATE INDEX "mcp_tool_logs_toolName_idx" ON "mcp_tool_logs"("toolName");
CREATE INDEX "mcp_tool_logs_createdAt_idx" ON "mcp_tool_logs"("createdAt" DESC);
CREATE INDEX "mcp_tool_logs_success_idx" ON "mcp_tool_logs"("success");
CREATE INDEX "mcp_tool_logs_projectId_createdAt_idx" ON "mcp_tool_logs"("projectId", "createdAt");

-- CreateIndex: mcp_tool_aggregates indexes
CREATE INDEX "mcp_tool_aggregates_date_idx" ON "mcp_tool_aggregates"("date" DESC);
CREATE INDEX "mcp_tool_aggregates_projectId_idx" ON "mcp_tool_aggregates"("projectId");
CREATE UNIQUE INDEX "mcp_tool_aggregates_date_projectId_toolName_key" ON "mcp_tool_aggregates"("date", "projectId", "toolName");

-- AddForeignKey: Link to ProjectToken
ALTER TABLE "mcp_tool_logs" ADD CONSTRAINT "mcp_tool_logs_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "project_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link to Project
ALTER TABLE "mcp_tool_logs" ADD CONSTRAINT "mcp_tool_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link aggregates to Project
ALTER TABLE "mcp_tool_aggregates" ADD CONSTRAINT "mcp_tool_aggregates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
