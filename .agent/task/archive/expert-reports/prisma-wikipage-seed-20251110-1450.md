# Prisma Design Plan: WikiPage Seed Data

**Created**: 2025-11-10 14:50
**Type**: Seed Data Design
**Context**: Sprint 2 Week 3 Days 1-2 (US-015: Wiki Database Model)

---

## Executive Summary

This plan provides comprehensive guidance for creating WikiPage seed data that demonstrates the wiki feature's capabilities, including hierarchical structure, categories, full-text search preparation, and cross-linking between pages.

---

## Data Model Analysis

### WikiPage Model (Current Schema)

```prisma
model WikiPage {
  id Int @id @default(autoincrement())

  title   String
  content String @db.Text

  // Categorization (optional String - NOT enum for extensibility)
  category String?

  // Hierarchical structure (self-referential)
  parentId Int?
  parent   WikiPage?  @relation("PageHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children WikiPage[] @relation("PageHierarchy")

  // URL path (unique, used for routing)
  path       String @unique
  orderIndex Int    @default(0)

  // Full-text search (tsvector placeholder)
  searchVector String? @db.Text

  // Relations
  outgoingLinks PageLink[] @relation("SourcePage")
  incomingLinks PageLink[] @relation("TargetPage")
  linkedIssues  WikiPageLink[] @relation("WikiIssue")

  // Version control
  version Int @default(1)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([path])
  @@index([parentId])
  @@index([orderIndex])
  @@index([category])
}
```

**Key Observations**:
1. ✅ **Category is String (not enum)** - Excellent choice for extensibility
2. ✅ **Hierarchical structure** - Self-referential relation for parent/child pages
3. ✅ **Unique path** - URL-based routing (e.g., `/getting-started`, `/api/endpoints`)
4. ✅ **orderIndex** - Manual control over page ordering in navigation
5. ✅ **searchVector placeholder** - Prepared for PostgreSQL tsvector (future enhancement)
6. ✅ **Version field** - Basic versioning support (simplified for MVP)
7. ✅ **No projectId** - Wiki is system-wide, not project-scoped

---

## Questions Answered

### 1. Category Structure

**Recommendation**: Keep as `String?` (optional) - NO enum needed

**Suggested Categories for Seed Data**:
```typescript
const WIKI_CATEGORIES = {
  GETTING_STARTED: 'getting-started',    // Onboarding, tutorials
  GUIDES: 'guides',                       // How-to guides
  REFERENCE: 'reference',                 // API docs, technical specs
  TROUBLESHOOTING: 'troubleshooting',     // Common issues, FAQs
  ARCHITECTURE: 'architecture',           // System design, ADRs
  BEST_PRACTICES: 'best-practices',       // Coding standards, conventions
} as const;
```

**Why String over Enum**:
- ✅ Users can create custom categories in the future
- ✅ No migration required when adding new categories
- ✅ Index on `category` handles performance
- ✅ UI can dynamically generate category filters from distinct values

**Validation Strategy** (application layer):
```typescript
// src/lib/constants/wiki-categories.ts
export const STANDARD_CATEGORIES = [
  'getting-started',
  'guides',
  'reference',
  'troubleshooting',
  'architecture',
  'best-practices',
] as const;

// Zod schema for validation
export const wikiPageCategorySchema = z.string().optional();
```

---

### 2. Content Length Guidelines

**Recommendation**: Realistic documentation-length content (500-1500 words per page)

**Content Structure by Category**:

**Getting Started** (800-1000 words):
- Introduction paragraph (what is ProjectPulse)
- Prerequisites section (Node.js, PostgreSQL, pnpm)
- Installation steps (numbered list with code blocks)
- Quick start guide (create first project, first issue)
- Next steps links (to other wiki pages)

**API Reference** (1000-1500 words):
- Overview paragraph
- Authentication section
- Endpoint documentation (at least 3 endpoints with:
  - Method + URL
  - Request body schema
  - Response schema
  - Example cURL command
  - Example response JSON
)
- Error handling section
- Rate limiting information

**Troubleshooting** (600-800 words):
- Common issues as H2 sections (at least 4 issues)
- Each issue: Problem → Cause → Solution pattern
- Code snippets showing fixes
- Links to related documentation

**Best Practice**: Use markdown with:
- Proper heading hierarchy (H1 = title, H2 = sections, H3 = subsections)
- Code blocks with language identifiers (```typescript, ```bash, ```sql)
- Bullet points and numbered lists
- Links to other wiki pages (internal references)
- Callout blocks (quotes for notes/warnings)

---

### 3. Slug Generation Strategy

**Recommendation**: Manual slugs in seed data, auto-generate in production API

**Slug Rules**:
```typescript
// src/lib/utils/slug.ts
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .substring(0, 100);        // Max length 100 chars
}

// Examples:
generateSlug('Getting Started with ProjectPulse')
// → 'getting-started-with-projectpulse'

generateSlug('API Documentation')
// → 'api-documentation'

