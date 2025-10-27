# SOP: Implementing IntersectionObserver Hooks

## Purpose

Standard procedure for creating battery-efficient scroll detection using the IntersectionObserver API. This pattern replaces traditional scroll event listeners with browser-optimized intersection detection, significantly reducing battery drain on mobile devices and improving performance.

## When to Use

**Use IntersectionObserver for:**

- Table of Contents (TOC) scroll spy (active section highlighting)
- Infinite scroll pagination
- Lazy loading images/components
- Scroll-triggered animations
- "Read progress" indicators
- Sticky header state changes
- Viewport visibility tracking

**Examples from codebase:**

- Wiki TOC: Highlights active heading as user scrolls
- Article listing: Lazy load more articles as user scrolls down
- Image galleries: Load images only when entering viewport

**Don't use when:**

- Need exact scroll position (use scroll events)
- Complex scroll-based animations (use Framer Motion)
- Draggable/sortable lists (use drag events)

## Prerequisites

- React hooks knowledge (`useState`, `useEffect`, `useRef`)
- TypeScript for type safety
- Understanding of browser IntersectionObserver API
- Knowledge of DOM element selection

## Procedure

### Step 1: Define Hook Interface

Create TypeScript interfaces for hook options and return type.

**Example from useScrollSpy.ts:**

```typescript
interface UseScrollSpyOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useScrollSpy(
  headingIds: string[],
  options: UseScrollSpyOptions = {}
): string | null {
  // Hook implementation
}
```

**Best Practices:**

- Make options optional with default values
- Use descriptive interface names
- Return type should be explicit (not inferred)
- Document complex options with TSDoc comments

**Parameters Explained:**

- `headingIds`: Array of element IDs to observe (e.g., `['intro', 'getting-started', 'conclusion']`)
- `rootMargin`: Viewport margin for triggering intersection (default: `'-20% 0px -80% 0px'`)
  - Top: -20% (trigger when heading is 20% from top)
  - Bottom: -80% (trigger when heading is 80% from bottom)
- `threshold`: Percentage of element visibility required (0 = any pixel visible, 1 = fully visible)

### Step 2: Initialize State and Refs

Set up state for active element and ref for observer instance.

**Example from useScrollSpy.ts:**

```typescript
export function useScrollSpy(
  headingIds: string[],
  options: UseScrollSpyOptions = {}
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ... rest of hook
}
```

**Best Practices:**

- Use `useState` for active element ID
- Use `useRef` for observer instance (persists across renders)
- Type refs explicitly (IntersectionObserver | null)
- Initialize activeId to null (no active heading initially)

**Why useRef?** - The observer instance must persist across renders and shouldn't trigger re-renders when updated.

### Step 3: Create IntersectionObserver in useEffect

Initialize observer with callback and options.

**Example from useScrollSpy.ts:**

```typescript
useEffect(() => {
  const { rootMargin = '-20% 0px -80% 0px', threshold = 0 } = options;

  // Create observer
  observerRef.current = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    },
    {
      rootMargin,
      threshold,
    }
  );

  // Observe all headings
  headingIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  });

  // Cleanup
  return () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  };
}, [headingIds, options.rootMargin, options.threshold]);
```

**IntersectionObserver Callback Explained:**

```typescript
(entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // Element is visible in viewport
      setActiveId(entry.target.id);
    }
  });
};
```

- `entries`: Array of observed elements that changed visibility
- `entry.isIntersecting`: Boolean indicating if element is visible
- `entry.target.id`: ID of the observed element

**IntersectionObserver Options:**

- `rootMargin`: Grows/shrinks viewport bounding box (CSS-like margin)
  - Example: `'-20% 0px -80% 0px'` means trigger when heading is between 20% from top and 20% from bottom
- `threshold`: Percentage of element visible (0.0 to 1.0)
  - `0`: Trigger when any pixel is visible
  - `0.5`: Trigger when 50% visible
  - `1.0`: Trigger when fully visible

**Best Practices:**

- Destructure options with defaults in useEffect
- Check if element exists before observing
- Always disconnect observer in cleanup
- Include dependencies in useEffect array

**Gotcha**: Forgetting cleanup causes memory leaks! Always disconnect observer.

### Step 4: Return Active Element ID

Return the currently active element ID from the hook.

**Example from useScrollSpy.ts:**

```typescript
export function useScrollSpy(
  headingIds: string[],
  options: UseScrollSpyOptions = {}
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // ... observer setup
  }, [headingIds, options.rootMargin, options.threshold]);

  return activeId; // Return current active ID
}
```

**Best Practices:**

- Return null when no active element
- Return string when element is active
- Use explicit return type in function signature

### Step 5: Extract Heading IDs from Content (Server-Side)

For TOC use case, extract heading IDs from markdown content.

**Example from apps/web/app/wiki/[slug]/page.tsx:**

