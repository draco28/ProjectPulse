# Sprint 15: UX Polish - Keyboard & AI

**Duration**: 2 weeks
**Focus**: Power user experience
**Status**: Planned

---

## Overview

Sprint 15 adds the UX polish that makes Linear feel magical:
1. **Command Palette** - Cmd+K for universal action access
2. **Keyboard Shortcuts** - Navigate and act without mouse
3. **Triage Intelligence** - AI-powered suggestions

---

## Feature 1: Command Palette (Cmd+K)

**Estimated Effort**: 3 days
**Linear Equivalent**: Command Palette with fuzzy search

### Requirements

1. Global access via Cmd+K (Mac) / Ctrl+K (Windows)
2. Actions: Create, Search, Navigate, Quick assign
3. Recent items at top
4. Fuzzy search matching
5. Context-aware commands per page

### Implementation

Use `cmdk` library (same as Linear, VS Code, Raycast):

```bash
pnpm add cmdk
```

```typescript
// apps/web/components/CommandPalette.tsx
'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Type a command or search..." />

      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        {/* Recent Items */}
        <Command.Group heading="Recent">
          <Command.Item onSelect={() => router.push('/tickets/123')}>
            PROJ-123: Fix auth bug
          </Command.Item>
        </Command.Group>

        {/* Actions */}
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => {
            setOpen(false);
            // Open create ticket modal
          }}>
            <PlusIcon className="mr-2" />
            Create new ticket
            <kbd className="ml-auto">C</kbd>
          </Command.Item>

          <Command.Item onSelect={() => router.push('/tickets')}>
            <ListIcon className="mr-2" />
            Go to tickets
            <kbd className="ml-auto">G T</kbd>
          </Command.Item>

          <Command.Item onSelect={() => router.push('/roadmap')}>
            <MapIcon className="mr-2" />
            Go to roadmap
            <kbd className="ml-auto">G R</kbd>
          </Command.Item>
        </Command.Group>

        {/* Search Results */}
        <Command.Group heading="Tickets">
          {/* Dynamic search results */}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

### Styling

```css
/* apps/web/styles/command-palette.css */
[cmdk-dialog] {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 640px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-color);
  z-index: 50;
}

[cmdk-input] {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border: none;
  border-bottom: 1px solid var(--border-color);
  background: transparent;
  outline: none;
}

[cmdk-item] {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  margin: 4px 8px;
}

[cmdk-item][data-selected="true"] {
  background: var(--accent-bg);
}

[cmdk-group-heading] {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}
```

### Search Integration

```typescript
// apps/web/hooks/useCommandSearch.ts
export function useCommandSearch(query: string) {
  const debouncedQuery = useDebounce(query, 200);

  return useSWR(
    debouncedQuery ? `/api/search?q=${debouncedQuery}` : null,
    fetcher
  );
}
```

### Files to Create/Modify

- `apps/web/components/CommandPalette.tsx` (new) - Main component
- `apps/web/styles/command-palette.css` (new) - Styling
- `apps/web/hooks/useCommandSearch.ts` (new) - Search hook
- `apps/web/app/layout.tsx` - Mount CommandPalette
- `apps/web/app/api/search/route.ts` (new) - Universal search endpoint
- `package.json` - Add cmdk

---

## Feature 2: Keyboard Shortcuts System

**Estimated Effort**: 3 days
**Linear Equivalent**: 99+ keyboard shortcuts

### Shortcut Map

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Cmd+K` | Open command palette | Global |
| `C` | Create new ticket | Global |
| `?` | Show shortcuts help | Global |
| `G T` | Go to tickets | Global |
| `G R` | Go to roadmap | Global |
| `G D` | Go to dashboard | Global |
| `G W` | Go to wiki | Global |
| `/` | Focus search | Global |
| `Escape` | Close modal/deselect | Global |
| `J` / `K` | Navigate list down/up | List views |
| `Enter` | Open selected item | List views |
| `E` | Edit selected | Ticket view |
| `A` | Assign | Ticket view |
| `L` | Add label | Ticket view |
| `P` | Set priority | Ticket view |
| `S` | Change status | Ticket view |

### Implementation

