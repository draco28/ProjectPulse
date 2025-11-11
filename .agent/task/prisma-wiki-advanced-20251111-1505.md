# Prisma Design Plan: Wiki Versioning, Search, Analytics

**Created**: 2025-11-11 15:05 PST  
**Type**: Schema Design + Migration + Query Optimization  
**Context**: Sprint 2 Week 3 Days 6-7 (US-023/024/025)

## Data Model Requirements
1. **Revision history** for every wiki edit with rollback + diff summary.  
2. **Full-text search** powered by PostgreSQL `tsvector` + ranked results.  
3. **Engagement analytics** capturing views, read time, feedback, and aggregated stats per page.  
4. **Mac mini deployment** (PostgreSQL 16 @ 192.168.1.15) must stay in sync with local migrations.

## Schema Design

```prisma
model WikiRevision {
  id           Int      @id @default(autoincrement())
  wikiPageId   Int
  wikiPage     WikiPage @relation(fields: [wikiPageId], references: [id], onDelete: Cascade)
  version      Int
  title        String
  excerpt      String?  @db.VarChar(200)
  content      String   @db.Text
  diffSummary  String?  @db.VarChar(500)
  createdBy    String   // MCP API key or human identifier
  createdByType String  @default("agent") // 'agent' | 'human'
  createdAt    DateTime @default(now())

  @@unique([wikiPageId, version])
  @@index([wikiPageId, version])
}

model WikiPage {
  // existing fields ...
  lastEditedBy  String?
  lastEditedAt  DateTime?
  isLocked      Boolean   @default(false)
  // Generated column for search (raw SQL)
  // content_tsv tsvector GENERATED ALWAYS AS ... stored in migration
}

model WikiPageEvent {
  id          BigInt   @id @default(autoincrement())
  wikiPageId  Int
  wikiPage    WikiPage @relation(fields: [wikiPageId], references: [id], onDelete: Cascade)
  type        WikiEventType
  actor       String?
  durationMs  Int?        // time on page
  metadata    Json?       // { feedback: "helpful" }
  createdAt   DateTime @default(now())

  @@index([wikiPageId, createdAt])
  @@index([type])
}

enum WikiEventType {
  VIEW
  FEEDBACK_POSITIVE
  FEEDBACK_NEGATIVE
  REVISION
}

model WikiPageAnalytics {
  id             Int      @id @default(autoincrement())
  wikiPageId     Int      @unique
  wikiPage       WikiPage @relation(fields: [wikiPageId], references: [id], onDelete: Cascade)
  viewCount      Int      @default(0)
  uniqueVisitors Int      @default(0)
  avgReadTimeMs  Int      @default(0)
  positiveVotes  Int      @default(0)
  negativeVotes  Int      @default(0)
  popularity     Float    @default(0)
  trend          Float    @default(0)
  refreshedAt    DateTime @default(now())
}
```

**Generated Column (migration SQL)**:
```sql
ALTER TABLE "WikiPage"
  ADD COLUMN content_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED;
CREATE INDEX wikipage_content_tsv_idx ON "WikiPage" USING GIN (content_tsv);
```

## Migration Strategy
1. **Prep migration**: `pnpm prisma migrate dev --name wiki_revision_search_analytics`.  
2. **Add tables** via Prisma schema + raw SQL for generated column using `prisma/migrations/.../migration.sql`.  
3. **Backfill**: script to insert baseline `WikiRevision` rows + compute analytics baseline (viewCount = existing `views`).  
4. **Mac mini deploy**: `DATABASE_URL=postgresql://.../projectpulse_dev pnpm prisma migrate deploy` (run via SSH).  
5. **Rollback plan**: `prisma migrate resolve --applied <migration>` followed by re-apply after fixes.

## Query Patterns

### 1. Recording Revisions
```typescript
await prisma.$transaction(async (tx) => {
  const current = await tx.wikiPage.findUniqueOrThrow({ where: { id } });
  await tx.wikiRevision.create({
    data: {
      wikiPageId: current.id,
      version: current.version,
      title: current.title,
      excerpt: current.excerpt,
      content: current.content,
      diffSummary,
      createdBy: actor.id,
      createdByType: actor.type,
    },
  });
  await tx.wikiPage.update({
    where: { id: current.id },
    data: {
      ...updatePayload,
      version: { increment: 1 },
      lastEditedBy: actor.displayName,
      lastEditedAt: new Date(),
    },
  });
});
```

