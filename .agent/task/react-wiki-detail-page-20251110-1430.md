# React Implementation Plan: Wiki Detail Page Enhancement

**Created**: 2025-11-10 14:30
**Type**: Feature Enhancement
**Story**: US-019 (5 points)
**Complexity**: Medium-High

---

## Executive Summary

Transform the basic wiki detail page into a fully-featured documentation page following the mockup design at `mockups/Default theme/04-wiki-dark-neumorphic-coral.html`. This requires creating 5 new components, updating the database schema, and implementing sophisticated React patterns for performance and UX.

**Key Challenges**:
- Server/Client component balance (ISR + interactivity)
- Contributor avatar generation and display
- Copy-to-clipboard cross-browser support
- Reading time calculation
- Performance optimization for large wiki pages

---

## Component Architecture

### Component Tree

```
WikiPage (Server Component, ISR)
├── FloatingBackground (Client - existing)
├── Sidebar (Client - existing)
├── QuickNavigation (Client - NEW)
│   └── WikiSearchBar (Client - reuse existing logic)
├── Main Content Area
│   ├── Breadcrumb (Server - existing)
│   ├── WikiHeader (Server - NEW)
│   │   ├── ContributorAvatars (Server - NEW)
│   │   └── CategoryTags (Server - NEW)
│   ├── TableOfContents (Client - enhanced from existing)
│   └── WikiContent (Client - enhanced)
│       └── EnhancedCodeBlock (Client - NEW)
└── WikiContributors (Client - NEW)
    ├── ContributorList (Server - NEW)
    ├── PageStats (Server - NEW)
    └── FeedbackButtons (Client - NEW)
```

### Data Flow

```
Server (ISR at build time + revalidate: 3600s)
  → Fetch wiki page with contributors, stats
  → Calculate reading time (server-side)
  → Fetch category stats for QuickNavigation
  → Fetch prev/next pages (same category)
  → Pass data to components

Client (Interactive features)
  → Copy button (clipboard API)
  → Feedback buttons (local state → future API)
  → Search input (debounced)
  → Scroll spy for active TOC item
```

---

## Database Schema Changes

### Required Additions to WikiPage Model

```prisma
model WikiPage {
  id Int @id @default(autoincrement())

  // ... existing fields ...

  // NEW FIELDS
  views        Int      @default(0)          // Page view count
  revisions    Int      @default(1)          // Edit count
  contributors Json     @default("[]")       // Array of { name, avatar?, editCount }
  readingTime  Int?                          // Minutes (calculated on save)
  tags         String[] @default([])         // Additional tags beyond category

  @@index([views(sort: Desc)])               // For popular pages
  @@index([category, orderIndex])            // For prev/next navigation
}
```

**Migration Strategy**:
1. Add fields with defaults (non-breaking)
2. Seed existing pages with dummy contributor data
3. Calculate reading time for existing content (one-time script)

**Contributor JSON Structure**:
```typescript
type Contributor = {
  name: string;           // "Moksha Dev"
  avatar?: string;        // Optional URL or initials
  editCount: number;      // Number of edits
  lastEditAt: string;     // ISO timestamp
};
```

---

## Component Implementation Plans

### 1. WikiHeader Component

**Type**: Server Component (static data, no interactivity)

**Purpose**: Rich article header with metadata, contributors, and tags

**Props Interface**:
```typescript
interface WikiHeaderProps {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  contributors: Contributor[];
  updatedAt: string;        // ISO string
  views: number;
  path: string;             // For edit link
  readingTime?: number;     // Minutes
}
```

**Implementation Strategy**:

1. **Server Component Rationale**:
   - All data is known at ISR time
   - No user interaction (Edit button is just a link)
   - Reduces client-side JS bundle
   - SEO-friendly (all content in HTML)

2. **Contributor Display**:
   ```typescript
   // Show primary contributor (most edits)
   const primaryContributor = contributors.sort((a, b) => b.editCount - a.editCount)[0];

   // Show up to 5 contributors in avatar grid
   const topContributors = contributors.slice(0, 5);
   ```

3. **Avatar Generation**:
   ```typescript
   // Server-side avatar component
   function ContributorAvatar({ contributor }: { contributor: Contributor }) {
     if (contributor.avatar) {
       return <img src={contributor.avatar} alt={contributor.name} />;
     }

     // Generate initials
     const initials = contributor.name
       .split(' ')
       .map(word => word[0])
       .join('')
       .toUpperCase()
       .slice(0, 2);

     return (
       <div className="w-6 h-6 coral-gradient rounded-full flex items-center justify-center text-xs font-bold">
         {initials}
       </div>
     );
   }
   ```

4. **Category/Tag Pills**:
   ```typescript
   // Primary category gets coral gradient
   <span className="px-3 py-1.5 coral-gradient text-white rounded-full text-xs font-semibold shadow-md">
     {category}
   </span>

   // Secondary tags get neumorphic style
   {tags?.map(tag => (
     <span key={tag} className="px-3 py-1.5 neu-raised text-slate rounded-full text-xs font-semibold">
       {tag}
     </span>
   ))}
   ```

5. **Reading Time Display**:
   ```typescript
   {readingTime && (
     <span className="px-3 py-1.5 neu-raised text-slate rounded-full text-xs font-semibold">
       {readingTime} min read
     </span>
   )}
   ```

