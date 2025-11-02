---
name: Verification Before Completion (DevHub Web)
description: Pre-commit quality checklist ensuring code meets all standards before marking tasks complete
category: validation
version: 1.0
project: ProjectPulse (AI_HUB)
---

# Verification Before Completion

## Overview

This skill provides a comprehensive pre-commit checklist to verify that implementations meet quality, security, performance, and documentation standards before marking tasks as complete.

## The Golden Rule

**Never mark a task complete until ALL quality gates pass.**

## Pre-Commit Checklist

### 1. Code Quality ✅

- [ ] **TypeScript**: No `any` types, all types explicit
- [ ] **ESLint**: No warnings or errors (`npm run lint`)
- [ ] **Formatting**: Code formatted with Prettier
- [ ] **Naming**: Clear, descriptive variable/function names
- [ ] **Comments**: Complex logic explained
- [ ] **No Dead Code**: Removed unused imports, variables, functions
- [ ] **No Console Logs**: All debug `console.log` removed
- [ ] **Error Handling**: Try/catch blocks where appropriate

```bash
# Run quality checks
npm run lint
npm run type-check
npm run format:check
```

### 2. Build Verification ✅

- [ ] **Development Build**: `npm run dev` starts without errors
- [ ] **Production Build**: `npm run build` succeeds
- [ ] **No Type Errors**: TypeScript compiles successfully
- [ ] **No Build Warnings**: Bundle size acceptable

```bash
# Verify builds
npm run build
npm run start
# Open http://localhost:3000 and test
```

### 3. Testing ✅

- [ ] **Unit Tests**: All pass (`npm test`)
- [ ] **Test Coverage**: Meets minimum (80%+ for new code)
- [ ] **Integration Tests**: API/Database tests pass
- [ ] **E2E Tests**: Critical flows work (if applicable)
- [ ] **Regression**: Existing tests still pass

```bash
# Run all tests
npm test
npm test -- --coverage

# Check specific test files
npm test -- IssueCard.test.tsx
```

### 4. Functionality ✅

- [ ] **Feature Works**: Manually tested in browser
- [ ] **Happy Path**: Main use case works perfectly
- [ ] **Error Cases**: Errors handled gracefully
- [ ] **Edge Cases**: Boundary conditions tested
- [ ] **Responsive**: Works on desktop (primary) and tablet
- [ ] **Cross-Browser**: Works in Chrome, Firefox (if critical)

### 5. Database ✅

- [ ] **Schema Valid**: `npx prisma validate` passes
- [ ] **Migration Created**: If schema changed
- [ ] **Indexes Added**: For frequently queried fields
- [ ] **Data Integrity**: Foreign keys and constraints correct
- [ ] **Seed Data**: Test data available if needed

```bash
# Verify database
npx prisma validate
npx prisma format
npx prisma migrate status
```

### 6. Security ✅

- [ ] **Input Validation**: Zod schemas for user input
- [ ] **SQL Injection**: Using Prisma parameterized queries
- [ ] **XSS Prevention**: React auto-escaping or DOMPurify
- [ ] **Secrets**: No API keys or passwords in code
- [ ] **Environment Variables**: Sensitive data in `.env`
- [ ] **CSRF**: Forms use POST with validation

### 7. Performance ✅

- [ ] **No N+1 Queries**: Prisma includes relations efficiently
- [ ] **Indexes**: Database queries use indexes
- [ ] **Lazy Loading**: Heavy components loaded dynamically
- [ ] **Image Optimization**: Using `next/image`
- [ ] **Bundle Size**: No unnecessary dependencies added

### 8. Accessibility ✅

- [ ] **Semantic HTML**: Proper tags (button, nav, main, etc.)
- [ ] **ARIA Labels**: Input fields labeled
- [ ] **Keyboard Navigation**: Can navigate without mouse
- [ ] **Color Contrast**: WCAG AA compliant (4.5:1 ratio)
- [ ] **Focus Management**: Visible focus indicators

### 9. Documentation ✅

- [ ] **Code Comments**: Complex logic explained
- [ ] **README Updated**: If new setup required
- [ ] **Architecture Docs**: Updated if patterns changed
- [ ] **API Documentation**: New endpoints documented
- [ ] **Changelog**: Changes noted (if using changelog)

### 10. Architecture Compliance ✅

- [ ] **Follows Patterns**: Aligns with [docs/01-ARCHITECTURE.md](../../docs/01-ARCHITECTURE.md)
- [ ] **Data-Driven**: No hardcoded values (use database/config)
- [ ] **MCP Compatible**: If relevant to MCP integration
- [ ] **Module Structure**: Files in correct directories
- [ ] **Imports**: Proper use of path aliases (@/)

### 11. Git Hygiene ✅

- [ ] **Commit Message**: Clear, descriptive, under 72 chars
- [ ] **Atomic Commits**: Each commit is self-contained
- [ ] **No WIP Commits**: All commits are complete work
- [ ] **Branch Up-to-Date**: Rebased/merged with main if needed
- [ ] **.gitignore**: No build artifacts, node_modules, .env committed

```bash
# Before commit
git status
git diff
git add .
git commit -m "feat: add issue filtering by priority"
```

### 12. User Experience ✅

- [ ] **Loading States**: Spinners/skeletons for async operations
- [ ] **Error Messages**: User-friendly, actionable
- [ ] **Success Feedback**: Confirmations for actions
- [ ] **Consistent UI**: Matches existing design patterns
- [ ] **Mobile-Friendly**: Responsive layout (if applicable)

## Quick Verification Script

```bash
#!/bin/bash
# verify.sh - Run all verification checks

echo "🔍 Running verification checks..."

echo "\n✅ 1. Linting..."
npm run lint || exit 1

echo "\n✅ 2. Type checking..."
npm run type-check || exit 1

echo "\n✅ 3. Running tests..."
npm test -- --coverage || exit 1

echo "\n✅ 4. Building..."
npm run build || exit 1

echo "\n✅ 5. Validating Prisma..."
npx prisma validate || exit 1

echo "\n🎉 All checks passed! Safe to commit."
```

## When to Skip Checks

**Never skip security, build, or test checks.**

You may reasonably skip:

- Cross-browser testing for internal tools
- E2E tests for minor UI tweaks (but add them later)
- Documentation for experimental branches

## Red Flags (Do NOT Commit)

❌ Build fails or has errors
❌ Tests are failing
❌ Console has errors
❌ TypeScript has `any` types everywhere
❌ Hardcoded secrets or API keys
❌ Commented-out code blocks
❌ Debug console.logs everywhere
❌ Unhandled promise rejections
❌ No error handling in API routes

## Success Criteria

Task is complete when:

- [ ] All checklist items pass
- [ ] No compromises on security or correctness
- [ ] Code is production-ready
- [ ] You'd be comfortable showing this to a senior engineer

## Integration with Agents

This skill is used by:

- **All agents** - Before marking any task complete
- **devhub-auditor** - As the audit checklist reference
- **devhub-fullstack** - Before final commit

Pair with:

- **defense-in-depth-web** - For deeper security validation
- **test-driven-development-web** - Ensure tests exist
- **systematic-debugging-web** - Fix issues found during verification

Remember: The goal isn't perfection on first try. It's ensuring that when you mark something "done," it truly is done - tested, secure, performant, and maintainable.
