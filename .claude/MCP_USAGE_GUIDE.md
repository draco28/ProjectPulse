# MCP Tools Usage Guide - ProjectPulse

## Overview

This guide provides practical examples for using all configured MCP tools in the DevHub project. These tools enhance Claude Code's capabilities for database management, Docker operations, file handling, version control, and testing.

## Configured MCP Tools

### ✅ Active Tools

1. **byterover-mcp** - Knowledge/memory management
2. **filesystem** - File operations
3. **sequential-thinking** - Complex reasoning
4. **git** - Version control
5. **playwright** - E2E testing
6. **postgres** - PostgreSQL database queries
7. **docker-devhub** - Docker container management

## PostgreSQL MCP Server

### Tool: postgres

Direct PostgreSQL database access from Claude Code.

**Connection Details:**

- Host: localhost:5432
- Database: moksha_devhub
- User: moksha
- Password: moksha_dev_password_2025

### Usage Examples

#### 1. List All Tables

```
You: "Show me all tables in the DevHub database"
```

**Expected Result:** List of all tables (issues, projects, users, search_vectors, etc.)

#### 2. View Table Schema

```
You: "What's the schema of the issues table?"
You: "Show me the columns in the projects table"
```

**Expected Result:** Column names, types, constraints, indexes

#### 3. Query Data

```
You: "Show me the first 10 open issues"
You: "Count how many projects exist in the database"
You: "Find all high-priority issues"
```

**Expected Result:** Query results with actual data

#### 4. Check Indexes

```
You: "What indexes exist on the issues table?"
You: "Show me all GiST indexes in the database"
```

**Expected Result:** Index information (useful for performance optimization)

#### 5. Verify Migrations

```
You: "Show me the Prisma migrations table"
You: "What's the latest migration that was applied?"
```

**Expected Result:** Migration history

### Common Queries

**Count records:**

```sql
SELECT COUNT(*) FROM issues WHERE status = 'open';
```

**Full-text search test:**

```sql
SELECT id, title
FROM issues
WHERE search_vector @@ to_tsquery('authentication & bug');
```

**Vector similarity (if pgvector data exists):**

```sql
SELECT id, title, embedding <-> '[0.1,0.2,...]'::vector AS distance
FROM search_vectors
ORDER BY distance
LIMIT 5;
```

---

## Docker MCP Server

### Tool: docker-devhub

Manage Docker containers directly from Claude Code.

### Available Tools

1. **docker_status** - View all container statuses
2. **docker_logs** - View container logs
3. **docker_restart** - Restart containers
4. **docker_stats** - Resource usage
5. **docker_inspect** - Detailed container info
6. **docker_compose_status** - Docker Compose services

### Usage Examples

#### 1. Check Container Status

```
You: "Show me the Docker container status"
You: "Are all containers running?"
You: "What containers are currently active?"
```

**Expected Result:**

```
NAMES        STATUS              PORTS
moksha-db    Up 2 hours          0.0.0.0:5432->5432/tcp
moksha-web   Up 2 hours          0.0.0.0:3000->3000/tcp
```

#### 2. View Container Logs

```
You: "Show me the logs for moksha-db"
You: "What are the last 100 lines of moksha-web logs?"
```

**Expected Result:** Recent log entries from the specified container

**Advanced (with tail option):**

```
You: "Show me the last 200 lines of moksha-db logs"
```

#### 3. Restart Container

```
You: "Restart the moksha-db container"
You: "Restart the web server"
```

**Expected Result:** Container restarted successfully

**When to use:**

- After changing environment variables
- After updating database configuration
- When container is unresponsive

#### 4. Check Resource Usage

```
You: "Show Docker resource usage"
You: "How much CPU and memory are the containers using?"
```

**Expected Result:**

```
NAME        CPU %   MEM USAGE       NET I/O
moksha-db   2.5%    150MiB/4GiB     1.2MB/850KB
moksha-web  5.1%    320MiB/4GiB     5.6MB/3.2MB
```

#### 5. Inspect Container

```
You: "Inspect the moksha-db container"
You: "Show me the environment variables for moksha-web"
```

**Expected Result:** Detailed JSON configuration including:

- Environment variables
- Port mappings
- Volume mounts
- Network settings
- Container state

#### 6. Docker Compose Status

```
You: "Show Docker Compose services status"
You: "What services are defined in docker-compose.yml?"
```

**Expected Result:** Status of all services defined in docker-compose.yml

---

## Filesystem MCP Server

### Tool: filesystem

File system operations scoped to the workspace.

### Usage Examples

#### 1. Read File

```
You: "Read the package.json file"
You: "Show me the contents of docs/01-ARCHITECTURE.md"
```

#### 2. Write File

```
You: "Create a new file at apps/web/lib/utils.ts with utility functions"
```

#### 3. List Directory

```
You: "List all files in the apps/web/app directory"
You: "Show me the structure of the .claude directory"
```

#### 4. Search Files

```
You: "Find all TypeScript files that import Prisma"
You: "Search for files containing 'hybrid search'"
```

---

## Git MCP Server

### Tool: git

Version control operations.

### Usage Examples

#### 1. Check Status

```
You: "What's the current git status?"
You: "Show me unstaged changes"
```

#### 2. View Diff

```
You: "Show me the git diff"
You: "What changes are staged?"
```

#### 3. Commit History

```
You: "Show me the last 5 commits"
You: "What was the last commit message?"
```

#### 4. Branch Info

```
You: "What branch am I on?"
You: "List all branches"
```

---

## Playwright MCP Server

