# Component Patterns & Conventions

**Last Updated**: 2025-10-28
**Framework**: Next.js 14 (App Router) + React 18
**UI Library**: shadcn/ui + Tailwind CSS
**Status**: Theme system + Issue detail components (Phase 3 Day 4 complete)

---

## Quick Index

- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Server vs Client Components](#server-vs-client-components)
- [Component Patterns](#component-patterns)
- [Styling Patterns](#styling-patterns)
- [State Management](#state-management)
- [Best Practices](#best-practices)

---

## File Organization

### Directory Structure

```
app/
  (routes)/                 # Page routes
    page.tsx               # Default export Server Component
  layout.tsx               # Root layout
  globals.css              # Global styles

components/
  ui/                      # shadcn/ui components (auto-generated)
    button.tsx
    card.tsx
    ...
  theme/                   # Theme-related components
    ThemeProvider.tsx      # Client component for theme context
    ThemeSelector.tsx      # Theme switcher UI
  shared/                  # Reusable components (to be created)
  issues/                  # Issue-specific components (future)
  knowledge/               # Knowledge base components (future)

lib/
  utils.ts                 # Utility functions (cn, etc.)
  hooks/                   # Custom React hooks
```

### Current Components

**Theme System** (Phase 3 Day 1):

- `components/theme/ThemeProvider.tsx` - Client component, theme context
- `components/theme/ThemeSelector.tsx` - Theme switcher UI
- `components/ui/*` - shadcn/ui components (Button, Card, etc.)

**Issue Management** (Phase 3 Day 4):

- `components/issues/detail/CommentList.tsx` - Display issue comments
- `components/issues/detail/CommentForm.tsx` - Create new comments with form handling
- `components/issues/detail/AttachmentList.tsx` - Display file attachments with download
- `components/issues/detail/IssueDetailSidebar.tsx` - Issue metadata and quick actions

---

## Naming Conventions

### Files

- **Components**: `PascalCase.tsx`
  - Examples: `IssueCard.tsx`, `SearchBar.tsx`, `UserProfile.tsx`
- **Hooks**: `use*.ts`
  - Examples: `useIssues.ts`, `useSearch.ts`, `useTheme.ts`
- **Utilities**: `kebab-case.ts`
  - Examples: `format-date.ts`, `validate-input.ts`
- **Types**: `*.types.ts` or in `types/` folder
  - Examples: `issue.types.ts`, `types/api.d.ts`

### Components

- **PascalCase** for component names
- **Descriptive names**: `IssueListCard` not `Card1`
- **Suffix with type when ambiguous**: `IssueForm`, `IssueList`, `IssueCard`

### Props

- **camelCase** for prop names
- **Prefix booleans with**: `is`, `has`, `should`, `can`
  - Examples: `isOpen`, `hasError`, `shouldValidate`
- **Callbacks with `on` prefix**: `onClick`, `onSubmit`, `onChange`

---

## Server vs Client Components

### Default: Server Components

**All components are Server Components by default** (no `"use client"` directive)

**When to use**:

- Fetching data from database
- Reading environment variables
- Rendering static content
- No user interactivity needed

**Example**:

```typescript
// app/issues/page.tsx (Server Component)
import { prisma } from '@/lib/db';

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany();

  return (
    <div>
      {issues.map(issue => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
```

**Benefits**:

- Direct database access
- Zero JavaScript to client
- Better performance
- SEO-friendly

---

### Client Components

**Mark with `"use client"` directive at top of file**

**When to use**:

- User interactivity (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, window, etc.)
- Event listeners
- Context consumers

**Example**:

```typescript
// components/theme/ThemeSelector.tsx
"use client";

import { useState } from 'react';

export function ThemeSelector() {
  const [theme, setTheme] = useState("desert");

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="desert">Desert</option>
      <option value="neon">Neon</option>
    </select>
  );
}
```

**Gotchas**:

- Can't use async/await for data fetching
- Can't access server-only features
- JavaScript is sent to client

---

### Hybrid Pattern (Recommended)

**Server Component fetches data, Client Component handles interactivity**

```typescript
// app/issues/page.tsx (Server Component)
import { IssueList } from '@/components/issues/IssueList';
import { prisma } from '@/lib/db';

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany();

  return <IssueList initialIssues={issues} />;
}

// components/issues/IssueList.tsx (Client Component)
"use client";

import { useState } from 'react';
import type { Issue } from '@prisma/client';

interface Props {
  initialIssues: Issue[];
}

export function IssueList({ initialIssues }: Props) {
  const [issues, setIssues] = useState(initialIssues);
  const [filter, setFilter] = useState('all');

  // Client-side filtering, sorting, etc.
  const filteredIssues = issues.filter(/* ... */);

  return <div>{/* Interactive UI */}</div>;
}
```

---

## Component Patterns

### 1. Page Components

**Location**: `app/(routes)/page.tsx`
**Type**: Server Component
**Responsibility**: Data fetching, page layout

```typescript
// app/issues/page.tsx
import { IssueList } from '@/components/issues/IssueList';
import { prisma } from '@/lib/db';

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany({
    include: { assignee: true, labels: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Issues</h1>
      <IssueList issues={issues} />
    </main>
  );
}
```

### 2. Layout Components

**Location**: `app/layout.tsx`
**Type**: Server Component (can wrap Client Components)
**Responsibility**: Common UI structure

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 3. UI Components (shadcn/ui)

**Location**: `components/ui/`
**Type**: Usually Client Components
**Responsibility**: Reusable UI primitives

```typescript
// components/ui/button.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
```

### 4. Form Components

**Pattern**: Client Component with react-hook-form + Zod

```typescript
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const issueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

type IssueFormData = z.infer<typeof issueSchema>;

export function IssueForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema)
  });

  const onSubmit = async (data: IssueFormData) => {
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 5. Card/List Item Components

**Pattern**: Presentational component (can be Server or Client)

```typescript
// components/issues/IssueCard.tsx
import { Card } from '@/components/ui/card';
import type { Issue } from '@prisma/client';

interface Props {
  issue: Issue;
}

export function IssueCard({ issue }: Props) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">{issue.title}</h3>
      <p className="text-sm text-muted-foreground">{issue.description}</p>
    </Card>
  );
}
```

---

### 6. Comment List Pattern (Client Component with Data Display)

**Location**: `components/issues/detail/CommentList.tsx`
**Type**: Client Component
**Responsibility**: Display comments with formatted content and timestamps

**Key Features**:

- Client-side rendering for dynamic content
- Date formatting with `date-fns`
- Inline code formatting support
- Empty state handling
- Nested component structure (CommentItem, CommentContent)

```typescript
"use client";

import { formatDistanceToNow } from 'date-fns';
import type { CommentProps } from '@/types/issue';

interface CommentListProps {
  issueId: string;
  initialComments: CommentProps[];
}

export function CommentList({ issueId, initialComments }: CommentListProps) {
  if (initialComments.length === 0) {
    return (
      <div className="neu-pressed rounded-2xl p-8 text-center">
        <i className="fas fa-comments mb-3 text-4xl text-slate"></i>
        <p className="text-slate">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initialComments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

function CommentItem({ comment }: { comment: CommentProps }) {
  const commentDate = new Date(comment.createdAt);
  const isUpdated = comment.updatedAt !== comment.createdAt;

  return (
    <div className="neu-pressed flex gap-4 rounded-2xl p-4">
      {/* Avatar, content, actions */}
    </div>
  );
}
```

**Pattern Notes**:

- Uses `CommentItem` as nested component (co-located, not exported)
- Handles empty state with icon and message
- Type-safe with imported types
- Accessibility: Semantic HTML structure

---

### 7. Form Component with API Integration Pattern

**Location**: `components/issues/detail/CommentForm.tsx`
**Type**: Client Component
**Responsibility**: Form handling, validation, API submission

**Key Features**:

- Client-side validation before API call
- Loading states during submission
- Error handling and display
- Optimistic UI with `router.refresh()`
- Character counter for large text
- Disabled state management

```typescript
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse } from '@/types/issue';

interface CommentFormProps {
  issueId: string;
}

export function CommentForm({ issueId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > 10000) {
      setError('Comment cannot exceed 10,000 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          author: 'Moksha Dev', // TODO: Get from auth session
        }),
      });

      const result: ApiResponse<unknown> = await res.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      // Success - clear form and refresh page
      setContent('');
      router.refresh(); // Re-fetch Server Component data
    } catch (err) {
      console.error('Comment submission error:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
        data-testid="comment-textarea"
      />

      {error && <p className="text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        data-testid="submit-comment"
      >
        {isSubmitting ? 'Posting...' : 'Comment'}
      </button>
    </form>
  );
}
```

**Pattern Notes**:

- Uses `router.refresh()` for Server Component data re-fetch (no manual state sync)
- Three-stage error handling: client validation, API response, network errors
- Disabled button during submission + empty content
- Data-testid attributes for testing
- Typed API responses

---

### 8. Display List with Type Mapping Pattern

**Location**: `components/issues/detail/AttachmentList.tsx`
**Type**: Client Component
**Responsibility**: Display attachments with file-type-specific icons and metadata

**Key Features**:

- MIME type to icon/color mapping
- File size formatting helper
- Conditional rendering (hide if empty)
- Download button handler (placeholder)
- Helper functions for type detection

```typescript
"use client";

import { formatDistanceToNow } from 'date-fns';
import type { AttachmentProps } from '@/types/issue';

interface AttachmentListProps {
  attachments: AttachmentProps[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) {
    return null; // Hide section if no attachments
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {attachments.map((attachment) => (
        <AttachmentItem key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}

function AttachmentItem({ attachment }: { attachment: AttachmentProps }) {
  const { icon, color } = getFileTypeIcon(attachment.mimetype);
  const formattedSize = formatFileSize(attachment.size);
  const uploadedAgo = formatDistanceToNow(new Date(attachment.uploadedAt), {
    addSuffix: true,
  });

  return (
    <div className="neu-pressed cursor-pointer rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{attachment.filename}</p>
          <p className="text-xs text-slate">{formattedSize} • {getFileType(attachment.mimetype)}</p>
          <p className="text-xs text-slate">Uploaded {uploadedAgo}</p>
        </div>
        <button onClick={() => handleDownload(attachment)}>
          <i className="fas fa-download"></i>
        </button>
      </div>
    </div>
  );
}

// Helper: Map MIME types to FontAwesome icons and colors
function getFileTypeIcon(mimetype: string): { icon: string; color: string } {
  if (mimetype.startsWith('image/')) {
    return { icon: 'fas fa-file-image', color: 'bg-purple-500/20 text-purple-400' };
  }
  if (mimetype === 'application/pdf') {
    return { icon: 'fas fa-file-pdf', color: 'bg-red-500/20 text-red-400' };
  }
  // ... more type mappings
  return { icon: 'fas fa-file', color: 'bg-slate/20 text-slate' };
}

// Helper: Format bytes to human-readable size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
```

**Pattern Notes**:

- Helper functions defined in same file (not exported)
- Comprehensive MIME type mapping (images, videos, documents, archives)
- Grid layout for visual consistency
- Truncate long filenames with `title` tooltip
- Empty state returns `null` (hides section)

---

### 9. Sidebar Detail Component Pattern

**Location**: `components/issues/detail/IssueDetailSidebar.tsx`
**Type**: Client Component
**Responsibility**: Display metadata, quick actions, related content

**Key Features**:

- Structured metadata display (assignee, labels, priority, dates)
- Quick action buttons with click handlers
- Priority color mapping helper
- Placeholder data for future features (watchers, related issues)
- Utility function for clipboard operations

```typescript
"use client";

import type { LabelProps } from '@/types/issue';

interface IssueDetailSidebarProps {
  issueId: string;
  assignee: string | null;
  labels: LabelProps[];
  priority: string;
  module: string | null;
  status: string;
}

export function IssueDetailSidebar({
  issueId,
  assignee,
  labels,
  priority,
  module,
  status,
}: IssueDetailSidebarProps) {
  return (
    <div className="w-80 space-y-4 overflow-auto">
      {/* Quick Actions */}
      <div className="neu-raised rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-bold uppercase">Quick Actions</h3>
        <div className="space-y-2">
          <button className="neu-raised w-full">
            <i className="fas fa-eye w-5"></i>
            <span>Watch Issue</span>
          </button>
          <button onClick={() => copyToClipboard(window.location.href)}>
            <i className="fas fa-link w-5"></i>
            <span>Copy Link</span>
          </button>
        </div>
      </div>

      {/* Issue Details */}
      <div className="neu-raised rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-bold uppercase">Details</h3>

        {/* Assignee */}
        <div>
          <label className="mb-2 block text-xs uppercase">Assignee</label>
          <span className="text-sm font-medium">{assignee || 'Unassigned'}</span>
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div>
            <label className="mb-2 block text-xs uppercase">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className="neu-pressed rounded-full px-3 py-1 text-xs"
                  style={{ borderLeft: `3px solid ${label.color}` }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Priority with color indicator */}
        <div>
          <label className="mb-2 block text-xs uppercase">Priority</label>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${getPriorityColor(priority)}`}></span>
            <span className="text-sm">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: Map priority to Tailwind color classes
function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };
  return colors[priority] || colors.medium;
}

// Helper: Copy to clipboard with Promise handling
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => console.log('Copied to clipboard:', text),
    (err) => console.error('Failed to copy:', err)
  );
}
```

**Pattern Notes**:

- Fixed width sidebar (`w-80`)
- Nested sections with `neu-raised` neumorphic cards
- Conditional rendering for optional fields (labels, module)
- Color-coded priority indicator
- Helper functions for mapping and utilities
- Placeholder sections for future features (watchers, related issues)

---

## Styling Patterns

### Tailwind CSS

**Primary styling method**: Utility classes

```tsx
<div className="flex items-center gap-4 p-6 bg-background">
  <h1 className="text-2xl font-bold text-foreground">Title</h1>
</div>
```

### cn() Utility

**Conditional classes**: Use `cn()` from `lib/utils.ts`

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)}>
```

### Theme-Aware Styling

**Use CSS variables** defined in `globals.css`:

```tsx
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Secondary text</p>
</div>
```

**Current theme variables**:

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### Component Variants

**Use cva (class-variance-authority)** for complex variants:

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

---

## State Management

### Client-Side State

**Local state**: `useState`

```typescript
const [isOpen, setIsOpen] = useState(false);
```

**Effect hooks**: `useEffect`

```typescript
useEffect(() => {
  // Side effect
  return () => {
    /* cleanup */
  };
}, [dependencies]);
```

### Server State (Data Fetching)

**Server Components**: Direct database queries

```typescript
const issues = await prisma.issue.findMany();
```

**Client Components**: Use SWR or React Query (future)

```typescript
import useSWR from 'swr';

const { data, error, isLoading } = useSWR('/api/issues', fetcher);
```

### Global State

**Context API**: For theme, user preferences

```typescript
"use client";

import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext<{
  theme: string;
  setTheme: (theme: string) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("desert");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

---

## Best Practices

### 1. TypeScript Types

**Always type props**:

```typescript
interface Props {
  issue: Issue;
  onUpdate?: (issue: Issue) => void;
}
```

**Use type inference**:

```typescript
const issues = await prisma.issue.findMany(); // Type inferred from Prisma
```

**Create reusable types**:

```typescript
// types/issue.ts
export type IssueWithRelations = Issue & {
  assignee: User | null;
  labels: Label[];
};
```

### 2. Component Composition

**Prefer composition over props drilling**:

❌ **Bad**:

```typescript
<IssueCard issue={issue} onUpdate={onUpdate} onDelete={onDelete} theme={theme} />
```

✅ **Good**:

```typescript
<IssueCard issue={issue}>
  <IssueActions onUpdate={onUpdate} onDelete={onDelete} />
</IssueCard>
```

### 3. Error Boundaries

**Wrap components that might error**:

```typescript
// app/error.tsx
"use client";

export default function Error({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### 4. Loading States

**Use loading.tsx for Suspense boundaries**:

```typescript
// app/issues/loading.tsx
export default function Loading() {
  return <div>Loading issues...</div>;
}
```

### 5. Accessibility

**Always include aria labels**:

```tsx
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" />
</button>
```

**Keyboard navigation**:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={onClick}
  onKeyDown={(e) => e.key === 'Enter' && onClick()}
>
```

---

## Resources

### Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### Project Documentation

- [Database Schema](database-schema.md)
- [API Catalog](api-catalog.md)
- [Theme System](../../docs/THEME_SYSTEM.md) (when created)

### Tools

- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/)

---

**Last Updated:** 2025-10-28
**Component Status:** Theme system + Issue detail components (CommentList, CommentForm, AttachmentList, IssueDetailSidebar)
**Next Update:** Phase 3 Day 5+ (Additional issue components)

**See also**: [STATUS.md](../../STATUS.md) for current project status
