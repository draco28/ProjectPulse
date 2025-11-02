# New Session Start Guide - ProjectPulse

**Purpose:** This is your starting point for EVERY new Claude Code conversation to avoid context loss.

**Last Updated:** October 24, 2025

---

## 🚀 Quick Start (Copy-Paste This to Claude)

**Option 1: Continue Current Work (Recommended)**

```
Read SESSION_START_GUIDE.md and STATUS.md to get up to speed.
Then continue with ProjectPulse development from where we left off.
```

**Option 2: Start Specific Task**

```
Read SESSION_START_GUIDE.md and STATUS.md.
I want to [describe your task: implement Dashboard, fix bug, add feature, etc.].
Check which agent and skills are needed, create appropriate Git branch, and proceed.
```

**Option 3: Planning/Architecture**

```
Read SESSION_START_GUIDE.md and STATUS.md.
I want to plan/design [feature name]. Use devhub-architect agent to help design the approach.
```

---

## 📋 Pre-Session Checklist (Do This Before Starting)

Before opening Claude Code, check these:

### 1. Git Status

```bash
cd f:\Web_Projects\AI_HUB
git status          # Which branch? Any uncommitted changes?
git branch -a       # All branches
git log --oneline -5  # Recent commits
```

### 2. Read Current Status

- Open `STATUS.md` (1-page snapshot)
- Check last completed phase
- Check current phase
- Note next immediate task

### 3. Identify Context Needed

- Which agent? (architect, fullstack, testing, auditor, mcp-specialist)
- Which skills? (TDD, git-workflow, debugging, etc.)
- Which docs? (ARCHITECTURE, DATABASE, MCP, UI, WORKFLOW)

---

## 🎯 What Claude Needs to Know

When starting a new session, Claude needs this context:

### Essential Information

1. **Current Phase**
   - "Week 1 Days 3-4: Dashboard Implementation"
   - Found in: `STATUS.md` → "Current Phase"

2. **What Was Just Completed**
   - "Day 2: Next.js app + 4 themes"
   - Found in: `STATUS.md` → "Last Completed"

3. **What's Next**
   - "Phase 1: Install shadcn/ui + theme effects"
   - Found in: `STATUS.md` → "Immediate Next Steps"

4. **Which Agent Needed**
   - "devhub-fullstack (UI specialist)"
   - Found in: `docs/DEVELOPMENT_PLAN.md` at the phase section

5. **Which Skills Needed**
   - "None (component building)" or "TDD, git-workflow"
   - Found in: `docs/DEVELOPMENT_PLAN.md` at the phase section

6. **Git Context**
   - Current branch, uncommitted changes
   - Which branch to create next
   - Found in: `git status` and `STATUS.md`

---

## 📖 Reading Order for New Sessions

Claude should read files in this order:

### 1. **STATUS.md** (1 page, ALWAYS READ FIRST)

- Current snapshot
- Last completed + current phase
- Immediate next steps
- Git status

### 2. **docs/DEVELOPMENT_PLAN.md** (focus on specific sections)

- Read "CURRENT STATUS" section at top
- Read current phase section (e.g., "Days 3-4: Dashboard Implementation")
- Note agent, skills, and reference documents

### 3. **CLAUDE.md** (if needed - agent/skill usage guide)

- How to use agents
- How to reference skills
- Orchestrator commands

### 4. **Phase-Specific Documentation** (as referenced in plan)

- Mockups (for UI work)
- Architecture docs (for design decisions)
- Database schema (for data modeling)
- MCP spec (for MCP integration)

---

## 🤖 Agent Selection Guide

### When to Use Each Agent

| Your Task              | Agent to Use              | Example Prompt                                  |
| ---------------------- | ------------------------- | ----------------------------------------------- |
| Design database schema | **devhub-architect**      | "Design database schema for issue filtering"    |
| Decide architecture    | **devhub-architect**      | "Should I use Server Actions or API routes?"    |
| Implement feature      | **devhub-fullstack**      | "Implement Dashboard components from mockups"   |
| Write tests            | **devhub-testing**        | "Write E2E tests for Dashboard"                 |
| Review code quality    | **devhub-auditor**        | "Review Dashboard implementation before commit" |
| Design MCP tools       | **devhub-mcp-specialist** | "Design MCP tool structure for project stats"   |

