# UI Transformation Plan - Dark Neumorphic Coral Theme
## Moksha DevHub - Complete UI System Migration

**Version:** 1.0
**Created:** October 25, 2025
**Author:** Senior Architect Analysis
**Status:** 🔴 Not Started - Awaiting Execution

---

## 📋 Executive Summary

### Mission
Transform the existing Next.js 14 application UI from its current multi-theme neumorphic design to a **single, fixed Dark Neumorphic Coral theme**, matching the pixel-perfect mockups in `mockups/Default theme/`.

### Critical Constraints
1. **No Dynamic Themes** - Remove all theme switching functionality (post-MVP feature)
2. **Pixel-Perfect Adherence** - Match mockups exactly, down to spacing and shadow values
3. **Component Reusability** - Extract patterns from mockups into reusable React components
4. **Type Safety** - Maintain strict TypeScript, zero `any` types
5. **Server Components First** - Default to RSC, client components only when necessary

### Success Criteria
- ✅ All 7 pages match their corresponding mockups visually
- ✅ Theme system simplified to single Coral theme
- ✅ Reusable component library extracted from mockups
- ✅ Zero theme-switching code remaining
- ✅ All CSS/Tailwind classes align with `theme/theme.css`

---

## 🔍 Current State Analysis

### Existing Theme System (To Be Removed)
Located in: `apps/web/lib/theme-provider.tsx`

**Current Implementation:**
```typescript
type ThemeId = 'desert' | 'neon' | 'earthy' | 'coral';  // ❌ Remove
const themes: Theme[] = [/* 4 themes */];                // ❌ Remove
<ThemeContext.Provider>                                  // ❌ Remove
```

**Current Components Using Themes:**
- ❌ `components/ThemeSwitcher.tsx` - DELETE
- ❌ `components/CompactThemeSwitcher.tsx` - DELETE
- ❌ `components/ThemePreview.tsx` - DELETE
- ❌ `lib/theme-provider.tsx` - REPLACE with static config

### Existing UI Components (To Be Transformed)
Located in: `apps/web/components/`

| Component | Current State | Target State | Action Required |
|-----------|---------------|--------------|-----------------|
| `Sidebar.tsx` | Desert theme, basic nav | Coral theme, neumorphic depth | Transform styles + layout |
| `Header.tsx` | Search + notifications | Glass morphism header | Replace with mockup pattern |
| `WelcomeBanner.tsx` | Basic gradient card | Neumorphic coral gradient | Update shadows + colors |
| `StatCards.tsx` | Basic grid | 4-column neumorphic grid | Match mockup exactly |
| `IssueCard.tsx` | Simple card | Neumorphic card with badges | Add priority indicators |
| `Dashboard page.tsx` | Basic layout | Floating hexagon bg | Add background animations |

### Current CSS/Tailwind Configuration
Located in: `apps/web/`

**Files to Update:**
- `app/globals.css` - Replace with `theme/theme.css` patterns
- `tailwind.config.ts` - Update to match `theme/tailwind.config.js`
- Component CSS modules - Convert to Tailwind utilities

---

## 🎯 Target State (Mockup Analysis)

### Theme System Architecture

#### Color Palette (from mockups)
```css
/* Base Colors */
--dark: #1A1A1A           /* Primary background */
--dark-lighter: #242424    /* Secondary background */
--dark-card: #2A2A2A      /* Card background */
--dark-pressed: #1F1F1F   /* Pressed/inset elements */

/* Coral (Primary Brand) */
--coral: #FF8B6A          /* Main coral */
--coral-light: #FFB299    /* Light coral */
--coral-dark: #E67759     /* Dark coral */

/* Slate (Secondary/Text) */
--slate: #8B8B8B          /* Secondary text */
--slate-light: #A5A5A5    /* Lighter text */
--slate-dark: #6B6B6B     /* Muted text */

/* Accent Colors */
--accent-green: #4ADE80   /* Success */
--accent-blue: #60A5FA    /* Info */
--accent-yellow: #FBBF24  /* Warning */
--accent-red: #EF4444     /* Error/Critical */
--accent-purple: #A78BFA  /* Special */
```

