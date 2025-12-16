# CodeGuard Database Schema

## New Prisma Models

Add these models to `apps/web/prisma/schema.prisma`:

```prisma
// ============================================================================
// CODEGUARD MODELS
// ============================================================================

// Code scan session
model CodeScan {
  id            String      @id @default(cuid())
  projectId     Int
  project       Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Scan configuration
  rootPath      String?     // Specific directory if not entire project
  fileTypes     String[]    // e.g., ['ts', 'tsx', 'js']
  excludePatterns String[]  // e.g., ['node_modules', 'dist']

  // Status
  status        ScanStatus  @default(PENDING)
  progress      Int         @default(0) // 0-100
  startedAt     DateTime?
  completedAt   DateTime?
  errorMessage  String?

  // Metrics
  filesScanned  Int         @default(0)
  totalLines    Int         @default(0)
  totalBytes    Int         @default(0)

  // Relations
  issues        CodeIssue[]
  files         ScannedFile[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([projectId, status])
  @@index([createdAt])
}

enum ScanStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

// Individual scanned file
model ScannedFile {
  id            String      @id @default(cuid())
  scanId        String
  scan          CodeScan    @relation(fields: [scanId], references: [id], onDelete: Cascade)

  filePath      String
  language      String      // e.g., 'typescript', 'javascript'
  lines         Int
  bytes         Int

  // Metrics
  complexity    Json?       // { cyclomatic, cognitive, maintainability }

  // Cached AST/symbols (optional, for performance)
  symbolsJson   Json?       // Parsed symbols cache

  createdAt     DateTime    @default(now())

  @@unique([scanId, filePath])
  @@index([scanId])
  @@index([filePath])
}

// Code issue (bug, security issue, etc.)
model CodeIssue {
  id            String        @id @default(cuid())
  scanId        String
  scan          CodeScan      @relation(fields: [scanId], references: [id], onDelete: Cascade)

  // Location
  filePath      String
  lineNumber    Int
  endLine       Int?
  columnNumber  Int?
  endColumn     Int?

  // Classification
  category      IssueCategory
  severity      IssueSeverity
  detectionType DetectionType

  // Content
  title         String
  description   String        @db.Text
  codeSnippet   String?       @db.Text
  suggestedFix  String?       @db.Text

  // Metadata
  ruleId        String?       // For pattern-based issues
  confidence    Float         @default(1.0) // 0-1 for LLM-detected

  // Status
  status        IssueStatus   @default(OPEN)
  resolution    String?       // How it was resolved
  resolvedAt    DateTime?

  // Link to ProjectPulse ticket (auto-created)
  ticketId      Int?
  ticket        Ticket?       @relation(fields: [ticketId], references: [id])

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([scanId, status])
  @@index([scanId, severity])
  @@index([filePath])
  @@index([ticketId])
}

enum IssueCategory {
  BUG
  SECURITY
  PERFORMANCE
  STYLE
  ASYNC
  TYPE_SAFETY
  NULL_SAFETY
  DEAD_CODE
  COMPLEXITY
}

enum IssueSeverity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  INFO
}

enum DetectionType {
  PATTERN      // Rule-based (deterministic)
  SEMANTIC     // LLM-detected (agent's reasoning)
}

enum IssueStatus {
  OPEN
  FIXED
  WONTFIX
  FALSE_POSITIVE
  DUPLICATE
}

// Pattern rules configuration
model PatternRule {
  id            String        @id @default(cuid())

  // Identification
  ruleId        String        @unique // e.g., 'security/hardcoded-secret'
  name          String
  description   String        @db.Text

  // Classification
  category      IssueCategory
  severity      IssueSeverity

  // Rule definition
  pattern       String        @db.Text // Regex or AST pattern
  patternType   PatternType
  languages     String[]      // e.g., ['typescript', 'javascript']

  // Fix template
  fixTemplate   String?       @db.Text

  // Status
  enabled       Boolean       @default(true)
  builtIn       Boolean       @default(true) // vs custom

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([category])
  @@index([enabled])
}

enum PatternType {
  REGEX         // Simple regex pattern
  AST           // AST-based pattern
  SEMANTIC      // Semantic pattern (complex)
}

// Code embeddings for semantic search
model CodeEmbedding {
  id          String    @id @default(cuid())
  projectId   Int
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Location
  filePath    String
  lineStart   Int
  lineEnd     Int

  // Content fingerprint
  codeHash    String    // SHA256 of code content

  // Embedding vector (Ollama)
  embedding   Unsupported("vector(384)")

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([projectId, filePath, lineStart, lineEnd])
  @@index([projectId])
  @@index([codeHash])
}
```

