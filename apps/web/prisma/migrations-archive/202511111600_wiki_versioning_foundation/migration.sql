-- CreateEnum
CREATE TYPE "WikiEventType" AS ENUM ('VIEW', 'FEEDBACK_POSITIVE', 'FEEDBACK_NEGATIVE', 'REVISION');

-- AlterTable
ALTER TABLE "WikiPage"
  ADD COLUMN "lastEditedAt" TIMESTAMP(3),
  ADD COLUMN "lastEditedBy" TEXT,
  ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WikiRevision" (
    "id" SERIAL PRIMARY KEY,
    "wikiPageId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" VARCHAR(200),
    "content" TEXT NOT NULL,
    "diffSummary" VARCHAR(500),
    "createdBy" TEXT NOT NULL,
    "createdByType" TEXT NOT NULL DEFAULT 'agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WikiPageEvent" (
    "id" BIGSERIAL PRIMARY KEY,
    "wikiPageId" INTEGER NOT NULL,
    "type" "WikiEventType" NOT NULL,
    "actor" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WikiPageAnalytics" (
    "id" SERIAL PRIMARY KEY,
    "wikiPageId" INTEGER NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgReadTimeMs" INTEGER NOT NULL DEFAULT 0,
    "positiveVotes" INTEGER NOT NULL DEFAULT 0,
    "negativeVotes" INTEGER NOT NULL DEFAULT 0,
    "popularity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes & Constraints for WikiRevision
CREATE UNIQUE INDEX "WikiRevision_wikiPageId_version_key" ON "WikiRevision" ("wikiPageId", "version");
CREATE INDEX "WikiRevision_wikiPageId_version_idx" ON "WikiRevision" ("wikiPageId", "version");
ALTER TABLE "WikiRevision"
  ADD CONSTRAINT "WikiRevision_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes & Constraints for WikiPageEvent
CREATE INDEX "WikiPageEvent_wikiPageId_createdAt_idx" ON "WikiPageEvent" ("wikiPageId", "createdAt");
CREATE INDEX "WikiPageEvent_type_idx" ON "WikiPageEvent" ("type");
ALTER TABLE "WikiPageEvent"
  ADD CONSTRAINT "WikiPageEvent_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Constraints for WikiPageAnalytics
ALTER TABLE "WikiPageAnalytics" ADD CONSTRAINT "WikiPageAnalytics_wikiPageId_key" UNIQUE ("wikiPageId");
ALTER TABLE "WikiPageAnalytics"
  ADD CONSTRAINT "WikiPageAnalytics_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
