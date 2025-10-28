# Implementation Plan — Phase 3 Testing & QA

Created: 2025-10-28 18:54 (UTC+05:30)
Branch: feature/phase3-testing-qa
Status: APPROVED
Duration: ~4–5 hours

---

## Overview

Add comprehensive automated tests and quality verification for the five newly implemented pages and supporting APIs. Use Playwright for E2E flows and Jest + React Testing Library (RTL) for component behavior (Command Palette). Ensure pixel/behavior parity with Coral mockups and pass all quality gates.

---

## Deliverables

- apps/web/tests/e2e/knowledge.spec.ts
- apps/web/tests/e2e/wiki.spec.ts
- apps/web/tests/e2e/security.spec.ts
- apps/web/tests/e2e/agents.spec.ts
- apps/web/components/**tests**/CommandPalette.test.tsx
- COMPLETION_PHASE3_TESTING_QA.md (root)

---

## Implementation Steps

1. E2E Test Scaffolding

- Confirm Playwright config (apps/web/playwright.config.ts: testDir ./tests/e2e, baseURL http://localhost:3000, webServer pnpm dev).
- Reuse selector strategy from existing tests (prefer semantic locators; add data-testid only when necessary).

2. Knowledge Base E2E (knowledge.spec.ts)

- Load /knowledge → search → tag/category filters → open article → verify content sections.
- Assert URL state updates for filters (search params) when applicable.

3. Wiki E2E (wiki.spec.ts)

- Load /wiki/[slug] → TOC highlights as sections intersect → related links visible → navigate related.
- Verify ISR/real-time bits by awaiting content stabilization instead of fixed timeouts.

4. Security E2E (security.spec.ts)

- Load /security → verify score meter + breakdown → list vulnerabilities → filter by severity/status.

5. Agents E2E (agents.spec.ts)

- Load /agents → toggle persona active state (optimistic UI) → verify final state persists.

6. Command Palette Unit/Component Tests (CommandPalette.test.tsx)

- Open via Ctrl/Cmd+K → keyboard navigation (ArrowUp/Down, Enter) → search filter → close on Escape.
- Use RTL with jest-environment-jsdom and @testing-library/user-event.

7. Pixel/Behavior Verification

- Compare rendered UI states against Coral mockups for the pages (visual cues, headers, key components).

8. Quality Gates & Docs

- Run pnpm type-check, lint, test, build.
- Create COMPLETION_PHASE3_TESTING_QA.md.
- Update STATUS.md and docs/DEVELOPMENT_PLAN.md headers per maintenance protocol.

---

## Test Data & Stability

- Assume seeded data for KnowledgeArticle, WikiPage, SecurityVulnerability, AgentPersona.
- Prefer robust waits (toBeVisible, networkidle) and state assertions over fixed timeouts.
- Add data-testid attributes only when CSS/text locators are too brittle.

---

## Coverage & Metrics

- ≥80% coverage for new test code.
- Ensure critical paths (search, filters, TOC navigation, persona toggle, command palette keyboarding) are covered.

---

## Token Checkpoints

- 15K: Knowledge + Wiki E2E skeletons pass basic assertions.
- 30K: Security + Agents E2E stable; Command Palette unit tests green.
- 45K: Pixel/behavior verification complete; quality gates green.

---

## Success Criteria

- All added tests pass reliably on local runs (non-flaky).
- Build and lint/type-check pass.
- Acceptance criteria from STATUS.md satisfied for each page.
- Documentation updated and completion doc created prior to code commit.
