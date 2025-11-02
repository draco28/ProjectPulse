# Auto-Skill Generation - Test Scenario

**Created**: 2025-10-26
**Purpose**: Validate that the auto-skill generation system works correctly
**Status**: Ready for testing

---

## Test Scenario 1: Manual Skill Generation via /update-doc

### Objective

Verify that Claude can generate a skill file when explicitly requested via slash command.

### Steps

1. User completes several API endpoints with consistent Zod validation patterns
2. User says: `/update-doc skill "api-validation"`
3. Claude should:
   - Invoke synthesize-docs sub-agent in skill mode
   - Sub-agent analyzes recent API implementations
   - Sub-agent identifies Zod validation patterns
   - Sub-agent creates token-efficient skill file (50-280 tokens)
   - Claude saves to `.claude/skills/projectpulse/api-validation.skill.md`
   - Claude updates `.claude/skills/projectpulse/README.md`
   - Claude reports token savings

### Success Criteria

- ✅ Skill file created at correct location
- ✅ File is under 280 tokens
- ✅ File contains: Pattern description, steps, minimal example, links to full docs
- ✅ Skill index (README.md) updated with new entry
- ✅ Token savings calculated and reported (e.g., "93% reduction: 220 vs 3,000 tokens")
- ✅ Links to full SOP/system docs included

### Expected File Content

````markdown
---
name: api-validation
description: Zod validation pattern for API routes
category: api
tokens: 220
related_docs:
  - .agent/sops/adding-api-endpoint.md
  - .agent/system/api-catalog.md
---

# API Validation Quick Reference

## Pattern

Define Zod schema → Parse request body → Return validation errors or proceed

## Steps

1. Define schema: `const schema = z.object({ ... })`
2. Parse in route: `const result = schema.safeParse(body)`
3. Handle errors: Return 400 with `result.error.issues`

## Example

```typescript
// Schema
const issueSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
});

// In route handler
const result = issueSchema.safeParse(await request.json());
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```
````

## Links

- Full guide: [.agent/sops/adding-api-endpoint.md](.agent/sops/adding-api-endpoint.md)
- API catalog: [.agent/system/api-catalog.md](.agent/system/api-catalog.md)

````

---

## Test Scenario 2: Pattern Detection by explore-codebase

### Objective
Verify that explore-codebase can detect patterns suitable for skill generation.

### Steps
1. User says: "Analyze API validation patterns across the codebase"
2. Claude should:
   - Invoke explore-codebase sub-agent with pattern detection mode
   - Sub-agent scans 5-10 API route files
   - Sub-agent identifies repeating patterns
   - Sub-agent extracts common conventions (imports, naming, structure)
   - Sub-agent creates pattern detection report
   - Report saved to `.agent/task/explore-api-patterns-[timestamp].md`

### Success Criteria
- ✅ explore-codebase uses "Pattern Detection for Skill Generation" capability
- ✅ Report identifies 3-5 common patterns
- ✅ Report extracts conventions: imports, naming, structure, error handling
- ✅ Report includes "Token-Efficient Summary" section
- ✅ Report includes minimal example code structure
- ✅ Report links to full documentation

### Expected Report Structure
```markdown
# Exploration Report: API Validation Patterns

**Agent**: explore-codebase
**Created**: 2025-10-26 14:45
**Topic**: API validation patterns for skill generation

## Pattern Detection Report: API Validation

### Common Patterns (3-5 patterns)
1. **Zod Schema Validation**: Define schema, safeParse request, return errors
   - Seen in: [app/api/issues/route.ts:15], [app/api/preferences/route.ts:22], [app/api/search/route.ts:8]
   - Key elements: z.object(), safeParse(), error.issues

2. **NextResponse Error Format**: Consistent { error } format with status codes
   - Seen in: [all API routes]
   - Key elements: NextResponse.json({ error }, { status })

### Consistent Conventions
- **Imports**: `import { z } from 'zod'`, `import { NextResponse } from 'next/server'`
- **Naming**: `[entity]Schema` for Zod schemas
- **Structure**: Schema definition → safeParse → error check → proceed
- **Error Handling**: Return 400 with validation errors, 500 for server errors

### Token-Efficient Summary (for skill file)
- Define Zod schema with z.object()
- Use safeParse() in route handler
- Return 400 with error.issues if validation fails
- Proceed with result.data if validation succeeds

### Example Code Structure
```typescript
const schema = z.object({ ... });
const result = schema.safeParse(body);
if (!result.success) return NextResponse.json({ error }, { status: 400 });
// Use result.data
````

### Links to Full Documentation

- Related SOP: [.agent/sops/adding-api-endpoint.md]
- System docs: [.agent/system/api-catalog.md]

