# MCP Tools Guide

**Last Updated**: 2025-10-26
**Purpose**: Reference guide for all MCP (Model Context Protocol) tools available to Claude Code
**Status**: Core tools configured - DevHub-specific tools pending

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

**Last Updated:** 2025-10-26
**MCP Status:** Core tools configured
**Next:** Custom DevHub MCP server (Week 2+)

**See also**: [STATUS.md](../../STATUS.md) for current project status
