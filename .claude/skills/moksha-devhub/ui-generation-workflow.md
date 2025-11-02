---
name: moksha-ui-generation-workflow
description: 4-step flow engineering process for generating high-quality, branded UI components. Based on iterative design approach (Layout → Theme → Animation → Implementation). Use when creating new pages, components, or UI features for ProjectPulse.
triggers:
  ['create ui', 'new page', 'design component', 'generate interface', 'build ui', 'design page']
token_estimate: 320
last_updated: 2025-10-27
related_docs:
  - ./ascii-wireframes.md
  - ./animation-patterns.md
  - ./component-patterns.md
  - ../../theme/THEME_GUIDE.md
  - ../../.agent/sops/ui-generation-workflow-detailed.md
---

# 4-Step UI Generation Workflow

**Flow Engineering Approach**: Generate UI through iterative steps, not one-shot prompts.

---

## The 4-Step Process

### Step 1: Layout (ASCII Wireframes)

**Generate layout BEFORE code** using hybrid ASCII format (boxes + emojis)

**Benefits**:

- ⚡ Super fast: ~1 second per iteration (vs 10-20s for full HTML)
- 💰 Super cheap: ~100 tokens (vs 2000-3000 for full React)
- 🎯 Early alignment: Catch layout issues before implementing
- 🔄 Rapid iteration: Back-and-forth in seconds

**Process**:

1. Generate ASCII wireframe using templates from [ascii-wireframes.md](./ascii-wireframes.md)
2. User reviews and provides feedback
3. Iterate quickly until layout is approved
4. Move to Step 2

**Example**:

```
┌─────────────────────────────────────┐
│ 🤖 Agent Personas        [➕ New]   │
├─────────────────────────────────────┤
│ [🔍 Search...]  [Filter ▼]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏗️  DevHub Architect            │ │
│ │    System design & architecture  │ │
│ │    ● Active • 156 tasks          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💻 DevHub Fullstack             │ │
│ │    React + API implementation    │ │
│ │    ● Active • 89 tasks           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Token Cost**: 100 tokens per iteration

---

### Step 2: Theme (Dark Neumorphic Coral)

**Apply our established theme** to approved layout

**Our Theme Elements**:

- `neu-raised` - Neumorphic raised cards (main containers)
- `neu-pressed` - Neumorphic inset elements (inputs, inner containers)
- `coral-gradient` - Coral gradient for primary actions/active states
- Slate colors for secondary text/elements
- Smooth transitions on all interactive elements

**Quick Reference**:

```css
/* Base Colors */
--dark: #1a1a1a /* Primary background */ --dark-card: #2a2a2a /* Card background */ --coral: #ff8b6a
  /* Primary accent */ --slate: #8b8b8b /* Secondary text */ /* Neumorphic Effects */ .neu-raised
  /* Raised cards, buttons, navigation */ .neu-pressed /* Input fields, inner containers */
  /* Primary Actions */ .coral-gradient /* CTA buttons, active states */;
```

**Full Theme Guide**: [theme/THEME_GUIDE.md](../../theme/THEME_GUIDE.md)

**Token Cost**: One-time reference load (~500 tokens)

---

### Step 3: Animation (Keyframe Definition)

**Define animations in text format** before implementing

**Simple Format**:

```
Element: Issue cards
Keyframes:
  - Start: translateY(0), shadow-sm
  - End: translateY(-4px), shadow-lg
Trigger: hover
Duration: 200ms
```

**Standard Patterns** (from [animation-patterns.md](./animation-patterns.md)):

- `smooth-transition` - All interactive elements (200ms)
- `hover-lift` - Cards lift on hover
- `pulse-glow` - Active state indicators
- `heartbeat` - Logo animation

**Benefits**:

- ✨ Good → Great: Micro-interactions elevate quality
- 📝 Simple: Text description, not complex code
- 🎯 Focused: AI knows to implement animations

**Token Cost**: ~200 tokens

---

### Step 4: Implementation (React Components)

**Build the actual component** following established patterns

**Default Pattern**: Server Component

```typescript
// app/agents/page.tsx - Server Component
import { prisma } from '@/lib/db';
import { AgentList } from '@/components/agents/AgentList';

export default async function AgentsPage() {
  const agents = await prisma.agentPersona.findMany();

  return (
    <main className="container mx-auto p-6">
      <AgentList initialAgents={agents} />
    </main>
  );
}
```

**Client Component** (when needed):

```typescript
'use client';
import { useState } from 'react';

export function AgentList({ initialAgents }) {
  const [filter, setFilter] = useState('all');
  // Interactive functionality
}
```

**Follow**:

- [component-patterns.md](./component-patterns.md) - Server vs Client decisions
- TypeScript strict typing (zero `any`)
- Tailwind utility classes
- shadcn/ui components

**Token Cost**: ~2000 tokens (focused, no guessing)

---

## The Scaling Power

**Once you nail ONE component** → Scale to all others

Example: Agent Card (perfect) → Agent List → Agent Detail → Agent Settings

- All share same theme (coral accent, neumorphic style)
- All share same animations (hover-lift, pulse-glow)
- All share same spacing (gap-6 sections, p-6 cards)
- All share same patterns (Server/Client split)

**Result**: Consistent quality across entire application

---

## Token Savings

**Old Approach** (one-shot generation + iterations):

1. Read component patterns: 280 tokens
2. Read theme guide: 3000 tokens
3. Generate full component: 3000 tokens
4. Iterate on layout: 3000 tokens
5. Iterate on styling: 3000 tokens
   **Total**: 12,000+ tokens

**New 4-Step Approach**:

1. ASCII wireframe (3 iterations): 300 tokens
2. Apply theme (reference): 500 tokens
3. Define animations: 200 tokens
4. Implement component: 2000 tokens
   **Total**: 3,000 tokens (75% savings!)

**Even better for changes**:

- Layout tweaks: 100 tokens (not 3000)
- Animation changes: 200 tokens (not 3000)
- Re-styling: Just regenerate with theme

---

## When to Use

**Auto-loaded when phase contains**:

- "UI", "page", "component", "design"
- "interface", "create ui", "build page"

**Manual invocation** for:

- Designing new pages from scratch
- Creating reusable components
- Refactoring existing UI
- Establishing design patterns

---

## Integration with ProjectPulse

**We already have**:
✅ Dark Neumorphic Coral theme (complete CSS)
✅ Component patterns (Server/Client conventions)
✅ shadcn/ui components
✅ Mockup references for visual targets

**This workflow adds**:
➕ ASCII wireframe step (fast layout iteration)
➕ Animation definition step (better interactions)
➕ Scaling pattern (consistent quality)
➕ Token optimization (75% savings)

---

## Related Documentation

**Quick Reference**:

- [ascii-wireframes.md](./ascii-wireframes.md) - Wireframe templates
- [animation-patterns.md](./animation-patterns.md) - Animation definitions
- [component-patterns.md](./component-patterns.md) - React conventions

**Detailed Guides**:

- [.agent/sops/ui-generation-workflow-detailed.md](../../.agent/sops/ui-generation-workflow-detailed.md) - Deep dive with examples
- [theme/THEME_GUIDE.md](../../theme/THEME_GUIDE.md) - Complete theme reference

---

**Token Cost**: ~320 tokens
**Coverage**: 90% of UI generation scenarios
**When to Read Full Docs**: Complex layouts, advanced animations, edge cases