generateSlug('How to Debug PostgreSQL Queries?')
// → 'how-to-debug-postgresql-queries'
```

**Path Construction**:
```typescript
// Root-level page
path: '/getting-started'

// Category-based path (optional pattern)
path: '/guides/docker-setup'
path: '/reference/api-endpoints'

// Hierarchical path (parent/child)
path: '/architecture/database'
path: '/architecture/database/migrations'
```

**Seed Data Approach**:
- Use explicit `path` values (manual)
- Ensure uniqueness with `@@unique` constraint
- For hierarchical pages, construct path as: `parent.path + '/' + child.slug`

---

### 4. createdBy Field

**Current Schema Issue**: Model does NOT have `createdBy` field

**Observation**: The WikiPage model you described in your question differs from the actual schema. The actual model has:
- ✅ `version` field (for versioning)
- ❌ NO `createdBy`, `creatorId`, or `slug` fields
- ❌ NO `projectId` (wiki is system-wide)

**Recommendation for Seed Data**:
Since there's no `createdBy` field, you don't need to worry about this. If you want to add user tracking in the future, consider this migration:

```prisma
// Future enhancement (Phase 3?)
model WikiPage {
  // ... existing fields

  // Optional: User tracking
  createdById Int?
  createdBy   User? @relation("WikiPageCreator", fields: [createdById], references: [id])

  lastEditedById Int?
  lastEditedBy   User? @relation("WikiPageEditor", fields: [lastEditedById], references: [id])

  @@index([createdById])
  @@index([lastEditedById])
}
```

**For Seed Data**: Skip user tracking (no field exists)

---

### 5. Project Linking

**Current Schema**: NO `projectId` field - Wiki is system-wide/global

**Recommendation**: Wiki pages are NOT project-scoped

**Design Rationale**:
- ✅ Wiki serves as global documentation hub
- ✅ Multiple projects can link to same wiki page
- ✅ Reduces duplication (one "Getting Started" for all projects)
- ✅ Easier to maintain (update once, applies everywhere)

**Cross-Reference Pattern** (if needed):
```prisma
// Wiki can link to issues (which belong to projects)
model WikiPageLink {
  id         Int      @id @default(autoincrement())
  wikiPageId Int
  issueId    Int
  wikiPage   WikiPage @relation("WikiIssue", fields: [wikiPageId], references: [id])
  issue      Issue    @relation(fields: [issueId], references: [id])
  // ...
}
```

**Seed Data Approach**: Create global wiki pages independent of projects

---

### 6. Seed Script Pattern

**Recommendation**: Add WikiPage seeding AFTER existing sections, BEFORE summary

**Best Practices**:

1. **Transaction Safety**: Create pages in dependency order (parents before children)
2. **Reusability**: Store created pages in variables for linking
3. **Cleanup**: Delete WikiPages in cleanup section (already exists in seed.ts)
4. **Atomicity**: Use Promise.all for parallel creation when no dependencies

**Pattern for Hierarchical Pages**:
```typescript
// Create parent page first
const architecturePage = await prisma.wikiPage.create({
  data: {
    title: 'Architecture',
    path: '/architecture',
    category: 'architecture',
    orderIndex: 0,
    content: '# Architecture Overview...',
  },
});

// Create children referencing parent
const childPages = await Promise.all([
  prisma.wikiPage.create({
    data: {
      title: 'Database Design',
      path: '/architecture/database',
      category: 'architecture',
      orderIndex: 0,
      parentId: architecturePage.id, // Reference parent
      content: '# Database Design...',
    },
  }),
  prisma.wikiPage.create({
    data: {
      title: 'API Architecture',
      path: '/architecture/api',
      category: 'architecture',
      orderIndex: 1,
      parentId: architecturePage.id,
      content: '# API Architecture...',
    },
  }),
]);
```

**Pattern for Cross-Linking**:
```typescript
// After creating pages, create links
await prisma.pageLink.createMany({
  data: [
    {
      sourcePageId: gettingStartedPage.id,
      targetPageId: configurationPage.id,
    },
    {
      sourcePageId: apiDocsPage.id,
      targetPageId: troubleshootingPage.id,
    },
  ],
});
```

---

## Recommended Seed Data Structure

### Page Hierarchy (5-7 Pages)

```
📚 Wiki Pages (7 total)
├── 📄 Getting Started (/getting-started) [getting-started]
├── 📄 Configuration (/configuration) [getting-started]
├── 📁 Development Guides (/guides) [guides]
│   ├── 📄 Docker Setup (/guides/docker-setup) [guides]
│   └── 📄 Database Migrations (/guides/database-migrations) [guides]
├── 📄 API Documentation (/reference/api) [reference]
└── 📄 Troubleshooting (/troubleshooting) [troubleshooting]
```

**Rationale**:
- ✅ Demonstrates flat and hierarchical structures
- ✅ Covers multiple categories
- ✅ Shows parent/child relationships
- ✅ Realistic documentation tree

---

## Complete Seed Data Implementation

### Location in seed.ts

Insert after "WIKI PAGES" comment (line 658-759), replacing existing wiki seed data:

```typescript
// ========================================================================
// WIKI PAGES
// ========================================================================
console.log('📖 Creating wiki pages...');

