# 04 - UI Architecture & Design System

**Version:** 2.0
**Last Updated:** 2025-10-24
**Status:** Ready for Implementation
**Design System:** Multi-Theme System (4 Themes: Desert Stone, Neon Vibes, Earthy, Dark Neumorphic Coral)

---

## 📋 Quick Navigation

- [Design System Reference](#design-system-reference)
- [Theme System](#theme-system) ⭐ **NEW!**
- [Tailwind Configuration](#tailwind-configuration)
- [Component Library Roadmap](#component-library-roadmap)
- [Page Implementation Guide](#page-implementation-guide)
- [Animation Implementation](#animation-implementation)
- [Accessibility Requirements](#accessibility-requirements)

---

## 🎨 Design System Reference

### Primary Documentation
All design specifications, mockups, and visual references are located in the [`mockups/`](../mockups/) folder:

- **[mockups/DESIGN_DIRECTION.md](../mockups/DESIGN_DIRECTION.md)** ⭐⭐⭐
  → 60+ pages of complete design system specification
  → Colors, typography, spacing, components, animations
  → Copy/paste ready CSS and code examples

- **[mockups/MOCKUPS_COMPLETE.md](../mockups/MOCKUPS_COMPLETE.md)** ⭐⭐⭐
  → Detailed feature descriptions for all 7 mockup pages
  → Component requirements per page
  → Visual elements and interactions

- **[mockups/INDEX.md](../mockups/INDEX.md)**
  → Navigation guide for the entire design package
  → Getting started checklist
  → File structure overview

- **[mockups/QUICK_REFERENCE.md](../mockups/QUICK_REFERENCE.md)**
  → Cheat sheet for colors, sizes, and common patterns
  → Keep this open while coding

### Interactive Mockups (7 Pages)
1. `mockups/01-dashboard-neon.html` - Dashboard with stats and activity
2. `mockups/02-issues-neon.html` - Kanban board issue tracker
3. `mockups/03-knowledge-neon.html` - Document library
4. `mockups/04-wiki-neon.html` - Documentation hub with TOC
5. `mockups/05-security-neon.html` - Security dashboard
6. `mockups/06-agent-personas-neon.html` - Agent management
7. `mockups/07-command-palette-neon.html` - ⌘K command interface

---

## 🎨 Theme System

ProjectPulse supports **4 distinct themes** with seamless switching and automatic persistence.

### Available Themes

| Theme | Mode | Primary Colors | Style | Best For |
|-------|------|----------------|-------|----------|
| **Desert Stone** (default) ⭐ | Light | Warm sandy browns, neutrals | Soft neumorphic | Professional, calm work |
| **Neon Vibes** | Dark | Hot pink, royal blue, cyan | Vibrant neon glows | Energetic, bold interface |
| **Earthy** | Dark | Olive, bone, smoky blacks | Minimal, muted | Grounded, minimal design |
| **Dark Neumorphic Coral** | Dark | Coral, slate grays | Geometric, modern | Sophisticated, playful |

### Theme Architecture

**How it works:**
1. **CSS Custom Properties** - All colors defined as `--color-*` variables
2. **Data Attributes** - Theme applied via `<html data-theme="desert">`
3. **Tailwind Classes** - Use semantic names (e.g., `bg-background-darkest`)
4. **React Context** - `ThemeProvider` manages state
5. **Persistence** - localStorage + database (optional)

**File Structure:**
```
apps/web/
├── lib/
│   ├── themes/
│   │   └── definitions.ts          # TypeScript theme definitions
│   └── theme-provider.tsx          # React context provider
├── styles/
│   └── themes/
│       ├── desert.css              # Desert Stone theme
│       ├── neon.css                # Neon Vibes theme
│       ├── earthy.css              # Earthy theme
│       └── coral.css               # Dark Neumorphic Coral theme
├── components/
│   ├── ThemeSwitcher.tsx           # UI for switching themes
│   └── ThemePreview.tsx            # Visual theme previews
└── app/
    ├── layout.tsx                  # Wraps app with ThemeProvider
    └── api/
        └── preferences/
            └── route.ts            # API for theme persistence
```

### Using Themes in Components

**Automatic theme adaptation:**
```typescript
import { useTheme } from '@/lib/theme-provider';

export function MyComponent() {
  const { theme, currentTheme, setTheme } = useTheme();

  return (
    <div className="bg-background-medium text-text-primary">
      {/* Colors automatically adapt to current theme */}
      <h1 className="text-accent-primary">Current theme: {currentTheme.name}</h1>

      {/* Access theme metadata */}
      {currentTheme.mode === 'dark' && <MoonIcon />}
    </div>
  );
}
```

**Theme-specific styling:**
```typescript
// Conditional rendering based on theme
{theme === 'desert' && <NeumorphicCard />}
{theme === 'neon' && <NeonGlowCard />}

// Or use data attribute in CSS
/* Custom styles for specific themes */
[data-theme="coral"] .special-card {
  background: var(--gradient-card);
  box-shadow: var(--shadow-hexagon);
}
```

### Theme Switching

**User Interface:**
- Theme switcher located in sidebar (always visible)
- Shows theme name, description, and visual preview
- Instant switching with smooth transitions

**Programmatic switching:**
```typescript
import { useTheme } from '@/lib/theme-provider';

const { setTheme } = useTheme();

// Switch to a different theme
setTheme('neon');  // 'desert' | 'neon' | 'earthy' | 'coral'
```

### Theme Persistence

**localStorage (Client-side):**
- Theme choice saved automatically
- Persists across browser sessions
- No authentication required

**Database (Server-side):**
- Optional sync via `/api/preferences`
- Persists across devices
- Requires user authentication (future)

**Preference priority:**
1. User selection (via ThemeSwitcher)
2. localStorage value
3. Database value (if authenticated)
4. Default (Desert Stone)

### Creating Custom Themes

**Step 1: Define colors** (`apps/web/lib/themes/definitions.ts`)
```typescript
const myTheme: ThemeDefinition = {
  id: 'mytheme',
  name: 'My Custom Theme',
  description: 'Custom theme description',
  mode: 'dark', // or 'light'
  colors: {
    bg: { darkest: '#...', dark: '#...', medium: '#...', light: '#...' },
    accent: { primary: '#...', secondary: '#...', tertiary: '#...' },
    text: { primary: '#...', secondary: '#...', tertiary: '#...', muted: '#...' },
    // ... semantic and priority colors
  },
  effects: { /* shadows, glows, gradients */ }
};
```

**Step 2: Create CSS file** (`apps/web/styles/themes/mytheme.css`)
```css
[data-theme="mytheme"] {
  --color-bg-darkest: #...;
  --color-bg-dark: #...;
  /* ... all CSS variables */
}
```

**Step 3: Import in globals.css**
```css
@import '../styles/themes/mytheme.css';
```

**Step 4: Add to ThemeProvider**
```typescript
// In lib/theme-provider.tsx
const themes = [
  // ... existing themes
  { id: 'mytheme', name: 'My Custom Theme', description: '...', mode: 'dark' }
];
```

### Theme Guidelines

**Color Variables (Required):**
- 4 background layers: `--color-bg-{darkest,dark,medium,light}`
- 3 accent colors: `--color-accent-{primary,secondary,tertiary}`
- 4 text colors: `--color-text-{primary,secondary,tertiary,muted}`
- 4 semantic colors: `--color-{success,warning,error,info}`
- 4 priority colors: `--color-priority-{critical,high,medium,low}`

**Shadow Variables (Theme-specific):**
- Neumorphic: `--shadow-neu-{float,inset,dark}` (for Desert/Coral)
- Glow: `--glow-{primary,secondary,tertiary}` (all themes)
- Regular: `--shadow-regular` (fallback)

**Gradient Variables:**
- `--gradient-primary` - Main gradient (buttons, accents)
- `--gradient-secondary` - Secondary gradient
- `--gradient-background` - Body background

### Accessibility Considerations

**Contrast Requirements:**
- Desert Stone (light): 7:1+ contrast (WCAG AAA)
- Dark themes: 7:1+ contrast for text on dark backgrounds
- All interactive elements: 4.5:1+ minimum

**Testing:**
```bash
# Use WebAIM Contrast Checker
https://webaim.org/resources/contrastchecker/

# For each theme, verify:
# - Text on background (primary, secondary, tertiary)
# - Buttons (all variants)
# - Links and interactive elements
# - Priority badges
```

**Dark Mode Handling:**
- Tailwind `dark:` classes apply automatically for dark themes
- Desert Stone (light mode): `dark:` classes are NOT applied
- Neon, Earthy, Coral (dark modes): `dark:` classes ARE applied

### Theme Testing Checklist

Before adding a new theme:
- [ ] All 30+ CSS variables defined
- [ ] Contrast ratios meet WCAG AA (4.5:1+)
- [ ] Preview component created
- [ ] Tested with all major components (Button, Card, Input, Badge)
- [ ] Tested on Dashboard, Issues, Knowledge Base pages
- [ ] Neumorphic shadows work (if applicable)
- [ ] Glow effects work (if applicable)
- [ ] Animations adapt correctly
- [ ] No flash of unstyled content (FOUC)
- [ ] localStorage persistence works
- [ ] Database sync works (if enabled)

---

## ⚙️ Tailwind Configuration

### Installation

```bash
cd apps/web
pnpm add @fontsource/inter @fontsource/jetbrains-mono
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background Layers
        background: {
          darkest: '#0A0118',
          dark: '#150828',
          medium: '#1F0D3A',
          light: '#2A1548',
        },
        // Neon Accent Colors
        neon: {
          pink: '#FF0080',
          magenta: '#E91E63',
          purple: '#B721FF',
          blue: '#21D4FD',
          cyan: '#00F5FF',
        },
        // Text Colors
        text: {
          primary: '#FFFFFF',
          secondary: '#E0B3FF',
          tertiary: '#9D7FB8',
          muted: '#6B5B7A',
        },
        // Semantic Colors
        success: '#10B981',
        warning: '#FACC15',
        error: '#EF4444',
        info: '#00F5FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-pink': '0 0 20px rgba(255, 0, 128, 0.6)',
        'glow-purple': '0 0 20px rgba(183, 33, 255, 0.6)',
        'glow-cyan': '0 0 20px rgba(0, 245, 255, 0.6)',
        'glow-yellow': '0 0 20px rgba(250, 204, 21, 0.6)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'heartbeat': 'heartbeat 2s ease-in-out infinite',
        'breathing': 'breathing 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
        'breathing': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 0, 128, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 0, 128, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Global CSS (app/globals.css)

```css
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/600.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background-darkest text-text-primary font-sans;
  }

  code, pre {
    @apply font-mono;
  }
}

@layer utilities {
  /* Neon gradient backgrounds */
  .gradient-pink-orange {
    background: linear-gradient(135deg, #FF0080 0%, #FF4D6D 50%, #FF8C42 100%);
  }

  .gradient-purple-pink {
    background: linear-gradient(135deg, #B721FF 0%, #FF0080 100%);
  }

  /* Card hover effects */
  .card-hover {
    @apply transition-all duration-300;
  }

  .card-hover:hover {
    @apply -translate-y-1 shadow-glow-pink;
  }

  /* Neon borders */
  .neon-border-pink {
    @apply border border-neon-pink/30;
  }

  .neon-border-purple {
    @apply border border-neon-purple/30;
  }

  .neon-border-cyan {
    @apply border border-neon-cyan/30;
  }
}
```

---

## 🧩 Component Library Roadmap

### Phase 1: Foundation Components (Week 1 Day 3)

Install shadcn/ui and customize base components:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add badge
```

#### Button Component

**Variants:**
- **Primary:** Gradient background (pink-to-orange), white text, glow on hover
- **Secondary:** Transparent background, neon pink border, pink text
- **Ghost:** Transparent background, no border, text-secondary, text-neon-pink on hover

**File:** `components/ui/button.tsx`

```typescript
// Customize the shadcn button with neon variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300",
  {
    variants: {
      variant: {
        primary: "gradient-pink-orange text-white hover:shadow-glow-pink",
        secondary: "bg-transparent border-2 border-neon-pink text-neon-pink hover:bg-neon-pink/10 hover:shadow-glow-pink",
        ghost: "bg-transparent text-text-secondary hover:text-neon-pink hover:bg-background-medium",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

#### Card Component

**Features:**
- Dark background (`bg-background-medium`)
- Neon border with low opacity
- Glow effect on hover
- Rounded corners (`rounded-xl`)

#### Input Component

**Features:**
- Dark background (`bg-background-medium`)
- Border with low opacity
- Cyan glow on focus
- Placeholder text in muted color

#### Badge Component

**Features:**
- Rounded full (`rounded-full`)
- Background with opacity (e.g., `bg-neon-pink/20`)
- Text in accent color
- Border in accent color with opacity
- Optional pulse indicator

---

### Phase 2: Complex Components (Week 2)

Create project-specific components:

#### IssueCard

**File:** `components/issues/IssueCard.tsx`

**Props:**
```typescript
interface IssueCardProps {
  id: number;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'to_do' | 'in_progress' | 'done';
  assignedAgent?: string;
  commentsCount: number;
}
```

**Features:**
- Priority color coding (Critical=red, High=yellow, Medium=cyan, Low=purple)
- Status badge with pulse for in_progress
- Agent avatar with neon border
- Drag handle for Kanban
- Comment count with icon
- Hover glow effect

#### KanbanColumn

**File:** `components/issues/KanbanColumn.tsx`

**Features:**
- Column header with count badge
- Drop zone for drag-and-drop
- Scrollable issue list
- "Add issue" button at bottom
- Border glow when drag-over

#### AgentCard

**File:** `components/agents/AgentCard.tsx`

**Props:**
```typescript
interface AgentCardProps {
  name: string;
  role: string;
  isActive: boolean;
  stats: {
    reviewsDone?: number;
    bugsFound?: number;
    timeSaved?: string;
  };
  skills: string[];
  color: string; // neon color for this agent
}
```

**Features:**
- Breathing animation when active
- Toggle switch with glow
- Stats display with large numbers
- Skill badges in agent color
- Configure/Analytics buttons

#### SecurityAlert

**File:** `components/security/SecurityAlert.tsx`

**Props:**
```typescript
interface SecurityAlertProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  cwe: string;
  file: string;
  scanner: string;
  description: string;
}
```

**Features:**
- Severity-based color coding
- CWE reference badge
- File path in mono font
- Scanner badge
- Fix/Review action buttons
- Expandable description

---

### Phase 3: Layout Components (Week 2-3)

#### Sidebar Navigation

**File:** `components/layout/Sidebar.tsx`

**Features:**
- Collapsible sidebar
- Active page highlighting (neon glow)
- Icon + text navigation items
- User profile at bottom
- Keyboard shortcut hints
- Smooth expand/collapse animation

#### Command Palette

**File:** `components/CommandPalette.tsx`

**Features:**
- Modal overlay with blur background
- Search input with instant filtering
- Grouped command lists (Quick Actions, Agents, Navigation, Settings)
- Keyboard shortcut badges
- Selected state highlighting (cyan glow)
- Footer with keyboard hints (↑↓ navigate, ↵ select, esc close)
- Triggered by ⌘K / Ctrl+K

#### Timeline Component

**File:** `components/Timeline.tsx`

**Features:**
- Vertical timeline with connecting line
- Icon circles for each event
- Timestamp in muted text
- Event description
- Hover glow on timeline items

#### Stats Card

**File:** `components/dashboard/StatsCard.tsx`

**Features:**
- Large number display (48px, bold)
- Label in secondary text
- Icon with gradient background
- Optional trend indicator (↑↓)
- Optional pulse animation for real-time metrics

---

## 📄 Page Implementation Guide

### 1. Dashboard (`01-dashboard-neon.html`)

**Route:** `app/(dashboard)/page.tsx`
**Week:** 2
**Type:** Server Component

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Stats Cards Row (4 columns)                │
├──────────────────┬──────────────────────────┤
│  Quick Actions   │  Activity Feed           │
│  (3x3 grid)      │  (timeline)              │
│                  │                          │
├──────────────────┴──────────────────────────┤
│  Knowledge Base Highlights (3 columns)      │
└─────────────────────────────────────────────┘
```

**Components Needed:**
- `StatsCard` (4x: Issues, Agents Active, KB Articles, Security Score)
- `QuickActionButton` (9x: Create Issue, Review Code, Scan Security, etc.)
- `ActivityFeed` (Timeline of recent events)
- `KnowledgeHighlight` (Featured KB articles)
- Pulse indicators on active metrics

**Data Sources:**
- `GET /api/stats` - Dashboard metrics
- `GET /api/activity` - Recent activity
- `GET /api/knowledge?featured=true` - Featured KB articles

---

### 2. Issues Tracker (`02-issues-neon.html`)

**Route:** `app/(dashboard)/issues/page.tsx`
**Week:** 2
**Type:** Server Component with Client Components for drag-and-drop

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Header: "Issues" + Filter Button + Create Issue Button  │
├──────────────────────────────────────────────────────────┤
│  ┌───────────┬──────────────┬───────────┐               │
│  │  To Do    │ In Progress  │  Done     │               │
│  │  (12)     │  (8)         │  (24)     │               │
│  ├───────────┼──────────────┼───────────┤               │
│  │ [Issue]   │ [Issue] ✨  │ [Issue]   │               │
│  │ [Issue]   │ [Issue] ✨  │ [Issue]   │               │
│  │ [Issue]   │ [Issue]      │ ...       │               │
│  │ ...       │ ...          │           │               │
│  │ + Add     │ + Add        │ + Add     │               │
│  └───────────┴──────────────┴───────────┘               │
└──────────────────────────────────────────────────────────┘
```

**Components Needed:**
- `KanbanBoard` (Client Component for drag-and-drop)
- `KanbanColumn` (3x: To Do, In Progress, Done)
- `IssueCard` (with priority badges, agent avatars)
- `IssueFilters` (Sidebar or modal)
- `CreateIssueButton` (Opens modal or navigates to /issues/new)
- Pulse indicators on "In Progress" cards

**Data Sources:**
- `GET /api/issues?status=to_do` - To Do issues
- `GET /api/issues?status=in_progress` - In Progress issues
- `GET /api/issues?status=done` - Done issues
- `PATCH /api/issues/[id]` - Update issue status (on drag-and-drop)

---

### 3. Knowledge Base (`03-knowledge-neon.html`)

**Route:** `app/(dashboard)/knowledge/page.tsx`
**Week:** 3
**Type:** Server Component

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Search Bar (with focus glow)               │
├─────────────────────────────────────────────┤
│  Category Filters (Pills)                   │
├─────────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │  Doc   │  │  Doc   │  │  Doc   │        │
│  │  Card  │  │  Card  │  │  Card  │        │
│  └────────┘  └────────┘  └────────┘        │
│  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │  Doc   │  │  Doc   │  │  Doc   │        │
│  └────────┘  └────────┘  └────────┘        │
└─────────────────────────────────────────────┘
```

**Components Needed:**
- `SearchBar` (with cyan focus glow)
- `CategoryPills` (Architecture, API, Deployment, etc.)
- `DocumentCard` (title, excerpt, tags, stats)
- `DocumentGrid` (responsive 3-column layout)

**Data Sources:**
- `GET /api/knowledge` - Document list
- `GET /api/search?q={query}&type=fulltext` - Search results

---

### 4. Wiki/Documentation Hub (`04-wiki-neon.html`)

**Route:** `app/(dashboard)/wiki/[slug]/page.tsx`
**Week:** 3
**Type:** Server Component

**Layout:**
```
┌────────────┬──────────────────────────────┬────────────┐
│            │  Breadcrumb                  │            │
│  Sidebar   ├──────────────────────────────┤   TOC      │
│  Nav       │  Article Title               │  (sticky)  │
│  (sticky)  │  ────────────────────────    │            │
│            │  ## Section 1                │  Section 1 │
│  Getting   │  Content here...             │  Section 2 │
│  Started   │                              │  Section 3 │
│  Config    │  ```code block```            │            │
│  Guides    │                              │            │
│  API Ref   │  💡 Tip callout              │            │
│            │                              │            │
│            │  ## Section 2                │            │
│            │  More content...             │            │
└────────────┴──────────────────────────────┴────────────┘
```

**Components Needed:**
- `WikiSidebar` (collapsible navigation tree)
- `TableOfContents` (auto-generated from headings)
- `CodeBlock` (syntax highlighting + copy button)
- `Callout` (Info=cyan, Tip=purple, Warning=yellow)
- `Breadcrumb` (navigation trail)
- `RelatedArticles` (at bottom)
- `ContributorBadge` (author info)

**Data Sources:**
- `GET /api/wiki/[slug]` - Article content (Markdown)
- `GET /api/wiki/[slug]/related` - Related articles

---

### 5. Security Dashboard (`05-security-neon.html`)

**Route:** `app/(dashboard)/security/page.tsx`
**Week:** 5+
**Type:** Server Component

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Security Score: 87/100 (large meter)       │
├──────────────────┬──────────────────────────┤
│  Vulnerability   │  Scanner Status          │
│  Breakdown       │  (Semgrep, Snyk, etc.)   │
│  (pie chart)     │                          │
├──────────────────┴──────────────────────────┤
│  Recent Vulnerabilities                     │
│  ┌───────────────────────────────────────┐  │
│  │ [Critical] SQL Injection in auth.ts   │  │
│  │ CWE-89 | Semgrep | Fix | Review      │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ [High] XSS in comment rendering       │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  Compliance Tracking                        │
│  OWASP: 90% | CWE: 85% | PCI DSS: 75%      │
└─────────────────────────────────────────────┘
```

**Components Needed:**
- `SecurityScoreMeter` (circular progress with glow)
- `VulnerabilityBreakdown` (chart or stats cards)
- `ScannerStatus` (status badges for each scanner)
- `VulnerabilityCard` (severity color-coded)
- `SecurityTimeline` (activity log)
- `ComplianceTracker` (progress bars for standards)

**Data Sources:**
- `GET /api/security/score` - Overall security score
- `GET /api/security/vulnerabilities` - Vulnerability list
- `GET /api/security/scanners` - Scanner status
- `GET /api/security/compliance` - Compliance metrics

---

### 6. Agent Personas (`06-agent-personas-neon.html`)

**Route:** `app/(dashboard)/agents/page.tsx`
**Week:** 4
**Type:** Server Component with Client Components for toggles

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Agent Portfolio Overview                   │
│  4 Active | 2 Inactive | 58h Time Saved     │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐   │
│  │ 🔍 Code Reviewer (Active) ✨         │   │
│  │ 38 reviews | 156 issues | 12h saved  │   │
│  │ [Toggle] [Configure] [Analytics]     │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ 🐛 Bug Hunter (Active) ✨            │   │
│  │ 24 bugs found | 21 fixed | 8h saved  │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ 📝 Documentation Writer (Inactive)    │   │
│  │ [Activate Agent]                      │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Components Needed:**
- `AgentPortfolioStats` (overview metrics)
- `AgentCard` (with breathing animation when active)
- `AgentToggle` (switch with neon glow)
- `AgentStats` (reviews, bugs, time saved)
- `SkillBadge` (skill tags in agent color)
- `AgentActivity` (recent actions timeline)

**Agent Details:**
1. **Code Reviewer** 🔍 (Cyan #00F5FF)
2. **Bug Hunter** 🐛 (Purple #B721FF)
3. **Feature Architect** 🏗️ (Purple #B721FF)
4. **Security Auditor** 🛡️ (Yellow #FACC15)
5. **Documentation Writer** 📝 (Inactive)
6. **Test Automation** 🧪 (Inactive)

**Data Sources:**
- `GET /api/agents` - Agent list with stats
- `POST /api/agents/[id]/activate` - Activate agent
- `POST /api/agents/[id]/deactivate` - Deactivate agent
- `GET /api/agents/[id]/activity` - Recent activity

---

### 7. Command Palette (`07-command-palette-neon.html`)

**Route:** N/A (Global Component)
**Week:** 2
**Type:** Client Component (Portal)

**Trigger:** `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)

**Layout:**
```
┌───────────────────────────────────────────┐
│  🔍 Type a command or search...           │
├───────────────────────────────────────────┤
│  QUICK ACTIONS                            │
│  ⚡ Create New Issue              Ctrl+N │
│  🔍 Review Code                   Ctrl+R │
│  🛡️ Run Security Scan                    │
├───────────────────────────────────────────┤
│  AGENT PERSONAS                           │
│  🔍 Activate Code Reviewer                │
│  🐛 Activate Bug Hunter                   │
├───────────────────────────────────────────┤
│  NAVIGATION                               │
│  📊 Go to Dashboard               Ctrl+D │
│  📝 Go to Issues                  Ctrl+I │
│  📚 Go to Knowledge Base          Ctrl+K │
├───────────────────────────────────────────┤
│  ↑↓ navigate · ↵ select · esc close      │
└───────────────────────────────────────────┘
```

**Components Needed:**
- `CommandPalette` (modal with search)
- `CommandList` (filtered command list)
- `CommandItem` (single command with icon + shortcut)
- `CommandGroup` (category header)
- `CommandShortcut` (keyboard badge)

**Implementation:**
- Use `cmdk` library for command palette
- Portal to render outside main DOM
- Fuzzy search for commands
- Keyboard navigation (↑↓, Enter, Esc)
- Global keyboard listener for ⌘K

---

## 🎬 Animation Implementation

### Pulse Animation (Real-time indicators)

**Use Cases:**
- Active issues (status = in_progress)
- Real-time metrics on dashboard
- Active agents
- Live activity indicators

**Implementation:**
```typescript
// components/ui/PulseIndicator.tsx
export function PulseIndicator({ color = 'pink' }: { color?: 'pink' | 'purple' | 'cyan' }) {
  const colorClasses = {
    pink: 'bg-neon-pink',
    purple: 'bg-neon-purple',
    cyan: 'bg-neon-cyan',
  };

  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`}></span>
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClasses[color]}`}></span>
    </span>
  );
}
```

### Breathing Animation (Active agents)

**Use Cases:**
- Active agent cards
- Important notifications
- Live status indicators

**Implementation:**
```css
/* In globals.css */
.breathing {
  animation: breathing 3s ease-in-out infinite;
}

@keyframes breathing {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 0, 128, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 0, 128, 0.8);
  }
}
```

### Glow on Hover

**Use Cases:**
- Interactive cards
- Buttons
- Navigation items
- Clickable elements

**Implementation:**
```typescript
// Use Tailwind classes
<div className="card-hover hover:shadow-glow-pink transition-all duration-300">
  {/* Card content */}
</div>
```

### Reduced Motion Support

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## ♿ Accessibility Requirements

### WCAG AA Compliance

**Contrast Ratios:**
- Text on dark background: 7:1+ (AAA)
- Interactive elements: 4.5:1+ (AA)
- Disabled text: 3:1+ (minimum)

**Testing Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Stark Plugin](https://www.getstark.co/) for Figma/Browser

### Keyboard Navigation

**Requirements:**
- [ ] All interactive elements focusable with Tab
- [ ] Focus indicators visible (cyan glow)
- [ ] Skip to content link
- [ ] Command Palette accessible via ⌘K
- [ ] Escape closes modals/overlays
- [ ] Arrow keys navigate lists/menus

**Implementation:**
```typescript
// Focus trap for modals
import { FocusTrap } from '@headlessui/react';

<FocusTrap>
  <div role="dialog" aria-modal="true">
    {/* Modal content */}
  </div>
</FocusTrap>
```

### Screen Reader Support

**Requirements:**
- [ ] Semantic HTML (header, nav, main, aside, footer)
- [ ] ARIA labels on icon-only buttons
- [ ] ARIA live regions for dynamic content
- [ ] Alt text on images
- [ ] Form labels associated with inputs

**Implementation:**
```typescript
// Icon-only button
<button aria-label="Create new issue">
  <PlusIcon />
</button>

// Live region for notifications
<div aria-live="polite" aria-atomic="true">
  {notification.message}
</div>
```

### Color Independence

**Requirements:**
- [ ] Don't rely solely on color to convey information
- [ ] Use icons + text for status
- [ ] Use patterns in addition to colors for charts

**Example:**
```typescript
// Bad: Color only
<Badge color="red">High</Badge>

// Good: Color + Icon + Text
<Badge color="red">
  <AlertIcon /> High Priority
</Badge>
```

---

## 📊 Implementation Checklist

### Week 1 Day 3: Design System Setup
- [ ] Install fonts (`@fontsource/inter`, `@fontsource/jetbrains-mono`)
- [ ] Configure Tailwind with neon colors
- [ ] Add custom animations (pulse, glow, breathing)
- [ ] Add neon shadow utilities
- [ ] Set up global CSS with font imports
- [ ] Test Tailwind compilation

### Week 2: Core Components & Pages
- [ ] Base components (Button, Card, Input, Badge)
- [ ] Dashboard page (stats, activity)
- [ ] Issues page (Kanban board)
- [ ] IssueCard component
- [ ] KanbanColumn component
- [ ] Command Palette (⌘K)
- [ ] Component tests written

### Week 3: Content Pages
- [ ] Knowledge Base page
- [ ] Wiki page
- [ ] DocumentCard component
- [ ] WikiSidebar component
- [ ] CodeBlock component
- [ ] Callout component
- [ ] Search bar component

### Week 4: Agent UI
- [ ] Agent Personas page
- [ ] AgentCard with breathing animation
- [ ] AgentToggle switch
- [ ] AgentStats display
- [ ] SkillBadge component
- [ ] Connect to MCP agent status

### Week 5+: Security Dashboard
- [ ] Security Dashboard page
- [ ] SecurityScoreMeter component
- [ ] VulnerabilityCard component
- [ ] ScannerStatus component
- [ ] ComplianceTracker component
- [ ] SecurityTimeline component

### Accessibility Audit
- [ ] Contrast ratios tested (WebAIM)
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (NVDA/VoiceOver)
- [ ] Focus indicators visible
- [ ] ARIA labels added
- [ ] Reduced motion support

---

## 📚 Additional Resources

- **Design System:** [mockups/DESIGN_DIRECTION.md](../mockups/DESIGN_DIRECTION.md)
- **Mockup Features:** [mockups/MOCKUPS_COMPLETE.md](../mockups/MOCKUPS_COMPLETE.md)
- **Quick Reference:** [mockups/QUICK_REFERENCE.md](../mockups/QUICK_REFERENCE.md)
- **Workflow:** [WORKFLOW_ARCHITECTURE.md](WORKFLOW_ARCHITECTURE.md)
- **Backend Plan:** [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
- **shadcn/ui Docs:** https://ui.shadcn.com/
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated:** 2025-10-24
**Maintainer:** Development Team + Claude Code
**Status:** ✅ Ready for Implementation
