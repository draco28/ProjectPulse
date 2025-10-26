---
name: moksha-component-patterns
description: React component conventions for Moksha DevHub using Next.js 14 App Router, Server Components, shadcn/ui, and Tailwind CSS. Use when creating new components, deciding Server vs Client, or structuring component files.
triggers:
  [
    'create component',
    'new component',
    'react component',
    'server component',
    'client component',
    'ui component',
  ]
token_estimate: 280
last_updated: 2025-10-26
related_docs:
  - ../../.agent/system/component-patterns.md
---

# Moksha Component Patterns

## Default: Server Components

**All components are Server Components by default** (no `"use client"`)

```typescript
// app/issues/page.tsx - Server Component
import { prisma } from '@/lib/db';
import { IssueList } from '@/components/issues/IssueList';

export default async function IssuesPage() {
  // Direct database access!
  const issues = await prisma.issue.findMany({
    include: { assignee: true, labels: true },
  });

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Issues</h1>
      <IssueList initialIssues={issues} />
    </main>
  );
}
```

**Benefits**: Zero JS to client, better performance, direct DB access

## Client Components (When Needed)

**Add `"use client"` when you need**:

- User interactivity (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, window, etc.)

```typescript
// components/issues/IssueList.tsx - Client Component
"use client";

import { useState } from 'react';
import type { Issue } from '@prisma/client';

interface Props {
  initialIssues: Issue[];
}

export function IssueList({ initialIssues }: Props) {
  const [filter, setFilter] = useState('all');

  const filteredIssues = initialIssues.filter(/* ... */);

  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="open">Open</option>
      </select>
      {/* ... */}
    </div>
  );
}
```

## Hybrid Pattern (Recommended)

**Server fetches data → Client handles interactivity**

```
Page (Server) → fetches data
    ↓ passes as props
Interactive Component (Client) → uses data with state/events
```

## File Organization

```
components/
  ui/                      # shadcn/ui (auto-generated)
    button.tsx
    card.tsx
  theme/                   # Theme components
    ThemeProvider.tsx
    ThemeSelector.tsx
  issues/                  # Feature-specific
    IssueCard.tsx
    IssueList.tsx
    IssueForm.tsx
  shared/                  # Reusable across features
    PageHeader.tsx
    LoadingSpinner.tsx
```

## Naming Conventions

**Files**: `PascalCase.tsx`

- Components: `IssueCard.tsx`, `SearchBar.tsx`
- Hooks: `useIssues.ts`, `useTheme.ts`
- Utils: `format-date.ts`, `cn.ts`

**Props**:

- camelCase: `userId`, `isOpen`
- Booleans: `is*`, `has*`, `should*`, `can*`
- Callbacks: `on*` prefix (`onClick`, `onSubmit`)

## Styling with Tailwind

**Use utility classes**:

```tsx
<div className="flex items-center gap-4 p-6 bg-background">
  <h1 className="text-2xl font-bold text-foreground">Title</h1>
</div>
```

**Conditional classes** (use `cn()` utility):

```tsx
import { cn } from '@/lib/utils';

<div
  className={cn(
    'base-classes',
    isActive && 'active-classes',
    variant === 'primary' && 'primary-classes'
  )}
/>;
```

**Theme variables** (from globals.css):

```tsx
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Secondary text</p>
</div>
```

## TypeScript Patterns

**Always type props**:

```typescript
interface Props {
  issue: Issue;
  onUpdate?: (issue: Issue) => void;
  className?: string;
}

export function IssueCard({ issue, onUpdate, className }: Props) {
  // ...
}
```

**Use Prisma types**:

```typescript
import type { Issue, User } from '@prisma/client';

type IssueWithAuthor = Issue & {
  author: User;
};
```

## shadcn/ui Integration

**Using shadcn components**:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

<Card className="p-4">
  <Button variant="default" onClick={handleClick}>
    Click Me
  </Button>
</Card>;
```

**Variants** (cva pattern):

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      outline: 'border border-input',
    },
    size: {
      default: 'h-10 px-4',
      sm: 'h-9 px-3',
    },
  },
});
```

## Common Patterns

**Form Component** (Client):

```typescript
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1),
});

export function IssueForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  });

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

**Card/List Item** (Can be Server or Client):

```typescript
import { Card } from '@/components/ui/card';

export function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold">{issue.title}</h3>
      <p className="text-muted-foreground">{issue.description}</p>
    </Card>
  );
}
```

## Full Documentation

**Complete Guide**: [.agent/system/component-patterns.md](../../.agent/system/component-patterns.md)

- Server vs Client decision tree
- Accessibility patterns
- Error boundaries
- Loading states
- Testing approaches

---

**Token Cost**: ~280 tokens (vs ~3,500 in full doc)
**Coverage**: 85% of component creation scenarios
**When to Use Full Docs**: Complex state, advanced patterns, optimization
