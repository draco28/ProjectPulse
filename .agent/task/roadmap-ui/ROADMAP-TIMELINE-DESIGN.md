# Roadmap UI - Timeline/Gantt View Design

## Overview

Horizontal timeline visualization showing phases, sprints, and weeks with progress bars and status colors.

---

## Visual Design

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Roadmap                                    [🌲 Tree] [📊 Timeline]         │
├────────────────────────────────────────────────────────────────────────────┤
│ Legend: ■ Not Started  ■ In Progress  ■ Completed  ■ Blocked              │
├────────────────────────────────────────────────────────────────────────────┤
│            │ Nov 2024  │ Dec 2024  │ Jan 2025  │ Feb 2025  │ Mar 2025 │    │
│            │  W1 W2 W3 W4 │ W5 W6 W7 W8 │ W9 W10 W11 W12 │ ...        │    │
├────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 1    │ ████████████████████████                                    │
│ Foundation │ ░░░░░░░░░░████████████████                                  │ 50%
│            │                                                              │
│  Sprint 1  │ ████████████                                                │ 100%
│  Sprint 2  │             ████████████                                    │ 75%
│  Sprint 3  │                         ████████                            │ 0%
├────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 2    │                         ████████████████████████████        │
│ API Dev    │                         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░        │ 0%
│            │                                                              │
│  Sprint 4  │                         ████████████                        │ 0%
│  Sprint 5  │                                     ████████████            │ 0%
└────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### RoadmapTimeline.tsx

Main container component.

```tsx
interface RoadmapTimelineProps {
  phases: RoadmapPhase[];
  startDate: Date;
  endDate: Date;
  currentPosition?: {
    phaseId: string;
    sprintId?: string;
  };
  onItemClick?: (type: 'phase' | 'sprint', id: string) => void;
}
```

**Responsibilities**:
- Calculate date range from roadmap data
- Render TimelineHeader
- Render TimelineRow for each phase/sprint
- Handle scroll synchronization
- Handle zoom level changes

### TimelineHeader.tsx

Date scale header.

```tsx
interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  zoomLevel: 'month' | 'week' | 'day';
  totalWidth: number;
}
```

**Renders**:
- Month labels (primary row)
- Week numbers (secondary row, if zoom allows)
- Vertical grid lines

### TimelineRow.tsx

Single row for phase or sprint.

```tsx
interface TimelineRowProps {
  type: 'phase' | 'sprint';
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: Status;
  isNested?: boolean;  // Sprint rows are nested under phase
  onClick?: () => void;
}
```

**Layout**:
- Left column: Title + metadata
- Right column: TimelineBar positioned on date scale

### TimelineBar.tsx

Horizontal progress bar.

```tsx
interface TimelineBarProps {
  startDate: Date;
  endDate: Date;
  progress: number;  // 0-100
  status: Status;
  timelineStart: Date;  // For calculating position
  totalDays: number;    // For calculating width
  onClick?: () => void;
}
```

**Visual**:
- Background bar (full duration, light color)
- Progress bar (inner, darker color based on status)
- Rounded corners
- Hover tooltip

### TimelineTooltip.tsx

Hover details tooltip.

```tsx
interface TimelineTooltipProps {
  title: string;
  startDate: Date;
  endDate: Date;
  duration: string;  // "4 weeks"
  progress: number;
  status: Status;
  goals?: string[];
}
```

### TimelineLegend.tsx

Status color legend.

```tsx
interface TimelineLegendProps {
  className?: string;
}
```

---

## Layout Specifications

### Container
- Min width: 800px
- Horizontal scroll enabled
- Fixed left column (200px) for labels
- Scrollable right area for timeline

### Header
- Height: 60px
- Month labels: 16px font, bold
- Week labels: 12px font, regular
- Grid lines: 1px solid slate-200

### Rows
- Phase row height: 60px
- Sprint row height: 40px
- Row padding: 8px vertical
- Nested indent: 24px

