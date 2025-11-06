# 03 Quality Gates

Build Gate:

- pnpm lint passes
- pnpm type-check passes
- pnpm build succeeds

Test Gate:

- pnpm test passes
- 80%+ coverage for new code
- Regression tests for bugs

Security Gate:

- No SQL injection risks (no $queryRawUnsafe)
- Input validated with Zod
- XSS mitigations in UI (encode outputs, sanitize rich content)
- No secret leakage

Architecture Gate:

- Align with docs/
- Data-driven (no hardcoded business values)
- Type-safe patterns, module placement valid

Evidence: Provide outputs/screenshots under Step 4.5.