### 2. Reverting to Revision
```typescript
await prisma.$transaction(async (tx) => {
  const revision = await tx.wikiRevision.findUniqueOrThrow({
    where: { wikiPageId_version: { wikiPageId: id, version } },
  });
  await tx.wikiPage.update({
    where: { id },
    data: {
      title: revision.title,
      excerpt: revision.excerpt,
      content: revision.content,
      version: { increment: 1 },
      lastEditedBy: actor.displayName,
      lastEditedAt: new Date(),
    },
  });
});
```

### 3. Ranked Search
```typescript
const results = await prisma.$queryRaw<WikiSearchResult[]>`
  SELECT id, title, path, excerpt, category,
         ts_rank_cd(content_tsv, plainto_tsquery('english', ${query})) AS rank
  FROM "WikiPage"
  WHERE content_tsv @@ plainto_tsquery('english', ${query})
  ORDER BY rank DESC, "updatedAt" DESC
  LIMIT ${limit} OFFSET ${offset};
`;
```

### 4. Analytics Aggregation
```typescript
await prisma.$transaction([
  prisma.$executeRaw`
    INSERT INTO "WikiPageAnalytics" ("wikiPageId", viewCount, uniqueVisitors, avgReadTimeMs,
      positiveVotes, negativeVotes, popularity, trend, "refreshedAt")
    SELECT wikiPageId,
           COUNT(*) FILTER (WHERE type = 'VIEW'),
           COUNT(DISTINCT actor) FILTER (WHERE type = 'VIEW'),
           AVG(durationMs) FILTER (WHERE type = 'VIEW'),
           COUNT(*) FILTER (WHERE type = 'FEEDBACK_POSITIVE'),
           COUNT(*) FILTER (WHERE type = 'FEEDBACK_NEGATIVE'),
           COUNT(*) FILTER (WHERE type = 'VIEW') * 0.7 +
           COUNT(*) FILTER (WHERE type = 'FEEDBACK_POSITIVE') * 0.3,
           /* trend */
           COALESCE(
             (COUNT(*) FILTER (WHERE type = 'VIEW' AND createdAt >= NOW() - INTERVAL '24 hours'))::float /
             NULLIF(COUNT(*) FILTER (WHERE type = 'VIEW' AND createdAt < NOW() - INTERVAL '24 hours'), 0), 1
           ),
           NOW()
    FROM "WikiPageEvent"
    WHERE createdAt >= NOW() - INTERVAL '7 days'
    GROUP BY wikiPageId
    ON CONFLICT ("wikiPageId") DO UPDATE SET ...;
  `,
  prisma.$executeRaw`DELETE FROM "WikiPageEvent" WHERE createdAt < NOW() - INTERVAL '30 days';`,
]);
```

## Performance Considerations
- `WikiRevision` queries rely on `wikiPageId + version` indexes.  
- `WikiPageEvent` may grow quickly – archive >30 days of events to keep table small.  
- Search queries use `GIN` index + `ts_rank_cd` with weighting; ensure `work_mem` adequate on Mac mini.  
- Use `select` to project only required fields (title, excerpt, etc.).

## Data Integrity
- Enforce `@@unique([wikiPageId, version])` to avoid duplicates.  
- `isLocked` prevents updates when true (enforce at API layer).  
- Use transactions for revision write + page update.  
- Use `CHECK (version > 0)`? (optional).  
- Analytics rollup uses `ON CONFLICT DO UPDATE` to keep one row per page.

## Testing Recommendations
- Unit tests for revision creation + revert (ensures version increments).  
- Raw SQL search tests verifying ranking order + fallback when no matches.  
- Analytics aggregation tests using temporary events table.  
- Migration tests on scratch DB to ensure `content_tsv` column compiles under Prisma.

## Next Steps for Parent Agent
1. Update Prisma schema + run migration locally; capture SQL for generated column + indexes.  
2. Implement transactional API helpers + seed/backfill scripts.  
3. Wire analytics aggregation + instrumentation, then document operations + Mac mini deploy steps.
