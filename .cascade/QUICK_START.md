# Cascade Quick Start Guide - Moksha DevHub

**Version:** 1.0  
**Last Updated:** 2025-10-28  
**Estimated Time:** 5 minutes

---

## What is This?

Cascade is your AI coding assistant in Windsurf IDE, now configured with the complete Moksha DevHub workflow system including:

- 8 Golden Rules for quality code
- 12 specialized agents (architects, experts, testers)
- 24 skills for common patterns
- 5-step mandatory protocol for consistency
- TDD-first development workflow

---

## Quick Start (3 Steps)

### Step 1: Start a Session (30 seconds)

Copy-paste this into Cascade:

```
MANDATORY PROTOCOL - Cascade Edition

Current phase: [Week 1.5 Phase 3 - Testing & QA]
Requirements: [What you're working on]

ENFORCE ALL 5 STEPS:
✅ Step 1: Initialize session
✅ Step 2: Save plan BEFORE code
✅ Step 3: Consult experts
✅ Step 4: Checkpoints every 15K tokens
✅ Step 5: Post-completion workflow

IF YOU SKIP ANY STEP, I WILL STOP YOU.

Proceed with [task name].
```

**Expected Response:**

```
✅ STEP 1 COMPLETE: Session initialized at [timestamp]

Created: .agent/task/current-session-[timestamp].md
Current phase: [Your phase]
Goals: [Your goals]
Token budget: [X]/200,000
```

### Step 2: Let Cascade Work (automatic)

Cascade will automatically:

- Read STATUS.md and DEVELOPMENT_PLAN.md
- Load relevant skills based on keywords
- Create session tracking files
- Follow the 5-step protocol

### Step 3: Verify Protocol (watch for confirmations)

You should see confirmations at each step:

- ✅ STEP 1 COMPLETE: Session initialized
- ✅ STEP 2 COMPLETE: Plan saved
- ✅ STEP 3 COMPLETE: Consulted [expert]
- ✅ CHECKPOINT at [X]K tokens: Progress saved
- ✅ STEP 5 COMPLETE: Documentation updated

**If you DON'T see these, stop Cascade and enforce the protocol!**

---

## Common Commands

### Get Expert Advice

```
"Consult react-expert about component architecture"
"Consult next-js-expert about Server/Client decisions"
"Consult prisma-expert about database schema"
```

### Load Skills

```
"Load api-patterns skill"
"Load testing-patterns skill"
```

(Skills also auto-load based on keywords)

### Check Status

```
"What are the Golden Rules?"
"What's the current phase?"
"Show me the protocol steps"
```

### Implement with TDD

```
"Implement [feature] with TDD workflow"
```

Cascade will:

1. 🔴 Write failing test first
2. 🟢 Write minimal code to pass
3. 🔵 Refactor for quality

---

## File Structure

Cascade creates these files automatically:

```
.agent/task/
├── current-session-[timestamp].md  # Real-time session log
├── current-plan.md                 # Approved implementation plan
├── current-todos.md                # Task checklist
└── [agent]-[topic]-[timestamp].md  # Expert consultations
```

---

## Golden Rules (Always Enforced)

1. **[R-DOC-001]** Documentation Authority - Follow docs/ architecture
2. **[R-DATA-001]** Data-Driven - No hardcoded values
3. **[R-TS-001]** Type Safety - No `any` types
4. **[R-NEXT-001]** Server Components First - Default to Server Components
5. **[R-SEC-001]** Prisma Parameterized - No SQL injection
6. **[R-TEST-001]** Testing Required - 80%+ coverage, TDD mandatory
7. **[R-MCP-001]** MCP Pattern - MCP calls Next.js API
8. **[R-PRIVACY-001]** Local-First - All data stored locally

---

## Troubleshooting

### "Cascade didn't provide Step X confirmation"

→ Stop and say: "You skipped Step X. Follow the protocol NOW."

### "Cascade isn't loading skills"

→ Use explicit command: "Load [skill-name] skill"

### "Session file not created"

→ Check .agent/task/ directory, restart with session starter template

### "Token usage too high"

→ Cascade should checkpoint at 15K intervals. Check current-session-\*.md file.

---

## Next Steps

1. **Read:** CASCADE_WORKFLOW_GUIDE.md for daily usage
2. **Reference:** CASCADE_TEMPLATES.md for copy-paste templates
3. **Understand:** CASCADE_INTEGRATION_PLAN.md for architecture

---

**You're ready to use Cascade with the full Moksha DevHub workflow! 🚀**
