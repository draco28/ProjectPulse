# ProjectPulse Theme - Quick Reference

## 🎯 Essential Info for Claude Code

### Files Location
- **Theme CSS**: `theme/theme.css`
- **Tailwind Config**: `theme/tailwind.config.js`
- **Full Guide**: `theme/THEME_GUIDE.md`
- **Components**: `theme/COMPONENTS_REFERENCE.md`
- **Reference Mockups**: `mockups/Default theme/`

---

## 🎨 Color Codes

| Color | Hex | Usage |
|-------|-----|-------|
| Dark | `#1A1A1A` | Background |
| Dark Card | `#2A2A2A` | Cards, containers |
| Coral | `#FF8B6A` | Primary actions, active states |
| Slate | `#8B8B8B` | Secondary text, icons |
| Green | `#4ADE80` | Success, completed |
| Red | `#EF4444` | Error, critical |
| Yellow | `#FBBF24` | Warning |
| Blue | `#60A5FA` | Info |

---

## 🧱 Border Radius Guide

| Element | Radius | Class |
|---------|--------|-------|
| Main Cards | 1.5rem | `rounded-3xl` |
| Buttons | 1rem | `rounded-2xl` |
| Icons/Badges | 0.75rem | `rounded-xl` |
| Small Elements | 0.5rem | `rounded-lg` |

---

## 📦 Component Classes Quick Lookup

### Cards & Containers
```css
.neu-raised      /* Main cards (elevated) */
.neu-pressed     /* Input fields, inner containers */
.glass-dark      /* Transparent headers */
```

### Buttons
```css
.coral-gradient  /* Primary action button */
.neu-raised      /* Secondary button */
```

### Icons
```css
.icon-coral      /* Primary/active icons */
.icon-slate      /* Secondary/inactive icons */
```

### Badges
```css
.badge-coral     /* Active status */
.badge-green     /* Success status */
.badge-red       /* Critical status */
.badge-yellow    /* Warning status */
.badge-slate     /* Inactive status */
```

### Animations
```css
.smooth-transition  /* All interactive elements */
.heartbeat         /* Logo animations */
.pulse-glow        /* Active indicators */
.hover-lift        /* Hover state */
```

---

## 📐 Standard Spacing

| Purpose | Class | Value |
|---------|-------|-------|
| Card Padding | `p-6` | 1.5rem |
| Section Gaps | `gap-6` | 1.5rem |
| Inner Gaps | `gap-4` | 1rem |
| Small Gaps | `gap-2` | 0.5rem |

---

## 🎭 Common Patterns

### Page Structure
```
1. Floating background (hexagons + bubbles)
2. Content wrapper
3. Layout (sidebar or header)
4. Main content
```

### Interactive Element
```
1. neu-raised base
2. smooth-transition
3. hover state
4. Icon + text
```

### Card Structure
```
1. neu-raised container
2. Header with icon/title
3. Content
4. Actions (buttons)
```

---

## ✅ Pre-Flight Checklist

Before creating a page, ensure:
- [ ] `theme.css` linked
- [ ] Tailwind CDN included
- [ ] Font Awesome loaded
- [ ] Google Fonts (Inter + JetBrains Mono)
- [ ] Tailwind config inline
- [ ] Floating background added
- [ ] Content wrapper div
- [ ] All interactive elements have `smooth-transition`
- [ ] Consistent border radius
- [ ] Proper color usage

---

## 🚨 Common Mistakes

❌ Forgetting floating background
❌ Using wrong border radius
❌ Missing smooth-transition class
❌ Inconsistent color usage
❌ No hover states

✅ Always check mockup files!

---

## 💡 When in Doubt

1. **Check the mockups** in `mockups/Default theme/`
2. **Copy components** from `COMPONENTS_REFERENCE.md`
3. **Read full guide** in `THEME_GUIDE.md`
4. **Match colors exactly** from this quick reference

---

## 🔗 Essential Links

```html
<!-- Tailwind CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<!-- Theme CSS -->
<link rel="stylesheet" href="../theme/theme.css">
```

---

## 🎯 Most Used Components

1. **neu-raised card** with `rounded-3xl p-6`
2. **coral-gradient button** with icon
3. **icon-coral** container with emoji/icon
4. **badge-coral** for status
5. **input** with neu-pressed style

Copy these from `COMPONENTS_REFERENCE.md`!

---

## 📱 Responsive Note

Mobile: Hexagons hidden, simplified shadows
Desktop: Full effects enabled

---

## 🎨 Typography Scale

| Element | Class | Size |
|---------|-------|------|
| Page Title | `text-3xl font-bold` | 1.875rem |
| Section Title | `text-xl font-bold` | 1.25rem |
| Body | `text-sm` | 0.875rem |
| Meta/Small | `text-xs` | 0.75rem |
| Code | `font-mono text-xs` | 0.75rem |

---

## ⚡ Ready to Build!

Everything you need is in this folder. Start with a mockup, copy components, and create pixel-perfect pages!
