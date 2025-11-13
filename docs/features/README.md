# ProjectPulse Feature Documentation

**Purpose**: Product feature documentation for end users and external teams using ProjectPulse

**Audience**: Developers, teams, and AI agents using ProjectPulse as their project management platform

---

## Documentation Structure

### API & Integration

- **[api-reference.md](./api-reference.md)** - Complete API endpoint catalog
  - All REST API endpoints with request/response examples
  - Query parameters, headers, authentication
  - Error handling and status codes

- **[mcp-tools-guide.md](./mcp-tools-guide.md)** - MCP (Model Context Protocol) tools reference
  - All MCP tools for AI agents
  - Sprint management, workflow orchestration, issue tracking
  - Knowledge management and skills system
  - Usage examples and best practices

### Core Features

- **[database-schema.md](./database-schema.md)** - Prisma database schema reference
  - All database models and relationships
  - Field types, indexes, constraints
  - Migration patterns

- **[workflow-templates.md](./workflow-templates.md)** - Pre-built workflow templates
  - Available workflow templates
  - Step definitions and state machines
  - Integration with sprint system

- **[skills-system-guide.md](./skills-system-guide.md)** - Skills lazy-loading system
  - Token-efficient skills management (97.2% reduction)
  - LRU cache behavior and performance
  - Skills categories and structure
  - Common workflows and best practices

---

## Quick Links

**Getting Started**:
1. Review [api-reference.md](./api-reference.md) for available endpoints
2. Configure MCP tools using [mcp-tools-guide.md](./mcp-tools-guide.md)
3. Understand data model in [database-schema.md](./database-schema.md)

**For AI Agents**:
- Use [mcp-tools-guide.md](./mcp-tools-guide.md) for MCP tool integration
- Reference [skills-system-guide.md](./skills-system-guide.md) for token-efficient patterns

**For Developers**:
- [api-reference.md](./api-reference.md) - REST API integration
- [database-schema.md](./database-schema.md) - Database structure
- [workflow-templates.md](./workflow-templates.md) - Pre-built workflows

---

## Development Documentation

For development documentation (requirements, architecture, specifications), see:
- [../README.md](../README.md) - Documentation index
- [../01-PRD.md](../01-PRD.md) - Product requirements
- [../03-Architecture.md](../03-Architecture.md) - System architecture
- [../13-Project-Plan.md](../13-Project-Plan.md) - Implementation plan

---

**Last Updated**: 2025-11-13
**Status**: Sprint 6 complete
**Maintained By**: ProjectPulse Team
