# Roadmap Design System Redesign Plan - Sprint 8.5

**Created:** 2025-11-17
**Status:** Ready for Implementation
**Estimated Time:** 2-2.5 hours

## Overview
Transform all roadmap components from generic styling to match the sophisticated **Dark Neumorphic Coral Theme** used throughout AI_HUB.

---

## Part 1: Core Component Redesign (8 files)

### 1.1 PhaseCard.tsx - Premium Treatment
**Current:** Basic card with standard borders and generic badges
**Target:** Flagship neumorphic card with coral accents

**Changes:**
- Replace container with `neu-raised neu-float smooth-transition rounded-3xl p-6`
- Add 16x16px icon container with `icon-coral` class and Map/Layers icon
- Convert header to flex layout with icon + title + badge
- Replace generic status badge with color-coded badge system:
  - `badge-green` for COMPLETED
  - `badge-blue` for IN_PROGRESS
  - `badge-slate` for NOT_STARTED
- Add stats grid with `neu-pressed rounded-2xl p-3` containers showing:
  - Sprint count (coral accent number)
  - Week count (coral accent number)
  - Days count (coral accent number)
- Replace progress bar with:
  - Container: `neu-pressed rounded-full h-2`
  - Fill: `coral-gradient` (linear-gradient coral → coral-dark)
  - Header: Progress label + percentage in coral
- Add date range with slate text and calendar icon
- Typography: `text-2xl font-bold text-white` for title

### 1.2 SprintCard.tsx - Mid-Level Treatment
**Current:** Smaller version of PhaseCard with no visual distinction
**Target:** Medium prominence neumorphic card

**Changes:**
- Replace container with `neu-raised smooth-transition rounded-2xl p-5`
- Add 12x12px icon container with `icon-blue` class and Target icon
- Header flex layout with icon + title + badge
- Use `badge-blue` for IN_PROGRESS, `badge-green` for COMPLETED, `badge-slate` for NOT_STARTED
- Add mini stat cards with `neu-pressed rounded-xl px-3 py-2`:
  - Week count (white number + slate label)
  - Story points if available (white number + slate label)
- Progress bar:
  - Container: `neu-pressed rounded-full h-1.5`
  - Fill: `bg-blue-500` (not coral - secondary level)
  - Smaller header with progress percentage
- Typography: `text-xl font-semibold text-white` for title
- Description: `text-sm text-slate`

### 1.3 WeekCard.tsx - Compact Treatment
**Current:** Minimal card with basic styling
**Target:** Subtle neumorphic card with compact layout

**Changes:**
- Replace container with `neu-flat smooth-transition rounded-xl p-4 hover:shadow-lg`
- Add 8x8px icon container with `icon-slate` class and Calendar icon
- Header: Icon + title in flex layout
- Badge: `badge-slate` or color-coded based on status
- Date range: `text-xs text-slate` with proper formatting
- Days count indicator (e.g., "5 days (Mon-Fri)")
- Progress bar:
  - Container: `neu-pressed rounded-full h-1`
  - Fill: `bg-slate` (tertiary level - no accent color)
- Typography: `font-medium text-white` for title
- Remove explicit height, let content determine size

### 1.4 RoadmapTree.tsx - Container & Layout
**Current:** Generic border-based collapsible tree
**Target:** Smooth neumorphic collapsible hierarchy with proper spacing

**Changes:**
- Remove all generic `border` classes
- Phase container: `neu-raised rounded-3xl overflow-hidden mb-6`
- Sprint container: `bg-dark-card/50 border-l-4 border-coral/30 ml-6 mb-4`
- Week container: `bg-dark-lighter/30 ml-12 mb-3`
- Day container: `glass-dark rounded-xl p-3 ml-16 mb-2`
- Collapse buttons:
  - Style: `neu-flat smooth-transition h-8 w-8 rounded-xl flex items-center justify-center hover:shadow-lg`
  - Icon color: `text-slate` (inactive), `text-coral` (expanded)
- Spacing between levels:
  - Phase to Sprint: 6 (1.5rem)
  - Sprint to Week: 4 (1rem)
  - Week to Day: 3 (0.75rem)
- Empty state:
  - Wrap in `neu-raised rounded-3xl p-12`
  - Add pulsing icon with `icon-coral heartbeat` animation
  - Style text with `text-slate`

