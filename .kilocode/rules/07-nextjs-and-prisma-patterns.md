# 07 Next.js and Prisma Patterns

Next.js:

- App Router, React Server Components by default
- Use API routes or Server Actions per design; prefer API + services for consistency
- Data fetching on server; pass serialized props to client components
- Caching and revalidation per page needs

Prisma:

- Parameterized queries; no raw SQL strings
- Use select/include to limit payloads
- Add indexes where needed; avoid N+1 with relations

References: docs/03-Architecture.md, .agent/system/api-catalog.md, .agent/system/database-schema.md