```typescript
// apps/web/hooks/useKeyboardShortcuts.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  modifiers?: ('meta' | 'ctrl' | 'shift' | 'alt')[];
  handler: ShortcutHandler;
  scope?: string;
}

const shortcuts: Shortcut[] = [
  { key: 'c', handler: () => openCreateTicket(), scope: 'global' },
  { key: 't', handler: () => router.push('/tickets'), scope: 'global', sequence: 'g' },
  { key: 'r', handler: () => router.push('/roadmap'), scope: 'global', sequence: 'g' },
  { key: '?', handler: () => openShortcutsHelp(), scope: 'global' },
  { key: '/', handler: () => focusSearch(), scope: 'global' },
];

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as Element).tagName)) {
        return;
      }

      // Handle sequence shortcuts (g + t, g + r)
      if (pendingKey === 'g') {
        if (e.key === 't') {
          e.preventDefault();
          router.push('/tickets');
        } else if (e.key === 'r') {
          e.preventDefault();
          router.push('/roadmap');
        }
        setPendingKey(null);
        return;
      }

      // Start sequence
      if (e.key === 'g') {
        setPendingKey('g');
        setTimeout(() => setPendingKey(null), 1000); // Reset after 1s
        return;
      }

      // Single key shortcuts
      const shortcut = shortcuts.find(s =>
        s.key === e.key &&
        !s.sequence &&
        (!s.modifiers || s.modifiers.every(m => e[`${m}Key`]))
      );

      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pendingKey, router]);
}
```

### Shortcuts Help Modal

