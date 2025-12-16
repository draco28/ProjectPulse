# Prompt to Give Gemini

Copy this entire message and paste it into your Gemini conversation:

---

Hi Gemini! I need you to perform a comprehensive documentation audit for my project.

**Your Task:**

1. Read the comprehensive audit instructions from this file in my codebase:
   - `F:\Web_Projects\AI_HUB\.agent\gemini\documentation-audit-prompt.md`

2. Follow ALL the instructions in that file, including:
   - Understanding the workflow automation system
   - Learning about skill triggers, sub-agents, and expert agents
   - Reviewing all documentation files listed
   - Using the review methodology specified
   - Following the output format provided

3. Create a comprehensive audit report as an MD file with:
   - Executive summary with automation readiness percentage
   - Phase-by-phase gap analysis
   - Priority-ranked recommendations (CRITICAL, IMPORTANT, NICE-TO-HAVE)
   - Specific text additions for top 10 gaps
   - Implementation checklist

**Files You Need to Audit** (from the project root):

**Primary Files:**

- `STATUS.md`
- `docs/DEVELOPMENT_PLAN.md`
- `docs/UI_TRANSFORMATION_PLAN.md`

**Secondary Files:**

- `docs/WORKFLOW_ARCHITECTURE.md`
- `docs/01-ARCHITECTURE.md`
- `docs/02-DATABASE-SCHEMA.md`
- `docs/04-UI-ARCHITECTURE.md`
- `docs/03-MCP-SPECIFICATION.md`

**Reference Files:**

- `.agent/README.md`
- `CLAUDE.md`

**Your Output Should Be:**

A markdown file I can save as `.agent/gemini/documentation-audit-[today's date].md`

**Important:** The prompt file contains detailed examples, triggers, and methodology. Please read it carefully before starting the audit.

Start by confirming you've read `F:\Web_Projects\AI_HUB\.agent\gemini\documentation-audit-prompt.md`, then proceed with the audit.

Thank you!
