# Claude Code Integration Guide - Moksha DevHub

## Overview

This guide explains how to use Claude Code with the custom agent system for Moksha DevHub development.

## Quick Start

### Option 1: Use Orchestrator (Recommended)
```bash
cd .claude
python devhub_orchestrator.py
```

Benefits:
- Intelligent agent routing
- Session persistence
- Workflow continuation
- Progress tracking

### Option 2: Direct Claude Code
Just chat naturally in Claude Code. Reference agents or skills when needed:
```
"Use the devhub-architect agent to design the MCP tools"
"Follow the test-driven-development-web skill for this feature"
```

---

## System Architecture

```
Claude Code (You)
       ↓
Python Orchestrator (Routes requests)
       ↓
Agent Dispatcher (Analyzes intent)
       ↓
Specialized Agent (Provides expertise)
       ↓
Skills (Structured methodology)
       ↓
Implementation
```

---

## Using the Orchestrator

### Starting a Session

```bash
$ python devhub_orchestrator.py

🎯 What are you working on today?
> Implement issue filtering feature

✨ Started new session: 20250123_143022
🎯 Objective: Implement issue filtering feature
```

### Interacting with Agents

```
💬 You: Design the database schema for filtering
🎯 Routing to: devhub-architect
[Architecture guidance provided]

💬 You: continue
🔄 Continuing to: devhub-fullstack
[Implementation provided]

💬 You: continue
🔄 Continuing to: devhub-testing
[Tests provided]
```

### Available Commands

- `help` - Show help
- `agents` - List available agents
- `skills` - Show available skills
- `status` - Current session status
- `continue` - Next workflow step
- `sessions` - Recent sessions
- `exit` - Quit

---

## Agent Specializations

### 1. devhub-architect (Blue)
**Triggers:** "design", "architecture", "schema", "structure", "should I"

**Use for:**
- Database schema design
- API architecture decisions
- MCP tool organization
- System design patterns
- Module structure planning

**Example:**
```
You: "How should I implement hybrid search?"
→ Provides: Architecture pattern with PostgreSQL tsvector + pgvector
```

### 2. devhub-fullstack (Green)
**Triggers:** "implement", "create", "build", "write", "code"

**Use for:**
- API route implementation
- React component creation
- Prisma queries
- TypeScript coding
- Server Actions

**Example:**
```
You: "Implement the POST /api/issues endpoint"
→ Provides: Complete API route with validation and error handling
```

### 3. devhub-testing (Purple)
**Triggers:** "test", "jest", "playwright", "coverage"

**Use for:**
- Writing unit tests
- API testing
- E2E testing
- Test coverage analysis
- Regression tests

**Example:**
```
You: "Write tests for the search API"
→ Provides: Comprehensive test suite with mocks
```

### 4. devhub-auditor (Red)
**Triggers:** "review", "audit", "security", "performance", "check"

**Use for:**
- Code quality review
- Security analysis
- Performance optimization
- Accessibility audit
- Architecture compliance

**Example:**
```
You: "Review this for security issues"
→ Provides: Security audit with specific fixes
```

### 5. devhub-mcp-specialist (Cyan)
**Triggers:** "mcp", "tool", "resource", "prompt", "claude code"

**Use for:**
- MCP tool design
- MCP resource implementation
- MCP prompt engineering
- Claude Code integration

**Example:**
```
You: "Design the MCP tool structure"
→ Provides: Tool categories and implementation patterns
```

---

## Using Skills

Skills are procedural guides that agents reference. You can invoke them directly:

### Debugging
```
You: "I have a bug in the issue creation API"
→ Use: systematic-debugging-web skill
→ Provides: Step-by-step debugging methodology
```

### Testing
```
You: "I need to write tests for this feature"
→ Use: test-driven-development-web skill
→ Provides: RED/GREEN/REFACTOR workflow
```

### Validation
```
You: "Is this ready to commit?"
→ Use: verification-before-completion skill
→ Provides: 12-point pre-commit checklist
```

See `.claude/SKILLS_INDEX.md` for complete catalog.

---

## Workflow Patterns

### Feature Development
```
Session: "Implement issue filtering"

Step 1: Design
You: "Design database changes for filtering"
→ Agent: devhub-architect
→ Output: Prisma schema additions

Step 2: Implement
You: "continue"
→ Agent: devhub-fullstack
→ Output: API route + UI components

Step 3: Test
You: "continue"
→ Agent: devhub-testing
→ Output: Test suite

Step 4: Review
You: "continue"
→ Agent: devhub-auditor
→ Output: Quality audit

Result: Feature complete with tests and validation
```

### Bug Fixing
```
Session: "Fix search not working with special characters"

Step 1: Debug
You: "Help me debug why search fails on special characters"
→ Agent: devhub-fullstack
→ Skill: systematic-debugging-web
→ Output: Root cause identified (case sensitivity)

Step 2: Fix
You: "Implement the fix"
→ Agent: devhub-fullstack
→ Output: Updated code with case-insensitive search

Step 3: Test
You: "Add regression test"
→ Agent: devhub-testing
→ Output: Test covering special characters

Step 4: Verify
You: "Verify this fix is complete"
→ Agent: devhub-auditor
→ Skill: verification-before-completion
→ Output: Checklist validation

Result: Bug fixed with regression test
```

---

## Session Management

### Current Session
The orchestrator maintains state in `.claude/state/current_session.json`:
- Objective
- Current agent
- Handoff history
- Files modified
- Artifacts created
- Progress tracking

