# Skills Index - Moksha DevHub

## Overview

This document catalogs all specialized skills available for DevHub development. Skills are procedural guides that provide structured methodologies for common workflows.

## Skills by Category

### 🐛 Debugging (2 skills)

#### 1. Systematic Debugging (Web)

**File:** `.claude/skills/debugging/systematic-debugging-web.md`

**When to use:**

- Investigating Next.js/React/API bugs
- Debugging database queries (Prisma)
- Resolving hydration mismatches
- Troubleshooting Server/Client component issues

**Key techniques:**

- Layer isolation (Frontend → API → Database)
- Browser DevTools usage
- Prisma query logging
- Docker debugging

#### 2. Root Cause Tracing (Fullstack)

**File:** `.claude/skills/debugging/root-cause-tracing-fullstack.md`

**When to use:**

- Bug symptom appears far from source
- Need to trace data through full stack
- Multiple layers interacting incorrectly
- Systematic debugging narrowed scope

**Key techniques:**

- Backward tracing (UI → API → DB)
- Binary search approach
- Layer-by-layer verification
- Console logging strategy

---

### 🧪 Testing (2 skills)

#### 3. Test-Driven Development (Web)

**File:** `.claude/skills/testing/test-driven-development-web.md`

**When to use:**

- Implementing new features
- Fixing bugs that need regression tests
- Refactoring existing code
- Adding data-driven content validation

**Key workflow:**

- 🔴 RED: Write failing test
- 🟢 GREEN: Make it pass
- 🔵 REFACTOR: Improve code

#### 4. API Testing Patterns

**File:** `.claude/skills/testing/api-testing-patterns.md`

**When to use:**

- Testing Next.js API routes
- Testing Server Actions
- Validating request/response formats
- Database integration testing

**Patterns covered:**

- Query parameter testing
- Validation error testing
- File upload testing
- Pagination testing

---

### ✅ Validation (2 skills)

#### 5. Verification Before Completion

**File:** `.claude/skills/validation/verification-before-completion.md`

**When to use:**

- Before marking any task complete
- Before creating commits
- Before requesting code review
- Pre-deployment checklist

**12-point checklist:**

1. Code quality
2. Build verification
3. Testing
4. Functionality
5. Database
6. Security
7. Performance
8. Accessibility
9. Documentation
10. Architecture compliance
11. Git hygiene
12. User experience

#### 6. Defense in Depth (Web)

**File:** `.claude/skills/validation/defense-in-depth-web.md`

**When to use:**

- Always (systemic practice)
- Planning features
- Implementing security
- Validating quality gates

**7 layers:**

1. TypeScript (design time)
2. Zod validation (runtime)
3. Database constraints (storage)
4. API error handling (execution)
5. React error boundaries (UI)
6. Automated tests (pre-commit)
7. Monitoring & logging (production)

---

### 🏗️ Architecture (1 skill)

#### 7. API Design Patterns

**File:** `.claude/skills/architecture/api-design-patterns.md`

**When to use:**

- Designing new API routes
- Implementing REST endpoints
- Planning Server Actions
- API refactoring

**Patterns covered:**

- RESTful resource naming
- Pagination & filtering
- Error response formats
- File uploads
- Nested resources

---

### 📚 Documentation (1 skill)

#### 8. Changelog Generator

**File:** `.claude/skills/documentation/changelog-generator.md`

**When to use:**

- Preparing releases
- Creating release notes
- Documenting feature milestones
- Publishing update summaries

**Formats:**

- Keep a Changelog standard
- Conventional commits parsing
- User-facing vs technical
- Automated generation scripts

---

## Skill Usage Matrix

### By Agent

| Agent                     | Primary Skills                                   | Secondary Skills                |
| ------------------------- | ------------------------------------------------ | ------------------------------- |
| **devhub-architect**      | API Design Patterns                              | Defense in Depth                |
| **devhub-fullstack**      | TDD, Systematic Debugging                        | Root Cause Tracing, API Testing |
| **devhub-testing**        | TDD, API Testing Patterns                        | Systematic Debugging            |
| **devhub-auditor**        | Verification Before Completion, Defense in Depth | All skills (review)             |
| **devhub-mcp-specialist** | API Design Patterns                              | TDD, Verification               |

### By Workflow Stage

| Stage              | Skills to Use                                       |
| ------------------ | --------------------------------------------------- |
| **Planning**       | API Design Patterns, Defense in Depth (prevention)  |
| **Implementation** | TDD, Systematic Debugging                           |
| **Testing**        | TDD, API Testing Patterns                           |
| **Debugging**      | Systematic Debugging, Root Cause Tracing            |
| **Review**         | Verification Before Completion, Defense in Depth    |
| **Release**        | Changelog Generator, Verification Before Completion |

---

## Quick Reference

### When You're Stuck

**"I have a bug..."**
→ Start with **Systematic Debugging (Web)**
→ If complex, use **Root Cause Tracing (Fullstack)**

**"I need to implement..."**
→ Start with **TDD (Web)**
→ Reference **API Design Patterns** for design

**"Is this ready to commit?"**
→ Use **Verification Before Completion**
→ Check **Defense in Depth** layers

**"I need to test..."**
→ Use **API Testing Patterns** for APIs
→ Use **TDD (Web)** for features

**"Preparing a release..."**
→ Use **Changelog Generator**
→ Run **Verification Before Completion**

---

## Adding New Skills

To add a new skill:

1. Create markdown file in appropriate category:

   ```bash
   .claude/skills/<category>/<skill-name>.md
   ```

2. Use standard frontmatter:

   ```yaml
   ---
   name: Skill Name (DevHub <Tech>)
   description: Brief description
   category: debugging|testing|validation|architecture|documentation
   version: 1.0
   project: Moksha DevHub (AI_HUB)
   ---
   ```

3. Structure content:
   - Overview
   - Core Principles
   - Workflow/Methodology
   - DevHub-specific Examples
   - Integration with Agents
   - Success Criteria

4. Update this index

---

## Skill Statistics

- **Total Skills:** 8
- **Categories:** 5
- **Debugging:** 2
- **Testing:** 2
- **Validation:** 2
- **Architecture:** 1
- **Documentation:** 1

## Skill Versioning

All skills are currently at **version 1.0**. As patterns evolve or new techniques are added, skills will be updated and versioned accordingly.

---

**Last Updated:** January 23, 2025
**Total Coverage:** All workflow stages covered