```

---

## Test Scenario 3: End-to-End Skill Generation Workflow

### Objective
Verify complete workflow from pattern detection to skill file creation.

### Steps
1. User implements 3-5 similar features (e.g., API endpoints with Zod validation)
2. User says: "Generate a skill for API validation patterns"
3. Claude should:
   - Invoke explore-codebase to detect patterns
   - Read the pattern detection report
   - Invoke synthesize-docs in skill mode
   - Pass pattern report to synthesize-docs
   - synthesize-docs creates token-efficient skill
   - Claude saves skill file
   - Claude updates skill index
   - Claude reports completion with token savings

### Success Criteria
- ✅ Both sub-agents invoked (explore-codebase, synthesize-docs)
- ✅ Pattern report created and read by main agent
- ✅ Skill file created based on detected patterns
- ✅ Skill is under 280 tokens
- ✅ Skill accurately reflects detected patterns
- ✅ Token savings calculated
- ✅ Both report files persist in .agent/task/

### Expected Flow
```

User: "Generate a skill for API validation patterns"

Claude: "Invoking explore-codebase to detect API validation patterns..."
[Sub-agent creates: .agent/task/explore-api-patterns-20251026-1430.md]

Claude: "Pattern detection complete. Reading report...
Found 3 consistent patterns across 8 API routes.

         Invoking synthesize-docs to create skill file..."
         [Sub-agent generates skill content]

Claude: "Skill generation complete!

         Created:
         - .claude/skills/projectpulse/api-validation.skill.md (220 tokens)

         Token Savings:
         - Skill: 220 tokens
         - Full SOP: 3,000 tokens
         - Reduction: 93% (2,780 tokens saved)

         Links to:
         - .agent/sops/adding-api-endpoint.md (full procedure)
         - .agent/system/api-catalog.md (API reference)"

````

---

## Test Scenario 4: Skill File Format Validation

### Objective
Verify that generated skill files follow the correct format and token limits.

### Steps
1. Generate several skill files for different topics
2. Validate each file against requirements

### Success Criteria
- ✅ File has YAML frontmatter with: name, description, category, tokens, related_docs
- ✅ File is under 280 tokens (strict requirement)
- ✅ Contains sections: Pattern, Steps, Example, Links
- ✅ Example code is minimal (structure only, not full implementation)
- ✅ Links to comprehensive documentation
- ✅ Uses bullet points instead of paragraphs
- ✅ Focuses on "what" and "how", minimal "why"

### Validation Checklist
```markdown
For each generated skill file:

Format:
- [ ] Has YAML frontmatter
- [ ] Frontmatter includes: name, description, category, tokens, related_docs
- [ ] Markdown sections: Pattern, Steps, Example, Links

Token Efficiency:
- [ ] Total tokens under 280 (absolute maximum)
- [ ] Uses bullet points, not paragraphs
- [ ] Example code shows structure, not full implementation
- [ ] Links to docs instead of repeating content

Content Quality:
- [ ] Pattern section: 2-3 sentence description
- [ ] Steps section: 3-5 actionable steps
- [ ] Example section: Minimal code showing pattern
- [ ] Links section: At least 2 links to full docs

Accuracy:
- [ ] Reflects actual codebase patterns
- [ ] Example code is syntactically correct
- [ ] Links point to existing documentation
````

---

## Test Scenario 5: Skill Index Management

### Objective

Verify that the skill index (README.md) is properly maintained.

### Steps

1. Generate multiple skills via `/update-doc skill [topic]`
2. Check that each skill is added to `.claude/skills/projectpulse/README.md`
3. Verify categorization and token counts

### Success Criteria

- ✅ README.md updated after each skill creation
- ✅ Skills categorized appropriately (API, UI, Database, etc.)
- ✅ Each entry includes: skill name, description, token count
- ✅ Token savings percentage calculated
- ✅ Links to skill files are correct
- ✅ Organized by category

### Expected Index Structure

```markdown
# ProjectPulse Skills

Quick reference patterns for common tasks. Each skill is token-efficient (50-280 tokens) and links to comprehensive documentation.

## API Skills

### [api-validation.skill.md](api-validation.skill.md)

**Description**: Zod validation pattern for API routes
**Tokens**: 220 | **Savings**: 93% (vs 3,000 token SOP)
**Links**: [Full SOP](.agent/sops/adding-api-endpoint.md)

### [api-error-handling.skill.md](api-error-handling.skill.md)

**Description**: NextResponse error patterns with status codes
**Tokens**: 180 | **Savings**: 94% (vs 2,800 token SOP)
**Links**: [Full SOP](.agent/sops/adding-api-endpoint.md)

## Database Skills

### [prisma-queries.skill.md](prisma-queries.skill.md)

**Description**: Common Prisma query patterns with relations
**Tokens**: 250 | **Savings**: 92% (vs 3,200 token SOP)
**Links**: [Full SOP](.agent/sops/database-operations.md)

