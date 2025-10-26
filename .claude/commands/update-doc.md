---
description: Initialize or update .agent/ documentation system
---

# update-doc Command

You are tasked with managing the `.agent/` documentation system based on the user's request.

## Command Format

`/update-doc [action]`

## Actions

### initialize

**When**: First time setup or reset documentation structure
**What to do**:

1. Create `.agent/` folder structure if not exists:
   - `.agent/README.md`
   - `.agent/task/`
   - `.agent/system/`
   - `.agent/sops/`
2. Generate initial system documentation:
   - Invoke map-system sub-agent to create database-schema.md
   - Invoke map-system sub-agent to create api-catalog.md
   - Create component-patterns.md (basic version)
   - Create mcp-tools-guide.md (current tools)
3. Create README.md index with current documentation
4. Confirm completion

### after-feature

**When**: After completing a feature implementation
**What to do**:

1. If used plan mode, ask if user wants to save implementation plan
   - If yes, save to `.agent/task/[feature-name].md`
2. Ask if feature introduced new patterns/procedures
   - If yes, invoke synthesize-docs sub-agent to generate SOP
   - Save to `.agent/sops/[procedure-name].md`
3. Update `.agent/README.md` index with new files
4. Confirm what was saved

### sop [topic]

**When**: User wants to create a specific SOP
**What to do**:

1. Invoke synthesize-docs sub-agent with topic
2. Sub-agent reviews recent implementation or git history for the topic
3. Generates structured SOP following template
4. Save to `.agent/sops/[topic-name].md`
5. Update `.agent/README.md` index
6. Confirm completion

### refresh-system

**When**: Database schema, API routes, or components changed significantly
**What to do**:

1. Invoke map-system sub-agent for each:
   - database-schema.md (scan prisma/schema.prisma)
   - api-catalog.md (scan app/api/\*\*/route.ts)
   - component-patterns.md (scan components/\*_/_.tsx)
2. Update `.agent/system/` files with latest
3. Update `.agent/README.md` timestamps
4. Confirm what was refreshed

## Template Structures

### SOP Template

Use this structure for all SOPs:

```markdown
# SOP: [Task Name]

## Purpose

[Why this procedure exists]

## When to Use

[Scenarios where you'd follow this SOP]

## Prerequisites

- [Required knowledge]
- [Required tools/setup]

## Procedure

### Step 1: [Action]

[Detailed instructions]

**Example**:
\`\`\`
[Code or command example]
\`\`\`

**Gotcha**: [Common mistake to avoid]

### Step 2: [Action]

[Continue...]

## Verification

How to verify it worked:

- [ ] [Check 1]
- [ ] [Check 2]

## Troubleshooting

### Issue: [Problem]

**Symptom**: [What you see]
**Cause**: [Why it happens]
**Solution**: [How to fix]

## Related Documentation

- [Link to related docs]

## Examples

[Real examples from the codebase]

---

**Last Updated**: [Date]
**Created From**: [Source of this SOP]
```

### System Doc Template

Use this structure for system documentation:

```markdown
# [System Component] Reference

**Last Updated**: [Date]
**Status**: [Current status]

---

## Quick Index

[Links to major sections]

## [Component Category]

[Detailed documentation with examples]

---

## Resources

[Links to related documentation]

---

**Last Updated:** [Date]
**Status:** [Current implementation status]
```

## Rules

### Always Follow

1. **Update .agent/README.md** after creating/modifying any doc
2. **Add "Last Updated" date** to all generated docs
3. **Cross-reference** related documentation
4. **Include examples** from actual codebase
5. **Ask for confirmation** before overwriting existing files

### Never Do

1. Don't create docs without user confirmation
2. Don't overwrite without checking existing content
3. Don't generate SOPs for trivial operations
4. Don't create system docs for non-existent features

## Sub-Agent Usage

### When to invoke synthesize-docs

- Creating any SOP
- Documenting procedures
- Archiving implementation plans

### When to invoke map-system

- Updating database-schema.md
- Updating api-catalog.md
- Refreshing component-patterns.md

### How to invoke

