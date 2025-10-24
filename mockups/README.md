# ProjectPulse UI Mockups & Design System

**Status:** ✅ Design Direction Finalized  
**Theme:** Neon Brights (Cyberpunk Aesthetic)  
**Last Updated:** October 24, 2025

---

## 🎨 Quick Start

### View the Design
1. **Open:** `01-dashboard-neon.html` in your browser
2. **See:** The complete neon aesthetic with pulse animations
3. **Compare:** Original blue theme in `01-dashboard.html`

### Read the Documentation
- **`DESIGN_DIRECTION.md`** ⭐ Complete design system specification
- **`SUMMARY.md`** - Overview and implementation roadmap
- **`DESIGN_BRAINSTORM.md`** - Original brainstorming (archived)

---

## 📁 Mockup Files

### ⭐ Current Design (Neon Brights)
**`01-dashboard-neon.html`** - Main dashboard with neon colors
- Deep purple-black background
- Hot pink accents (#FF0080)
- Neon purple, cyan highlights
- Pulse animations on active elements
- Glow effects on hover
- Inter font family

### Original Design (Blue - Archived)
- `01-dashboard.html` - Dashboard (blue theme)
- `02-issues.html` - Issue tracker with filters
- `03-knowledge.html` - Knowledge base with hybrid search
- `07-command-palette.html` - ⌘K command interface

---

## 🔄 Integration Status

**Status:** ✅ **Fully Integrated into Development Workflow**

The neon design system has been integrated into the ProjectPulse development plan with a 3-track workflow:

- **Track 1:** Backend/API (Priority 1) - Database, API routes, business logic
- **Track 2:** Frontend/UI (Priority 2) - Design system, components, pages
- **Track 3:** Integration (Continuous) - Connect UI to API, E2E testing

### Documentation References

- **[../docs/04-UI-ARCHITECTURE.md](../docs/04-UI-ARCHITECTURE.md)** - Complete UI specification with Tailwind config, component roadmap, and page implementation guides
- **[../docs/WORKFLOW_ARCHITECTURE.md](../docs/WORKFLOW_ARCHITECTURE.md)** - 3-track development workflow with branch strategy and quality gates
- **[../docs/DEVELOPMENT_PLAN.md](../docs/DEVELOPMENT_PLAN.md)** - Updated with UI sections, Week 1 Day 3 design system setup, and Week 2 UI pages

### Page-to-Week Mapping

| Mockup File | Page Name | Implementation Week | Development Track | Features |
|-------------|-----------|---------------------|-------------------|----------|
| `01-dashboard-neon.html` | Dashboard | Week 2 | Frontend (parallel) | Stats cards, activity timeline, quick actions, pulse indicators |
| `02-issues.html` | Issues / Kanban | Week 2 | Frontend (parallel) | Kanban board, drag-and-drop, priority colors, filters |
| `07-command-palette.html` | Command Palette (⌘K) | Week 2 | Frontend (parallel) | Keyboard shortcuts, grouped commands, fuzzy search |
| `03-knowledge.html` | Knowledge Base | Week 3 | Frontend (parallel) | Document library, hybrid search, category organization |
| `05-wiki.html` | Wiki Hub | Week 3 | Frontend (parallel) | TOC, sidebar nav, code blocks, callouts, breadcrumbs |
| `06-agent-personas.html` | Agent Personas | Week 4 | Frontend + MCP | Activate/deactivate agents, breathing animation, performance metrics |
| `04-security.html` | Security Dashboard | Week 5+ | Frontend + Backend | Vulnerability tracking, scanner status, compliance badges |

### Implementation Timeline

**Week 1 Day 3 (Parallel):** Design System Setup
- Install fonts (Inter, JetBrains Mono)
- Configure Tailwind with neon theme
- Create base components (Button, Card, Input, Badge)
- Build UI showcase page

**Week 2:** Core UI Pages (Dashboard, Issues, Command Palette)
- Implement with mock data initially
- Connect to backend APIs as they become available
- Focus on neon styling and pulse animations

**Week 3-4:** Advanced Pages (Knowledge Base, Wiki, Agent Personas)
- Knowledge Base with hybrid search integration
- Wiki with markdown rendering
- Agent Personas with MCP integration

**Week 5+:** Security Dashboard & Polish
- Security features with backend integration
- Performance optimization
- Accessibility audit

---

## 🌈 Design System Overview

### Color Palette - Neon Brights

```css
/* Backgrounds */
#0A0118  /* Darkest - Pure dark purple-black */
#150828  /* Dark - Base background */
#1F0D3A  /* Medium - Cards, surfaces */
#2A1548  /* Light - Hover states */

/* Neon Accents */
#FF0080  /* Hot Pink - Primary brand color */
#B721FF  /* Neon Purple - Secondary accent */
#00F5FF  /* Cyan - Tertiary/focus states */
#21D4FD  /* Electric Blue */
#E91E63  /* Magenta */

/* Gradients */
linear-gradient(135deg, #FF0080 0%, #FF4D6D 50%, #FF8C42 100%)  /* Hero */
linear-gradient(135deg, #B721FF 0%, #FF0080 100%)               /* Secondary */

/* Text */
#FFFFFF  /* Primary */
#E0B3FF  /* Secondary - Light purple */
#9D7FB8  /* Tertiary - Medium purple */
#6B5B7A  /* Muted - Dark purple */
```

### Typography

**Fonts:**
- **UI:** Inter (400, 500, 600, 700)
- **Code:** JetBrains Mono (400, 500, 600)

**Scale:**
```
12px - Labels, captions
14px - Small body text
16px - Default body
18px - Large body
20px - Subheadings
24px - Card headings
30px - Section headings
36px - Page headings
48px - Hero headings
```

### Spacing (4px base)
```
4px  - xs   8px  - sm   12px - md
16px - lg   24px - xl   32px - 2xl
48px - 3xl  64px - 4xl
```

### Border Radius
```
4px  - Small     8px  - Medium    12px - Large
16px - XLarge    24px - 2XLarge   9999px - Pill
```

---

## 💫 Key Features

### 1. Pulse Animations
**Real-time activity indicators:**
- Heartbeat animation (2s infinite)
- Glow pulse on active elements
- Ripple pulse for notifications

**Usage:**
```html
<div class="pulse-indicator">
  <div class="pulse-dot"></div>
  <div class="pulse-ring"></div>
</div>
```

### 2. Glow Effects
**Interactive element highlighting:**
- Pink glow on primary actions
- Purple glow on secondary actions
- Cyan glow on focus states

**Usage:**
```css
.button:hover {
  box-shadow: 0 0 20px rgba(255, 0, 128, 0.6);
}
```

### 3. Neon Borders
**Distinctive card styling:**
```css
border: 1px solid rgba(255, 0, 128, 0.3);
```

### 4. Agent Persona Colors
Each AI agent has a unique neon color:
- 🔍 Code Reviewer - Cyan (#00F5FF)
- 🐛 Bug Hunter - Purple (#B721FF)
- 🏗️ Feature Architect - Purple (#B721FF)
- 🛡️ Security Auditor - Yellow (#FFD600)
- ✅ Tester - Green (#00FF88)

---

## 🎯 Design Principles

### Bold & Distinctive
Neon aesthetic makes ProjectPulse instantly recognizable. No conservative blues - we go bold with pink, purple, and cyan.

### Pulse-Driven
Active elements pulse like a heartbeat. Reinforces the brand name and shows real-time activity.

### Fast & Responsive
Animations are quick (200ms default). Everything feels snappy and responsive.

### Keyboard-First
Raycast-inspired command palette (⌘K), navigation shortcuts, and power-user features.

### Accessible
- WCAG AA compliant (7:1+ contrast)
- Focus indicators on all interactive elements
- Keyboard navigation support
- Reduced motion support
- Screen reader friendly

---

## 📊 Component Library

### Buttons
```html
<!-- Primary -->
<button class="pulse-gradient text-white px-6 py-3 rounded-lg font-semibold">
  Primary Action
</button>

<!-- Secondary -->
<button class="bg-transparent border-2 border-neon-pink text-neon-pink px-6 py-3 rounded-lg">
  Secondary
</button>

<!-- Ghost -->
<button class="bg-transparent text-text-secondary hover:text-neon-pink">
  Ghost
</button>
```

### Cards
```html
<div class="bg-background-medium rounded-xl neon-border p-6 card-hover">
  Card content
</div>
```

### Inputs
```html
<input 
  type="text" 
  class="bg-background-medium border-2 border-background-light rounded-lg px-4 py-3
         focus:border-neon-cyan focus:outline-none"
  placeholder="Search..."
>
```

### Badges
```html
<span class="bg-neon-pink/20 text-neon-pink px-3 py-1 rounded-full text-xs font-semibold border border-neon-pink/30">
  Critical
</span>
```

---

## 🔍 Priority System

Visual priority indicators using neon colors:

| Priority | Color | Background | Border | Glow |
|----------|-------|------------|--------|------|
| Critical | Red (#FF0055) | `bg-red-500/20` | `border-red-500/30` | Red glow |
| High | Yellow (#FFD600) | `bg-yellow-400/20` | `border-yellow-400/30` | Yellow glow |
| Medium | Cyan (#00D4FF) | `bg-cyan-500/20` | `border-cyan-500/30` | Cyan glow |
| Low | Purple (#9D7FB8) | `bg-purple-500/20` | `border-purple-500/30` | Purple glow |

---

## 🎨 Module/Category Colors

Color-coding for different modules:

| Module | Color | Example |
|--------|-------|---------|
| Combat | Hot Pink (#FF0080) | `bg-neon-pink/20 text-neon-pink` |
| Animation | Neon Purple (#B721FF) | `bg-neon-purple/20 text-neon-purple` |
| Core | Neon Green (#00FF88) | `bg-green-400/20 text-green-400` |
| UI | Coral Pink (#FF4D6D) | `bg-pink-400/20 text-pink-400` |
| Networking | Electric Blue (#21D4FD) | `bg-blue-400/20 text-blue-400` |
| Security | Bright Yellow (#FFD600) | `bg-yellow-400/20 text-yellow-400` |

---

## 🚀 Implementation Guide

### Step 1: Install Dependencies
```bash
npm install @fontsource/inter @fontsource/jetbrains-mono
```

### Step 2: Configure Tailwind
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: {
          darkest: '#0A0118',
          dark: '#150828',
          medium: '#1F0D3A',
          light: '#2A1548',
        },
        neon: {
          pink: '#FF0080',
          purple: '#B721FF',
          cyan: '#00F5FF',
        },
        // ... see DESIGN_DIRECTION.md for complete config
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}
```

### Step 3: Import Fonts
```tsx
// app/layout.tsx
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
```

### Step 4: Build Components
Use shadcn/ui as base, customize with neon colors and glow effects.

---

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Mobile Adaptations
- Sidebar collapses to hamburger menu
- Grid layouts stack vertically
- Touch-friendly button sizes (44px min)
- Reduced glow effects (performance)

---

## ♿ Accessibility Checklist

- [x] Color contrast meets WCAG AA (7:1+ for text)
- [x] Focus indicators on all interactive elements
- [x] Keyboard navigation support
- [x] Semantic HTML structure
- [x] ARIA labels where needed
- [x] Alt text for images
- [x] Reduced motion support
- [x] Screen reader friendly

---

## 🎯 Next Steps

### Phase 1: Foundation (Week 1)
1. Set up Tailwind with custom config
2. Install fonts
3. Create base components (Button, Card, Input)
4. Implement animations (pulse, glow)

### Phase 2: Core Components (Week 2)
5. Build sidebar navigation
6. Create command palette (⌘K)
7. Implement search bar
8. Build stat cards
9. Create issue cards

### Phase 3: Pages (Week 3-4)
10. Dashboard page
11. Issues page with filters
12. Knowledge base with search
13. Wiki pages
14. Security dashboard
15. Settings page

### Phase 4: Advanced Features (Week 5+)
16. Agent persona system
17. Real-time activity feed
18. Pulse animations everywhere
19. Keyboard shortcuts
20. Mobile optimization

---

## 📚 Documentation Links

- **`DESIGN_DIRECTION.md`** - Complete design system specification (colors, typography, components, animations)
- **`SUMMARY.md`** - Quick overview and implementation roadmap
- **`DESIGN_BRAINSTORM.md`** - Original brainstorming notes (archived)
- **`../docs/01-ARCHITECTURE.md`** - Technical architecture
- **`../docs/02-DATABASE-SCHEMA.md`** - Database design

---

## 💡 Tips & Best Practices

### Do's ✅
- Use neon glow effects on interactive elements
- Keep animations fast (200ms)
- Use pulse indicators for real-time activity
- Maintain high contrast
- Test with keyboard navigation

### Don'ts ❌
- Overuse gradients (reserve for hero sections)
- Make everything glow (loses impact)
- Use slow animations
- Sacrifice readability for style
- Ignore accessibility

---

## 🎨 Brand Assets

### Logo Concept
- Icon: Heartbeat/pulse wave in neon pink gradient
- Text: "ProjectPulse" in Inter Bold
- Colors: Pink-to-purple gradient

### Tagline Options
- "Your Project's Heartbeat"
- "Feel the Pulse of Development"
- "AI-Powered Dev Hub"

---

## 🔧 Troubleshooting

### Fonts not loading?
Make sure to import from Google Fonts or install via npm:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Glows not showing?
Check that Tailwind includes custom shadows in config:
```js
boxShadow: {
  'glow-pink': '0 0 20px rgba(255, 0, 128, 0.6)',
}
```

### Animations not working?
Ensure keyframes are defined in global CSS or Tailwind config.

---

## 📞 Questions?

Review the comprehensive design documentation in `DESIGN_DIRECTION.md` or check out the live mockup in `01-dashboard-neon.html`!

**Ready to build?** Start with Tailwind configuration and base components! 🚀