### Bars
- Height: 24px (phase), 16px (sprint)
- Border radius: 4px
- Progress fill opacity: 1
- Background opacity: 0.3

---

## Color Scheme

### Status Colors (matching tree view)
```css
/* NOT_STARTED */
--bar-bg: rgb(226, 232, 240);     /* slate-200 */
--bar-fill: rgb(148, 163, 184);   /* slate-400 */

/* IN_PROGRESS */
--bar-bg: rgb(191, 219, 254);     /* blue-200 */
--bar-fill: rgb(59, 130, 246);    /* blue-500 */

/* COMPLETED */
--bar-bg: rgb(187, 247, 208);     /* green-200 */
--bar-fill: rgb(34, 197, 94);     /* green-500 */

/* BLOCKED */
--bar-bg: rgb(254, 202, 202);     /* red-200 */
--bar-fill: rgb(239, 68, 68);     /* red-500 */

/* CANCELLED */
--bar-bg: rgb(229, 231, 235);     /* gray-200 */
--bar-fill: rgb(107, 114, 128);   /* gray-500 */
```

### Current Position Highlight
```css
--current-border: rgb(249, 115, 22);  /* coral/orange */
--current-glow: rgba(249, 115, 22, 0.2);
```

---

## Interactions

### Click
- Phase row → Expand/collapse sprints
- Sprint row → Open sprint detail modal
- Bar → Same as row click

### Hover
- Bar → Show TimelineTooltip
- Row → Highlight with subtle background

### Scroll
- Horizontal scroll for long timelines
- Header sticky during vertical scroll
- Left labels sticky during horizontal scroll

### Zoom (future)
- Zoom in: Show week → day detail
- Zoom out: Show month → quarter view
- Keyboard: Ctrl+scroll

---

## Responsive Behavior

### Desktop (>1200px)
- Full timeline visible
- All labels shown
- Tooltip on hover

### Tablet (768px-1200px)
- Horizontal scroll required
- Labels truncated with ellipsis
- Touch-friendly bar heights

### Mobile (<768px)
- **Show tree view instead** (timeline not practical)
- ViewToggle hidden on mobile
- Or: Vertical timeline layout (future)

---

## ViewToggle Component

```tsx
interface ViewToggleProps {
  view: 'tree' | 'timeline';
  onChange: (view: 'tree' | 'timeline') => void;
}
```

**Design**:
```
┌───────────────────┐
│ [🌲 Tree] [📊 Timeline] │
└───────────────────┘
```

- Button group with neumorphic styling
- Active button: `neu-pressed`
- Inactive button: `neu-flat`
- Responsive: Hidden on mobile

---

## Date Calculations

### Utility Functions (use date-fns)

```typescript
import {
  differenceInDays,
  addWeeks,
  startOfWeek,
  format,
  eachMonthOfInterval,
  eachWeekOfInterval
} from 'date-fns';

// Calculate bar position
function getBarPosition(
  itemStart: Date,
  itemEnd: Date,
  timelineStart: Date,
  totalDays: number
): { left: string; width: string } {
  const startOffset = differenceInDays(itemStart, timelineStart);
  const duration = differenceInDays(itemEnd, itemStart) + 1;

  return {
    left: `${(startOffset / totalDays) * 100}%`,
    width: `${(duration / totalDays) * 100}%`
  };
}

// Generate date scale
function generateDateScale(start: Date, end: Date): DateScale {
  const months = eachMonthOfInterval({ start, end });
  const weeks = eachWeekOfInterval({ start, end });
  return { months, weeks };
}
```

---

## Performance Considerations

### Virtual Scrolling
For roadmaps with >20 phases, implement virtual scrolling:
- Only render visible rows
- Use `react-virtual` or similar
- Maintain scroll position on data updates

### Lazy Rendering
- Render phase rows first
- Render sprint rows on phase expand
- Defer tooltip content until hover

### Memoization
- Memoize bar position calculations
- Memoize date scale generation
- Use React.memo for TimelineRow