**Skeleton Implementation**:
```tsx
// apps/web/components/wiki/WikiHeader.tsx
import Link from 'next/link';
import { Edit, Clock, Eye } from 'lucide-react';
import { ContributorAvatar } from './ContributorAvatar';

interface Contributor {
  name: string;
  avatar?: string;
  editCount: number;
  lastEditAt: string;
}

interface WikiHeaderProps {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  contributors: Contributor[];
  updatedAt: string;
  views: number;
  path: string;
  readingTime?: number;
}

export function WikiHeader({
  title,
  description,
  category,
  tags,
  contributors,
  updatedAt,
  views,
  path,
  readingTime
}: WikiHeaderProps) {
  // Sort contributors by edit count
  const sortedContributors = [...contributors].sort((a, b) => b.editCount - a.editCount);
  const primaryContributor = sortedContributors[0];
  const topContributors = sortedContributors.slice(0, 5);

  const relativeTime = formatRelativeTime(updatedAt);

  return (
    <div className="mb-8">
      {/* Title + Edit Button */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-4xl font-bold mb-3">{title}</h1>
          {description && (
            <p className="text-lg text-slate">{description}</p>
          )}
        </div>
        <Link
          href={`${path}/edit`}
          className="px-4 py-2 neu-raised hover:bg-darkCard rounded-xl smooth-transition text-sm"
        >
          <Edit className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
          Edit Page
        </Link>
      </div>

      {/* Contributor + Metadata */}
      <div className="flex items-center gap-4 text-sm text-slate mb-4">
        {primaryContributor && (
          <>
            <div className="flex items-center gap-2">
              <ContributorAvatar contributor={primaryContributor} size="sm" />
              <span>Updated by {primaryContributor.name}</span>
            </div>
            <span>•</span>
          </>
        )}
        <span className="flex items-center">
          <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
          {relativeTime}
        </span>
        <span>•</span>
        <span className="flex items-center">
          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
          {views.toLocaleString()} views
        </span>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary category - coral gradient */}
        <span className="px-3 py-1.5 coral-gradient text-white rounded-full text-xs font-semibold shadow-md">
          {category}
        </span>

        {/* Additional tags - neumorphic */}
        {tags?.map(tag => (
          <span
            key={tag}
            className="px-3 py-1.5 neu-raised text-slate rounded-full text-xs font-semibold cursor-pointer smooth-transition hover:bg-darkCard hover:text-white"
          >
            {tag}
          </span>
        ))}

        {/* Reading time badge */}
        {readingTime && (
          <span className="px-3 py-1.5 neu-raised text-slate rounded-full text-xs font-semibold">
            {readingTime} min read
          </span>
        )}
      </div>
    </div>
  );
}

// Helper: Format relative time
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
```

**Testing Strategy**:
- Unit test: `formatRelativeTime` with various timestamps
- Component test: Render with/without description
- Component test: Primary category styling (coral gradient)
- Component test: Tag rendering and hover effects
- Component test: Reading time display (when present/absent)

---

### 2. ContributorAvatar Component

**Type**: Server Component (pure presentation, no state)

**Purpose**: Display contributor avatar or initials fallback

**Props Interface**:
```typescript
interface ContributorAvatarProps {
  contributor: Contributor;
  size?: 'xs' | 'sm' | 'md' | 'lg';  // xs=6, sm=8, md=10, lg=12 (h-units)
  showTooltip?: boolean;
}
```

**Implementation Strategy**:

1. **Avatar Priority**:
   - If `contributor.avatar` exists → use image
   - Else → generate initials from name
   - Fallback → use first letter only

2. **Initials Generation**:
   ```typescript
   function generateInitials(name: string): string {
     return name
       .trim()
       .split(/\s+/)              // Split on whitespace
       .map(word => word[0])      // First letter of each word
       .join('')
       .toUpperCase()
       .slice(0, 2);              // Max 2 letters
   }
   ```

3. **Size Variants**:
   ```typescript
   const sizeClasses = {
     xs: 'w-6 h-6 text-xs',
     sm: 'w-8 h-8 text-sm',
     md: 'w-10 h-10 text-base',
     lg: 'w-12 h-12 text-lg'
   };
   ```

**Skeleton Implementation**:
```tsx
// apps/web/components/wiki/ContributorAvatar.tsx
import Image from 'next/image';
import type { Contributor } from '@/types/wiki';

interface ContributorAvatarProps {
  contributor: Contributor;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: { wrapper: 'w-6 h-6', text: 'text-xs' },
  sm: { wrapper: 'w-8 h-8', text: 'text-sm' },
  md: { wrapper: 'w-10 h-10', text: 'text-base' },
  lg: { wrapper: 'w-12 h-12', text: 'text-lg' },
};

export function ContributorAvatar({
  contributor,
  size = 'sm',
  showTooltip = true
}: ContributorAvatarProps) {
  const { wrapper, text } = sizeClasses[size];
  const initials = generateInitials(contributor.name);

  const avatar = contributor.avatar ? (
    <Image
      src={contributor.avatar}
      alt={contributor.name}
      width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : 48}
      height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : 48}
      className="rounded-full"
    />
  ) : (
    <div
      className={`${wrapper} coral-gradient rounded-full flex items-center justify-center ${text} font-bold text-white shadow-lg`}
    >
      {initials}
    </div>
  );

  if (showTooltip) {
    return (
      <div className="relative group">
        {avatar}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-darkCard text-white text-xs rounded opacity-0 group-hover:opacity-100 smooth-transition whitespace-nowrap pointer-events-none">
          {contributor.name}
        </div>
      </div>
    );
  }

  return avatar;
}

function generateInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return initials || 'U'; // Fallback to 'U' for "User"
}
```

**Accessibility**:
- Use `alt` text for images
- Tooltip on hover (not focus) for keyboard users
- ARIA label on avatar wrapper

**Testing Strategy**:
- Unit test: `generateInitials` with various name formats
- Component test: Image avatar rendering
- Component test: Initials fallback rendering
- Component test: Size variants (xs, sm, md, lg)
- Component test: Tooltip display on hover

---

### 3. EnhancedCodeBlock Component

**Type**: Client Component (copy button needs interactivity)

**Purpose**: Code block with language label and copy button

**Decision**: **Extend existing CodeBlock** vs create new component?
→ **Create wrapper component** `EnhancedCodeBlock` that wraps existing `CodeBlock`

**Rationale**:
- Keep existing `CodeBlock` logic intact (syntax highlighting, language detection)
- Add new UI layer (language label, copy button) without breaking existing usage
- Separation of concerns (CodeBlock = rendering, EnhancedCodeBlock = UX features)

**Props Interface**:
```typescript
interface EnhancedCodeBlockProps {
  language: string;
  code: string;
  className?: string;
  showLineNumbers?: boolean;  // Future enhancement
}
```

**Implementation Strategy**:

1. **Copy Button State Machine**:
   ```typescript
   type CopyState = 'idle' | 'copying' | 'success' | 'error';

   const [copyState, setCopyState] = useState<CopyState>('idle');

   // Auto-reset after 2 seconds
   useEffect(() => {
     if (copyState === 'success' || copyState === 'error') {
       const timer = setTimeout(() => setCopyState('idle'), 2000);
       return () => clearTimeout(timer);
     }
   }, [copyState]);
   ```

2. **Cross-Browser Copy Implementation**:
   ```typescript
   async function copyToClipboard(text: string) {
     setCopyState('copying');

     try {
       // Modern Clipboard API (preferred)
       if (navigator.clipboard && window.isSecureContext) {
         await navigator.clipboard.writeText(text);
         setCopyState('success');
       } else {
         // Fallback for older browsers
         const textArea = document.createElement('textarea');
         textArea.value = text;
         textArea.style.position = 'fixed';
         textArea.style.left = '-999999px';
         document.body.appendChild(textArea);
         textArea.select();
         document.execCommand('copy');
         document.body.removeChild(textArea);
         setCopyState('success');
       }
     } catch (error) {
       console.error('Copy failed:', error);
       setCopyState('error');
     }
   }
   ```