#### Neumorphic Shadow Patterns
```css
/* Raised Effect (buttons, cards) */
.neu-raised {
  background: linear-gradient(145deg, #2A2A2A, #242424);
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.6),
    -8px -8px 16px rgba(60, 60, 60, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.neu-raised:hover {
  box-shadow:
    12px 12px 24px rgba(0, 0, 0, 0.7),
    -12px -12px 24px rgba(60, 60, 60, 0.15);
  transform: translateY(-2px);
}

/* Pressed Effect (inputs, insets) */
.neu-pressed {
  background: #1F1F1F;
  box-shadow:
    inset 4px 4px 8px rgba(0, 0, 0, 0.5),
    inset -2px -2px 6px rgba(60, 60, 60, 0.1);
}

/* Coral Gradient Button */
.coral-gradient {
  background: linear-gradient(135deg, #FF8B6A 0%, #E67759 100%);
  box-shadow:
    0 8px 20px rgba(255, 139, 106, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Glass Effect */
.glass-dark {
  background: rgba(42, 42, 42, 0.4);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

### Page-by-Page Component Breakdown

#### 1. Dashboard (`01-dashboard-dark-neumorphic-coral.html`)

**Layout Structure:**
```
┌─────────────────────────────────────────────┐
│  Floating Hexagon Background (fixed)       │
│  ┌───────┐  ┌─────────────────────────┐    │
│  │       │  │  Glass Header           │    │
│  │ Side  │  │  Search + Notifications │    │
│  │ bar   │  ├─────────────────────────┤    │
│  │       │  │  Stats Grid (4 cols)    │    │
│  │ Neu-  │  ├─────────────────────────┤    │
│  │ morph │  │  Activity Feed          │    │
│  │ ic    │  │  + Recent Issues        │    │
│  │       │  ├─────────────────────────┤    │
│  │ Nav   │  │  Quick Actions Panel    │    │
│  └───────┘  └─────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Components Needed:**
1. **Floating Background** - CSS animations with hexagons
2. **Sidebar Navigation**
   - Logo + branding (coral heartbeat icon)
   - Nav items (Home, Issues, Knowledge, Wiki, Security, Personas, Settings)
   - Active state (coral border-left + text)
   - Count badges (red circles)
3. **Glass Header**
   - Search input (neumorphic inset)
   - Notification bell (with pulse indicator)
4. **Stats Grid**
   - 4-column responsive grid
   - Icon containers (coral, green, red, orange backgrounds)
   - Metric numbers (large, bold)
   - Change indicators (+12, -15, etc.)
5. **Activity Feed**
   - Timeline with coral dots
   - Timestamp + action text
   - Avatar icons
6. **Recent Issues**
   - Issue cards (neu-raised)
   - Priority badges (coral dot + text)
   - Status badges (green/red)
   - Comment count
7. **Quick Actions**
   - Coral gradient buttons
   - Icon + text layout

#### 2. Issues Page (`02-issues-dark-neumorphic-coral.html`)

**Unique Components:**
- **Filter Sidebar**
  - Checkbox groups (neumorphic style)
  - Count indicators per filter
  - Clear filters button
- **Issue List Items**
  - Large clickable cards
  - Multi-badge layout (priority, status, module)
  - Checkbox selection
  - Metadata row (date, comments, assignee)
- **Pagination**
  - Page numbers (neumorphic buttons)
  - Active page (coral background)
  - Prev/Next arrows

#### 3. Knowledge Base (`03-knowledge-dark-neumorphic-coral.html`)

**Unique Components:**
- **Article Cards**
  - Large preview cards
  - Tag badges (coral + slate)
  - View count + date
  - Featured indicator
- **Category Filters**
  - Pill-style buttons
  - Active state (coral)
- **Search with Filters**
  - Combined search + category dropdown

#### 4. Wiki Page (`04-wiki-dark-neumorphic-coral.html`)

**Unique Components:**
- **Table of Contents Sidebar**
  - Nested list structure
  - Active section indicator (coral)
  - Smooth scroll links
- **Breadcrumb Navigation**
  - Slash separators
  - Clickable path
- **Content Sections**
  - H1/H2/H3 with coral accents
  - Code blocks (neumorphic, syntax highlight)
  - Images with captions
