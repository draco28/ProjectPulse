---
name: moksha-ascii-wireframes
description: ASCII wireframe templates library for Moksha DevHub using hybrid format (box-drawing + emojis). Use for Step 1 of ui-generation-workflow to rapidly iterate on layouts before implementation.
triggers: ['layout', 'wireframe', 'structure', 'design layout']
token_estimate: 200
last_updated: 2025-10-27
related_docs:
  - ./ui-generation-workflow.md
  - ../../mockups/Default theme/
---

# ASCII Wireframe Library (Hybrid Format)

**Format**: Box-drawing characters (┌─┐│└┘) + Emojis (🏠📊🔍)

**Usage**: Step 1 of [ui-generation-workflow.md](./ui-generation-workflow.md)

---

## Layout Pattern 1: Sidebar + Main Content

**Used in**: Dashboard, Issues, Knowledge Base, Security, Agent Personas

```
┌─────────────────────────────────────────────────────────┐
│ 🏠 Logo                              [🔍 Search]  [➕]  │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│ 📊 Dashboard │  Header Section                          │
│              │  ┌────────────────────────────────────┐  │
│ 📝 Issues ➤  │  │ Page Title          [🔍] [Action] │  │
│              │  └────────────────────────────────────┘  │
│ 📚 Knowledge │                                          │
│              │  Main Content Area                       │
│ 🔒 Security  │  ┌────────────────────────────────────┐  │
│              │  │ Content Card                       │  │
│ 🤖 Agents    │  │                                    │  │
│              │  └────────────────────────────────────┘  │
│ ⚙️  Settings  │                                          │
│              │  ┌────────────────────────────────────┐  │
│ ──────────   │  │ Content Card                       │  │
│              │  └────────────────────────────────────┘  │
│ 👤 User      │                                          │
│   Profile    │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Variations**:

- Active nav item: Use `➤` or `●` indicator
- Badges on nav: `[3]` for notifications
- Collapsible sidebar: Add `◀` icon

---

## Layout Pattern 2: Sidebar + Main with Filters

**Used in**: Issues List, Knowledge Base Search

```
┌───────────────────────────────────────────────────────────┐
│ 🏠 Logo                                [🔍 Search]  [➕]  │
├────────┬──────────┬─────────────────────────────────────┐│
│        │          │                                     ││
│ 📝 Nav │ Filters  │  [🔍 Search...]  [Sort ▼]  [View] ││
│ Items  │          │                                     ││
│        │ ━━━━━━━  │  ┌───────────────────────────────┐ ││
│        │          │  │ Item Card                     │ ││
│        │ Status   │  │ #42 🔴 Critical               │ ││
│        │ □ Open   │  │ Title of the item             │ ││
│        │ □ Done   │  │ Description text...           │ ││
│        │          │  └───────────────────────────────┘ ││
│        │ Priority │                                     ││
│        │ □ High   │  ┌───────────────────────────────┐ ││
│        │ □ Medium │  │ Item Card                     │ ││
│        │          │  │ #43 🟡 Medium                 │ ││
│        │ Module   │  │ Title of another item         │ ││
│        │ □ Combat │  └───────────────────────────────┘ ││
│        │ □ UI     │                                     ││
│        │          │  [← Prev]  [1] [2] [3]  [Next →]  ││
└────────┴──────────┴─────────────────────────────────────┘
```

**Elements**:

- Filter sections with checkboxes: `□ Label`
- Badges in cards: `🔴 🟡 🟢` for priority
- Pagination controls at bottom

---

## Layout Pattern 3: Header + Content (No Sidebar)

**Used in**: Command Palette, Modal Dialogs, Detail Views

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔍 Command Palette                          [ESC]   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [🔍 Search commands...]                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Recent Commands                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📝 Create New Issue                    Ctrl+N       │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🔍 Search Knowledge Base               Ctrl+K       │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🤖 Activate Agent                      Ctrl+A       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ All Commands                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⚙️  Settings                            Ctrl+,       │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 👤 Profile                             Ctrl+P       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Elements**:

- Search input at top
- Grouped sections with headers
- Keyboard shortcuts on right
- Hover states for items

---

## Layout Pattern 4: Grid Layout (Stats/Metrics)

**Used in**: Dashboard overview, Analytics

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Dashboard Overview                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│ │ 🤖          │ │ 📝          │ │ ✅          │      │
│ │             │ │             │ │             │      │
│ │ 4           │ │ 23          │ │ 89%         │      │
│ │ Agents      │ │ Issues      │ │ Complete    │      │
│ └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│ │ 📚          │ │ 🔒          │ │ ⚡          │      │
│ │             │ │             │ │             │      │
│ │ 156         │ │ 3           │ │ 2.4k/min    │      │
│ │ Docs        │ │ Alerts      │ │ Tokens      │      │
│ └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Variations**:

- 2 columns: Wider cards with more detail
- 3 columns: Balanced (most common)
- 4 columns: Compact stats
- Add `●` indicator for active states

---

## Layout Pattern 5: List/Table Layout

**Used in**: Issue list, Knowledge articles, Agent list

```
┌─────────────────────────────────────────────────────────┐
│ Items List                    [🔍] [Filter] [Sort] [➕] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ □  #42  🔴 Critical  🏷️ Combat  ✅ Open            │ │
│ │    Fix player collision detection                   │ │
│ │    Collision system not working in multiplayer...   │ │
│ │    👤 John Doe  •  🕐 2 hours ago  •  💬 3         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ □  #41  🟡 Medium  🏷️ Animation  ⏸️ In Progress   │ │
│ │    Add death animation transitions                  │ │
│ │    Need smooth transitions between death states... │ │
│ │    👤 Jane Smith  •  🕐 5 hours ago  •  💬 7       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ □  #40  🟢 Low  🏷️ UI  ✅ Open                     │ │
│ │    Update menu button styles                        │ │
│ │    Current buttons don't match mockup...            │ │
│ │    👤 Bob Wilson  •  🕐 1 day ago  •  💬 2         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [← Prev]  [1] [2] [3] [4]  [Next →]                   │
└─────────────────────────────────────────────────────────┘
```

**Elements**:

- Checkbox for bulk selection: `□`
- Issue ID: `#42`
- Priority badges: `🔴 🟡 🟢`
- Status badges: `✅ Open`, `⏸️ In Progress`, `✔️ Closed`
- Labels: `🏷️ Label`
- Meta info: `👤 User  •  🕐 Time  •  💬 Comments`