## Update Existing Models

### Project Model

Add relation to CodeScan:

```prisma
model Project {
  // ... existing fields ...

  // CodeGuard relations
  codeScans     CodeScan[]
  codeEmbeddings CodeEmbedding[]
}
```

### Ticket Model

Add relation to CodeIssue:

```prisma
model Ticket {
  // ... existing fields ...

  // CodeGuard relation
  codeIssues    CodeIssue[]
}
```

## Migration Strategy

### Phase 1: Core Tables

```sql
-- Migration: add_codeguard_core

-- Create enums
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "IssueCategory" AS ENUM ('BUG', 'SECURITY', 'PERFORMANCE', 'STYLE', 'ASYNC', 'TYPE_SAFETY', 'NULL_SAFETY', 'DEAD_CODE', 'COMPLEXITY');
CREATE TYPE "IssueSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');
CREATE TYPE "DetectionType" AS ENUM ('PATTERN', 'SEMANTIC');
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'FIXED', 'WONTFIX', 'FALSE_POSITIVE', 'DUPLICATE');
CREATE TYPE "PatternType" AS ENUM ('REGEX', 'AST', 'SEMANTIC');

-- Create CodeScan table
CREATE TABLE "CodeScan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "rootPath" TEXT,
  "fileTypes" TEXT[],
  "excludePatterns" TEXT[],
  "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "filesScanned" INTEGER NOT NULL DEFAULT 0,
  "totalLines" INTEGER NOT NULL DEFAULT 0,
  "totalBytes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "CodeScan_projectId_status_idx" ON "CodeScan"("projectId", "status");
CREATE INDEX "CodeScan_createdAt_idx" ON "CodeScan"("createdAt");

-- Create ScannedFile table
CREATE TABLE "ScannedFile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "scanId" TEXT NOT NULL REFERENCES "CodeScan"("id") ON DELETE CASCADE,
  "filePath" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "lines" INTEGER NOT NULL,
  "bytes" INTEGER NOT NULL,
  "complexity" JSONB,
  "symbolsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "ScannedFile_scanId_filePath_key" ON "ScannedFile"("scanId", "filePath");
CREATE INDEX "ScannedFile_scanId_idx" ON "ScannedFile"("scanId");
CREATE INDEX "ScannedFile_filePath_idx" ON "ScannedFile"("filePath");

-- Create CodeIssue table
CREATE TABLE "CodeIssue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "scanId" TEXT NOT NULL REFERENCES "CodeScan"("id") ON DELETE CASCADE,
  "filePath" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "endLine" INTEGER,
  "columnNumber" INTEGER,
  "endColumn" INTEGER,
  "category" "IssueCategory" NOT NULL,
  "severity" "IssueSeverity" NOT NULL,
  "detectionType" "DetectionType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "codeSnippet" TEXT,
  "suggestedFix" TEXT,
  "ruleId" TEXT,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "ticketId" INTEGER REFERENCES "Ticket"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "CodeIssue_scanId_status_idx" ON "CodeIssue"("scanId", "status");
CREATE INDEX "CodeIssue_scanId_severity_idx" ON "CodeIssue"("scanId", "severity");
CREATE INDEX "CodeIssue_filePath_idx" ON "CodeIssue"("filePath");
CREATE INDEX "CodeIssue_ticketId_idx" ON "CodeIssue"("ticketId");
```

### Phase 2: Pattern Rules

```sql
-- Migration: add_pattern_rules

CREATE TABLE "PatternRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ruleId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "IssueCategory" NOT NULL,
  "severity" "IssueSeverity" NOT NULL,
  "pattern" TEXT NOT NULL,
  "patternType" "PatternType" NOT NULL,
  "languages" TEXT[],
  "fixTemplate" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "builtIn" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "PatternRule_category_idx" ON "PatternRule"("category");
CREATE INDEX "PatternRule_enabled_idx" ON "PatternRule"("enabled");
```

### Phase 3: Code Embeddings

```sql
-- Migration: add_code_embeddings

-- Enable pgvector extension (if not already)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "CodeEmbedding" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "filePath" TEXT NOT NULL,
  "lineStart" INTEGER NOT NULL,
  "lineEnd" INTEGER NOT NULL,
  "codeHash" TEXT NOT NULL,
  "embedding" vector(384) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "CodeEmbedding_projectId_filePath_lineStart_lineEnd_key"
  ON "CodeEmbedding"("projectId", "filePath", "lineStart", "lineEnd");
CREATE INDEX "CodeEmbedding_projectId_idx" ON "CodeEmbedding"("projectId");
CREATE INDEX "CodeEmbedding_codeHash_idx" ON "CodeEmbedding"("codeHash");

-- Create HNSW index for fast similarity search
CREATE INDEX "CodeEmbedding_embedding_idx" ON "CodeEmbedding"
  USING hnsw ("embedding" vector_cosine_ops);
```