3. **Button States**:
   ```typescript
   const buttonConfig = {
     idle: { icon: Copy, text: 'Copy', className: 'neu-raised hover:bg-darkCard' },
     copying: { icon: Loader, text: 'Copying...', className: 'neu-pressed opacity-50' },
     success: { icon: Check, text: 'Copied!', className: 'bg-green-500 text-white' },
     error: { icon: X, text: 'Failed', className: 'bg-red-500 text-white' }
   };
   ```

4. **Performance Optimization**:
   - Use `useCallback` for copy handler (prevent re-renders)
   - Memoize language label (static per render)
   - No need for React.memo (child of WikiContent, re-renders are intentional)

**Skeleton Implementation**:
```tsx
// apps/web/components/wiki/EnhancedCodeBlock.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, X, Loader } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

interface EnhancedCodeBlockProps {
  language: string;
  code: string;
  className?: string;
}

type CopyState = 'idle' | 'copying' | 'success' | 'error';

export function EnhancedCodeBlock({ language, code, className }: EnhancedCodeBlockProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  // Auto-reset copy state after 2 seconds
  useEffect(() => {
    if (copyState === 'success' || copyState === 'error') {
      const timer = setTimeout(() => setCopyState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyState]);

  // Memoize copy handler
  const handleCopy = useCallback(async () => {
    setCopyState('copying');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        setCopyState('success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyState('success');
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      setCopyState('error');
    }
  }, [code]);

  // Button configuration
  const buttonStates = {
    idle: { Icon: Copy, text: 'Copy', className: 'neu-raised hover:bg-darkCard' },
    copying: { Icon: Loader, text: 'Copying...', className: 'neu-pressed opacity-50' },
    success: { Icon: Check, text: 'Copied!', className: 'bg-green-500 text-white' },
    error: { Icon: X, text: 'Failed', className: 'bg-red-500 text-white' }
  };

  const { Icon, text, className: buttonClassName } = buttonStates[copyState];

  return (
    <div className="relative code-block rounded-2xl overflow-hidden">
      {/* Header: Language + Copy Button */}
      <div className="flex items-center justify-between px-4 py-2 bg-darkCard border-b border-white/5">
        <span className="text-white text-sm font-medium font-mono">{language}</span>
        <button
          onClick={handleCopy}
          disabled={copyState === 'copying'}
          className={`px-3 py-1 rounded text-xs smooth-transition ${buttonClassName}`}
          aria-label={text}
        >
          <Icon className="inline-block mr-2 h-3 w-3" aria-hidden="true" />
          {text}
        </button>
      </div>

      {/* Code Block */}
      <CodeBlock language={language} code={code} className={className} />
    </div>
  );
}
```

**Accessibility**:
- Button has `aria-label` for screen readers
- Disabled state during copy (prevent multiple clicks)
- Visual feedback (color change, icon change)
- Keyboard accessible (Tab to focus, Enter/Space to activate)

**Testing Strategy**:
- Unit test: Copy to clipboard (mock `navigator.clipboard`)
- Unit test: Fallback copy method (when clipboard API unavailable)
- Component test: Button state transitions (idle → copying → success)
- Component test: Error state (when copy fails)
- Component test: Auto-reset after 2 seconds
- Integration test: Copy button within WikiContent markdown

---

### 4. WikiContributors Component

**Type**: Hybrid (Server wrapper + Client interactive sections)

**Purpose**: Right sidebar with contributors list, stats, and feedback

**Component Split Strategy**:

```
WikiContributors (Server Wrapper)
├── ContributorList (Server - static data)
├── PageStats (Server - static data)
└── FeedbackButtons (Client - interactive)
```

**Props Interface**:
```typescript
interface WikiContributorsProps {
  contributors: Contributor[];
  views: number;
  revisions: number;
}
```

**Implementation Strategy**:

1. **Server Wrapper** (WikiContributors):
   - Fetches data at ISR time
   - Passes data to child components
   - No state, no effects

2. **ContributorList** (Server Component):
   ```typescript
   // Show top 5 contributors by edit count
   const topContributors = contributors
     .sort((a, b) => b.editCount - a.editCount)
     .slice(0, 5);

   // If more than 5, show "View all" link (future enhancement)
   const hasMore = contributors.length > 5;
   ```

3. **PageStats** (Server Component):
   - Simple key-value display
   - Format large numbers (1,234)
   - No interactivity

4. **FeedbackButtons** (Client Component):
   - Local state for user feedback
   - No API call yet (US-023: Wiki Feedback API is separate story)
   - Store selection in `localStorage` (persist across page loads)

**FeedbackButtons State Management**:
```typescript
type FeedbackValue = 'helpful' | 'not-helpful' | null;

const [feedback, setFeedback] = useState<FeedbackValue>(null);

// Load from localStorage on mount
useEffect(() => {
  const stored = localStorage.getItem(`wiki-feedback-${pageId}`);
  if (stored === 'helpful' || stored === 'not-helpful') {
    setFeedback(stored);
  }
}, [pageId]);

// Save to localStorage on change
const handleFeedback = (value: FeedbackValue) => {
  setFeedback(value);
  if (value) {
    localStorage.setItem(`wiki-feedback-${pageId}`, value);
  } else {
    localStorage.removeItem(`wiki-feedback-${pageId}`);
  }

  // TODO (US-023): Send to API
  // await fetch('/api/wiki/feedback', { method: 'POST', body: { pageId, value } })
};
```

**Skeleton Implementation**:

```tsx
// apps/web/components/wiki/WikiContributors.tsx
import { ContributorList } from './ContributorList';
import { PageStats } from './PageStats';
import { FeedbackButtons } from './FeedbackButtons';
import type { Contributor } from '@/types/wiki';

interface WikiContributorsProps {
  contributors: Contributor[];
  views: number;
  revisions: number;
  pageId: number;  // For feedback tracking
}

// Server Component (wrapper)
export function WikiContributors({
  contributors,
  views,
  revisions,
  pageId
}: WikiContributorsProps) {
  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Contributors */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Contributors</h3>
          <ContributorList contributors={contributors} />
        </div>

        {/* Page Stats */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Page Stats</h3>
          <PageStats views={views} revisions={revisions} />
        </div>

        {/* Feedback (Client Component) */}
        <div className="neu-raised rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Was this helpful?</h3>
          <FeedbackButtons pageId={pageId} />
        </div>
      </div>
    </aside>
  );
}
```

