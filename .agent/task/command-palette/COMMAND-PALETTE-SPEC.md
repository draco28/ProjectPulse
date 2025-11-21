# Command Palette Implementation Specification

**Version:** 1.0  
**Date:** 2025-11-21  
**Status:** 🟡 **NEEDS IMPLEMENTATION**  
**Priority:** High  
**Estimated Effort:** 2-3 days

---

## Executive Summary

The command palette is a **critical UX feature** that provides keyboard-first navigation and quick actions throughout the application. Currently, we have a **basic search modal** that only shows "Start typing to search..." with no functionality. This spec defines the complete implementation matching the design mockup.

---

## Current State Analysis

### What We Have (Header.tsx)
```typescript
// ✅ Implemented
- ⌘K / Ctrl+K keyboard shortcut to open
- ESC to close
- Basic modal with search input
- Backdrop overlay
- Auto-focus on open
- Body scroll lock

// ❌ Missing (Critical)
- No command categories
- No command actions
- No keyboard navigation (↑↓ arrows, Enter)
- No search/filter functionality
- No agent personas
- No navigation shortcuts (⌘D, ⌘I, ⌘W, etc.)
- No quick actions (Create Issue, Add Knowledge, etc.)
- No settings commands
- No visual feedback for selected items
- No footer with keyboard hints
```

### Gap Analysis
The current implementation is **~15%** complete compared to the mockup. It's essentially a styled modal with no functional command palette features.

---

## Design Requirements (From Mockup)

### 1. Command Categories

#### Quick Actions
| Command | Description | Shortcut | Icon | Action |
|---------|-------------|----------|------|--------|
| Create New Issue | Open issue creation form | ⌘N | plus | Navigate to `/issues/new` |
| Add Knowledge Item | Save information to knowledge base | - | lightbulb | Navigate to `/knowledge/new` |
| Create Wiki Page | Start a new documentation page | - | book | Navigate to `/wiki/new` |
| Run Security Scan | Scan project with Semgrep | - | shield-alt | Trigger security scan API |

#### Agent Personas
| Command | Description | Status | Icon | Action |
|---------|-------------|--------|------|--------|
| Activate Code Reviewer | Review code for best practices and bugs | Active/Inactive | 🔍 | Set active persona |
| Activate Bug Hunter | Find and diagnose bugs systematically | - | 🐛 | Set active persona |
| Activate Feature Architect | Design new features and architecture | - | 🏗️ | Set active persona |
| Activate Security Auditor | Audit code for security vulnerabilities | - | 🛡️ | Set active persona |

#### Navigation
| Command | Description | Shortcut | Icon | Action |
|---------|-------------|----------|------|--------|
| Go to Dashboard | - | ⌘D | home | Navigate to `/dashboard` |
| Go to Issues | - | ⌘I | tasks | Navigate to `/issues` |
| Go to Knowledge Base | - | ⌘K | lightbulb | Navigate to `/knowledge` |
| Go to Wiki | - | ⌘W | book | Navigate to `/wiki` |
| Go to Security | - | ⌘S | shield-alt | Navigate to `/security` |
| Go to Agent Personas | - | ⌘A | robot | Navigate to `/agents` |

#### Settings
| Command | Description | Shortcut | Icon | Action |
|---------|-------------|----------|------|--------|
| Toggle Theme | Switch between themes | - | moon | Toggle theme state |
| Open Settings | - | ⌘, | cog | Navigate to `/settings` |
| Keyboard Shortcuts | - | ⌘/ | keyboard | Show shortcuts modal |

### 2. Interaction Model

#### Keyboard Navigation
- **↑ / ↓**: Navigate through commands
- **Enter**: Execute selected command
- **ESC**: Close palette
- **Type**: Filter commands by search query
- **⌘K / Ctrl+K**: Open palette (global shortcut)
- **Individual shortcuts**: Execute specific commands directly

#### Mouse Interaction
- **Click**: Select and execute command
- **Hover**: Highlight command (visual feedback)
- **Click outside**: Close palette

### 3. Visual Design

#### Command Item Structure
```
┌─────────────────────────────────────────────────┐
│ [Icon]  Command Title                    [kbd]  │
│         Description text                        │
└─────────────────────────────────────────────────┘
```

