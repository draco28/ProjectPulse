-- Sprint 16: Add session linkage for agent workflow automation
-- Ticket can be linked to an AgentSession that claimed it (todo → in-progress)

-- AlterTable: Add linked_session_id column to tickets
ALTER TABLE "tickets" ADD COLUMN "linked_session_id" TEXT;

-- CreateIndex: Index for finding tickets by session
CREATE INDEX "tickets_linked_session_id_idx" ON "tickets"("linked_session_id");

-- AddForeignKey: Link to agent_sessions with SetNull on delete
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_linked_session_id_fkey"
  FOREIGN KEY ("linked_session_id")
  REFERENCES "agent_sessions"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