```tsx
// apps/web/components/wiki/ContributorList.tsx
import { ContributorAvatar } from './ContributorAvatar';
import type { Contributor } from '@/types/wiki';

interface ContributorListProps {
  contributors: Contributor[];
}

// Server Component
export function ContributorList({ contributors }: ContributorListProps) {
  // Sort by edit count, show top 5
  const topContributors = contributors
    .sort((a, b) => b.editCount - a.editCount)
    .slice(0, 5);

  if (topContributors.length === 0) {
    return <p className="text-sm text-slate">No contributors yet</p>;
  }

  return (
    <div className="space-y-3">
      {topContributors.map((contributor) => (
        <div key={contributor.name} className="flex items-center gap-3">
          <ContributorAvatar contributor={contributor} size="sm" showTooltip={false} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{contributor.name}</p>
            <p className="text-xs text-slate">
              {contributor.editCount} {contributor.editCount === 1 ? 'edit' : 'edits'}
            </p>
          </div>
        </div>
      ))}

      {contributors.length > 5 && (
        <button className="text-sm text-coral hover:underline smooth-transition w-full text-left">
          View all {contributors.length} contributors →
        </button>
      )}
    </div>
  );
}
```

```tsx
// apps/web/components/wiki/PageStats.tsx
// Server Component
interface PageStatsProps {
  views: number;
  revisions: number;
}

export function PageStats({ views, revisions }: PageStatsProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-slate">Views</span>
        <span className="font-medium">{views.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate">Revisions</span>
        <span className="font-medium">{revisions}</span>
      </div>
    </div>
  );
}
```

```tsx
// apps/web/components/wiki/FeedbackButtons.tsx
'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  pageId: number;
}

type FeedbackValue = 'helpful' | 'not-helpful' | null;

export function FeedbackButtons({ pageId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = `wiki-feedback-${pageId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored === 'helpful' || stored === 'not-helpful') {
      setFeedback(stored);
    }
  }, [pageId]);

  const handleFeedback = async (value: FeedbackValue) => {
    setIsLoading(true);

    // Update local state
    setFeedback(value);

    // Persist to localStorage
    const storageKey = `wiki-feedback-${pageId}`;
    if (value) {
      localStorage.setItem(storageKey, value);
    } else {
      localStorage.removeItem(storageKey);
    }

    // TODO (US-023): Send to API
    // try {
    //   await fetch('/api/wiki/feedback', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ pageId, value })
    //   });
    // } catch (error) {
    //   console.error('Failed to submit feedback:', error);
    // }

    setIsLoading(false);
  };

  const isHelpful = feedback === 'helpful';
  const isNotHelpful = feedback === 'not-helpful';

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleFeedback(isHelpful ? null : 'helpful')}
        disabled={isLoading}
        className={`flex-1 px-4 py-2 rounded-xl smooth-transition text-sm ${
          isHelpful
            ? 'bg-green-500 text-white shadow-lg'
            : 'neu-raised hover:bg-green-500 hover:text-white'
        }`}
        aria-label="Mark as helpful"
        aria-pressed={isHelpful}
      >
        <ThumbsUp className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
        Yes
      </button>
      <button
        onClick={() => handleFeedback(isNotHelpful ? null : 'not-helpful')}
        disabled={isLoading}
        className={`flex-1 px-4 py-2 rounded-xl smooth-transition text-sm ${
          isNotHelpful
            ? 'bg-red-500 text-white shadow-lg'
            : 'neu-raised hover:bg-red-500 hover:text-white'
        }`}
        aria-label="Mark as not helpful"
        aria-pressed={isNotHelpful}
      >
        <ThumbsDown className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
        No
      </button>
    </div>
  );
}
```

**State Management Decision**:
- Use **individual `useState`** (not lifted state) because:
  - Feedback is isolated to FeedbackButtons component
  - No other components need this state
  - Simple toggle logic (no complex state interactions)
  - localStorage provides persistence

**Accessibility**:
- Buttons have `aria-label` for screen readers
- `aria-pressed` indicates selected state
- Keyboard accessible (Tab + Enter/Space)
- Visual feedback (color change, active state)

**Testing Strategy**:
- Component test: Contributor list renders top 5
- Component test: "View all" link when >5 contributors
- Component test: Page stats formatting (large numbers)
- Component test: Feedback button state (idle → selected → deselected)
- Component test: localStorage persistence
- Integration test: Full sidebar rendering

---

### 5. QuickNavigation Component

**Type**: Client Component (search input needs interactivity)

**Purpose**: Left sidebar with category-based navigation and search

**Props Interface**:
```typescript
interface QuickNavigationProps {
  categories: Array<{
    name: string;
    icon: string;      // Lucide icon name or emoji
    count: number;     // Number of pages in this category
    slug: string;      // URL-friendly slug
  }>;
  currentCategory?: string;
}
```

**Implementation Strategy**:

1. **Data Fetching** (Server-side in page.tsx):
   ```typescript
   // Fetch category stats
   const categoryStats = await prisma.wikiPage.groupBy({
     by: ['category'],
     _count: { id: true },
     where: { category: { not: null } }
   });

   const categories = categoryStats.map(stat => ({
     name: stat.category,
     slug: slugify(stat.category),
     count: stat._count.id,
     icon: getCategoryIcon(stat.category) // Hardcoded map
   }));
   ```

2. **Icon Mapping** (Server-side helper):
   ```typescript
   // Server-side helper in lib/wiki.ts
   import * as Icons from 'lucide-react';

   const categoryIconMap: Record<string, keyof typeof Icons> = {
     'Getting Started': 'Rocket',
     'Core Concepts': 'Brain',
     'API Reference': 'Code',
     'Deployment': 'Cloud',
     'Troubleshooting': 'Wrench'
     // Add more as needed
   };

   export function getCategoryIcon(category: string): string {
     return categoryIconMap[category] || 'FileText';
   }
   ```

3. **Search Integration**:
   - Reuse existing WikiSearchBar component (if exists)
   - Or implement simple search with debounce:
   ```typescript
   const [searchQuery, setSearchQuery] = useState('');
   const debouncedQuery = useDebounce(searchQuery, 300);

   useEffect(() => {
     if (debouncedQuery) {
       // Navigate to search results page
       router.push(`/wiki?q=${encodeURIComponent(debouncedQuery)}`);
     }
   }, [debouncedQuery]);
   ```

4. **Active State**:
   ```typescript
   const isActive = (categorySlug: string) => {
     return categorySlug === currentCategory;
   };
   ```

**Skeleton Implementation**:
```tsx
// apps/web/components/wiki/QuickNavigation.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';

