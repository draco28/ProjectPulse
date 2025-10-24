# Workflow Quick Reference - Moksha DevHub

**Quick lookup for common development workflows in Claude Code**

---

## 🚀 Feature Development

```
1. Design
   You: "Design database schema for [feature]"
   → Agent: devhub-architect
   → Output: Schema, API design, patterns

2. Implement
   You: "continue" OR "Implement [feature]"
   → Agent: devhub-fullstack
   → Skill: test-driven-development-web
   → Output: Code + tests

3. Test
   You: "continue" OR "Write tests for [feature]"
   → Agent: devhub-testing
   → Skill: api-testing-patterns
   → Output: Comprehensive test suite

4. Review
   You: "continue" OR "Review [feature] for quality"
   → Agent: devhub-auditor
   → Skill: verification-before-completion
   → Output: Quality audit + fixes
```

**Commands:**
```bash
# Start session
python .claude/devhub_orchestrator.py

# Or direct in Claude Code
"Implement user authentication feature"
```

---

## 🐛 Bug Fixing

```
1. Debug
   You: "Debug: [symptom description]"
   → Agent: devhub-fullstack
   → Skill: systematic-debugging-web
   → Output: Root cause identified

2. Fix
   You: "Implement the fix"
   → Agent: devhub-fullstack
   → Output: Fixed code

3. Test
   You: "Add regression test"
   → Agent: devhub-testing
   → Output: Test preventing recurrence

4. Verify
   You: "Verify fix is complete"
   → Agent: devhub-auditor
   → Skill: verification-before-completion
   → Output: Validated fix
```

**Quick Debug:**
```bash
# For simple bugs
"Debug why [specific issue]"

# For complex issues
"Use root-cause-tracing-fullstack skill to debug [issue]"
```

---

## 🧪 Testing Workflow

```
1. Unit Tests
   You: "Write unit tests for [component/function]"
   → Agent: devhub-testing
   → Output: Jest tests

2. API Tests
   You: "Write API tests for POST /api/[endpoint]"
   → Agent: devhub-testing
   → Skill: api-testing-patterns
   → Output: API test suite

3. E2E Tests
   You: "Write E2E test for [user flow]"
   → Agent: devhub-testing
   → Output: Playwright tests

4. Coverage Check
   You: "Check test coverage and fill gaps"
   → Agent: devhub-testing
   → Output: Coverage report + new tests
```

**TDD Workflow:**
```
"Use TDD to implement [feature]"
→ RED: Write failing test
→ GREEN: Make it pass
→ REFACTOR: Improve code
```

---

## 🏗️ Architecture & Design

```
1. System Design
   You: "Design the architecture for [feature/system]"
   → Agent: devhub-architect
   → Output: Architecture doc, diagrams

2. Database Design
   You: "Design database schema for [entity]"
   → Agent: devhub-architect
   → Output: Prisma schema, migrations

3. API Design
   You: "Design REST API for [resource]"
   → Agent: devhub-architect
   → Skill: api-design-patterns
   → Output: API specification

4. MCP Tool Design
   You: "Design MCP tools for [purpose]"
   → Agent: devhub-mcp-specialist
   → Output: Tool structure, categories
```

---

## 🔍 Code Review

```
1. Security Audit
   You: "Review [file/component] for security issues"
   → Agent: devhub-auditor
   → Output: Security issues + fixes

2. Performance Audit
   You: "Review [file/component] for performance"
   → Agent: devhub-auditor
   → Output: Performance issues + optimizations

3. Accessibility Audit
   You: "Review [component] for accessibility"
   → Agent: devhub-auditor
   → Output: WCAG compliance issues + fixes

4. Quality Audit
   You: "Review [code] for quality"
   → Agent: devhub-auditor
   → Skill: defense-in-depth-web
   → Output: Quality report + improvements
```

**Pre-Commit Check:**
```
"Is this ready to commit?"
→ Uses: verification-before-completion skill
→ 12-point checklist validation
```

---

## 🔧 MCP Development

```
1. Design MCP Tool
   You: "Design MCP tool for [purpose]"
   → Agent: devhub-mcp-specialist
   → Output: Tool schema, inputSchema

2. Implement MCP Tool
   You: "Implement [tool-name] MCP tool"
   → Agent: devhub-fullstack + devhub-mcp-specialist
   → Output: Tool implementation

3. Test MCP Tool
   You: "Test [tool-name] MCP tool"
   → Agent: devhub-testing
   → Output: Tool tests

4. Document MCP Tool
   You: "Document [tool-name] usage"
   → Agent: devhub-mcp-specialist
   → Output: Usage examples, docs
```

---

## 📝 Documentation

```
1. Changelog
   You: "Generate changelog for version [X.Y.Z]"
   → Agent: Any agent
   → Skill: changelog-generator
   → Output: CHANGELOG.md entries

2. API Documentation
   You: "Document API endpoints in [file]"
   → Agent: devhub-architect
   → Output: OpenAPI/JSDoc

3. Component Documentation
   You: "Document [component] usage"
   → Agent: devhub-fullstack
   → Output: TSDoc comments + README

4. Architecture Documentation
   You: "Document the architecture of [system]"
   → Agent: devhub-architect
   → Output: Architecture docs
```

---

## 🔄 Database Operations

```
1. Schema Changes
   You: "Add [table/column] to database"
   → Agent: devhub-architect (design)
   → Agent: devhub-fullstack (migration)
   → Commands: npx prisma migrate dev

2. Seed Data
   You: "Create seed data for [table]"
   → Agent: devhub-fullstack
   → Output: prisma/seed.ts

3. Query Optimization
   You: "Optimize query performance for [query]"
   → Agent: devhub-auditor
   → Output: Optimized query + indexes

4. Migration Verification
   You: "Verify migration [name] succeeded"
   → MCP Tool: postgres
   → Check: Schema, data, constraints
```