```typescript
// apps/web/components/ShortcutsHelpModal.tsx
export function ShortcutsHelpModal({ open, onClose }) {
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['G', 'T'], description: 'Go to tickets' },
      { keys: ['G', 'R'], description: 'Go to roadmap' },
      { keys: ['G', 'D'], description: 'Go to dashboard' },
    ]},
    { category: 'Actions', items: [
      { keys: ['C'], description: 'Create new ticket' },
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['/'], description: 'Focus search' },
    ]},
    { category: 'Ticket View', items: [
      { keys: ['E'], description: 'Edit ticket' },
      { keys: ['A'], description: 'Assign' },
      { keys: ['S'], description: 'Change status' },
    ]},
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8">
          {shortcuts.map(category => (
            <div key={category.category}>
              <h3 className="font-semibold mb-2">{category.category}</h3>
              {category.items.map(item => (
                <div key={item.description} className="flex justify-between py-1">
                  <span className="text-muted">{item.description}</span>
                  <div className="flex gap-1">
                    {item.keys.map(key => (
                      <kbd key={key} className="px-2 py-1 bg-muted rounded text-xs">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Shortcut Hints in UI

```typescript
// apps/web/components/ui/Button.tsx
export function Button({ shortcut, children, ...props }) {
  return (
    <button {...props}>
      {children}
      {shortcut && (
        <kbd className="ml-2 text-xs opacity-50">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

// Usage
<Button shortcut="C" onClick={openCreateTicket}>
  Create Ticket
</Button>
```

### Files to Create/Modify

- `apps/web/hooks/useKeyboardShortcuts.ts` (new) - Global handler
- `apps/web/components/ShortcutsHelpModal.tsx` (new) - Help dialog
- `apps/web/components/ui/Button.tsx` - Add shortcut hints
- `apps/web/components/ui/Tooltip.tsx` - Show shortcuts in tooltips
- `apps/web/contexts/ShortcutsContext.tsx` (new) - Shortcuts state

---

## Feature 3: Triage Intelligence

**Estimated Effort**: 2 days
**Linear Equivalent**: AI-powered triage suggestions

### Requirements

1. During ticket creation, suggest:
   - Assignee based on ticket content
   - Labels based on keywords
   - Priority based on urgency indicators

2. Show suggestions as chips user can accept/dismiss

### Implementation

```typescript
// apps/web/app/api/tickets/triage/route.ts
import { openai } from '@/lib/openai';

export async function POST(request: Request) {
  const { title, description, projectId } = await request.json();

  // Get project context
  const [recentTickets, teamMembers, labels] = await Promise.all([
    prisma.ticket.findMany({
      where: { projectId },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { assignee: true, labels: true }
    }),
    prisma.user.findMany({ where: { projects: { some: { id: projectId } } } }),
    prisma.label.findMany({ where: { projectId } })
  ]);

  // Simple keyword-based suggestions (no LLM needed)
  const suggestions = {
    assignee: suggestAssignee(title, description, recentTickets, teamMembers),
    labels: suggestLabels(title, description, labels),
    priority: suggestPriority(title, description)
  };

  return NextResponse.json(suggestions);
}

function suggestAssignee(title: string, description: string, recentTickets: Ticket[], members: User[]) {
  const text = `${title} ${description}`.toLowerCase();

  // Find member who handled similar tickets
  const assigneeCounts: Record<number, number> = {};

  for (const ticket of recentTickets) {
    if (!ticket.assigneeId) continue;

    const ticketText = `${ticket.title} ${ticket.description}`.toLowerCase();
    const similarity = calculateJaccard(text.split(' '), ticketText.split(' '));

    if (similarity > 0.2) {
      assigneeCounts[ticket.assigneeId] = (assigneeCounts[ticket.assigneeId] || 0) + similarity;
    }
  }

  const topAssignee = Object.entries(assigneeCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (topAssignee) {
    return members.find(m => m.id === parseInt(topAssignee[0]));
  }

  return null;
}

function suggestLabels(title: string, description: string, labels: Label[]) {
  const text = `${title} ${description}`.toLowerCase();

  return labels.filter(label => {
    const labelWords = label.name.toLowerCase().split(/[\s-_]+/);
    return labelWords.some(word => text.includes(word));
  }).slice(0, 3);
}

function suggestPriority(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();

  const urgentKeywords = ['urgent', 'critical', 'asap', 'emergency', 'broken', 'down'];
  const highKeywords = ['important', 'blocker', 'blocking', 'security', 'bug'];

  if (urgentKeywords.some(k => text.includes(k))) return 'critical';
  if (highKeywords.some(k => text.includes(k))) return 'high';

  return null;
}
```

### UI Component

```typescript
// apps/web/components/tickets/TriageSuggestions.tsx
export function TriageSuggestions({ title, description, onAccept }) {
  const { data: suggestions, isLoading } = useSWR(
    title.length > 10 ? `/api/tickets/triage?title=${title}&description=${description}` : null,
    fetcher,
    { dedupingInterval: 2000 }
  );

  if (isLoading || !suggestions) return null;

  return (
    <div className="bg-blue-50 p-3 rounded-lg mb-4">
      <p className="text-sm font-medium text-blue-700 mb-2">
        ✨ AI Suggestions
      </p>

      <div className="flex flex-wrap gap-2">
        {suggestions.assignee && (
          <button
            onClick={() => onAccept('assignee', suggestions.assignee.id)}
            className="suggestion-chip"
          >
            <Avatar src={suggestions.assignee.avatar} size="xs" />
            Assign to {suggestions.assignee.name}
            <XIcon className="ml-1 w-3 h-3" />
          </button>
        )}

        {suggestions.labels?.map(label => (
          <button
            key={label.id}
            onClick={() => onAccept('label', label.id)}
            className="suggestion-chip"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: label.color }} />
            {label.name}
            <XIcon className="ml-1 w-3 h-3" />
          </button>
        ))}

        {suggestions.priority && (
          <button
            onClick={() => onAccept('priority', suggestions.priority)}
            className="suggestion-chip"
          >
            Set {suggestions.priority} priority
            <XIcon className="ml-1 w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
```

### Files to Create/Modify

- `apps/web/app/api/tickets/triage/route.ts` (new) - Suggestion API
- `apps/web/components/tickets/TriageSuggestions.tsx` (new) - UI component
- `apps/web/components/tickets/CreateTicketForm.tsx` - Integrate suggestions

---

## Success Criteria

- [ ] Command palette (Cmd+K) accessible from any page
- [ ] Fuzzy search working in command palette
- [ ] Recent items showing in palette
- [ ] 10+ keyboard shortcuts implemented
- [ ] Sequence shortcuts working (G+T, G+R)
- [ ] Shortcuts help modal with `?`
- [ ] Shortcut hints visible in UI
- [ ] Triage suggestions showing during ticket creation
- [ ] Accept/dismiss flow for suggestions

---

## Dependencies

- Sprint 12-14 complete (features to navigate to)
- cmdk library
- Existing ticket creation flow

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Shortcut conflicts with browser | Use single keys, avoid browser defaults |
| Triage suggestions inaccurate | Start simple (keyword matching), add ML later |
| Command palette performance | Debounce search, limit results |