interface Category {
  name: string;
  icon: string;
  count: number;
  slug: string;
}

interface QuickNavigationProps {
  categories: Category[];
  currentCategory?: string;
}

export function QuickNavigation({ categories, currentCategory }: QuickNavigationProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/wiki?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-24">
        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search wiki..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 neu-pressed rounded-xl text-white placeholder-slate text-sm smooth-transition focus:outline-none focus:ring-2 focus:ring-coral"
                aria-label="Search wiki pages"
              />
            </div>
          </form>
        </div>

        {/* Category Navigation */}
        <nav className="space-y-1" aria-label="Wiki categories">
          {categories.map((category) => {
            const isActive = category.slug === currentCategory;
            const IconComponent = (Icons as any)[category.icon] || FileText;

            return (
              <Link
                key={category.slug}
                href={`/wiki?category=${category.slug}`}
                className={`sidebar-item block px-3 py-2.5 text-sm rounded-xl smooth-transition ${
                  isActive
                    ? 'active text-coral bg-coral/10'
                    : 'text-slate hover:text-white hover:bg-coral/5'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <IconComponent className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
                {category.name}
                <span className="float-right text-xs text-slate">{category.count}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
```

**Performance Optimization**:
- No need for `useCallback` (onClick is navigation, not expensive)
- No need for `useMemo` (categories array is stable from props)
- Debounce search input (if implementing live search)

**Accessibility**:
- Search input has `aria-label`
- Navigation has `aria-label="Wiki categories"`
- Active link has `aria-current="page"`
- Keyboard navigation (Tab through links)

**Testing Strategy**:
- Component test: Category links render correctly
- Component test: Active state highlighting
- Component test: Search form submission
- Component test: Icon rendering (valid icon names)
- Component test: Fallback icon (invalid icon name)

---

### 6. WikiFooterNav Component

**Type**: Server Component (static links)

**Purpose**: Previous/next page navigation

**Props Interface**:
```typescript
interface WikiFooterNavProps {
  prevPage?: { title: string; path: string };
  nextPage?: { title: string; path: string };
}
```

**Implementation Strategy**:

1. **Data Fetching** (Server-side in page.tsx):
   ```typescript
   // Find prev/next pages in same category
   async function getPrevNextPages(currentPath: string, category: string) {
     const currentPage = await prisma.wikiPage.findUnique({
       where: { path: currentPath },
       select: { orderIndex: true }
     });

     if (!currentPage) return { prevPage: null, nextPage: null };

     const [prevPage] = await prisma.wikiPage.findMany({
       where: {
         category,
         orderIndex: { lt: currentPage.orderIndex }
       },
       orderBy: { orderIndex: 'desc' },
       take: 1,
       select: { title: true, path: true }
     });

     const [nextPage] = await prisma.wikiPage.findMany({
       where: {
         category,
         orderIndex: { gt: currentPage.orderIndex }
       },
       orderBy: { orderIndex: 'asc' },
       take: 1,
       select: { title: true, path: true }
     });

     return { prevPage, nextPage };
   }
   ```

2. **Graceful Handling**:
   - Show only prev link if no next page
   - Show only next link if no prev page
   - Hide entire footer if both are missing
   - Center single link if only one exists

**Skeleton Implementation**:
```tsx
// apps/web/components/wiki/WikiFooterNav.tsx
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface WikiFooterNavProps {
  prevPage?: { title: string; path: string };
  nextPage?: { title: string; path: string };
}

// Server Component
export function WikiFooterNav({ prevPage, nextPage }: WikiFooterNavProps) {
  // Don't render if both are missing
  if (!prevPage && !nextPage) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-between pt-8 border-t border-darkCard mt-12"
      aria-label="Page navigation"
    >
      {prevPage ? (
        <Link
          href={`/wiki${prevPage.path}`}
          className="flex items-center gap-2 text-slate hover:text-coral smooth-transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <div>
            <div className="text-xs uppercase mb-1">Previous</div>
            <div className="font-medium">{prevPage.title}</div>
          </div>
        </Link>
      ) : (
        <div /> // Spacer
      )}

      {nextPage ? (
        <Link
          href={`/wiki${nextPage.path}`}
          className="flex items-center gap-2 text-slate hover:text-coral smooth-transition text-right"
        >
          <div>
            <div className="text-xs uppercase mb-1">Next</div>
            <div className="font-medium">{nextPage.title}</div>
          </div>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <div /> // Spacer
      )}
    </nav>
  );
}
```

**Accessibility**:
- Navigation has `aria-label="Page navigation"`
- Links are semantic `<Link>` components
- Keyboard accessible (Tab navigation)
- Visual hover feedback

**Testing Strategy**:
- Component test: Both prev and next links render
- Component test: Only prev link renders
- Component test: Only next link renders
- Component test: Component hidden if no links

---

## Server vs Client Component Decisions

### Summary Table

| Component | Type | Rationale |
|-----------|------|-----------|
| **WikiHeader** | Server | Static metadata, no interactivity, SEO-friendly |
| **ContributorAvatar** | Server | Pure presentation, no state |
| **WikiContributors** | Server (wrapper) | Passes data to children, no state |
| **ContributorList** | Server | Static list, no interactivity |
| **PageStats** | Server | Static numbers, no interactivity |
| **FeedbackButtons** | **Client** | User interaction, localStorage |
| **EnhancedCodeBlock** | **Client** | Copy button, clipboard API |
| **QuickNavigation** | **Client** | Search input, active state |
| **WikiFooterNav** | Server | Static links, no interactivity |

### Why This Split?

**Benefits**:
1. **Reduced JS Bundle**: 70% of UI is server-rendered (no client-side JS needed)
2. **Better SEO**: Content is in HTML (not hydrated from JSON)
3. **Faster FCP**: Users see content immediately (no JS parse/execute delay)
4. **ISR Optimization**: Static parts are cached at CDN edge

**Trade-offs**:
- Copy button requires client-side JS (acceptable - progressive enhancement)
- Feedback buttons need client state (acceptable - not critical for SEO)
- Search input needs client state (acceptable - enhancement feature)

---

## State Management Strategy

### Component-Level State

Use `useState` for isolated component state:

1. **EnhancedCodeBlock**: Copy button state
   ```typescript
   const [copyState, setCopyState] = useState<CopyState>('idle');
   ```

2. **FeedbackButtons**: Feedback selection
   ```typescript
   const [feedback, setFeedback] = useState<FeedbackValue>(null);
   ```

3. **QuickNavigation**: Search query
   ```typescript
   const [searchQuery, setSearchQuery] = useState('');
   ```

**Why not lift state?**
- No state sharing between components
- Each component's state is independent
- Simplifies testing (no context setup needed)
- Better performance (only affected component re-renders)

### Future State Management

When implementing US-023 (Wiki Feedback API):
- **Option 1**: Keep local state + add API call in `handleFeedback`
- **Option 2**: Use React Query for server state caching
- **Option 3**: Add optimistic updates with SWR

**Recommendation**: Start with Option 1 (simplest), upgrade to React Query if caching is needed.

---

## Performance Optimization

### 1. React.memo Strategy

**Where to Use**:
- ❌ **Don't memo** WikiHeader (always re-renders with page data)
- ❌ **Don't memo** ContributorAvatar (props change frequently)
- ✅ **Do memo** ContributorList (stable contributors array)
- ✅ **Do memo** PageStats (stable numbers)

**Example**:
```typescript
// apps/web/components/wiki/ContributorList.tsx
export const ContributorList = React.memo(function ContributorList({ contributors }: ContributorListProps) {
  // ... implementation
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if contributors array changes
  return JSON.stringify(prevProps.contributors) === JSON.stringify(nextProps.contributors);
});
```

### 2. useCallback/useMemo Strategy

**Where to Use**:

```typescript
// EnhancedCodeBlock: Memoize copy handler
const handleCopy = useCallback(async () => {
  // ... copy logic
}, [code]); // Only recreate if code changes

// WikiHeader: Don't need useMemo for simple operations
const primaryContributor = contributors[0]; // ❌ No memo needed (fast operation)

// QuickNavigation: Don't need useCallback for navigation
const handleClick = () => router.push(...); // ❌ No callback needed (navigation is cheap)
```

**Rule of Thumb**:
- ✅ **Use `useCallback`** if function is passed to memoized child component
- ✅ **Use `useMemo`** if computation is >50ms
- ❌ **Don't use** for simple operations (premature optimization)

### 3. Code Splitting

**Current**:
```typescript
// WikiContent.tsx already lazy-loads CodeBlock
const CodeBlock = dynamic(() => import('./CodeBlock').then((mod) => ({ default: mod.CodeBlock })), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

**Future Optimization**:
```typescript
// Lazy load EnhancedCodeBlock only when markdown contains code
// (Most wiki pages don't have code blocks)
const EnhancedCodeBlock = dynamic(() => import('./EnhancedCodeBlock'), {
  loading: () => <div className="neu-pressed animate-pulse rounded-2xl p-4">Loading code...</div>,
  ssr: false
});
```

### 4. ISR Configuration

**Current**: `revalidate: 3600` (1 hour)

**Optimization**:
```typescript
// Page-level ISR
export const revalidate = 3600; // 1 hour (keep as is)

// On-demand revalidation (when page edited)
// POST /api/revalidate
export async function POST(request: Request) {
  const { path } = await request.json();
  await revalidate(`/wiki/${path}`);
  return Response.json({ revalidated: true });
}
```

**When to revalidate**:
- After wiki page edit (PUT /api/wiki/:id)
- After contributor adds edit (increment revisions count)
- After view count update (batch every 100 views)

---

## Accessibility Patterns

### 1. Semantic HTML

```tsx
// Proper heading hierarchy
<article>
  <h1>{title}</h1>           {/* Page title */}
  <section>
    <h2>{sectionTitle}</h2>   {/* Section title */}
    <h3>{subsectionTitle}</h3> {/* Subsection */}
  </section>
</article>

// Proper navigation
<nav aria-label="Wiki categories">
  <Link href="..." aria-current="page">...</Link>
</nav>
```

### 2. ARIA Labels

```tsx
// Buttons
<button aria-label="Copy code to clipboard">
  <Copy />
</button>

// Search input
<input
  type="search"
  aria-label="Search wiki pages"
  placeholder="Search..."
/>

// Active state
<Link aria-current="page">Current Page</Link>
```

### 3. Keyboard Navigation

```tsx
// All interactive elements must be keyboard accessible
<button tabIndex={0} onKeyDown={handleKeyDown}>...</button>

// Skip to main content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### 4. Screen Reader Support

```tsx
// Hide decorative icons
<Copy className="..." aria-hidden="true" />

// Provide text alternatives
<button aria-label="Mark as helpful">
  <ThumbsUp aria-hidden="true" />
  <span className="sr-only">Mark as helpful</span>
</button>
```

---

## TypeScript Type System

### Shared Types

```typescript
// apps/web/types/wiki.ts
export interface Contributor {
  name: string;
  avatar?: string;
  editCount: number;
  lastEditAt: string; // ISO 8601
}

export interface Category {
  name: string;
  icon: string;
  count: number;
  slug: string;
}

export interface WikiPageFull {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  path: string;

  // Metadata
  views: number;
  revisions: number;
  contributors: Contributor[];
  readingTime?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Navigation
  prevPage?: { title: string; path: string };
  nextPage?: { title: string; path: string };

  // TOC
  tocItems: TOCItem[];

  // Related
  relatedPages: RelatedPage[];
}

export interface TOCItem {
  id: string;
  text: string;
  level: number; // 1-6
}

export interface RelatedPage {
  id: number;
  title: string;
  path: string;
}

// Feedback
export type FeedbackValue = 'helpful' | 'not-helpful' | null;

// Copy button
export type CopyState = 'idle' | 'copying' | 'success' | 'error';
```

### Prisma Extensions

```typescript
// Update Prisma schema, then regenerate types
// npx prisma generate
```

---

## Reading Time Calculation

### Server-Side Helper

```typescript
// apps/web/lib/wiki.ts
export function calculateReadingTime(content: string): number {
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;

  // Remove markdown syntax
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '')         // Remove inline code
    .replace(/[#*_~\[\]()]/g, '')    // Remove markdown symbols
    .replace(/\n+/g, ' ')            // Replace newlines with spaces
    .trim();

  // Count words
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // Calculate reading time (round up)
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  return Math.max(1, minutes); // Minimum 1 minute
}
```

### When to Calculate

**Option 1**: Calculate on save (recommended)
```typescript
// PUT /api/wiki/:id
const readingTime = calculateReadingTime(content);
await prisma.wikiPage.update({
  where: { id },
  data: { content, readingTime }
});
```

**Option 2**: Calculate on read (ISR cache)
```typescript
// apps/web/app/wiki/[slug]/page.tsx
const page = await getWikiPage(slug);
const readingTime = calculateReadingTime(page.content);
```

**Recommendation**: Option 1 (pre-calculate, store in DB)
- Faster page load (no calculation at runtime)
- Consistent across all page renders
- Can be used for sorting/filtering

---

## Component Integration Plan

### Updated Page Structure

```tsx
// apps/web/app/wiki/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { WikiHeader } from '@/components/wiki/WikiHeader';
import { QuickNavigation } from '@/components/wiki/QuickNavigation';
import { WikiContent } from '@/components/wiki/WikiContent';
import { WikiContributors } from '@/components/wiki/WikiContributors';
import { WikiFooterNav } from '@/components/wiki/WikiFooterNav';
import { calculateReadingTime } from '@/lib/wiki';

export const revalidate = 3600; // ISR: 1 hour

interface PageProps {
  params: { slug: string };
}

async function getWikiPageFull(slug: string) {
  // Fetch page
  const page = await prisma.wikiPage.findUnique({
    where: { path: `/${slug}` },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      category: true,
      path: true,
      views: true,
      revisions: true,
      contributors: true, // JSON field
      readingTime: true,
      createdAt: true,
      updatedAt: true,
      outgoingLinks: {
        select: { targetPage: { select: { id: true, title: true, path: true } } },
        take: 5
      }
    }
  });

  if (!page) return null;

  // Extract TOC
  const tocItems = extractHeadings(page.content);

  // Fetch prev/next pages
  const { prevPage, nextPage } = await getPrevNextPages(page.path, page.category || '');

  // Flatten related pages
  const relatedPages = page.outgoingLinks.map(link => link.targetPage);

  return {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    tocItems,
    relatedPages,
    prevPage,
    nextPage
  };
}

async function getCategoryStats() {
  const stats = await prisma.wikiPage.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { category: { not: null } }
  });

  return stats.map(stat => ({
    name: stat.category!,
    slug: slugify(stat.category!),
    count: stat._count.id,
    icon: getCategoryIcon(stat.category!)
  }));
}

export default async function WikiPage({ params }: PageProps) {
  const [page, categories] = await Promise.all([
    getWikiPageFull(params.slug),
    getCategoryStats()
  ]);

  if (!page) notFound();

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 gap-4 overflow-hidden p-4">
          {/* Left Sidebar: Quick Navigation */}
          <QuickNavigation
            categories={categories}
            currentCategory={page.category || undefined}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Breadcrumb (existing) */}
              <nav aria-label="Breadcrumb" className="text-sm">
                {/* ... existing breadcrumb code ... */}
              </nav>

              {/* NEW: Enhanced Header */}
              <WikiHeader
                title={page.title}
                description={page.excerpt}
                category={page.category || 'Uncategorized'}
                tags={page.tags || []}
                contributors={page.contributors as Contributor[]}
                updatedAt={page.updatedAt}
                views={page.views}
                path={page.path}
                readingTime={page.readingTime || undefined}
              />

              {/* Wiki Content (enhanced with EnhancedCodeBlock) */}
              <WikiContent content={page.content} tocItems={page.tocItems} />

              {/* NEW: Footer Navigation */}
              <WikiFooterNav prevPage={page.prevPage} nextPage={page.nextPage} />
            </div>
          </main>

          {/* Right Sidebar: Contributors + Stats + Feedback */}
          <WikiContributors
            contributors={page.contributors as Contributor[]}
            views={page.views}
            revisions={page.revisions}
            pageId={page.id}
          />
        </div>
      </div>
    </>
  );
}
```

---

## Testing Strategy

### 1. Unit Tests (Vitest)

**Test Coverage**:
- Utility functions (calculateReadingTime, generateInitials, formatRelativeTime)
- Type guards
- Pure functions

**Example**:
```typescript
// apps/web/lib/__tests__/wiki.test.ts
import { describe, it, expect } from 'vitest';
import { calculateReadingTime, generateInitials } from '../wiki';

describe('calculateReadingTime', () => {
  it('calculates reading time for plain text', () => {
    const content = 'word '.repeat(200); // 200 words
    expect(calculateReadingTime(content)).toBe(1); // 1 minute
  });

  it('excludes code blocks from word count', () => {
    const content = 'word '.repeat(100) + '```\ncode code code\n```';
    expect(calculateReadingTime(content)).toBe(1); // Still 1 minute
  });

  it('returns minimum 1 minute', () => {
    expect(calculateReadingTime('hello')).toBe(1);
  });
});

describe('generateInitials', () => {
  it('generates 2-letter initials', () => {
    expect(generateInitials('John Doe')).toBe('JD');
  });

  it('handles single name', () => {
    expect(generateInitials('John')).toBe('J');
  });

  it('handles 3+ word names', () => {
    expect(generateInitials('John Jacob Doe')).toBe('JJ');
  });
});
```

### 2. Component Tests (React Testing Library)

**Test Coverage**:
- Component rendering
- User interactions
- Conditional rendering
- Accessibility

**Example**:
```typescript
// apps/web/components/wiki/__tests__/FeedbackButtons.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackButtons } from '../FeedbackButtons';

describe('FeedbackButtons', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    global.localStorage = localStorageMock as any;
  });

  it('renders both buttons', () => {
    render(<FeedbackButtons pageId={1} />);
    expect(screen.getByLabelText('Mark as helpful')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark as not helpful')).toBeInTheDocument();
  });

  it('highlights button when clicked', async () => {
    render(<FeedbackButtons pageId={1} />);
    const helpfulButton = screen.getByLabelText('Mark as helpful');

    fireEvent.click(helpfulButton);

    await waitFor(() => {
      expect(helpfulButton).toHaveClass('bg-green-500');
    });
  });

  it('persists feedback to localStorage', async () => {
    render(<FeedbackButtons pageId={1} />);
    const helpfulButton = screen.getByLabelText('Mark as helpful');

    fireEvent.click(helpfulButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('wiki-feedback-1', 'helpful');
    });
  });

  it('loads feedback from localStorage', () => {
    (localStorage.getItem as any).mockReturnValue('helpful');
    render(<FeedbackButtons pageId={1} />);

    const helpfulButton = screen.getByLabelText('Mark as helpful');
    expect(helpfulButton).toHaveClass('bg-green-500');
  });
});
```

### 3. Integration Tests (Playwright)

**Test Coverage**:
- Full page rendering
- Navigation flows
- Copy button functionality
- Search functionality

**Example**:
```typescript
// apps/web/e2e/wiki-detail.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Wiki Detail Page', () => {
  test('displays enhanced header with contributors', async ({ page }) => {
    await page.goto('/wiki/quick-start');

    // Check header
    await expect(page.locator('h1')).toContainText('Quick Start Guide');

    // Check contributors
    await expect(page.locator('text=Updated by')).toBeVisible();

    // Check tags
    await expect(page.locator('text=Getting Started')).toBeVisible();
  });

  test('copy button works', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
    await page.goto('/wiki/quick-start');

    // Find first code block
    const copyButton = page.locator('button:has-text("Copy")').first();
    await copyButton.click();

    // Check success state
    await expect(copyButton).toContainText('Copied!');

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBeTruthy();
  });

  test('feedback buttons work', async ({ page }) => {
    await page.goto('/wiki/quick-start');

    // Click helpful button
    const helpfulButton = page.locator('button:has-text("Yes")');
    await helpfulButton.click();

    // Check active state
    await expect(helpfulButton).toHaveClass(/bg-green-500/);
  });

  test('quick navigation shows categories', async ({ page }) => {
    await page.goto('/wiki/quick-start');

    // Check categories in left sidebar
    await expect(page.locator('text=Getting Started')).toBeVisible();
    await expect(page.locator('text=Core Concepts')).toBeVisible();
  });
});
```

---

## Migration Path

### Phase 1: Database (Day 4.1 - 2 hours)

1. Update Prisma schema
2. Run migration: `npx prisma migrate dev --name add-wiki-metadata`
3. Seed existing pages with dummy data
4. Calculate reading time for all pages

### Phase 2: Core Components (Day 4.2 - 4 hours)

1. Create WikiHeader + ContributorAvatar
2. Create EnhancedCodeBlock (extend existing)
3. Update WikiContent to use EnhancedCodeBlock
4. Test components in isolation

### Phase 3: Sidebar Components (Day 4.3 - 3 hours)

1. Create WikiContributors + child components
2. Create QuickNavigation
3. Update WikiSidebar or create new layout
4. Test sidebar interactions

### Phase 4: Integration (Day 4.4 - 2 hours)

1. Update page.tsx with new layout
2. Wire up all components
3. Update data fetching logic
4. Test full page rendering

### Phase 5: Polish & Testing (Day 4.5 - 2 hours)

1. Run E2E tests
2. Fix accessibility issues
3. Optimize performance
4. Update documentation

**Total Estimate**: 13 hours (fits in 5-point story)

---

## Next Steps for Parent Agent

### 1. Database Schema Update

```bash
# Add fields to WikiPage model in schema.prisma
npx prisma migrate dev --name add-wiki-metadata
npx prisma generate
```

### 2. Create Helper Functions

```typescript
// apps/web/lib/wiki.ts
export function calculateReadingTime(content: string): number { ... }
export function generateInitials(name: string): string { ... }
export function formatRelativeTime(isoString: string): string { ... }
export function getCategoryIcon(category: string): string { ... }
```

### 3. Create Components (Order Matters)

**Day 4.1**: Foundation
1. ContributorAvatar.tsx (no dependencies)
2. WikiHeader.tsx (uses ContributorAvatar)

**Day 4.2**: Code Blocks
3. EnhancedCodeBlock.tsx (wraps existing CodeBlock)
4. Update WikiContent.tsx to use EnhancedCodeBlock

**Day 4.3**: Sidebars
5. ContributorList.tsx (uses ContributorAvatar)
6. PageStats.tsx (no dependencies)
7. FeedbackButtons.tsx (no dependencies)
8. WikiContributors.tsx (uses all three above)
9. QuickNavigation.tsx (independent)

**Day 4.4**: Navigation
10. WikiFooterNav.tsx (independent)

**Day 4.5**: Integration
11. Update page.tsx with all components

### 4. Type Definitions

```typescript
// apps/web/types/wiki.ts
export interface Contributor { ... }
export interface Category { ... }
export interface WikiPageFull { ... }
export type FeedbackValue = ...
export type CopyState = ...
```

### 5. Testing

```bash
# Run tests after each component
pnpm test
pnpm test:e2e
```

---

## Success Criteria Checklist

- [ ] Database schema updated with views, revisions, contributors, readingTime, tags
- [ ] WikiHeader displays title, description, contributors, metadata, category tags
- [ ] ContributorAvatar shows image or initials fallback
- [ ] EnhancedCodeBlock has language label and copy button
- [ ] Copy button works with success/error feedback
- [ ] WikiContributors sidebar shows contributors list, stats, feedback buttons
- [ ] FeedbackButtons persist to localStorage (no API yet)
- [ ] QuickNavigation shows categories with counts and icons
- [ ] Category navigation highlights active category
- [ ] WikiFooterNav shows prev/next page links (same category)
- [ ] Reading time displayed in header
- [ ] All components are accessible (ARIA labels, keyboard navigation)
- [ ] All components have TypeScript types
- [ ] Performance optimized (memo, lazy loading)
- [ ] Zero TypeScript errors
- [ ] E2E tests pass for all features

---

## Performance Benchmarks

**Target Metrics**:
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s
- Client-side JS bundle: <150KB (gzip)

**Optimization Strategies**:
- Server Components for 70% of UI → Save ~80KB JS
- Lazy load CodeBlock → Save ~300KB until needed
- ISR caching → 100ms response time after first load
- Image optimization (Next.js Image) → Faster LCP

---

## Future Enhancements (Post-US-019)

### US-023: Wiki Feedback API
- Add POST /api/wiki/feedback endpoint
- Store feedback in database
- Display feedback stats (X% found helpful)

### US-024: Wiki Search
- Full-text search with PostgreSQL tsvector
- Search results page with highlighting
- Debounced search suggestions

### US-025: Wiki Analytics
- Track page views (increment on load)
- Track read time (time on page)
- Popular pages dashboard

### US-026: Wiki Versioning
- Track edit history
- Show diff between revisions
- Revert to previous version

---

## Risk Assessment

### High Risk
- **Copy button cross-browser support**: Use fallback for older browsers ✅
- **Reading time accuracy**: Test with various content types ✅
- **ISR cache invalidation**: Implement on-demand revalidation ✅

### Medium Risk
- **Contributor avatar generation**: Handle edge cases (empty names, special chars) ✅
- **Category icon mapping**: Add fallback icon for unknown categories ✅
- **localStorage persistence**: Handle private browsing mode ✅

### Low Risk
- **Component composition**: Follow existing patterns ✅
- **TypeScript types**: Use Prisma generated types ✅
- **Testing**: Good coverage with Vitest + Playwright ✅

---

## References

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React.memo Best Practices](https://react.dev/reference/react/memo)
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Prisma JSON Fields](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)

---

**Plan Created**: 2025-11-10 14:30
**Estimated Effort**: 13 hours (5 story points)
**Ready for Implementation**: ✅

Parent agent should proceed with implementation following the order in "Next Steps" section.