// ROOT LEVEL PAGES
const rootPages = await Promise.all([
  // 1. Getting Started (root, getting-started category)
  prisma.wikiPage.create({
    data: {
      title: 'Getting Started with ProjectPulse',
      path: '/getting-started',
      category: 'getting-started',
      orderIndex: 0,
      content: `# Getting Started with ProjectPulse

Welcome to ProjectPulse! This guide will help you set up and start using the platform.

## What is ProjectPulse?

ProjectPulse is a comprehensive project management and development hub that combines:
- **Issue Tracking**: Manage bugs, features, and tasks with customizable workflows
- **Knowledge Base**: Store and search technical documentation with AI-powered semantic search
- **Wiki**: Create hierarchical documentation with full-text search
- **Sprint Planning**: Track phases, weeks, days, tasks, and sessions in a 5-level hierarchy
- **Security Scanning**: Integrate with security tools to track vulnerabilities
- **Agent Personas**: Use AI assistants specialized for code review, debugging, and documentation

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 16.x with pgvector extension ([Installation Guide](/guides/docker-setup))
- **pnpm** 8.x or higher (\`npm install -g pnpm\`)
- **Git** for version control

## Installation Steps

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/draco28/ProjectPulse.git
cd ProjectPulse
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 3. Set Up Environment Variables

Create a \`.env\` file in the \`apps/web\` directory:

\`\`\`bash
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication (optional for MVP)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

> **Note**: For production, generate a secure random secret with: \`openssl rand -base64 32\`

### 4. Start PostgreSQL

Using Docker Compose:

\`\`\`bash
docker-compose up -d
\`\`\`

Verify PostgreSQL is running:

\`\`\`bash
docker ps
# Should show: postgres:16-alpine container running on port 5432
\`\`\`

### 5. Run Database Migrations

\`\`\`bash
cd apps/web
pnpm prisma migrate dev
\`\`\`

### 6. Seed the Database

\`\`\`bash
pnpm prisma db seed
\`\`\`

This creates:
- Sample Sprint 1 hierarchy (Phase, Weeks, Days, Tasks, Sessions)
- Sample issues with labels and comments
- Knowledge base articles
- Wiki pages (you're reading one!)
- Agent personas

### 7. Start Development Server

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Quick Start Guide

### Create Your First Project

1. Navigate to **Projects** in the sidebar
2. Click **"New Project"**
3. Enter project details:
   - **Name**: Your project name
   - **Description**: Brief overview
   - **Repository**: GitHub URL (optional)
4. Click **"Create Project"**

### Create Your First Issue

1. Navigate to **Issues** in the sidebar
2. Click **"New Issue"**
3. Fill in issue details:
   - **Title**: Brief description
   - **Status**: open, in_progress, or closed
   - **Priority**: critical, high, medium, or low
   - **Module**: Component/area affected
   - **Assignee**: Team member (optional)
4. Click **"Create Issue"**

### Search the Knowledge Base

1. Navigate to **Knowledge Base** in the sidebar
2. Use the search bar to find articles by:
   - **Keyword search**: Full-text search using PostgreSQL tsvector
   - **Category filter**: Database, Frontend, Backend, etc.
   - **Tag filter**: Select multiple tags

### Browse Wiki Documentation

1. Navigate to **Wiki** in the sidebar
2. Browse hierarchical documentation tree
3. Use search to find specific pages
4. Click links to navigate between related pages

## Next Steps

- [Configuration Guide](/configuration) - Configure environment and settings
- [API Documentation](/reference/api) - Learn about REST API endpoints
- [Docker Setup Guide](/guides/docker-setup) - Set up PostgreSQL with Docker
- [Troubleshooting](/troubleshooting) - Common issues and solutions

## Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/draco28/ProjectPulse/issues)
- **Wiki**: Browse documentation in the Wiki section
- **Knowledge Base**: Search for technical articles

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
    },
  }),

  // 2. Configuration (root, getting-started category)
  prisma.wikiPage.create({
    data: {
      title: 'Configuration',
      path: '/configuration',
      category: 'getting-started',
      orderIndex: 1,
      content: `# Configuration

Learn how to configure ProjectPulse for your team and environment.

## Environment Variables

ProjectPulse uses environment variables for configuration. Create a \`.env\` file in \`apps/web/\`:

### Required Variables

\`\`\`bash
# Database Connection
DATABASE_URL="postgresql://username:password@host:port/database"

# Example (local development)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"

# Example (production with SSL)
DATABASE_URL="postgresql://user:pass@production-host:5432/projectpulse_prod?sslmode=require"
\`\`\`

### Optional Variables

\`\`\`bash
# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication (NextAuth.js)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth (optional)
GITHUB_CLIENT_ID="your-github-oauth-app-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-secret"

# PostgreSQL Connection Pool
DATABASE_CONNECTION_LIMIT="10"
DATABASE_POOL_TIMEOUT="20"
\`\`\`

## Database Setup

ProjectPulse requires PostgreSQL 16+ with the **pgvector** extension for semantic search.

### Enable Required Extensions

Connect to your database and run:

\`\`\`sql
-- Enable vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable trigram similarity for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable full-text search (pre-installed)
-- tsvector and tsquery are built-in
\`\`\`

### Verify Extensions

\`\`\`sql
SELECT * FROM pg_extension WHERE extname IN ('vector', 'pg_trgm');

-- Should return:
-- extname | extversion
-- --------+-----------
-- vector  | 0.5.1
-- pg_trgm | 1.6
\`\`\`

### Connection Pooling

For production, configure connection pooling:

\`\`\`bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30"
\`\`\`

**Recommended Settings**:
- **Development**: \`connection_limit=5\`
- **Production**: \`connection_limit=20-50\` (based on server capacity)

## Theme Customization

ProjectPulse uses the **Coral Neumorphic** theme by default with CSS custom properties.

### Theme Variables

Edit \`apps/web/app/globals.css\`:

\`\`\`css
:root[data-theme="coral"] {
  /* Background Colors */
  --background: #fff7ed;
  --foreground: #44403c;

  /* Neumorphic Shadows */
  --neu-light: #ffffff;
  --neu-dark: #e8c8b0;

  /* Accent Colors */
  --primary: #f97316;
  --primary-foreground: #ffffff;

  /* ... more variables */
}
\`\`\`

### Custom Theme

To create a custom theme:

1. Add theme definition in \`globals.css\`
2. Update theme selector in Settings page
3. Restart development server

## Prisma Configuration

### Generate Client

After schema changes:

\`\`\`bash
pnpm prisma generate
\`\`\`

### Migration Workflow

**Development**:
\`\`\`bash
# Create and apply migration
pnpm prisma migrate dev --name add_new_field

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
\`\`\`

**Production**:
\`\`\`bash
# Apply pending migrations
pnpm prisma migrate deploy

# Rollback is manual - create new migration to revert
\`\`\`

### Prisma Studio

Explore database with GUI:

\`\`\`bash
pnpm prisma studio
\`\`\`

Opens [http://localhost:5555](http://localhost:5555)

## TypeScript Configuration

ProjectPulse uses **strict mode** TypeScript:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
\`\`\`

### Type Generation

Generate types from Prisma schema:

\`\`\`bash
pnpm prisma generate
\`\`\`

Types available at:
\`\`\`typescript
import { Issue, WikiPage, KnowledgeItem } from '@prisma/client';
\`\`\`

## Next Steps

- [Docker Setup Guide](/guides/docker-setup) - Set up PostgreSQL with Docker
- [Database Migrations Guide](/guides/database-migrations) - Learn migration workflow
- [API Documentation](/reference/api) - Configure API access

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
    },
  }),

  // 3. Development Guides (parent page)
  prisma.wikiPage.create({
    data: {
      title: 'Development Guides',
      path: '/guides',
      category: 'guides',
      orderIndex: 2,
      content: `# Development Guides

Comprehensive guides for developing with ProjectPulse.

## Available Guides

### Getting Started
- [Docker Setup](/guides/docker-setup) - Set up PostgreSQL with Docker Compose
- [Database Migrations](/guides/database-migrations) - Prisma migration workflow

### Advanced Topics
- API Development (Coming Soon)
- Testing Strategies (Coming Soon)
- Deployment Guide (Coming Soon)

## Contributing

Want to add a guide? See our [Contributing Guidelines](https://github.com/draco28/ProjectPulse/blob/master/CONTRIBUTING.md).

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
    },
  }),

  // 4. API Documentation (root, reference category)
  prisma.wikiPage.create({
    data: {
      title: 'API Documentation',
      path: '/reference/api',
      category: 'reference',
      orderIndex: 3,
      content: `# API Documentation

ProjectPulse provides a RESTful API for programmatic access to issues, knowledge base, and wiki pages.

## Base URL

\`\`\`
http://localhost:3000/api
\`\`\`

**Production**: Replace with your deployed domain

## Authentication

Currently, API endpoints are **unauthenticated** (MVP phase).

**Planned**: NextAuth.js integration with JWT bearer tokens:

\`\`\`bash
Authorization: Bearer <your-jwt-token>
\`\`\`

## Response Format

All API responses follow this structure:

**Success Response**:
\`\`\`json
{
  "data": { /* response payload */ },
  "error": null
}
\`\`\`

**Error Response**:
\`\`\`json
{
  "data": null,
  "error": "Error message"
}
\`\`\`

## Endpoints

### Issues API

#### GET /api/issues

Get all issues with optional filtering.

**Query Parameters**:
- \`status\` (optional): Filter by status (open, in_progress, closed)
- \`priority\` (optional): Filter by priority (critical, high, medium, low)
- \`module\` (optional): Filter by module name

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/issues?status=open&priority=high
\`\`\`

**Example Response**:
\`\`\`json
{
  "data": [
    {
      "id": 1,
      "title": "Add authentication with NextAuth.js",
      "status": "open",
      "priority": "critical",
      "module": "Auth",
      "assignee": "Developer",
      "projectId": 1,
      "createdAt": "2025-10-24T10:00:00.000Z",
      "updatedAt": "2025-10-24T10:00:00.000Z",
      "closedAt": null,
      "labels": [
        { "id": 1, "name": "enhancement", "color": "#a2eeef" }
      ]
    }
  ],
  "error": null
}
\`\`\`

#### POST /api/issues

Create a new issue.

**Request Body**:
\`\`\`json
{
  "title": "Issue title",
  "description": "Detailed description (optional)",
  "status": "open",
  "priority": "high",
  "module": "UI",
  "assignee": "Developer (optional)",
  "projectId": 1
}
\`\`\`

**Example Request**:
\`\`\`bash
curl -X POST http://localhost:3000/api/issues \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Fix button styling",
    "status": "open",
    "priority": "low",
    "module": "UI",
    "projectId": 1
  }'
\`\`\`

**Example Response**:
\`\`\`json
{
  "data": {
    "id": 10,
    "title": "Fix button styling",
    "status": "open",
    "priority": "low",
    "module": "UI",
    "assignee": null,
    "projectId": 1,
    "createdAt": "2025-11-10T14:30:00.000Z",
    "updatedAt": "2025-11-10T14:30:00.000Z"
  },
  "error": null
}
\`\`\`

#### GET /api/issues/:id

Get a single issue by ID.

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/issues/1
\`\`\`

**Example Response**:
\`\`\`json
{
  "data": {
    "id": 1,
    "title": "Add authentication with NextAuth.js",
    "description": "Implement user authentication...",
    "status": "open",
    "priority": "critical",
    "module": "Auth",
    "labels": [...],
    "comments": [...]
  },
  "error": null
}
\`\`\`

### Wiki API

#### GET /api/wiki

Get all wiki pages.

**Query Parameters**:
- \`category\` (optional): Filter by category

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/wiki?category=guides
\`\`\`

#### GET /api/wiki/:path

Get wiki page by path (URL-encoded).

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/wiki/getting-started
\`\`\`

### Knowledge Base API

#### GET /api/knowledge

Get all knowledge base items.

**Query Parameters**:
- \`category\` (optional): Filter by category
- \`q\` (optional): Full-text search query

**Example Request**:
\`\`\`bash
curl http://localhost:3000/api/knowledge?q=postgresql&category=Database
\`\`\`

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

**Currently**: No rate limiting (MVP)

**Planned**: 100 requests per minute per IP address

## Pagination

**Currently**: All results returned (MVP)

**Planned**: Cursor-based pagination:
\`\`\`
GET /api/issues?cursor=<last-id>&limit=20
\`\`\`

## Next Steps

- [Troubleshooting Guide](/troubleshooting) - Common API errors
- [Configuration](/configuration) - API environment setup

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
    },
  }),

  // 5. Troubleshooting (root, troubleshooting category)
  prisma.wikiPage.create({
    data: {
      title: 'Troubleshooting',
      path: '/troubleshooting',
      category: 'troubleshooting',
      orderIndex: 4,
      content: `# Troubleshooting

Common issues and solutions for ProjectPulse.

## Database Connection Issues

### Problem: "Connection refused" or "ECONNREFUSED"

**Symptoms**:
\`\`\`
Error: P1001: Can't reach database server at localhost:5432
\`\`\`

**Causes**:
- PostgreSQL container not running
- Wrong database URL in \`.env\`
- Port 5432 already in use

**Solutions**:

1. **Check PostgreSQL is running**:
   \`\`\`bash
   docker ps
   # Should show: postgres:16-alpine container
   \`\`\`

2. **Start PostgreSQL**:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. **Verify DATABASE_URL**:
   \`\`\`bash
   # apps/web/.env
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"
   \`\`\`

4. **Check port availability**:
   \`\`\`bash
   # Windows
   netstat -ano | findstr :5432

   # Mac/Linux
   lsof -i :5432
   \`\`\`

---

## Migration Issues

### Problem: "Migration failed" or "Schema out of sync"

**Symptoms**:
\`\`\`
Error: P3006: Migration failed to apply cleanly to the shadow database
\`\`\`

**Solutions**:

1. **Reset development database** (⚠️ deletes all data):
   \`\`\`bash
   pnpm prisma migrate reset
   \`\`\`

2. **Apply migrations manually**:
   \`\`\`bash
   pnpm prisma migrate dev
   \`\`\`

3. **Regenerate Prisma Client**:
   \`\`\`bash
   pnpm prisma generate
   \`\`\`

---

## pgvector Extension Not Found

### Problem: "Extension 'vector' does not exist"

**Symptoms**:
\`\`\`
ERROR: extension "vector" is not available
\`\`\`

**Solution**:

1. **Connect to database**:
   \`\`\`bash
   docker exec -it projectpulse-db-1 psql -U postgres -d projectpulse_dev
   \`\`\`

2. **Create extension**:
   \`\`\`sql
   CREATE EXTENSION IF NOT EXISTS vector;
   \\dx  -- List extensions to verify
   \`\`\`

3. **Restart Docker container**:
   \`\`\`bash
   docker-compose restart
   \`\`\`

---

## TypeScript Type Errors

### Problem: "Type 'X' is not assignable to type 'Y'"

**Symptoms**:
\`\`\`
Type 'Issue | null' is not assignable to type 'Issue'
\`\`\`

**Solutions**:

1. **Regenerate Prisma Client**:
   \`\`\`bash
   pnpm prisma generate
   \`\`\`

2. **Check for null safety**:
   \`\`\`typescript
   // ❌ Wrong
   const issue = await prisma.issue.findUnique({ where: { id: 1 } });
   console.log(issue.title); // Error: issue might be null

   // ✅ Correct
   const issue = await prisma.issue.findUnique({ where: { id: 1 } });
   if (!issue) throw new Error('Issue not found');
   console.log(issue.title); // Safe
   \`\`\`

3. **Restart TypeScript server** (VS Code):
   - \`Cmd+Shift+P\` (Mac) or \`Ctrl+Shift+P\` (Windows)
   - Type: "TypeScript: Restart TS Server"

---

## Port Already in Use

### Problem: "Port 3000 already in use"

**Symptoms**:
\`\`\`
Error: listen EADDRINUSE: address already in use :::3000
\`\`\`

**Solutions**:

1. **Find process using port 3000**:
   \`\`\`bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -i :3000
   kill -9 <PID>
   \`\`\`

2. **Change port**:
   \`\`\`bash
   # apps/web/package.json
   "dev": "next dev -p 3001"
   \`\`\`

---

## Seed Script Fails

### Problem: "Unique constraint failed"

**Symptoms**:
\`\`\`
Error: Unique constraint failed on the fields: ('value')
\`\`\`

**Solution**:

Seed script tries to create duplicate data. Reset database:

\`\`\`bash
pnpm prisma migrate reset
# This runs migrations AND seed script automatically
\`\`\`

---

## API Returns 500 Error

### Problem: API endpoint returns 500 Internal Server Error

**Debugging Steps**:

1. **Check terminal logs** (where \`pnpm dev\` runs)
2. **Check Prisma query logs**:
   \`\`\`typescript
   // lib/db.ts
   const prisma = new PrismaClient({
     log: ['query', 'error', 'warn'],
   });
   \`\`\`

3. **Verify database schema matches code**:
   \`\`\`bash
   pnpm prisma db pull  # Pull schema from database
   pnpm prisma generate  # Regenerate client
   \`\`\`

---

## Next Steps

- [Configuration](/configuration) - Environment setup
- [Docker Setup Guide](/guides/docker-setup) - Container configuration
- [API Documentation](/reference/api) - API endpoint reference

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
    },
  }),
]);

console.log(\`✓ Created \${rootPages.length} root-level wiki pages\n\`);

// HIERARCHICAL PAGES (children of "Development Guides")
const guidesParent = rootPages[2]; // Development Guides

const childPages = await Promise.all([
  // Docker Setup Guide (child of Development Guides)
  prisma.wikiPage.create({
    data: {
      title: 'Docker Setup Guide',
      path: '/guides/docker-setup',
      category: 'guides',
      orderIndex: 0,
      parentId: guidesParent.id, // Set parent relationship
      content: `# Docker Setup Guide

Set up PostgreSQL 16 with pgvector extension using Docker Compose.

## Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose CLI (included in Docker Desktop)

## docker-compose.yml

Create \`docker-compose.yml\` in project root:

\`\`\`yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:latest
    container_name: projectpulse-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: projectpulse_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
\`\`\`

## Start PostgreSQL

\`\`\`bash
docker-compose up -d
\`\`\`

**Flags**:
- \`-d\`: Run in detached mode (background)

## Verify Setup

\`\`\`bash
# Check container status
docker ps

# Check logs
docker logs projectpulse-db

# Connect to database
docker exec -it projectpulse-db psql -U postgres -d projectpulse_dev
\`\`\`

## Enable Extensions

\`\`\`sql
-- Enable pgvector (semantic search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm (fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extensions
\\dx
\`\`\`

## Stop PostgreSQL

\`\`\`bash
docker-compose down
\`\`\`

**Preserve data**:
\`\`\`bash
docker-compose down  # Keeps volumes
\`\`\`

**Delete data**:
\`\`\`bash
docker-compose down -v  # Removes volumes
\`\`\`

## Troubleshooting

See [Troubleshooting Guide](/troubleshooting) for common Docker issues.

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
    },
  }),

  // Database Migrations Guide (child of Development Guides)
  prisma.wikiPage.create({
    data: {
      title: 'Database Migrations Guide',
      path: '/guides/database-migrations',
      category: 'guides',
      orderIndex: 1,
      parentId: guidesParent.id,
      content: `# Database Migrations Guide

Learn how to manage database schema changes with Prisma Migrate.

## Overview

Prisma Migrate tracks schema changes as migration files in \`prisma/migrations/\`.

## Development Workflow

### 1. Modify Schema

Edit \`prisma/schema.prisma\`:

\`\`\`prisma
model Issue {
  id          Int      @id @default(autoincrement())
  title       String
  description String?  @db.Text

  // Add new field
  estimatedHours Int? // New field
}
\`\`\`

### 2. Create Migration

\`\`\`bash
pnpm prisma migrate dev --name add_estimated_hours
\`\`\`

**What happens**:
1. Generates SQL migration file
2. Applies migration to database
3. Regenerates Prisma Client

### 3. Review Migration SQL

Check \`prisma/migrations/YYYYMMDDHHMMSS_add_estimated_hours/migration.sql\`:

\`\`\`sql
-- AlterTable
ALTER TABLE "issues" ADD COLUMN "estimatedHours" INTEGER;
\`\`\`

### 4. Commit Migration

\`\`\`bash
git add prisma/migrations
git commit -m "feat: add estimatedHours to Issue model"
\`\`\`

## Production Workflow

### Apply Migrations

\`\`\`bash
pnpm prisma migrate deploy
\`\`\`

**Use in**:
- CI/CD pipelines
- Production deployments
- Staging environments

### Rollback

Prisma does NOT support automatic rollback. To rollback:

1. Create new migration that reverts changes
2. Apply new migration

**Example** (remove field):
\`\`\`prisma
model Issue {
  // Remove estimatedHours field
}
\`\`\`

\`\`\`bash
pnpm prisma migrate dev --name remove_estimated_hours
\`\`\`

## Common Operations

### Reset Database (Development Only)

⚠️ **WARNING**: Deletes ALL data

\`\`\`bash
pnpm prisma migrate reset
\`\`\`

**What happens**:
1. Drops database
2. Recreates database
3. Applies all migrations
4. Runs seed script

### Prototype Mode (No Migration Files)

For rapid prototyping:

\`\`\`bash
pnpm prisma db push
\`\`\`

**Use when**:
- Testing schema changes
- Prototyping features
- NOT for production

### View Migration Status

\`\`\`bash
pnpm prisma migrate status
\`\`\`

## Best Practices

1. ✅ **Always review generated SQL** before committing
2. ✅ **Test migrations on staging** before production
3. ✅ **Backup production database** before major migrations
4. ✅ **Use descriptive migration names**
5. ❌ **Never edit applied migrations**
6. ❌ **Never use \`migrate reset\` in production**

## Next Steps

- [Configuration](/configuration) - Database connection setup
- [Troubleshooting](/troubleshooting) - Migration error solutions

---

**Last Updated**: 2025-11-10
**Version**: 1.0`,
    },
  }),
]);

console.log(\`✓ Created \${childPages.length} child pages under "Development Guides"\n\`);

// CREATE CROSS-LINKS BETWEEN PAGES
console.log('🔗 Creating page links...');

await prisma.pageLink.createMany({
  data: [
    // Getting Started → Configuration
    {
      sourcePageId: rootPages[0].id,
      targetPageId: rootPages[1].id,
    },
    // Getting Started → Docker Setup
    {
      sourcePageId: rootPages[0].id,
      targetPageId: childPages[0].id,
    },
    // Configuration → Docker Setup
    {
      sourcePageId: rootPages[1].id,
      targetPageId: childPages[0].id,
    },
    // Configuration → Database Migrations
    {
      sourcePageId: rootPages[1].id,
      targetPageId: childPages[1].id,
    },
    // API Documentation → Troubleshooting
    {
      sourcePageId: rootPages[3].id,
      targetPageId: rootPages[4].id,
    },
    // Troubleshooting → Configuration
    {
      sourcePageId: rootPages[4].id,
      targetPageId: rootPages[1].id,
    },
    // Troubleshooting → Docker Setup
    {
      sourcePageId: rootPages[4].id,
      targetPageId: childPages[0].id,
    },
  ],
});

console.log(\`✓ Created 7 page links\n\`);

console.log(\`✓ Wiki seeding complete: \${rootPages.length + childPages.length} pages total\n\`);
```

---

## Database Integrity Verification

### Validation Queries

After seeding, verify data integrity:

```sql
-- Check all pages created
SELECT id, title, path, category, "parentId", "orderIndex"
FROM wiki_pages
ORDER BY "orderIndex", id;

-- Check hierarchical structure
SELECT
  p.id as parent_id,
  p.title as parent_title,
  c.id as child_id,
  c.title as child_title
FROM wiki_pages p
LEFT JOIN wiki_pages c ON c."parentId" = p.id
ORDER BY p.id, c."orderIndex";

-- Check page links
SELECT
  pl.id,
  s.title as source_page,
  t.title as target_page
FROM page_links pl
JOIN wiki_pages s ON pl."sourcePageId" = s.id
JOIN wiki_pages t ON pl."targetPageId" = t.id;

-- Check category distribution
SELECT category, COUNT(*) as page_count
FROM wiki_pages
GROUP BY category
ORDER BY page_count DESC;

-- Check unique path constraint
SELECT path, COUNT(*) as duplicate_count
FROM wiki_pages
GROUP BY path
HAVING COUNT(*) > 1;  -- Should return empty (no duplicates)
```

---

## Testing Recommendations

### Manual Testing via Prisma Studio

```bash
pnpm prisma studio
```

**Verify**:
1. ✅ All 7 pages exist
2. ✅ Hierarchical structure (parentId set correctly)
3. ✅ Categories assigned
4. ✅ Paths are unique
5. ✅ orderIndex values correct
6. ✅ PageLinks created

### API Testing

```bash
# Get all pages
curl http://localhost:3000/api/wiki

# Get specific page
curl http://localhost:3000/api/wiki/getting-started

# Filter by category
curl http://localhost:3000/api/wiki?category=guides
```

### Integration Test (Future)

```typescript
// __tests__/seed-wiki.test.ts
import { prisma } from '@/lib/db';

describe('WikiPage Seed Data', () => {
  it('should create 7 wiki pages', async () => {
    const count = await prisma.wikiPage.count();
    expect(count).toBe(7);
  });

  it('should have correct hierarchical structure', async () => {
    const guides = await prisma.wikiPage.findFirst({
      where: { path: '/guides' },
      include: { children: true },
    });
    expect(guides?.children).toHaveLength(2);
  });

  it('should have unique paths', async () => {
    const pages = await prisma.wikiPage.findMany();
    const paths = pages.map(p => p.path);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(paths.length);
  });
});
```

---

## Migration Impact

**No migration required** - WikiPage model already exists

**Verification**:
```bash
pnpm prisma migrate status
# Should show: "Database schema is up to date!"
```

---

## Performance Considerations

### Indexes (Already Defined)

```prisma
@@index([path])        // Fast path lookup
@@index([parentId])    // Fast child page queries
@@index([orderIndex])  // Fast ordering queries
@@index([category])    // Fast category filters
```

**Query Performance**:
- ✅ Path lookup: O(1) with unique index
- ✅ Category filter: O(log n) with B-tree index
- ✅ Hierarchical queries: O(1) per level with parentId index

### Full-Text Search (Future)

```sql
-- PostgreSQL trigger to populate searchVector (Phase 3)
CREATE OR REPLACE FUNCTION update_wiki_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', NEW.title), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wiki_search_vector_update
BEFORE INSERT OR UPDATE ON wiki_pages
FOR EACH ROW EXECUTE FUNCTION update_wiki_search_vector();

-- Index for fast search
CREATE INDEX idx_wiki_search_vector ON wiki_pages USING GIN(search_vector);
```

---

## Next Steps for Parent Agent

### Implementation Checklist

1. **Update seed.ts** (5-10 minutes)
   - Replace existing wiki seed section (lines 658-759)
   - Use the complete seed code provided above
   - Verify no syntax errors

2. **Run seed script** (1-2 minutes)
   ```bash
   cd f:\Web_Projects\AI_HUB\apps\web
   pnpm prisma db seed
   ```

3. **Verify in Prisma Studio** (2-3 minutes)
   ```bash
   pnpm prisma studio
   ```
   - Check wiki_pages table (7 rows)
   - Check page_links table (7 rows)
   - Verify hierarchical structure

4. **Test via API** (Optional, 5 minutes)
   ```bash
   curl http://localhost:3000/api/wiki
   curl http://localhost:3000/api/wiki/getting-started
   ```

5. **Commit changes** (2 minutes)
   ```bash
   git add apps/web/prisma/seed.ts
   git commit -m "feat(seed): add comprehensive WikiPage seed data (US-015)

   - Created 7 wiki pages demonstrating hierarchical structure
   - Categories: getting-started, guides, reference, troubleshooting
   - 5 root pages + 2 child pages under Development Guides
   - Added 7 cross-links between related pages
   - Content includes: Getting Started, Configuration, Docker Setup, API Docs, Troubleshooting"
   ```

6. **Update session file** (1 minute)
   - Mark US-015 as complete in current-session.md
   - Update progress percentage

---

## Summary

**Category Structure**: ✅ Use String (extensible), 5 suggested categories
**Content Length**: ✅ 500-1500 words, realistic documentation
**Slug Strategy**: ✅ Manual paths in seed, auto-generate in production
**createdBy Field**: ✅ Not needed (field doesn't exist in model)
**Project Linking**: ✅ Wiki is system-wide (no projectId)
**Seed Pattern**: ✅ Hierarchical creation with Promise.all + cross-linking

**Token Cost**: ~45K tokens (design plan)
**Implementation Time**: ~15-20 minutes total
**Complexity**: Medium (hierarchical relations + cross-linking)

---

**Design complete. Ready for parent agent implementation.** ✅
