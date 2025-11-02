# AGENTS.md — ProjectPulse (AI_HUB)

**Version:** 1.0
**Project:** ProjectPulse
**Stack:** Next.js 14 + PostgreSQL 16 + Prisma + MCP
**Agent System:** Claude Code with custom sub-agents and skills

---

## 0) Source of Truth (SoT)

All agents must reason from these in-repo references:

- `docs/00-INDEX.md` - **Documentation overview and reading paths**
- `docs/01-ARCHITECTURE.md` - **Complete system architecture**
- `docs/02-DATABASE-SCHEMA.md` - **Database schema and Prisma models**
- `docs/03-MCP-SPECIFICATION.md` - **MCP specification and implementation**
- `docs/07-QUICK-START.md` - **Setup and getting started guide**
- `.claude/` - **Agent configurations, skills, and orchestration**

> If anything conflicts, **docs/ is authoritative.**

---

## 1) Golden Rules (non-negotiable)

1. **Documentation Authority**: All implementations must align with docs/ architecture **[R-DOC-001]**
2. **Data-Driven Development**: No hardcoded values; use database tables or configuration **[R-DATA-001]**
3. **Type Safety**: Strict TypeScript, no `any` types **[R-TS-001]**
4. **Server Components First**: Use React Server Components by default **[R-NEXT-001]**
5. **Prisma Parameterized**: No raw SQL string interpolation (SQL injection prevention) **[R-SEC-001]**
6. **Testing Required**: All features must have tests (80%+ coverage) **[R-TEST-001]**
7. **MCP Pattern**: MCP server calls Next.js API (not direct database) **[R-MCP-001]**
8. **Local-First**: All data stored locally, no cloud dependencies **[R-PRIVACY-001]**

---

## 2) Project Structure

```
F:\Web_Projects\AI_HUB/
├── .claude/                    # Agent system configuration
│   ├── agents/                 # 5 specialized sub-agents
│   ├── skills/                 # 8 workflow skills
│   ├── state/                  # Session persistence
│   └── *.py                    # Python orchestration system
├── apps/
│   ├── web/                    # Next.js application (to be created)
│   └── mcp-server/             # MCP server (to be created)
├── packages/                   # Shared code (future)
├── docs/                       # Architecture documentation
├── scripts/                    # Build/deployment scripts
├── docker-compose.yml          # Docker configuration
├── pnpm-workspace.yaml         # Monorepo config
├── AGENTS.md                   # This file
├── CLAUDE.md                   # Claude Code integration guide
└── .claudeignore              # Files to exclude from context
```

---

## 3) Available AI Agents

### 3.1 Claude Code (Primary Assistant)

**Purpose:** Your primary AI coding assistant with intelligent routing

**How to use:**

- Use orchestrator: `python .claude/devhub_orchestrator.py`
- Or chat directly in Claude Code
- System automatically routes to appropriate specialist

### 3.2 Custom Sub-Agents (5 specialists)

Located in `.claude/agents/`, invoked via orchestrator:

1. **devhub-architect** - Architecture & design decisions
2. **devhub-fullstack** - Implementation & coding
3. **devhub-testing** - Testing & QA
4. **devhub-auditor** - Code review & quality
5. **devhub-mcp-specialist** - MCP integration

### 3.3 Specialized Skills (8 skills)

Located in `.claude/skills/`, referenced by agents:

**Debugging:**

- systematic-debugging-web.md
- root-cause-tracing-fullstack.md

**Testing:**

- test-driven-development-web.md
- api-testing-patterns.md

**Validation:**

- verification-before-completion.md
- defense-in-depth-web.md

**Architecture:**

- api-design-patterns.md

**Documentation:**

- changelog-generator.md

See `.claude/SKILLS_INDEX.md` for complete catalog.

---

## 4) Agent Usage Guide

### When to Use Each Agent

**devhub-architect:**

- "How should I structure the MCP tools?"
- "Design the database schema for agent personas"
- "What's the best way to implement hybrid search?"

**devhub-fullstack:**

- "Implement the POST /api/issues endpoint"
- "Create the IssueList component with filtering"
- "Add Prisma migration for new table"

**devhub-testing:**

- "Write tests for the search API"
- "Create E2E test for issue creation flow"
- "Add regression test for this bug"

**devhub-auditor:**

- "Review this code for security issues"
- "Check if this component is accessible"
- "Audit API performance"

**devhub-mcp-specialist:**

- "Design the MCP tool structure"
- "Implement MCP resource for project context"
- "Create MCP prompt for code reviewer persona"

### Workflow Patterns

**Feature Development:**

1. Architect → Design feature
2. Fullstack → Implement
3. Testing → Add tests
4. Auditor → Review quality

**Bug Fixing:**

1. Fullstack → Fix bug
2. Testing → Add regression test
3. Auditor → Verify fix