---

## 🚢 Release Workflow

```
1. Pre-Release Check
   You: "Prepare for release [version]"
   → Agent: devhub-auditor
   → Skill: verification-before-completion
   → Output: Release readiness report

2. Generate Changelog
   You: "Generate changelog for [version]"
   → Skill: changelog-generator
   → Output: CHANGELOG.md

3. Version Bump
   You: "Bump version to [X.Y.Z]"
   → Update: package.json, version files

4. Build & Test
   You: "Run full build and test suite"
   → Commands: pnpm build && pnpm test
```

---

## 🛠️ Common Commands

### Orchestrator Commands
```bash
help         # Show help
agents       # List agents
skills       # Show skills
status       # Session status
continue     # Next workflow step
sessions     # Recent sessions
exit         # Quit orchestrator
```

### Direct Routing (Claude Code)
```
"Use devhub-architect to..."      # Architecture
"Use devhub-fullstack to..."       # Implementation
"Use devhub-testing to..."         # Testing
"Use devhub-auditor to..."         # Review
"Use devhub-mcp-specialist to..."  # MCP tools

"Follow [skill-name] skill"        # Use specific skill
```

---

## 📋 Pre-Commit Checklist

Before every commit, verify:

```
✅ Code builds: pnpm build
✅ Tests pass: pnpm test
✅ Types valid: pnpm type-check
✅ Linting passes: pnpm lint
✅ Coverage >80%
✅ No console.logs
✅ Documentation updated
✅ No hardcoded values
✅ Security validated
✅ Accessible (if UI)
✅ Performance acceptable
✅ Follows patterns in docs/
```

**Quick check:**
```
"Is this ready to commit?"
→ Runs verification-before-completion checklist
```

---

## 🎯 Session Management

### Starting Sessions
```bash
# New session
python .claude/devhub_orchestrator.py

# With objective
"Working on: Implement search feature"
```

### Continuing Sessions
```bash
# Resume existing
python .claude/devhub_orchestrator.py
→ Auto-resumes last session

# Check progress
"status"
→ Shows objective, current agent, progress
```

### Workflow Continuation
```bash
# Next logical step
"continue"
→ Orchestrator suggests next agent

# Skip to specific agent
"Route to devhub-testing"
```

---

## 🔍 Debugging Tips

### Systematic Approach
```
1. Reproduce: Document exact steps
2. Isolate: Narrow to layer (UI/API/DB)
3. Trace: Follow data through stack
4. Fix: Implement solution
5. Test: Add regression test
6. Verify: Run checklist
```

### By Symptom
```
UI not rendering → Check React DevTools, hydration
API errors → Check Network tab, status codes
DB issues → Use postgres MCP, check logs
Build fails → Check error output, types
Tests fail → Check test output, expectations
```

---

## 📚 Documentation References

**Quick Links:**
- Architecture: [docs/01-ARCHITECTURE.md](../docs/01-ARCHITECTURE.md)
- Database: [docs/02-DATABASE-SCHEMA.md](../docs/02-DATABASE-SCHEMA.md)
- MCP Spec: [docs/03-MCP-SPECIFICATION.md](../docs/03-MCP-SPECIFICATION.md)
- Agents: [AGENTS.md](../AGENTS.md)
- Integration: [CLAUDE.md](../CLAUDE.md)
- Skills: [SKILLS_INDEX.md](SKILLS_INDEX.md)

---

## 🎨 Agent Colors (Visual Reference)

| Agent | Color | Use Case |
|-------|-------|----------|
| devhub-architect | 🔵 Blue | Design, architecture |
| devhub-fullstack | 🟢 Green | Implementation, coding |
| devhub-testing | 🟣 Purple | Tests, QA |
| devhub-auditor | 🔴 Red | Review, quality |
| devhub-mcp-specialist | 🔷 Cyan | MCP tools |

---

## 💡 Pro Tips

1. **Be Specific**
   - ❌ "Fix the bug"
   - ✅ "Debug why POST /api/issues returns 400 for valid input"

2. **Use Continue**
   - After each agent completes, say "continue" for next step
   - Orchestrator knows the workflow

3. **Reference Skills**
   - "Use test-driven-development-web skill"
   - Gets structured methodology

4. **Check Status**
   - "status" shows progress, files modified, artifacts

5. **Validate Against Docs**
   - "Follow patterns in docs/01-ARCHITECTURE.md"
   - Ensures compliance

6. **Use MCP Tools**
   - postgres: Database queries
   - docker-devhub: Container management
   - git: Version control

---

## ⚡ Quick Patterns

### New API Endpoint
```
1. "Design POST /api/[resource]"
2. "continue" → Implement
3. "continue" → Test
4. "continue" → Review
```

### New React Component
```
1. "Design [Component] with props [X, Y]"
2. "Use TDD to implement [Component]"
3. "Review [Component] for accessibility"
```

### Bug Fix
```
1. "Debug: [symptom]"
2. "Implement the fix"
3. "Add regression test"
4. "Verify fix is complete"
```

### Database Change
```
1. "Design schema for [feature]"
2. "Create Prisma migration"
3. "Verify migration with postgres MCP"
4. "Update affected queries"
```

---

**Remember:** The agent system knows workflows. Start with your goal, use "continue" to progress, and validate before committing.

**Need help?** Type `help` in orchestrator or check [CLAUDE.md](../CLAUDE.md)

---

**Last Updated:** January 23, 2025
**Version:** 1.0
