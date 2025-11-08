# MCP Tools Guide

**Last Updated**: 2025-11-08
**Purpose**: Reference guide for all MCP (Model Context Protocol) tools available to Claude Code
**Status**: Core tools configured + ProjectPulse tools active (Sprint 1 Week 1 complete)

---

## Quick Index

**Memory & Knowledge**:

- [memory](#memory) - Knowledge graph and memory management

**File Operations**:

- [filesystem](#filesystem) - File and directory operations

**Version Control**:

- [git](#git) - Git operations
- [gitkraken](#gitkraken) - GitKraken integration (issues, PRs, repos)

**Database**:

- [postgres](#postgres) - PostgreSQL database queries

**Browser Automation**:

- [playwright](#playwright) - Web browser automation and testing

**Development Tools**:

- [docker-devhub](#docker-devhub) - Docker container management
- [sequential-thinking](#sequential-thinking) - Complex problem solving

**ProjectPulse Tools**:

- [projectpulse](#projectpulse-mcp-server) - Sprint and task management (2 tools active)

---

## Memory

**Server**: `byterover` (memory/knowledge retrieval)
**When to use**: Store and retrieve project knowledge, create knowledge graphs

### Available Tools

#### `create_entities`

Create new entities in knowledge graph

**Example**:

```typescript
// Store information about a new feature
create_entities({
  entities: [
    {
      name: 'Issue Tracker',
      entityType: 'feature',
      observations: [
        'Implemented in Week 1 Day 3',
        'Uses Prisma for database',
        'Supports full-text search',
      ],
    },
  ],
});
```

#### `create_relations`

Create relationships between entities

**Example**:

```typescript
create_relations({
  relations: [
    {
      from: 'Issue Tracker',
      to: 'Prisma',
      relationType: 'uses',
    },
  ],
});
```

#### `search_nodes`

Search knowledge graph

**Example**:

```typescript
search_nodes({
  query: 'authentication',
});
```

**When to use**:

- Storing project decisions and context
- Creating knowledge base of implementations
- Remembering past solutions
- Building relationships between concepts

---

## Filesystem

**Server**: `mcp__filesystem`
**When to use**: File and directory operations

### Available Tools

#### `read_text_file`

Read file contents as text

**Example**:

```typescript
read_text_file({
  path: '/path/to/file.ts',
  head: 50, // Optional: first 50 lines only
});
```

#### `write_file`

Create or overwrite a file

**Example**:

```typescript
write_file({
  path: '/path/to/file.ts',
  content: '/* file content */',
});
```

#### `edit_file`

Make line-based edits

**Example**:

```typescript
edit_file({
  path: '/path/to/file.ts',
  edits: [
    {
      oldText: "const theme = 'light'",
      newText: "const theme = 'dark'",
    },
  ],
});
```

#### `list_directory`

List files and directories

**Example**:

```typescript
list_directory({
  path: '/path/to/directory',
});
```

#### `search_files`

Recursively search for files

**Example**:

```typescript
search_files({
  path: '/project',
  pattern: '*.tsx',
  excludePatterns: ['node_modules', '.next'],
});
```

**When to use**:

- Reading/writing code files
- Directory navigation
- File searches
- Batch file operations

**Note**: Prefer Claude Code's built-in Read/Write/Edit tools for better integration

---

## Git

**Server**: `mcp__git`
**When to use**: Git version control operations

### Available Tools

#### `git_status`

Show working tree status

**Example**:

```typescript
git_status({
  repo_path: '/path/to/repo',
});
```

#### `git_diff_unstaged`

Show unstaged changes

**Example**:

```typescript
git_diff_unstaged({
  repo_path: '/path/to/repo',
  context_lines: 3,
});
```

#### `git_commit`

Create a commit

**Example**:

```typescript
git_commit({
  repo_path: '/path/to/repo',
  message: 'feat: add issue tracker',
});
```

#### `git_log`

Show commit history

**Example**:

```typescript
git_log({
  repo_path: '/path/to/repo',
  max_count: 10,
});
```

#### `git_create_branch`

Create a new branch

**Example**:

```typescript
git_create_branch({
  repo_path: '/path/to/repo',
  branch_name: 'feature/new-feature',
  base_branch: 'master',
});
```

**When to use**:

- Checking git status
- Viewing diffs
- Creating commits
- Branch management

**Note**: Follow [git-workflow.md](../sops/git-workflow.md) conventions

---

## GitKraken

**Server**: `mcp__gitkraken`
**When to use**: GitHub/GitLab integration, issues, pull requests

### Available Tools

#### `issues_assigned_to_me`

Get issues assigned to user

**Example**:

```typescript
issues_assigned_to_me({
  provider: 'github',
});
```

#### `issues_get_detail`

Get issue details

**Example**:

```typescript
issues_get_detail({
  provider: 'github',
  repository_name: 'projectpulse',
  repository_organization: 'myorg',
  issue_id: '123',
});
```

#### `pull_request_create`

Create a pull request

**Example**:

```typescript
pull_request_create({
  provider: 'github',
  repository_name: 'projectpulse',
  repository_organization: 'myorg',
  title: 'Add issue tracker',
  source_branch: 'feature/issues',
  target_branch: 'master',
  body: 'Implements issue tracking feature',
});
```

**When to use**:

- Creating/managing GitHub issues
- Creating pull requests
- Reviewing code
- Managing repositories

---

## Postgres

**Server**: `mcp__postgres`
**When to use**: Direct PostgreSQL database queries

### Available Tools

#### `query`

Run read-only SQL query

**Example**:

```typescript
query({
  sql: `
    SELECT * FROM user_preferences
    WHERE theme = 'desert'
    LIMIT 10
  `,
});
```

**When to use**:

- Debugging database state
- Complex queries not supported by Prisma
- Database inspection
- Performance analysis (EXPLAIN)

**Caution**:

- Read-only queries only
- Prefer Prisma for application code
- Use for debugging and analysis

---

## Playwright

**Server**: `mcp__playwright`
**When to use**: Browser automation, E2E testing, UI verification

### Available Tools

#### `browser_navigate`

Navigate to URL

**Example**:

```typescript
browser_navigate({
  url: 'http://localhost:3000',
});
```

#### `browser_snapshot`

Capture accessibility snapshot

**Example**:

```typescript
browser_snapshot();
```

#### `browser_click`

Click an element

**Example**:

```typescript
browser_click({
  element: 'Submit button',
  ref: "button[type='submit']",
});
```

#### `browser_type`

Type text into input

**Example**:

```typescript
browser_type({
  element: 'Search input',
  ref: "input[name='search']",
  text: 'test query',
});
```

#### `browser_take_screenshot`

Capture screenshot

**Example**:

```typescript
browser_take_screenshot({
  filename: 'homepage.png',
  fullPage: true,
});
```

**When to use**:

- E2E testing
- UI verification
- Visual regression testing
- Manual testing automation

---

## Docker DevHub

**Server**: `mcp__docker-devhub`
**When to use**: Docker container management for ProjectPulse

### Available Tools

#### `docker_status`

Show all containers

**Example**:

```typescript
docker_status();
```

#### `docker_logs`

View container logs

**Example**:

```typescript
docker_logs({
  container: 'projectpulse-db',
  tail: 50,
});
```

#### `docker_restart`

Restart a container

**Example**:

```typescript
docker_restart({
  container: 'projectpulse-web',
});
```

#### `docker_compose_status`

Show Docker Compose services

**Example**:

```typescript
docker_compose_status();
```

**When to use**:

- Debugging container issues
- Checking database status
- Restarting services
- Viewing logs

---

## ProjectPulse MCP Server

**Server**: `projectpulse` (Custom MCP server for sprint management)
**When to use**: Sprint and task management operations
**Status**: Active (Sprint 1 Week 1 complete - 2 tools available)

### Available Tools

#### `projectpulse.sprint.phase.create`

Create a new sprint phase with auto-generated child weeks

**Parameters**:

```typescript
{
  title: string,              // Phase title (1-200 chars)
  description?: string,       // Optional description
  startDate: string,          // ISO 8601 date (e.g., "2025-11-10T00:00:00.000Z")
  durationWeeks: number,      // Number of weeks (1-52, default: 4)
  goals?: string[]            // Optional array of phase goals
}
```

**Example**:

```typescript
projectpulse.sprint.phase.create({
  title: 'Phase 2: API Development',
  description: 'Build REST APIs for sprint management',
  startDate: '2025-11-10T00:00:00.000Z',
  durationWeeks: 4,
  goals: [
    'Implement POST /api/phases endpoint',
    'Implement GET /api/tasks/current endpoint',
    'Add performance indexes',
  ],
});
```

**Returns**:

```json
{
  "status": "success",
  "phase": {
    "id": "clxxxx",
    "title": "Phase 2: API Development",
    "startDate": "2025-11-10T00:00:00.000Z",
    "endDate": "2025-12-08T00:00:00.000Z",
    "progress": 0
  },
  "weeks": [
    {
      "id": "clxxxx",
      "title": "Phase 2: API Development - Week 1",
      "startDate": "2025-11-10T00:00:00.000Z",
      "endDate": "2025-11-17T00:00:00.000Z"
    }
    // ... (4 weeks total)
  ]
}
```

**Implementation**:

- **API Endpoint**: `POST /api/phases`
- **Performance**: Uses Prisma nested write (3x faster than manual loops)
- **Auto-Generation**: Automatically creates N child weeks based on duration
- **Atomic**: Single database transaction ensures data consistency

**Source**: [apps/mcp-server/src/tools/sprintPhaseCreate.ts](../../apps/mcp-server/src/tools/sprintPhaseCreate.ts)

---

#### `projectpulse.sprint.getCurrentTask`

Retrieve the currently active task with full hierarchical context

**Parameters**:

```typescript
{
  includeHistory?: boolean    // Include recent session history (default: false)
}
```

**Example**:

```typescript
// Get current task without history
projectpulse.sprint.getCurrentTask({});

// Get current task with session history
projectpulse.sprint.getCurrentTask({
  includeHistory: true,
});
```

**Returns (Task Active)**:

```json
{
  "status": "active_task_found",
  "currentTask": {
    "id": "clxxxx",
    "title": "Implement POST /api/phases endpoint",
    "status": "IN_PROGRESS",
    "progress": "75%"
  },
  "context": {
    "hierarchy": {
      "phase": "Sprint 1: Foundation (58% complete)",
      "week": "Sprint 1 - Week 1 (100% complete)",
      "day": "Day 6-7: Sprint Tools Implementation (85% complete)"
    }
  }
}
```

**Returns (No Active Task)**:

```json
{
  "status": "no_active_task",
  "message": "No task is currently in progress"
}
```

**Implementation**:

- **API Endpoint**: `GET /api/tasks/current?includeHistory={boolean}`
- **Performance**: Uses optimized `select` (52% smaller payload) + critical index on `updatedAt DESC` (100x faster)
- **Query Strategy**: `findFirst` with `status='IN_PROGRESS'` ordered by most recently updated
- **Hierarchy**: Flattened 3-level nested structure (task → day → week → phase)

**Source**: [apps/mcp-server/src/tools/sprintGetCurrentTask.ts](../../apps/mcp-server/src/tools/sprintGetCurrentTask.ts)

---

### When to Use ProjectPulse Tools

**Use `sprint.phase.create` when**:

- Starting a new sprint or phase
- Need to set up sprint structure with weeks
- Planning multi-week development cycles
- Initializing project timeline

**Use `sprint.getCurrentTask` when**:

- Need to know what task is currently in progress
- Want full context of current work (phase → week → day → task)
- Checking sprint progress and hierarchy
- Resuming work after interruption

**Common Workflows**:

```typescript
// 1. Start new phase
projectpulse.sprint.phase.create({
  title: 'Phase 2',
  startDate: '2025-11-10T00:00:00.000Z',
  durationWeeks: 4,
});

// 2. Check current task context
projectpulse.sprint.getCurrentTask({ includeHistory: true });

// 3. Use context to inform next actions
// (e.g., update task progress, create session notes, etc.)
```

**Performance Notes**:

- Both tools optimized for <500ms response time (NFR-019)
- Database indexes added for critical queries
- Prisma nested writes and select patterns for efficiency
- See: `.agent/task/prisma-sprint-tools-20251107-0630.md`

---

## Sequential Thinking

**Server**: `mcp__sequential-thinking`
**When to use**: Complex problem-solving requiring multi-step reasoning

### Available Tools

#### `sequentialthinking`

Step-by-step problem solving

**Example**:

```typescript
sequentialthinking({
  thought: 'First, I need to understand the database schema',
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5,
});
```

**Parameters**:

- `thought`: Current thinking step
- `nextThoughtNeeded`: Whether more steps needed
- `thoughtNumber`: Current step number
- `totalThoughts`: Estimated total steps
- `isRevision`: If revising previous thought
- `revisesThought`: Which thought to revise

**When to use**:

- Complex architecture decisions
- Multi-step debugging
- System design
- Performance optimization planning

---

## Tool Selection Guide

### When to use which tool?

**File Operations**:

- **Prefer**: Claude Code's built-in Read/Write/Edit tools
- **Use filesystem**: Only for advanced operations or batch processing

**Git Operations**:

- **Prefer**: Claude Code's built-in git tools
- **Use mcp\_\_git**: For advanced git operations

**Database Operations**:

- **Prefer**: Prisma (in code)
- **Use postgres**: For debugging, complex queries, EXPLAIN

**Issue/PR Management**:

- **Prefer**: gitkraken tools
- **Manual**: GitHub web interface for complex workflows

**Testing**:

- **Prefer**: Jest/Playwright tests in codebase
- **Use playwright MCP**: For interactive testing, debugging

**Problem Solving**:

- **Simple**: Direct implementation
- **Complex**: Use sequential-thinking for planning

---

## MCP Configuration

**Location**: Claude Code settings (`~/.config/claude-code/` or similar)

**Current servers configured**:

```json
{
  "mcpServers": {
    "memory": {
      /* byterover config */
    },
    "filesystem": {
      /* filesystem config */
    },
    "git": {
      /* git config */
    },
    "gitkraken": {
      /* gitkraken config */
    },
    "postgres": {
      /* postgres config */
    },
    "playwright": {
      /* playwright config */
    },
    "docker-devhub": {
      /* docker config */
    },
    "sequential-thinking": {
      /* thinking config */
    }
  }
}
```

---

## Best Practices

### 1. Tool Efficiency

**Use right tool for the job**:

- File reading → Read tool (not filesystem MCP)
- Git status → Built-in git (not MCP git)
- Database queries → Prisma (not postgres MCP)

**MCP tools are for**:

- Features not in built-in tools
- Integration with external services
- Specialized operations

### 2. Error Handling

**Always handle MCP tool errors**:

```typescript
try {
  const result = await mcp_tool({ ... });
} catch (error) {
  // Handle error
}
```

### 3. Resource Cleanup

**Close resources after use**:

- Browser sessions (playwright)
- Database connections
- File handles

### 4. Security

**Never expose**:

- Database credentials
- API tokens
- Secrets in MCP calls

**Use environment variables**:

```bash
DATABASE_URL=postgresql://...
GITHUB_TOKEN=ghp_...
```

---

## Troubleshooting

### MCP Server Not Responding

**Check server status**:

```bash
# View Claude Code logs
cat ~/.config/claude-code/logs/mcp-servers.log
```

**Restart Claude Code**

### Tool Not Available

**Verify MCP server is configured**:

1. Check Claude Code settings
2. Restart Claude Code
3. Check server logs

### Database Connection Issues

**postgres MCP**:

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### Docker Issues

**docker-devhub MCP**:

- Verify Docker is running: `docker ps`
- Check container names: `docker ps -a`
- Check Docker Compose: `docker-compose ps`

---

## Code Execution vs Traditional MCP

### Traditional MCP (Current Usage)

**How it works:**
1. All tool definitions are sent to the model at session start
2. Model calls tools via function calling
3. Results return through the model context window
4. Repeat for each tool call

**Token costs:**
- Tool definitions: ~500–1000 tokens per tool
- Results: Full content passes back through context
- Example: 9 servers × ~10 tools ≈ ~45K–90K tokens upfront

**Best for:**
- Small tool sets (<20 tools)
- Simple request/response patterns
- Immediate tool availability

### Code Execution MCP (Planned)

**How it works:**
1. Tools organized as filesystem modules (e.g., `./servers/projectpulse/...`)
2. Agent explores directories to discover tools on-demand
3. Agent writes code that imports and calls tools
4. Code executes locally, processes/filters data, returns minimal results

**Token costs:**
- Tool definitions: Loaded only when needed
- Results: Pre-filtered locally before returning to model
- Example: 150K tokens → ~2K tokens (≈98.7% reduction)

**Best for:**
- Large tool sets (current scope: 41 tools; expandable)
- Complex workflows (loops/filtering)
- Privacy-sensitive operations
- Large dataset processing (search/rank/filter)

### When to Use Each Approach

| Use Case                          | Traditional MCP | Code Execution MCP |
|-----------------------------------|-----------------|--------------------|
| Current day-to-day ops            | ✅               | ➖ Planned          |
| ProjectPulse server (41 tools)   | ❌ Context bloat | ✅ Planned Sprint 2 |
| Simple CRUD                       | ✅ Fast          | ⚠️ Overhead         |
| Search/filter large datasets      | ❌ Token heavy   | ✅ Efficient        |
| Privacy-sensitive data processing | ⚠️ Manual        | ✅ Auto-tokenize    |

### Functional Parity Guarantee

All MCP clients receive identical functionality:
- Same 41 tools, same business logic and results
- Same privacy protections (tokenization)
- Same data access (Prisma operations)

Efficiency varies by client capability:
- Traditional mode (ALL clients): 50–70% token reduction (pagination, filtering, compression)
- Code execution mode (Claude Code if supported): 90–98% token reduction (local processing)

### Client Capability Detection (Hybrid)

- Attempt negotiation during handshake (if supported): server `capabilities: { tools: true, codeExecution: true }`, client `supports: { codeExecution: boolean }`
- Fallback via env var: `PP_MCP_MODE=traditional|code-exec|auto` (default: `auto`)
- Probe on first call with session caching; safe default is traditional mode

### Implementation Roadmap

**Sprint 1 (Current):**
- Continue using traditional MCP; focus on core features

**Sprint 2 (Week 5: Design + Traditional POC):**
- Traditional MCP server POC (3 tools: create-issue, search-issues, filter-issues)
- Capability detection design + detection stubs (PP_MCP_MODE + probe)
- Shared services interface definitions (Issue/Privacy/Validation)
- Privacy tokenization specification (document)
- Sandbox security specification (document)
- Multi-client test harness design (mock traditional client + CLI)
- Token usage baseline (traditional mode)

**Sprint 2 (Weeks 6-7):**
- Refine specs; optimize traditional mode (pagination-first, compression, timeouts)
- Document dual-mode patterns; prepare Sprint 3 plan

**Sprint 3 (Integration):**
- Implement code execution environment and wrappers for all tools
- Enable on-demand loading + local filtering for search-heavy tools

**Future:**
- Evaluate wrapping existing servers for heavy operations (e.g., postgres)
- Hybrid: traditional for simple, code execution for complex

**References:**
- Code Execution with MCP – https://www.anthropic.com/engineering/code-execution-with-mcp
- MCP Spec – https://modelcontextprotocol.io
- Architecture – ../../docs/03-Architecture.md
- Design – ../../docs/archive/plans/mcp-code-execution-design.md

---

## Resources

### Documentation

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://docs.claude.com/claude-code/mcp)

### Project Documentation

- [MCP Architecture](../../docs/03-MCP_ARCHITECTURE.md) (when created)
- [DevHub MCP Server](../../apps/mcp-server/) (future implementation)

### Tool-Specific Docs

- [Playwright](https://playwright.dev/)
- [GitKraken](https://www.gitkraken.com/)
- [Prisma](https://www.prisma.io/)

---

**Last Updated:** 2025-11-08
**MCP Status:** Core tools configured + ProjectPulse MCP server active (2 tools)
**Next:** Additional sprint tools (Week 2: task creation, session management)

**See also**: [.agent/progress.md](../progress.md) for current project status