**MCP Tool Creation:**

1. MCP Specialist → Design tool
2. Fullstack → Implement
3. Testing → Test tool

---

## 5) Quality Gates

All work must pass these gates before completion:

### Build Gate

- `pnpm lint` passes
- `pnpm type-check` passes
- `pnpm build` succeeds
- No TypeScript errors

### Test Gate

- `pnpm test` passes
- 80%+ coverage for new code
- All edge cases tested
- No failing tests

### Security Gate

- No SQL injection vulnerabilities
- Input validated with Zod
- No XSS vulnerabilities
- No exposed secrets

### Architecture Gate

- Follows patterns in docs/
- Data-driven (no hardcoded values)
- Proper module placement
- Type-safe implementation

See `.claude/skills/validation/verification-before-completion.md` for complete checklist.

---

## 6) Technical Standards

### TypeScript

```typescript
// ✅ Good: Strict typing
interface Issue {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ❌ Bad: Any types
const issue: any = { ... };
```

### API Routes

```typescript
// ✅ Good: Validation + error handling
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = issueSchema.parse(body);
    const issue = await prisma.issue.create({ data: validated });
    return Response.json(issue, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Database Queries

```typescript
// ✅ Good: Parameterized query
await prisma.$queryRaw`
  SELECT * FROM issues WHERE title = ${userInput}
`;

// ❌ Bad: SQL injection risk
await prisma.$queryRawUnsafe(`
  SELECT * FROM issues WHERE title = '${userInput}'
`);
```

---

## 7) Orchestrator Usage

### Start Orchestrator

```bash
cd .claude
python devhub_orchestrator.py
```

### Commands

- `help` - Show available commands
- `agents` - List available agents
- `status` - Show session status
- `continue` - Next workflow step
- `sessions` - List recent sessions
- `exit` - Quit (with optional archive)

### Example Session

```
💬 You: Design the database schema for issue filtering
🎯 Routing to: devhub-architect
[Architect provides schema design]

💬 You: continue
🔄 Continuing to: devhub-fullstack
[Fullstack provides implementation]

💬 You: continue
🔄 Continuing to: devhub-testing
[Testing provides test cases]
```

---

## 8) File Permissions

Configured in `.claude/settings.local.json`:

**Allow:**

- Read all files
- Write to apps/, packages/, docs/, .claude/
- Bash: pnpm, npm, docker, git, python

**Deny:**

- Write to node_modules/, .next/, dist/
- Write to .env (secrets)
- Destructive bash commands

**Ask First:**

- git push
- docker-compose down
- prisma migrate reset
- pnpm remove

---

## 9) Debugging Workflow

When encountering bugs:

1. **Reproduce** - Document exact steps
2. **Use Skill** - `.claude/skills/debugging/systematic-debugging-web.md`
3. **Trace** - If complex, use root-cause-tracing-fullstack.md
4. **Fix** - Implement solution
5. **Test** - Add regression test
6. **Review** - Run verification checklist

---

## 10) Commit Guidelines

- **Small, focused commits** - One logical change per commit
- **Descriptive messages** - Imperative mood, ≤72 chars
- **Reference issues** - Include issue number if applicable
- **No debug code** - Remove console.logs before commit
- **Pass all gates** - Build, test, lint must pass

Example:

```bash
git commit -m "feat: add issue filtering by priority and module"
git commit -m "fix: resolve hydration mismatch in IssueCard"
git commit -m "test: add E2E test for issue creation flow"
```

---

## 11) Best Practices

### Do:

✅ Use Server Components by default
✅ Validate all input with Zod
✅ Write tests before marking complete
✅ Use Prisma for all database access
✅ Follow patterns in docs/
✅ Keep commits small and focused
✅ Use skills for structured workflows

### Don't:

❌ Use `any` types
❌ Hardcode values
❌ Skip testing
❌ Write raw SQL strings
❌ Commit without running checks
❌ Bypass security validation
❌ Ignore accessibility

---

## 12) Getting Help

1. **Check docs/** - Architecture and implementation guides
2. **Check .claude/skills/** - Workflow methodologies
3. **Use orchestrator** - Get intelligent routing
4. **Run status** - Check current session state
5. **Ask specific questions** - Include context and files

---

## 13) Success Criteria

Development is successful when:

- [ ] All Golden Rules followed
- [ ] Quality gates pass
- [ ] Tests achieve 80%+ coverage
- [ ] Code reviewed (auditor agent)
- [ ] Documentation updated
- [ ] Commits are clean
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Accessible (WCAG 2.1 AA)

---

**Remember:** This agent system is here to help you build high-quality, maintainable software. Use the orchestrator for complex workflows, reference skills for methodologies, and always validate against the documentation before marking work complete.

**Questions?** Check `CLAUDE.md` for Claude Code integration details or `.claude/README.md` for agent system documentation.
