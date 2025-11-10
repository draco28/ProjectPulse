# Protocol Updater Sub-Agent

**Type**: Maintenance Agent (File Updates)
**Purpose**: Update protocol tracking files without consuming main thread context
**Invocation**: Automatic at Step 2, Step 4 checkpoints, and Step 5

---

## When to Invoke

**Automatically invoke this agent at:**

1. **Step 2 (Plan Creation)**: After user approves plan
   - Update `current-plan.md` (initial creation with checkboxes)
   - Update `current-todos.md` (initial task list with 0% progress)

2. **Step 4 (Checkpoints)**: At 15K, 30K, 45K, 60K, 75K, 90K tokens
   - Update `current-todos.md` (task progress, completion %)
   - Update `current-plan.md` (check boxes as criteria met)
   - Update `current-session-[timestamp].md` (checkpoint summary)

3. **Step 5 (Violations)**: If protocol violation discovered
   - Update `.agent/MANDATORY_SESSION_PROTOCOL.md` (add to violations log)
   - Update checklist if new enforcement rules needed

---

## Agent Capabilities

**This agent has access to:**
- Read tool (read existing files)
- Edit tool (update files with targeted edits)
- File system context (knows which files need updates)

**This agent does NOT:**
- Make technical decisions (that's parent agent's job)
- Invoke other sub-agents (single-purpose agent)
- Commit to git (parent agent handles commits)

---

## Invocation Pattern

### From Parent Agent

```
Parent: "Invoke protocol-updater sub-agent to update checkpoint files at 30K tokens"

Sub-agent prompt:
"Read current-session-20251110-1630.md to understand completed work.
Update the following files:

1. current-todos.md
   - Mark tasks 1-5 as complete [x]
   - Update progress: '5/10 tasks (50%)'

2. current-plan.md
   - Check boxes for completed criteria in US-016
   - Mark 5/8 criteria complete

3. current-session-20251110-1630.md
   - Add checkpoint summary at 30K tokens
   - List completed work since 15K checkpoint

Return brief summary of updates made."
```

### Sub-Agent Response

```
Sub-agent: "Checkpoint files updated (3 files changed).

Updates made:
- current-todos.md: 5/10 tasks complete (50%)
- current-plan.md: 5/8 criteria checked for US-016
- current-session.md: Added 30K checkpoint summary

Files ready for main thread to continue work."
```

---

## Token Savings

**Without sub-agent** (main thread):
- Read files: ~2K tokens
- Update logic: ~1K tokens
- Edit operations: ~2K tokens
- **Total: ~5K tokens per checkpoint**

**With sub-agent** (isolated thread):
- Sub-agent does all work: ~5K tokens (isolated)
- Parent receives summary: ~200 tokens
- **Main thread savings: ~4.8K tokens (96% reduction!)**

**Over 6 checkpoints:** 30K tokens saved = **15% of entire session budget**

---

## File Update Templates

### 1. current-todos.md Update

**Input from parent:**
- Completed task numbers: [1, 2, 3]
- Total tasks: 10
- Protocol steps complete: [1, 2, 3]

**Output format:**
```markdown
**Progress**: 3/10 tasks (30%)

1. ✅ Task description
2. ✅ Task description
3. ✅ Task description
4. ⏳ Task description (IN PROGRESS)
5. [ ] Task description

## Protocol Steps
- [x] STEP 1: Session initialized
- [x] STEP 2: Plan saved
- [x] STEP 3: Expert consultation
- [ ] STEP 4: Implementation
```

### 2. current-plan.md Update

**Input from parent:**
- Completed criteria for US-016: [1, 2, 3]
- Completed criteria for US-017: [1]

**Output format:**
```markdown
### US-016: Wiki List Page (5 points)

- [x] Create `/wiki/page.tsx`
- [x] Category filtering
- [x] Search functionality
- [ ] Grid or list view
```

### 3. current-session.md Checkpoint

**Input from parent:**
- Checkpoint token count: 30K
- Work completed since last checkpoint: ["WikiCard component", "WikiSearchBar component"]
- Next tasks: ["WikiListClient component"]

