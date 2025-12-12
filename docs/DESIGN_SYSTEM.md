# Design System Documentation

## Brand Theme Customization Guide

**Version:** 1.0.0  
**Based on:** ProjectPulse Dark Neumorphic Theme  
**Purpose:** Create new products with your custom brand theme

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Border Radius](#border-radius)
6. [Shadows & Effects](#shadows--effects)
7. [Components](#components)
8. [Animations](#animations)
9. [Customization Guide](#customization-guide)
10. [Implementation](#implementation)

---

## Design Philosophy

The design system is built on three core principles:

### 1. Dark Neumorphism
Soft, 3D-like UI elements that appear to extrude from or press into the background surface. Creates depth without harsh shadows.

### 2. Accent-Driven Hierarchy
A single primary accent color (coral by default) guides user attention to important actions and states.

### 3. Subtle Motion
Smooth transitions and micro-animations that feel natural and responsive without being distracting.

---

## Color System

### Core Color Architecture

The color system uses a layered approach with semantic naming:

```
┌─────────────────────────────────────────────────────────────┐
│  BACKGROUND LAYER (Darkest)                                 │
│  └── SURFACE LAYER (Cards, Containers)                      │
│      └── COMPONENT LAYER (Buttons, Inputs)                  │
│          └── ACCENT LAYER (Primary Actions)                 │
└─────────────────────────────────────────────────────────────┘
```

### Base Colors (Background System)

| Token | Hex Value | RGB | Usage |
|-------|-----------|-----|-------|
| `--dark` | `#1A1A1A` | `rgb(26, 26, 26)` | Primary background |
| `--dark-lighter` | `#242424` | `rgb(36, 36, 36)` | Secondary background, gradients |
| `--dark-card` | `#2A2A2A` | `rgb(42, 42, 42)` | Card/container backgrounds |
| `--dark-pressed` | `#1F1F1F` | `rgb(31, 31, 31)` | Pressed/inset elements |

### Primary Accent (Brand Color)

| Token | Hex Value | RGB | Usage |
|-------|-----------|-----|-------|
| `--coral` | `#FF8B6A` | `rgb(255, 139, 106)` | Primary actions, active states |
| `--coral-light` | `#FFB299` | `rgb(255, 178, 153)` | Hover states, highlights |
| `--coral-dark` | `#E67759` | `rgb(230, 119, 89)` | Pressed states, gradients |

### Secondary Colors (Neutral)

| Token | Hex Value | RGB | Usage |
|-------|-----------|-----|-------|
| `--slate` | `#8B8B8B` | `rgb(139, 139, 139)` | Secondary text, icons |
| `--slate-light` | `#A5A5A5` | `rgb(165, 165, 165)` | Lighter secondary elements |
| `--slate-dark` | `#6B6B6B` | `rgb(107, 107, 107)` | Muted text, disabled states |

### Semantic Colors (Status)

| Token | Hex Value | Purpose |
|-------|-----------|---------|
| `--accent-green` | `#4ADE80` | Success, completed, positive |
| `--accent-blue` | `#60A5FA` | Information, links, medium priority |
| `--accent-yellow` | `#FBBF24` | Warning, caution, pending |
| `--accent-red` | `#EF4444` | Error, critical, destructive |
| `--accent-purple` | `#A78BFA` | Special features, premium |

### Text Colors

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `--text-primary` | `#E5E5E5` | Primary text, headings |
| `--text-secondary` | `var(--slate)` | Secondary text, descriptions |
| `--text-muted` | `#6B6B6B` | Muted text, placeholders |

### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(255, 255, 255, 0.05)` | Default borders |
| `--border-medium` | `rgba(255, 255, 255, 0.08)` | Hover borders |
| `--border-strong` | `rgba(255, 255, 255, 0.1)` | Focus borders |

---

## Typography

### Font Stack

```css
/* Primary Font (Body & UI) */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Monospace Font (Code & Data) */
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Type Scale

| Element | Size | Weight | Line Height | Class |
|---------|------|--------|-------------|-------|
| Page Title | 1.875rem (30px) | 700 (Bold) | 1.2 | `text-3xl font-bold` |
| Section Title | 1.25rem (20px) | 700 (Bold) | 1.3 | `text-xl font-bold` |
| Card Title | 1.125rem (18px) | 600 (Semibold) | 1.4 | `text-lg font-semibold` |
| Body | 0.875rem (14px) | 400 (Regular) | 1.5 | `text-sm` |
| Small/Meta | 0.75rem (12px) | 400 (Regular) | 1.5 | `text-xs` |
| Code | 0.75rem (12px) | 400 (Regular) | 1.6 | `font-mono text-xs` |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Navigation, labels |
| Semibold | 600 | Card titles, buttons |
| Bold | 700 | Page titles, emphasis |

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--spacing-xs` | 0.25rem (4px) | `gap-1`, `p-1` | Tight spacing |
| `--spacing-sm` | 0.5rem (8px) | `gap-2`, `p-2` | Small gaps |
| `--spacing-md` | 1rem (16px) | `gap-4`, `p-4` | Default spacing |
| `--spacing-lg` | 1.5rem (24px) | `gap-6`, `p-6` | Card padding, section gaps |
| `--spacing-xl` | 2rem (32px) | `gap-8`, `p-8` | Large sections |
| `--spacing-2xl` | 3rem (48px) | `gap-12`, `p-12` | Page margins |

### Standard Patterns

| Element | Padding | Gap |
|---------|---------|-----|
| Cards | `p-6` (1.5rem) | - |
| Buttons | `px-6 py-3` | - |
| Small Buttons | `px-4 py-2` | - |
| Section Gaps | - | `gap-6` (1.5rem) |
| Inner Element Gaps | - | `gap-4` (1rem) |
| Tight Gaps | - | `gap-2` (0.5rem) |

### Grid System

```css
/* Stats Grid (4 columns) */
.grid.grid-cols-4.gap-6

/* Card Grid (3 columns) */
.grid.grid-cols-3.gap-6

/* List Layout (2 columns) */
.grid.grid-cols-2.gap-4

/* Responsive: Stack on mobile */
.grid.grid-cols-1.md:grid-cols-2.lg:grid-cols-4.gap-6
```

---

## Border Radius

### Radius Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--radius-sm` | 0.5rem (8px) | `rounded-lg` | Small elements, badges |
| `--radius-md` | 1rem (16px) | `rounded-2xl` | Buttons, icons, inputs |
| `--radius-lg` | 1.5rem (24px) | `rounded-3xl` | Cards, containers |
| `--radius-xl` | 2rem (32px) | `rounded-4xl` | Large modals |
| Full | 9999px | `rounded-full` | Pills, avatars |

### Component Mapping

| Component | Radius | Class |
|-----------|--------|-------|
| Main Cards | 1.5rem | `rounded-3xl` |
| Buttons | 1rem | `rounded-2xl` |
| Icon Containers | 1rem | `rounded-2xl` |
| Inputs | 1rem | `rounded-2xl` |
| Badges | 9999px | `rounded-full` |
| Small Elements | 0.5rem | `rounded-lg` |

---

## Shadows & Effects

### Neumorphic Shadows

The neumorphic effect uses dual shadows (dark + light) to create depth:

```css
/* Raised/Elevated (Default Cards) */
--shadow-neu-raised: 
    8px 8px 16px rgba(0, 0, 0, 0.6),
    -8px -8px 16px rgba(60, 60, 60, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

/* Raised Hover (Enhanced depth) */
--shadow-neu-raised-hover:
    12px 12px 24px rgba(0, 0, 0, 0.7),
    -12px -12px 24px rgba(60, 60, 60, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);

/* Pressed/Inset (Inputs, pressed states) */
--shadow-neu-pressed:
    inset 4px 4px 8px rgba(0, 0, 0, 0.5),
    inset -2px -2px 6px rgba(60, 60, 60, 0.1);

/* Flat (Minimal elevation) */
--shadow-neu-flat:
    4px 4px 8px rgba(0, 0, 0, 0.6),
    -2px -2px 6px rgba(60, 60, 60, 0.1);
```

### Accent Shadows (Coral Glow)

```css
/* Soft Glow */
--shadow-coral-soft: 0 8px 20px rgba(255, 139, 106, 0.3);

/* Medium Glow */
--shadow-coral-medium: 0 12px 30px rgba(255, 139, 106, 0.4);

/* Strong Glow */
--shadow-coral-strong: 0 0 40px rgba(255, 139, 106, 0.6);
```

### Glass Morphism

```css
/* Dark Glass (Headers, overlays) */
.glass-dark {
    background: rgba(42, 42, 42, 0.4);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.4),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

---

## Components

### Buttons

#### Primary Button (Coral Gradient)
```html
<button class="px-6 py-3 coral-gradient text-white font-semibold rounded-2xl smooth-transition shadow-lg">
    <i class="fas fa-plus mr-2"></i>Create New
</button>
```

**CSS:**
```css
.coral-gradient {
    background: linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%);
    box-shadow: 0 8px 20px rgba(255, 139, 106, 0.3);
}
.coral-gradient:hover {
    box-shadow: 0 12px 30px rgba(255, 139, 106, 0.4);
    transform: translateY(-2px);
}
```

#### Secondary Button (Neumorphic)
```html
<button class="px-6 py-3 neu-raised text-white font-medium rounded-2xl smooth-transition">
    <i class="fas fa-download mr-2"></i>Import
</button>
```

#### Ghost Button
```html
<button class="px-4 py-2 text-coral hover:text-coral-light smooth-transition text-sm font-semibold">
    Clear All
</button>
```

#### Icon Button
```html
<button class="w-12 h-12 coral-gradient rounded-2xl flex items-center justify-center smooth-transition text-white shadow-lg">
    <i class="fas fa-plus"></i>
</button>
```

### Cards

#### Raised Card (Default)
```html
<div class="neu-raised rounded-3xl p-6 smooth-transition">
    <!-- Content -->
</div>
```

#### Stats Card
```html
<div class="neu-raised rounded-3xl p-6 smooth-transition">
    <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 rounded-2xl icon-coral flex items-center justify-center shadow-lg">
            <i class="fas fa-chart-line text-white text-xl"></i>
        </div>
        <span class="w-2 h-2 bg-coral rounded-full pulse-glow"></span>
    </div>
    <div class="text-3xl font-bold text-coral mb-1">127</div>
    <div class="text-sm text-slate">Total Items</div>
</div>
```

#### Pressed Card (Inner Container)
```html
<div class="neu-pressed rounded-2xl p-4">
    <!-- Inset content -->
</div>
```

### Badges

```html
<!-- Status Badges -->
<span class="badge badge-coral">Active</span>
<span class="badge badge-green">Success</span>
<span class="badge badge-yellow">Pending</span>
<span class="badge badge-red">Critical</span>
<span class="badge badge-blue">Info</span>
<span class="badge badge-slate">Inactive</span>

<!-- Count Badge -->
<span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-500 text-white shadow-md">3</span>
```

**CSS:**
```css
.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
}
.badge-coral {
    background: rgba(255, 139, 106, 0.2);
    color: var(--coral);
    border-color: rgba(255, 139, 106, 0.3);
}
```

### Icon Containers

```html
<!-- Primary (Coral) -->
<div class="w-12 h-12 rounded-2xl icon-coral flex items-center justify-center shadow-lg">
    <i class="fas fa-heart text-white text-xl"></i>
</div>

<!-- Secondary (Slate) -->
<div class="w-12 h-12 rounded-2xl icon-slate flex items-center justify-center">
    <i class="fas fa-cog text-slate text-xl"></i>
</div>

<!-- Status Colors -->
<div class="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
    <i class="fas fa-check text-green-400 text-xl"></i>
</div>
```

### Form Elements

#### Text Input
```html
<input 
    type="text" 
    placeholder="Enter text..." 
    class="w-full neu-pressed rounded-2xl px-4 py-3 text-white focus:outline-none smooth-transition"
>
```

#### Search Input with Icon
```html
<div class="relative">
    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate"></i>
    <input 
        type="text" 
        placeholder="Search..." 
        class="w-full neu-pressed rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none smooth-transition"
    >
</div>
```

#### Toggle Switch
```html
<input type="checkbox" checked class="toggle-checkbox">
```

#### Checkbox
```html
<label class="flex items-center gap-3 text-slate hover:text-white cursor-pointer smooth-transition">
    <input type="checkbox" checked>
    <span>Option Label</span>
</label>
```

### Navigation

#### Sidebar Navigation Item (Active)
```html
<a href="#" class="coral-gradient rounded-2xl px-5 py-4 flex items-center gap-3 smooth-transition text-white">
    <i class="fas fa-home w-5"></i>
    <span class="font-medium">Dashboard</span>
    <div class="ml-auto w-2 h-2 rounded-full bg-white pulse-glow"></div>
</a>
```

#### Sidebar Navigation Item (Inactive)
```html
<a href="#" class="neu-raised rounded-2xl px-5 py-4 flex items-center gap-3 smooth-transition text-slate hover:text-white">
    <i class="fas fa-tasks w-5"></i>
    <span class="font-medium">Tasks</span>
</a>
```

---

## Animations

### Transition Timing

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `0.2s ease` | Quick feedback |
| `--transition-normal` | `0.3s ease` | Standard transitions |
| `--transition-slow` | `0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy, playful |

### Animation Classes

```css
/* Smooth transition for all properties */
.smooth-transition {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Heartbeat (Logo, important elements) */
.heartbeat {
    animation: heartbeat 2s ease-in-out infinite;
}

/* Pulse glow (Active indicators) */
.pulse-glow {
    animation: pulse-glow-coral 2s ease-in-out infinite;
}

/* Hover lift */
.hover-lift:hover {
    transform: translateY(-2px);
}

/* Hover scale */
.hover-scale:hover {
    transform: scale(1.05);
}
```

### Keyframe Definitions

```css
/* Heartbeat */
@keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
}

/* Pulse Glow */
@keyframes pulse-glow-coral {
    0%, 100% { box-shadow: 0 0 20px rgba(255, 139, 106, 0.3); }
    50% { box-shadow: 0 0 40px rgba(255, 139, 106, 0.6); }
}

/* Float (Background elements) */
@keyframes float-hex {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(5deg); }
    66% { transform: translateY(-10px) rotate(-5deg); }
}

/* Fade In */
@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Slide Up */
@keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
```

---

## Customization Guide

### Changing the Primary Brand Color

To rebrand from coral to your own color, update these CSS variables:

```css
:root {
    /* Replace coral with your brand color */
    --coral: #YOUR_PRIMARY_COLOR;
    --coral-light: #YOUR_LIGHTER_VARIANT;
    --coral-dark: #YOUR_DARKER_VARIANT;
    
    /* Update shadow colors */
    --shadow-coral-soft: rgba(YOUR_R, YOUR_G, YOUR_B, 0.3);
    --shadow-coral-medium: rgba(YOUR_R, YOUR_G, YOUR_B, 0.4);
    --shadow-coral-strong: rgba(YOUR_R, YOUR_G, YOUR_B, 0.6);
}
```

### Example: Blue Brand Theme

```css
:root {
    --coral: #3B82F6;        /* Blue-500 */
    --coral-light: #60A5FA;  /* Blue-400 */
    --coral-dark: #2563EB;   /* Blue-600 */
    
    --shadow-coral-soft: rgba(59, 130, 246, 0.3);
    --shadow-coral-medium: rgba(59, 130, 246, 0.4);
    --shadow-coral-strong: rgba(59, 130, 246, 0.6);
}
```

### Example: Green Brand Theme

```css
:root {
    --coral: #10B981;        /* Emerald-500 */
    --coral-light: #34D399;  /* Emerald-400 */
    --coral-dark: #059669;   /* Emerald-600 */
    
    --shadow-coral-soft: rgba(16, 185, 129, 0.3);
    --shadow-coral-medium: rgba(16, 185, 129, 0.4);
    --shadow-coral-strong: rgba(16, 185, 129, 0.6);
}
```

### Example: Purple Brand Theme

```css
:root {
    --coral: #8B5CF6;        /* Violet-500 */
    --coral-light: #A78BFA;  /* Violet-400 */
    --coral-dark: #7C3AED;   /* Violet-600 */
    
    --shadow-coral-soft: rgba(139, 92, 246, 0.3);
    --shadow-coral-medium: rgba(139, 92, 246, 0.4);
    --shadow-coral-strong: rgba(139, 92, 246, 0.6);
}
```

### Tailwind Config Updates

When changing brand colors, also update `tailwind.config.ts`:

```typescript
colors: {
    coral: {
        DEFAULT: '#YOUR_PRIMARY_COLOR',
        light: '#YOUR_LIGHTER_VARIANT',
        dark: '#YOUR_DARKER_VARIANT',
    },
}
```

---

## Implementation

### Required Dependencies

```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Font Awesome Icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### NPM Packages (for Next.js/React)

```bash
# Fonts
npm install @fontsource/inter @fontsource/jetbrains-mono

# Icons (alternative to Font Awesome)
npm install lucide-react

# Tailwind plugins
npm install tailwindcss-animate
```

### Basic Page Template

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your App - Page Title</title>
    
    <!-- Dependencies -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    
    <!-- Your theme CSS -->
    <link rel="stylesheet" href="path/to/theme.css">
</head>
<body class="antialiased">
    <!-- Floating Background -->
    <div class="hexagon-bg">
        <div class="hexagon hex-1"></div>
        <div class="hexagon hex-2"></div>
        <div class="hexagon hex-3"></div>
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2 bubble-coral"></div>
    </div>

    <!-- Content Wrapper -->
    <div class="content-wrapper">
        <!-- Your page content -->
    </div>
</body>
</html>
```

### Z-Index Layers

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Background | -1 | Floating hexagons, bubbles |
| Content | 1 | Main page content |
| Header | 50 | Sticky headers |
| Overlay | 100 | Backdrops, overlays |
| Modal | 200 | Modals, command palette |

---

## Quick Reference

### Color Tokens Cheat Sheet

```
Background:     #1A1A1A (--dark)
Surface:        #2A2A2A (--dark-card)
Primary:        #FF8B6A (--coral)
Secondary:      #8B8B8B (--slate)
Text:           #E5E5E5 (--text-primary)
Success:        #4ADE80 (--accent-green)
Warning:        #FBBF24 (--accent-yellow)
Error:          #EF4444 (--accent-red)
Info:           #60A5FA (--accent-blue)
```

### Component Classes Cheat Sheet

```
Cards:          neu-raised rounded-3xl p-6
Buttons:        coral-gradient rounded-2xl px-6 py-3
Inputs:         neu-pressed rounded-2xl px-4 py-3
Icons:          icon-coral rounded-2xl w-12 h-12
Badges:         badge badge-coral
Transitions:    smooth-transition
```

### Spacing Cheat Sheet

```
Card Padding:   p-6 (1.5rem)
Section Gap:    gap-6 (1.5rem)
Element Gap:    gap-4 (1rem)
Button Padding: px-6 py-3
Small Button:   px-4 py-2
```

---

## File References

| File | Purpose |
|------|---------|
| `theme/theme.css` | Complete CSS with all styles |
| `theme/THEME_GUIDE.md` | Detailed usage guide |
| `theme/COMPONENTS_REFERENCE.md` | Copy-paste components |
| `theme/QUICK_REFERENCE.md` | Quick lookup cheat sheet |
| `apps/web/tailwind.config.ts` | Tailwind configuration |
| `apps/web/app/globals.css` | Next.js global styles |

---

**Created for:** ProjectPulse Design System  
**Last Updated:** December 2024