### 1.5 RoadmapFilters.tsx - Neumorphic Inputs
**Current:** Generic form inputs with basic styling
**Target:** Neumorphic filter panel with coral accents

**Changes:**
- Wrapper: `neu-raised rounded-3xl p-6 mb-6`
- Header: `text-lg font-bold text-white mb-4` with "Filters" label
- Grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Status select:
  - Input: `neu-pressed w-full rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-coral transition-all`
  - Label: `text-sm font-medium text-slate mb-2`
  - Options: Dark mode compatible
- Search input:
  - Container: `relative`
  - Icon: `absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate`
  - Input: `neu-pressed w-full rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate focus:ring-2 focus:ring-coral`
- Active filters section:
  - Container: `mt-4 flex items-center gap-2 flex-wrap`
  - Label: `text-xs text-slate`
  - Active badges: `badge-coral` for each filter
  - Clear button: `text-xs text-coral hover:text-coral-light smooth-transition`

### 1.6 FilterableRoadmapTree.tsx - No Changes Needed
**Status:** Wrapper component is fine, no visual changes needed

### 1.7 CurrentPositionBanner.tsx - Premium Banner
**Current:** Basic blue banner with plain styling
**Target:** Prominent neumorphic banner with coral accents

**Changes:**
- Container: `neu-raised rounded-3xl p-6 mb-6 border-l-4 border-coral`
- Header row: Flex layout with title + button
- Title: `text-lg font-bold text-white flex items-center gap-2`
- Add icon: `icon-coral h-10 w-10 rounded-xl` with MapPin icon
- View Details button:
  - Style: `coral-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white smooth-transition shadow-lg hover:shadow-xl`
  - Hover: Lift effect with `hover:-translate-y-1`
- Position data grid: `grid grid-cols-2 md:grid-cols-4 gap-3 mt-4`
- Each position item:
  - Container: `neu-pressed rounded-xl p-3`
  - Label: `text-xs text-slate mb-1`
  - Value: `text-sm font-semibold text-white truncate`

### 1.8 CurrentWorkModal.tsx - Glass Overlay Modal
**Current:** Basic modal with plain white background
**Target:** Neumorphic modal with glass effect

**Changes:**
- Overlay: `fixed inset-0 bg-black/70 backdrop-blur-md` (darker, more blur)
- Modal container: `neu-raised rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden`
- Header:
  - Container: `border-b border-border-subtle p-6 flex items-center justify-between`
  - Title: `text-2xl font-bold text-white`
  - Close button: `neu-flat smooth-transition p-2 rounded-xl hover:bg-white/5`
- Content scroll area: `p-6 overflow-y-auto`
- Section headers: `text-lg font-semibold text-white mb-3 flex items-center gap-2` with icon
- Section containers: `neu-pressed rounded-2xl p-4 mb-4`
- Data labels: `text-sm font-medium text-slate mb-2`
- Data values: `text-white`
- Todos list items: `glass-dark rounded-xl p-3 mb-2 flex items-center gap-3`
- Status badge in modal: Use badge system (`badge-blue`, etc.)

---

## Part 2: Page Layout Updates (1 file)

### 2.1 roadmap/page.tsx - Page Container
**Current:** Generic container with basic spacing
**Target:** Dark background with proper spacing and title treatment

**Changes:**
- Container: `min-h-screen bg-dark p-4 md:p-8`
- Page header:
  - Container: `mb-8`
  - Title: `text-4xl font-bold text-white mb-2 flex items-center gap-3`
  - Add coral icon: `icon-coral h-14 w-14 rounded-2xl` with Map icon
  - Subtitle: `text-slate text-sm`
- Loading fallback:
  - Replace with shimmer animation card
  - Style: `neu-raised rounded-3xl p-6 animate-shimmer`

---

## Part 3: Type Definitions (1 file - no changes)

### 3.1 types/roadmap.ts
**Status:** Already correct, no changes needed

---

## Part 4: Global Styles Verification (Check only)

### 4.1 Verify CSS Variables & Classes Exist
**Files to check:**
- `apps/web/app/globals.css` - Verify all CSS custom properties exist
- `apps/web/tailwind.config.ts` - Verify custom classes are defined

