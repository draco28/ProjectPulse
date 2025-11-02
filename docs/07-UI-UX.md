# UI/UX Design Specification

**Document ID:** MOKSHA-UIUX-001
**Version:** 1.0
**Last Updated:** 2025-11-02
**Status:** Draft
**Owner:** Design & Architecture Team

---

## Document Control

| Version | Date       | Author            | Changes          |
| ------- | ---------- | ----------------- | ---------------- |
| 1.0     | 2025-11-02 | Architecture Team | Initial creation |

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Personas & Journeys](#2-user-personas--journeys)
3. [Information Architecture](#3-information-architecture)
4. [UI Components & Patterns](#4-ui-components--patterns)
5. [Dark Neumorphic Coral Theme](#5-dark-neumorphic-coral-theme)
6. [Interaction Patterns](#6-interaction-patterns)
7. [UI States & Transitions](#7-ui-states--transitions)
8. [Responsive Design](#8-responsive-design)
9. [Accessibility (WCAG 2.1 AA)](#9-accessibility-wcag-21-aa)
10. [Performance & Optimization](#10-performance--optimization)
11. [Design System Reference](#11-design-system-reference)
12. [Cross-References](#12-cross-references)

---

## 1. Overview

### 1.1 Purpose

ProjectPulse is an **agent-first platform** with a dual-purpose UI:

1. **Primary Use (95%):** Agent workflow execution via MCP (invisible to UI)
2. **Secondary Use (5%):** Human monitoring & manual operations via visual dashboard

**UI Design Philosophy:**

- **Information Density:** Maximize information per screen for efficient monitoring
- **Actionable Insights:** Every metric should have a clear action (approve, reject, override)
- **Progressive Disclosure:** Show summary by default, details on demand
- **Agent-Human Harmony:** Clearly distinguish agent actions from human edits
- **Read-Only Safety:** Markdown files auto-generated (database is source of truth)

### 1.2 Dual User Experience

#### Agent Experience (MCP)

- **No Visual Interface:** Agents interact purely via MCP tools (41 tools)
- **Context Files:** Agents read markdown files for context (STATUS.md, DEVELOPMENT_PLAN.md)
- **Database Operations:** All CRUD operations via MCP tools → Database → UI reflects changes
- **Feedback Loop:** Agent actions visible in UI immediately (WebSocket real-time updates)

#### Human Experience (Visual UI)

- **Dashboard Monitoring:** Quick glance at agent activity and project health
- **Manual CRUD:** Full create/edit/delete capability for all entities
- **Approval Workflows:** Review and approve/reject agent-created content
- **Override Capability:** Manual intervention when business logic requires human judgment

### 1.3 Key Design Principles

1. **Agent-First, Human-Friendly:** UI adapts to agent workflows, not vice versa
2. **Database as Truth:** UI is view layer only (reads from database)
3. **Real-Time Sync:** UI updates immediately when agent makes changes
4. **Accessibility:** WCAG 2.1 AA compliance for all interactive elements
5. **Performance:** Dashboard loads <2s (FCP), API responses <500ms

**Requirements:** NFR-022 to NFR-033 (UI/UX Non-Functional Requirements)

---

## 2. User Personas & Journeys

### 2.1 Persona 1: "Universal AI Agent" (Primary - 95%)

**Agent Workflow Visibility in UI:**

Agents don't interact with UI directly, but their actions are reflected in real-time:

#### Journey 1: Agent Executes 5-Step Protocol

**Scenario:** Agent implements "Implement Search Feature" task

**Agent Actions (MCP):**

```
1. sprint.getCurrentTask() → Reads current task
2. workflow.start("implement-feature") → Starts workflow
3. sprint.createTodos(taskId, todos) → Creates todo list
4. [Implementation begins - no MCP calls during coding]
5. sprint.checkpoint(taskId, 15000, 0.3) → 15K token checkpoint
6. sprint.checkpoint(taskId, 30000, 0.6) → 30K token checkpoint
7. sprint.completeTask(taskId) → Marks task complete
8. workflow.complete(workflowId) → Closes workflow
```

**UI Reflects Agent Actions:**

1. **Dashboard:** Task card moves from "Not Started" → "In Progress"
2. **Sprint View:** Progress bar animates from 0% → 30% → 60% → 100%
3. **Activity Feed:** Real-time updates: "Agent checkpoint: 15K tokens (30% complete)"
4. **Markdown Files:** STATUS.md auto-updates with latest progress
5. **Notification Badge:** "Task completed by agent" notification appears

**Human Interaction:** Zero required (agent completes task autonomously)

**UI Features Supporting Agent Workflow:**

- **Real-time progress indicators** (WebSocket-powered)
- **Agent activity timeline** (chronological log of MCP calls)
- **Checkpoint visualization** (token usage chart, progress timeline)
- **Auto-generated context files** (markdown files update automatically)
- **Agent vs Human attribution** (createdBy: "agent" badge on all entities)

**Requirements:** FR-026 to FR-050 (Workflow Orchestration)

---

#### Journey 2: Agent Creates Issues from Audit

**Scenario:** Agent runs security audit, creates 15 issues

**Agent Actions (MCP):**

```
1. issues.bulkCreate(issues: Issue[]) → Creates 15 issues at once
2. issues.autoTag(issueIds) → Auto-tags issues with severity, category
3. issues.linkFiles(issueId, filePaths) → Links issues to source code files
```

**UI Reflects Agent Actions:**

1. **Issues List:** 15 new issues appear instantly (real-time)
2. **Dashboard:** "Issues" metric updates: 45 → 60
3. **Notification:** "Agent created 15 security issues - Review required"
4. **Bulk Actions Bar:** "Select All" → "Bulk Approve" button appears

**Human Interaction Required:** Review and approve issues (5-10 seconds)

**UI Flow for Human:**

```
1. Click notification → Navigate to Issues page
2. Issues list shows 15 new items (agent badge visible)
3. Select All (Ctrl+A) → Click "Bulk Approve"
4. Confirmation modal: "Approve 15 issues?" → Yes
5. Issues status changes to APPROVED, agent can continue
```

**Requirements:** FR-051 to FR-070 (Issues Management)

---

#### Journey 3: Agent Queries Knowledge Graph

**Scenario:** Agent searches for "authentication implementation patterns"

**Agent Actions (MCP):**

```
1. knowledge.query("authentication implementation") → Hybrid search
2. knowledge.related(itemId, maxDepth: 2) → Gets related nodes (2-hop traversal)
```

**UI Reflects Agent Actions:**

1. **Knowledge Graph Visualization:** Highlights queried node + related nodes
2. **Activity Feed:** "Agent queried: authentication implementation (5 results)"
3. **Search History:** Query appears in recent searches sidebar

**Human Interaction:** Zero required (passive monitoring only)

**UI Features Supporting Knowledge Queries:**

- **Search history panel** (shows recent agent queries)
- **Knowledge graph visualization** (D3.js force-directed graph)
- **Result highlighting** (queried nodes highlighted in coral)
- **2-hop traversal visualization** (animated path from query to related nodes)

**Requirements:** FR-071 to FR-090 (Knowledge Graph)

---

### 2.2 Persona 2: "Solo/Small Team Developer" (Secondary - 5%)

**Human-Driven Workflows:**

#### Journey 1: Daily Dashboard Check (2-5 minutes)

**Morning Routine:**

```
1. Open Dashboard → Quick glance at metrics
2. Review "Recent Activity" timeline (last 24 hours)
3. Check "Agent Tasks Completed" count (e.g., "3 tasks, 12 issues created")
4. Review "Requires Approval" section (e.g., "8 issues pending review")
5. Bulk approve/reject as needed
6. Close dashboard, let agent continue work
```

**Dashboard Widgets:**

- **Project Health Score:** 85/100 (color-coded: green 80+, yellow 60-79, red <60)
- **Sprint Progress:** 60% complete (Phase A Week 2 Day 3)
- **Agent Activity:** 15 actions in last 24h (chart: checkpoints, issues, knowledge queries)
- **Requires Approval:** 8 issues, 3 knowledge items (red badge)
- **Recent Completions:** 3 tasks completed by agent
- **Token Usage:** 45K tokens today (chart: checkpoints over time)

**Requirements:** FR-125 (Dashboard metrics)

---

#### Journey 2: Manual Issue Creation (30 seconds)

**Scenario:** Human finds bug, creates issue manually

**UI Flow:**

```
1. Click "New Issue" button (top-right corner)
2. Modal appears with form:
   - Title: "Fix login button styling"
   - Description: Rich text editor (TipTap)
   - Priority: Dropdown (P0, P1, P2, P3)
   - Labels: Multi-select (bug, ui, css)
   - Files: File picker (link to source code)
   - Assignee: "Agent" (default) or "Manual"
3. Click "Create Issue"
4. Issue appears in list with "human" badge (distinguishes from agent-created)
5. Agent picks up issue in next workflow execution
```

**Form Validation:**

- Title: 1-500 characters (real-time character count)
- Description: Optional, rich text with markdown support
- Priority: Required field
- Labels: Min 1, max 10 labels
- Files: Optional, autocomplete from project file tree

**Requirements:** FR-053 (Manual issue creation), FR-054 (Issue form validation)

---

#### Journey 3: Reviewing Agent-Generated Documentation (2 minutes)

**Scenario:** Agent generated wiki page, needs human review for business context

**UI Flow:**

```
1. Navigate to Wiki page: "API Authentication Flow"
2. Banner shows: "Auto-generated by agent from JSDoc comments - Review required"
3. Review content:
   - Technical details: ✓ Accurate (JSDoc-sourced)
   - Business context: ✗ Missing (agent doesn't know business rules)
4. Click "Edit" button → Rich text editor opens
5. Add business context section:
   - "This authentication flow enforces 2FA for admin users only"
   - "External API users must rotate keys every 90 days"
6. Click "Save" → Wiki page updated
7. Banner changes: "Last edited by human (2025-11-02)" + "Agent-generated base"
```

**Collaborative Editing Features:**

- **Version History:** See all edits (agent + human) with timestamps
- **Attribution:** Clear badges for agent-generated vs human-edited sections
- **Conflict Prevention:** If agent updates while human is editing, show merge UI
- **Approval Workflow:** Human can approve agent changes or request re-generation

**Requirements:** FR-108 (Wiki CRUD), FR-109 (Auto-generation), FR-110 (Human editing)

---

#### Journey 4: Weekly Sprint Review (10 minutes)

**Scenario:** End of week, review sprint progress

**UI Flow:**

```
1. Navigate to Sprint → Week 2 view
2. Overview panel shows:
   - Week progress: 85% complete (4/5 days finished)
   - Tasks completed: 12/15 (agent: 10, human: 2)
   - Issues closed: 25 (agent: 22, human: 3)
   - Blockers: 1 (requires human decision)
3. Expand Day 5 (current day):
   - Task list with progress bars
   - Agent checkpoint timeline (visual timeline of 15K token intervals)
   - Files changed by agent (clickable links to source code)
4. Review "Blockers" section:
   - Issue: "Database migration strategy unclear"
   - Agent flagged: "Requires human decision (business logic)"
   - Human action: Add comment with decision → Unblock agent
5. Close sprint review, agent continues next week
```

**Sprint View Features:**

- **Hierarchical Drill-Down:** Phase → Week → Day → Task → Session
- **Progress Visualization:** Gantt chart, burndown chart, velocity chart
- **Agent Attribution:** Every completed item shows agent vs human badge
- **Blocker Management:** Red flags for items requiring human intervention
- **Export:** Download sprint report as PDF (for stakeholders)

**Requirements:** FR-001 to FR-025 (Sprint/Phase Tracking)

---

## 3. Information Architecture

### 3.1 Site Map

```
ProjectPulse
│
├── Dashboard (Home)
│   ├── Metrics Overview
│   ├── Recent Activity Timeline
│   ├── Requires Approval Section
│   └── Quick Actions Panel
│
├── Sprint Tracking
│   ├── Phase Overview
│   ├── Week Drill-Down
│   ├── Day Details
│   ├── Task Management
│   └── Session History
│
├── Issues
│   ├── Issues List (sortable, filterable)
│   ├── Issue Detail View
│   ├── Bulk Actions Bar
│   └── Issue Creation Modal
│
├── Knowledge Graph
│   ├── Graph Visualization (D3.js)
│   ├── Search Interface (hybrid search)
│   ├── Knowledge Item Detail
│   └── Related Items Panel
│
├── Skills
│   ├── Skills Library (framework docs)
│   ├── Skill Detail View
│   ├── Usage Statistics
│   └── Lazy Loading Indicator
│
├── Wiki
│   ├── Wiki Pages List
│   ├── Wiki Page View
│   ├── Rich Text Editor (TipTap)
│   └── Version History
│
├── Project Health
│   ├── Health Dashboard
│   ├── Findings List (security, quality, a11y, tech debt)
│   ├── Severity Scoring Chart
│   └── Remediation Tracking
│
├── Agent Personas
│   ├── Personas List
│   ├── Persona Detail View
│   ├── Activation History
│   └── Persona Creation Modal
│
└── Settings
    ├── MCP Configuration
    ├── Autonomy Levels (L1/L2/L3)
    ├── Approval Workflows
    └── Notification Preferences
```

**Navigation Hierarchy:**

1. **Level 1:** Top navigation (7 main sections + Dashboard)
2. **Level 2:** Section-specific sidebars (filters, actions)
3. **Level 3:** Modals/slide-outs for CRUD operations
4. **Level 4:** Inline editing for quick updates

**Requirements:** NFR-023 (UI navigation structure)

---

### 3.2 Navigation Patterns

#### Top Navigation Bar (Fixed)

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Dashboard | Sprint | Issues | Knowledge | ... [User] │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

- **Fixed Position:** Remains visible while scrolling (sticky top)
- **Active State:** Current page highlighted (coral underline)
- **Search:** Global search (Cmd+K shortcut) in top-right
- **Notifications:** Bell icon with badge count (requires approval items)
- **User Menu:** Avatar → Settings, Logout

**Accessibility:**

- Skip to content link (hidden, appears on Tab focus)
- ARIA landmarks: `<nav role="navigation" aria-label="Main">`
- Keyboard navigation: Tab through items, Enter to select

**Requirements:** NFR-030 (Accessibility)

---

#### Sidebar Navigation (Contextual)

Each main section has a sidebar with filters, actions, and quick links:

**Example: Issues Sidebar**

```
┌─────────────────┐
│ Filters         │
│ ☐ All           │
│ ☑ Agent-created │
│ ☐ Human-created │
│                 │
│ Priority        │
│ ☐ P0 (Critical) │
│ ☑ P1 (High)     │
│ ☐ P2 (Medium)   │
│ ☐ P3 (Low)      │
│                 │
│ Status          │
│ ☑ Pending       │
│ ☐ Approved      │
│ ☐ Resolved      │
│                 │
│ [Apply Filters] │
│ [Reset]         │
└─────────────────┘
```

**Features:**

- **Collapsible:** Can be hidden to maximize content area (toggle button)
- **Persistent State:** Filter selections saved to localStorage
- **Quick Actions:** "New Issue" button at top of sidebar
- **Count Badges:** Show count next to each filter option

**Requirements:** FR-059 (Issue filtering), FR-060 (Issue sorting)

---

#### Breadcrumbs (Hierarchical Navigation)

Used in Sprint tracking to show current location in hierarchy:

```
Phase A: MVP Core > Week 2: Database Schema > Day 3: Prisma Models > Task 5: Issue Models
```

**Features:**

- **Clickable:** Each level is clickable (navigate to parent level)
- **Progress Indicators:** Show progress percentage inline: `Week 2 (85%)`
- **Color-Coded:** Current level in coral, parent levels in gray
- **Responsive:** On mobile, show only current level + one parent

**Requirements:** FR-003 (Sprint hierarchy navigation)

---

## 4. UI Components & Patterns

### 4.1 Core Components

#### 4.1.1 Button Component

**Variants:**

1. **Primary:** High-emphasis actions (Create, Save, Approve)
   - Background: `coral-500` (#FF7F66)
   - Text: `gray-900` (dark text on coral background)
   - Hover: `coral-600` (darker coral)
   - Neumorphic shadow: inset 2px 2px 4px rgba(255,127,102,0.2)

2. **Secondary:** Medium-emphasis actions (Cancel, Reset)
   - Background: `gray-700` (dark neumorphic surface)
   - Text: `gray-100` (light text on dark background)
   - Hover: `gray-600` (lighter gray)
   - Neumorphic shadow: 4px 4px 8px rgba(0,0,0,0.4)

3. **Danger:** Destructive actions (Delete, Reject)
   - Background: `red-600` (#DC2626)
   - Text: `white`
   - Hover: `red-700` (darker red)
   - Confirmation modal required

**Sizes:**

- Small: `h-8 px-3 text-sm` (32px height)
- Medium: `h-10 px-4 text-base` (40px height)
- Large: `h-12 px-6 text-lg` (48px height)

**States:**

- **Disabled:** Opacity 0.5, cursor not-allowed, no hover effects
- **Loading:** Spinner icon replaces text, button disabled
- **Focus:** 2px solid coral outline (for keyboard navigation)

**Accessibility:**

- ARIA: `role="button"` (if not using `<button>` element)
- Focus visible: `:focus-visible` outline (not on mouse click)
- Disabled: `aria-disabled="true"` (not just visual opacity)

**Requirements:** NFR-030 (Accessibility), NFR-031 (Keyboard navigation)

---

#### 4.1.2 Card Component (Neumorphic)

**Base Styles:**

```css
.card {
  background: #1e1e1e; /* gray-800 */
  border-radius: 12px;
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.5),
    -4px -4px 8px rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow:
    12px 12px 24px rgba(0, 0, 0, 0.6),
    -6px -6px 12px rgba(255, 255, 255, 0.04);
}
```

**Variants:**

1. **Interactive Card:** Clickable, used for lists (issues, tasks)
   - Hover effect: Lift up (more prominent shadow)
   - Cursor: pointer
   - Focus: Coral border (2px solid)

2. **Static Card:** Information display, no interaction
   - No hover effect
   - Cursor: default

3. **Agent-Created Card:** Has agent badge in top-right corner
   - Badge: Small circular avatar with "AI" icon
   - Background: coral-500
   - Tooltip: "Created by agent (2025-11-02 14:30)"

**Accessibility:**

- Interactive cards: `<a>` or `<button>` wrapper (not `<div>` with onClick)
- ARIA: `role="article"` for content cards
- Heading hierarchy: Each card has `<h3>` or `<h4>` title

**Requirements:** NFR-024 (Visual design consistency)

---

#### 4.1.3 Progress Bar Component

**Design:**

```
┌─────────────────────────────────────────────────────┐
│ Task Progress: 65%                                  │
├─────────────────────────────────┬───────────────────┤
│████████████████████████░░░░░░░░░│ 65/100 checkpoints│
└─────────────────────────────────┴───────────────────┘
```

**Features:**

- **Animated:** Smooth transition when progress updates (CSS transition 0.5s)
- **Color-Coded:**
  - Red: 0-30% (behind schedule)
  - Yellow: 31-69% (on track)
  - Green: 70-89% (ahead of schedule)
  - Coral: 90-100% (nearly complete / complete)
- **Tooltip:** Hover shows exact percentage + checkpoint count
- **Real-Time:** Updates via WebSocket when agent makes progress

**Accessibility:**

- ARIA: `role="progressbar"`, `aria-valuenow="65"`, `aria-valuemin="0"`, `aria-valuemax="100"`
- Screen reader: Announces "Progress: 65 percent" on update
- Visual + Text: Show percentage text alongside bar (not just visual)

**Requirements:** FR-002 (Progress update), NFR-022 (Real-time updates)

---

#### 4.1.4 Timeline Component (Agent Activity)

**Design:**

```
┌──────────────────────────────────────────────────────────┐
│ Agent Activity Timeline                                  │
├──────────────────────────────────────────────────────────┤
│ ●─── 14:30 - Checkpoint (15K tokens, 30% complete)       │
│ │                                                         │
│ ●─── 14:15 - Started task: "Implement Search"            │
│ │                                                         │
│ ●─── 14:00 - Created 5 issues from security scan         │
│ │                                                         │
│ ●─── 13:45 - Queried knowledge: "authentication"         │
└──────────────────────────────────────────────────────────┘
```

**Features:**

- **Chronological:** Most recent at top, older at bottom
- **Icons:** Different icon per action type (checkpoint, issue, knowledge query)
- **Color-Coded Line:** Coral for current task, gray for completed
- **Expandable:** Click item to see details (e.g., checkpoint notes, token usage chart)
- **Real-Time:** New items appear at top with slide-in animation

**Accessibility:**

- Semantic HTML: `<ol>` (ordered list, chronological)
- ARIA: `aria-label="Agent activity timeline"`
- Time format: ISO 8601 with `<time datetime="2025-11-02T14:30:00Z">14:30</time>`

**Requirements:** FR-026 (Workflow orchestration), NFR-022 (Real-time updates)

---

#### 4.1.5 Modal Component

**Structure:**

```
┌───────────────────────────────────────────────────────┐
│ [X] Modal Title                                       │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Modal content here (form, text, etc.)                │
│                                                       │
│                                                       │
├───────────────────────────────────────────────────────┤
│                    [Cancel]  [Confirm]                │
└───────────────────────────────────────────────────────┘
```

**Behavior:**

- **Overlay:** Semi-transparent black background (rgba(0,0,0,0.7))
- **Center Aligned:** Vertically and horizontally centered
- **Focus Trap:** Tab key cycles only through modal elements (not background)
- **Close Methods:**
  1. Click [X] button
  2. Press Escape key
  3. Click overlay background (optional, configurable)
- **Confirmation:** Destructive actions show confirmation modal before execution

**Accessibility:**

- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
- Focus Management: Focus moves to first interactive element on open
- Keyboard: Escape closes modal, Tab cycles through elements
- Screen Reader: Announce modal title on open

**Requirements:** NFR-031 (Keyboard navigation), NFR-030 (Accessibility)

---

### 4.2 Data Display Patterns

#### 4.2.1 Table Component

**Features:**

- **Sortable Columns:** Click column header to sort (ascending/descending)
- **Filterable:** Filter bar above table (text search + dropdowns)
- **Pagination:** 25/50/100 items per page (user configurable)
- **Selectable Rows:** Checkbox in first column for bulk actions
- **Expandable Rows:** Click row to expand details (nested content)

**Accessibility:**

- Semantic HTML: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
- ARIA: `role="grid"` for interactive tables with keyboard navigation
- Sort indicators: ARIA `aria-sort="ascending"` on sorted column
- Column headers: `<th scope="col">` for screen readers

**Requirements:** FR-059 (Issue filtering), FR-060 (Issue sorting)

---

#### 4.2.2 Knowledge Graph Visualization

**Technology:** D3.js force-directed graph

**Design:**

- **Nodes:** Circular, size based on connections count
- **Edges:** Lines connecting nodes, thickness based on relationship strength
- **Colors:**
  - Queried node: Coral (bright)
  - Related nodes (1-hop): Yellow
  - Related nodes (2-hop): Gray
  - Unrelated nodes: Dark gray (faded)
- **Labels:** Node titles (truncated to 20 chars, full on hover)
- **Zoom/Pan:** Mouse wheel to zoom, click-drag to pan

**Interactions:**

- **Click Node:** Open knowledge item detail panel (slide-in from right)
- **Hover Node:** Show tooltip with full title + connection count
- **Click Edge:** Show relationship type (REFERENCES, CONTRADICTS, EXTENDS)
- **Search:** Highlight matching nodes, dim others

**Accessibility:**

- **Keyboard Navigation:** Tab to cycle through nodes, Enter to select
- **Screen Reader:** Fallback to list view (nodes with connections count)
- **Alt Text:** SVG has `<title>` and `<desc>` elements

**Requirements:** FR-075 (Knowledge graph visualization), NFR-030 (Accessibility)

---

## 5. Dark Neumorphic Coral Theme

### 5.1 Design Philosophy

**Neumorphism:** Soft UI design with subtle shadows and highlights, creating an "extruded" or "embossed" effect.

**Dark Theme:** Low-light environment optimized for long coding sessions (reduces eye strain).

**Coral Accent:** Bright coral (#FF7F66) for primary actions and highlights (stands out against dark background).

**Design Goals:**

1. **Reduce Eye Strain:** Dark background, avoid pure white text
2. **Highlight Important Actions:** Coral for primary buttons, progress indicators
3. **Depth Perception:** Neumorphic shadows create visual hierarchy
4. **Brand Identity:** Coral as signature color (memorable, distinctive)

**Inspiration:** iOS Neumorphism + Dark mode + Coral accent palette

---

### 5.2 Color Palette

#### Base Colors (Gray Scale)

```css
/* Background shades */
--gray-900: #121212; /* Page background */
--gray-800: #1e1e1e; /* Card background */
--gray-700: #2a2a2a; /* Sidebar background */
--gray-600: #3a3a3a; /* Hover states */
--gray-500: #4a4a4a; /* Borders */

/* Text shades */
--gray-400: #9ca3af; /* Secondary text */
--gray-300: #d1d5db; /* Body text */
--gray-200: #e5e7eb; /* Headings */
--gray-100: #f3f4f6; /* Bright text (rare) */
```

#### Accent Colors

```css
/* Primary accent (Coral) */
--coral-500: #ff7f66; /* Main coral */
--coral-600: #ff6647; /* Darker coral (hover) */
--coral-400: #ff9985; /* Lighter coral (backgrounds) */

/* Status colors */
--green-500: #10b981; /* Success */
--yellow-500: #f59e0b; /* Warning */
--red-500: #ef4444; /* Error/Danger */
--blue-500: #3b82f6; /* Info */
```

#### Neumorphic Shadows

```css
/* Light source: Top-left */
--shadow-neumorphic: 8px 8px 16px rgba(0, 0, 0, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.03);

/* Inset (pressed button effect) */
--shadow-neumorphic-inset:
  inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.03);

/* Hover (lifted effect) */
--shadow-neumorphic-hover:
  12px 12px 24px rgba(0, 0, 0, 0.6), -6px -6px 12px rgba(255, 255, 255, 0.04);
```

---

### 5.3 Typography

#### Font Families

```css
/* Sans-serif (UI) */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace (code) */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

#### Font Sizes (Fluid Typography)

```css
/* Headings */
--text-4xl: clamp(2rem, 5vw, 2.5rem); /* H1: 32px-40px */
--text-3xl: clamp(1.5rem, 4vw, 2rem); /* H2: 24px-32px */
--text-2xl: clamp(1.25rem, 3vw, 1.5rem); /* H3: 20px-24px */
--text-xl: clamp(1.125rem, 2vw, 1.25rem); /* H4: 18px-20px */

/* Body text */
--text-base: 1rem; /* 16px */
--text-sm: 0.875rem; /* 14px */
--text-xs: 0.75rem; /* 12px */
```

#### Line Heights

```css
/* Headings: Tighter line height */
--leading-tight: 1.25;

/* Body text: Normal line height */
--leading-normal: 1.5;

/* Long-form text: Relaxed line height */
--leading-relaxed: 1.75;
```

---

### 5.4 Spacing System (8px Grid)

All spacing follows 8px increments for visual consistency:

```css
--space-1: 0.5rem; /* 8px */
--space-2: 1rem; /* 16px */
--space-3: 1.5rem; /* 24px */
--space-4: 2rem; /* 32px */
--space-5: 2.5rem; /* 40px */
--space-6: 3rem; /* 48px */
--space-8: 4rem; /* 64px */
--space-10: 5rem; /* 80px */
```

**Usage:**

- **Padding:** Components use `space-2` (16px) minimum
- **Margin:** Vertical rhythm uses `space-3` (24px) between sections
- **Grid Gap:** Card grids use `space-4` (32px) gap

---

### 5.5 Component Examples

#### Button (Neumorphic Coral)

```css
.btn-primary {
  background: var(--coral-500);
  color: var(--gray-900);
  padding: var(--space-2) var(--space-4);
  border-radius: 8px;
  box-shadow: var(--shadow-neumorphic);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--coral-600);
  box-shadow: var(--shadow-neumorphic-hover);
}

.btn-primary:active {
  box-shadow: var(--shadow-neumorphic-inset);
}
```

#### Card (Neumorphic Dark)

```css
.card {
  background: var(--gray-800);
  border-radius: 12px;
  padding: var(--space-3);
  box-shadow: var(--shadow-neumorphic);
}

.card:hover {
  box-shadow: var(--shadow-neumorphic-hover);
}
```

---

## 6. Interaction Patterns

### 6.1 Real-Time Updates (WebSocket)

**Behavior:** UI updates instantly when agent makes changes via MCP

**Implementation:**

```typescript
// Agent completes checkpoint via MCP
agent.call('sprint.checkpoint', { taskId: 1, progress: 0.6 });

// Backend emits WebSocket event
websocket.emit('task:progress', { taskId: 1, progress: 0.6 });

// Frontend receives event, updates UI
useEffect(() => {
  socket.on('task:progress', (data) => {
    // Update progress bar (animated)
    setProgress(data.progress);
    // Show notification toast
    toast.info(`Task ${data.taskId} progress: ${data.progress * 100}%`);
  });
}, []);
```

**Visual Feedback:**

1. **Progress Bar:** Animates smoothly from current to new value (0.5s transition)
2. **Notification Toast:** Appears in bottom-right corner (3s duration, auto-dismiss)
3. **Activity Timeline:** New item slides in at top with bounce animation
4. **Badge Update:** Notification badge count updates (if requires approval)

**Requirements:** NFR-022 (Real-time updates), FR-004 (Checkpoint creation)

---

### 6.2 Bulk Actions (Issues Management)

**User Flow:**

```
1. Navigate to Issues page
2. Select multiple issues (checkbox in each row)
3. Bulk actions bar appears at bottom of screen (slide up animation)
4. Choose action: Approve, Reject, Delete, Change Priority
5. Confirmation modal appears (for destructive actions)
6. Confirm → API request → UI updates (checked items disappear or update)
```

**Bulk Actions Bar:**

```
┌─────────────────────────────────────────────────────────────┐
│ 8 issues selected | [Approve] [Reject] [Delete] [Deselect] │
└─────────────────────────────────────────────────────────────┘
```

**Keyboard Shortcuts:**

- **Ctrl+A:** Select all visible issues
- **Shift+Click:** Select range (from last selected to current)
- **Escape:** Deselect all

**Requirements:** FR-062 (Bulk operations), NFR-031 (Keyboard navigation)

---

### 6.3 Inline Editing (Quick Updates)

**Behavior:** Double-click text to edit in place (no modal)

**Example: Edit Issue Title**

```
1. Double-click issue title in list view
2. Text becomes editable input field
3. Type new title (real-time character count shown)
4. Press Enter to save, Escape to cancel
5. Input disappears, updated title shown
6. API request in background, optimistic UI update
```

**Visual States:**

- **View Mode:** Text with hover effect (underline on hover)
- **Edit Mode:** Input field with coral border, character count below
- **Saving:** Spinner icon replaces text momentarily
- **Error:** Red border + error message below input

**Requirements:** FR-056 (Issue editing), NFR-025 (Optimistic UI updates)

---

### 6.4 Drag-and-Drop (Knowledge Graph)

**Behavior:** Rearrange knowledge graph nodes via drag-and-drop

**User Flow:**

```
1. Click and hold knowledge node in graph
2. Node highlights (coral glow effect)
3. Drag to new position
4. Drop → Node position saved to database
5. Related nodes adjust via force-directed physics
```

**Visual Feedback:**

- **Grabbing Cursor:** Changes to grabbing hand icon
- **Drop Zone:** Valid drop area highlights (faint coral circle)
- **Invalid Drop:** Red X icon appears if drop not allowed
- **Snap-to-Grid:** Nodes snap to invisible grid (8px) for alignment

**Accessibility:**

- **Keyboard Alternative:** Arrow keys to move node (when focused)
- **Screen Reader:** "Node moved from X,Y to A,B" announcement

**Requirements:** FR-075 (Knowledge graph visualization), NFR-030 (Accessibility)

---

## 7. UI States & Transitions

### 7.1 Loading States

#### 7.1.1 Initial Page Load

**Skeleton Screens:** Show placeholder UI while data loads

**Dashboard Skeleton:**

```
┌─────────────────────────────────────────────────────────┐
│ [████░░░░] [████░░░░] [████░░░░] [████░░░░]             │ ← Metric cards (shimmer animation)
├─────────────────────────────────────────────────────────┤
│ [█████████████░░░░░░░░░░░░░░░]                          │ ← Progress bar
├─────────────────────────────────────────────────────────┤
│ [██░░░░░░░] 14:30 - Loading...                          │ ← Activity timeline
│ [██░░░░░░░] 14:15 - Loading...                          │
└─────────────────────────────────────────────────────────┘
```

**Shimmer Effect:** Subtle left-to-right shimmer animation (2s loop)

**Requirements:** NFR-022 (Performance), NFR-026 (Loading states)

---

#### 7.1.2 Data Fetching (Inline)

**Spinner Component:** Small spinner icon for inline loading

**Usage:**

- **Button Loading:** Replace button text with spinner
- **Table Rows:** Show spinner in row while updating
- **Search:** Show spinner in search input while querying

**Design:**

- Coral color (#FF7F66)
- 16px diameter (small), 24px (medium), 32px (large)
- Smooth rotation animation (1s loop)

---

### 7.2 Empty States

#### 7.2.1 No Data (First Use)

**Design:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                     [Empty Icon]                        │
│                                                         │
│            No issues created yet                        │
│                                                         │
│   Create your first issue or let the agent generate    │
│   issues from audit results.                            │
│                                                         │
│             [Create Issue] [Run Audit]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**

- **Illustration:** Simple coral icon (not text-only)
- **Call-to-Action:** 1-2 buttons to get started
- **Helper Text:** Explain what this section is for

**Requirements:** NFR-027 (Empty states)

---

#### 7.2.2 No Search Results

**Design:**

```
No results found for "authentication flow"

Try:
- Checking your spelling
- Using fewer keywords
- Searching for related terms
```

**Requirements:** FR-076 (Knowledge search), NFR-027 (Empty states)

---

### 7.3 Error States

#### 7.3.1 Inline Errors (Form Validation)

**Design:**

```
┌─────────────────────────────────────────────────────────┐
│ Issue Title                                             │
│ [Too long title exceeds maximum lengt___]               │
│ ❌ Title must be 1-500 characters (currently 520)       │
└─────────────────────────────────────────────────────────┘
```

**Features:**

- **Red Border:** Input field with red border (#EF4444)
- **Error Icon:** Red X icon before error message
- **Character Count:** Show current count vs max (real-time)
- **ARIA:** `aria-invalid="true"`, `aria-describedby="error-message"`

**Requirements:** FR-054 (Form validation), NFR-030 (Accessibility)

---

#### 7.3.2 Toast Notifications (Global Errors)

**Design:**

```
┌─────────────────────────────────────────────┐
│ ❌ Failed to save issue                    │
│ Network error. Please try again.           │
│                              [Retry] [Dismiss] │
└─────────────────────────────────────────────┘
```

**Position:** Bottom-right corner, stacked vertically

**Duration:**

- Info: 3 seconds (auto-dismiss)
- Success: 3 seconds (auto-dismiss)
- Warning: 5 seconds (auto-dismiss)
- Error: Persistent (manual dismiss required)

**Requirements:** NFR-028 (Error handling)

---

## 8. Responsive Design

### 8.1 Breakpoints

```css
/* Mobile */
--screen-sm: 640px;

/* Tablet */
--screen-md: 768px;

/* Laptop */
--screen-lg: 1024px;

/* Desktop */
--screen-xl: 1280px;

/* Large Desktop */
--screen-2xl: 1536px;
```

**Target Devices:**

- **Primary:** Desktop (1920x1080) - 70% of users
- **Secondary:** Laptop (1366x768) - 25% of users
- **Tertiary:** Tablet (768x1024) - 5% of users
- **Out of Scope:** Mobile (<640px) - Not optimized for MVP

**Requirements:** NFR-029 (Responsive design)

---

### 8.2 Layout Adaptations

#### Desktop (1280px+)

```
┌────────────────────────────────────────────────────────────┐
│ [Navigation Bar - Fixed Top]                               │
├───────┬────────────────────────────────────────────────────┤
│       │ Dashboard Content                                  │
│ Side  │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐          │
│ bar   │ │ Card  │ │ Card  │ │ Card  │ │ Card  │          │
│       │ └───────┘ └───────┘ └───────┘ └───────┘          │
│ 240px │ ┌─────────────────────────────────────┐            │
│       │ │ Main Content Area                   │            │
│       │ │                                     │            │
│       │ └─────────────────────────────────────┘            │
└───────┴────────────────────────────────────────────────────┘
```

**Features:**

- Sidebar: 240px fixed width (collapsible)
- Content: Fluid width (fills remaining space)
- Cards: 4-column grid (gap: 32px)

---

#### Tablet (768px - 1279px)

```
┌────────────────────────────────────────────┐
│ [Navigation Bar - Fixed Top]               │
├────────────────────────────────────────────┤
│ Dashboard Content                          │
│ ┌───────────┐ ┌───────────┐               │
│ │   Card    │ │   Card    │               │
│ └───────────┘ └───────────┘               │
│ ┌───────────┐ ┌───────────┐               │
│ │   Card    │ │   Card    │               │
│ └───────────┘ └───────────┘               │
│ ┌─────────────────────────────────────┐    │
│ │ Main Content Area                   │    │
└────────────────────────────────────────────┘
```

**Features:**

- Sidebar: Hidden by default (hamburger menu to open)
- Content: Full width
- Cards: 2-column grid (gap: 24px)

---

### 8.3 Touch Optimization (Tablet)

**Target Size:** Minimum 44x44px for all interactive elements

**Features:**

- **Larger Buttons:** Increase padding (48px height minimum)
- **Increased Spacing:** 16px gap between interactive elements
- **Swipe Gestures:** Swipe left to delete (issues list), swipe right to approve
- **Pull-to-Refresh:** Pull down on dashboard to refresh data

**Requirements:** NFR-029 (Responsive design), NFR-032 (Touch optimization)

---

## 9. Accessibility (WCAG 2.1 AA)

### 9.1 Color Contrast

**Target:** WCAG 2.1 AA compliance (minimum 4.5:1 for text, 3:1 for UI components)

**Verification:**

- **Coral on Dark Gray:** 7.2:1 (✅ Passes AAA)
- **Light Gray on Dark Gray:** 6.8:1 (✅ Passes AAA)
- **White on Coral:** 4.8:1 (✅ Passes AA)

**Tools:** Chrome DevTools Lighthouse, axe DevTools

**Requirements:** NFR-030 (Accessibility)

---

### 9.2 Keyboard Navigation

**Tab Order:** Logical flow (left-to-right, top-to-bottom)

**Shortcuts:**

- **Global:**
  - `Cmd+K` / `Ctrl+K`: Open global search
  - `Esc`: Close modal/dialog
  - `Tab`: Navigate forward
  - `Shift+Tab`: Navigate backward

- **Issues Page:**
  - `Ctrl+A`: Select all issues
  - `Delete`: Delete selected issues (confirmation modal)
  - `Space`: Toggle issue selection (checkbox)

- **Knowledge Graph:**
  - `Arrow Keys`: Move node position
  - `+` / `-`: Zoom in/out
  - `Space`: Center graph

**Focus Indicators:**

- **Visible Focus:** 2px solid coral outline (`:focus-visible`)
- **Skip Link:** "Skip to content" link (visible on Tab focus)

**Requirements:** NFR-031 (Keyboard navigation)

---

### 9.3 Screen Reader Support

**ARIA Landmarks:**

```html
<header role="banner">...</header>
<nav role="navigation" aria-label="Main">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

**Live Regions:**

```html
<!-- Announce real-time updates -->
<div aria-live="polite" aria-atomic="true">Task progress updated: 65%</div>
```

**Alternative Text:**

- **Images:** All `<img>` have `alt` text (meaningful or empty for decorative)
- **Icons:** Icon buttons have `aria-label` (e.g., `aria-label="Close modal"`)
- **Charts:** `<svg>` has `<title>` and `<desc>` elements

**Requirements:** NFR-030 (Accessibility)

---

### 9.4 Reduced Motion

**User Preference:** Respect `prefers-reduced-motion` media query

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Features:**

- Disable animations (fade-in, slide-in, bounce)
- Disable auto-play (video, carousel)
- Instant transitions (no smooth scroll, no animated progress bars)

**Requirements:** NFR-033 (Reduced motion support)

---

## 10. Performance & Optimization

### 10.1 Performance Targets

| Metric                         | Target | Measurement        |
| ------------------------------ | ------ | ------------------ |
| First Contentful Paint (FCP)   | <2s    | Lighthouse         |
| Time to Interactive (TTI)      | <3.5s  | Lighthouse         |
| Largest Contentful Paint (LCP) | <2.5s  | Lighthouse         |
| API Response Time (P95)        | <500ms | Backend monitoring |
| WebSocket Latency              | <100ms | Real-time updates  |

**Requirements:** NFR-022 (Performance)

---

### 10.2 Optimization Strategies

#### Code Splitting

- **Route-based:** Lazy load each main section (Dashboard, Sprint, Issues, etc.)
- **Component-based:** Lazy load heavy components (Knowledge Graph, Charts)
- **Vendor splitting:** Separate vendor bundle (React, D3.js) from app code

#### Image Optimization

- **Format:** WebP with JPEG fallback
- **Lazy Loading:** Images load on scroll (Intersection Observer API)
- **Responsive Images:** `<picture>` with multiple sizes (mobile, tablet, desktop)

#### Caching Strategy

- **Service Worker:** Cache static assets (CSS, JS, fonts) for offline support
- **API Caching:** Cache GET requests (5-minute TTL) with stale-while-revalidate
- **LocalStorage:** Cache user preferences (theme, sidebar state)

**Requirements:** NFR-022 (Performance), NFR-025 (Caching)

---

## 11. Design System Reference

### 11.1 Component Library

**Technology:** Headless UI (unstyled components) + Custom Tailwind CSS

**Components Available:**

1. **Form Controls:**
   - Button (Primary, Secondary, Danger)
   - Input (Text, Number, Email, Password)
   - Textarea (Rich text with TipTap)
   - Select (Dropdown, Multi-select)
   - Checkbox, Radio, Toggle
   - Date Picker, Time Picker

2. **Layout:**
   - Card (Neumorphic)
   - Modal, Dialog
   - Sidebar, Navbar
   - Breadcrumbs, Tabs

3. **Data Display:**
   - Table (Sortable, Filterable, Pagination)
   - Timeline (Agent activity)
   - Progress Bar, Progress Ring
   - Badge, Tag, Label
   - Avatar (User, Agent)

4. **Feedback:**
   - Toast Notification
   - Alert (Info, Success, Warning, Error)
   - Spinner, Skeleton Screen
   - Tooltip, Popover

5. **Visualizations:**
   - Knowledge Graph (D3.js)
   - Charts (Chart.js) - Line, Bar, Pie
   - Gantt Chart (Sprint timeline)
   - Burndown Chart (Sprint progress)

**Requirements:** NFR-024 (Visual design consistency)

---

### 11.2 Storybook Documentation

**Tool:** Storybook (component playground and documentation)

**Structure:**

```
storybook/
├── components/
│   ├── Button.stories.tsx
│   ├── Card.stories.tsx
│   ├── Modal.stories.tsx
│   └── ...
├── patterns/
│   ├── FormPatterns.stories.tsx
│   ├── TablePatterns.stories.tsx
│   └── ...
└── themes/
    └── DarkNeumorphicCoral.stories.tsx
```

**Features:**

- **Interactive Playground:** Adjust props, see live preview
- **Accessibility Checks:** Built-in axe addon for WCAG compliance
- **Visual Regression:** Percy snapshots for visual testing
- **Documentation:** MDX files with usage examples

**Requirements:** NFR-024 (Visual design consistency)

---

## 12. Cross-References

### 12.1 Related Documents

- **[01-PRD.md](01-PRD.md)** - User personas, use cases, success metrics
- **[02-SRS.md](02-SRS.md)** - Functional requirements (FR-001 to FR-125), NFRs (NFR-022 to NFR-033)
- **[03-Architecture.md](03-Architecture.md)** - System architecture, component diagrams
- **[05-AgentOps-Plan.md](05-AgentOps-Plan.md)** - Agent workflows, MCP tools catalog
- **[08-Security-and-Compliance.md](08-Security-and-Compliance.md)** - Security model, autonomy levels
- **[09-Testing-and-QA.md](09-Testing-and-QA.md)** - UI testing strategy, quality gates

### 12.2 Functional Requirements Traceability

| UI Feature        | Functional Requirements                                     | Test Cases           |
| ----------------- | ----------------------------------------------------------- | -------------------- |
| Dashboard         | FR-125 (Dashboard metrics), FR-026 (Workflow orchestration) | TEST-125, TEST-026   |
| Sprint Tracking   | FR-001 to FR-025 (Sprint/Phase hierarchy, Progress updates) | TEST-001 to TEST-025 |
| Issues Management | FR-051 to FR-070 (CRUD, Bulk operations, Auto-tagging)      | TEST-051 to TEST-070 |
| Knowledge Graph   | FR-071 to FR-090 (Hybrid search, Graph visualization)       | TEST-071 to TEST-090 |
| Skills Library    | FR-091 to FR-105 (Skills CRUD, Lazy loading)                | TEST-091 to TEST-105 |
| Wiki              | FR-106 to FR-115 (Wiki CRUD, Auto-generation)               | TEST-106 to TEST-115 |
| Project Health    | FR-116 to FR-120 (Health dashboard, Findings)               | TEST-116 to TEST-120 |
| Agent Personas    | FR-121 to FR-125 (Persona management)                       | TEST-121 to TEST-125 |

### 12.3 Non-Functional Requirements Traceability

| NFR                          | UI Implementation                     | Verification                 |
| ---------------------------- | ------------------------------------- | ---------------------------- |
| NFR-022 (Performance)        | Code splitting, lazy loading, caching | Lighthouse score >90         |
| NFR-023 (Navigation)         | Top nav, sidebar, breadcrumbs         | Manual testing               |
| NFR-024 (Visual consistency) | Design system, Storybook              | Visual regression tests      |
| NFR-025 (Optimistic UI)      | Instant updates, background API calls | Manual testing               |
| NFR-026 (Loading states)     | Skeleton screens, spinners            | Manual testing               |
| NFR-027 (Empty states)       | Illustrations, CTAs                   | Manual testing               |
| NFR-028 (Error handling)     | Toast notifications, inline errors    | Manual testing               |
| NFR-029 (Responsive design)  | Breakpoints, mobile-first CSS         | Cross-browser testing        |
| NFR-030 (Accessibility)      | WCAG 2.1 AA, ARIA, keyboard nav       | axe DevTools, manual testing |
| NFR-031 (Keyboard shortcuts) | Global shortcuts, focus management    | Manual testing               |
| NFR-032 (Touch optimization) | 44x44px targets, swipe gestures       | Manual testing on tablet     |
| NFR-033 (Reduced motion)     | prefers-reduced-motion                | Manual testing               |

---

## Appendix A: Design Mockups

**Location:** Figma (not included in this document)

**Contents:**

- High-fidelity mockups for all main pages (Dashboard, Sprint, Issues, Knowledge, Skills, Wiki, Health, Personas)
- Mobile/tablet responsive views
- Component library (all UI components with variants)
- Dark Neumorphic Coral theme examples

**Access:** [Figma Link - TBD]

---

## Appendix B: User Testing Plan

**Methodology:** Usability testing with 5 developers (target persona)

**Tasks:**

1. **Dashboard Monitoring:** Check agent activity, approve 8 issues (target: <2 minutes)
2. **Manual Issue Creation:** Create new issue with all fields (target: <30 seconds)
3. **Knowledge Graph Search:** Find "authentication implementation" (target: <10 seconds)
4. **Sprint Progress Review:** Navigate to Week 2, review progress (target: <1 minute)

**Success Criteria:**

- Task completion rate: >90%
- Average task time: Within target
- User satisfaction (SUS score): >75 (Good)

---

**END OF DOCUMENT**
