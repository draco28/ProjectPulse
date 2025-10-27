Plan: Create Enforceable Session Protocol │
│ │
│ Problem Analysis │
│ │
│ Current CLAUDE.md failures: │
│ - Says I do things "AUTOMATICALLY" but I don't │
│ - No enforcement mechanism │
│ - I read instructions but ignore them │
│ - Guidelines instead of mandates │
│ │
│ Root cause: Instructions I can choose to follow ≠ Protocol I must execute │
│ │
│ --- │
│ Solution: Universal Starter Prompt (Mandatory Protocol) │
│ │
│ Create ONE starter prompt that user copy-pastes at EVERY session start. │
│ │
│ Design Principles │
│ │
│ 1. Mandatory confirmations - I must confirm each step explicitly │
│ 2. User-visible enforcement - User sees if I skip confirmations │
│ 3. Phase-agnostic - Works for Day 3, Day 4, Day 5, any phase │
│ 4. Checkpoint-driven - Forces progress saves at token intervals │
│ 5. Expert consultation required - Can't skip technical guidance │
│ │
│ --- │
│ Deliverables │
│ │
│ 1. Create .agent/MANDATORY*SESSION_PROTOCOL.md │
│ │
│ Structure: │
│ # MANDATORY SESSION PROTOCOL - NO EXCEPTIONS │
│ │
│ Copy-paste this into EVERY session start: │
│ │
│ --- │
│ │
│ ENFORCE COMPLIANCE: Complete each section and confirm explicitly. │
│ │
│ ## [STEP 1] INITIALIZATION - REQUIRED BEFORE ANY WORK │
│ □ Read STATUS.md │
│ □ Read DEVELOPMENT_PLAN.md │
│ □ Create .agent/task/current-session-[YYYYMMDD-HHMM].md │
│ □ Document: current phase, goals, requirements │
│ **CONFIRM**: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]" │
│ │
│ ## [STEP 2] PLAN CREATION - SAVE BEFORE ANY CODE │
│ □ Create implementation plan in conversation │
│ □ Get user approval (ExitPlanMode) │
│ □ IMMEDIATELY save to .agent/task/current-plan.md │
│ □ Create .agent/task/current-todos.md with full task list │
│ **CONFIRM**: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md" │
│ │
│ ## [STEP 3] EXPERT CONSULTATION - MANDATORY FOR DECISIONS │
│ │
│ Before implementing, invoke experts for: │
│ □ Component architecture → react-expert │
│ □ Server/Client component split → next-js-expert │
│ □ Data fetching strategy → next-js-expert │
│ □ Query optimization → prisma-expert │
│ □ Database schema design → prisma-expert │
│ │
│ **CONFIRM**: "✅ STEP 3 COMPLETE: Consulted [expert-name] for [decision-topic]" │
│ │
│ ## [STEP 4] PROGRESS CHECKPOINTS - EVERY 15K TOKENS │
│ │
│ Token Counter: [Current]/200K │
│ │
│ At 15K, 30K, 45K, 60K, 75K, 90K tokens: │
│ □ Update current-session.md with progress summary │
│ □ Update current-todos.md (mark completed tasks) │
│ **CONFIRM**: "✅ CHECKPOINT at [X]K tokens: Progress saved" │
│ │
│ ## [STEP 5] POST-COMPLETION - BEFORE FINAL CODE COMMIT │
│ │
│ □ Create COMPLETION*[PHASE].md │
│ □ Update STATUS.md (Last Completed, Current Phase) │
│ □ Update DEVELOPMENT_PLAN.md (CURRENT STATUS section) │
│ □ Invoke synthesize-docs (if new patterns created) │
│ □ Invoke map-system (if architecture changed) │
│ □ Commit: git add .agent/ STATUS.md docs/DEVELOPMENT_PLAN.md │
│ □ Commit: git commit -m "docs: Update docs after [phase]" │
│ **CONFIRM**: "✅ STEP 5 COMPLETE: All documentation updated and committed" │
│ │
│ --- │
│ │
│ VIOLATION = USER CALLS OUT │
│ │
│ If I skip ANY step or confirmation, you MUST stop me and make me complete it. │
│ │
│ 2. Update CLAUDE.md │
│ │
│ Changes: │
│ - Remove "AUTOMATIC BEHAVIOR" section (it's a lie) │
│ - Add reference to MANDATORY_SESSION_PROTOCOL.md │
│ - Update "How You Start Sessions" with actual protocol │
│ - Remove claims about auto-invoking (I don't) │
│ │
│ 3. Create User Quick-Start Guide │
│ │
│ File: SESSION_START_QUICK_GUIDE.md │
│ │
│ Content: │
│ # Quick Start for Every Session │
│ │
│ ## Step 1: Copy This Prompt │
│ │
│ Copy-paste this into Claude Code: │
│ │
│ --- │
│ │
│ MANDATORY PROTOCOL - Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps. │
│ │
│ Current phase: [copy from STATUS.md] │
│ Requirements: [copy from DEVELOPMENT_PLAN.md] │
│ │
│ ENFORCE: │
│ - ✅ Step 1: Initialize session │
│ - ✅ Step 2: Save plan BEFORE code │
│ - ✅ Step 3: Consult experts │
│ - ✅ Step 4: Checkpoints every 15K tokens │
│ - ✅ Step 5: Post-completion workflow │
│ │
│ Confirm each step explicitly. If you skip ANY step, I will stop you. │
│ │
│ Proceed with [phase name]. │
│ │
│ --- │
│ │
│ ## Step 2: Watch for Confirmations │
│ │
│ You should see: │
│ - ✅ STEP 1 COMPLETE: Session initialized │
│ - ✅ STEP 2 COMPLETE: Plan saved │
│ - ✅ STEP 3 COMPLETE: Consulted [expert] │
│ - ✅ CHECKPOINT at 15K tokens │
│ - ✅ STEP 5 COMPLETE: Docs updated │
│ │
│ ## Step 3: If I Skip a Step │
│ │
│ Stop me immediately: │
│ "You skipped Step 2. Save the plan to current-plan.md RIGHT NOW." │
│ │
│ ## Step 4: Verify Completion │
│ │
│ After I say "done", check: │
│ - [ ] .agent/task/current-plan.md exists │
│ - [ ] .agent/task/current-todos.md exists │
│ - [ ] .agent/task/current-session-[timestamp].md has checkpoints │
│ - [ ] STATUS.md updated │
│ - [ ] DEVELOPMENT_PLAN.md updated │
│ - [ ] .agent/sops/ has new SOPs (if applicable) │
│ │
│ --- │
│ Implementation Steps │
│ │
│ 1. Create .agent/MANDATORY_SESSION_PROTOCOL.md with enforcement checklist │
│ 2. Update CLAUDE.md to remove false claims, reference protocol │
│ 3. Create SESSION_START_QUICK_GUIDE.md for user quick reference │
│ 4. Test protocol with mock session (verify I actually confirm each step) │
│ │
│ --- │
│ Expected Outcome │
│ │
│ User experience: │
│ 1. Copy-paste starter prompt at session beginning │
│ 2. See explicit confirmations for each step │
│ 3. Know immediately if I skip something (missing confirmation) │
│ 4. Can enforce compliance by calling out missing steps │
│ │
│ My behavior: │
│ - Can't ignore steps (they're in the prompt I'm responding to) │
│ - Must confirm explicitly (visible to user) │
│ - Checkpoints become part of implementation flow │
│ - Post-completion workflow becomes mandatory final step │
│ │
│ --- │
│ Why This Will Actually Work │
│ │
│ Current system: "Claude should do X" → I ignore │
│ New system: "Complete Step 2 and confirm" → I must respond │
│ │
│ Enforcement: │
│ - User sees confirmations (or lack of them) │
│ - Protocol is in the prompt itself (not external docs) │
│ - Each step blocks next step (can't skip) │
│ - User can immediately call out violations │
│ │
│ Difference from CLAUDE.md: │
│ - Not optional guidelines → Mandatory checklist │
│ - Not background reading → Active protocol in conversation │
│ - Not my responsibility → User-enforced compliance