**Required classes/variables:**
- `.neu-raised`, `.neu-pressed`, `.neu-flat`, `.neu-float`
- `.coral-gradient`, `.icon-coral`, `.badge-coral`, etc.
- `.smooth-transition`, `.glass-dark`
- CSS variables: `--coral`, `--dark`, `--slate`, etc.

**If missing:** Add them based on design system analysis

---

## Part 5: Testing & Verification

### 5.1 Visual Testing Checklist
- [ ] Phase cards match Agent Personas card quality
- [ ] All neumorphic shadows render correctly
- [ ] Coral gradient appears on primary elements
- [ ] Hover effects work smoothly (lift + shadow enhancement)
- [ ] Collapse/expand animations are smooth
- [ ] Dark mode is consistent throughout
- [ ] Typography hierarchy is clear (Phase > Sprint > Week > Day)
- [ ] Badge colors match status correctly
- [ ] Progress bars use correct colors per level
- [ ] Filters panel matches design system
- [ ] Modal has proper glass effect
- [ ] Icons are sized appropriately per level
- [ ] Spacing feels balanced and not cramped
- [ ] Mobile responsive (cards stack properly)

### 5.2 Interactive Testing
- [ ] Expand/collapse all levels works smoothly
- [ ] Filters update tree correctly
- [ ] Search filter highlights correct items
- [ ] Status filter shows correct cards
- [ ] Clear filters button resets everything
- [ ] View Details modal opens/closes
- [ ] Modal fetches session data correctly
- [ ] All buttons have proper hover states
- [ ] Focus states show coral ring
- [ ] Keyboard navigation works

---

## Implementation Order

1. **Phase 1 - Foundation** (30 mins)
   - Update RoadmapFilters.tsx with neumorphic styling
   - Update RoadmapTree.tsx container and layout structure
   - Verify global CSS classes exist

2. **Phase 2 - Card Components** (45 mins)
   - Redesign PhaseCard.tsx (most complex)
   - Redesign SprintCard.tsx
   - Redesign WeekCard.tsx

3. **Phase 3 - Supporting Components** (30 mins)
   - Update CurrentPositionBanner.tsx
   - Update CurrentWorkModal.tsx
   - Update page.tsx layout

4. **Phase 4 - Polish & Testing** (30 mins)
   - Add missing icons (Map, Target, Calendar, MapPin)
   - Fine-tune spacing and responsive behavior
   - Test all interactions
   - Visual QA against Agent Personas page

**Total Estimated Time:** 2-2.5 hours

---

## Success Criteria

✅ **Visual Consistency:** Roadmap matches Agent Personas page quality
✅ **Neumorphic Design:** All cards use neu-raised/neu-pressed/neu-flat
✅ **Color Palette:** Coral accents prominent, dark theme consistent
✅ **Typography:** Clear hierarchy matching design system
✅ **Animations:** Smooth transitions on all interactions
✅ **Icons:** Proper icon containers with size hierarchy
✅ **Badges:** Color-coded status badges using badge system
✅ **Progress Bars:** Coral gradient for primary, appropriate colors for secondary
✅ **User Feedback:** Hover, focus, and active states feel polished

**End Result:** A roadmap feature that looks like it was designed by the same team that created the Agent Personas page - cohesive, sophisticated, and visually stunning.

---

## Design System Reference

### Neumorphic Classes
- `.neu-raised` - Primary cards with elevated shadow
- `.neu-pressed` - Inset/pressed states for inputs and containers
- `.neu-flat` - Subtle elevation for secondary cards
- `.neu-float` - Adds lift-on-hover effect

### Color Classes
- `.coral-gradient` - Primary gradient (coral → coral-dark)
- `.icon-coral` - Coral icon containers
- `.icon-blue`, `.icon-slate`, `.icon-green` - Color-specific icons
- `.badge-coral`, `.badge-blue`, `.badge-green`, `.badge-slate` - Status badges
- `.text-white`, `.text-slate`, `.text-coral` - Text colors

### Animation Classes
- `.smooth-transition` - Default smooth transitions (0.4s cubic-bezier)
- `.heartbeat` - Pulsing animation for live indicators
- `.pulse-glow` - Glowing effect for active states

### Typography Scale
- Page title: `text-4xl font-bold text-white`
- Phase title: `text-2xl font-bold text-white`
- Sprint title: `text-xl font-semibold text-white`
- Week title: `font-medium text-white`
- Body text: `text-sm text-slate`
- Small text: `text-xs text-slate`
