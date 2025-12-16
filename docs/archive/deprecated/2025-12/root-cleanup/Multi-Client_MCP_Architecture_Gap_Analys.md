Multi-Client MCP Architecture Gap Analysis Report
Analysis Date: 2025-11-09
Reviewed By: Cascade
Documents Reviewed: 6 files

docs/archive/plans/mcp-code-execution-design.md
docs/03-Architecture.md
.agent/tech-context.md
.agent/system/mcp-tools-guide.md
docs/13-Project-Plan.md
.agent/task/mcp-code-execution-checklist.md
Executive Summary
Total Gaps Found: 21

🔴 Critical: 7
🟡 Important: 10
🟢 Minor: 4
Overall Assessment: Needs Revisions

Top 3 Priorities:

Verify/replace MCP capability negotiation assumption; define client detection and fallback mechanism without protocol changes.
Resolve timeline conflicts (Week 5 POC + dual-mode infra) across design, architecture, plan, and checklist; adjust to realistic scope.
Specify shared layer interfaces and privacy tokenization storage/controls to unblock dual-mode parity and security.
Category 1: Consistency Check
Gaps Found: 5

Gap 1: Tool count inconsistent (41 vs 59)
Severity: 🟡 Important
Location: docs/03-Architecture.md:64-67 vs 250
Issue: System Context says “41 tools across 9 features,” Container diagram says “59 MCP tools.”
Impact: Planning/test coverage drift; confusion on scope and parity requirements.
Recommendation: Align on authoritative tool count; update both sections and downstream references.
Gap 2: Week 5 POC timeline conflicts across docs
Severity: 🔴 Critical
Location:
mcp-code-execution-design.md:213-231, 778-802, 830-844, 883-893
.agent/system/mcp-tools-guide.md:961-973
docs/13-Project-Plan.md:690-706
.agent/task/mcp-code-execution-checklist.md:17-61
Issue: Design/checklist assert Sprint 2 Week 5 POC + dual-mode infra + 3 tools (both modes), while Plan/Tools Guide say Sprint 2 is design-only and integration begins Sprint 3.
Impact: Execution risk and misaligned sprint commitments.
Recommendation: Decide a single timeline: either (A) Week 5 POC limited scope (traditional only + detection stubs) or (B) keep Sprint 2 design-only and move dual-mode infra to Sprint 3. Reflect this choice in all four documents.
Gap 3: “All clients equal” vs mode-specific wording
Severity: 🟡 Important
Location:
mcp-code-execution-design.md:591-597, 606-614, 849-857
docs/03-Architecture.md:471-476
Issue: Non-negotiable parity claims coexist with “Works with: Claude Code (if supported)” phrasing for code execution.
Impact: Ambiguity about whether advanced features are available functionally to all clients (albeit less efficient).
Recommendation: Add a parity matrix per tool specifying the traditional equivalent behavior when code execution is unavailable.
Gap 4: Streaming mentioned without protocol specifics
Severity: 🟡 Important
Location: docs/03-Architecture.md:492-499; mcp-code-execution-design.md:766-772
Issue: Streaming promised, but no MCP-level mechanism specified (JSON-RPC chunking, notifications, or pagination fallback).
Impact: Risk to large dataset handling claims.
Recommendation: Define transport-level strategy (pagination-first; optional chunked notifications if spec supports).
Gap 5: Broken/incorrect cross-reference
Severity: 🟢 Minor
Location: docs/03-Architecture.md:574
Issue: Link “See docs/archive/plans/mcp-code-execution-design.md” appears incorrect from docs/ root.
Impact: Navigation friction.
Recommendation: Fix to “archive/plans/mcp-code-execution-design.md”.
Category 2: Technical Soundness
Gaps Found: 4

Gap 1: MCP capability negotiation not verified
Severity: 🔴 Critical
Location:
mcp-code-execution-design.md:634-656
docs/03-Architecture.md:536-553
Issue: Code shows new MCPServer({ capabilities: { tools: true, codeExecution: true }}) and client.supports.codeExecution. It’s unclear if MCP spec supports declaring/negotiating a “codeExecution” capability at handshake.
Impact: If unsupported, automatic detection fails and dual-mode switching breaks.
Recommendation: Verify MCP spec. If unsupported, implement explicit configuration: env var (PP_MCP_MODE), manual client flag, or a first-call probe tool with fallback to traditional.
Gap 2: “Two interfaces in one server” is mischaracterized
Severity: 🟡 Important
Location: mcp-code-execution-design.md:597-623; docs/03-Architecture.md:431-456
Issue: Code execution “interface” runs in the client sandbox; the server remains stdio tools. The dual-mode is an adapter pattern, not a second server transport.
Impact: Over-engineering risk; confusion about networking/protocol requirements.
Recommendation: Clarify model: single stdio MCP server; code-execution wrappers import tool adapters that call the same MCP server. Document this explicitly.
Gap 3: Streaming feasibility unclear
Severity: 🟡 Important
Location: docs/03-Architecture.md:492-499; mcp-code-execution-design.md:766-772
Issue: No protocol for streaming over stdio JSON-RPC is specified (e.g., notifications, chunked messages).
Impact: Large result handling may regress to pagination only.
Recommendation: Default to server-side pagination + compression; optionally research MCP “progress”/notifications. Add backpressure/timeouts.
Gap 4: Token savings math lacks methodology
Severity: 🟢 Minor
Location: mcp-code-execution-design.md:323-356
Issue: 98.4–98.9% reductions shown with example numbers but without measurement methodology.
Impact: Stakeholders may challenge claims; planning risk.
Recommendation: Define repeatable measurement (inputs, corpus, operation mix), add benchmark scripts, and publish raw results.
Category 3: Implementation Gaps
Gaps Found: 6