## UI Skills

### [form-handling.skill.md](form-handling.skill.md)

**Description**: react-hook-form with Zod validation
**Tokens**: 270 | **Savings**: 91% (vs 3,000 token SOP)
**Links**: [Full SOP](.agent/sops/form-implementation.md)

---

**Total Skills**: 4
**Average Token Count**: 230 tokens
**Average Savings**: 92.5%
```

---

## Test Scenario 6: Skill vs SOP Usage Pattern

### Objective

Verify that Claude knows when to use skills vs full SOPs.

### Steps

1. Session start: Claude should check for relevant skills
2. If skill exists for current phase, use it
3. If no skill or need full details, read SOP
4. Document when each is used

### Success Criteria

- ✅ Claude checks `.claude/skills/projectpulse/` at session start
- ✅ Loads skills matching current phase keywords
- ✅ Uses skill for quick reference during implementation
- ✅ Falls back to full SOP when skill doesn't exist
- ✅ Reads full SOP when detailed procedure needed
- ✅ Documents token usage: "Loaded api-validation skill (220 tokens) instead of full SOP (3,000 tokens)"

### Expected Behavior

```
Scenario A: Skill exists
User: "Read STATUS.md, DEVELOPMENT_PLAN.md and continue"
STATUS.md shows: Phase 3.2 - Implement POST /api/issues endpoint

Claude: [Parses STATUS.md]
        [Keywords detected: "API endpoint"]
        [Checks .claude/skills/projectpulse/]
        [Finds: api-validation.skill.md, api-error-handling.skill.md]
        [Loads both skills: 220 + 180 = 400 tokens]

        "Starting Phase 3.2 - POST /api/issues endpoint

         Loaded skills:
         - api-validation.skill.md (220 tokens)
         - api-error-handling.skill.md (180 tokens)

         Token savings: 400 tokens vs 5,800 tokens (93% reduction)

         Following pattern: Define Zod schema → validate → Prisma query → respond"

Scenario B: No skill exists
User: "Implement database migration for new agent_personas table"

Claude: [Keywords detected: "database migration"]
        [Checks .claude/skills/projectpulse/]
        [No matching skill found]
        [Falls back to full SOP]
        [Reads .agent/sops/database-migrations.md (3,200 tokens)]

        "No skill found for database migrations.
         Reading full SOP: .agent/sops/database-migrations.md

         Following procedure from SOP..."
```

---

## Validation Checklist

Use this checklist to validate the auto-skill generation system:

### Skill Generation

- [ ] `/update-doc skill [topic]` command works
- [ ] Invokes synthesize-docs in skill mode
- [ ] Skill file created under 280 tokens
- [ ] Skill file has correct format (YAML + sections)
- [ ] Links to comprehensive documentation

### Pattern Detection

- [ ] explore-codebase can detect patterns
- [ ] Pattern report identifies 3-5 patterns
- [ ] Report extracts conventions (imports, naming, structure)
- [ ] Report includes token-efficient summary
- [ ] Report saved to .agent/task/

### Skill Index

- [ ] README.md updated after skill creation
- [ ] Skills categorized appropriately
- [ ] Token counts and savings documented
- [ ] Links are correct

### Integration

- [ ] Claude checks for skills at session start
- [ ] Loads relevant skills based on phase keywords
- [ ] Falls back to full SOP when needed
- [ ] Documents token usage

---

## Common Issues to Check

### Issue 1: Skill exceeds 280 tokens

**Symptom**: Generated skill file is too large
**Fix**: Synthesize-docs should trim example code, use fewer words, link to docs more

### Issue 2: Pattern detection too shallow

**Symptom**: explore-codebase only finds 1-2 patterns
**Fix**: Sub-agent should analyze more files (5-10 minimum)

### Issue 3: Skill doesn't match actual codebase

**Symptom**: Skill pattern doesn't reflect what's actually implemented
**Fix**: Ensure explore-codebase scans recent implementations, not old code

### Issue 4: Missing links to full docs

**Symptom**: Skill doesn't link to SOP or system docs
**Fix**: Synthesize-docs should always include Links section

### Issue 5: Skill index not updated

**Symptom**: New skill created but README.md not updated
**Fix**: /update-doc command should update index after skill creation

---

## Success Metrics

**Phase 3 Auto-Skill Generation is successful if:**

1. **100% of skill generation requests** complete successfully
2. **100% of skills** are under 280 tokens
3. **100% of skills** link to comprehensive documentation
4. **90%+ token savings** achieved (skill vs full SOP)
5. **Skill index** maintained correctly
6. **Claude auto-loads skills** at session start

---

**Status**: Ready to test in next session
**Next**: Run Test Scenario 1 after implementing a feature with consistent patterns
