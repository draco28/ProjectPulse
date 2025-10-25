# Claude Code Integration Guide - Moksha DevHub

## Overview

This guide explains how to use Claude Code for Moksha DevHub development, with optional Gemini CLI for deep analysis.

---

## 🚨 GOLDEN RULES - Claude Code Must Follow

### Git Workflow (CRITICAL)

**NEVER work directly on master branch!**

**ALWAYS before creating a new branch:**

```bash
# 1. Check current branch
git branch

# 2. Switch to master
git checkout master

# 3. Pull latest changes
git pull origin master

# 4. THEN create feature branch
git checkout -b api/feature-name    # For API changes
git checkout -b ui/feature-name     # For UI changes
git checkout -b feature/feature-name # For mixed changes
```

**Branch naming conventions:**

- `api/*` - Backend/API changes
- `ui/*` - Frontend/UI changes
- `feature/*` - Mixed or new features
- `fix/*` - Bug fixes
- `docs/*` - Documentation only

**Before ANY code changes:**

- ✅ Verify on feature branch (not master)
- ✅ Pull latest from master first
- ✅ Run existing tests
- ❌ NEVER push to master directly

### When to Suggest Gemini

**Automatically suggest Gemini CLI when user requests:**

- "Analyze entire codebase..."
- "Review all files..."
- "System-wide migration..."
- "Find all occurrences across repo..."
- Any analysis requiring >200K tokens

**Response format:**

```
This needs deep analysis with Gemini's 1M context.

Run: analyze-with-gemini "user's request"

Then tell me to read the results and I'll implement!
```

---

## Quick Start

### Daily Workflow

Just chat naturally with Claude Code (me):

```
"Implement POST /api/issues endpoint"
"Write tests for the search API"
"Debug the authentication flow"
```

### When Deep Analysis Needed

I'll tell you to use Gemini:

```
analyze-with-gemini "your analysis request"
```

Then bring results back to me for implementation.

**Guide**: See [SIMPLE_GEMINI_WORKFLOW.md](SIMPLE_GEMINI_WORKFLOW.md)

---

## System Architecture

### Simple Gemini + Claude Workflow

```
90% of work:
You ↔ Claude Code (me in this chat)
  - Implementation
  - Testing
  - Code review
  - Focused tasks

10% when deep analysis needed:
You → Claude Code: "Analyze entire codebase..."
        ↓
Claude Code: "Run: analyze-with-gemini 'request'"
        ↓
You → Terminal: analyze-with-gemini "request"
        ↓
Gemini CLI: Analyzes with 1M context → Saves to file
        ↓
You → Claude Code: "Read the Gemini analysis file"
        ↓
Claude Code: Reads file → Implements recommendations
```

**Gemini Integration (Analysis-Only)**

- **When**: "Analyze entire...", "Review all...", "System-wide..."
- **What**: Gemini reads entire repo (1M tokens), provides analysis
- **How**: Simple script - `analyze-with-gemini "your request"`
- **Result**: Saves markdown file, Claude Code reads and implements
- **Guide**: See [SIMPLE_GEMINI_WORKFLOW.md](SIMPLE_GEMINI_WORKFLOW.md)

---

## Using Gemini for Deep Analysis

### The 3-Step Workflow

**Step 1: Ask Claude Code (me) for deep analysis**

```
You: Analyze the entire codebase for performance bottlenecks
```

**Step 2: I'll tell you to use Gemini**

```
Claude Code: This needs deep analysis with Gemini's 1M context.

Run this command:
analyze-with-gemini "Analyze entire codebase for performance bottlenecks"

Gemini will save results to .claude/gemini-analysis/[timestamp].md
Then tell me to read it!
```

**Step 3: Run Gemini, then I implement**

```bash
# You run in terminal:
analyze-with-gemini "Analyze entire codebase for performance bottlenecks"

# Wait 30-60 seconds...
# ✅ Saved to: .claude/gemini-analysis/2025-10-26_190000.md
```

```
# Back in our chat:
You: Read the Gemini analysis file

Claude Code: [Reads file and implements fixes]
✅ Created branch, modified 5 files, all optimizations complete!
```

### When I Auto-Suggest Gemini

I'll suggest using Gemini when you ask about:

- **"Analyze entire codebase..."** - Full repo analysis
- **"Review all files..."** - Complete file review
- **"System-wide migration..."** - Large-scale changes
- **"Find all occurrences..."** - Repo-wide search patterns
- **"Plan migration from X to Y"** - Migration planning

For focused tasks, I'll just help you directly (no Gemini needed).

### Complete Example

```
You: Analyze entire codebase for tech debt

Me: This needs Gemini's 1M context.
    Run: analyze-with-gemini "Analyze entire codebase for tech debt"
    Then tell me to read the results!

[You run the command in terminal]

You: Read the Gemini analysis file

Me: Got it! Gemini found:
    - Inconsistent error handling (42 files)
    - Missing TypeScript types (23 files)
    - Duplicate API code (8 files)

    Let me fix the high-priority items:
    [Creates branch, modifies files, runs tests]
    ✅ All done!
```

**See [SIMPLE_GEMINI_WORKFLOW.md](SIMPLE_GEMINI_WORKFLOW.md) for complete guide**

---

## Agent Specializations (Claude Agents)

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