```typescript
interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Server-side TOC extraction from markdown
function extractHeadings(markdown: string): TOCItem[] {
  const headings: TOCItem[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length; // Number of # characters
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      headings.push({ id, text, level });
    }
  }

  return headings;
}
```

**Best Practices:**

- Extract heading IDs server-side for better performance
- Use consistent ID generation (lowercase, hyphenated)
- Support heading levels 1-6 (h1-h6)
- Remove special characters from IDs

**Gotcha**: Make sure ID generation matches the IDs used in your markdown renderer!

### Step 6: Use Hook in Component

Import and use the hook in your component.

**Example from TableOfContents.tsx:**

```typescript
'use client';

import { useScrollSpy } from '@/hooks/useScrollSpy';

interface TableOfContentsProps {
  tocItems: { id: string; text: string; level: number }[];
}

export function TableOfContents({ tocItems }: TableOfContentsProps) {
  const headingIds = tocItems.map((item) => item.id);
  const activeId = useScrollSpy(headingIds, {
    rootMargin: '-20% 0px -80% 0px',
    threshold: 0,
  });

  return (
    <nav>
      {tocItems.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={activeId === item.id ? 'text-coral font-bold' : 'text-slate'}
          style={{ paddingLeft: `${(item.level - 1) * 1}rem` }}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
```

**Best Practices:**

- Extract heading IDs array from TOC items
- Pass appropriate rootMargin for your use case
- Use activeId to highlight current section
- Add smooth scroll behavior for better UX

**Gotcha**: Component must be Client Component (`'use client'`) to use hooks!

### Step 7: Add Smooth Scroll Behavior

Enable smooth scrolling when clicking TOC links.

**Example CSS:**

```css
/* Global CSS or Tailwind config */
html {
  scroll-behavior: smooth;
}
```

**Or in component:**

```typescript
const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
```

**Best Practices:**

- Use CSS `scroll-behavior: smooth` for simple cases
- Use JS `scrollIntoView` for more control
- Prevent default anchor behavior when using JS
- Add offset for fixed headers (use `block: 'center'`)

## Verification

After implementation, verify:

- [ ] Active heading highlights as user scrolls
- [ ] Clicking TOC links scrolls to heading smoothly
- [ ] Observer disconnects on unmount (no memory leaks)
- [ ] Performance is better than scroll event listeners
- [ ] Works on mobile devices
- [ ] TypeScript has no errors
- [ ] Heading IDs in content match IDs in TOC
- [ ] rootMargin triggers at correct scroll positions

## Common Pitfalls

### Issue: Observer Never Triggers

**Symptom**: Active heading never updates
**Cause**: Heading IDs don't match between content and observer

```typescript
// ❌ WRONG - IDs don't match
// Content: <h2 id="getting-started">
// Observer: observes 'getting_started'

// ✅ CORRECT - IDs match exactly
const id = text.toLowerCase().replace(/\s+/g, '-');
// "Getting Started" → "getting-started"
```

### Issue: Memory Leak

**Symptom**: Performance degrades over time
**Cause**: Forgot to disconnect observer in cleanup

```typescript
// ❌ WRONG - No cleanup
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  headingIds.forEach((id) => observer.observe(document.getElementById(id)));
}, []);

// ✅ CORRECT - Cleanup included
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  headingIds.forEach((id) => observer.observe(document.getElementById(id)));

  return () => observer.disconnect(); // Clean up!
}, []);
```

### Issue: Multiple Headings Active

**Symptom**: Multiple headings highlighted at once
**Cause**: rootMargin too large, multiple elements intersecting

```typescript
// ❌ WRONG - Too large, multiple elements in viewport
rootMargin: '-10% 0px -10% 0px';

// ✅ CORRECT - More restrictive
rootMargin: '-20% 0px -80% 0px';
```

### Issue: Scroll Spy Not Updating

**Symptom**: Active heading stays the same
**Cause**: Observing wrong element or element doesn't exist

```typescript
// ❌ WRONG - Element might not exist yet
headingIds.forEach((id) => {
  observerRef.current.observe(document.getElementById(id)); // Might be null!
});

// ✅ CORRECT - Check if element exists
headingIds.forEach((id) => {
  const element = document.getElementById(id);
  if (element && observerRef.current) {
    observerRef.current.observe(element);
  }
});
```

### Issue: Observer Options Not Updating

**Symptom**: Changing options prop doesn't update behavior
**Cause**: Options not included in useEffect dependencies

```typescript
// ❌ WRONG - Options not in deps
useEffect(() => {
  const observer = new IntersectionObserver(callback, options);
  // ...
}, [headingIds]); // Missing options!

// ✅ CORRECT - Include options
useEffect(() => {
  const observer = new IntersectionObserver(callback, options);
  // ...
}, [headingIds, options.rootMargin, options.threshold]);
```