### Session Continuation
```bash
# Resume existing session
$ python devhub_orchestrator.py
📋 Resuming session: 20250123_143022
   Objective: Implement issue filtering
   Current agent: devhub-fullstack
```

### Session Archiving
```bash
$ exit
Archive current session? (y/n): y
✅ Session archived
```

Archived sessions stored in `.claude/state/history/`

---

## MCP Integration

### Current MCP Tools
- byterover - Memory/knowledge retrieval
- filesystem - File operations
- sequential-thinking - Complex reasoning
- git - Version control
- playwright - E2E testing

### Recommended Additional Tools
See `.claude/MCP_TOOLS_RECOMMENDATIONS.md` for:
- PostgreSQL MCP Server
- Docker MCP Server
- GitHub MCP Server (optional)
- Custom DevHub tools

### Installing MCP Tools
```bash
# PostgreSQL MCP
claude mcp add @modelcontextprotocol/server-postgres

# Docker MCP (custom - see recommendations doc)
```

---

## Permissions & Safety

Configured in `.claude/settings.local.json`:

### Allowed Operations
✅ Read all repository files
✅ Write to apps/, packages/, docs/
✅ Run: pnpm, npm, docker, git, python
✅ Access documentation sites

### Restricted Operations
❌ Write to node_modules/, .next/, .env
❌ Destructive bash commands
❌ Format entire drives

### Requires Confirmation
⚠️ git push
⚠️ docker-compose down
⚠️ prisma migrate reset

---

## Tips & Best Practices

### 1. Be Specific
```
❌ "Fix the bug"
✅ "Debug why POST /api/issues returns 400 for valid input"
```

### 2. Provide Context
```
You: "The search isn't working"
→ Better: "Search returns 0 results for 'authentication' but issue #42 has that keyword"
```

### 3. Use Workflow Commands
```
You: "Design → Implement → Test → Review"
→ Type: design request, then "continue" through workflow
```

### 4. Reference Documentation
```
You: "Follow the architecture in docs/01-ARCHITECTURE.md"
→ Agents will validate against documented patterns
```

### 5. Check Status Regularly
```
You: "status"
→ See progress, files modified, artifacts created
```

### 6. Use Skills for Structure
```
You: "Use the api-design-patterns skill for this endpoint"
→ Gets structured guidance on REST patterns
```

---

## Troubleshooting

### Orchestrator Not Working
```bash
# Check Python installation
python --version  # Should be 3.8+

# Verify agents loaded
cd .claude
python agent_integration.py
```

### Routing Issues
```bash
# Test dispatcher
python agent_dispatcher.py

# Check keywords match your request
# See agent_dispatcher.py for keyword lists
```

### Session Errors
```bash
# Clear current session
rm .claude/state/current_session.json

# Restart orchestrator
python devhub_orchestrator.py
```

### Agent Not Found
```bash
# Verify agents directory
ls .claude/agents/

# Check agent frontmatter format
# Should have: name, description, model, color
```

---

## Advanced Usage

### Custom Workflows
Edit `.claude/agent_dispatcher.py` to add custom workflow patterns:

```python
self.workflow_patterns = {
    'custom_workflow': [
        'devhub-architect',
        'devhub-mcp-specialist',
        'devhub-fullstack',
        'devhub-testing'
    ]
}
```

### Session Context
Pass custom context to agents:

```python
context = {
    'phase': 'implementation',
    'files': ['app/api/issues/route.ts'],
    'constraints': ['use Server Components']
}
```

### Adding New Agents
1. Create `.claude/agents/new-agent.md`
2. Add frontmatter (name, description, model, color)
3. Write system prompt
4. Update dispatcher keywords
5. Test with orchestrator

### Adding New Skills
1. Create `.claude/skills/<category>/new-skill.md`
2. Follow skill template structure
3. Add to SKILLS_INDEX.md
4. Reference in relevant agents

---

## Integration Checklist

Before starting development, verify:

- [ ] Orchestrator runs: `python devhub_orchestrator.py`
- [ ] Agents load: `python agent_integration.py`
- [ ] Skills are accessible: Check `.claude/skills/`
- [ ] Documentation read: Review `docs/`
- [ ] Permissions configured: Check `.claude/settings.local.json`
- [ ] MCP tools installed: Essential ones from recommendations
- [ ] Claude Code connected: Can chat with Claude

---

## Getting Help

1. **Orchestrator help:** Type `help` in orchestrator
2. **Agent list:** Type `agents` in orchestrator
3. **Skills catalog:** See `.claude/SKILLS_INDEX.md`
4. **Workflow examples:** See `AGENTS.md`
5. **MCP setup:** See `.claude/MCP_TOOLS_RECOMMENDATIONS.md`
6. **System docs:** See `.claude/README.md`

---

## Next Steps

1. **Now:** Run orchestrator and start a session
2. **First task:** "Help me understand the DevHub architecture"
3. **Practice:** Try routing to different agents
4. **Explore:** Check skills for methodologies
5. **Build:** Start implementing features with agent assistance

---

**Remember:** The agent system is designed to make you more productive. Use the orchestrator for complex workflows, reference skills for structured methodologies, and always validate against documentation.

**Ready to build? Start the orchestrator:**
```bash
cd .claude && python devhub_orchestrator.py
```

🚀 **Happy coding with AI assistance!**
