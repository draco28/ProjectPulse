# Slash Command: /validate-work

**Purpose**: Validate implementation work at checkpoints (day completion, token milestones, sprint completion)

**Usage**:

```
/validate-work <checkpoint-type>
```

**Arguments**:

- `checkpoint-type`: One of:
  - `day-1`, `day-2`, ..., `day-10` - Day completion validation
  - `token-15K`, `token-30K`, `token-45K`, etc. - Token milestone validation
  - `sprint-complete` - Full sprint validation
  - `phase-complete` - Full phase validation

**Examples**:

```
/validate-work day-1
/validate-work token-30K
/validate-work sprint-complete
```

---

## Command Execution

When this command is invoked, launch a validation sub-agent with the following prompt:

```
You are a Validation Agent responsible for verifying implementation work against protocol compliance, code quality, and requirements traceability.

**Current Context:**
- Checkpoint type: {checkpoint-type}
- Current phase: {read from .agent/progress.md}
- Current sprint: {read from .agent/progress.md}

**Your Task:**
1. Read and follow the complete validation protocol: .agent/procedures/validation-protocol.md
2. Execute all 5 validation checklist sections:
   - Task Completion Validation
   - Code Quality & Standards Validation
   - Protocol Compliance Validation
   - Requirements Traceability Validation
   - Quality Gates Validation
3. Generate a comprehensive validation report following the specified format
4. Save the report to: .agent/task/validation-{checkpoint-type}-{timestamp}.md
5. Return a summary to the user with overall status and critical findings

**Files you MUST read:**
- .agent/procedures/validation-protocol.md (your instruction manual)
- .agent/task/current-session-[latest].md (session log)
- .agent/task/current-todos.md (task tracking)
- .agent/task/current-plan.md (implementation plan)
- .agent/progress.md (phase/sprint context)
- Implementation files (code, tests, configs as needed)

**Validation approach:**
- Be thorough but efficient - read only what's needed for the checkpoint type
- day-X: Focus on tasks, code quality, incremental progress
- token-XK: Focus on protocol Step 4 compliance, quick health check
- sprint-complete: Full validation of all 5 categories
- phase-complete: Full validation + cross-sprint consistency check

**Output requirements:**
- Save complete report to file
- Return concise summary with:
  - Overall status (✅ PASS / ⚠️ PASS WITH ISSUES / 🚨 FAIL)
  - Grade (A+ to F)
  - Top 3 issues found (if any)
  - Recommended next steps

**Important:**
- Follow the validation protocol exactly as written
- Use the grade rubric provided
- Be objective and evidence-based
- Provide actionable recommendations
```

---

## Integration with MANDATORY_SESSION_PROTOCOL

This validation command supports the 5-step protocol:

**Step 1 (Initialize)**: Validates session file creation
**Step 2 (Plan)**: Validates plan/todos file creation
**Step 3 (Experts)**: Validates expert consultations happened
**Step 4 (Checkpoints)**: Validates checkpoint updates at token milestones
**Step 5 (Post-completion)**: Validates documentation updates and commits

---

## When to Use

**Mandatory validation points:**

- After Day 1 (setup & planning)
- After Day 5 (mid-sprint checkpoint)
- After Day 10 (sprint completion)
- At sprint completion (even if not Day 10)

**Optional validation points:**

- At token milestones (15K, 30K, 45K, 60K) - quick protocol check
- After major deliverable completion
- When concerns arise about quality or compliance

**Emergency validation:**

- If implementation appears to drift from plan
- If protocol violations suspected
- Before making irreversible changes (e.g., database migrations)

---

## Expected Output

**Console output:**

```
🛡️ Validation Agent Starting...
Reading validation protocol: .agent/procedures/validation-protocol.md
Checkpoint type: day-1
Current phase: Phase A — Foundation & Core Infrastructure
Current sprint: Sprint 1

[Agent performs validation...]

✅ Validation Complete!

Report saved: .agent/task/validation-day-1-20251106-1430.md

📊 Summary:
- Overall Status: ✅ PASS
- Grade: A+
- Tasks Completed: 4/4 (100%)
- Token Usage: 8K/200K
- Issues Found: 0 critical, 0 warnings, 1 info

🎯 Recommended Next Steps:
- Proceed with Day 2 tasks (Prisma schema)
- Continue monitoring token usage at 15K milestone
```

**Saved report file:**

```
.agent/task/validation-day-1-20251106-1430.md
```

(Full validation report following the format in validation-protocol.md)

---

## Troubleshooting

**If validation fails to find files:**

- Check that implementer created session/todos/plan files
- Verify .agent/task/ directory exists
- Use latest session file timestamp

**If quality gates fail:**

- Run commands manually to see full output
- Check if implementation is incomplete (expected for mid-sprint)
- For day-1, quality gates may not apply yet

**If validation report is too brief:**

- Remind validator to read validation-protocol.md fully
- Provide additional context about what was implemented
- Specify areas of concern for focused validation

---

## Maintenance

**Update this command when:**

- Validation protocol (validation-protocol.md) is updated
- New checkpoint types are needed
- Integration with other tools changes

**Related files:**

- `.agent/procedures/validation-protocol.md` - The validation procedure
- `.agent/MANDATORY_SESSION_PROTOCOL.md` - The 5-step protocol being validated
- `.agent/task/` - Where validation reports are saved

---

**End of Command Definition**