## Testing Strategy

### Unit Testing the Hook

```typescript
import { renderHook } from '@testing-library/react';
import { useScrollSpy } from './useScrollSpy';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

global.IntersectionObserver = MockIntersectionObserver as any;

describe('useScrollSpy', () => {
  beforeEach(() => {
    // Create mock DOM elements
    document.body.innerHTML = `
      <div id="section-1">Section 1</div>
      <div id="section-2">Section 2</div>
      <div id="section-3">Section 3</div>
    `;
  });

  it('initializes with null activeId', () => {
    const { result } = renderHook(() => useScrollSpy(['section-1', 'section-2']));
    expect(result.current).toBeNull();
  });

  it('observes all provided heading IDs', () => {
    const { result } = renderHook(() => useScrollSpy(['section-1', 'section-2']));

    const observer = (IntersectionObserver as any).mock.instances[0];
    expect(observer.observe).toHaveBeenCalledTimes(2);
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = renderHook(() => useScrollSpy(['section-1']));

    const observer = (IntersectionObserver as any).mock.instances[0];
    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
import { render, screen } from '@testing-library/react';
import { TableOfContents } from './TableOfContents';

describe('TableOfContents with useScrollSpy', () => {
  const tocItems = [
    { id: 'intro', text: 'Introduction', level: 1 },
    { id: 'getting-started', text: 'Getting Started', level: 2 },
    { id: 'conclusion', text: 'Conclusion', level: 1 },
  ];

  it('renders all TOC items', () => {
    render(<TableOfContents tocItems={tocItems} />);

    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Conclusion')).toBeInTheDocument();
  });

  it('highlights active section', async () => {
    render(<TableOfContents tocItems={tocItems} />);

    // Simulate intersection
    const observer = (IntersectionObserver as any).mock.instances[0];
    const callback = (IntersectionObserver as any).mock.calls[0][0];

    callback([{ isIntersecting: true, target: { id: 'intro' } }]);

    // Check if intro is highlighted
    await waitFor(() => {
      const introLink = screen.getByText('Introduction');
      expect(introLink).toHaveClass('text-coral');
    });
  });
});
```

## Performance Considerations

### IntersectionObserver vs Scroll Events

**Scroll Event Listener (OLD WAY):**

```typescript
// ❌ BAD - Runs on main thread, expensive
useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= 200) {
          setActiveId(id);
        }
      }
    });
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Problems:
// - Runs on every scroll event (hundreds per second)
// - Queries DOM on every scroll (expensive)
// - Blocks main thread (janky animations)
// - Drains battery on mobile
```

**IntersectionObserver (NEW WAY):**

```typescript
// ✅ GOOD - Browser-optimized, efficient
useEffect(() => {
  const observer = new IntersectionObserver(callback, options);
  headingIds.forEach((id) => observer.observe(document.getElementById(id)));

  return () => observer.disconnect();
}, []);

// Benefits:
// - Browser handles optimization (separate thread)
// - Only runs when elements intersect
// - No main thread blocking
// - Battery-efficient
// - 10x less code!
```

### Battery Impact Comparison

- **Scroll events**: ~5-15% battery drain per hour (mobile)
- **IntersectionObserver**: ~0.5-1% battery drain per hour (mobile)
- **Savings**: 10-30x more efficient on mobile devices

### When Performance Matters

- Mobile devices (battery life critical)
- Long pages with many headings (100+ sections)
- Pages with other scroll-triggered effects
- Low-end devices (weak CPUs)

## Related Documentation

- [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md](../../COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md) - Full implementation
- [React Hooks Best Practices](https://react.dev/reference/react)

## Examples from Codebase

- **[useScrollSpy.ts](../../apps/web/hooks/useScrollSpy.ts)** - Complete hook implementation
  - Lines 1-50: Full hook with IntersectionObserver setup

- **[TableOfContents.tsx](../../apps/web/components/wiki/TableOfContents.tsx)** - Hook usage
  - Lines 12-68: TOC component using useScrollSpy hook

- **[apps/web/app/wiki/[slug]/page.tsx](../../apps/web/app/wiki/[slug]/page.tsx)** - Server-side heading extraction
  - Lines 23-43: extractHeadings function for markdown parsing

## Notes

- **Why IntersectionObserver?** - Browser-optimized, runs in separate thread, battery-efficient, minimal code.
- **Browser Support** - All modern browsers (96%+ global support as of 2024).
- **Fallback** - For old browsers, use scroll events as fallback (feature detection).
- **Debugging** - Use browser DevTools Performance tab to see difference vs scroll events.

---

**Last Updated**: 2025-10-28
**Created From**: useScrollSpy.ts implementation (Phase 3 Days 5-6)
**Pattern Origin**: React Expert recommendation for battery-efficient scroll spy