## Seed Data: Built-in Pattern Rules

```typescript
// prisma/seeds/codeguard-patterns.ts

export const builtInPatternRules = [
  // Security
  {
    ruleId: 'security/hardcoded-secret',
    name: 'Hardcoded Secret',
    description: 'Detects hardcoded API keys, passwords, and tokens',
    category: 'SECURITY',
    severity: 'CRITICAL',
    pattern: '(api[_-]?key|password|secret|token)\\s*[:=]\\s*["\'][^"\']{8,}["\']',
    patternType: 'REGEX',
    languages: ['typescript', 'javascript'],
    fixTemplate: 'Move to environment variable: process.env.${VARIABLE_NAME}'
  },
  {
    ruleId: 'security/sql-injection',
    name: 'Potential SQL Injection',
    description: 'Detects string concatenation in SQL queries',
    category: 'SECURITY',
    severity: 'CRITICAL',
    pattern: '(query|execute)\\s*\\([^)]*\\+|\\$\\{[^}]+\\}[^)]*\\)',
    patternType: 'REGEX',
    languages: ['typescript', 'javascript'],
    fixTemplate: 'Use parameterized queries instead of string concatenation'
  },

  // Async
  {
    ruleId: 'async/unhandled-promise',
    name: 'Unhandled Promise',
    description: 'Promise without .catch() or try/catch',
    category: 'ASYNC',
    severity: 'HIGH',
    pattern: 'new Promise\\([^)]+\\)(?!\\s*\\.catch)',
    patternType: 'REGEX',
    languages: ['typescript', 'javascript'],
    fixTemplate: 'Add .catch() handler or wrap in try/catch'
  },
  {
    ruleId: 'async/missing-await',
    name: 'Missing Await',
    description: 'Async function call without await',
    category: 'ASYNC',
    severity: 'HIGH',
    pattern: '(?<!await\\s)\\w+Async\\s*\\(',
    patternType: 'REGEX',
    languages: ['typescript', 'javascript'],
    fixTemplate: 'Add await before async function call'
  },

  // Null Safety
  {
    ruleId: 'null/optional-chaining',
    name: 'Optional Chaining Opportunity',
    description: 'Could use optional chaining (?.) instead of && chain',
    category: 'NULL_SAFETY',
    severity: 'LOW',
    pattern: '\\w+\\s*&&\\s*\\w+\\.\\w+',
    patternType: 'REGEX',
    languages: ['typescript', 'javascript'],
    fixTemplate: 'Replace with optional chaining: obj?.property'
  },

  // Style
  {
    ruleId: 'style/console-log',
    name: 'Console Log Statement',
    description: 'console.log should be removed in production',
    category: 'STYLE',
    severity: 'LOW',
    pattern: 'console\\.(log|debug|info)\\s*\\(',
    patternType: 'REGEX',
    languages: ['typescript', 'javascript'],
    fixTemplate: 'Remove console statement or use proper logging'
  },
  {
    ruleId: 'style/unused-variable',
    name: 'Unused Variable',
    description: 'Variable declared but never used',
    category: 'DEAD_CODE',
    severity: 'LOW',
    pattern: null, // AST-based, handled differently
    patternType: 'AST',
    languages: ['typescript', 'javascript'],
    fixTemplate: 'Remove unused variable or prefix with _'
  }
];
```

## Query Examples

### Get Issues by Severity

```typescript
const criticalIssues = await prisma.codeIssue.findMany({
  where: {
    scan: { projectId: projectId },
    severity: 'CRITICAL',
    status: 'OPEN'
  },
  include: {
    ticket: true
  },
  orderBy: { createdAt: 'desc' }
});
```

### Get Scan Summary

```typescript
const summary = await prisma.codeIssue.groupBy({
  by: ['severity', 'category'],
  where: { scanId: scanId },
  _count: true
});
```

### Find Similar Code

```typescript
const similarCode = await prisma.$queryRaw`
  SELECT
    id, "filePath", "lineStart", "lineEnd",
    1 - (embedding <=> ${targetEmbedding}::vector) as similarity
  FROM "CodeEmbedding"
  WHERE "projectId" = ${projectId}
  ORDER BY embedding <=> ${targetEmbedding}::vector
  LIMIT 10
`;
```
