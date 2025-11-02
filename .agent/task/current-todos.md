# Phase 4 Todo List - Responsive Design & Polish

**Created:** 2025-11-01 16:15
**Phase:** Week 1.5 Phase 4 (Day 8)
**Total Tasks:** 79
**Progress:** 0/79 (0%)

---

## Protocol Steps

- [ ] STEP 1: Initialize session (create current-session file)
- [ ] STEP 2: Save plan and todos
- [ ] STEP 3: Consult experts (react-expert, next-js-expert)
- [ ] STEP 4: Progress checkpoints (every 15K tokens)
- [ ] STEP 5: Post-completion (docs, commits)

---

## TASK 1: Responsive Design (4-6 hours)

### Sidebar Component

- [ ] 1. Add mobile menu state (useState for isOpen)
- [ ] 2. Create hamburger button component
- [ ] 3. Add `hidden md:flex` classes to sidebar
- [ ] 4. Implement slide-in animation with Tailwind
- [ ] 5. Add overlay backdrop (z-index, onClick close)
- [ ] 6. Test at 320px, 768px, 1024px

### Header Component

- [ ] 7. Collapse search bar to icon on mobile
- [ ] 8. Create mobile search modal component
- [ ] 9. Add responsive padding (`px-4 md:px-8`)
- [ ] 10. Test search modal functionality

### FilterSidebar Component

- [ ] 11. Convert to drawer component on mobile
- [ ] 12. Add bottom sheet animation
- [ ] 13. Implement backdrop overlay
- [ ] 14. Add close button (touch-friendly)

### Page Layouts

- [ ] 15. Issue detail: Stack 3-column layout on mobile
- [ ] 16. Dashboard: Update widget grid to `lg:grid-cols-3`
- [ ] 17. Dashboard: Reduce hexagons on mobile (performance)

### Layout Updates

- [ ] 18. Add skip-to-content link to layout.tsx
- [ ] 19. Verify responsive viewport meta tag

**Checkpoint: Test all responsive breakpoints**

---

## TASK 2: Accessibility Audit (3-4 hours)

### ARIA Labels

- [ ] 20. Add aria-label to Header icon buttons
- [ ] 21. Add aria-label to Sidebar navigation items
- [ ] 22. Add aria-label to IssueActions buttons
- [ ] 23. Add aria-label to QuickActions buttons

### Keyboard Navigation

- [ ] 24. Add focus trap to CommandPalette
- [ ] 25. Verify Tab order across all pages
- [ ] 26. Add keyboard handlers (Enter, Space, Escape)

### Focus Indicators

- [ ] 27. Update globals.css with :focus-visible styles
- [ ] 28. Custom focus styles for neumorphic buttons

### FilterSidebar Accessibility

- [ ] 29. Add visible labels to checkboxes
- [ ] 30. Add aria-expanded to collapsible sections
- [ ] 31. Add aria-controls linking sections

### Validation

- [ ] 32. Run axe-core DevTools scan
- [ ] 33. Fix all violations
- [ ] 34. Test with keyboard only (no mouse)
- [ ] 35. Test with screen reader (NVDA)

**Checkpoint: axe-core reports 0 violations**

---

## TASK 3: Performance Optimization (3-4 hours)

### Bundle Analysis

- [ ] 36. Install @next/bundle-analyzer
- [ ] 37. Configure in next.config.js
- [ ] 38. Run bundle analysis
- [ ] 39. Identify largest chunks

### Lazy Loading

- [ ] 40. CodeBlock: Dynamic import react-syntax-highlighter
- [ ] 41. CommandPalette: Lazy load on Cmd+K
- [ ] 42. TipTap editor: Dynamic imports

### Icon Migration

- [ ] 43. Remove Font Awesome CDN from layout.tsx
- [ ] 44. Replace FA icons with Lucide (Header)
- [ ] 45. Replace FA icons with Lucide (Sidebar)
- [ ] 46. Replace FA icons with Lucide (other components)

### Component Optimization

- [ ] 47. Identify static components for Server Component conversion
- [ ] 48. Convert eligible components (target: 60% client)

### Motion Preferences

- [ ] 49. Add @media (prefers-reduced-motion) to globals.css
- [ ] 50. Disable animations for motion-sensitive users

### Performance Testing

- [ ] 51. Run Lighthouse audit
- [ ] 52. Verify Performance ≥90
- [ ] 53. Verify Accessibility ≥90
- [ ] 54. Check bundle size reduction

**Checkpoint: Lighthouse scores ≥90**

---

## TASK 4: Cross-Browser Testing (2-3 hours)

### Automated Testing

- [ ] 55. Run E2E tests on Chromium
- [ ] 56. Run E2E tests on Firefox
- [ ] 57. Run E2E tests on WebKit (Safari)
- [ ] 58. Run E2E tests on Mobile Chrome
- [ ] 59. Run E2E tests on Mobile Safari

### Manual Testing

- [ ] 60. Chrome: Test all pages and features
- [ ] 61. Firefox: Test grid layouts and shadows
- [ ] 62. Safari: Test backdrop-blur and CSS features
- [ ] 63. Edge: Full regression test

### Visual Verification

- [ ] 64. Verify neumorphic shadows render correctly
- [ ] 65. Check custom animations smoothness
- [ ] 66. Test touch interactions on mobile

**Checkpoint: All browser tests passing**

---

## POST-COMPLETION (Step 5)

### Documentation

- [ ] 67. Create COMPLETION_WEEK_1.5_PHASE_4.md
- [ ] 68. Update STATUS.md "Last Completed" section
- [ ] 69. Update DEVELOPMENT_PLAN.md "Current Status"

### Sub-Agent Invocations

- [ ] 70. Invoke synthesize-docs (if new patterns created)
- [ ] 71. Invoke map-system (update component-patterns.md)

### Git Commits

- [ ] 72. Stage documentation: .agent/ STATUS.md docs/
- [ ] 73. Commit docs: "docs: Update documentation after Phase 4"
- [ ] 74. Stage code files
- [ ] 75. Commit code: "feat: Phase 4 responsive design & polish"

### Quality Gates

- [ ] 76. pnpm type-check (0 errors)
- [ ] 77. pnpm lint (0 warnings)
- [ ] 78. pnpm build (success)
- [ ] 79. pnpm test (all passing)

---

## Progress Summary

**Completed:** 0/79 tasks (0%)

**Token Checkpoints:**

- Next: 75K tokens
- Then: 90K, 105K, 120K, 135K, 150K

**Current Session:** 20251101-1615
**Session File:** .agent/task/current-session-20251101-1615.md
**Plan File:** .agent/task/current-plan.md

---

**Last Updated:** 2025-11-01 16:15
**Next Update:** At 75K tokens checkpoint