```
Invoke [sub-agent-name] with prompt:
"[Specific task description]"
```

Sub-agent will return markdown content ready to save.

## Example Usage

### Example 1: Initialize

```
User: /update-doc initialize

You: I'll initialize the .agent/ documentation structure.

[Create folders]
[Invoke map-system for database-schema.md]
[Invoke map-system for api-catalog.md]
[Create basic component-patterns.md]
[Create mcp-tools-guide.md]
[Generate README.md index]

✅ Documentation structure initialized:
- .agent/README.md (index)
- .agent/system/database-schema.md
- .agent/system/api-catalog.md
- .agent/system/component-patterns.md
- .agent/system/mcp-tools-guide.md

Ready for use!
```

### Example 2: After Feature

```
User: /update-doc after-feature

You: I see you just completed the issue tracking feature.

Would you like me to:
1. Save the implementation plan? (y/n)
2. Generate SOP for adding API endpoints? (y/n)

User: y, y

You: [Saves plan to .agent/task/issue-tracking.md]
     [Invokes synthesize-docs sub-agent]
     [Generates SOP at .agent/sops/adding-api-endpoint.md]
     [Updates .agent/README.md]

✅ Documentation updated:
- .agent/task/issue-tracking.md (implementation plan)
- .agent/sops/adding-api-endpoint.md (SOP)
- .agent/README.md (index updated)
```

### Example 3: Generate SOP

```
User: /update-doc sop "database migrations"

You: I'll generate an SOP for database migrations.

[Invokes synthesize-docs sub-agent]
[Sub-agent reviews Prisma workflow]
[Generates SOP]
[Saves to .agent/sops/database-migrations.md]
[Updates .agent/README.md]

✅ SOP created:
- .agent/sops/database-migrations.md

Covers:
- Running migrations
- Creating migrations
- Rollback procedures
- Prisma generate workflow
```

### Example 4: Refresh System

```
User: /update-doc refresh-system

You: I'll refresh all system documentation.

[Invokes map-system for database-schema.md]
[Invokes map-system for api-catalog.md]
[Invokes map-system for component-patterns.md]
[Updates timestamps in README.md]

✅ System documentation refreshed:
- .agent/system/database-schema.md (updated: 3 new models)
- .agent/system/api-catalog.md (updated: 2 new endpoints)
- .agent/system/component-patterns.md (updated: React patterns)

Last updated: 2025-10-26
```

## Integration with Workflow

This command integrates with the user's existing workflow:

**Current workflow** (unchanged):

1. Complete feature
2. Update STATUS.md
3. Update DEVELOPMENT_PLAN.md
4. Commit

**Enhanced with /update-doc** (optional):

1. Complete feature
2. `/update-doc after-feature` (saves plan + SOP)
3. Update STATUS.md
4. Update DEVELOPMENT_PLAN.md
5. Commit (including .agent/ docs)

## File Organization

After using this command, `.agent/` structure should be:

```
.agent/
├── README.md                    # Index (always keep updated)
├── task/                        # Implementation plans
│   ├── 001-issue-tracking.md
│   └── 002-search-feature.md
├── system/                      # Technical references (auto-generated)
│   ├── database-schema.md
│   ├── api-catalog.md
│   ├── component-patterns.md
│   └── mcp-tools-guide.md
└── sops/                        # Standard Operating Procedures
    ├── port-troubleshooting.md
    ├── git-workflow.md
    ├── adding-api-endpoint.md
    └── database-migrations.md
```

## Response Format

Always respond with:

1. **Confirmation** of what you're doing
2. **Progress updates** as you work
3. **Summary** of what was created/updated
4. **File paths** for easy reference
5. **Next steps** (if any)

Example:

```
✅ Documentation updated:
- .agent/sops/api-endpoints.md (SOP created)
- .agent/README.md (index updated)

You can now:
- Reference this SOP when adding new endpoints
- Run /update-doc refresh-system to update API catalog
```

---

**Remember**: The goal is to accumulate knowledge as the project grows, making it easier to maintain consistency and onboard future developers (or future you!).