---

## Layout Pattern 6: Detail View (Full Page)

**Used in**: Issue detail, Knowledge article, Agent persona detail

```
┌─────────────────────────────────────────────────────────┐
│ [← Back]  #42 Fix player collision detection      [⋯]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔴 Critical  🏷️ Combat  ✅ Open  👤 Assigned: John    │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│ Description                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ The collision detection system is not functioning   │ │
│ │ correctly in multiplayer mode. Players can walk     │ │
│ │ through walls and other solid objects...            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Comments (3)                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Jane Smith  •  2 hours ago                       │ │
│ │ I can reproduce this in build 1.2.3...              │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Bob Wilson  •  1 hour ago                        │ │
│ │ Confirmed. This also affects the raycasting...      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Write a comment...]                          [Post]│ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Elements**:

- Back navigation: `[← Back]`
- Title with ID: `#42 Title`
- Header badges and meta
- Content sections with headers
- Comment threads
- Reply input at bottom

---

## Layout Pattern 7: Two-Column Split

**Used in**: Settings, Configuration, Compare views

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                              │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│ Sections             │  General Settings                │
│                      │                                  │
│ ➤ General            │  ┌────────────────────────────┐  │
│   Profile            │  │ Project Name               │  │
│   Security           │  │ [Moksha DevHub          ]  │  │
│   Notifications      │  └────────────────────────────┘  │
│   Integrations       │                                  │
│   Advanced           │  ┌────────────────────────────┐  │
│                      │  │ Description                │  │
│                      │  │ [Project management...   ]  │  │
│                      │  └────────────────────────────┘  │
│                      │                                  │
│                      │  Theme                           │
│                      │  ○ Light                         │
│                      │  ● Dark Neumorphic Coral         │
│                      │  ○ Earthy                        │
│                      │                                  │
│                      │  [Save Changes]                  │
│                      │                                  │
└──────────────────────┴──────────────────────────────────┘
```

**Elements**:

- Left: Navigation menu (narrow)
- Right: Content area (wide)
- Active section indicator: `➤`
- Form inputs and controls
- Action buttons at bottom

---

## Common UI Elements (Atomic)

### Buttons

```
[Primary Button]    ← Coral gradient
[Secondary Button]  ← Neumorphic raised
[Text Link]         ← Plain text with hover
```

### Inputs

```
┌─────────────────────────────┐
│ [Text input field...      ] │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🔍 [Search with icon...   ] │
└─────────────────────────────┘
```

### Badges/Tags

```
🔴 Critical    ← Priority
✅ Open        ← Status
🏷️ Combat     ← Label/Module
```

### Cards

```
┌─────────────────────────────┐
│ Card Title          [⋯]     │
├─────────────────────────────┤
│ Card content goes here...   │
│                             │
│ [Action Button]             │
└─────────────────────────────┘
```

### Modals

```
     ┌───────────────────────┐
     │ Modal Title      [✕]  │
     ├───────────────────────┤
     │                       │
     │ Modal content...      │
     │                       │
     │ [Cancel]  [Confirm]   │
     └───────────────────────┘
```

---

## Tips for Generating Wireframes

1. **Start simple**: Basic structure first, details later
2. **Use emojis semantically**: 📊 for data, 🔍 for search, ⚙️ for settings
3. **Show interactions**: Use `➤` for active, `●` for indicators
4. **Indicate spacing**: Use blank lines for visual separation
5. **Label sections**: Add section headers for clarity
6. **Show states**: Use different icons for different states (✅ ⏸️ ✔️)

---

## Quick Reference

| Pattern           | When to Use         | Key Feature           |
| ----------------- | ------------------- | --------------------- |
| Sidebar + Main    | Most pages          | Persistent navigation |
| Sidebar + Filters | List pages          | Advanced filtering    |
| Header + Content  | Modals, dialogs     | Focused content       |
| Grid Layout       | Dashboard, overview | Multiple metrics      |
| List Layout       | Items, articles     | Scannable items       |
| Detail View       | Single item         | Full information      |
| Two-Column Split  | Settings, config    | Side navigation       |

---

**Token Cost**: ~200 tokens
**Usage**: Step 1 of ui-generation-workflow.md
**Next Steps**: Once layout approved → Step 2 (Apply theme)
