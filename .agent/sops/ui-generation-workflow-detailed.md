# UI Generation Workflow - Detailed Guide

**Purpose**: Comprehensive guide to the 4-step UI generation workflow based on flow engineering principles

**Last Updated**: October 27, 2025

**Related Files**:

- [.claude/skills/projectpulse/ui-generation-workflow.md](../../.claude/skills/projectpulse/ui-generation-workflow.md) - Compact skill file
- [.claude/skills/projectpulse/ascii-wireframes.md](../../.claude/skills/projectpulse/ascii-wireframes.md) - Wireframe library
- [.claude/skills/projectpulse/animation-patterns.md](../../.claude/skills/projectpulse/animation-patterns.md) - Animation patterns

---

## Table of Contents

1. [The Problem: Generic AI-Generated UI](#the-problem)
2. [The Solution: Flow Engineering](#the-solution)
3. [The 4-Step Process (Detailed)](#the-4-step-process)
4. [Token Savings Analysis](#token-savings-analysis)
5. [Scaling Pattern](#scaling-pattern)
6. [Best Practices](#best-practices)
7. [Anti-Patterns](#anti-patterns)
8. [Troubleshooting](#troubleshooting)
9. [Integration with ProjectPulse](#integration-with-projectpulse)
10. [Real Examples](#real-examples)

---

## The Problem

### Generic AI-Generated UI

**What happens with one-shot prompts**:

```
User: "Create an Agent Personas page"

Claude: [Generates full React component in one shot]
```

**Results**:

- ❌ Generic layout that doesn't match mockup
- ❌ Wrong spacing, colors, styling
- ❌ Missing animations and interactions
- ❌ Doesn't follow established patterns
- ❌ Requires multiple iterations (expensive)
- ❌ Each iteration is 3000+ tokens
- ❌ Final result still feels "AI-generated"

**Total Cost**: 9,000-15,000 tokens for mediocre result

---

## The Solution

### Flow Engineering (Not Prompt Engineering)

**Concept**: Distill expert design knowledge into an **iterative flow** where each step builds on the previous one.

**Inspiration**: Andrew Ng's concept from 1.5 years ago - instead of trying to craft the perfect prompt, create a flow that constructs output iteratively.

### How a Senior Designer Actually Works

1. **Layout First**: Figure out information hierarchy and user journey
2. **Then Style**: Choose colors, fonts, spacing to match brand
3. **Then Animation**: Add micro-interactions for polish
4. **Finally Implement**: Build it with code

**This workflow mirrors that process**.

---

## The 4-Step Process (Detailed)

### Step 1: Layout (ASCII Wireframes)

#### Why ASCII First?

**Speed**:

- ASCII generation: ~1 second
- Full HTML: ~10-20 seconds
- Full React: ~20-30 seconds

**Token Cost**:

- ASCII: ~100 tokens
- HTML: ~2000-3000 tokens
- React: ~3000-4000 tokens

**Clarity**:

- ASCII forces focus on STRUCTURE
- No distractions from styling
- Clear information hierarchy
- Easy to communicate changes

#### The Process

**Step 1.1**: User requests new page/component

```
User: "Create an Agent Personas management page"
```

**Step 1.2**: Claude generates ASCII wireframe

```
Claude: "Let me start with an ASCII wireframe to align on layout..."

┌─────────────────────────────────────────────────────────┐
│ 🤖 Agent Personas                           [➕ New]    │
├─────────────────────────────────────────────────────────┤
│ [🔍 Search agents...]  [Filter ▼]  [Sort ▼]            │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏗️  DevHub Architect                     [⋯]        │ │
│ │    System design & architecture                     │ │
│ │    ● Active • 156 tasks • 2.3k tokens/min          │ │
│ │    [View Details]                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💻 DevHub Fullstack                      [⋯]        │ │
│ │    React + API implementation                       │ │
│ │    ● Active • 89 tasks • 1.8k tokens/min           │ │
│ │    [View Details]                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Load More]                                             │
└─────────────────────────────────────────────────────────┘

Does this layout match your vision?
```

**Step 1.3**: User provides feedback

```
User: "Good, but add a sidebar with categories: Development, Testing, Documentation"
```

**Step 1.4**: Claude iterates (in ~1 second!)

```
┌──────────────┬──────────────────────────────────────────┐
│              │ 🤖 Agent Personas        [➕ New]        │
│ Categories   ├──────────────────────────────────────────┤
│              │ [🔍 Search...]  [Filter ▼]               │
│ ➤ All (6)    │                                          │
│   Dev (3)    │ ┌────────────────────────────────────┐   │
│   Test (2)   │ │ 🏗️  DevHub Architect              │   │
│   Docs (1)   │ │    System design & architecture    │   │
│              │ │    ● Active • 156 tasks            │   │
│              │ └────────────────────────────────────┘   │
│              │ ┌────────────────────────────────────┐   │
│              │ │ 💻 DevHub Fullstack               │   │
│              │ │    React + API implementation      │   │
│              │ └────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────┘
```

**Step 1.5**: Repeat until approved

- Each iteration: ~100 tokens, ~1 second
- Typical: 2-3 iterations = 300 tokens total
- **Layout is locked in before any code is written**

#### Benefits Realized

✅ **Fast iteration**: Seconds, not minutes
✅ **Clear communication**: No ambiguity about structure
✅ **Early alignment**: Catch issues before implementation
✅ **Token efficient**: 300 tokens vs 9000+ tokens with full code iterations
✅ **Focused feedback**: Structure only, no distraction from styling

---

### Step 2: Theme (Dark Neumorphic Coral)

#### Applying Our Established Theme

Once layout is approved, apply our complete theme system.

#### The Process

**Step 2.1**: Reference theme stylesheet

Claude loads our Dark Neumorphic Coral theme:

```css
/* Core Colors */
--dark:
  #1a1a1a --dark-card: #2a2a2a --coral: #ff8b6a --slate: #8b8b8b /* Neumorphic Effects */
    .neu-raised {box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.4),
  -4px -4px 8px rgba(255, 255, 255, 0.02) ;} .neu-pressed {box-shadow: inset 4px 4px 8px
    rgba(0, 0, 0, 0.5),
  inset -2px -2px 4px rgba(255, 255, 255, 0.02) ;} /* Primary Actions */ .coral-gradient
    {background: linear-gradient(135deg, #ff8b6a 0%, #e67759 100%) ;};
```

**Step 2.2**: Map components to theme classes

```
Claude: "Applying Dark Neumorphic Coral theme:

Layout → Theme Mapping:
- Page container: .neu-raised with rounded-3xl
- Header section: .neu-raised with coral-gradient for active states
- Search input: .neu-pressed for inset effect
- Agent cards: .neu-raised with hover-lift
- Primary button (New): .coral-gradient with shadow-lg
- Category sidebar: .neu-raised navigation items
- Active category: .coral-gradient
- Text colors: white for headers, slate for descriptions
- Icons: coral for primary, slate for secondary
```

**Step 2.3**: Confirm visual direction

User can preview or approve based on description. Since theme is established, this step is usually quick.

#### Benefits Realized

✅ **Instant branding**: No generic AI look
✅ **Consistent**: Matches all other pages
✅ **One-time cost**: Theme reference loaded once per session
✅ **Professional**: Neumorphic effects, proper colors, spacing

---

### Step 3: Animation (Keyframe Definition)

#### Defining Micro-Interactions

Animations make UI go from "good" to "great" with minimal additional effort.

#### The Process

**Step 3.1**: Identify interactive elements

```
Claude: "Let me define animations for key interactions:

Interactive Elements:
1. Agent cards (hover)
2. Primary button (New)
3. Active category indicator
4. Active agent status dot
5. Card menu button (hover)
```

**Step 3.2**: Define keyframes in simple text

```
Animation Plan:

1. Agent Card Hover
   Element: .neu-raised agent cards
   Keyframes:
     - Start: translateY(0), shadow-neu-float
     - End: translateY(-4px), shadow-neu-float-elevated
   Trigger: hover
   Duration: 200ms
   Easing: ease-out

2. New Button
   Element: [+ New] button
   Keyframes:
     - Hover: scale(1.02), shadow-coral-glow
     - Active: scale(0.98)
   Trigger: hover, active
   Duration: 150ms

3. Active Status Dot
   Element: ● indicator
   Keyframes:
     - 0%: opacity(0.5), scale(1)
     - 50%: opacity(1), scale(1.2)
     - 100%: opacity(0.5), scale(1)
   Trigger: auto (continuous)
   Duration: 2000ms
   Class: pulse-glow

4. Category Item Hover
   Element: Sidebar navigation items
   Keyframes:
     - Start: background(transparent)
     - End: background(coral-gradient)
   Trigger: hover
   Duration: 200ms
```

**Step 3.3**: User approves or requests changes

```
User: "Perfect! Also add a subtle fade-in when cards load"

Claude: "Added:

5. Card Entrance
   Element: Agent cards on mount
   Keyframes:
     - 0%: opacity(0), translateY(20px)
     - 100%: opacity(1), translateY(0)
   Trigger: mount
   Duration: 300ms
   Easing: ease-out
   Stagger: 50ms per card
```

#### Benefits Realized

✅ **Clear specification**: No guessing during implementation
✅ **Professional polish**: Micro-interactions elevate quality
✅ **Simple format**: Text description, easy to understand
✅ **Reusable**: Same patterns across all pages

---

### Step 4: Implementation (React Components)

#### Building the Actual Component

With layout, theme, and animations defined, implementation is straightforward.

#### The Process

**Step 4.1**: Generate Server Component (data fetching)

```typescript
// app/agents/page.tsx
import { prisma } from '@/lib/db';
import { AgentList } from '@/components/agents/AgentList';

export default async function AgentsPage() {
  // Fetch data server-side
  const agents = await prisma.agentPersona.findMany({
    include: {
      tasks: {
        where: { status: 'active' },
        select: { id: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Calculate metrics
  const agentsWithMetrics = agents.map(agent => ({
    ...agent,
    activeTaskCount: agent.tasks.length,
    tokensPerMin: calculateTokenRate(agent) // Helper function
  }));

  return (
    <main className="container mx-auto p-6">
      <AgentList initialAgents={agentsWithMetrics} />
    </main>
  );
}
```

**Step 4.2**: Generate Client Component (interactivity)

```typescript
// components/agents/AgentList.tsx
"use client";

import { useState } from 'react';
import { AgentCard } from './AgentCard';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  activeTaskCount: number;
  tokensPerMin: number;
}

interface Props {
  initialAgents: Agent[];
}

export function AgentList({ initialAgents }: Props) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filteredAgents = initialAgents
    .filter(a => category === 'all' || a.category === category)
    .filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="flex gap-6">
      {/* Sidebar - Categories */}
      <aside className="w-64">
        <div className="neu-raised rounded-3xl p-6">
          <h3 className="text-white font-bold mb-4">Categories</h3>
          <nav className="space-y-2">
            {['all', 'development', 'testing', 'documentation'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'w-full px-4 py-3 rounded-2xl smooth-transition text-left',
                  category === cat
                    ? 'coral-gradient text-white'
                    : 'text-slate hover:text-white hover:bg-darkCard'
                )}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="neu-raised rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🤖 Agent Personas
            </h1>
            <button className="coral-gradient px-6 py-3 rounded-2xl font-semibold text-white smooth-transition shadow-lg hover:shadow-coral-glow">
              <i className="fas fa-plus mr-2"></i>
              New Agent
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate"></i>
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full neu-pressed rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none smooth-transition"
            />
          </div>
        </div>

        {/* Agent Cards */}
        <div className="space-y-4">
          {filteredAgents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 4.3**: Generate Card Component (reusable)

```typescript
// components/agents/AgentCard.tsx
"use client";

interface Props {
  agent: Agent;
  index: number;
}

export function AgentCard({ agent, index }: Props) {
  return (
    <div
      className="neu-raised rounded-3xl p-6 smooth-transition hover:transform hover:-translate-y-1 opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl icon-coral flex items-center justify-center shadow-lg mr-4">
          <i className="fas fa-robot text-white text-xl"></i>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">
            {agent.name}
          </h3>
          <p className="text-slate text-sm mb-4">
            {agent.description}
          </p>

          {/* Metrics */}
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full pulse-glow"></span>
              Active
            </span>
            <span className="text-slate">
              <i className="fas fa-tasks mr-2"></i>
              {agent.activeTaskCount} tasks
            </span>
            <span className="text-slate">
              <i className="fas fa-bolt mr-2"></i>
              {agent.tokensPerMin.toFixed(1)}k/min
            </span>
          </div>
        </div>

        {/* Menu Button */}
        <button className="text-slate hover:text-coral smooth-transition">
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>
    </div>
  );
}
```

#### Benefits Realized

✅ **Focused implementation**: No guessing about layout or style
✅ **Follows patterns**: Server/Client split, TypeScript, Tailwind
✅ **Animations included**: All defined animations implemented
✅ **Reusable components**: Card can be used elsewhere
✅ **Token efficient**: ~2000 tokens (vs 5000+ with trial and error)

---

## Token Savings Analysis

### Old Approach (One-Shot + Iterations)

```
Step 1: Initial Request
User: "Create Agent Personas page"
Claude: [Reads component-patterns (280 tokens)]
Claude: [Reads theme guide (3000 tokens)]
Claude: [Generates full component (3000 tokens)]
Result: Wrong layout, needs changes
Total: 6,280 tokens

Step 2: First Iteration
User: "Add a sidebar with categories"
Claude: [Regenerates component (3000 tokens)]
Result: Better, but styling is off
Total: 3,000 tokens

Step 3: Second Iteration
User: "Use neumorphic cards and coral gradient"
Claude: [Regenerates with styling (3000 tokens)]
Result: Good, but missing animations
Total: 3,000 tokens

Step 4: Third Iteration
User: "Add hover effects and loading animations"
Claude: [Regenerates with animations (3000 tokens)]
Result: Finally good!
Total: 3,000 tokens

GRAND TOTAL: 15,280 tokens
TIME: ~10-15 minutes
```

### New Approach (4-Step Workflow)

```
Step 1: Layout (ASCII)
User: "Create Agent Personas page"
Claude: [Generates ASCII wireframe (100 tokens)]
User: "Add sidebar with categories"
Claude: [Regenerates ASCII (100 tokens)]
User: "Perfect!"
Total: 200 tokens

Step 2: Theme
Claude: [References theme (500 tokens, cached)]
Claude: [Maps layout to theme classes (200 tokens)]
Total: 700 tokens

Step 3: Animation
Claude: [Defines animations (200 tokens)]
User: "Add fade-in on load"
Claude: [Adds animation (50 tokens)]
Total: 250 tokens

Step 4: Implementation
Claude: [Reads component-patterns (280 tokens)]
Claude: [Generates Server Component (800 tokens)]
Claude: [Generates Client Component (1000 tokens)]
Claude: [Generates Card Component (500 tokens)]
Total: 2,580 tokens

GRAND TOTAL: 3,730 tokens
TIME: ~5-7 minutes
SAVINGS: 11,550 tokens (75.6% reduction!)
TIME SAVINGS: 50%+
```

### Per-Component Savings

If you create 10 pages/components:

**Old approach**: 15,280 × 10 = **152,800 tokens**
**New approach**: 3,730 × 10 = **37,300 tokens**

**Total savings**: **115,500 tokens** (over 1 million characters!)

---

## Scaling Pattern

### One Perfect Component → Many Consistent Components

Once you nail ONE component with perfect theme, animations, and patterns, you can scale to all others.

#### Example: Agent Card → Task Card → Knowledge Card

**Step 1**: Perfect the Agent Card

```typescript
// Agent Card (perfect reference)
<div className="neu-raised rounded-3xl p-6 smooth-transition hover:-translate-y-1">
  <div className="flex items-start justify-between">
    <div className="w-12 h-12 rounded-2xl icon-coral">
      <i className="fas fa-robot text-white"></i>
    </div>
    <div className="flex-1">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-slate text-sm">{description}</p>
      <div className="flex gap-6 text-sm text-slate">
        {metrics}
      </div>
    </div>
  </div>
</div>
```

**Step 2**: Scale to Task Card

```
User: "Create a Task Card component using the same style as Agent Card"

Claude: "I'll use the Agent Card as reference and maintain:
- neu-raised with rounded-3xl
- Same hover effect (hover:-translate-y-1)
- Same icon container style (icon-coral)
- Same typography (text-xl for title, text-sm for description)
- Same color scheme (white for headers, slate for text)
- Same spacing (p-6, gap-6)"

[Generates Task Card with identical styling patterns]
```

**Result**: Task Card matches Agent Card perfectly without explaining theme again.

**Step 3**: Scale to Knowledge Card

```
User: "Now create a Knowledge Article Card"

Claude: "Maintaining established card pattern..."

[Generates Knowledge Card with same styling, animations, spacing]
```

#### Scaling Beyond Cards

Once patterns are established:

**Navigation** → All nav items use same hover effect
**Buttons** → All primary buttons use coral-gradient
**Inputs** → All inputs use neu-pressed
**Badges** → All badges follow same size/style system
**Icons** → All icons use same sizing and colors

**Result**: Entire application has consistent look and feel.

---

## Best Practices

### 1. Always Start with ASCII

❌ **Don't**:

```
User: "Create the agents page"
Claude: [Generates full component immediately]
```

✅ **Do**:

```
User: "Create the agents page"
Claude: "Let me start with an ASCII wireframe..."
```

### 2. Lock Layout Before Styling

❌ **Don't**: Try to fix layout AND styling simultaneously

✅ **Do**: Get layout 100% right, THEN apply theme

### 3. Define All Animations Upfront

❌ **Don't**: Add animations as afterthought

✅ **Do**: Define animation plan before implementing

### 4. Use Established Patterns

❌ **Don't**: Reinvent card styling for each component

✅ **Do**: Reference existing perfect components

### 5. Separate Server and Client

❌ **Don't**: Make everything Client Components

✅ **Do**: Server for data, Client for interactivity

---

## Anti-Patterns

### ❌ 1. Skipping ASCII Step

**Mistake**: "Just generate the component directly"

**Result**: Wrong layout, expensive iterations

**Fix**: Always do ASCII first, even for "simple" components

### ❌ 2. Inconsistent Theme Application

**Mistake**: "Just use blue here, maybe green there"

**Result**: Looks generic, doesn't match brand

**Fix**: Strictly follow Dark Neumorphic Coral theme

### ❌ 3. No Animation Plan

**Mistake**: "Add some hover effects, whatever looks good"

**Result**: Inconsistent interactions across pages

**Fix**: Define standard animation patterns, reuse them

### ❌ 4. Everything in One Component

**Mistake**: Giant 500-line component with all logic

**Result**: Hard to maintain, can't reuse

**Fix**: Break into smaller, reusable components

### ❌ 5. Client Component by Default

**Mistake**: Add `"use client"` to every component

**Result**: Unnecessary JavaScript to client, slower

**Fix**: Server Component by default, Client only when needed

---

## Troubleshooting

### Issue: ASCII Wireframe Doesn't Render Properly

**Symptoms**: Box characters look broken, emojis don't align

**Cause**: Font doesn't support box-drawing characters

**Solution**: Use monospace font with good Unicode support (JetBrains Mono, Fira Code)

### Issue: Theme Colors Don't Match Mockup

**Symptoms**: Components look right but colors are off

**Cause**: Not using CSS variables from theme

**Solution**: Always reference `theme/theme.css` variables

```css
/* Use these */
background: var(--dark-card);
color: var(--coral);

/* Not these */
background: #2a2a2a; /* Hard-coded */
color: #ff8b6a; /* Hard-coded */
```

### Issue: Animations Not Working

**Symptoms**: Hover effects, transitions don't trigger

**Cause**: Missing `smooth-transition` class or CSS

**Solution**: Add `smooth-transition` to all interactive elements

```tsx
<div className="neu-raised smooth-transition hover:-translate-y-1">
```

### Issue: Components Look Different Across Pages

**Symptoms**: Similar components have different styling

**Cause**: Not following established patterns

**Solution**: Reference first perfect component as template

---

## Integration with ProjectPulse

### How This Workflow Fits Our Project

#### We Already Have:

1. **Dark Neumorphic Coral Theme** (complete CSS system)
   - `theme/theme.css` - All colors, shadows, effects
   - `theme/THEME_GUIDE.md` - Complete documentation
   - Mockups showing target visual style

2. **Component Patterns** (Next.js conventions)
   - `.claude/skills/projectpulse/component-patterns.md`
   - Server/Client Component guidelines
   - TypeScript typing standards

3. **Established Mockups**
   - `mockups/Default theme/` - 7 mockup pages
   - Visual targets for each page type
   - Consistent styling reference

#### This Workflow Adds:

1. **ASCII Step**: Fast layout iteration before implementation
2. **Animation Definitions**: Clear micro-interaction specifications
3. **Scaling Pattern**: One perfect → many consistent
4. **Token Optimization**: 75% savings on UI development

#### Integration Points:

**With Theme System**:

- Step 2 loads `theme/THEME_GUIDE.md`
- Maps ASCII layout to theme classes
- Ensures neumorphic effects, coral accents

**With Component Patterns**:

- Step 4 follows Server/Client conventions
- Uses established TypeScript patterns
- Integrates shadcn/ui components

**With Mockups**:

- ASCII wireframes mirror mockup structures
- Theme application matches mockup styling
- Final implementation matches pixel-perfectly

---

## Real Examples

### Example 1: Issues List Page (Already Built)

**What we did** (before this workflow):

- Multiple iterations on layout
- Style adjustments in code
- Added animations after the fact
- Token cost: ~12,000

**What we would do** (with this workflow):

**Step 1: ASCII**

```
┌─────────┬────────────────────────────────┐
│ Filters │ [🔍] [Sort]  [View]             │
│         │                                │
│ Status  │ ┌──────────────────────────┐   │
│ □ Open  │ │ □ #42 🔴 Critical        │   │
│ □ Done  │ │ Fix collision detection  │   │
│         │ └──────────────────────────┘   │
│ Priority│ ┌──────────────────────────┐   │
│ □ High  │ │ □ #41 🟡 Medium          │   │
└─────────┴────────────────────────────────┘
```

**Step 2: Theme**

- Filter sidebar: neu-raised
- Search bar: neu-pressed
- Issue cards: neu-raised with hover-lift
- Priority badges: colored dots + text

**Step 3: Animation**

- Cards: hover lift (translateY(-4px))
- Checkboxes: subtle scale on click
- Badges: fade-in on filter change

**Step 4: Implementation**

- Server Component for data
- Client Component for filters
- IssueCard reusable component

**Result**: Same quality, ~4,000 tokens instead of 12,000

### Example 2: Dashboard (Next to Build)

**Step 1: ASCII**

```
┌────────────────────────────────────────┐
│ 📊 Dashboard Overview                  │
├────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │ 🤖 4 │ │ 📝23│ │ ✅89%│ │ 📚156│   │
│ │Agent │ │Issue│ │Done │ │ Docs │   │
│ └──────┘ └──────┘ └──────┘ └──────┘   │
│                                        │
│ Recent Activity                        │
│ ┌────────────────────────────────────┐ │
│ │ [Activity list...]                 │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Approved** ✅

**Step 2: Theme**

- Stats cards: neu-raised, 4-column grid
- Icons: icon-coral for primary stats
- Activity feed: neu-raised with subtle dividers

**Step 3: Animation**

- Stats: Count-up animation on load
- Cards: Staggered fade-in (100ms delay each)
- Activity items: Fade-in as they arrive

**Step 4: Implementation**

- Server Component fetches all metrics
- Client Component for count-up animations
- Reuse card patterns from Issues page

**Estimated tokens**: 3,500 (vs ~10,000 without workflow)

---

## Measuring Success

### Before Workflow Implementation

**Metrics from Issues List Page build**:

- Iterations: 4-5 major revisions
- Token usage: ~12,000 tokens
- Time: ~45 minutes
- Style consistency: Manual matching to mockup
- Final quality: Good (after multiple iterations)

### After Workflow Implementation

**Expected metrics** (based on analysis):

- Iterations: 2-3 (mostly in ASCII step)
- Token usage: ~3,500 tokens
- Time: ~20 minutes
- Style consistency: Automatic (theme system)
- Final quality: Excellent (first implementation)

### ROI Calculation

**Per Page**:

- Token savings: 8,500 tokens (71%)
- Time savings: 25 minutes (56%)
- Quality improvement: Consistent, professional

**10 Pages**:

- Token savings: 85,000 tokens
- Time savings: 4.2 hours
- Quality improvement: Entire app looks cohesive

---

## Next Steps

### Immediate Actions

1. **Try on next UI task**: Use this workflow for next page/component
2. **Document results**: Track token usage, time, iterations
3. **Refine as needed**: Adjust workflow based on experience
4. **Build pattern library**: Save perfect components as references

### Long-Term Integration

1. **Standardize ASCII templates**: Create library of common layouts
2. **Expand animation patterns**: Document more interaction patterns
3. **Create component showcase**: Reference page with all perfect components
4. **Auto-generate SOPs**: After each perfect component, document the pattern

---

## Conclusion

The 4-step UI generation workflow transforms how we build UI:

**From**: One-shot guessing → multiple expensive iterations → mediocre result

**To**: ASCII alignment → theme application → animation definition → focused implementation → excellent result

**Benefits**:

- 75% token savings
- 50%+ time savings
- Consistent quality
- Professional polish
- Scalable patterns

**Key Insight**: Flow engineering (iterative steps) beats prompt engineering (one-shot prompts) for complex creative tasks like UI generation.

---

**Ready to use?** Start with [.claude/skills/projectpulse/ui-generation-workflow.md](../../.claude/skills/projectpulse/ui-generation-workflow.md) for quick reference, or use this guide for deep dives.
