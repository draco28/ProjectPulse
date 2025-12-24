# ProjectPulse Templates

This directory contains templates for AI agent configuration files that can be added to projects using ProjectPulse.

## Templates

| Template | Purpose |
|----------|---------|
| `CLAUDE-TEMPLATE.md` | Complete AI workflow guide with daily routines, ticket handling, session management, and MCP tool usage |
| `AGENTS-TEMPLATE.md` | Reference catalog for personas, skills, SOPs, and workflows available via MCP |

## Placeholder Variables

Both templates use `{{VARIABLE}}` syntax for project-specific values:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `{{PROJECT_NAME}}` | Your project's name | *(required)* |
| `{{PROJECT_ID}}` | ProjectPulse project ID | *(required)* |
| `{{MCP_URL}}` | ProjectPulse MCP server URL | `https://projectpulsemcp.dracodev.dev/mcp` |
| `{{DASHBOARD_URL}}` | ProjectPulse dashboard URL | `https://projectpulse.dracodev.dev/` |

## Usage

### Option 1: Manual Replacement

1. Copy the template files to your project root
2. Replace all `{{VARIABLE}}` placeholders with your project values
3. Rename to `CLAUDE.md` and `AGENTS.md` (or keep original names)

```bash
# Example: Create files for project "My App" with ID 8
cp CLAUDE-TEMPLATE.md /path/to/my-app/CLAUDE.md
cp AGENTS-TEMPLATE.md /path/to/my-app/AGENTS.md

# Then manually replace:
# {{PROJECT_NAME}} → My App
# {{PROJECT_ID}} → 8
# {{MCP_URL}} → https://projectpulsemcp.dracodev.dev/mcp
# {{DASHBOARD_URL}} → https://projectpulse.dracodev.dev/
```

### Option 2: Use writeMinimalTool (Recommended)

The `projectpulse_repo_writeMinimal` MCP tool generates these files automatically with:
- All placeholders replaced with actual values
- Personas, skills, and SOPs populated from the database
- Project-specific configuration

```
projectpulse_repo_writeMinimal({
  projectId: 8,
  repoPath: "/path/to/my-app"
})
```

This creates:
- `/path/to/my-app/CLAUDE.md` - Filled workflow guide
- `/path/to/my-app/AGENTS.md` - Populated resource catalog

## Template Contents

### CLAUDE-TEMPLATE.md

The main workflow guide covers:

1. **Quick Start** - Basic usage
2. **Critical Start** - `context_load` entry point
3. **Daily Workflow** - Morning/During/End-of-day patterns
4. **Loading Resources** - How to fetch personas, skills, SOPs
5. **Roadmap Workflow** - Progress tracking for multi-week projects
6. **Ticket Workflow** - Complete 6-step ticket lifecycle
7. **Session Lifecycle** - IN_PROGRESS → PAUSED → COMPLETED
8. **Knowledge & Wiki** - Project knowledge management
9. **MCP Tools Reference** - All available tools by category
10. **Memory Banks** - Context management
11. **Daily Checklist** - Quick verification

### AGENTS-TEMPLATE.md

The resource catalog covers:

1. **Personas** - Expert roles and their slugs
2. **Skills** - Coding patterns by category
3. **SOPs** - Procedures by category
4. **Workflows** - Multi-step process templates
5. **Knowledge Base** - How to search/create knowledge
6. **Wiki** - Documentation access
7. **Token-Efficient Loading** - Best practices for minimal token usage

## Key Difference from ProjectPulse's Own CLAUDE.md

| Aspect | ProjectPulse's CLAUDE.md | These Templates |
|--------|--------------------------|-----------------|
| Skills/SOPs | Repo-based (`.agent/`, `.claude/`) | Fetched via MCP |
| Sub-agents | Local agent files | Personas via MCP |
| Expert agents | `.claude/agents/` folder | `persona_get` |
| Memory banks | Project-specific paths | `context_load` only |
| Documentation | Local `.agent/` folder | Wiki pages via MCP |

The templates are designed for **external projects** that use ProjectPulse as their project management backend, with all resources loaded from the ProjectPulse database via MCP tools.

## Customization

Feel free to customize these templates for your needs:

- Add project-specific sections
- Remove unused features (e.g., roadmap if not used)
- Add custom MCP tool examples
- Include project-specific conventions

Just keep the core workflow patterns intact for consistency across projects.