### How to Reference Agents

In your prompt, either:

1. Let Claude choose automatically based on task description
2. Explicitly mention: "Use devhub-fullstack agent to..."

---

## 🛠️ Skills Usage Guide

### Available Skills (9 total)

**Debugging (2 skills):**

- `systematic-debugging-web.md` - For investigating bugs
- `root-cause-tracing-fullstack.md` - For complex multi-layer bugs

**Testing (2 skills):**

- `test-driven-development-web.md` - For TDD workflow (RED/GREEN/REFACTOR)
- `api-testing-patterns.md` - For API endpoint testing

**Validation (2 skills):**

- `verification-before-completion.md` - Pre-commit 12-point checklist ⭐ **USE ALWAYS**
- `defense-in-depth-web.md` - Security validation layers

**Architecture (1 skill):**

- `api-design-patterns.md` - For designing REST APIs

**Documentation (1 skill):**

- `changelog-generator.md` - For release notes

**Git Collaboration (1 skill):**

- `git-workflow-best-practices.md` - For branching strategy ⭐ **USE FOR ALL GIT WORK**

### How to Reference Skills

In your prompt: "Follow the test-driven-development-web skill for this feature"

Or let Claude automatically select based on task type.

---

## 🌿 Git Workflow for Sessions

### Before Starting Work

1. **Check current branch**

   ```bash
   git branch --show-current
   ```

2. **Ensure master is up to date**

   ```bash
   git checkout master
   git pull origin master
   ```

3. **Create appropriate branch** (based on task type)
   - API work: `git checkout -b api/feature-name`
   - UI work: `git checkout -b ui/feature-name`
   - Full feature: `git checkout -b feature/feature-name`
   - Bug fix: `git checkout -b fix/bug-description`
   - Docs: `git checkout -b docs/update-name`

**Reference:** [.claude/skills/git-collaboration/git-workflow-best-practices.md](.claude/skills/git-collaboration/git-workflow-best-practices.md)

### After Completing Work

1. **Create completion document** (use COMPLETION_TEMPLATE.md)
2. **Update STATUS.md** with new current phase
3. **Update DEVELOPMENT_PLAN.md** "CURRENT STATUS" section
4. **Commit and push**
5. **Merge branch** (or open PR)

---

## 🔗 Essential File Locations

### Quick Reference

**Context Files (Start Here):**

- `STATUS.md` (root) - 1-page current status ⭐ **READ FIRST**
- `SESSION_START_GUIDE.md` (root) - This file

**Planning Files:**

- `docs/DEVELOPMENT_PLAN.md` - Complete development plan (126KB)
- `docs/WORKFLOW_ARCHITECTURE.md` - 3-track branching strategy

**Architecture Files:**

- `docs/01-ARCHITECTURE.md` - System architecture
- `docs/02-DATABASE-SCHEMA.md` - Complete Prisma schema
- `docs/03-MCP-SPECIFICATION.md` - MCP tools/resources/prompts
- `docs/04-UI-ARCHITECTURE.md` - UI design system
- `docs/07-QUICK-START.md` - Setup guide

**Mockup Files (for UI work):**

- `mockups/01-dashboard-neon.html` - Dashboard structure
- `mockups/DESIGN_DIRECTION.md` - Design tokens
- `mockups/MOCKUPS_COMPLETE.md` - All mockup features

**Agent & Skills:**

- `CLAUDE.md` (root) - Claude Code integration guide
- `.claude/agents/` - 5 specialized agents
- `.claude/skills/` - 9 specialized skills
- `.claude/SKILLS_INDEX.md` - Skills catalog

**Templates:**

- `COMPLETION_TEMPLATE.md` (root) - Template for completion docs

---

## ✅ Examples: Starting Different Types of Sessions

### Example 1: Continue Dashboard Implementation

**Prompt:**

```
Read SESSION_START_GUIDE.md and STATUS.md.
Continue with Week 1 Days 3-4 Dashboard implementation.
We're on Phase 1 (shadcn/ui setup). Create ui/dashboard-layout branch and proceed.
```

