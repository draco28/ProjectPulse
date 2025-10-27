# Task Context Files

This directory contains session-specific context files for progress tracking.

## File Types

### Active Files (Current Session)

- `current-session-[YYYYMMDD-HHMM].md` - Real-time session progress
- `current-todos.md` - Persistent todo list for current phase
- `current-implementation-[date].md` - Multi-phase implementation tracking

### Sub-Agent Reports

- `explore-[topic]-[timestamp].md` - Codebase exploration reports
- `architecture-[topic]-[timestamp].md` - Architecture analysis reports
- `prisma-design-[timestamp].md` - Database design plans
- `react-design-[timestamp].md` - Component architecture plans
- `synthesize-[topic]-[timestamp].md` - Documentation/SOP generation

### Implementation Plans

- `implementation-plan-[topic]-[date].md` - Detailed multi-phase implementation plans

### Archived (Completed)

- `archive/phase-[X]-day-[Y]-todos-COMPLETE.md` - Completed phase todos
- `archive/session-[timestamp]-COMPLETE.md` - Completed session files
- Older session files moved here after phase completion

## Recovery Workflow

If context lost or session interrupted:

1. Find most recent `current-session-[timestamp].md`
2. Read `current-todos.md` if exists
3. If multi-phase work, read `current-implementation-*.md`
4. Check STATUS.md for last checkpoint
5. Continue from "In Progress" task

## Maintenance

- Archive session files older than 7 days
- Keep current-todos.md until phase complete
- Sub-agent reports stay until referenced work is done
- Implementation plans stay until implementation complete

## Directory Structure

```
.agent/task/
├── README.md (this file)
├── templates/
│   ├── current-session-template.md
│   └── current-todos-template.md
├── archive/
│   ├── phase-X-day-Y-todos-COMPLETE.md
│   └── session-YYYYMMDD-HHMM-COMPLETE.md
├── current-session-YYYYMMDD-HHMM.md (active)
├── current-todos.md (active)
├── current-implementation-YYYYMMDD.md (if multi-phase work)
├── implementation-plan-[topic]-YYYYMMDD.md (if planned work)
└── [agent]-[topic]-[timestamp].md (sub-agent reports)
```

## Best Practices

### For Claude Code (Automated)

1. Create current-session file at session start
2. Update current-todos.md whenever TodoWrite changes
3. Update files after every major step
4. Archive old files on phase completion

### For Users (Manual)

1. Check current-todos.md to see progress at any time
2. If context lost, just say "Read current-session file and continue"
3. Implementation plans are safe - always reference them by filename
4. Sub-agent reports persist - can review anytime

## Token Efficiency

**Session file updates**: ~100 tokens each
**Todos file updates**: ~100 tokens each
**File reads on recovery**: ~1,000-2,000 tokens total

**Trade-off**: Spend ~200 tokens per task, gain complete progress persistence
