# Workflow 09 — Audit & Security Review

Steps:

1. Validate inputs at boundaries (Zod)
2. Ensure parameterized Prisma; ban $queryRawUnsafe
3. Check output encoding, sanitize rich content
4. Ensure secrets not exposed; .env untouched
5. Add security tests (injection/XSS), regression tests
6. Verification Gate (Workflow 11)

Acceptance:

- Security gate items satisfied; tests prove defenses

References: rules/04-security-and-privacy.md
