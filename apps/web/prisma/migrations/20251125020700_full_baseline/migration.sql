-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WikiEventType" AS ENUM ('VIEW', 'FEEDBACK_POSITIVE', 'FEEDBACK_NEGATIVE', 'REVISION');

-- CreateEnum
CREATE TYPE "ScannerType" AS ENUM ('SEMGREP', 'ESLINT', 'LIGHTHOUSE', 'AXECORE');

-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('SECURITY', 'CODE_QUALITY', 'PERFORMANCE', 'ACCESSIBILITY');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FIXED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "MemoryBankType" AS ENUM ('PROJECT_BRIEF', 'SYSTEM_PATTERNS', 'TECH_CONTEXT', 'ACTIVE_CONTEXT', 'PROGRESS');

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "roadmapId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "phaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weeks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "phaseId" TEXT NOT NULL,
    "sprintId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "days" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "weekId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "dayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoints" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "tokenUsage" INTEGER NOT NULL,
    "sessionContext" JSONB,
    "checkpointNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "theme" TEXT NOT NULL DEFAULT 'desert',
    "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repository" TEXT,
    "ownerId" TEXT NOT NULL,
    "mcpWriteFiles" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tokens" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "module" TEXT,
    "assignee" TEXT,
    "customFields" JSONB,
    "content_tsv" tsvector,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#808080',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "issueId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "issueId" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedFile" (
    "id" SERIAL NOT NULL,
    "filePath" TEXT NOT NULL,
    "lineNumber" INTEGER,
    "issueId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedCommit" (
    "id" SERIAL NOT NULL,
    "commitHash" TEXT NOT NULL,
    "commitMessage" TEXT,
    "commitDate" TIMESTAMP(3),
    "issueId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedCommit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_items" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "tags" TEXT[],
    "embedding" vector(768) NOT NULL,
    "contentTsvector" tsvector NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeLink" (
    "id" SERIAL NOT NULL,
    "knowledgeItemId" INTEGER NOT NULL,
    "issueId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_relationships" (
    "id" SERIAL NOT NULL,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,
    "relationType" VARCHAR(50) NOT NULL,
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_item_versions" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changeDescription" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_item_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_query_metrics" (
    "id" SERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "queryMode" VARCHAR(20) NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "tokenUsage" INTEGER,
    "category" VARCHAR(50),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_query_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "frameworks" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastLoadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_knowledge_links" (
    "id" SERIAL NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "knowledge_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_knowledge_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sops" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPage" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "category" TEXT,
    "parentId" INTEGER,
    "path" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "searchVector" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "views" INTEGER NOT NULL DEFAULT 0,
    "revisions" INTEGER NOT NULL DEFAULT 1,
    "contributors" JSONB NOT NULL DEFAULT '[]',
    "readingTime" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastEditedBy" TEXT,
    "lastEditedAt" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "autoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sourceFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiRevision" (
    "id" SERIAL NOT NULL,
    "wikiPageId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "diffSummary" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdByType" TEXT NOT NULL DEFAULT 'agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageLink" (
    "id" SERIAL NOT NULL,
    "sourcePageId" INTEGER NOT NULL,
    "targetPageId" INTEGER NOT NULL,
    "linkType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPageLink" (
    "id" SERIAL NOT NULL,
    "wikiPageId" INTEGER NOT NULL,
    "issueId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiPageLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPageEvent" (
    "id" BIGSERIAL NOT NULL,
    "wikiPageId" INTEGER NOT NULL,
    "type" "WikiEventType" NOT NULL,
    "actor" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiPageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPageAnalytics" (
    "id" SERIAL NOT NULL,
    "wikiPageId" INTEGER NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgReadTimeMs" INTEGER NOT NULL DEFAULT 0,
    "positiveVotes" INTEGER NOT NULL DEFAULT 0,
    "negativeVotes" INTEGER NOT NULL DEFAULT 0,
    "popularity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiPageAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityFinding" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "ruleId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "codeSnippet" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "issueId" INTEGER,
    "scanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fixedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AgentPersona" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "skills" TEXT[],
    "tools" TEXT[],
    "rules" TEXT[],
    "autoActivate" BOOLEAN NOT NULL DEFAULT false,
    "activationConditions" JSONB,
    "templateId" INTEGER,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "expertise" TEXT[],
    "personality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "activatedBy" TEXT,
    "context" JSONB,
    "duration" INTEGER,
    "toolCalls" INTEGER NOT NULL DEFAULT 0,
    "issuesCreated" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_status_options" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "colorClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_status_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_priority_options" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dotColorClass" TEXT,
    "badgeColorClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_priority_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_module_options" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_module_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_sessions" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "planningAnswers" JSONB,
    "projectContextJson" JSONB,
    "validationReport" JSONB,
    "metrics" JSONB,
    "response" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_questions" (
    "id" TEXT NOT NULL,
    "phase" INTEGER NOT NULL,
    "subsection" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "validationType" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_templates" (
    "id" SERIAL NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_prompt_templates" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sessionNumber" INTEGER,
    "phase" INTEGER,
    "batch" INTEGER,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "onboardingSessionId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "phases" JSONB NOT NULL,
    "currentPhase" TEXT,
    "currentSprint" TEXT,
    "currentWeek" TEXT,
    "currentDay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development_sessions" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plan" TEXT,
    "todos" JSONB,
    "progress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "development_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_plans" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weekId" TEXT,
    "dayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "current_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_todos" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "todos" JSONB NOT NULL,
    "weekId" TEXT,
    "dayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "current_todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "status" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "context" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_scanners" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ScannerType" NOT NULL,
    "projectId" INTEGER NOT NULL,
    "lastRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_scanners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_findings" (
    "id" SERIAL NOT NULL,
    "scannerId" INTEGER NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "ruleId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "lineNumber" INTEGER,
    "codeSnippet" TEXT,
    "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
    "falsePositive" BOOLEAN NOT NULL DEFAULT false,
    "agentAnalysis" TEXT,
    "proposedFix" TEXT,
    "issueId" INTEGER,
    "scanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fixedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_scores" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "securityScore" INTEGER NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "performanceScore" INTEGER NOT NULL,
    "accessibilityScore" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_banks" (
    "id" SERIAL NOT NULL,
    "type" "MemoryBankType" NOT NULL,
    "projectId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "summaryTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IssueToLabel" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "phases_roadmapId_idx" ON "phases"("roadmapId");

-- CreateIndex
CREATE INDEX "phases_startDate_endDate_idx" ON "phases"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "phases_status_idx" ON "phases"("status");

-- CreateIndex
CREATE INDEX "phases_startDate_endDate_status_idx" ON "phases"("startDate", "endDate", "status");

-- CreateIndex
CREATE INDEX "sprints_phaseId_idx" ON "sprints"("phaseId");

-- CreateIndex
CREATE INDEX "sprints_phaseId_startDate_idx" ON "sprints"("phaseId", "startDate");

-- CreateIndex
CREATE INDEX "sprints_startDate_endDate_idx" ON "sprints"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "sprints_status_idx" ON "sprints"("status");

-- CreateIndex
CREATE INDEX "sprints_phaseId_status_idx" ON "sprints"("phaseId", "status");

-- CreateIndex
CREATE INDEX "sprints_phaseId_startDate_endDate_status_idx" ON "sprints"("phaseId", "startDate", "endDate", "status");

-- CreateIndex
CREATE INDEX "weeks_phaseId_idx" ON "weeks"("phaseId");

-- CreateIndex
CREATE INDEX "weeks_sprintId_idx" ON "weeks"("sprintId");

-- CreateIndex
CREATE INDEX "weeks_startDate_endDate_idx" ON "weeks"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "weeks_status_idx" ON "weeks"("status");

-- CreateIndex
CREATE INDEX "weeks_phaseId_status_idx" ON "weeks"("phaseId", "status");

-- CreateIndex
CREATE INDEX "weeks_sprintId_status_idx" ON "weeks"("sprintId", "status");

-- CreateIndex
CREATE INDEX "weeks_phaseId_startDate_endDate_status_idx" ON "weeks"("phaseId", "startDate", "endDate", "status");

-- CreateIndex
CREATE INDEX "weeks_sprintId_startDate_endDate_status_idx" ON "weeks"("sprintId", "startDate", "endDate", "status");

-- CreateIndex
CREATE INDEX "days_weekId_idx" ON "days"("weekId");

-- CreateIndex
CREATE INDEX "days_startDate_endDate_idx" ON "days"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "days_status_idx" ON "days"("status");

-- CreateIndex
CREATE INDEX "days_weekId_status_idx" ON "days"("weekId", "status");

-- CreateIndex
CREATE INDEX "days_weekId_startDate_endDate_status_idx" ON "days"("weekId", "startDate", "endDate", "status");

-- CreateIndex
CREATE INDEX "tasks_dayId_idx" ON "tasks"("dayId");

-- CreateIndex
CREATE INDEX "tasks_startDate_endDate_idx" ON "tasks"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_dayId_status_idx" ON "tasks"("dayId", "status");

-- CreateIndex
CREATE INDEX "tasks_dayId_startDate_endDate_status_idx" ON "tasks"("dayId", "startDate", "endDate", "status");

-- CreateIndex
CREATE INDEX "tasks_updatedAt_idx" ON "tasks"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "sessions_taskId_idx" ON "sessions"("taskId");

-- CreateIndex
CREATE INDEX "sessions_startDate_endDate_idx" ON "sessions"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "sessions_taskId_status_idx" ON "sessions"("taskId", "status");

-- CreateIndex
CREATE INDEX "sessions_taskId_startDate_endDate_status_idx" ON "sessions"("taskId", "startDate", "endDate", "status");

-- CreateIndex
CREATE INDEX "checkpoints_sessionId_idx" ON "checkpoints"("sessionId");

-- CreateIndex
CREATE INDEX "checkpoints_createdAt_idx" ON "checkpoints"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "checkpoints_sessionId_createdAt_idx" ON "checkpoints"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "checkpoints_sessionId_checkpointNumber_key" ON "checkpoints"("sessionId", "checkpointNumber");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_preferences_userId_idx" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_preferences_theme_idx" ON "user_preferences"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "project_tokens_projectId_isRevoked_expiresAt_idx" ON "project_tokens"("projectId", "isRevoked", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "project_tokens_projectId_name_key" ON "project_tokens"("projectId", "name");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_priority_idx" ON "Issue"("priority");

-- CreateIndex
CREATE INDEX "Issue_module_idx" ON "Issue"("module");

-- CreateIndex
CREATE INDEX "Issue_projectId_idx" ON "Issue"("projectId");

-- CreateIndex
CREATE INDEX "Issue_assignee_idx" ON "Issue"("assignee");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Label_name_key" ON "Label"("name");

-- CreateIndex
CREATE INDEX "Label_name_idx" ON "Label"("name");

-- CreateIndex
CREATE INDEX "Comment_issueId_idx" ON "Comment"("issueId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Attachment_issueId_idx" ON "Attachment"("issueId");

-- CreateIndex
CREATE INDEX "LinkedFile_filePath_idx" ON "LinkedFile"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedFile_issueId_filePath_key" ON "LinkedFile"("issueId", "filePath");

-- CreateIndex
CREATE INDEX "LinkedCommit_commitHash_idx" ON "LinkedCommit"("commitHash");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedCommit_issueId_commitHash_key" ON "LinkedCommit"("issueId", "commitHash");

-- CreateIndex
CREATE INDEX "knowledge_items_projectId_idx" ON "knowledge_items"("projectId");

-- CreateIndex
CREATE INDEX "knowledge_items_projectId_category_idx" ON "knowledge_items"("projectId", "category");

-- CreateIndex
CREATE INDEX "knowledge_items_category_idx" ON "knowledge_items"("category");

-- CreateIndex
CREATE INDEX "knowledge_items_tags_idx" ON "knowledge_items" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "knowledge_items_contentTsvector_idx" ON "knowledge_items" USING GIN ("contentTsvector");

-- CreateIndex
CREATE INDEX "knowledge_items_createdAt_idx" ON "knowledge_items"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "KnowledgeLink_knowledgeItemId_idx" ON "KnowledgeLink"("knowledgeItemId");

-- CreateIndex
CREATE INDEX "KnowledgeLink_issueId_idx" ON "KnowledgeLink"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeLink_knowledgeItemId_issueId_key" ON "KnowledgeLink"("knowledgeItemId", "issueId");

-- CreateIndex
CREATE INDEX "knowledge_relationships_fromId_idx" ON "knowledge_relationships"("fromId");

-- CreateIndex
CREATE INDEX "knowledge_relationships_toId_idx" ON "knowledge_relationships"("toId");

-- CreateIndex
CREATE INDEX "knowledge_relationships_relationType_idx" ON "knowledge_relationships"("relationType");

-- CreateIndex
CREATE INDEX "knowledge_relationships_fromId_relationType_idx" ON "knowledge_relationships"("fromId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_relationships_fromId_toId_relationType_key" ON "knowledge_relationships"("fromId", "toId", "relationType");

-- CreateIndex
CREATE INDEX "knowledge_item_versions_itemId_idx" ON "knowledge_item_versions"("itemId");

-- CreateIndex
CREATE INDEX "knowledge_item_versions_itemId_version_idx" ON "knowledge_item_versions"("itemId", "version" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_item_versions_itemId_version_key" ON "knowledge_item_versions"("itemId", "version");

-- CreateIndex
CREATE INDEX "knowledge_query_metrics_queryMode_idx" ON "knowledge_query_metrics"("queryMode");

-- CreateIndex
CREATE INDEX "knowledge_query_metrics_createdAt_idx" ON "knowledge_query_metrics"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "knowledge_query_metrics_queryMode_createdAt_idx" ON "knowledge_query_metrics"("queryMode", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "knowledge_query_metrics_latencyMs_idx" ON "knowledge_query_metrics"("latencyMs");

-- CreateIndex
CREATE INDEX "skills_projectId_idx" ON "skills"("projectId");

-- CreateIndex
CREATE INDEX "skills_projectId_category_idx" ON "skills"("projectId", "category");

-- CreateIndex
CREATE INDEX "skills_projectId_usageCount_idx" ON "skills"("projectId", "usageCount" DESC);

-- CreateIndex
CREATE INDEX "skills_projectId_lastLoadedAt_idx" ON "skills"("projectId", "lastLoadedAt" DESC);

-- CreateIndex
CREATE INDEX "skills_tags_idx" ON "skills" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "skills_frameworks_idx" ON "skills" USING GIN ("frameworks");

-- CreateIndex
CREATE UNIQUE INDEX "skills_projectId_slug_key" ON "skills"("projectId", "slug");

-- CreateIndex
CREATE INDEX "skill_knowledge_links_skill_id_idx" ON "skill_knowledge_links"("skill_id");

-- CreateIndex
CREATE INDEX "skill_knowledge_links_knowledge_id_idx" ON "skill_knowledge_links"("knowledge_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_knowledge_links_skill_id_knowledge_id_key" ON "skill_knowledge_links"("skill_id", "knowledge_id");

-- CreateIndex
CREATE INDEX "sops_projectId_idx" ON "sops"("projectId");

-- CreateIndex
CREATE INDEX "sops_projectId_category_idx" ON "sops"("projectId", "category");

-- CreateIndex
CREATE INDEX "sops_tags_idx" ON "sops" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "sops_projectId_slug_key" ON "sops"("projectId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "WikiPage_path_key" ON "WikiPage"("path");

-- CreateIndex
CREATE INDEX "WikiPage_projectId_idx" ON "WikiPage"("projectId");

-- CreateIndex
CREATE INDEX "WikiPage_projectId_path_idx" ON "WikiPage"("projectId", "path");

-- CreateIndex
CREATE INDEX "WikiPage_projectId_category_idx" ON "WikiPage"("projectId", "category");

-- CreateIndex
CREATE INDEX "WikiPage_path_idx" ON "WikiPage"("path");

-- CreateIndex
CREATE INDEX "WikiPage_parentId_idx" ON "WikiPage"("parentId");

-- CreateIndex
CREATE INDEX "WikiPage_orderIndex_idx" ON "WikiPage"("orderIndex");

-- CreateIndex
CREATE INDEX "WikiPage_category_idx" ON "WikiPage"("category");

-- CreateIndex
CREATE INDEX "WikiPage_views_idx" ON "WikiPage"("views" DESC);

-- CreateIndex
CREATE INDEX "WikiPage_category_orderIndex_idx" ON "WikiPage"("category", "orderIndex");

-- CreateIndex
CREATE INDEX "WikiPage_autoGenerated_idx" ON "WikiPage"("autoGenerated");

-- CreateIndex
CREATE INDEX "WikiPage_category_id_idx" ON "WikiPage"("category", "id");

-- CreateIndex
CREATE INDEX "WikiRevision_wikiPageId_version_idx" ON "WikiRevision"("wikiPageId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WikiRevision_wikiPageId_version_key" ON "WikiRevision"("wikiPageId", "version");

-- CreateIndex
CREATE INDEX "PageLink_sourcePageId_idx" ON "PageLink"("sourcePageId");

-- CreateIndex
CREATE INDEX "PageLink_targetPageId_idx" ON "PageLink"("targetPageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageLink_sourcePageId_targetPageId_key" ON "PageLink"("sourcePageId", "targetPageId");

-- CreateIndex
CREATE INDEX "WikiPageLink_wikiPageId_idx" ON "WikiPageLink"("wikiPageId");

-- CreateIndex
CREATE INDEX "WikiPageLink_issueId_idx" ON "WikiPageLink"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "WikiPageLink_wikiPageId_issueId_key" ON "WikiPageLink"("wikiPageId", "issueId");

-- CreateIndex
CREATE INDEX "WikiPageEvent_wikiPageId_createdAt_idx" ON "WikiPageEvent"("wikiPageId", "createdAt");

-- CreateIndex
CREATE INDEX "WikiPageEvent_type_idx" ON "WikiPageEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "WikiPageAnalytics_wikiPageId_key" ON "WikiPageAnalytics"("wikiPageId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityFinding_issueId_key" ON "SecurityFinding"("issueId");

-- CreateIndex
CREATE INDEX "SecurityFinding_projectId_idx" ON "SecurityFinding"("projectId");

-- CreateIndex
CREATE INDEX "SecurityFinding_projectId_status_idx" ON "SecurityFinding"("projectId", "status");

-- CreateIndex
CREATE INDEX "SecurityFinding_projectId_severity_idx" ON "SecurityFinding"("projectId", "severity");

-- CreateIndex
CREATE INDEX "SecurityFinding_ruleId_idx" ON "SecurityFinding"("ruleId");

-- CreateIndex
CREATE INDEX "SecurityFinding_severity_idx" ON "SecurityFinding"("severity");

-- CreateIndex
CREATE INDEX "SecurityFinding_status_idx" ON "SecurityFinding"("status");

-- CreateIndex
CREATE INDEX "SecurityFinding_filePath_idx" ON "SecurityFinding"("filePath");

-- CreateIndex
CREATE INDEX "SecurityFinding_scanDate_idx" ON "SecurityFinding"("scanDate" DESC);

-- CreateIndex
CREATE INDEX "Setting_category_idx" ON "Setting"("category");

-- CreateIndex
CREATE INDEX "AgentPersona_projectId_idx" ON "AgentPersona"("projectId");

-- CreateIndex
CREATE INDEX "AgentPersona_projectId_isActive_idx" ON "AgentPersona"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "AgentPersona_slug_idx" ON "AgentPersona"("slug");

-- CreateIndex
CREATE INDEX "AgentPersona_isBuiltIn_idx" ON "AgentPersona"("isBuiltIn");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPersona_projectId_name_key" ON "AgentPersona"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPersona_projectId_slug_key" ON "AgentPersona"("projectId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_name_key" ON "PromptTemplate"("name");

-- CreateIndex
CREATE INDEX "PromptTemplate_category_idx" ON "PromptTemplate"("category");

-- CreateIndex
CREATE INDEX "AgentSession_personaId_idx" ON "AgentSession"("personaId");

-- CreateIndex
CREATE INDEX "AgentSession_startedAt_idx" ON "AgentSession"("startedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "issue_status_options_value_key" ON "issue_status_options"("value");

-- CreateIndex
CREATE INDEX "issue_status_options_value_idx" ON "issue_status_options"("value");

-- CreateIndex
CREATE INDEX "issue_status_options_order_idx" ON "issue_status_options"("order");

-- CreateIndex
CREATE UNIQUE INDEX "issue_priority_options_value_key" ON "issue_priority_options"("value");

-- CreateIndex
CREATE INDEX "issue_priority_options_value_idx" ON "issue_priority_options"("value");

-- CreateIndex
CREATE INDEX "issue_priority_options_order_idx" ON "issue_priority_options"("order");

-- CreateIndex
CREATE UNIQUE INDEX "issue_module_options_value_key" ON "issue_module_options"("value");

-- CreateIndex
CREATE INDEX "issue_module_options_value_idx" ON "issue_module_options"("value");

-- CreateIndex
CREATE INDEX "issue_module_options_order_idx" ON "issue_module_options"("order");

-- CreateIndex
CREATE INDEX "onboarding_sessions_projectId_idx" ON "onboarding_sessions"("projectId");

-- CreateIndex
CREATE INDEX "onboarding_sessions_projectId_status_idx" ON "onboarding_sessions"("projectId", "status");

-- CreateIndex
CREATE INDEX "onboarding_sessions_userId_idx" ON "onboarding_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_sessions_projectId_sessionNumber_key" ON "onboarding_sessions"("projectId", "sessionNumber");

-- CreateIndex
CREATE INDEX "onboarding_questions_phase_idx" ON "onboarding_questions"("phase");

-- CreateIndex
CREATE INDEX "onboarding_questions_phase_subsection_idx" ON "onboarding_questions"("phase", "subsection");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_questions_phase_subsection_questionNumber_key" ON "onboarding_questions"("phase", "subsection", "questionNumber");

-- CreateIndex
CREATE INDEX "onboarding_templates_sessionNumber_idx" ON "onboarding_templates"("sessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_templates_sessionNumber_isActive_key" ON "onboarding_templates"("sessionNumber", "isActive");

-- CreateIndex
CREATE INDEX "onboarding_prompt_templates_category_idx" ON "onboarding_prompt_templates"("category");

-- CreateIndex
CREATE INDEX "onboarding_prompt_templates_sessionNumber_idx" ON "onboarding_prompt_templates"("sessionNumber");

-- CreateIndex
CREATE INDEX "onboarding_prompt_templates_projectId_category_idx" ON "onboarding_prompt_templates"("projectId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_prompt_templates_name_isActive_key" ON "onboarding_prompt_templates"("name", "isActive");

-- CreateIndex
CREATE INDEX "documents_onboardingSessionId_idx" ON "documents"("onboardingSessionId");

-- CreateIndex
CREATE INDEX "documents_filename_idx" ON "documents"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "documents_onboardingSessionId_filename_key" ON "documents"("onboardingSessionId", "filename");

-- CreateIndex
CREATE UNIQUE INDEX "roadmaps_projectId_key" ON "roadmaps"("projectId");

-- CreateIndex
CREATE INDEX "development_sessions_projectId_status_idx" ON "development_sessions"("projectId", "status");

-- CreateIndex
CREATE INDEX "development_sessions_projectId_createdAt_idx" ON "development_sessions"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "current_plans_projectId_key" ON "current_plans"("projectId");

-- CreateIndex
CREATE INDEX "current_plans_projectId_idx" ON "current_plans"("projectId");

-- CreateIndex
CREATE INDEX "current_plans_weekId_dayId_idx" ON "current_plans"("weekId", "dayId");

-- CreateIndex
CREATE UNIQUE INDEX "current_todos_projectId_key" ON "current_todos"("projectId");

-- CreateIndex
CREATE INDEX "current_todos_projectId_idx" ON "current_todos"("projectId");

-- CreateIndex
CREATE INDEX "current_todos_weekId_dayId_idx" ON "current_todos"("weekId", "dayId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_projectId_idx" ON "WorkflowTemplate"("projectId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_projectId_category_idx" ON "WorkflowTemplate"("projectId", "category");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_projectId_isActive_idx" ON "WorkflowTemplate"("projectId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_projectId_name_key" ON "WorkflowTemplate"("projectId", "name");

-- CreateIndex
CREATE INDEX "WorkflowRun_templateId_status_idx" ON "WorkflowRun"("templateId", "status");

-- CreateIndex
CREATE INDEX "WorkflowRun_projectId_status_idx" ON "WorkflowRun"("projectId", "status");

-- CreateIndex
CREATE INDEX "WorkflowStep_runId_status_idx" ON "WorkflowStep"("runId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_runId_stepNumber_key" ON "WorkflowStep"("runId", "stepNumber");

-- CreateIndex
CREATE INDEX "health_scanners_projectId_idx" ON "health_scanners"("projectId");

-- CreateIndex
CREATE INDEX "health_scanners_type_idx" ON "health_scanners"("type");

-- CreateIndex
CREATE INDEX "health_scanners_lastRun_idx" ON "health_scanners"("lastRun");

-- CreateIndex
CREATE UNIQUE INDEX "health_scanners_projectId_type_key" ON "health_scanners"("projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "health_findings_issueId_key" ON "health_findings"("issueId");

-- CreateIndex
CREATE INDEX "health_findings_scannerId_idx" ON "health_findings"("scannerId");

-- CreateIndex
CREATE INDEX "health_findings_scannerId_category_idx" ON "health_findings"("scannerId", "category");

-- CreateIndex
CREATE INDEX "health_findings_scannerId_severity_idx" ON "health_findings"("scannerId", "severity");

-- CreateIndex
CREATE INDEX "health_findings_scannerId_status_idx" ON "health_findings"("scannerId", "status");

-- CreateIndex
CREATE INDEX "health_findings_scannerId_falsePositive_idx" ON "health_findings"("scannerId", "falsePositive");

-- CreateIndex
CREATE INDEX "health_findings_scannerId_scanDate_idx" ON "health_findings"("scannerId", "scanDate" DESC);

-- CreateIndex
CREATE INDEX "health_findings_scannerId_filePath_status_idx" ON "health_findings"("scannerId", "filePath", "status");

-- CreateIndex
CREATE INDEX "health_findings_scannerId_ruleId_falsePositive_idx" ON "health_findings"("scannerId", "ruleId", "falsePositive");

-- CreateIndex
CREATE INDEX "health_scores_projectId_idx" ON "health_scores"("projectId");

-- CreateIndex
CREATE INDEX "health_scores_projectId_calculatedAt_idx" ON "health_scores"("projectId", "calculatedAt");

-- CreateIndex
CREATE INDEX "health_scores_calculatedAt_idx" ON "health_scores"("calculatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_sessionToken_key" ON "auth_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "memory_banks_projectId_idx" ON "memory_banks"("projectId");

-- CreateIndex
CREATE INDEX "memory_banks_type_idx" ON "memory_banks"("type");

-- CreateIndex
CREATE UNIQUE INDEX "memory_banks_projectId_type_key" ON "memory_banks"("projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "_IssueToLabel_AB_unique" ON "_IssueToLabel"("A", "B");

-- CreateIndex
CREATE INDEX "_IssueToLabel_B_index" ON "_IssueToLabel"("B");

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "days" ADD CONSTRAINT "days_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tokens" ADD CONSTRAINT "project_tokens_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedFile" ADD CONSTRAINT "LinkedFile_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedCommit" ADD CONSTRAINT "LinkedCommit_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeLink" ADD CONSTRAINT "KnowledgeLink_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeLink" ADD CONSTRAINT "KnowledgeLink_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_toId_fkey" FOREIGN KEY ("toId") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_item_versions" ADD CONSTRAINT "knowledge_item_versions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_knowledge_links" ADD CONSTRAINT "skill_knowledge_links_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_knowledge_links" ADD CONSTRAINT "skill_knowledge_links_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiRevision" ADD CONSTRAINT "WikiRevision_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageLink" ADD CONSTRAINT "PageLink_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageLink" ADD CONSTRAINT "PageLink_targetPageId_fkey" FOREIGN KEY ("targetPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageLink" ADD CONSTRAINT "WikiPageLink_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageLink" ADD CONSTRAINT "WikiPageLink_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageEvent" ADD CONSTRAINT "WikiPageEvent_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageAnalytics" ADD CONSTRAINT "WikiPageAnalytics_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityFinding" ADD CONSTRAINT "SecurityFinding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityFinding" ADD CONSTRAINT "SecurityFinding_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPersona" ADD CONSTRAINT "AgentPersona_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPersona" ADD CONSTRAINT "AgentPersona_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "AgentPersona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_prompt_templates" ADD CONSTRAINT "onboarding_prompt_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_onboardingSessionId_fkey" FOREIGN KEY ("onboardingSessionId") REFERENCES "onboarding_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_sessions" ADD CONSTRAINT "development_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "current_plans" ADD CONSTRAINT "current_plans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "current_plans" ADD CONSTRAINT "current_plans_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "current_plans" ADD CONSTRAINT "current_plans_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "current_todos" ADD CONSTRAINT "current_todos_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "current_todos" ADD CONSTRAINT "current_todos_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "current_todos" ADD CONSTRAINT "current_todos_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_scanners" ADD CONSTRAINT "health_scanners_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_findings" ADD CONSTRAINT "health_findings_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "health_scanners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_findings" ADD CONSTRAINT "health_findings_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_scores" ADD CONSTRAINT "health_scores_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_banks" ADD CONSTRAINT "memory_banks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueToLabel" ADD CONSTRAINT "_IssueToLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueToLabel" ADD CONSTRAINT "_IssueToLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

