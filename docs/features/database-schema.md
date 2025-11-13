# Database Schema Reference

**Last Updated**: 2025-10-28
**Database**: PostgreSQL 16
**Prisma Version**: 5.x
**Source**: `apps/web/prisma/schema.prisma`
**Status**: Full schema implemented (Phase 3 Day 4 complete)

---

## Quick Index

### Core Entities

- [UserPreferences](#userpreferences) - User theme and UI preferences
- [Project](#project) - Project management
- [Issue](#issue) - Issue tracking with full-text search
- [Label](#label) - Issue labels/tags
- [Comment](#comment) - Issue comments
- [Attachment](#attachment) - File uploads
- [LinkedFile](#linkedfile) - Code file references
- [LinkedCommit](#linkedcommit) - Git commit links

### Knowledge Base

- [KnowledgeItem](#knowledgeitem) - Knowledge base articles
- [KnowledgeLink](#knowledgelink) - Issue-Knowledge relationships

### Documentation Wiki

- [WikiPage](#wikipage) - Wiki documentation pages
- [PageLink](#pagelink) - Wiki page relationships
- [WikiPageLink](#wikipagelink) - Issue-Wiki relationships

### Security

- [SecurityFinding](#securityfinding) - Security scan results

### System

- [Setting](#setting) - System configuration
- [AgentPersona](#agentpersona) - MCP agent personas
- [PromptTemplate](#prompttemplate) - Agent prompt templates
- [AgentSession](#agentsession) - Agent session tracking

---

## Models

### UserPreferences

**Table**: `user_preferences`
**Purpose**: User theme and UI preferences

| Field            | Type     | Constraints         | Default  | Description                               |
| ---------------- | -------- | ------------------- | -------- | ----------------------------------------- |
| id               | Int      | @id, auto-increment | -        | Primary key                               |
| userId           | Int?     | @unique, nullable   | -        | Foreign key to User (when auth added)     |
| theme            | String   | -                   | "desert" | Theme selection: desert/neon/earthy/coral |
| sidebarCollapsed | Boolean  | -                   | false    | Sidebar state preference                  |
| compactMode      | Boolean  | -                   | false    | Compact UI mode                           |
| createdAt        | DateTime | -                   | now()    | Record creation                           |
| updatedAt        | DateTime | @updatedAt          | -        | Last update                               |

**Indexes**:

- @@index([userId])
- @@index([theme])

---

### Project

**Table**: `projects` (implied)
**Purpose**: Project organization

| Field       | Type     | Constraints         | Default | Description         |
| ----------- | -------- | ------------------- | ------- | ------------------- |
| id          | Int      | @id, auto-increment | -       | Primary key         |
| name        | String   | @unique             | -       | Project name        |
| description | String?  | @db.Text            | -       | Project description |
| repository  | String?  | -                   | -       | Git repository URL  |
| createdAt   | DateTime | -                   | now()   | Creation timestamp  |
| updatedAt   | DateTime | @updatedAt          | -       | Last update         |

**Relations**:

- Has many Issue

**Indexes**:

- @@index([name])

---

### Issue

**Table**: `issues` (implied)
**Purpose**: Issue tracking with full-text search

| Field        | Type      | Constraints         | Default  | Description                        |
| ------------ | --------- | ------------------- | -------- | ---------------------------------- |
| id           | Int       | @id, auto-increment | -        | Primary key                        |
| title        | String    | -                   | -        | Issue title                        |
| description  | String?   | @db.Text            | -        | Issue description                  |
| status       | String    | -                   | "open"   | Status: open/in_progress/closed    |
| priority     | String    | -                   | "medium" | Priority: critical/high/medium/low |
| module       | String?   | -                   | -        | Module/component name              |
| assignee     | String?   | -                   | -        | Assigned user                      |
| customFields | Json?     | @db.JsonB           | -        | Flexible custom fields             |
| searchVector | String?   | @db.Text            | -        | Full-text search vector (tsvector) |
| projectId    | Int       | -                   | -        | Parent project                     |
| createdAt    | DateTime  | -                   | now()    | Creation timestamp                 |
| updatedAt    | DateTime  | @updatedAt          | -        | Last update                        |
| closedAt     | DateTime? | -                   | -        | Closure timestamp                  |

**Relations**:

- Belongs to Project
- Has many Label (many-to-many)
- Has many Comment
- Has many Attachment
- Has many LinkedFile
- Has many LinkedCommit
- Has many KnowledgeLink
- Has many WikiPageLink
- Has one SecurityFinding (optional)

**Indexes**:

- @@index([status])
- @@index([priority])
- @@index([module])
- @@index([projectId])
- @@index([assignee])
- @@index([createdAt(sort: Desc)])

**Features**:

- Full-text search on title/description via searchVector
- JSONB custom fields for flexibility
- Cascade delete from Project

---

### Label

**Table**: `labels` (implied)
**Purpose**: Issue categorization tags

| Field     | Type     | Constraints         | Default   | Description        |
| --------- | -------- | ------------------- | --------- | ------------------ |
| id        | Int      | @id, auto-increment | -         | Primary key        |
| name      | String   | @unique             | -         | Label name         |
| color     | String   | -                   | "#808080" | Hex color code     |
| createdAt | DateTime | -                   | now()     | Creation timestamp |

**Relations**:

- Has many Issue (many-to-many)

**Indexes**:

- @@index([name])

---

### Comment

**Table**: `comments` (implied)
**Purpose**: Issue comments

| Field     | Type     | Constraints         | Default | Description                |
| --------- | -------- | ------------------- | ------- | -------------------------- |
| id        | Int      | @id, auto-increment | -       | Primary key                |
| content   | String   | @db.Text            | -       | Comment content (markdown) |
| author    | String?  | -                   | -       | Comment author             |
| issueId   | Int      | -                   | -       | Parent issue               |
| createdAt | DateTime | -                   | now()   | Creation timestamp         |
| updatedAt | DateTime | @updatedAt          | -       | Last edit timestamp        |

**Relations**:

- Belongs to Issue (cascade delete)

**Indexes**:

- @@index([issueId])
- @@index([createdAt(sort: Desc)])

**Validation**:

- Content: 1-10,000 characters (enforced by API)
- Author defaults to "Anonymous" if not provided

---

### Attachment

**Table**: `attachments` (implied)
**Purpose**: File uploads attached to issues

| Field      | Type     | Constraints         | Default | Description                 |
| ---------- | -------- | ------------------- | ------- | --------------------------- |
| id         | Int      | @id, auto-increment | -       | Primary key                 |
| filename   | String   | -                   | -       | Original filename           |
| filepath   | String   | -                   | -       | Storage path                |
| mimetype   | String   | -                   | -       | MIME type (image/png, etc.) |
| size       | Int      | -                   | -       | File size in bytes          |
| issueId    | Int      | -                   | -       | Parent issue                |
| uploadedAt | DateTime | -                   | now()   | Upload timestamp            |

**Relations**:

- Belongs to Issue (cascade delete)

**Indexes**:

- @@index([issueId])

**Validation**:

- Max size: 50MB (enforced by API)
- Supported types: images, videos, documents, archives

---

### LinkedFile

**Table**: `linked_files` (implied)
**Purpose**: Link issues to code files

| Field      | Type     | Constraints         | Default | Description                     |
| ---------- | -------- | ------------------- | ------- | ------------------------------- |
| id         | Int      | @id, auto-increment | -       | Primary key                     |
| filePath   | String   | -                   | -       | Relative path from project root |
| lineNumber | Int?     | -                   | -       | Optional line number            |
| issueId    | Int      | -                   | -       | Parent issue                    |
| createdAt  | DateTime | -                   | now()   | Creation timestamp              |

**Relations**:

- Belongs to Issue (cascade delete)

**Indexes**:

- @@unique([issueId, filePath])
- @@index([filePath])

---

### LinkedCommit

**Table**: `linked_commits` (implied)
**Purpose**: Link issues to Git commits

| Field         | Type      | Constraints         | Default | Description             |
| ------------- | --------- | ------------------- | ------- | ----------------------- |
| id            | Int       | @id, auto-increment | -       | Primary key             |
| commitHash    | String    | -                   | -       | Git commit SHA          |
| commitMessage | String?   | -                   | -       | Commit message          |
| commitDate    | DateTime? | -                   | -       | Commit timestamp        |
| issueId       | Int       | -                   | -       | Parent issue            |
| createdAt     | DateTime  | -                   | now()   | Link creation timestamp |

**Relations**:

- Belongs to Issue (cascade delete)

**Indexes**:

- @@unique([issueId, commitHash])
- @@index([commitHash])

---

### KnowledgeItem

**Table**: `knowledge_items` (implied)
**Purpose**: Knowledge base articles

| Field        | Type     | Constraints         | Default | Description                |
| ------------ | -------- | ------------------- | ------- | -------------------------- |
| id           | Int      | @id, auto-increment | -       | Primary key                |
| title        | String   | -                   | -       | Article title              |
| content      | String   | @db.Text            | -       | Article content (markdown) |
| category     | String?  | -                   | -       | Category/topic             |
| tags         | String[] | -                   | -       | Array of tags              |
| searchVector | String?  | @db.Text            | -       | Full-text search vector    |
| createdAt    | DateTime | -                   | now()   | Creation timestamp         |
| updatedAt    | DateTime | @updatedAt          | -       | Last update                |

**Relations**:

- Has many KnowledgeLink

**Indexes**:

- @@index([category])
- @@index([createdAt(sort: Desc)])

**Features**:

- Full-text search on title/content
- Array field for tags

---

### KnowledgeLink

**Table**: `knowledge_links` (implied)
**Purpose**: Link knowledge articles to issues

| Field           | Type     | Constraints         | Default | Description          |
| --------------- | -------- | ------------------- | ------- | -------------------- |
| id              | Int      | @id, auto-increment | -       | Primary key          |
| knowledgeItemId | Int      | -                   | -       | Knowledge article ID |
| issueId         | Int      | -                   | -       | Issue ID             |
| createdAt       | DateTime | -                   | now()   | Link creation        |

**Relations**:

- Belongs to KnowledgeItem (cascade delete)
- Belongs to Issue (cascade delete)

**Indexes**:

- @@unique([knowledgeItemId, issueId])
- @@index([knowledgeItemId])
- @@index([issueId])

---

### WikiPage

**Table**: `wiki_pages` (implied)
**Purpose**: Wiki documentation with hierarchical structure

| Field        | Type     | Constraints         | Default | Description                    |
| ------------ | -------- | ------------------- | ------- | ------------------------------ |
| id           | Int      | @id, auto-increment | -       | Primary key                    |
| title        | String   | -                   | -       | Page title                     |
| content      | String   | @db.Text            | -       | Page content (markdown)        |
| parentId     | Int?     | -                   | -       | Parent page (for hierarchy)    |
| path         | String   | @unique             | -       | URL path (e.g., /rules/combat) |
| orderIndex   | Int      | -                   | 0       | Display order within parent    |
| searchVector | String?  | @db.Text            | -       | Full-text search vector        |
| version      | Int      | -                   | 1       | Version number                 |
| createdAt    | DateTime | -                   | now()   | Creation timestamp             |
| updatedAt    | DateTime | @updatedAt          | -       | Last update                    |

**Relations**:

- Self-referential: parent/children hierarchy
- Has many PageLink (outgoing and incoming)
- Has many WikiPageLink

**Indexes**:

- @@index([path])
- @@index([parentId])
- @@index([orderIndex])

**Features**:

- Hierarchical structure (nested pages)
- URL path for routing
- Version tracking (simplified)
- Full-text search

---

### PageLink

**Table**: `page_links` (implied)
**Purpose**: Wiki page cross-references

| Field        | Type     | Constraints         | Default | Description                          |
| ------------ | -------- | ------------------- | ------- | ------------------------------------ |
| id           | Int      | @id, auto-increment | -       | Primary key                          |
| sourcePageId | Int      | -                   | -       | Source page                          |
| targetPageId | Int      | -                   | -       | Target page                          |
| linkType     | String?  | -                   | -       | Link type: reference/related/example |
| createdAt    | DateTime | -                   | now()   | Link creation                        |

**Relations**:

- Belongs to WikiPage (source, cascade delete)
- Belongs to WikiPage (target, cascade delete)

**Indexes**:

- @@unique([sourcePageId, targetPageId])
- @@index([sourcePageId])
- @@index([targetPageId])

---

### WikiPageLink

**Table**: `wiki_page_links` (implied)
**Purpose**: Link wiki pages to issues

| Field      | Type     | Constraints         | Default | Description   |
| ---------- | -------- | ------------------- | ------- | ------------- |
| id         | Int      | @id, auto-increment | -       | Primary key   |
| wikiPageId | Int      | -                   | -       | Wiki page ID  |
| issueId    | Int      | -                   | -       | Issue ID      |
| createdAt  | DateTime | -                   | now()   | Link creation |

**Relations**:

- Belongs to WikiPage (cascade delete)
- Belongs to Issue (cascade delete)

**Indexes**:

- @@unique([wikiPageId, issueId])
- @@index([wikiPageId])
- @@index([issueId])

---

### SecurityFinding

**Table**: `security_findings` (implied)
**Purpose**: Security scan results (Semgrep integration)

| Field       | Type      | Constraints         | Default | Description               |
| ----------- | --------- | ------------------- | ------- | ------------------------- |
| id          | Int       | @id, auto-increment | -       | Primary key               |
| ruleId      | String    | -                   | -       | Semgrep rule ID           |
| severity    | String    | -                   | -       | ERROR/WARNING/INFO        |
| message     | String    | @db.Text            | -       | Finding message           |
| filePath    | String    | -                   | -       | File path                 |
| lineNumber  | Int       | -                   | -       | Line number               |
| codeSnippet | String?   | @db.Text            | -       | Code snippet              |
| status      | String    | -                   | "open"  | open/false_positive/fixed |
| issueId     | Int?      | @unique             | -       | Optional linked issue     |
| scanDate    | DateTime  | -                   | now()   | Scan timestamp            |
| fixedAt     | DateTime? | -                   | -       | Fix timestamp             |
| createdAt   | DateTime  | -                   | now()   | Record creation           |
| updatedAt   | DateTime  | @updatedAt          | -       | Last update               |

**Relations**:

- Belongs to Issue (optional, set null on delete)

**Indexes**:

- @@index([ruleId])
- @@index([severity])
- @@index([status])
- @@index([filePath])
- @@index([scanDate(sort: Desc)])

---

### Setting

**Table**: `settings` (implied)
**Purpose**: System configuration (JSONB key-value store)

| Field       | Type     | Constraints | Default | Description                            |
| ----------- | -------- | ----------- | ------- | -------------------------------------- |
| key         | String   | @id         | -       | Setting key (primary key)              |
| value       | Json     | @db.JsonB   | -       | Setting value (flexible JSON)          |
| category    | String   | -           | -       | Category: search/security/features/mcp |
| description | String?  | @db.Text    | -       | Setting description                    |
| updatedAt   | DateTime | @updatedAt  | -       | Last update                            |
| updatedBy   | String?  | -           | -       | Who updated (future: user system)      |

**Indexes**:

- @@index([category])

**Usage**:

- Flexible configuration storage
- Categories for organization
- JSONB for complex values

---

### AgentPersona

**Table**: `agent_personas` (implied)
**Purpose**: MCP agent persona definitions

| Field                | Type     | Constraints         | Default | Description                                    |
| -------------------- | -------- | ------------------- | ------- | ---------------------------------------------- |
| id                   | Int      | @id, auto-increment | -       | Primary key                                    |
| name                 | String   | @unique             | -       | Persona name                                   |
| slug                 | String   | @unique             | -       | URL slug (e.g., code-reviewer)                 |
| icon                 | String?  | -                   | -       | Emoji or icon name                             |
| description          | String?  | @db.Text            | -       | Persona description                            |
| systemPrompt         | String   | @db.Text            | -       | System prompt text                             |
| skills               | String[] | -                   | -       | Skills array (debugging, security)             |
| tools                | String[] | -                   | -       | MCP tools array                                |
| rules                | String[] | -                   | -       | Rules/guidelines array                         |
| autoActivate         | Boolean  | -                   | false   | Auto-activation enabled                        |
| activationConditions | Json?    | @db.JsonB           | -       | Activation conditions (filePatterns, keywords) |
| templateId           | Int?     | -                   | -       | Optional prompt template                       |
| isBuiltIn            | Boolean  | -                   | false   | Built-in vs custom                             |
| createdAt            | DateTime | -                   | now()   | Creation timestamp                             |
| updatedAt            | DateTime | @updatedAt          | -       | Last update                                    |

**Relations**:

- Belongs to PromptTemplate (optional)
- Has many AgentSession

**Indexes**:

- @@index([slug])
- @@index([isBuiltIn])

**Features**:

- Array fields for skills, tools, rules
- JSONB activation conditions
- Auto-activation support
- Template-based prompts

---

### PromptTemplate

**Table**: `prompt_templates` (implied)
**Purpose**: Reusable prompt templates for agents

| Field       | Type     | Constraints         | Default | Description                       |
| ----------- | -------- | ------------------- | ------- | --------------------------------- |
| id          | Int      | @id, auto-increment | -       | Primary key                       |
| name        | String   | @unique             | -       | Template name                     |
| description | String?  | @db.Text            | -       | Template description              |
| content     | String   | @db.Text            | -       | Template content (with variables) |
| variables   | String[] | -                   | -       | Variable names array              |
| category    | String?  | -                   | -       | Category (code-review, debugging) |
| createdAt   | DateTime | -                   | now()   | Creation timestamp                |
| updatedAt   | DateTime | @updatedAt          | -       | Last update                       |

**Relations**:

- Has many AgentPersona

**Indexes**:

- @@index([category])

---

### AgentSession

**Table**: `agent_sessions` (implied)
**Purpose**: Agent session tracking and metrics

| Field         | Type      | Constraints         | Default | Description                                    |
| ------------- | --------- | ------------------- | ------- | ---------------------------------------------- |
| id            | Int       | @id, auto-increment | -       | Primary key                                    |
| personaId     | Int       | -                   | -       | Agent persona ID                               |
| activatedBy   | String?   | -                   | -       | Activation method (slash_command, auto, cmd_k) |
| context       | Json?     | @db.JsonB           | -       | Context at activation                          |
| duration      | Int?      | -                   | -       | Session duration (seconds)                     |
| toolCalls     | Int       | -                   | 0       | Number of MCP tool calls                       |
| issuesCreated | Int       | -                   | 0       | Issues created in session                      |
| startedAt     | DateTime  | -                   | now()   | Session start                                  |
| endedAt       | DateTime? | -                   | -       | Session end                                    |

**Relations**:

- Belongs to AgentPersona (cascade delete)

**Indexes**:

- @@index([personaId])
- @@index([startedAt(sort: Desc)])

---

## Database Features

### Full-Text Search

**Preview Features Enabled**:

```prisma
previewFeatures = ["fullTextSearch", "fullTextIndex"]
```

**Tables with Full-Text Search**:

- Issue (searchVector on title/description)
- KnowledgeItem (searchVector on title/content)
- WikiPage (searchVector on title/content)

**Implementation**:

- PostgreSQL tsvector/tsquery
- Currently stored as Text (placeholder for tsvector)
- Requires database triggers for auto-update

### JSONB Features

**Tables using JSONB**:

- Issue (customFields)
- Setting (value)
- AgentPersona (activationConditions)
- AgentSession (context)

**Benefits**:

- Flexible schema for custom data
- Queryable with PostgreSQL operators
- Indexed for performance

### Array Fields

**Tables using Arrays**:

- KnowledgeItem (tags: String[])
- AgentPersona (skills, tools, rules: String[])
- PromptTemplate (variables: String[])

### Cascade Deletes

**Cascade relationships**:

- Project → Issue (delete project deletes all issues)
- Issue → Comment, Attachment, LinkedFile, LinkedCommit (delete issue deletes all related)
- WikiPage → PageLink, WikiPageLink (delete page deletes all links)
- AgentPersona → AgentSession (delete persona deletes sessions)

**Set Null relationships**:

- SecurityFinding → Issue (delete issue sets issueId to null)

---

## Common Queries

### Get issue with all related data

```typescript
const issue = await prisma.issue.findUnique({
  where: { id: 42 },
  include: {
    project: true,
    labels: true,
    comments: {
      orderBy: { createdAt: 'asc' },
    },
    attachments: true,
    linkedFiles: true,
    linkedCommits: true,
    linkedKnowledge: {
      include: { knowledgeItem: true },
    },
    linkedWikiPages: {
      include: { wikiPage: true },
    },
    securityFinding: true,
  },
});
```

### Create comment on issue

```typescript
const comment = await prisma.comment.create({
  data: {
    content: 'This is a comment',
    author: 'Moksha Dev',
    issueId: 42,
  },
});

// Revalidate cache
revalidatePath(`/issues/42`);
```

### Update issue status

```typescript
const updated = await prisma.issue.update({
  where: { id: 42 },
  data: {
    status: 'closed',
    closedAt: new Date(),
  },
});
```

### Full-text search (when triggers implemented)

```typescript
// Placeholder - will be implemented with tsvector
const results = await prisma.$queryRaw`
  SELECT * FROM issues
  WHERE search_vector @@ to_tsquery('english', ${query})
  ORDER BY ts_rank(search_vector, to_tsquery('english', ${query})) DESC
  LIMIT 20
`;
```

---

## Migration Guide

### Essential Commands

```bash
# Generate migration
pnpm prisma migrate dev --name description

# Apply migrations (production)
pnpm prisma migrate deploy

# Reset database (dev only - DESTRUCTIVE!)
pnpm prisma migrate reset

# Generate Prisma Client
pnpm prisma generate

# Open Prisma Studio GUI
pnpm prisma studio

# Validate schema
pnpm prisma validate

# Format schema file
pnpm prisma format
```

### Connection String

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

---

## Performance Considerations

### Indexes

All frequently queried fields are indexed:

- Foreign keys (issueId, projectId, etc.)
- Status/priority for filtering
- Timestamps for sorting (DESC)
- Unique constraints (name, path, etc.)

### Pagination

Use cursor-based pagination for large datasets:

```typescript
const issues = await prisma.issue.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastIssueId },
  orderBy: { createdAt: 'desc' },
});
```

### Connection Pooling

```env
# Recommended for serverless
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
```

---

## Resources

### Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL 16 Docs](https://www.postgresql.org/docs/16/)
- [Full-text Search](https://www.prisma.io/docs/concepts/components/prisma-client/full-text-search)

### Project Documentation

- [API Catalog](api-catalog.md) - API endpoints using these models
- [Component Patterns](component-patterns.md) - Components using these models

### Tools

- [Prisma Studio](https://www.prisma.io/studio) - GUI for database
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL admin
- [TablePlus](https://tableplus.com/) - Database client

---

**Last Updated:** 2025-10-28
**Schema Status:** Full schema implemented (Phase 3 Day 4 complete)
**Next Update:** As needed for new features

**See also**: [STATUS.md](../../STATUS.md) for current project status