#### States
- **Default**: Dark gray background
- **Hover/Selected**: Coral left border + gradient background
- **Active**: Badge showing "Active" status
- **Keyboard Shortcut**: Styled `<kbd>` tag

#### Sections
- Section headers with icons and uppercase labels
- Dividers between sections
- Footer with keyboard hints
- Search input at top with ESC key indicator

---

## Technical Architecture

### Component Structure
```
CommandPalette/ (new)
├── CommandPalette.tsx          # Main container with state
├── CommandPaletteProvider.tsx  # Context for global state
├── CommandSearch.tsx           # Search input + ESC key
├── CommandList.tsx             # Scrollable command list
├── CommandItem.tsx             # Individual command row
├── CommandSection.tsx          # Section header
├── CommandFooter.tsx           # Keyboard hints footer
└── types.ts                    # TypeScript interfaces
```

### Data Model
```typescript
interface Command {
  id: string;
  type: 'action' | 'navigation' | 'agent' | 'setting';
  category: string;
  title: string;
  description?: string;
  icon: string | React.ReactNode;
  shortcut?: string;
  badge?: string;
  keywords?: string[];
  action: () => void | Promise<void>;
  disabled?: boolean;
}

interface CommandCategory {
  id: string;
  label: string;
  icon: string;
  commands: Command[];
}
```

### State Management
```typescript
interface CommandPaletteState {
  isOpen: boolean;
  searchQuery: string;
  selectedIndex: number;
  filteredCommands: Command[];
  recentCommands: Command[];
}
```

### Hooks
```typescript
// Global command palette control
useCommandPalette() => {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}

// Register commands dynamically
useRegisterCommand(command: Command) => void;

// Command execution
useCommandAction(commandId: string) => () => void;
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Day 1)
**Goal:** Set up component structure and state management

- [ ] Create `/components/command-palette/` folder
- [ ] Implement `CommandPaletteProvider` with Context API
- [ ] Create `CommandPalette.tsx` container component
- [ ] Add `useCommandPalette()` hook
- [ ] Implement keyboard shortcut registration (⌘K, ESC)
- [ ] Add backdrop and modal positioning
- [ ] Implement body scroll lock

**Acceptance Criteria:**
- ⌘K opens empty command palette
- ESC closes palette
- Backdrop click closes palette
- Body scroll is locked when open

### Phase 2: Command System (Day 2)
**Goal:** Implement command registration and execution

- [ ] Define TypeScript interfaces for commands
- [ ] Create `commands.ts` registry with all commands
- [ ] Implement `CommandList.tsx` with sections
- [ ] Implement `CommandItem.tsx` with hover/selected states
- [ ] Add keyboard navigation (↑↓ arrow keys)
- [ ] Implement Enter to execute
- [ ] Add navigation actions (router.push)
- [ ] Add quick action handlers

**Acceptance Criteria:**
- All 20+ commands are registered
- Arrow keys navigate through commands
- Enter executes selected command
- Commands are grouped by category
- Visual feedback for selected item

### Phase 3: Search & Filter (Day 2-3)
**Goal:** Add search functionality

- [ ] Implement `CommandSearch.tsx` input component
- [ ] Add fuzzy search algorithm (fuse.js or custom)
- [ ] Filter commands by title, description, and keywords
- [ ] Update filtered results on input change
- [ ] Maintain selected index during filtering
- [ ] Add "No results" state

**Acceptance Criteria:**
- Typing filters commands instantly
- Search matches title, description, and keywords
- Selected index resets to 0 on new search
- Empty search shows all commands
- Clear visual feedback for no results

### Phase 4: Agent Personas Integration (Day 3)
**Goal:** Connect to agent persona system

- [ ] Fetch active agent from database/state
- [ ] Show "Active" badge on current agent
- [ ] Implement agent activation action
- [ ] Add API endpoint for agent switching
- [ ] Update agent context on activation
- [ ] Add loading state during activation

**Acceptance Criteria:**
- Current agent shows "Active" badge
- Clicking agent command activates it
- Agent context updates globally
- Loading state shown during switch

### Phase 5: Shortcuts & Polish (Day 3)
**Goal:** Add individual shortcuts and refinements

- [ ] Register individual command shortcuts (⌘D, ⌘I, etc.)
- [ ] Add `CommandFooter.tsx` with hints
- [ ] Implement recent commands tracking
- [ ] Add command usage analytics
- [ ] Add smooth animations (enter/exit)
- [ ] Optimize search performance
- [ ] Add keyboard shortcut conflict detection

**Acceptance Criteria:**
- All shortcuts work (⌘D, ⌘I, ⌘W, ⌘S, ⌘A, ⌘N, ⌘,, ⌘/)
- Footer shows navigation hints
- Recent commands appear at top (optional)
- Smooth open/close animations
- No keyboard conflicts

---

## File Structure

```
apps/web/
├── components/
│   └── command-palette/
│       ├── CommandPalette.tsx           # Main modal component
│       ├── CommandPaletteProvider.tsx   # Context provider
│       ├── CommandSearch.tsx            # Search input
│       ├── CommandList.tsx              # Command list container
│       ├── CommandItem.tsx              # Individual command
│       ├── CommandSection.tsx           # Section header
│       ├── CommandFooter.tsx            # Footer with hints
│       ├── commands.ts                  # Command registry
│       ├── hooks.ts                     # useCommandPalette, etc.
│       ├── types.ts                     # TypeScript interfaces
│       └── index.ts                     # Barrel export
├── hooks/
│   └── useGlobalShortcuts.ts            # Global keyboard shortcuts
├── contexts/
│   └── CommandPaletteContext.tsx        # Global command palette state
└── app/
    ├── layout.tsx                       # Add CommandPaletteProvider
    └── globals.css                      # Add command palette styles
