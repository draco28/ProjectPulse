# How to Run Gemini Documentation Audit

There are two ways to run this audit with Gemini:

---

## Option 1: Reference the Prompt File (Fastest)

**If Gemini can access your local files:**

1. Open Gemini (https://gemini.google.com/)
2. Copy and paste this prompt:

```
Read the file at F:\Web_Projects\AI_HUB\.agent\gemini\documentation-audit-prompt.md

This file contains comprehensive instructions for auditing my project documentation for workflow automation compatibility.

After reading the instructions, please:
1. Review all the documentation files listed in the prompt
2. Follow the audit methodology specified
3. Generate a comprehensive audit report in markdown format
4. Use the output format template provided in the prompt

The files to audit are in: F:\Web_Projects\AI_HUB\

Start by confirming you can access the prompt file, then proceed with the audit.
```

3. Wait for Gemini's response
4. Save Gemini's output as `.agent/gemini/documentation-audit-[date].md`

---

## Option 2: Upload the Prompt File (Most Reliable)

**If Gemini can't access local files directly:**

### Step 1: Prepare Files for Upload

You'll need to upload these files to Gemini:

**The Audit Instructions:**

- `.agent/gemini/documentation-audit-prompt.md`

**Documentation Files to Audit:**

- `STATUS.md`
- `docs/DEVELOPMENT_PLAN.md`
- `docs/UI_TRANSFORMATION_PLAN.md`
- `docs/WORKFLOW_ARCHITECTURE.md`
- `docs/01-ARCHITECTURE.md`
- `docs/02-DATABASE-SCHEMA.md`
- `docs/04-UI-ARCHITECTURE.md`
- `docs/03-MCP-SPECIFICATION.md`
- `.agent/README.md`
- `CLAUDE.md`

### Step 2: Upload to Gemini

1. Open Gemini (https://gemini.google.com/)
2. Click the attachment/upload button
3. Upload ALL the files listed above (11 files total)

### Step 3: Give This Prompt

After uploading, paste this:

```
I've uploaded 11 files:
1. documentation-audit-prompt.md - Contains comprehensive audit instructions
2-11. The documentation files to audit (STATUS.md, DEVELOPMENT_PLAN.md, etc.)

Please:
1. Read documentation-audit-prompt.md first to understand the audit task
2. Follow ALL instructions in that file, including:
   - Understanding the workflow automation system
   - Learning about skill triggers (7 skills with trigger keywords)
   - Learning about sub-agents and expert agents
   - Using the review methodology (5-point checklist per task)
   - Following the output format (phase-by-phase analysis)
3. Audit all the documentation files I uploaded
4. Generate a comprehensive audit report in markdown format

The audit should identify gaps where task descriptions lack:
- Skill-triggering keywords (e.g., "API endpoint", "React component", "Prisma query")
- Sub-agent invocation indicators (e.g., "Find existing patterns")
- Expert invocation indicators (e.g., "schema design", "component architecture")
- MCP tool mentions (e.g., "Playwright", "postgres MCP")
- Clear goals, requirements, deliverables

Your output should be a markdown file I can save as: .agent/gemini/documentation-audit-[date].md

Start by confirming you've read the audit instructions, then proceed.
```

### Step 4: Save Gemini's Output

1. Copy Gemini's complete markdown response
2. Save it as: `.agent/gemini/documentation-audit-20251026.md`
3. Tell Claude: "Read the Gemini audit file"

---

## Option 3: Use Google AI Studio (Alternative)

If you have access to Google AI Studio:

1. Go to https://aistudio.google.com/
2. Create a new prompt
3. Upload the files (same 11 files as Option 2)
4. Use the same prompt from Option 2
5. Run with Gemini 1.5 Pro (1M token context)
6. Save output as `.agent/gemini/documentation-audit-[date].md`

---

## What to Expect

**Processing Time:** 5-10 minutes

**Output Size:** 5,000-10,000 lines (comprehensive audit)

**Gemini Will Provide:**

1. **Executive Summary**
   - Overall automation readiness: [X]%
   - Gap breakdown: [X] critical, [X] important, [X] nice-to-have

2. **Phase-by-Phase Analysis**
   - For EVERY task in your documentation
   - What keywords are present
   - What keywords are missing
   - Specific recommendations

3. **Top 10 Critical Fixes**
   - Exact file and line number
   - Current text
   - Recommended addition
   - Why it helps automation

4. **Implementation Checklist**
   - Tasks to fix STATUS.md
   - Tasks to fix DEVELOPMENT_PLAN.md
   - Tasks to fix UI_TRANSFORMATION_PLAN.md
   - Validation steps

---

## After Getting Gemini's Audit

Tell Claude:

```
Read the Gemini audit file at .agent/gemini/documentation-audit-[date].md
```

Claude will:

1. Review Gemini's findings
2. Prioritize the gaps
3. Update your documentation files with rich keywords
4. Test that automation triggers work properly

---

## Troubleshooting

**If Gemini says it can't access files:**
→ Use Option 2 (upload files manually)

**If Gemini's output is too long:**
→ Ask Gemini to split it into multiple parts
→ Save each part as `documentation-audit-part1.md`, `part2.md`, etc.

**If Gemini asks for clarification:**
→ Tell it to refer to the examples in documentation-audit-prompt.md
→ Remind it to follow the output format in Part 9 of the prompt

**If Gemini's audit seems incomplete:**
→ Ask: "Did you analyze all tasks in DEVELOPMENT_PLAN.md?"
→ Ask: "Did you check UI_TRANSFORMATION_PLAN.md for all phases?"
→ Remind it to provide specific line numbers and text additions

---

## Quick Start (Recommended)

**Easiest approach:**

1. Try Option 1 first (reference file path)
2. If that doesn't work, use Option 2 (upload files)
3. Most reliable: Option 2 with file upload

**Expected result:**

A comprehensive audit that identifies every place in your documentation where adding keywords will enable automation to trigger properly.
