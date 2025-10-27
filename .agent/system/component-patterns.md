# Component Patterns & Conventions

**Last Updated**: 2025-10-28
**Framework**: Next.js 14 (App Router) + React 18
**UI Library**: shadcn/ui + Tailwind CSS
**Status**: Full component library + Advanced patterns (Phase 3 Days 5-6 complete)

---

## Quick Index

- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Server vs Client Components](#server-vs-client-components)
- [Component Patterns](#component-patterns)
- [Advanced React Patterns](#advanced-react-patterns)
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

**Knowledge Base** (Phase 3 Days 5-6):

- `components/knowledge/ArticleCard.tsx` - Memoized article card with relevance scores
- `components/knowledge/TagFilter.tsx` - URL state-based tag filtering
- `components/knowledge/SearchBar.tsx` - Debounced search input with mode toggle

**Wiki** (Phase 3 Days 5-6):

- `components/wiki/WikiSidebar.tsx` - Related pages navigation
- `components/wiki/TableOfContents.tsx` - IntersectionObserver scroll spy
- `components/wiki/WikiContent.tsx` - ReactMarkdown with syntax highlighting

**Security** (Phase 3 Days 5-6):

- `components/security/SecurityScoreMeter.tsx` - Animated SVG circle meter
- `components/security/VulnerabilityCard.tsx` - Severity-coded vulnerability display
- `components/security/VulnerabilityFilter.tsx` - Multi-dimension filtering

**Agent Personas** (Phase 3 Days 5-6):

- `components/agents/AgentCard.tsx` - useOptimistic toggle with Server Actions

**Global Components** (Phase 3 Days 5-6):

- `components/CommandPalette.tsx` - useReducer state machine with keyboard shortcuts

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

## Advanced React Patterns

### 10. Command Palette with useReducer State Machine

**Location**: `components/CommandPalette.tsx`
**Type**: Client Component
**Responsibility**: Global keyboard-driven search with state machine pattern

**Key Features**:

- useReducer for complex state management (10 actions)
- Global keyboard shortcut (Cmd+K / Ctrl+K)
- Arrow key navigation with selectedIndex
- Debounced search (300ms)
- Entity type filtering
- Backdrop and modal UI

**Pattern: useReducer State Machine**

```typescript
"use client";

import { useReducer, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

// State interface
interface CommandState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  isLoading: boolean;
  entityType: 'all' | 'issues' | 'knowledge' | 'wiki' | 'agents';
}

// Action types (10 total)
type CommandAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'MOVE_UP' }
  | { type: 'MOVE_DOWN' }
  | { type: 'SET_ENTITY_TYPE'; payload: CommandState['entityType'] }
  | { type: 'RESET' };

// Reducer (single source of truth)
function commandReducer(state: CommandState, action: CommandAction): CommandState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false, query: '', results: [], selectedIndex: 0 };
    case 'SET_QUERY':
      return { ...state, query: action.payload, selectedIndex: 0 };
    case 'MOVE_UP':
      return {
        ...state,
        selectedIndex: state.selectedIndex > 0 ? state.selectedIndex - 1 : state.results.length - 1,
      };
    case 'MOVE_DOWN':
      return {
        ...state,
        selectedIndex: state.selectedIndex < state.results.length - 1 ? state.selectedIndex + 1 : 0,
      };
    // ... more actions
    default:
      return state;
  }
}

export function CommandPalette() {
  const [state, dispatch] = useReducer(commandReducer, initialState);
  const debouncedQuery = useDebounce(state.query, 300);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'OPEN' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        dispatch({ type: 'MOVE_DOWN' });
        break;
      case 'ArrowUp':
        dispatch({ type: 'MOVE_UP' });
        break;
      case 'Enter':
        // Navigate to selected result
        break;
      case 'Escape':
        dispatch({ type: 'CLOSE' });
        break;
    }
  };

  return (
    // ... UI with backdrop, input, filters, results
  );
}
```

**When to Use This Pattern**:

- Complex state with multiple interdependent values
- State transitions that depend on previous state
- Need predictable state updates
- Easier debugging (single reducer function)
- Better than 10+ useState hooks

**Benefits**:

- Single source of truth for all state
- Type-safe actions with discriminated unions
- Easier to test (pure reducer function)
- Clear state transitions
- Scalable for complex UIs

**Source**: `components/CommandPalette.tsx` (287 lines)

---

### 11. useOptimistic for Instant UI Feedback

**Location**: `components/agents/AgentCard.tsx`
**Type**: Client Component
**Responsibility**: Agent status toggle with optimistic updates

**Key Features**:

- useOptimistic for instant UI updates
- useTransition for async Server Actions
- Automatic rollback on error
- Loading overlay during mutation
- Toggle switch animation

**Pattern: useOptimistic + Server Actions**

```typescript
"use client";

import { useOptimistic, useTransition } from 'react';
import { toggleAgentStatus } from '@/app/agents/actions';

interface AgentCardProps {
  agent: {
    id: number;
    name: string;
    isActive: boolean;
    // ... other fields
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  const [isPending, startTransition] = useTransition();

  // useOptimistic: Instant UI feedback before server responds
  const [optimisticAgent, setOptimisticAgent] = useOptimistic(
    agent,
    (state, newStatus: boolean) => ({ ...state, isActive: newStatus })
  );

  const handleToggle = () => {
    startTransition(async () => {
      // 1. Optimistic update (instant UI change)
      setOptimisticAgent(!optimisticAgent.isActive);

      // 2. Server Action (runs in background)
      const result = await toggleAgentStatus(agent.id, agent.isActive);

      if (!result.success) {
        // 3. Automatic rollback on error
        console.error('Failed to toggle agent:', result.error);
        // useOptimistic will revert to original state
      }
      // 4. On success, Server Component re-renders with fresh data
    });
  };

  return (
    <div className={optimisticAgent.isActive ? 'ring-2 ring-coral' : ''}>
      {/* Toggle Switch */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={optimisticAgent.isActive ? 'bg-coral' : 'bg-black/20'}
      >
        <div className={optimisticAgent.isActive ? 'left-5' : 'left-0.5'} />
      </button>

      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-black/10">
          <i className="fas fa-spinner fa-spin" />
        </div>
      )}
    </div>
  );
}
```

**When to Use This Pattern**:

- Toggle switches, checkboxes, status updates
- Any mutation where instant feedback improves UX
- Server Actions that take time (network latency)
- Non-critical updates (can tolerate brief inconsistency)

**Benefits**:

- Instant UI feedback (no spinner wait)
- Automatic rollback on error
- Works seamlessly with Server Components
- Less boilerplate than manual optimistic updates

**Don't Use When**:

- Critical data (financial transactions)
- Complex validations needed before mutation
- Multi-step workflows

**Source**: `components/agents/AgentCard.tsx` (149 lines)

---

### 12. IntersectionObserver for Scroll Spy

**Location**: `components/wiki/TableOfContents.tsx` + `hooks/useScrollSpy.ts`
**Type**: Client Component + Custom Hook
**Responsibility**: Battery-efficient scroll detection for TOC highlighting

**Key Features**:

- IntersectionObserver API (no scroll listeners)
- Battery-efficient (browser-optimized)
- Configurable root margin and threshold
- Smooth scroll navigation
- Nested heading indentation

**Pattern: IntersectionObserver Hook**

```typescript
// hooks/useScrollSpy.ts
"use client";

import { useEffect, useState } from 'react';

interface UseScrollSpyOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useScrollSpy(
  headingIds: string[],
  options: UseScrollSpyOptions = {}
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: options.rootMargin || '-20% 0px -80% 0px',
        threshold: options.threshold || 0,
      }
    );

    // Observe all headings
    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headingIds, options.rootMargin, options.threshold]);

  return activeId;
}

// components/wiki/TableOfContents.tsx
"use client";

import { useScrollSpy } from '@/hooks/useScrollSpy';

export function TableOfContents({ items }: { items: TOCItem[] }) {
  const headingIds = items.map((item) => item.id);
  const activeId = useScrollSpy(headingIds, {
    rootMargin: '-20% 0px -80% 0px', // Trigger when heading in top 20-80% of viewport
  });

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <nav>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToHeading(item.id)}
          className={activeId === item.id ? 'text-coral' : 'text-slate'}
        >
          {item.text}
        </button>
      ))}
    </nav>
  );
}
```

**When to Use This Pattern**:

- Scroll spy for TOC highlighting
- Lazy loading images
- Infinite scroll pagination
- Element visibility tracking
- Animations on scroll

**Benefits**:

- Better performance (no scroll listeners)
- Battery-efficient (browser-optimized)
- Runs in rendering thread (not main thread)
- Configurable visibility detection
- Modern browser API

**Why Not Scroll Listeners**:

❌ **Old approach** (scroll event):

```typescript
// ❌ Bad: Fires on every scroll (performance cost)
useEffect(() => {
  const handleScroll = () => {
    // Check all heading positions (expensive)
  };
  window.addEventListener('scroll', handleScroll);
}, []);
```

✅ **New approach** (IntersectionObserver):

```typescript
// ✅ Good: Browser-optimized, only fires when needed
const observer = new IntersectionObserver(callback, options);
```

**Source**: `components/wiki/TableOfContents.tsx` (65 lines), `hooks/useScrollSpy.ts` (47 lines)

---

### 13. Animated SVG Meter Pattern

**Location**: `components/security/SecurityScoreMeter.tsx`
**Type**: Client Component
**Responsibility**: Animated circular progress meter

**Key Features**:

- SVG circle with strokeDashoffset animation
- Color-coded by score threshold
- CSS transition animation (1 second)
- Configurable radius and stroke width
- Delayed animation on mount

**Pattern: SVG Circle Animation**

```typescript
"use client";

import { useEffect, useState } from 'react';

export function SecurityScoreMeter({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Circle math
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Color by score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div style={{ width: radius * 2, height: radius * 2 }}>
      <svg className="transform -rotate-90">
        {/* Background circle */}
        <circle
          stroke="rgba(255, 255, 255, 0.1)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Progress circle (animated) */}
        <circle
          stroke={getScoreColor(animatedScore)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s ease-in-out', // CSS animation
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>

      {/* Score text (centered absolutely) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ color: getScoreColor(animatedScore) }}>
          {animatedScore}
        </span>
      </div>
    </div>
  );
}
```

**When to Use This Pattern**:

- Progress indicators (security score, health meter)
- Loading spinners (circular)
- Percentage visualizations
- Battery/status indicators

**Benefits**:

- Smooth CSS transition animation
- Configurable colors and thresholds
- Lightweight (no animation libraries)
- Accessible (text score always visible)

**Math Explained**:

- `circumference = 2πr` (circle perimeter)
- `strokeDashoffset` controls how much of circle is visible
- Animating `strokeDashoffset` from `circumference` to `0` draws circle

**Source**: `components/security/SecurityScoreMeter.tsx` (88 lines)

---

### 14. Debounced Search Input Pattern

**Location**: `components/knowledge/SearchBar.tsx` + `hooks/useDebounce.ts`
**Type**: Client Component + Custom Hook
**Responsibility**: Debounced search with URL state sync

**Key Features**:

- Debounced input (300ms delay)
- URL state management
- Search mode toggle (visual only for now)
- Pagination reset on search
- Real-time query parameter updates

**Pattern: Debounced Search with URL State**

```typescript
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchBar({ initialSearch = '' }: { initialSearch?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchMode, setSearchMode] = useState('hybrid');

  // Debounce search query (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }

    // Reset to page 1 when search changes
    params.delete('page');

    router.push(`/knowledge?${params.toString()}`);
  }, [debouncedSearch, router, searchParams]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search knowledge base..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Search mode toggle */}
      <button onClick={() => setSearchMode('hybrid')}>Hybrid</button>
      <button onClick={() => setSearchMode('fulltext')}>Full-Text</button>
      <button onClick={() => setSearchMode('semantic')}>Semantic</button>
    </div>
  );
}

// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**When to Use This Pattern**:

- Search inputs (prevent excessive API calls)
- Autocomplete/typeahead
- Filter inputs
- Any input that triggers expensive operations

**Benefits**:

- Reduces API calls (only after user stops typing)
- Better UX (no lag during typing)
- Server-side search with URL state
- Shareable URLs with search query

**Debounce Timing**:

- `300ms` - Good for search (balance between responsiveness and API load)
- `150ms` - Fast autocomplete
- `500ms` - Heavy operations (complex filters)

**Source**: `components/knowledge/SearchBar.tsx` (105 lines), `hooks/useDebounce.ts` (existing)

---

### Pattern Comparison Table

| Pattern                    | When to Use                                          | Complexity | Performance |
| -------------------------- | ---------------------------------------------------- | ---------- | ----------- |
| useReducer State Machine   | Complex state with 5+ interdependent values          | High       | Excellent   |
| useOptimistic              | Instant feedback for mutations (toggles, checkboxes) | Low        | Excellent   |
| IntersectionObserver       | Scroll spy, lazy loading, visibility detection       | Medium     | Excellent   |
| Animated SVG               | Progress indicators, circular meters                 | Low        | Good        |
| Debounced Search           | Search inputs, autocomplete, filters                 | Low        | Excellent   |
| Comment List (Pattern 6)   | Display lists with formatting                        | Low        | Good        |
| Form with API (Pattern 7)  | Forms with validation and API submission             | Medium     | Good        |
| Sidebar Detail (Pattern 9) | Metadata display with actions                        | Low        | Good        |

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
**Component Status:** Full component library with advanced patterns (Phase 3 Days 5-6 complete)
**Total Patterns Documented:** 14 patterns (6 basic + 5 advanced + 3 existing)
**Key Patterns:** useReducer state machine, useOptimistic, IntersectionObserver, debounced search, SVG animations
**Next Update:** Phase 4 (Authentication components)

**See also**: [STATUS.md](../../STATUS.md) for current project status
