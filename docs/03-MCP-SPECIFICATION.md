# COMPLETE IMPLEMENTATION GUIDE

## ProjectPulse - Final Documentation

**This document consolidates:** MCP Specification, Implementation Guide, UI Architecture, and Agent Personas  
**Version:** 1.0 Final  
**Last Updated:** October 23, 2025

---

## 📋 TABLE OF CONTENTS

1. [MCP Specification](#mcp-specification)
2. [Implementation Guide (Week-by-Week)](#implementation-guide)
3. [UI Architecture & Design System](#ui-architecture)
4. [Agent Personas System](#agent-personas)

---

# MCP SPECIFICATION

## 🔧 MCP Tools (25+ Tools)

### Issue Management Tools

#### 1. create_issue

**Purpose:** Create a new issue

```typescript
{
  name: "create_issue",
  description: "Create a new issue in the issue tracker",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Issue title" },
      description: { type: "string", description: "Detailed description (Markdown)" },
      priority: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        default: "medium"
      },
      module: {
        type: "string",
        enum: ["Combat", "Core", "UI", "Systems", "World", "Creatures"]
      },
      labels: { type: "array", items: { type: "string" } },
      customFields: { type: "object" },
      linkedFiles: { type: "array", items: { type: "string" } }
    },
    required: ["title"]
  }
}
```

**Implementation:**

```typescript
// MCP Server
async function createIssue(args) {
  const response = await axios.post('http://localhost:3000/api/issues', {
    title: args.title,
    description: args.description,
    priority: args.priority || 'medium',
    module: args.module,
    labels: args.labels || [],
    customFields: args.customFields || {},
  });

  return {
    content: [{ type: 'text', text: `Created issue #${response.data.id}: ${response.data.title}` }],
  };
}
```

#### 2. search_issues

```typescript
{
  name: "search_issues",
  inputSchema: {
    properties: {
      query: { type: "string" },
      status: { type: "string", enum: ["open", "in-progress", "closed", "all"] },
      priority: { type: "string" },
      module: { type: "string" },
      labels: { type: "array" },
      limit: { type: "number", default: 20 }
    }
  }
}
```

#### 3. update_issue

```typescript
{
  name: "update_issue",
  inputSchema: {
    properties: {
      issueId: { type: "number" },
      title: { type: "string" },
      description: { type: "string" },
      status: { type: "string" },
      priority: { type: "string" },
      customFields: { type: "object" }
    },
    required: ["issueId"]
  }
}
```

#### 4. add_comment

```typescript
{
  name: "add_comment",
  inputSchema: {
    properties: {
      issueId: { type: "number" },
      content: { type: "string" },
      author: { type: "string" }
    },
    required: ["issueId", "content"]
  }
}
```

#### 5. link_issue_to_files

```typescript
{
  name: "link_issue_to_files",
  inputSchema: {
    properties: {
      issueId: { type: "number" },
      filePaths: { type: "array", items: { type: "string" } },
      lineNumbers: { type: "array", items: { type: "number" } }
    },
    required: ["issueId", "filePaths"]
  }
}
```

#### 6. link_issue_to_commit

```typescript
{
  name: "link_issue_to_commit",
  inputSchema: {
    properties: {
      issueId: { type: "number" },
      commitHash: { type: "string" },
      commitMessage: { type: "string" }
    },
    required: ["issueId", "commitHash"]
  }
}
```

### Knowledge Base Tools

#### 7. store_knowledge

```typescript
{
  name: "store_knowledge",
  inputSchema: {
    properties: {
      title: { type: "string" },
      content: { type: "string" },
      category: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      linkedIssueIds: { type: "array", items: { type: "number" } }
    },
    required: ["title", "content"]
  }
}
```

#### 8. search_knowledge

```typescript
{
  name: "search_knowledge",
  inputSchema: {
    properties: {
      query: { type: "string" },
      category: { type: "string" },
      tags: { type: "array" },
      semantic: { type: "boolean", default: true },
      limit: { type: "number", default: 10 }
    },
    required: ["query"]
  }
}
```

#### 9. retrieve_knowledge

```typescript
{
  name: "retrieve_knowledge",
  inputSchema: {
    properties: {
      knowledgeId: { type: "number" }
    },
    required: ["knowledgeId"]
  }
}
```

### Wiki Tools

#### 10. create_wiki_page

```typescript
{
  name: "create_wiki_page",
  inputSchema: {
    properties: {
      title: { type: "string" },
      content: { type: "string" },
      parentPath: { type: "string" },
      path: { type: "string" }
    },
    required: ["title", "content", "path"]
  }
}
```

#### 11. read_wiki_page

```typescript
{
  name: "read_wiki_page",
  inputSchema: {
    properties: {
      path: { type: "string" }
    },
    required: ["path"]
  }
}
```

#### 12. search_wiki

```typescript
{
  name: "search_wiki",
  inputSchema: {
    properties: {
      query: { type: "string" },
      limit: { type: "number", default: 10 }
    },
    required: ["query"]
  }
}
```

#### 13. query_sot_rules

```typescript
{
  name: "query_sot_rules",
  inputSchema: {
    properties: {
      module: { type: "string" },
      category: { type: "string" },
      query: { type: "string" }
    }
  }
}
```

### Security Tools

#### 14. run_security_scan

```typescript
{
  name: "run_security_scan",
  inputSchema: {
    properties: {
      targetPath: { type: "string" },
      autoCreateIssues: { type: "boolean", default: true }
    },
    required: ["targetPath"]
  }
}
```

#### 15. get_security_findings

```typescript
{
  name: "get_security_findings",
  inputSchema: {
    properties: {
      severity: { type: "string", enum: ["ERROR", "WARNING", "INFO", "all"] },
      status: { type: "string", enum: ["open", "fixed", "false_positive"] },
      limit: { type: "number", default: 20 }
    }
  }
}
```

### Helper Script Tools

#### 16. execute_helper_script

```typescript
{
  name: "execute_helper_script",
  inputSchema: {
    properties: {
      scriptPath: { type: "string" },
      args: { type: "array", items: { type: "string" } },
      tier: {
        type: "string",
        enum: ["read_only", "create_issues", "direct"],
        default: "read_only"
      }
    },
    required: ["scriptPath"]
  }
}
```

### Search & Reports

#### 17. hybrid_search

```typescript
{
  name: "hybrid_search",
  inputSchema: {
    properties: {
      query: { type: "string" },
      types: {
        type: "array",
        items: { type: "string", enum: ["issues", "knowledge", "wiki"] },
        default: ["issues", "knowledge", "wiki"]
      },
      limit: { type: "number", default: 20 }
    },
    required: ["query"]
  }
}
```

#### 18. generate_report

```typescript
{
  name: "generate_report",
  inputSchema: {
    properties: {
      type: {
        type: "string",
        enum: ["module_health", "bug_summary", "velocity", "security"]
      },
      module: { type: "string" },
      timeframe: { type: "string", enum: ["week", "month", "quarter"] }
    },
    required: ["type"]
  }
}
```

---

## 📚 MCP Resources (Context Injection)

### 1. current_project_context

```typescript
{
  uri: "moksha://context/project",
  name: "Current Project Context",
  description: "Overview of current project state",
  mimeType: "text/plain"
}
```

**Returns:**

```
Moksha Mythic Clash - Development Context

Open Issues: 42
- Combat: 15 (3 critical)
- Core: 12 (1 critical)
- UI: 8
- Systems: 7

Recent Changes (last 7 days):
- 12 issues closed
- 8 new issues created
- 3 security findings

Active Modules:
- Combat (FSM refactor in progress)
- Animation (state machine integration)
```

### 2. recent_issues

```typescript
{
  uri: "moksha://context/issues/recent",
  name: "Recent Issues",
  description: "Last 10 issues created or updated"
}
```

### 3. sot_rules_summary

```typescript
{
  uri: "moksha://context/sot-rules",
  name: "SoT Rules Summary",
  description: "Summary of relevant SoT rules for current context"
}
```

### 4. knowledge_index

```typescript
{
  uri: "moksha://context/knowledge",
  name: "Knowledge Base Index",
  description: "Index of all knowledge items by category"
}
```

### 5. security_status

```typescript
{
  uri: "moksha://context/security",
  name: "Security Status",
  description: "Current security findings and status"
}
```

---

## 🤖 MCP Prompts (Agent Personas)

### 1. code_reviewer

```typescript
{
  name: "code_reviewer",
  description: "Critical code analysis with SoT compliance",
  arguments: [
    { name: "file_path", description: "File to review", required: true },
    { name: "focus_areas", description: "Areas to focus on", required: false }
  ]
}
```

**Prompt Template:**

```
You are an expert code reviewer for the Moksha project.

CONTEXT:
{{current_project_context}}
{{sot_rules_summary}}

FILE TO REVIEW:
{{file_path}}

FOCUS AREAS:
{{focus_areas}}

YOUR TASK:
1. Review the code for:
   - Security vulnerabilities
   - SoT rule violations
   - Code quality issues
   - Performance problems
   - Module dependency violations

2. Always cite specific SoT rules when suggesting changes
3. Provide concrete code examples
4. Suggest tests if applicable
5. Create issues for critical problems using create_issue tool

RULES:
- Be thorough but constructive
- Cite specific line numbers
- Explain WHY something is a problem
- Suggest concrete improvements
```

### 2. bug_hunter

```typescript
{
  name: "bug_hunter",
  description: "Root cause analysis and debugging",
  arguments: [
    { name: "bug_description", required: true },
    { name: "affected_modules", required: false }
  ]
}
```

### 3. feature_architect

```typescript
{
  name: "feature_architect",
  description: "System design and architecture planning",
  arguments: [
    { name: "feature_description", required: true },
    { name: "affected_modules", required: false }
  ]
}
```

### 4. security_auditor

```typescript
{
  name: "security_auditor",
  description: "Security analysis and threat modeling",
  arguments: [
    { name: "target_path", required: true },
    { name: "severity_threshold", required: false }
  ]
}
```

### 5. docs_writer

```typescript
{
  name: "docs_writer",
  description: "Technical documentation and tutorials",
  arguments: [
    { name: "topic", required: true },
    { name: "target_audience", required: false }
  ]
}
```

---

# IMPLEMENTATION GUIDE

## 🗓️ Week-by-Week Breakdown

### MVP (Weeks 1-4, 60-68 hours)

#### Week 1: Foundation (14 hours)

**Goal:** Docker + Database + Basic API + Basic UI

**Day 1 (3 hours):**

- Install Docker Desktop
- Create project structure
- Setup docker-compose.yml
- Start PostgreSQL
- Verify database connection

**Day 2 (3 hours):**

- Initialize Next.js app
- Setup Prisma schema
- Run initial migration
- Create basic API routes (/api/issues)
- Test API with Postman/curl

**Day 3 (4 hours):**

- Create app shell (sidebar + header)
- Build issue list page
- Implement basic filtering
- Add dark mode toggle

**Day 4 (4 hours):**

- Create issue detail page
- Build issue creation form
- Add comment functionality
- Test full CRUD workflow

**Week 1 Deliverables:**

- ✅ Docker running PostgreSQL + Next.js
- ✅ Basic issue tracker working
- ✅ Can create, view, edit, delete issues
- ✅ Comments work
- ✅ Accessible from Mac Mini

---

#### Week 2: Core Features (14 hours)

**Goal:** Attachments + Custom Fields + Labels + Filters

**Day 1 (3 hours):**

- Implement file upload (attachments)
- Create attachment API endpoints
- Add attachment UI to issue detail
- Test file upload/download

**Day 2 (3 hours):**

- Build custom fields UI
- Implement JSONB storage
- Add custom field editor
- Test custom field queries

**Day 3 (4 hours):**

- Create label management
- Add label selector to forms
- Implement label filtering
- Color picker for labels

**Day 4 (4 hours):**

- Build advanced filters (module, priority, status)
- Add sort options
- Implement bulk actions
- Polish UI

**Week 2 Deliverables:**

- ✅ File attachments working
- ✅ Custom fields configurable
- ✅ Labels with colors
- ✅ Advanced filtering

---

#### Week 3: Search (14 hours)

**Goal:** Full-text + Semantic + Hybrid Search

**Day 1 (3 hours):**

- Setup pgvector extension
- Create embedding generation function
- Test local embeddings (@xenova/transformers)

**Day 2 (3 hours):**

- Implement full-text search
- Create tsvector indexes
- Build search API endpoint

**Day 3 (4 hours):**

- Implement semantic search
- Store embeddings on create/update
- Build hybrid search merging logic

**Day 4 (4 hours):**

- Create global search UI
- Add search results page
- Implement search highlighting
- Test search performance

**Week 3 Deliverables:**

- ✅ Full-text search working
- ✅ Semantic search working
- ✅ Hybrid search combines both
- ✅ Fast search results

---

#### Week 4: MCP Integration (18-20 hours)

**Goal:** Full MCP server with tools

**Day 1 (4 hours):**

- Setup MCP server project
- Install @modelcontextprotocol/sdk
- Create basic server structure
- Test stdio transport

**Day 2 (4 hours):**

- Implement issue tools (create, search, update)
- Test with Claude Code
- Debug MCP communication

**Day 3 (4 hours):**

- Add knowledge & wiki tools
- Implement context resources
- Test resource retrieval

**Day 4 (4 hours):**

- Implement agent personas prompts
- Add helper script execution (tiered)
- Create security scan tool
- Full integration test

**Day 5 (2-4 hours):**

- Polish & bug fixes
- Documentation
- Create demo video

**Week 4 Deliverables:**

- ✅ MCP server running
- ✅ Claude Code can create issues
- ✅ All core tools working
- ✅ Personas selectable via slash commands
- ✅ MVP COMPLETE!

---

### Phase 2: Knowledge Base + Personas (Weeks 5-8, 40 hours)

#### Week 5: Knowledge Base (10 hours)

- Create knowledge_items table with embeddings
- Build knowledge CRUD API
- Rich text editor (TipTap)
- Code syntax highlighting
- Category & tag system

#### Week 6: Semantic Search (10 hours)

- Implement knowledge embedding generation
- Vector search optimization
- "Find similar" feature
- Knowledge-issue linking

#### Week 7: Agent Personas UI (10 hours)

- Persona management page
- Persona editor with system prompt
- Auto-activation conditions
- Usage tracking dashboard

#### Week 8: MCP Resources (10 hours)

- Implement all MCP resources
- Context auto-injection
- Recent changes resource
- SoT rules context

**Phase 2 Deliverables:**

- ✅ Knowledge base with semantic search
- ✅ Agent personas fully working
- ✅ Context injection via resources
- ✅ Command palette (Cmd+K)

---

### Phase 3: Wiki + Security (Weeks 9-12, 50 hours)

#### Week 9: Wiki Foundation (12 hours)

- Hierarchical wiki_pages table
- Wiki page CRUD
- Tree navigation sidebar
- Markdown editor

#### Week 10: Wiki Features (12 hours)

- Page linking system
- Cross-references
- Version history (basic)
- SoT rule templates

#### Week 11: Security Dashboard (13 hours)

- Semgrep integration
- Security findings table
- Auto-create issues from findings
- Security status dashboard
- False positive marking

#### Week 12: Reports (13 hours)

- Module health report
- Bug summary report
- Velocity tracking
- Security trend analysis

**Phase 3 Deliverables:**

- ✅ Documentation wiki
- ✅ Security scanning
- ✅ Reports & analytics
- ✅ Full SoT rule documentation

---

### Phase 4: Advanced Features (Weeks 13-16, 60 hours)

#### Week 13: Git Integration (15 hours)

- Auto-link commits (Fix #42)
- Commit timeline
- Branch tracking
- Blame view integration

#### Week 14: Milestones (15 hours)

- Milestone management
- Progress tracking
- Burndown charts
- Sprint planning

#### Week 15: Templates (15 hours)

- Issue templates
- Wiki page templates
- Prompt templates
- ADR templates

#### Week 16: ADRs (15 hours)

- Architecture Decision Records
- ADR workflow
- Status tracking
- Superseded decisions

**Phase 4 Deliverables:**

- ✅ Git deeply integrated
- ✅ Milestones & sprints
- ✅ Template system
- ✅ ADR tracking

---

# UI ARCHITECTURE

## 🎨 Design System

### Foundation: shadcn/ui + Tailwind CSS

**Colors:**

```css
/* Dark Mode (default) */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--primary: 217.2 91.2% 59.8%;
--secondary: 217.2 32.6% 17.5%;
--accent: 217.2 32.6% 17.5%;
--destructive: 0 62.8% 30.6%;

/* Light Mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
```

### Typography

```css
/* Font Family */
font-sans: Inter, system-ui, sans-serif;
font-mono: 'Fira Code', monospace;

/* Font Sizes */
text-xs: 0.75rem;
text-sm: 0.875rem;
text-base: 1rem;
text-lg: 1.125rem;
text-xl: 1.25rem;
text-2xl: 1.5rem;
text-3xl: 1.875rem;
text-4xl: 2.25rem;
```

### Spacing

```css
/* Following 8px grid */
0.5: 0.125rem (2px)
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
6: 1.5rem (24px)
8: 2rem (32px)
```

---

## 🧩 Component Library

### Layout Components

**AppShell:**

```tsx
<AppShell>
  <Sidebar />
  <div className="flex-1">
    <Header />
    <main>{children}</main>
  </div>
</AppShell>
```

**Sidebar:**

```tsx
<Sidebar>
  <SidebarHeader />
  <SidebarNav items={navigation} />
  <SidebarFooter />
</Sidebar>
```

### Data Display

**IssueCard:**

```tsx
<IssueCard
  issue={issue}
  showLabels={true}
  showModule={true}
  onClick={() => router.push(`/issues/${issue.id}`)}
/>
```

**KnowledgeCard:**

```tsx
<KnowledgeCard item={item} showTags={true} showCategory={true} similarity={0.85} />
```

### Forms

**IssueForm:**

```tsx
<IssueForm
  mode="create" // or "edit"
  initialData={issue}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### Editors

**RichTextEditor (TipTap):**

```tsx
<RichTextEditor
  content={content}
  onChange={setContent}
  placeholder="Write something..."
  extensions={[
    StarterKit,
    CodeBlockLowlight,
    Slash, // For slash commands
  ]}
/>
```

### Command Palette

```tsx
<CommandPalette open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandGroup heading="Actions">
      <CommandItem onSelect={createIssue}>
        <PlusIcon /> Create Issue
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Personas">
      <CommandItem onSelect={() => activatePersona('code-reviewer')}>🔍 Code Reviewer</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandPalette>
```

---

## 📱 Page Layouts

### Issue List Page

```
┌─────────────────────────────────────────────────────┐
│ Header: "Issues" [New Issue Button]                │
├─────────────────────────────────────────────────────┤
│ Filters: [Status] [Priority] [Module] [Labels]     │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Issue List                               │
│ (Filters)│ ┌──────────────────────────────────────┐ │
│          │ │ #42 Fix Combat FSM Bug               │ │
│ Status   │ │ ⚡ high  ðŸ"¦ Combat  ðŸ· fsm          │ │
│ □ Open   │ └──────────────────────────────────────┘ │
│ □ Closed │ ┌──────────────────────────────────────┐ │
│          │ │ #41 Update Animation State Machine   │ │
│ Priority │ │ ⚠️ medium  ðŸ"¦ Animation            │ │
│ □ High   │ └──────────────────────────────────────┘ │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Issue Detail Page

```
┌─────────────────────────────────────────────────────┐
│ #42 Fix Combat FSM Bug                [Edit] [Del]  │
├─────────────────────────────────────────────────────┤
│ Status: Open  Priority: High  Module: Combat        │
│ Labels: fsm, bug, combat                            │
├─────────────────────────────────────────────────────┤
│ Description:                                        │
│ The combat FSM violates authority rules...          │
├─────────────────────────────────────────────────────┤
│ Comments (3)                                        │
│ ├─ Alice: I can reproduce this...                  │
│ ├─ Bob: Here's a potential fix...                  │
│ └─ Charlie: Confirmed fixed in PR #123             │
├─────────────────────────────────────────────────────┤
│ Attachments (2)                                     │
│ ├─ screenshot.png                                   │
│ └─ log.txt                                          │
├─────────────────────────────────────────────────────┤
│ Linked Files                                        │
│ ├─ Source/Combat/CombatFSM.cpp:142                │
│ └─ Source/Core/StateMachine.h:67                   │
└─────────────────────────────────────────────────────┘
```

---

# AGENT PERSONAS

## 🤖 Persona System Architecture

### Database Models

```prisma
model AgentPersona {
  id                Int       @id @default(autoincrement())
  name              String    @unique
  slug              String    @unique
  icon              String?
  description       String?
  systemPrompt      String    @db.Text
  skills            String[]
  tools             String[]
  rules             String[]
  autoActivate      Boolean   @default(false)
  activationConditions Json?  @db.JsonB
  isBuiltIn         Boolean   @default(false)

  sessions          AgentSession[]
  templateId        Int?
  template          PromptTemplate?
}
```

### Default Personas

#### 1. Code Reviewer 🔍

```yaml
Slug: code-reviewer
Skills: [security, patterns, architecture, debugging]
Tools: [create_issue, search_knowledge, query_sot_rules]
Rules:
  - Always cite specific SoT rules
  - Check for security vulnerabilities
  - Look for module dependency violations
  - Suggest concrete improvements with examples
Auto-Activate: true
Conditions:
  filePatterns: ['*.cpp', '*.h']
  keywords: ['review', 'check']
```

#### 2. Bug Hunter 🐛

```yaml
Slug: bug-hunter
Skills: [debugging, root-cause-analysis, testing]
Tools: [search_issues, create_issue, search_knowledge]
Rules:
  - Always reproduce the bug first
  - Identify root cause, not symptoms
  - Suggest tests to prevent regression
  - Check for similar bugs in other modules
```

#### 3. Feature Architect 🏗️

```yaml
Slug: feature-architect
Skills: [architecture, system-design, data-modeling]
Tools: [create_wiki_page, store_knowledge, create_issue]
Rules:
  - Consider all affected modules
  - Document architectural decisions
  - Think about scalability
  - Propose alternatives and trade-offs
```

#### 4. Security Auditor 🔒

```yaml
Slug: security-auditor
Skills: [security, owasp, threat-modeling]
Tools: [run_security_scan, create_issue, search_knowledge]
Rules:
  - Always suggest secure alternatives
  - Cite OWASP guidelines
  - Check for common vulnerabilities
  - Consider worst-case scenarios
```

#### 5. Docs Writer 📝

```yaml
Slug: docs-writer
Skills: [technical-writing, tutorials, examples]
Tools: [create_wiki_page, update_wiki_page, store_knowledge]
Rules:
  - Write for beginners
  - Include code examples
  - Add diagrams when helpful
  - Cross-reference related docs
```

---

## 🎯 Using Personas

### Via Slash Commands

```
In Claude Code:
/code-reviewer src/Combat/CombatFSM.cpp

Claude activates Code Reviewer persona and reviews the file
```

### Via Command Palette (Cmd+K)

```
1. Press Cmd+K
2. Type "Code Reviewer"
3. Select persona
4. Claude asks for context (file path, description, etc.)
5. Persona activates with full context
```

### Auto-Activation

```
User opens CombatFSM.cpp
→ Code Reviewer persona auto-activates (matches *.cpp pattern)
→ Claude offers to review the file
```

---

## 📊 Usage Tracking

```prisma
model AgentSession {
  id              Int       @id @default(autoincrement())
  personaId       Int
  persona         AgentPersona
  activatedBy     String?   // "slash_command", "auto", "cmd_k"
  context         Json?
  duration        Int?
  toolCalls       Int       @default(0)
  issuesCreated   Int       @default(0)
  startedAt       DateTime  @default(now())
  endedAt         DateTime?
}
```

**Analytics Dashboard:**

- Most used personas
- Average session duration
- Tools used per persona
- Issues created by persona
- Effectiveness metrics

---

## ✅ Implementation Checklist

### MVP (Week 4)

- [ ] Basic MCP server running
- [ ] `create_issue` tool working
- [ ] `search_issues` tool working
- [ ] `update_issue` tool working
- [ ] Claude Code can create issues

### Phase 2 (Week 8)

- [ ] All MCP tools implemented
- [ ] MCP resources for context
- [ ] Agent personas database models
- [ ] 5 default personas created
- [ ] Persona management UI
- [ ] Slash command support
- [ ] Command palette integration
- [ ] Auto-activation working
- [ ] Usage tracking dashboard

### Phase 3 (Week 12)

- [ ] Wiki tools integrated
- [ ] Security scan tool working
- [ ] SoT rules queryable
- [ ] Report generation working

### Phase 4 (Week 16)

- [ ] Git integration complete
- [ ] All advanced tools working
- [ ] Custom personas easy to create
- [ ] Full documentation

---

## 🚀 Quick Reference

### Starting Development

```bash
docker-compose up -d
cd apps/web && pnpm dev
cd apps/mcp-server && pnpm dev
```

### Creating Issues (via MCP)

```
In Claude Code:
"Create an issue for the FSM authority bug in Combat module"

Claude uses create_issue tool automatically
```

### Activating Personas

```
/code-reviewer → Reviews code
/bug-hunter → Analyzes bugs
/docs-writer → Creates documentation
```

---

**Complete implementation guide ready! Build something amazing! 🚀**