- **Edit Controls**
  - Edit button (coral gradient)
  - Version history
  - Contributors row

#### 5. Security Dashboard (`05-security-dark-neumorphic-coral.html`)

**Unique Components:**
- **Security Score Display**
  - Large circular score (coral gradient)
  - Risk level indicator
- **Vulnerability Cards**
  - Severity badges (critical=red, high=orange, medium=yellow)
  - CVSS score
  - Remediation status
- **Scan Results Timeline**
  - Horizontal timeline
  - Scan status indicators
- **Risk Assessment Grid**
  - 3-column metrics
  - Color-coded risk levels

#### 6. Agent Personas (`06-agent-personas-dark-neumorphic-coral.html`)

**Unique Components:**
- **Feature Toggle Cards**
  - Large 2-column cards
  - Toggle switch (coral when active)
  - Emoji icon containers
  - 3-column metrics grid within card
- **Agent Activity Feed**
  - Action timeline
  - Agent name + action type
  - Timestamp
- **Top Navigation** (different from sidebar layout)
  - Horizontal nav bar
  - Pill-style active state

#### 7. Command Palette (`07-command-palette-dark-neumorphic-coral.html`)

**Unique Components:**
- **Modal Overlay**
  - Blurred backdrop
  - Centered modal (glass effect)
- **Command Search Input**
  - Large search with icon
  - Placeholder text
- **Command Items**
  - Icon + text + shortcut
  - Grouped by category
  - Selected state (coral border)
- **Footer Hints**
  - Keyboard shortcuts (kbd tags)
  - Navigation hints

### Typography System

**Font Stack:**
```css
font-family: 'Inter', system-ui, sans-serif;
font-family: 'JetBrains Mono', monospace; /* Code blocks */
```

**Text Sizes:**
```css
/* Headings */
.text-4xl { font-size: 2.25rem; }  /* H1 - Page titles */
.text-3xl { font-size: 1.875rem; } /* H2 - Section titles */
.text-2xl { font-size: 1.5rem; }   /* H3 - Subsection titles */
.text-xl { font-size: 1.25rem; }   /* Large text */

/* Body */
.text-base { font-size: 1rem; }    /* Normal text */
.text-sm { font-size: 0.875rem; }  /* Small text */
.text-xs { font-size: 0.75rem; }   /* Tiny text, badges */
```

**Font Weights:**
```css
.font-bold { font-weight: 700; }   /* Headings, emphasis */
.font-semibold { font-weight: 600; } /* Subheadings */
.font-medium { font-weight: 500; } /* UI elements */
.font-normal { font-weight: 400; } /* Body text */
```

### Spacing System

**Standard Spacing (Tailwind scale):**
```css
gap-2  = 0.5rem  (8px)   /* Tight spacing */
gap-3  = 0.75rem (12px)  /* Small spacing */
gap-4  = 1rem    (16px)  /* Normal spacing */
gap-6  = 1.5rem  (24px)  /* Medium spacing */
gap-8  = 2rem    (32px)  /* Large spacing */
gap-12 = 3rem    (48px)  /* XL spacing */
```

**Padding Patterns:**
- Cards: `p-6` (24px)
- Buttons: `px-6 py-3` (24px horizontal, 12px vertical)
- Sidebar items: `px-4 py-3`
- Modal: `p-8`

**Border Radius:**
```css
rounded-xl  = 0.75rem (12px)  /* Buttons, inputs */
rounded-2xl = 1rem (16px)     /* Cards, small modals */
rounded-3xl = 1.5rem (24px)   /* Large cards, main panels */
```

---

## 🏗️ Transformation Strategy

### Phase 1: Foundation (Day 1)

#### Step 1.1: Remove Multi-Theme System
**Files to Modify:**
1. Delete `apps/web/components/ThemeSwitcher.tsx`
2. Delete `apps/web/components/CompactThemeSwitcher.tsx`
3. Delete `apps/web/components/ThemePreview.tsx`
4. Replace `apps/web/lib/theme-provider.tsx` with static config:

```typescript
// apps/web/lib/theme-config.ts
export const theme = {
  name: 'Dark Neumorphic Coral',
  id: 'coral',
  mode: 'dark' as const,
  colors: {
    dark: '#1A1A1A',
    darkLighter: '#242424',
    darkCard: '#2A2A2A',
    darkPressed: '#1F1F1F',
    coral: '#FF8B6A',
    coralLight: '#FFB299',
    coralDark: '#E67759',
    // ... rest of colors
  }
} as const;

export type Theme = typeof theme;
```

#### Step 1.2: Update Global CSS
**File:** `apps/web/app/globals.css`

**Actions:**
1. Copy all CSS variables from `theme/theme.css`
2. Import Inter + JetBrains Mono fonts
3. Add neumorphic class definitions
4. Add animation keyframes
5. Set dark background + floating hexagons

**Template:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  /* Copy all CSS variables from theme/theme.css */
}

@layer base {
  body {
    @apply bg-dark text-[#E5E5E5] font-sans;
  }
}

@layer components {
  /* Copy .neu-raised, .neu-pressed, .coral-gradient, etc. */
}

@layer utilities {
  /* Custom utilities */
}
```

#### Step 1.3: Update Tailwind Config
**File:** `apps/web/tailwind.config.ts`

**Actions:**
1. Copy color definitions from `theme/tailwind.config.js`
2. Add font family configurations
3. Add custom shadows
4. Add animation keyframes

**Template:**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#1A1A1A',
        darkLighter: '#242424',
        darkCard: '#2A2A2A',
        darkPressed: '#1F1F1F',
        coral: '#FF8B6A',
        // ... all colors from theme/tailwind.config.js
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neu-raised': '8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(60, 60, 60, 0.1)',
        'neu-pressed': 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -2px -2px 6px rgba(60, 60, 60, 0.1)',
        'coral-glow': '0 8px 20px rgba(255, 139, 106, 0.3)',
        // ... more shadows
      },
      animation: {
        'float-hex': 'float-hex 8s ease-in-out infinite',
        'float-bubble': 'float-bubble 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'float-hex': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(5deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-5deg)' },
        },
        // ... more keyframes
      }
    },
  },
  plugins: [],
}

export default config
```

### Phase 2: Component Library Creation (Days 2-3)

#### Step 2.1: Extract Base Components from Mockups

**Priority Order:**
1. Layout components (critical path)
2. Interactive components (buttons, inputs)
3. Display components (cards, badges)
4. Complex components (modals, command palette)

#### Component 1: FloatingBackground
**Location:** `apps/web/components/ui/FloatingBackground.tsx`

```typescript
'use client';

export function FloatingBackground() {
  return (
    <div className="hexagon-bg fixed inset-0 z-0 pointer-events-none">
      {/* Hexagons */}
      <div className="hexagon hex-1" />
      <div className="hexagon hex-2" />
      <div className="hexagon hex-3" />

      {/* Bubbles */}
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2" />
      <div className="bubble bubble-coral" />
    </div>
  );
}
```

**CSS (add to globals.css):**
```css
.hexagon-bg { /* From mockup */ }
.hexagon { /* From mockup */ }
.hex-1, .hex-2, .hex-3 { /* From mockup */ }
.bubble { /* From mockup */ }
@keyframes float-hex { /* From mockup */ }
@keyframes float-bubble { /* From mockup */ }
```

#### Component 2: Sidebar (Transformed)
**Location:** `apps/web/components/Sidebar.tsx`

**Current Issues:**
- Using desert theme classes
- Missing coral active states
- No count badges
- Simple shadows

**Transformation:**
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  AlertCircle,
  BookOpen,
  FileText,
  Shield,
  Users,
  Settings
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: 'red' | 'coral' | 'yellow';
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/issues', label: 'Issues', icon: AlertCircle, badge: 12, badgeColor: 'coral' },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { href: '/wiki', label: 'Wiki', icon: FileText },
  { href: '/security', label: 'Security', icon: Shield, badge: 3, badgeColor: 'red' },
  { href: '/agents', label: 'Personas', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen neu-raised flex flex-col gap-6 p-6 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coralDark flex items-center justify-center text-white text-xl">
          💓
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">ProjectPulse</h1>
          <p className="text-xs text-slate">v1.0.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl
                smooth-transition
                ${isActive
                  ? 'bg-darkLighter border-l-4 border-coral text-coral'
                  : 'text-slate hover:bg-darkLighter hover:text-white'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-coral' : ''}`} />
              <span className="font-medium">{item.label}</span>

              {/* Badge */}
              {item.badge && (
                <span className={`
                  ml-auto w-6 h-6 rounded-full flex items-center justify-center
                  text-xs font-semibold text-white
                  ${item.badgeColor === 'red' ? 'bg-red-500' : 'bg-coral'}
                `}>
                  {item.badge}
                </span>
              )}

              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-coral rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="flex items-center gap-3 p-3 rounded-xl neu-pressed">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-coralDark flex items-center justify-center text-white font-semibold">
          MD
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Moksha Dev</p>
          <p className="text-xs text-slate">Developer</p>
        </div>
      </div>
    </aside>
  );
}
```

#### Component 3: Header (Glass Effect)
**Location:** `apps/web/components/Header.tsx`

```typescript
'use client';

import { Search, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="glass-dark rounded-3xl px-8 py-4 flex items-center justify-between smooth-transition mb-6">
      {/* Search Bar */}
      <div className="max-w-2xl flex-1">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate group-focus-within:text-coral transition-colors" />
          <input
            type="search"
            placeholder="Search or press Cmd+K..."
            className="
              w-full pl-12 pr-20 py-3 rounded-2xl
              neu-pressed bg-transparent
              text-white placeholder:text-slate
              border-0 focus:outline-none focus:ring-2 focus:ring-coral/30
              smooth-transition
            "
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl neu-raised text-xs font-mono text-slate">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="ml-6 flex items-center gap-3">
        {/* Notifications */}
        <button className="relative w-12 h-12 neu-raised rounded-2xl flex items-center justify-center smooth-transition hover:shadow-coral-glow group">
          <Bell className="w-5 h-5 text-white group-hover:text-coral transition-colors" />
          {/* Pulse indicator */}
          <div className="absolute top-2 right-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-glow" />
          </div>
        </button>
      </div>
    </header>
  );
}
```

#### Component 4: StatCard
**Location:** `apps/web/components/dashboard/StatCard.tsx`

```typescript
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: 'coral' | 'green' | 'red' | 'yellow';
  value: number | string;
  label: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const iconColorClasses = {
  coral: 'bg-gradient-to-br from-coral to-coralDark',
  green: 'bg-gradient-to-br from-green-500 to-green-600',
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
};