Gap 1: Shared layer interface/structure unspecified
Severity: 🟡 Important
Location: docs/03-Architecture.md:450-456; mcp-code-execution-design.md:618-622
Issue: No concrete interfaces for services/repositories, no DI pattern, no server vs code-exec adapters.
Impact: Code duplication/drift risk; parity hard to enforce.
Recommendation: Define service interfaces (e.g., IssueService with typed methods), repository interfaces, and two adapters (traditional tool → service, code-exec wrapper → service). Provide directory layout.
Gap 2: Capability detection/fallback logic unspecified
Severity: 🔴 Critical
Location: mcp-code-execution-design.md:630-663
Issue: Depends on handshake that may not exist; no fallback default defined; no partial capability handling.
Impact: Clients may fail or diverge silently.
Recommendation: Implement explicit mode selection (env/config), a probe tool, safe default to traditional; handle partial support via feature flags (e.g., discovery-only).
Gap 3: Privacy tokenization storage and access control missing
Severity: 🔴 Critical
Location: mcp-code-execution-design.md:391-401, 176-207
Issue: Example tokenMap shown, but no storage (in-memory/db), TTL, collision avoidance, access control, audit logging, or re-identification policy.
Impact: Privacy/security non-compliance.
Recommendation:
Storage: in-memory LRU with TTL + optional persisted encrypted store for re-identification.
Access: server-side role checks; never expose map to model.
Audit: log de-tokenization events.
Collision: prefix+monotonic counter.
Performance: batch tokenization, regex perf guardrails.
Gap 4: Mock GPT client/test harness undefined
Severity: 🟡 Important
Location: mcp-code-execution-design.md:805-825
Issue: No client libraries or approach to simulate traditional-only client.
Impact: Week 5 validation blocked.
Recommendation: Build a minimal Node test client speaking MCP stdio (JSON-RPC “tools/list”, “tool/call”); script fixtures to simulate varying “capabilities” via CLI flags.
Gap 5: Streaming/backpressure/timeout behavior unspecified
Severity: 🟡 Important
Location: mcp-code-execution-design.md:766-772
Issue: No backpressure, timeout, or chunk boundary policy.
Impact: Hanging sessions; resource leaks.
Recommendation: Implement timeouts, chunk size limits, and an “abort” parameter; expose server-configurable defaults.
Gap 6: Measurement instrumentation missing
Severity: 🟢 Minor
Location: mcp-code-execution-design.md:227-231, 476-491
Issue: Targets (<5K tokens) lack standardized counters.
Impact: Inconsistent benchmarks.
Recommendation: Add counters/logging in both modes; publish a benchmark harness and store results.
Category 4: Edge Cases & Error Scenarios
Gaps Found: 3

Gap 1: Client lies about capabilities
Severity: 🔴 Critical
Location: Multi-Client plan prompts; design logic at mcp-code-execution-design.md:630-663
Issue: No verification strategy if a client claims code execution but fails.
Impact: Runtime failures.
Recommendation: Include an explicit “probe” step that exercises code-exec-only feature; auto-fallback to traditional if probe fails; record client profile for session.
Gap 2: Mixed capability clients
Severity: 🟡 Important
Location: mcp-code-execution-design.md:630-663
Issue: No degraded mode mapping (e.g., discovery-only).
Impact: Inconsistent UX.
Recommendation: Define partial capability profiles and a mapping to supported operations.
Gap 3: Sandbox/security for code execution
Severity: 🔴 Critical
Location: mcp-code-execution-design.md:563-577 (risks), features at 115-120
Issue: No concrete sandbox limits (CPU/mem/time), FS/network isolation, or threat model.
Impact: High security risk.
Recommendation: Specify sandbox runtime, resource quotas, FS jail, disallow network by default, and enumerate attack surfaces.
Category 5: Documentation Gaps
Gaps Found: 3

Gap 1: Developer dual-mode guide missing
Severity: 🟡 Important
Location: N/A (not found across all docs)
Issue: No “How to add a tool in both modes,” testing patterns, or DI examples.
Impact: Onboarding friction; code drift.
Recommendation: Create “Dual-Mode Tool Developer Guide” with patterns and examples.
Gap 2: Client integration guide missing
Severity: 🟡 Important
Location: N/A
Issue: No guidance on connecting clients, declaring capabilities, or detecting server features.
Impact: Testing and adoption blocked.
Recommendation: Provide sample “minimal MCP client,” capability flags, expected responses.
Gap 3: Migration/rollback guide missing
Severity: 🟢 Minor
Location: mcp-code-execution-design.md:496-525 (migration notes are generic)
Issue: No step-by-step migration or rollback (e.g., Path B fallback), no DB/config changes.
Impact: Higher switch-over risk.
Recommendation: Author a migration playbook (Path A→B/C, rollback triggers, config switches).
Category 6: Sprint Planning Gaps
Gaps Found: 2