**Output format:**
```markdown
## Checkpoint at 30K Tokens (2025-11-10 17:15)

**Work completed since 15K:**
- Created WikiCard component (React.memo for performance)
- Created WikiSearchBar component (debounced search)

**Current progress:** 5/10 tasks (50%)

**Next tasks:**
- Create WikiListClient component (filter sidebar)

**Token budget remaining:** 170K/200K (85%)
```

---

## Violation Log Updates

**Input from parent:**
```
Violation discovered: Forgot to update current-plan.md at checkpoints
Type: File Abandonment
Steps violated: Step 2, Step 4
Resolution: Updated files RIGHT NOW
Lessons learned: [list]
New enforcement rule: [rule]
```

**Sub-agent adds to violations log:**
```markdown
**2025-11-10 Session - Violation #3:**

**Violation Type:** [Type from parent]
**Steps Violated:** [Steps from parent]

**What Happened:**
[Details from parent]

**Resolution:**
[Resolution from parent]

**Lessons Learned:**
[Lessons from parent]

**New Enforcement Rule:**
[Rule from parent]
```

---

## Benefits

1. **Token Efficiency**: 96% reduction in main thread token usage for file updates
2. **Main Thread Focus**: Parent agent focuses on implementation, not file management
3. **Consistent Updates**: Sub-agent follows templates, reduces formatting errors
4. **Checkpoint Reliability**: Updates happen in isolated thread, can't fail mid-work
5. **Violations Log**: Protocol violations documented without disrupting main work

---

## Implementation in MANDATORY_SESSION_PROTOCOL.md

**Update Step 2:**
```markdown
### STEP 2: PLAN CREATION
- Create implementation plan
- Get user approval
- **Invoke protocol-updater sub-agent** to create current-plan.md and current-todos.md
- Confirm: "✅ STEP 2 COMPLETE: Plan saved, protocol-updater invoked"
```

**Update Step 4:**
```markdown
### STEP 4: PROGRESS CHECKPOINTS
At 15K, 30K, 45K, 60K, 75K, 90K tokens:
- **Invoke protocol-updater sub-agent** with completed work summary
- Sub-agent updates current-todos.md, current-plan.md, current-session.md
- Confirm: "✅ CHECKPOINT at [X]K tokens: protocol-updater invoked, files updated"
```

**Update Step 5 (if violation):**
```markdown
### STEP 5.5: PROTOCOL VIOLATION HANDLING
If violation discovered:
- Document violation details
- **Invoke protocol-updater sub-agent** to add to violations log
- Sub-agent updates MANDATORY_SESSION_PROTOCOL.md
- Confirm: "✅ Violation documented by protocol-updater"
```

---

## Example: Full Checkpoint Flow

**Main Thread (Parent Agent):**
1. Reaches 30K tokens (system warning)
2. Summarizes work completed (2-3 sentences)
3. Invokes protocol-updater sub-agent (passes summary)
4. Receives brief confirmation (~200 tokens)
5. Continues implementation work

**Isolated Thread (Sub-Agent):**
1. Reads current-session.md, current-plan.md, current-todos.md
2. Updates all 3 files with checkpoint info
3. Returns summary to parent
4. Thread ends

**Token Cost:**
- Main thread: ~200 tokens (96% savings!)
- Sub-agent thread: ~5K tokens (isolated, doesn't count toward main budget)

---

## Future Enhancement: Auto-Invocation

**Goal**: Parent agent shouldn't need to remember to invoke sub-agent

**Mechanism**: System-level hooks
- At Step 2 completion → Auto-invoke protocol-updater
- At every 15K token boundary → Auto-invoke protocol-updater
- At Step 5 if violation → Auto-invoke protocol-updater

**Benefit**: Zero cognitive load on parent agent, guaranteed file updates

---

**Created**: 2025-11-10
**Purpose**: Reduce main thread context consumption for protocol file maintenance
**Token Savings**: ~30K tokens per session (15% of budget)