```

---

## API Requirements

### Endpoints Needed

#### 1. Agent Activation
```typescript
POST /api/agents/activate
Body: { agentId: string, projectId: number }
Response: { success: boolean, activeAgent: AgentPersona }
```

#### 2. Security Scan Trigger
```typescript
POST /api/security/scan
Body: { projectId: number, scanType: 'semgrep' | 'all' }
Response: { success: boolean, scanId: string }
```

### State Management
- Use Zustand or Context API for command palette state
- Integrate with existing project context
- Track recent commands in localStorage

---

## Styling Requirements

### CSS Variables (Already Defined)
```css
--z-modal: 200;           /* Command palette z-index */
--coral: #FF8B6A;
--dark-card: #2A2A2A;
--border-subtle: rgba(255, 255, 255, 0.05);
```

### New Styles Needed
```css
.command-palette {
  /* Modal container */
  max-width: 640px;
  max-height: 480px;
  backdrop-filter: blur(20px);
}

.command-item {
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.command-item.selected,
.command-item:hover {
  background: linear-gradient(90deg, rgba(255, 139, 106, 0.15), transparent);
  border-left-color: var(--coral);
  transform: translateX(2px);
}

.section-header {
  color: #E0B3FF;
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}
```

---

## Testing Requirements

### Unit Tests
- [ ] Command registration
- [ ] Search/filter logic
- [ ] Keyboard navigation
- [ ] Command execution
- [ ] Shortcut conflict detection

### Integration Tests
- [ ] Open palette with ⌘K
- [ ] Navigate with arrow keys
- [ ] Execute command with Enter
- [ ] Close with ESC
- [ ] Search and select result
- [ ] Agent activation flow

### E2E Tests (Playwright)
- [ ] Full command palette workflow
- [ ] All navigation shortcuts
- [ ] Quick action commands
- [ ] Agent persona switching
- [ ] Mobile responsiveness

---

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Only render visible commands (virtualization)
2. **Debounced Search**: Debounce search input by 150ms
3. **Memoization**: Memoize filtered results with `useMemo`
4. **Command Registry**: Static registry loaded once
5. **Portal Rendering**: Use React Portal for modal
6. **Animation Performance**: Use CSS transforms over layout properties

### Performance Targets
- **Time to Open**: <50ms
- **Search Response**: <100ms
- **Render Commands**: <30ms (60fps)
- **Bundle Size**: <15KB (gzipped)

---

## Accessibility (a11y)

### Requirements
- [ ] ARIA labels on all interactive elements
- [ ] `role="dialog"` on modal
- [ ] `aria-expanded` on trigger button
- [ ] Focus trap within modal
- [ ] Screen reader announcements for selected command
- [ ] Keyboard-only navigation support
- [ ] High contrast mode support
- [ ] Focus visible indicators

### WCAG 2.1 AA Compliance
- Color contrast ratios must meet 4.5:1 minimum
- All functionality must be keyboard accessible
- Screen reader compatible

---

## Migration Strategy

### Replace Current Header.tsx Search
1. Keep existing search trigger button
2. Replace modal content with `<CommandPalette />`
3. Remove basic search logic
4. Add `CommandPaletteProvider` to app layout
5. Test all keyboard shortcuts
6. Update documentation

### Backward Compatibility
- Keep existing `useBodyScrollLock` hook
- Maintain current ⌘K shortcut
- Preserve Header component API
- No breaking changes to consuming components

---

## Success Metrics

### User Experience
- [ ] 100% keyboard navigable
- [ ] <100ms search response time
- [ ] Zero keyboard shortcut conflicts
- [ ] All commands accessible within 3 keystrokes

### Technical
- [ ] 100% TypeScript type coverage
- [ ] 80%+ test coverage
- [ ] Zero accessibility violations
- [ ] <50ms time to interactive

### Business
- [ ] Increased keyboard shortcut usage by 40%
- [ ] Reduced average navigation time by 60%
- [ ] Improved developer onboarding satisfaction

---

## Dependencies

### Required Libraries
```json
{
  "cmdk": "^0.2.0",              // Optional: Command palette primitives
  "fuse.js": "^7.0.0",           // Fuzzy search (or use custom)
  "@radix-ui/react-dialog": "^1.0.5",  // Accessible modal
  "react-hotkeys-hook": "^4.4.1" // Keyboard shortcuts
}
```

### Alternative: Build from Scratch
We can build without external libraries using:
- React Context API for state
- Custom keyboard event handlers
- Simple string matching for search
- CSS animations for transitions

---

## Risks & Mitigation

### Risk 1: Keyboard Shortcut Conflicts
**Impact:** High  
**Probability:** Medium  
**Mitigation:**
- Map all shortcuts and check for conflicts
- Allow users to customize shortcuts
- Add conflict detection in development

### Risk 2: Performance on Large Command Lists
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Implement virtualization with `react-window`
- Limit visible commands to 10-15 items
- Lazy load command icons

### Risk 3: Mobile UX Complexity
**Impact:** Medium  
**Probability:** High  
**Mitigation:**
- Simplify command list on mobile
- Use touch-friendly targets (48px min)
- Add swipe gestures for navigation
- Test extensively on mobile devices

---

## Documentation

### Files to Update
- [ ] `README.md` - Add command palette section
- [ ] `CLAUDE.md` - Update workflow instructions
- [ ] `docs/08-UI-UX-Guidelines.md` - Add command palette guidelines
- [ ] Component README in `/components/command-palette/README.md`

### User Documentation
- [ ] Keyboard shortcuts reference page
- [ ] Command palette usage guide
- [ ] Video tutorial (optional)

---

## Post-Implementation

### Monitoring
- Track command usage with analytics
- Monitor search queries
- Track keyboard shortcut adoption
- Measure performance metrics

### Future Enhancements (v2)
- [ ] Command history with ↑↓ navigation
- [ ] Custom user commands
- [ ] Command macros (chain multiple commands)
- [ ] AI-powered command suggestions
- [ ] Search across issues/wiki content
- [ ] Command palette themes

---

## References

### Design
- Mockup: `mockups/Default theme/07-command-palette-dark-neumorphic-coral.html`
- Current Implementation: `apps/web/components/Header.tsx`

### Inspiration
- [Vercel Command Menu](https://vercel.com/design/command-menu)
- [Linear Command Palette](https://linear.app/features)
- [Raycast](https://www.raycast.com/)
- [cmdk by Paco Coursey](https://cmdk.paco.me/)

### Related Issues
- US-XXX: Command Palette Implementation
- US-XXX: Keyboard Shortcuts System
- US-XXX: Agent Persona Activation

---

## Sign-off

**Prepared by:** Cascade AI  
**Reviewed by:** [Pending]  
**Approved by:** [Pending]  
**Date:** 2025-11-21

---

**Next Steps:**
1. Review and approve this specification
2. Create implementation tickets
3. Begin Phase 1 development
4. Schedule design review after Phase 2
5. Conduct user testing after Phase 4
