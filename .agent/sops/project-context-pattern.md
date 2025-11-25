# SOP: Project Context Pattern

**Last Updated**: 2025-11-25
**Status**: Active
**Category**: UI Navigation

---

## Overview

All navigation in ProjectPulse must preserve project context via `?project={projectId}` query parameter. This ensures users stay in their selected project context across all pages.

## Why This Matters

Without project context preservation:
- Users get redirected to default project (or dashboard)
- Work context is lost during multi-page workflows
- UX breaks for users with multiple projects

## Pattern Requirements

### 1. Server Components (Pages)

Extract project context at page level using the helper function:

```tsx
import { getActiveProjectForUser } from '@/lib/project-context';

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const { project, projectId } = await getActiveProjectForUser(user.id, params.project);

  // Pass projectId to client components
  return <MyClientComponent projectId={projectId} />;
}
```

### 2. Client Components with Links

Accept `projectId` as a required prop and include it in all navigation links:

```tsx
interface MyComponentProps {
  projectId: number;
}

export function MyComponent({ projectId }: MyComponentProps) {
  return (
    <>
      {/* Navigation links */}
      <Link href={`/target-page?project=${projectId}`}>
        Go to Target Page
      </Link>

      {/* Multiple links */}
      <Link href={`/feature-a?project=${projectId}`}>Feature A</Link>
      <Link href={`/feature-b?project=${projectId}`}>Feature B</Link>
    </>
  );
}
```

### 3. After Form Submission (Redirects)

Include project context in all redirect calls:

```tsx
const router = useRouter();

// After successful form submission
const handleSubmit = async (data: FormData) => {
  await submitForm(data);

  // CORRECT: Include project context
  router.push(`/destination?project=${projectId}`);

  // WRONG: Missing project context
  // router.push('/destination');
};
```

### 4. After API Calls with Redirect

```tsx
const handleCreate = async () => {
  const result = await fetch('/api/resource', {
    method: 'POST',
    body: JSON.stringify({ projectId, ...data }),
  });

  if (result.ok) {
    // Redirect with project context
    router.push(`/resource-list?project=${projectId}`);
  }
};
```

## Common Mistakes to Avoid

### ❌ Static Links Without Context

```tsx
// WRONG: Static link without project
<Link href="/roadmap/create">Create Roadmap</Link>

// CORRECT: Dynamic link with project
<Link href={`/roadmap/create?project=${projectId}`}>Create Roadmap</Link>
```

### ❌ Forgetting to Pass projectId Prop

```tsx
// WRONG: Not passing projectId to child
<EmptyState />

// CORRECT: Passing projectId to child
<EmptyState projectId={projectId} />
```

### ❌ Hardcoded Redirects

```tsx
// WRONG: Hardcoded redirect
router.push('/dashboard');

// CORRECT: Project-aware redirect
router.push(`/dashboard?project=${projectId}`);
```

## Checklist for New Components

Before marking a component as complete, verify:

- [ ] Does this component render any `<Link>` elements?
  - If yes: Does each link include `?project=${projectId}`?
- [ ] Does this component receive `projectId` as a prop (if it has links)?
- [ ] Does the parent component pass `projectId` down?
- [ ] Does the page-level Server Component extract project context?
- [ ] Do post-submission redirects preserve project context?
- [ ] Do success/error redirect paths include project context?

## Testing

### Manual Testing

1. Navigate to any page with `?project=X`
2. Click through navigation links
3. Verify URL maintains `?project=X` on all pages
4. Submit forms and verify redirects preserve context

### E2E Testing

```bash
pnpm exec playwright test project-context.spec.ts
pnpm exec playwright test roadmap.spec.ts
```

### Test Pattern

```typescript
test('should preserve project context on navigation', async ({ page }) => {
  // Start with project context
  await page.goto('/page-a?project=1');

  // Click navigation link
  await page.click('text=Go to Page B');

  // Verify project context preserved
  await expect(page).toHaveURL(/\/page-b\?project=1/);
});
```

## Files Updated for This Pattern (Example)

When implementing this pattern, these files typically need changes:

| File Type | Change Required |
|-----------|----------------|
| `page.tsx` (Server Component) | Add `getActiveProjectForUser`, pass `projectId` to children |
| Client Component with links | Add `projectId` prop, update all `<Link>` elements |
| Form components | Update `router.push()` calls to include project |

## Related Files

- `/lib/project-context.ts` - `getActiveProjectForUser()` helper
- `/tests/e2e/project-context.spec.ts` - E2E test suite
- `/tests/e2e/roadmap.spec.ts` - Roadmap-specific E2E tests

## Version History

| Date | Change |
|------|--------|
| 2025-11-25 | Initial SOP created after roadmap UI project context fix |
