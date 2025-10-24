# Claude Code Agent System for Moksha DevHub

## Overview

This directory contains the complete agent system configuration for the Moksha DevHub project, providing intelligent routing, specialized skills, and workflow orchestration for AI-assisted development.

## Directory Structure

```
.claude/
├── agents/                          # 5 specialized sub-agents
│   ├── devhub-architect.md          # Architecture & design
│   ├── devhub-fullstack.md          # Implementation
│   ├── devhub-testing.md            # Testing & QA
│   ├── devhub-auditor.md            # Code review & quality
│   └── devhub-mcp-specialist.md     # MCP integration
├── skills/                          # 8 specialized skills
│   ├── debugging/                   # Debugging workflows
│   │   ├── systematic-debugging-web.md
│   │   └── root-cause-tracing-fullstack.md
│   ├── testing/                     # Testing workflows
│   │   ├── test-driven-development-web.md
│   │   └── api-testing-patterns.md
│   ├── validation/                  # Quality validation
│   │   ├── verification-before-completion.md
│   │   └── defense-in-depth-web.md
│   ├── architecture/                # Architecture patterns
│   │   └── api-design-patterns.md
│   └── documentation/               # Documentation
│       └── changelog-generator.md
├── state/                           # Session persistence
│   └── current_session.json         # Active session state
├── agent_dispatcher.py              # Intelligent routing
├── agent_state_manager.py           # Context management
├── agent_integration.py             # Agent execution
├── devhub_orchestrator.py           # Main orchestrator
├── settings.local.json              # Permissions config
├── SKILLS_INDEX.md                  # Skills catalog
├── MCP_TOOLS_RECOMMENDATIONS.md     # MCP tool guide
└── README.md                        # This file
```

## Quick Start

### 1. Verify Setup

```bash
cd .claude
python devhub_orchestrator.py status
```

### 2. Run Orchestrator

```bash
python devhub_orchestrator.py
```

### 3. Available Commands

- `help` - Show help
- `agents` - List available agents
- `status` - Show session status
- `continue` - Next workflow step
- `sessions` - List recent sessions
- `exit` - Quit

## System Components

### Agents (5 specialized)

1. **devhub-architect** - Architecture decisions, database design, MCP structure
2. **devhub-fullstack** - Implementation, coding, API routes, components
3. **devhub-testing** - Testing, QA, test automation
4. **devhub-auditor** - Code review, security, performance, accessibility
5. **devhub-mcp-specialist** - MCP tools, resources, prompts

### Skills (8 procedural guides)

- **Debugging:** Systematic debugging, root cause tracing
- **Testing:** TDD, API testing patterns
- **Validation:** Verification checklist, defense in depth
- **Architecture:** API design patterns
- **Documentation:** Changelog generation

### Orchestration System

- **Dispatcher:** Routes requests to appropriate agent based on intent
- **State Manager:** Maintains session context across handoffs
- **Integration:** Bridges orchestrator with agent markdown files
- **Orchestrator:** Main CLI interface for user interaction

## Usage Examples

### Architecture Decision
```
You: "How should I structure the MCP tools?"
→ Routes to: devhub-mcp-specialist
→ Provides: Tool organization strategy
```

### Implementation
```
You: "Implement the POST /api/issues endpoint"
→ Routes to: devhub-fullstack
→ Provides: Complete implementation with validation
```

### Testing
```
You: "Write tests for the search API"
→ Routes to: devhub-testing
→ Uses: API testing patterns skill
```

### Code Review
```
You: "Review this for security issues"
→ Routes to: devhub-auditor
→ Uses: Defense in depth skill
```

## Workflow Patterns

### Feature Development
1. **Architect** - Design feature
2. **Fullstack** - Implement
3. **Testing** - Add tests
4. **Auditor** - Review quality

### Bug Fixing
1. **Fullstack** - Fix bug
2. **Testing** - Add regression test
3. **Auditor** - Verify fix

### MCP Tool Creation
1. **MCP Specialist** - Design tool
2. **Fullstack** - Implement
3. **Testing** - Test tool

## Session Management

Sessions track your development progress:
- Objective
- Agent handoffs
- Files modified
- Artifacts created
- Progress metrics

Sessions are automatically saved and can be resumed.

## Configuration

### settings.local.json

Defines permissions:
- **Allow:** Read all, Write to apps/packages/docs
- **Deny:** node_modules, build artifacts, .env
- **Ask:** Destructive operations (git push, docker down)

### Skills

Skills are referenced by agents and provide structured methodologies:
- Each skill has clear "when to use" guidance
- Step-by-step workflows
- DevHub-specific examples
- Success criteria

## MCP Integration

Recommended MCP tools:
- **PostgreSQL MCP** - Database queries
- **Docker MCP** - Container management
- **GitHub MCP** - Issue/PR management (optional)

See `MCP_TOOLS_RECOMMENDATIONS.md` for details.

## Development

### Adding New Agent

1. Create `.claude/agents/agent-name.md`
2. Add frontmatter (name, description, model, color)
3. Write system prompt
4. Update dispatcher keywords/patterns

### Adding New Skill

1. Create `.claude/skills/<category>/skill-name.md`
2. Add frontmatter
3. Structure: Overview → Principles → Workflow → Examples
4. Update `SKILLS_INDEX.md`

### Testing Orchestrator

```bash
python agent_dispatcher.py      # Test routing
python agent_state_manager.py   # Test state management
python agent_integration.py     # Test agent loading
python devhub_orchestrator.py   # Test full system
```

## Troubleshooting

### Agents Not Found
- Check `.claude/agents/` directory exists
- Verify markdown frontmatter format
- Run `python agent_integration.py` to test

### Routing Issues
- Check dispatcher keywords match your request
- Use more specific language
- View routing decision with `verbose_routing: true`

### Session Errors
- Delete `.claude/state/current_session.json`
- Restart orchestrator

## Integration with Claude Code

This system is designed to work alongside Claude Code:
1. Use orchestrator for complex workflows
2. Use Claude Code for implementation
3. Skills provide structured guidance
4. Agents provide specialized expertise

## Credits

System inspired by Moksha game project agent setup, adapted for full-stack web development with Next.js, PostgreSQL, and MCP integration.

## Version

**v1.0** - Initial release
- 5 agents
- 8 skills
- Full orchestration system
- Session management
- MCP recommendations

---

For more information, see parent directory documentation:
- `../AGENTS.md` - Agent rules and workflows
- `../CLAUDE.md` - Claude Code integration guide
