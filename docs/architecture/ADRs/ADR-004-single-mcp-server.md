# ADR-004: Single MCP Server (vs Multiple Servers per Feature)

**Status:** Accepted
**Date:** 2025-11-02
**Decision Makers:** Moksha DevHub Development Team
**Consulted:** Planning session analysis

---

## Context

Need to expose 42 MCP tools across 8 core features.

**Features and Tool Counts:**

1. Sprint/Phase Tracking: 6 tools
2. Workflow Orchestration: 5 tools
3. Issues: 5 tools
4. Knowledge: 5 tools
5. Skills: 4 tools
6. Wiki: 5 tools
7. Project Health: 4 tools
8. Personas: 4 tools
9. Dashboard: 4 tools

**Total:** 42 MCP tools

**Options:**

- **Option A:** Single MCP server exposing all 41 tools
- **Option B:** 8 separate MCP servers (one per feature)
- **Option C:** Monorepo with multiple MCP servers

**The Question:** What MCP server architecture provides simplicity, maintainability, and universal agent access?

## Decision

**Implement a single MCP server (`moksha-devhub`) exposing all 41 tools.**

**Configuration (Claude Code example):**

```json
{
  "mcpServers": {
    "moksha-devhub": {
      "command": "node",
      "args": ["path/to/moksha-devhub-mcp/build/index.js"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}
```

**Result:**

- One installation → All 41 tools available
- Works with any MCP-compatible agent (Claude Code, Codex, Cursor AI, Cascade)

## Consequences

### Positive

- **Simplicity:** One config entry, one installation, one process
- **Discoverability:** Agents see all tools in single namespace
- **Maintenance:** Single codebase, single deployment, single version
- **Universal access:** Any MCP-compatible agent can use all tools
- **Shared logic:** Common Zod validation, error handling, audit logging

### Negative

- **Monolithic:** Single server failure affects all tools (mitigated by quick restart)
- **Namespace pollution:** 41 tools in flat namespace (mitigated by prefix: `sprint.`, `workflow.`, `issues.`)
- **Large bundle:** All tools loaded at startup (~5MB, acceptable for local)

### Neutral

- **Startup time:** ~500ms (acceptable for local MCP server)
- **Memory usage:** ~50MB (acceptable for background process)
- **Tool organization:** Grouped by prefix (sprint._, workflow._, issues.\*)

## Alternatives Considered

1. **8 Separate MCP Servers:**
   - Rejected: 8 config entries, 8 installations, 8 processes, complex maintenance

2. **Monorepo with Multiple Servers:**
   - Rejected: Shared code duplication, complex build process, deployment overhead

3. **Plugin Architecture:**
   - Rejected: Over-engineering for 41 tools, added complexity, no immediate benefit

## References

- MCP specification: https://modelcontextprotocol.io
- Tool catalog: [docs/06-API/openapi.yaml](../../06-API/openapi.yaml)
- Architecture: [docs/03-Architecture.md](../../03-Architecture.md) Section 3.1
- Installation guide: [docs/11-Infrastructure-and-Deployment.md](../../11-Infrastructure-and-Deployment.md)

---

**Last Updated:** 2025-11-02
**Revision History:**

- 2025-11-02: Initial version (single server approved)
