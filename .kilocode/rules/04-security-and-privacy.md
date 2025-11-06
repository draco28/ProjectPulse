# 04 Security and Privacy

- SQL Injection: Use parameterized Prisma; never $queryRawUnsafe
- Validation: Zod at all external boundaries (routes, actions, MCP tools)
- Output Encoding: Avoid XSS; sanitize any rich content
- Secrets: Do not log or commit; .env not modified by tools
- Local-First: No cloud dependencies; data remains local
- Error Handling: Do not leak stack traces in API responses

References: AGENTS.md Security Gate, .claude/skills/validation/defense-in-depth-web.md
