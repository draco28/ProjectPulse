# React Expert Consultation — Component Testing (Command Palette)

Date: 2025-10-28 18:58 (UTC+05:30)
Phase: Week 1.5 Phase 3 — Testing & QA
Branch: feature/phase3-testing-qa

---

## Goals

- Design robust RTL tests for `CommandPalette` covering keyboard navigation, search filtering, and accessibility.
- Ensure test isolation and stability without flakiness.

## Recommendations

- Environment: `jest-environment-jsdom` (already configured in apps/web/jest.config.js).
- Libraries: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` (already present).
- Query strategy: Prefer role/name-based queries (`getByRole`, `getByLabelText`, `getByText`) for stability; fall back to `data-testid` only when necessary.
- Keyboard interactions:
  - Use `userEvent.keyboard('{Control>}k{/Control}')` (or `{Meta>}` on macOS) to open palette.
  - Navigate with `userEvent.keyboard('{ArrowDown}')` / `{ArrowUp}` and select with `Enter`.
  - Close with `Escape`.
- State updates: Prefer `await` with user events; Testing Library handles `act()` under the hood. Avoid manual `act()` unless warnings occur.
- Async UI: Assert on visible state (`toBeVisible`, `toHaveTextContent`) rather than timeouts. Use `findBy...` when awaiting populated lists.
- Determinism: Mock command search data if it depends on network. If client-only fuzzy search, provide a fixed dataset via props/context for tests.
- Accessibility: Ensure palette has ARIA semantics (role="dialog"/"listbox") and focus management is verified (`document.activeElement`).

## Minimal Test Cases

1. Opens via keyboard shortcut and renders initial state.
2. Filters items as user types; first item is selected by default.
3. Keyboard navigation moves selection; Enter triggers the selected command handler.
4. Escape closes the palette; focus returns to trigger element.
5. Accessibility: proper roles, labels, and visible focus are present.

## Implementation Notes

- If the component relies on context/providers, render with those providers in tests.
- Provide a small deterministic command dataset for predictable assertions.
- Avoid snapshot tests; assert behavior and semantics instead.

## Outcome

Adopt RTL tests focusing on behavior and accessibility with reliable keyboard interaction simulation using `userEvent`. Stabilize selectors with roles/names; introduce `data-testid` only if needed.
