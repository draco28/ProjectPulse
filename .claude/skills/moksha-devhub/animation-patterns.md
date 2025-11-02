---
name: moksha-animation-patterns
description: Animation patterns and keyframe definitions for ProjectPulse Dark Neumorphic Coral theme. Use for Step 3 of ui-generation-workflow to define micro-interactions before implementation.
triggers: ['animation', 'interaction', 'transition', 'micro-interaction']
token_estimate: 180
last_updated: 2025-10-27
related_docs:
  - ./ui-generation-workflow.md
  - ../../theme/theme.css
  - ../../theme/THEME_GUIDE.md
---

# Animation Patterns for Dark Neumorphic Coral

**Purpose**: Define animations in simple text format for Step 3 of [ui-generation-workflow.md](./ui-generation-workflow.md)

---

## Standard Animation Classes

These are pre-built in `theme/theme.css`:

```css
.smooth-transition {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.heartbeat {
  animation: heartbeat 1.5s ease-in-out infinite;
}

.hover-lift {
  /* Applied via hover:transform hover:-translate-y-1 */
}

.hover-scale {
  /* Applied via hover:scale-105 */
}
```

---

## Animation Definition Template

**Simple Format**:

```
Element: [What element to animate]
Keyframes:
  - Start: [Initial state]
  - End: [Final state]
Trigger: [What triggers the animation]
Duration: [How long it takes]
Easing: [cubic-bezier or ease keyword]
```

**Example**:

```
Element: Issue cards (.neu-raised)
Keyframes:
  - Start: translateY(0), shadow-neu-float
  - End: translateY(-4px), shadow-neu-float-elevated
Trigger: hover
Duration: 200ms
Easing: ease-out
```

---

## Standard Patterns

### 1. Card Hover (Lift Effect)

**Element**: Cards, navigation items, buttons with `.neu-raised`

**Keyframes**:

- Start: `translateY(0)`, `shadow: 8px 8px 16px rgba(0, 0, 0, 0.4)`
- End: `translateY(-4px)`, `shadow: 12px 12px 24px rgba(0, 0, 0, 0.5)`

**Trigger**: hover

**Tailwind Classes**:

```html
<div class="neu-raised smooth-transition hover:transform hover:-translate-y-1"></div>
```

**Use Cases**:

- Issue cards
- Knowledge article cards
- Dashboard stat cards
- Navigation items

---

### 2. Button Press (Inset Effect)

**Element**: Buttons with `.neu-pressed` or primary buttons

**Keyframes**:

- Start: `scale(1)`, `shadow: normal`
- End: `scale(0.98)`, `shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.3)`

**Trigger**: active (click/press)

**Tailwind Classes**:

```html
<button class="coral-gradient smooth-transition active:scale-98"></button>
```

**Use Cases**:

- Primary action buttons
- Submit buttons
- Toggle buttons

---

### 3. Pulse Glow (Active Indicator)

**Element**: Active state indicators, status dots

**Keyframes**:

- 0%: `opacity(0.5)`, `scale(1)`
- 50%: `opacity(1)`, `scale(1.2)`
- 100%: `opacity(0.5)`, `scale(1)`

**Trigger**: auto (continuous loop)

**Tailwind Classes**:

```html
<span class="w-2 h-2 bg-coral rounded-full pulse-glow"></span>
```

**Use Cases**:

- Active agent indicators
- Live status dots
- Real-time notifications
- Active navigation item indicators

---

### 4. Heartbeat (Logo Animation)

**Element**: Logo, important icons

**Keyframes**:

- 0%, 100%: `scale(1)`
- 14%: `scale(1.15)`
- 28%: `scale(1)`
- 42%: `scale(1.1)`
- 70%: `scale(1)`

**Trigger**: auto (continuous loop)

**Tailwind Classes**:

```html
<i class="fas fa-heartbeat heartbeat"></i>
```

**Use Cases**:

- Logo (ProjectPulse heart icon)
- Health status indicators
- Critical alerts

---

### 5. Fade In (Page Load)

**Element**: Content containers, modals

**Keyframes**:

- Start: `opacity(0)`, `translateY(10px)`
- End: `opacity(1)`, `translateY(0)`

**Trigger**: mount/load

**Tailwind Classes**:

```html
<div class="animate-fade-in">
  <!-- Requires custom animation in tailwind.config.js -->
</div>
```

**Use Cases**:

- Page content on load
- Modal/dialog appearance
- New items in lists

---

### 6. Slide In (Sidebar, Modals)

**Element**: Sidebars, slide-out panels, command palette

**Keyframes**:

- Start: `translateX(-100%)`, `opacity(0)`
- End: `translateX(0)`, `opacity(1)`

**Trigger**: open/toggle

**Tailwind Classes**:

```html
<aside
  class="transition-transform duration-300 -translate-x-full data-[open]:translate-x-0"
></aside>
```

**Use Cases**:

- Sidebar toggle
- Command palette
- Filter panel slide-in

---

### 7. Icon Hover (Scale + Color)

**Element**: Icons in buttons, nav items

**Keyframes**:

- Start: `scale(1)`, `color: slate`
- End: `scale(1.1)`, `color: coral`

**Trigger**: hover (parent hover)

**Tailwind Classes**:

```html
<button class="group smooth-transition">
  <i
    class="fas fa-plus text-slate group-hover:text-coral group-hover:scale-110 smooth-transition"
  ></i>
</button>
```

**Use Cases**:

- Navigation icons
- Action button icons
- Tool icons

---

### 8. Loading Spinner

**Element**: Loading indicators

**Keyframes**:

- 0°: `rotate(0deg)`
- 360°: `rotate(360deg)`

**Trigger**: loading state

**Tailwind Classes**:

```html
<i class="fas fa-spinner animate-spin text-coral"></i>
```

**Use Cases**:

- Loading states
- Processing indicators
- Async operation feedback

---

### 9. Badge Entrance

**Element**: Badges, notifications, counts

**Keyframes**:

- Start: `scale(0)`, `opacity(0)`
- End: `scale(1)`, `opacity(1)`

**Trigger**: mount/new item

**Tailwind Classes**:

```html
<span class="badge badge-red animate-scale-in"> 3 </span>
```

**Use Cases**:

- Notification badges
- New message counts
- Alert indicators

---

### 10. Coral Glow (Primary Elements)

**Element**: Primary buttons, CTAs, active elements

**Keyframes**:

- 0%, 100%: `box-shadow: 0 0 20px rgba(255, 139, 106, 0.3)`
- 50%: `box-shadow: 0 0 30px rgba(255, 139, 106, 0.5)`

**Trigger**: hover or auto (for CTAs)

**Tailwind Classes**:

```html
<button class="coral-gradient shadow-lg hover:shadow-coral-glow smooth-transition"></button>
```

**Use Cases**:

- Primary action buttons
- Important CTAs
- Active state highlights

---

## Trigger Patterns

| Trigger   | When to Use                 | Example                  |
| --------- | --------------------------- | ------------------------ |
| `hover`   | User hovers over element    | Card lift, icon scale    |
| `active`  | User clicks/presses         | Button press effect      |
| `focus`   | Input/button receives focus | Input highlight, outline |
| `auto`    | Always animating            | Pulse glow, heartbeat    |
| `mount`   | Element appears             | Fade in, scale in        |
| `toggle`  | State change                | Sidebar open/close       |
| `loading` | Async operation             | Spinner, skeleton        |

---

## Duration Guidelines

| Duration | Use Case             | Feel       |
| -------- | -------------------- | ---------- |
| 100ms    | Micro-interactions   | Instant    |
| 200ms    | Standard transitions | Snappy     |
| 300ms    | Slide/fade effects   | Smooth     |
| 500ms    | Page transitions     | Deliberate |
| 1000ms+  | Continuous loops     | Ambient    |

---

## Easing Functions

```css
/* Smooth (most common) */
cubic-bezier(0.4, 0, 0.2, 1)

/* Ease-out (lift effects) */
cubic-bezier(0, 0, 0.2, 1)

/* Ease-in (exit effects) */
cubic-bezier(0.4, 0, 1, 1)

/* Bounce (playful) */
cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## Complex Animation Example

**Scenario**: New issue card appears in list

```
Animation Plan:

1. Container Fade In
   Element: Issue card container
   Keyframes:
     - 0%: opacity(0), translateY(20px)
     - 100%: opacity(1), translateY(0)
   Trigger: mount
   Duration: 300ms
   Easing: ease-out

2. Badge Scale In (staggered)
   Element: Priority and status badges
   Keyframes:
     - 0%: scale(0), opacity(0)
     - 100%: scale(1), opacity(1)
   Trigger: mount (delay: 150ms after container)
   Duration: 200ms
   Easing: bounce

3. Hover State
   Element: Entire card
   Keyframes:
     - Start: translateY(0), shadow-normal
     - End: translateY(-4px), shadow-elevated
   Trigger: hover
   Duration: 200ms
   Easing: ease-out
```

**Implementation**:

```html
<div class="issue-card opacity-0 animate-fade-in">
  <span class="badge badge-red opacity-0 animate-scale-in delay-150"> Critical </span>
  <div class="neu-raised smooth-transition hover:-translate-y-1">
    <!-- Card content -->
  </div>
</div>
```

---

## Integration with Theme Classes

**Always use these base classes**:

- `smooth-transition` - On all interactive elements
- Hover states: `hover:transform hover:-translate-y-1`
- Active states: `active:scale-98`
- Focus states: `focus:outline-none focus:ring-2 focus:ring-coral`

**Avoid**:

- ❌ Abrupt changes without transitions
- ❌ Too many simultaneous animations
- ❌ Animations longer than 500ms (except loops)
- ❌ Animations on every element (use sparingly)

---

## Quick Reference

| Pattern   | Element    | Class                  | Use       |
| --------- | ---------- | ---------------------- | --------- |
| Lift      | Cards      | `hover:-translate-y-1` | Elevation |
| Press     | Buttons    | `active:scale-98`      | Feedback  |
| Pulse     | Indicators | `pulse-glow`           | Activity  |
| Heartbeat | Logo       | `heartbeat`            | Branding  |
| Fade      | Content    | `animate-fade-in`      | Entrance  |
| Glow      | Primary    | `shadow-coral-glow`    | Emphasis  |

---

**Token Cost**: ~180 tokens
**Usage**: Step 3 of ui-generation-workflow.md
**Next Step**: Once animations defined → Step 4 (Implementation)