### Tool: playwright

End-to-end testing automation.

### Usage Examples

#### 1. Run Tests

```
You: "Run the Playwright tests"
You: "Execute E2E tests for the issue creation flow"
```

#### 2. Test Specific Browser

```
You: "Run Playwright tests in Chrome"
You: "Test on Firefox"
```

#### 3. Debug Mode

```
You: "Run Playwright tests in debug mode"
You: "Show me the test results with screenshots"
```

---

## ByteRover MCP (Knowledge Management)

### Tool: byterover-mcp

Store and retrieve project knowledge.

### Usage Examples

#### 1. Store Knowledge

```
You: "Remember that we use Server Components by default"
You: "Store this pattern for API error handling"
```

#### 2. Retrieve Knowledge

```
You: "What patterns have we used for database queries?"
You: "Remind me how we handle authentication"
```

---

## Sequential Thinking MCP

### Tool: sequential-thinking

Complex multi-step reasoning.

### Usage Examples

#### 1. Problem Solving

```
You: "Help me think through the architecture for hybrid search"
You: "Analyze the trade-offs between these two approaches"
```

#### 2. Planning

```
You: "Break down the steps needed to implement issue filtering"
You: "Plan the testing strategy for the search feature"
```

---

## Workflow Integration Examples

### Example 1: Database Debugging

```
You: "I'm seeing slow queries in the API logs"
→ Use postgres: Check query plans and indexes
→ Use docker-devhub: Check database resource usage
→ Use git: Review recent schema changes
```

### Example 2: Container Issues

```
You: "The web server isn't responding"
→ Use docker-devhub: Check container status
→ Use docker-devhub: View web container logs
→ Use docker-devhub: Restart if needed
```

### Example 3: Feature Implementation

```
You: "Implement hybrid search feature"
→ Use byterover-mcp: Retrieve relevant patterns
→ Use filesystem: Read architecture docs
→ Use postgres: Verify database schema
→ Use git: Check current branch
→ Implement feature
→ Use playwright: Write E2E tests
```

### Example 4: Migration Verification

```
You: "I just ran a Prisma migration"
→ Use postgres: Check migration table
→ Use postgres: Verify new schema
→ Use docker-devhub: Check database logs
→ Use git: Review migration files
```

---

## Activation & Troubleshooting

### Activating MCP Tools

**After configuration changes:**

1. Save `.vscode/settings.json`
2. Reload VS Code window:
   - Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
   - Type "Developer: Reload Window"
   - Press Enter

### Verifying MCP Tools Are Active

```
You: "What MCP tools are available?"
```

**Expected:** List of all 7 configured tools

### Common Issues

#### MCP Tool Not Found

**Symptom:** "Tool X is not available"

**Solutions:**

1. Check `.vscode/settings.json` syntax
2. For postgres: Ensure database is running (`docker ps`)
3. For docker-devhub: Ensure `apps/mcp-docker/dist/index.js` exists
4. Reload VS Code window

#### PostgreSQL Connection Error

**Symptom:** "Cannot connect to database"

**Solutions:**

1. Start Docker containers: `docker-compose up -d`
2. Verify connection string in `.vscode/settings.json`
3. Test manually: `docker exec -it moksha-db psql -U moksha -d moksha_devhub`

#### Docker MCP Not Working

**Symptom:** "Docker commands fail"

**Solutions:**

1. Ensure Docker Desktop is running
2. Rebuild MCP server: `cd apps/mcp-docker && npm run build`
3. Check `dist/index.js` exists
4. Reload VS Code window

---

## Best Practices

### 1. Use Appropriate Tool for Task

- **Database queries** → postgres
- **Container management** → docker-devhub
- **File operations** → filesystem (not bash cat/grep)
- **Version control** → git
- **Testing** → playwright

### 2. Chain Tools for Complex Tasks

```
You: "Debug why search isn't working"
→ postgres: Check if data exists
→ docker-devhub: Check web container logs
→ filesystem: Review search implementation
→ git: Check recent changes to search code
```

### 3. Store Patterns

```
After solving a problem:
You: "Store this debugging approach for future reference"
→ byterover-mcp saves the pattern
```

### 4. Verify Operations

```
After making changes:
→ Use postgres to verify database changes
→ Use docker-devhub to check if services restarted correctly
→ Use git to verify commits
```

---

## Quick Reference Card

| Task                 | Tool                | Example                  |
| -------------------- | ------------------- | ------------------------ |
| Query database       | postgres            | "Show me open issues"    |
| View container logs  | docker-devhub       | "Show moksha-db logs"    |
| Check resource usage | docker-devhub       | "Docker stats"           |
| Restart container    | docker-devhub       | "Restart moksha-web"     |
| Read file            | filesystem          | "Read package.json"      |
| Git status           | git                 | "What's the git status?" |
| Run E2E tests        | playwright          | "Run Playwright tests"   |
| Store knowledge      | byterover-mcp       | "Remember this pattern"  |
| Complex reasoning    | sequential-thinking | "Analyze these options"  |

---

## Next Steps

1. **Reload VS Code** to activate all MCP tools
2. **Test PostgreSQL MCP**: Try `"Show me all tables"`
3. **Test Docker MCP**: Try `"Show container status"`
4. **Explore tools**: Ask `"What can the docker-devhub tool do?"`
5. **Integrate with workflows**: Use tools during development

---

**Last Updated:** January 23, 2025
**Version:** 1.0
**Configured Tools:** 7 (byterover, filesystem, sequential-thinking, git, playwright, postgres, docker-devhub)