**What Claude Will Do:**

1. Read STATUS.md (sees Day 2 complete, Days 3-4 in progress)
2. Read DEVELOPMENT_PLAN.md Days 3-4 section
3. Note: Agent = devhub-fullstack, Skills = None
4. Check git status
5. Create `ui/dashboard-layout` branch
6. Start Phase 1: Install shadcn/ui

---

### Example 2: Fix a Bug

**Prompt:**

```
Read SESSION_START_GUIDE.md and STATUS.md.
I found a bug: theme switching causes a flash on page load.
Use systematic-debugging-web skill to fix it.
```

**What Claude Will Do:**

1. Read STATUS.md (for context)
2. Load systematic-debugging-web skill
3. Create `fix/theme-switching-flash` branch
4. Debug using systematic methodology
5. Fix the bug
6. Write regression test
7. Commit with proper message

---

### Example 3: Plan New Feature

**Prompt:**

```
Read SESSION_START_GUIDE.md and STATUS.md.
I want to add issue filtering functionality to the Dashboard.
Use devhub-architect to design the approach first.
```

**What Claude Will Do:**

1. Read STATUS.md
2. Switch to devhub-architect agent
3. Read ARCHITECTURE and DATABASE docs
4. Design filtering architecture
5. Recommend API structure
6. Suggest database changes
7. Create implementation plan

---

## 🚨 Common Mistakes to Avoid

❌ **DON'T:** Just say "continue" without context

- Claude doesn't know what was completed

✅ **DO:** Say "Read SESSION_START_GUIDE.md and STATUS.md, then continue"

- Claude gets full context in 1 minute

---

❌ **DON'T:** Jump into coding without checking git status

- You might be on the wrong branch

✅ **DO:** Check `git status` first, create appropriate branch

- Proper Git workflow prevents merge issues

---

❌ **DON'T:** Forget to update STATUS.md after completion

- Next session will lose context

✅ **DO:** Update STATUS.md, DEVELOPMENT_PLAN.md, and create completion doc

- Takes 5 minutes, saves hours later

---

## 📊 Success Metrics

**You're using this correctly when:**

✅ New sessions start productive work in < 2 minutes
✅ Claude knows what was completed without asking
✅ Claude picks the right agent/skills automatically
✅ Git branches follow proper naming conventions
✅ STATUS.md is always up to date
✅ Zero context confusion between sessions

---

## 🛟 Troubleshooting

### Problem: "Claude doesn't know what was completed"

**Solution:**

1. Check if STATUS.md is up to date
2. Check if DEVELOPMENT_PLAN.md "CURRENT STATUS" reflects reality
3. Update both files, then restart session

---

### Problem: "Wrong agent selected"

**Solution:**
Explicitly specify: "Use devhub-[agent-name] agent to..."

---

### Problem: "Context still feels lost"

**Solution:**

1. Verify STATUS.md exists and is recent
2. Read SESSION_START_GUIDE.md to Claude
3. Read STATUS.md to Claude
4. Read specific phase from DEVELOPMENT_PLAN.md

---

## 🎯 Your Action Items

**One-Time Setup (5 minutes):**

1. ✅ Bookmark this file (SESSION_START_GUIDE.md)
2. ✅ Read STATUS.md to understand current state
3. ✅ Check git status and branch
4. ✅ Read current phase from DEVELOPMENT_PLAN.md

**Every Session Start (1 minute):**

1. ✅ Read STATUS.md
2. ✅ Check git status
3. ✅ Tell Claude: "Read SESSION_START_GUIDE.md and STATUS.md, then [your task]"

**After Every Completion (5 minutes):**

1. ✅ Create completion doc (use COMPLETION_TEMPLATE.md)
2. ✅ Update STATUS.md
3. ✅ Update DEVELOPMENT_PLAN.md "CURRENT STATUS"
4. ✅ Git commit all changes
5. ✅ Push to GitHub

---

**✨ With this system, context loss becomes IMPOSSIBLE. Every session starts with full context in under 2 minutes.**

**🚀 Ready to start? Just say:**

> "Read SESSION_START_GUIDE.md and STATUS.md, then continue with ProjectPulse."