const changeColorClasses = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-slate',
};

export function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
  change,
  changeType
}: StatCardProps) {
  return (
    <div className="neu-raised rounded-3xl p-6 smooth-transition hover:shadow-lg group">
      {/* Icon + Change */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${iconColorClasses[iconColor]} flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && changeType && (
          <span className={`text-sm font-semibold ${changeColorClasses[changeType]}`}>
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <h3 className="text-4xl font-bold text-white mb-2">
        {value}
      </h3>

      {/* Label */}
      <p className="text-sm text-slate">
        {label}
      </p>
    </div>
  );
}
```

#### Component 5: Button (Coral Gradient)
**Location:** `apps/web/components/ui/button.tsx`

```typescript
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-semibold smooth-transition disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'coral-gradient text-white hover:shadow-coral-glow',
        secondary: 'neu-raised text-white hover:shadow-lg',
        ghost: 'text-slate hover:bg-darkLighter hover:text-white',
        outline: 'border-2 border-coral text-coral hover:bg-coral hover:text-white',
      },
      size: {
        default: 'px-6 py-3 text-base',
        sm: 'px-4 py-2 text-sm',
        lg: 'px-8 py-4 text-lg',
        icon: 'w-12 h-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

#### Component 6: Badge
**Location:** `apps/web/components/ui/badge.tsx`

```typescript
import { type HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        coral: 'bg-coral/20 text-coral border border-coral/30',
        green: 'bg-green-500/20 text-green-500 border border-green-500/30',
        red: 'bg-red-500/20 text-red-500 border border-red-500/30',
        yellow: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30',
        slate: 'bg-slate/20 text-slate border border-slate/30',
        purple: 'bg-purple-500/20 text-purple-500 border border-purple-500/30',
      },
    },
    defaultVariants: {
      variant: 'slate',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, dot, children, ...props }, ref) => {
    return (
      <div
        className={badgeVariants({ variant, className })}
        ref={ref}
        {...props}
      >
        {dot && <div className="w-2 h-2 rounded-full bg-current" />}
        {children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
```

### Phase 3: Page Transformation (Days 4-7)

#### Dashboard Page Transformation
**File:** `apps/web/app/dashboard/page.tsx`

**Current Structure:**
```typescript
// Simplified current version
export default async function Dashboard() {
  return (
    <div className="space-y-4">
      <WelcomeBanner />
      <StatCards />
      <RecentIssues />
    </div>
  );
}
```

**Target Structure (from mockup):**
```typescript
import { FloatingBackground } from '@/components/ui/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { RecentIssues } from '@/components/dashboard/RecentIssues';
import { QuickActions } from '@/components/dashboard/QuickActions';
import {
  AlertCircle,
  BookOpen,
  Shield,
  CheckCircle
} from 'lucide-react';

// Import data fetching
import { getStats, getRecentIssues, getActivity } from '@/lib/api/dashboard';

export default async function DashboardPage() {
  // Fetch data (Server Component)
  const stats = await getStats();
  const recentIssues = await getRecentIssues(5);
  const activity = await getActivity(10);

  return (
    <>
      <FloatingBackground />

      <div className="content-wrapper flex min-h-screen">
        <Sidebar />

        <main className="flex-1 p-8 overflow-auto">
          <Header />

          {/* Welcome Banner */}
          <div className="neu-raised rounded-3xl p-6 mb-6 bg-gradient-to-r from-darkCard to-darkLighter">
            <h2 className="text-3xl font-bold text-white mb-2">
              Good afternoon, Developer! 👋
            </h2>
            <p className="text-slate">
              You have {stats.openIssues} open issues and {stats.securityFindings} security findings to review
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={AlertCircle}
              iconColor="coral"
              value={stats.openIssues}
              label="Open Issues"
              change="+12"
              changeType="positive"
            />
            <StatCard
              icon={BookOpen}
              iconColor="green"
              value={stats.knowledgeItems}
              label="Knowledge Items"
              change="+8"
              changeType="positive"
            />
            <StatCard
              icon={Shield}
              iconColor="red"
              value={stats.securityFindings}
              label="Security Findings"
              change="-15"
              changeType="negative"
            />
            <StatCard
              icon={CheckCircle}
              iconColor="yellow"
              value={stats.completed}
              label="Completed"
              change="+23"
              changeType="positive"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Issues - 2 columns */}
            <div className="lg:col-span-2">
              <RecentIssues issues={recentIssues} />
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              <QuickActions />
              <ActivityFeed activity={activity} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
```

### Phase 4: Responsive & Polish (Day 8)

#### Responsive Breakpoints
```typescript
// tailwind.config.ts - ensure these are set
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

#### Mobile Considerations
1. **Sidebar:** Convert to drawer on mobile
2. **Stats Grid:** 1 column on mobile, 2 on tablet, 4 on desktop
3. **Navigation:** Hamburger menu for mobile
4. **Floating Background:** Reduce hexagons on mobile for performance

#### Animation Performance
```css
/* Use transform and opacity for animations (GPU-accelerated) */
.smooth-transition {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.4s ease,
              box-shadow 0.4s ease;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .smooth-transition {
    transition-duration: 0.01ms;
  }

  .hexagon, .bubble {
    animation: none;
  }
}
```

---

## 📦 Deliverables

### Code Deliverables
1. ✅ All theme switching code removed
2. ✅ `theme-config.ts` created with static Coral theme
3. ✅ `globals.css` updated with neumorphic classes
4. ✅ `tailwind.config.ts` aligned with mockup colors
5. ✅ Component library (20+ components) matching mockups
6. ✅ All 7 pages pixel-perfect to mockups
7. ✅ Responsive design (mobile, tablet, desktop)
8. ✅ Accessibility (keyboard navigation, screen readers)

### Documentation Deliverables
1. ✅ Component usage guide (how to use each component)
2. ✅ Color palette reference (quick lookup)
3. ✅ Spacing/typography guide
4. ✅ Animation guide (when to use which animation)
5. ✅ Migration guide (from old to new components)

---

## ⚠️ Critical Warnings

### DO NOT
1. ❌ Add any theme switching functionality
2. ❌ Create multiple theme variants
3. ❌ Deviate from mockup designs
4. ❌ Use `any` types in TypeScript
5. ❌ Hardcode data (use database/API)
6. ❌ Skip responsive testing
7. ❌ Ignore accessibility

### MUST DO
1. ✅ Match mockups pixel-perfect
2. ✅ Use Coral theme colors exclusively
3. ✅ Follow neumorphic shadow patterns
4. ✅ Maintain strict TypeScript
5. ✅ Use Server Components by default
6. ✅ Test on mobile, tablet, desktop
7. ✅ Test keyboard navigation
8. ✅ Verify against `theme/COMPONENTS_REFERENCE.md`

---

## 🎯 Success Metrics

### Visual Accuracy
- [ ] Dashboard matches `01-dashboard-dark-neumorphic-coral.html` ≥ 95%
- [ ] Issues page matches `02-issues-dark-neumorphic-coral.html` ≥ 95%
- [ ] Knowledge matches `03-knowledge-dark-neumorphic-coral.html` ≥ 95%
- [ ] Wiki matches `04-wiki-dark-neumorphic-coral.html` ≥ 95%
- [ ] Security matches `05-security-dark-neumorphic-coral.html` ≥ 95%
- [ ] Personas matches `06-agent-personas-dark-neumorphic-coral.html` ≥ 95%
- [ ] Command palette matches `07-command-palette-dark-neumorphic-coral.html` ≥ 95%

### Code Quality
- [ ] Zero TypeScript `any` types
- [ ] All components have proper TypeScript interfaces
- [ ] 80%+ test coverage for UI components
- [ ] No console warnings/errors
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] No janky animations (60fps smooth)

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works everywhere
- [ ] Screen reader compatible
- [ ] Color contrast ratios meet standards
- [ ] Focus indicators visible

---

## 📅 Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1: Foundation** | 1 day | Theme system removed, CSS/Tailwind updated |
| **Phase 2: Component Library** | 2 days | 20+ reusable components created |
| **Phase 3: Page Transformation** | 4 days | All 7 pages matching mockups |
| **Phase 4: Polish & QA** | 1 day | Responsive, accessible, tested |
| **Total** | **8 days** | Pixel-perfect UI matching mockups |

---

## 🔗 References

### Theme System Resources
- `theme/THEME_GUIDE.md` - Complete design system
- `theme/COMPONENTS_REFERENCE.md` - 50+ copy-paste components
- `theme/QUICK_REFERENCE.md` - Cheat sheet
- `theme/theme.css` - All CSS definitions
- `theme/tailwind.config.js` - Tailwind configuration

### Mockup Files
- `mockups/Default theme/MOCKUPS_INDEX.md` - Index of all mockups
- `mockups/Default theme/01-dashboard-dark-neumorphic-coral.html`
- `mockups/Default theme/02-issues-dark-neumorphic-coral.html`
- `mockups/Default theme/03-knowledge-dark-neumorphic-coral.html`
- `mockups/Default theme/04-wiki-dark-neumorphic-coral.html`
- `mockups/Default theme/05-security-dark-neumorphic-coral.html`
- `mockups/Default theme/06-agent-personas-dark-neumorphic-coral.html`
- `mockups/Default theme/07-command-palette-dark-neumorphic-coral.html`

### Architecture Docs
- `docs/01-ARCHITECTURE.md` - System architecture
- `docs/04-UI-ARCHITECTURE.md` - UI component system
- `docs/DEVELOPMENT_PLAN.md` - Development roadmap

---

## ✅ Next Steps

1. **Review this plan** with the team
2. **Set default theme to Coral** in codebase
3. **Begin Phase 1** (Foundation removal)
4. **Create component library** from mockups
5. **Transform pages** one by one
6. **QA and polish** responsive + accessibility

---

**Plan Status:** 📋 Ready for Execution
**Created By:** Senior Architect
**Approved By:** Pending
**Start Date:** TBD

---

*This plan provides the complete roadmap for transforming the Moksha DevHub UI to match the Dark Neumorphic Coral theme mockups pixel-perfectly. Follow this plan step-by-step for successful execution.*
