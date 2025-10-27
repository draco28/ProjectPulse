# Implementation Plan: Phase 3 Days 5-6 - Remaining Pages

**Created:** 2025-10-28 16:00
**Phase:** Week 1.5 Phase 3 Days 5-6
**Duration:** 2 days (~9 hours estimated)

---

## Overview

Implement 5 complete pages with full-stack integration: Knowledge Base, Wiki, Security, Agent Personas, and Command Palette.

---

## Implementation Tasks (29 total)

### Knowledge Base (Tasks 1-8)

1. Server Component `app/knowledge/page.tsx`
2. API route `app/api/knowledge/route.ts`
3. API route `app/api/search/route.ts`
4. Component `components/knowledge/ArticleCard.tsx`
5. Component `components/knowledge/CategoryFilter.tsx`
6. Component `components/knowledge/SearchBar.tsx`
7. E2E test `tests/e2e/knowledge.spec.ts`
8. Verify pixel-perfect match

### Wiki (Tasks 9-15)

9. Server Component `app/wiki/[slug]/page.tsx`
10. API route `app/api/wiki/[slug]/route.ts`
11. Component `components/wiki/WikiSidebar.tsx`
12. Component `components/wiki/TableOfContents.tsx`
13. Component `components/wiki/CodeBlock.tsx`
14. E2E test `tests/e2e/wiki.spec.ts`
15. Verify pixel-perfect match

### Security (Tasks 16-21)

16. Server Component `app/security/page.tsx`
17. API route `app/api/security/score/route.ts`
18. API route `app/api/security/vulnerabilities/route.ts`
19. Component `components/security/SecurityScoreMeter.tsx`
20. Component `components/security/VulnerabilityCard.tsx`
21. E2E test `tests/e2e/security.spec.ts`

### Agent Personas (Tasks 22-25)

22. Server Component `app/agents/page.tsx`
23. Server Actions `app/agents/actions.ts`
24. Component `components/agents/AgentCard.tsx`
25. E2E test `tests/e2e/agents.spec.ts`

### Command Palette (Tasks 26-29)

26. Component `components/CommandPalette.tsx`
27. Keyboard navigation implementation
28. Entity search integration
29. Unit tests `tests/unit/CommandPalette.test.tsx`

---

## Token Checkpoints

| Checkpoint | Tasks | Progress |
| ---------- | ----- | -------- |
| 90K        | 1-8   | 30%      |
| 105K       | 9-15  | 50%      |
| 120K       | 16-21 | 70%      |
| 135K       | 22-25 | 85%      |
| 150K       | 26-29 | 100%     |

---

## Success Criteria

✅ All 5 pages pixel-perfect to mockups
✅ Full database integration
✅ E2E tests passing
✅ Quality gates passing

---

**Timeline:** ~9 hours | **Token Budget:** ~110K tokens