Gap 1: Week 5 scope is optimistic
Severity: 🔴 Critical
Location: mcp-code-execution-design.md:883-893; .agent/task/mcp-code-execution-checklist.md:17-61
Issue: Dual-mode infra + 3 tools (both modes) + multi-client tests in one week likely unrealistic given gaps above.
Impact: Schedule slip risk; quality compromises.
Recommendation: Narrow Week 5 scope to traditional-only POC + detection stubs, or move dual-mode infra to Sprint 3; add explicit buffer.
Gap 2: Checklist lacks dual-mode/parity tasks
Severity: 🟡 Important
Location: .agent/task/mcp-code-execution-checklist.md:17-61, 64-145
Issue: No items for client detection, fallback, parity testing, or streaming behavior.
Impact: Critical work can be missed.
Recommendation: Add tasks: parity matrix by tool, detection probe, fallback defaults, streaming/pagination policy, security sandbox definition, benchmarks.
Category 7: Architectural Risks
Risk 1: Complexity overhead (dual implementations)
Severity: 🟡 Important
Location: mcp-code-execution-design.md:713-727
Recommendation: Enforce shared services/adapters; automated parity tests.
Risk 2: Code divergence between modes
Severity: 🔴 Critical
Location: Throughout (no parity strategy)
Recommendation: Centralize business logic; CI parity tests invoking both modes for same inputs.
Risk 3: Expanded security surface
Severity: 🔴 Critical
Location: mcp-code-execution-design.md:563-577
Recommendation: Define sandbox policy, auditing, and periodic security reviews.
Risk 4: Mode-specific performance variance
Severity: 🟡 Important
Location: Not specified
Recommendation: SLA per mode; telemetry dashboards; adaptive fallback if thresholds breached.
Risk 5: Env/runtime inconsistency
Severity: 🟢 Minor
Location: .agent/tech-context.md:573-577 (stdio+HTTP future) vs docs/03-Architecture.md:295-299 (stdio only); .agent/tech-context.md:838-854 (Windows path)
Recommendation: Clarify that http transport is “future” and not required; unify runtime guidance (Mac mini vs Windows path in examples).
Prioritized Action Items
Must Fix Before Sprint 2
Replace capability negotiation assumption with explicit mode selection/probe and fallback.
Decide a single Week 5 plan; synchronize design, architecture, plan, and checklist.
Define shared service interfaces and dual adapters to prevent code drift.
Specify privacy tokenization storage/TTL/access control/audit strategy.
Establish streaming policy (pagination-first; optional notifications) with timeouts/backpressure.
Should Fix During Week 5
Create minimal Node MCP test client for traditional mode; script capability flags.
Add measurement instrumentation and publish a benchmark harness.
Author Dual-Mode Developer Guide and Client Integration Guide.
Build parity matrix for 3 POC tools; run parity tests in CI.
Nice to Have
Migration/rollback playbook for Path A/B/C.
Security threat model document for code execution sandbox.
Fix cross-reference/link hygiene and update tool counts across docs.
Recommendations
Adopt “single MCP server + dual adapters” narrative to simplify architecture and align with how code execution actually integrates (client-side wrappers importing tool modules that call the MCP server).
Default to traditional MCP for all clients; enable code execution as an optimization when explicitly selected and verified. Maintain functionality parity via shared services and test parity checks.
Re-scope Week 5 to a realistic POC: traditional mode with detection stubs and measurement; move dual-mode infra to Sprint 3 unless additional buffer is added.
Treat privacy and security as first-class: implement tokenization controls and sandbox constraints before enabling code execution in any client.
Conclusion
The dual-mode strategy is feasible with a shared-services + adapters approach, but current documents rely on unverified MCP capability negotiation and contain schedule inconsistencies that would block smooth execution. With clarified detection/fallback, concrete shared interfaces, and a realistic POC scope, the plan can proceed while preserving cross-client parity.

Findings
[consistency] Tool count mismatch: docs/03-Architecture.md:64-67 vs 250.
[consistency] Conflicting Week 5 plans: design/checklist vs plan/tools guide (see locations above).
[technical] Capability negotiation likely unsupported by MCP as written; needs alternative.
[implementation] Shared layer contracts and tokenization storage/controls missing.
[edge cases] No verification for false capability claims; no partial capability handling.
[docs] Missing developer/client/migration guides.
[planning] Week 5 scope is optimistic without the above in place.
I used the “Gap Analysis Output Format” defined in Multi-Client_MCP.md to structure this report and line-referenced the six specified files.
Task status: Completed the comprehensive gap analysis with categorized severities, line references, and prioritized actions.