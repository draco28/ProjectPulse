---
name: file-editor
description: Bulk file editor for efficient multi-file modifications with automatic backups and verification
model: inherit
---

### Correct Invocation Pattern

```typescript
// Main agent invokes file-editor
await Task({
  subagent_type: 'file-editor',
  description: 'Update 5 memory bank files',
  prompt: `Update the following 5 memory bank files for Sprint 2:

1. .agent/active-context.md - Change Sprint 1 to Sprint 2, update current task
2. .agent/progress.md - Reset to 0/54 points baseline  
3. .agent/system-patterns.md - Append Sprint 2 patterns section
4. .agent/tech-context.md - Update Week 1-2 to Week 3-4
5. .agent/project-brief.md - Update current status section

Use bash heredoc for complete replacements, sed for pattern changes.
Create backups (.bak files) before all modifications.
Verify line counts and headers after changes.
Return concise summary with files modified, lines changed, verification status.`,
});
```

### Agent Response Flow

```markdown
file-editor agent (isolated thread):

1. Reads current state of all 5 files
2. Creates backups (.bak files)
3. Applies changes via sed/bash
4. Verifies each file (line count, header format)
5. Returns summary (500-1000 tokens)

Main agent (receives):

- ✅ 5 files modified successfully
- Backup files created
- Line count changes
- Verification status

Main agent → User:
"Memory bank updated for Sprint 2 via file-editor agent (5 files, 93% token savings)."
```

---

## Workflow Integration

### Sprint Transition Workflow

**Before (Manual in Main Thread)**:

1. Read memory bank files (15K tokens)
2. Update active-context.md (attempt Edit, fail, use sed: 20K tokens)
3. Update progress.md (attempt Edit, fail, use sed: 20K tokens)
4. Update system-patterns.md (append: 10K tokens)
5. Update tech-context.md (sed: 5K tokens)
6. Verify changes (5K tokens)
   **Total**: 75K tokens

**After (file-editor Agent)**:

1. Invoke file-editor with complete specifications (2K tokens)
2. Agent handles all operations in isolated thread (0 tokens main thread)
3. Receive summary (3K tokens)
4. Proceed with sprint work
   **Total**: 5K tokens (93% savings) ✅

### Protocol Integration Point

**Add to MANDATORY_SESSION_PROTOCOL.md Step 1**:

> **File Operations Check**: If session requires updating 3+ files (e.g., memory bank, configs),
> invoke `file-editor` sub-agent FIRST before proceeding. This saves 70-90K tokens.

---

## Testing & Validation

### Test Case 1: Single File Edit (Baseline)

```bash
# Test updating one file
Input: Update .agent/test.md line 5 "Sprint 1" → "Sprint 2"
Expected:
- Backup created (test.md.bak)
- Line 5 changed
- File still readable
- Summary returned
```

### Test Case 2: Bulk Memory Bank Update

```bash
# Test updating all 5 memory bank files
Input: Complete Sprint 2 transition specifications
Expected:
- 5 backups created
- All 5 files updated correctly
- Line counts match expectations
- Headers verified
- Summary with token savings reported
```

### Test Case 3: Error Recovery

```bash
# Test with locked file (intentional failure)
Input: Update file.md (but lock it first)
Expected:
- Backup created
- Update fails gracefully
- Rollback instructions provided
- Other files not affected
```

---

## Maintenance

### Version History

- **v1.0** (2025-11-05): Initial creation
  - Handles bulk file operations
  - Automatic backups
  - Verification checks
  - Token efficiency: 75-90% savings

### Future Enhancements (Post-MVP)

- **Dry-run mode**: Preview changes before applying
- **Diff generation**: Show exact changes made
- **Multi-pattern support**: Apply different patterns per file
- **Rollback automation**: One-command restoration
- **Git integration**: Auto-commit after successful batch

---

## Related Agents

**Similar Agents**:

- `explore-codebase` - Scans repo, returns summary (token efficient)
- `analyze-architecture` - Traces flows, returns insights (token efficient)
- `synthesize-docs` - Generates docs, saves files (similar pattern)

**file-editor Difference**:

- Specialized for **modifying existing files** (not reading/analyzing)
- Prioritizes **reliability** over Edit tool (Windows compatibility)
- Optimizes for **bulk operations** (3+ files at once)

---

## Success Metrics

**Token Efficiency**:

- Target: >75% token savings vs main thread
- Measured: (Main thread tokens saved) / (Total would have used)

**Reliability**:

- Target: 100% success rate (no Edit tool failures)
- Measured: Successful operations / Total invocations

**Time Efficiency**:

- Target: <5 minutes for 5-file updates
- Measured: Agent execution time end-to-end

---

**This agent saves 70-90K tokens per bulk file operation. Always invoke for 3+ file updates.**

---

Last updated: 2025-11-05
Next review: After 5 uses (validate token savings)