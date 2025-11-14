You are editing the file docs/01-PRD.md for the ProjectPulse project.
Your goal is to make this PRD describe only end-user and agent-facing product behavior, and remove all references to our internal “doc coding” workflow (local markdown files, .agent folders, git hooks, etc.).

2.1 Global Rules
• End-user product = cloud-based:
• PostgreSQL database as single source of truth
• Web UI for humans
• MCP tools for agents
• You must not mention any of the following as product behavior:
• STATUS.md
• DEVELOPMENT_PLAN.md
• current-todos.md
• current-session-...
• current-plan.md
• .agent/
• .claude/
• git hook or git hooks
• markdown sync or auto-generated markdown
• If some behavior is currently described as “writing a file in the repo”, rewrite it as:
• “persisting structured data in the database”
• and “exposing it via the Web UI and MCP tools”.
• Keep the meaning and structure of the document the same (sections, headings, main ideas).
Only change the implementation/wording to be DB + UI + MCP, not file-based.

⸻

2.2 Step 1 – Insert Scope Clarification

Right after the front-matter and before the heading ## 1. Project Overview, insert this new section:

Scope Clarification: Product-Only, No Doc Coding
This PRD defines only end-user and agent-facing features of the ProjectPulse product.

The following are explicitly out of scope for this document and MUST NOT be treated as product features:

Local markdown files used in internal workflows (for example: STATUS.md, DEVELOPMENT_PLAN.md, current-todos.md, current-session-*.md, current-plan.md)
Special folders such as .agent/ or .claude/ in user repositories
Git hooks that protect or validate these files
Any other internal “doc coding” rituals used by the ProjectPulse team
ProjectPulse, as a product, is a cloud-based system with:

PostgreSQL database as the single source of truth
A web UI for human users
An MCP server and tools for AI agents
All state that matters to end users and their agents MUST live in the ProjectPulse database and be exposed via Web UI and MCP tools — not via local files in the user’s repository.

2.3 Step 2 – Fix Core Value Proposition

In section ### 1.3 Core Value Proposition, update the “Self-Sufficiency” bullet that currently mentions markdown.
• Find the line that says (or is very close to):
• Database as single source of truth (markdown files auto-generated)
• Replace that bullet with:
• Database as single source of truth (all state stored in PostgreSQL and exposed via Web UI and MCP tools)

Make sure no bullet in Core Value Proposition mentions markdown files or git hooks anymore.

⸻

2.4 Step 3 – Clean Persona 1 Workflows (Remove File Names)

In section ### 2.1 Persona 1: "Universal AI Agent":

2.4.1 5-Step Mandatory Protocol
• Step 1 (using sprint.getCurrentTask()) is fine.
• For Steps 2–5:
• Remove any reference to:
• current-session-[YYYYMMDD-HHMM].md
• current-plan.md
• current-todos.md
• STATUS.md
• DEVELOPMENT_PLAN.md
• Rephrase these steps so they only mention:
• Creating and updating records in the database
• Accessing them via MCP tools and the Development Cycle page / other UI pages

Examples of rewrites:
• Change text like:
• “Create session file: current-session-[YYYYMMDD-HHMM].md (auto-generated from DB)”
to something like:
• “Create a Session record in the database (timestamp, notes, token usage), visible in the Development Cycle page and via MCP tools.”
• Change text like:
• “Save to database → Auto-generate current-plan.md”
to:
• “Save the implementation plan as a structured Plan entity in the database, retrievable via MCP tools and visible in the Plans/Development Cycle UI.”
• Change text like:
• “Save todos to database → Auto-generate current-todos.md”
to:
• “Save the todo list as structured Todo records in the database, exposed via the Development Cycle / Todos UI and MCP tools.”

2.4.2 Feature-Specific Workflows and Example Daily Flow
• In the “Feature-Specific Workflows” and “Example Daily Flow” under Persona 1:
• Remove any mention of markdown files being updated, for example:
• “current-todos.md auto-updated”
• “App syncs STATUS.md”
• Replace them with phrases like:
• “The Development Cycle view and MCP responses reflect the latest todos and progress from the database.”

2.4.3 Pain Points Solved (Persona 1)
• In the “Pain Points Solved” list:
• Replace bullets like:
• “Before: Manual markdown file updates (drift, inconsistencies) → After: Auto-generated from DB”
• With more general product language, for example:
• “Before: Manual progress tracking spread across files and tools → After: Centralized database-backed Development Cycle and MCP APIs.”
• Keep the conceptual “before/after” but remove specific markdown filenames.

⸻

2.5 Step 4 – Rewrite Use Case 3.1 (5-Step Protocol, Agent-Driven)

In section ### 3.1 5-Step Mandatory Protocol (Agent-Driven):
1. Step 1 – Initialize Session
• Keep the use of sprint.getCurrentTask().
• Remove text like:
• “Create session file: current-session-[YYYYMMDD-HHMM].md (auto-generated from DB)”
• Replace it with something like:
• “Create a new Session record in the database with timestamp, notes, and token usage. This session is visible on the Development Cycle page and via MCP tools.”
2. Step 2 – Create Implementation Plan
• Change wording like:
• “Save to database → Auto-generate current-plan.md”
• To something like:
• “Save the implementation plan as a structured Plan entity in the database, retrievable via MCP tools and visible in the UI (Plans/Development Cycle).”
3. Step 3 – Create Todo List
• Change wording like:
• “Save todos to database → Auto-generate current-todos.md”
• To:
• “Save the todo list as structured Todo records in the database, exposed via the Development Cycle / Todos UI and MCP tools.”
4. Step 4 – Implement with Checkpoints
• Keep the idea of checkpoints every ~15K tokens using sprint.checkpoint({ ... }).
• Remove any mention of:
• STATUS.md
• DEVELOPMENT_PLAN.md
• markdown sync
• Describe this step instead as:
• “Updating Session and Task progress in the database”
• “Triggering recalculation of rolled-up progress (Task → Day → Week → Phase)”
• “Keeping the Development Cycle page and MCP responses in sync with the current progress state.”
5. Step 5 – Post-Completion
• Remove any mention of:
• “Archive plan to .agent/task/archive/”
• Product behavior defined as “committing markdown files”.
• Instead, say that:
• The task and associated plan are marked completed in the database,
• Workflow state is updated via MCP tools,
• And the Development Cycle page reflects completion.
6. Success Criteria
• Remove any sentence that says “all markdown files stay synchronized with database”.
• Replace with something like:
• “The database, MCP tools, and UI remain perfectly in sync as the single source of truth.”

⸻

2.6 Step 5 – Rewrite Use Case 3.4 (Checkpoint Update Workflow)

In section ### 3.4 Checkpoint Update Workflow (Agent-Driven):
• Keep the scenario of hitting a checkpoint at ~15K tokens.
• In the numbered workflow:
1. Step 1 (detecting token usage) is fine.
2. Step 2 (calling sprint.checkpoint) is fine.
3. Step 3 (updating Session table and rolling up progress) is fine.
4. For Step 4:
• Remove the description about regenerating markdown files:
• STATUS.md
• DEVELOPMENT_PLAN.md
• current-session-[timestamp].md
• Replace Step 4 with text like:

 - “The backend updates the Session and Task records, recalculates rolled-up progress (Task → Day → Week → Phase), and ensures the Development Cycle page and MCP responses reflect the new progress state.”

 	•	Update the Success Criteria:
•	Remove “all markdown files updated atomically”.
•	Replace with:

- “Checkpoint completes in <500ms, and the Development Cycle page and MCP APIs reflect the updated progress state consistently.”

2.7 Step 6 – Final Cleanup: Remove All Doc-Coding References
Perform a final pass over 01-PRD.md and:
• Remove or rewrite any remaining line containing these substrings:
• STATUS.md
• DEVELOPMENT_PLAN.md
• current-todos.md
• current-session-
• current-plan.md
• .agent/
• .claude/
• git hook or git hooks
• markdown sync or auto-generated markdown
• When rewriting:
• Always replace file-based wording with database + MCP + Web UI wording.
• Keep the same intent and guarantees (progress consistency, source of truth, workflow safety), but implement them as cloud behavior, not local files.

The final 01-PRD.md should:
• Read naturally and consistently.
• Use only cloud/database/MCP/UI concepts for end-user features.
• Contain no references to internal doc-coding mechanics or local markdown files.


Inserted the scope section and refactored 01-PRD to be DB + UI + MCP only. Key changes:

Added “Scope Clarification: Product-Only, No Doc Coding” before Project Overview.
Rewrote all product behavior to use database + Web UI + MCP, not local files.
Removed all mentions of internal doc-coding mechanics (.agent/, .claude/, git hooks, markdown sync, file auto-generation).
Preserved the document’s structure, sections, and intent.
What I changed in docs/01-PRD.md:

Scope section: Inserted the new “Product-Only, No Doc Coding” clarification with database, UI, and MCP as the SoT.
Vision and benefits: Replaced “Clean Repositories … .agent/” with general “No repository clutter from agent artifacts.”
Traditional problems/solution: Removed references to .agent/, .claude/, STATUS.md; described generic local-folder/file clutter instead; removed “virtual .agent/ folder” language.
1.3 Core Value Proposition: Updated “Self-Sufficiency” bullet to “Database as single source of truth (all state stored in PostgreSQL and exposed via Web UI and MCP tools).”
Persona 1 workflows:
5-step protocol: Rewrote Steps 2–5 to use DB entities (Session, Plan, Todo records), real-time UI/MCP sync, and DB completion; removed session/plan/todos markdown mentions and archive to .agent/.
Feature-specific workflows and example daily flow: Replaced file updates (current-todos.md, STATUS.md) with UI/MCP reflecting DB state.
Pain points: Replaced “manual markdown file updates” with “manual progress tracking spread across files/tools” → “centralized DB-backed Development Cycle + MCP APIs.”
Use Case 3.1 (5-Step Protocol): Replaced file-generation language with DB entities + UI/MCP exposure; clarified checkpoints update DB + roll-ups and keep UI/MCP in sync; success criteria now “DB, MCP, and UI remain perfectly in sync.”
Use Case 3.4 (Checkpoint Update): Removed markdown regeneration; Step 4 now updates DB + roll-ups and ensures UI/MCP reflect progress; success criteria updated accordingly.
MVP Feature table and details:
Sprint/Phase Tracking: “auto-markdown sync” → “real-time UI/MCP sync”; purpose updated; removed git hooks/markdown bullets; removed sprint.syncMarkdown().
Wiki: Removed “/docs folder + git-backed”; now “parse JSDoc/docstrings; persist and version in DB; cross-linking and UI rendering.”
Memory Bank System: “files” → “entries”; removed “virtual .agent/ folder”; changed examples and metrics to refer to entries and searches; updated tools from file semantics to entry semantics.
Sub-agents: Reports/docs now persisted in DB (no .agent/ paths); returns record IDs/links; “report persistence” stored in DB.
Agent Dashboard: Removed browsing .agent/.claude; lists DB-backed entities; viewer shows entries and rich text; “Recent Reports” from DB.
Metrics: “Markdown Sync” → “System Sync” with target 0 drift between DB, UI, and MCP.
Explicitly Excluded: Replaced bidirectional markdown sync item with “Local File Sync: Not supported…”.
Minor: “Workflows from CLAUDE.md” → “predefined workflows (product documentation).”
Small cleans: skill example prisma-expert.md → prisma-expert; wiki example now persists to DB and visible via UI.
Validation

Removed/rewrote all occurrences of: STATUS.md, DEVELOPMENT_PLAN.md, current-todos.md, current-session-, current-plan.md, .agent/, .claude/, git hook(s), markdown sync/auto-generated markdown. The only mentions of these are now in the new out-of-scope scope section (as required).
Replaced file-based phrasing with DB + UI + MCP wording while keeping the same guarantees (single source of truth, progress consistency, workflow safety).
Want me to:

Apply the same cleanup to other docs (e.g., SRS, Architecture) for consistency?
Tighten terminology in Memory Bank sections further (replace remaining “.md” examples with “entry/page” throughout)?
1 file changed

Undo

View all changes
01-PRD.md
+108
-91

Tighten terminology in Memory Bank sections further then i will provide you instructions for srs doc


Tightened Memory Bank terminology across the PRD to be database-first and file-agnostic.

What I updated in docs/01-PRD.md:

Memory Banks: Replaced all “.md” file references with “entry”/“record” phrasing.
Examples: “system-patterns.md” → “system-patterns entry”, “progress.md” → “progress entry”, “project-brief.md” → “project-brief entry”.
Success metrics and examples now refer to entries and searches, not files/grep.
Sub‑Agent workflows: Reports/docs persist in database (no file paths or commits).
“Saves full report to file” → “Persists full report in the database”.
“Report persistence: saved to files” → “saved in the database”.
Agent Dashboard: Viewer shows “entries”; “Recent Reports” from DB; removed .agent/.claude and file examples.
Wiki UI: “rich markdown editor” → “rich text editor”.
Documentation references: “from CLAUDE.md” → “from product documentation”; “architecture.md” link phrasing updated to “Architecture wiki page”.
Checkpoint/Auto-Gen workflows: All file-based actions translated to DB updates + log entries, with consistent terminology (entries, versions, snapshots).
Quick spot checks

Removed file-based terms except in the explicit out-of-scope Scope section: STATUS.md, DEVELOPMENT_PLAN.md, current‑*.md, .agent/, .claude/, git hooks, markdown sync/auto-generated markdown.
Updated Core Value Proposition self-sufficiency bullet to DB + UI + MCP wording.
Persona 1 5-step flow, Use Case 3.1, and 3.4 now fully DB + UI + MCP.
If you’re happy with this, share your SRS cleanup instructions and I’ll align 02-SRS.md similarly (DB + UI + MCP only, no doc-coding artifacts).

1 file changed

Undo

View all changes
01-PRD.md
+20
-20

You are editing the file docs/02-SRS.md for the ProjectPulse project.
Your goal is to make this SRS:

Fully consistent with the updated 01-PRD.md
Describe only end-user and agent-facing product behavior
Remove all references to internal “doc coding” workflows:
Local markdown files like STATUS.md, DEVELOPMENT_PLAN.md, current-*.md
.agent/ or .claude/ folders
Git hooks that protect/validate those files
“Markdown sync” as a system feature
The product is a cloud-based platform with:

PostgreSQL database as the single source of truth
Web UI for humans
MCP tools for AI agents
Local repos must remain clean (no AI clutter). The SRS must reflect that.

2.1 Global Rules
While editing 02-SRS.md, obey these rules:

End-user product behavior must be defined only in terms of:

Database tables and records
Web UI pages and components
MCP tools and APIs
The following MUST NOT be described as product behavior in any FR:

STATUS.md
DEVELOPMENT_PLAN.md
current-todos.md
current-session-...
current-plan.md
.agent/
.claude/
/docs folder as a target for generated wiki docs
git hook or git hooks
“markdown sync” or “auto-generated markdown files” as a core mechanism
It is OK for SRS to mention markdown as a content format (e.g., “session notes are markdown”, “wiki content rendered as markdown in UI”), as long as:

The markdown is stored in the database, not as .md files in the repository.
If some behavior is currently described as “writing a file in the repo”, rewrite it as:

“Persisting structured data in the database”
“Exposing it via Web UI and MCP tools”
Preserve:

FR numbering (FR-001, FR-002, etc.)
Overall structure, sections, and traceability links
But adjust descriptions, inputs, outputs, side effects, and validation to match the cloud-only design.
2.2 Step 1 – Insert Scope Clarification (Top of SRS)
Under “Document Purpose”, after the existing paragraph, insert this new subsection:

### Scope Clarification: Product-Only, No Doc Coding

This SRS defines only **end-user and agent-facing system behavior** of the ProjectPulse product.

The following are explicitly **out of scope** for these requirements and MUST NOT be treated as product features:

- Local markdown files used in internal workflows (for example: `STATUS.md`, `DEVELOPMENT_PLAN.md`, `current-todos.md`, `current-session-*.md`, `current-plan.md`)
- Special folders such as `.agent/` or `.claude/` in user repositories
- Git hooks that protect or validate these files
- Any other internal “doc coding” rituals used by the ProjectPulse team

ProjectPulse is implemented as a **cloud-based system** where:

- PostgreSQL is the **single source of truth** for all project data
- A **web UI** is used by human users
- An **MCP server** and tools are used by AI agents

All state that matters to end users and their agents MUST live in the ProjectPulse database and be exposed via Web UI and MCP tools — not via local files in the user’s repository.


2.3 Step 2 – Clean Sprint/Phase Tracking FRs (FR-001 to FR-025)

FR-001 (Create Phase Hierarchy)
	•	This is already DB-based and fine.
	•	Do not change semantics, except if it mentions markdown files or /docs output anywhere (remove such wording if present).

FR-002 (Update Progress Percentage)
Current version still says:
	•	Outputs: “Markdown sync triggered (STATUS.md, DEVELOPMENT_PLAN.md updated)”

Rewrite FR-002 as follows:
	•	Keep the inputs, progress validation, and roll-up logic.
	•	Change Outputs to something like:

**Outputs:**

- Updated entity with new progress value
- Auto-calculated parent progress (average of all children)
- Updated progress immediately visible in:
  - Development Cycle page (web UI)
  - MCP tools that read progress state


	Remove the line about “Markdown sync triggered (STATUS.md, DEVELOPMENT_PLAN.md updated)”.
	•	In Dependencies, remove any reference to FR-005 as “markdown sync”; instead, dependencies should just be FR-001 (hierarchy) and whatever is needed for roll-up.

FR-004 (Create Checkpoint)
Currently FR-004 includes:
	•	Outputs: “Markdown sync result: { filesUpdated: string[], success: boolean }”
	•	Side Effects: “Triggers markdown sync (FR-005)”

Rewrite FR-004:
	•	Keep:
	•	Inputs (taskId, tokenUsage, progress, notes)
	•	Session record creation
	•	Task progress update
	•	Roll-up behavior via FR-002
	•	Change Outputs to something like:

**Outputs:**

- Created Session record with timestamp (YYYYMMDD-HHMM)
- Updated Task progress (set to input progress value)
- Updated rolled-up progress for Day, Week, Phase (via FR-002)

	•	In Side Effects, remove the “Triggers markdown sync (FR-005)” line entirely.
	•	If needed, add:

	**Side Effects:**

- Progress and session changes are immediately visible in the Development Cycle page (web UI) and MCP tools.

	•	Remove any reference to markdown files or file sync from FR-004.

FR-005 – Repurpose from “Sync Markdown Files” → “Ensure DB/UI/MCP Consistency”
FR-005 currently defines “Sync Markdown Files” with outputs like generating:
	•	STATUS.md
	•	DEVELOPMENT_PLAN.md
	•	current-todos.md
	•	current-session-[timestamp].md
	•	current-plan.md

This is pure doc-coding and must not remain as-is.

Repurpose FR-005 into a cloud-only consistency guarantee, for example:
	•	Rename the title to: #### FR-005: Ensure DB/UI/MCP State Consistency

	•	Replace the entire Description / Inputs / Outputs / Template Structure / Validation with something like: 

	**Description:** Ensure that any change to sprint/phase tracking state in the database (progress, sessions, tasks) is consistently reflected in all read paths (web UI pages and MCP tool responses) without stale or conflicting views.

**Inputs:**

- Implicitly triggered by:
  - Progress updates (FR-002)
  - Checkpoints (FR-004)
  - Status transitions (FR-010)
  - Any CRUD operation on Phase/Week/Day/Task/Session entities

**Outputs:**

- All relevant read APIs and UI views reflect the latest database state:
  - Development Cycle page shows updated hierarchy and progress values
  - MCP tools reading progress (e.g., `sprint.getCurrentTask`, `sprint.getHierarchy`) return updated values
- No stale cached values beyond acceptable latency thresholds

**Validation:**

- After write operations, subsequent reads (API/UI) must reflect updated state within defined latency (e.g., <500ms)
- Consistency checks ensure that:
  - Progress values shown in UI match values stored in database
  - MCP tool responses match database values for the same entities

**Priority:** P0 (Critical - Ensures database as single source of truth)

**Dependencies:** FR-001, FR-002, FR-004

**Traceability:**

- PRD: Section 1.3 (Database as single source of truth)
- Architecture: ADR-002 (Database as Source of Truth)
- Tests: TEST-008, TEST-009 (UI/MCP consistency checks)
- Backlog: US-008, US-009



	•	Remove all references to markdown files, git hooks, and templates that produce .md files.

FR-011 (Git Hook Enforcement) – Remove Git, Keep SoT Concept
FR-011 currently describes pre-commit git hooks that protect markdown files. This is doc-coding.

Change FR-011 to a generic “Write Path Enforcement” requirement that protects the database as SoT without mentioning git hooks or files.
	•	Rename the title to: #### FR-011: Write Path Enforcement for Progress & Workflow Data

		Replace the Description with: **Description:** Ensure that progress and workflow-related data (Phase/Week/Day/Task/Session and workflow state) can only be modified through approved application interfaces (MCP tools and web UI APIs). Prevent unsupported write paths from bypassing validation and business rules.


	•	Inputs/Outputs should describe:
	•	Inputs: Any attempt to modify these entities (via API, MCP tools, admin UI).
	•	Outputs: Request is either accepted (passes validation and business rules) or rejected with an error.
	•	Validation examples:
	•	Updates must go through defined service layer functions.
	•	Direct modifications via unapproved channels are rejected (or not supported).
	•	Remove all details about:
	•	“Protected Files”
	•	STATUS.md, DEVELOPMENT_PLAN.md, current-todos.md, current-session-*.md, current-plan.md
	•	Commit messages, git hooks, --no-verify, etc.
	•	Keep Priority and Traceability but update them to refer to:
	•	“Database as source of truth”
	•	API-level enforcement, not git.

FR-012 (Markdown File Validation) – Repurpose to “Derived View Consistency Validation”
FR-012 currently validates markdown files.

Repurpose it as data consistency validation for derived views (UI dashboards, roll-up views, reports) instead of files.
	•	Rename the title to: #### FR-012: Derived View Consistency Validation
		•	Description example: **Description:** Validate that all derived views (e.g., progress dashboards, reports) are consistent with the underlying database state. Ensure that display-level aggregations and percentages match values stored in the database.


	•	Replace file-based validation checks with:
	•	Ensure that:
	•	Calculated progress percentages in the UI match DB values.
	•	Hierarchy labels (Phase/Week/Day/Task) match DB entities.
	•	Timestamps and session data shown to users reflect actual DB records.
	•	Remove all mentions of markdown syntax, file write rollback, etc.
	•	Keep it as P1 High – but purely about DB-driven UI/API correctness.

FR-013 (Bulk Progress Updates)
	•	Currently: “Single markdown sync triggered (not per-entity)” in outputs or side effects.
	•	Remove any mention of markdown or sync here.
	•	Outputs should simply be:
	•	All entities updated with new progress values in a single transaction.
	•	Parent progress re-calculated via FR-002.
	•	No references to FR-005 as “markdown sync”.

FR-017 (Import Hierarchy from JSON)
	•	Currently includes: “Markdown sync triggered” in outputs.
	•	Remove that phrase.
	•	Keep:
	•	Entities created in DB.
	•	Progress recalculated via roll-up (FR-002).
	•	Optional: add that after import, state is visible in UI/MCP (not via files).

FR-019 (Task Reordering Within Day)
	•	Currently: “Tasks displayed in new order in UI and markdown”.
	•	Replace that sentence with: - Tasks displayed in new order in the web UI and via MCP tool responses.

	•	Remove the reference to markdown.

⸻

2.4 Step 3 – Clean Other Doc-Coding References (Wiki, Memory Banks, Sub-Agents, etc.)

In later sections of the SRS (Knowledge, Skills, Wiki, Health, Memory Banks, Agent Personas, Research Agents), search for and fix any remaining doc-coding patterns.

Specifically, search the entire 02-SRS.md for:
	•	/docs or “/docs folder”
	•	.md filenames used as system-of-record:
	•	project-brief.md
	•	system-patterns.md
	•	tech-context.md
	•	active-context.md
	•	progress.md
	•	.agent/
	•	.agent/task/
	•	.claude/
	•	“virtual .agent/ directory”
	•	“git-backed (wiki changes = git commits)”
	•	“File system MCP”, when it’s about writing docs to repos as part of product

For each occurrence:

2.4.1 Wiki Requirements
	•	Any FR that says wiki content is generated into /docs folder or committed to git as .md files must be changed to:
	•	Wiki content is stored as records in the database (e.g., wiki_pages table), with:
	•	slug, title, contentMarkdown, version, createdBy, updatedBy, etc.
	•	Versioning can be described as DB-level versioning or audit/history tables, not “git commits”.
	•	Allowed wording:
	•	“Wiki content stored in database, rendered as markdown in UI”.
	•	“Version history stored as DB records/audit trail”.
	•	Forbidden wording (remove/replace):
	•	“Stored in /docs folder”.
	•	“Git-backed wiki (wiki changes = git commits)”.
	•	“Writes .md files into user repo”.

2.4.2 Memory Bank System
	•	Any FR that describes memory banks as files (e.g., project-brief.md in .agent/ directory) must be rewritten as:
	•	Memory banks are rows in a memory_banks table (or equivalent).
	•	Each bank has fields: type (project-brief, system-patterns, etc.), content, tokens estimate, lastUpdated, etc.
	•	Agents read/write these via MCP tools.
	•	Replace:
	•	“5 memory bank files: project-brief.md, system-patterns.md, tech-context.md, active-context.md, progress.md”
with something like:
	•	“5 memory bank entries in the database: Project Brief, System Patterns, Tech Context, Active Context, Progress.”
	•	Remove any .agent/ paths from SRS; refer to DB tables/entities instead.

2.4.3 Research Agent / Sub-Agent Reports
	•	Any FR that says:
	•	“Reports saved to .agent/task/”
	•	“Saved as .md files in repo”
must be rewritten to:
	•	Reports are stored as records in a research_reports table and/or related tables.
	•	UI can display them; MCP tools can fetch them by ID.
	•	Replace file paths with:
	•	“database IDs”
	•	“links/URLs returned by API or MCP tools”.

⸻

2.5 Step 4 – Final Global Cleanup (Search & Rewrite Pass)

Perform a final pass over the entire 02-SRS.md and:
	1.	Remove or rewrite any remaining line that contains these substrings as product behavior:
	•	STATUS.md
	•	DEVELOPMENT_PLAN.md
	•	current-todos.md
	•	current-session-
	•	current-plan.md
	•	.agent/
	•	.claude/
	•	/docs folder (as a target for generated files)
	•	git hook or git hooks
	•	git-backed (when tied to wiki/doc storage)
	•	markdown sync or auto-generated markdown (when describing system-level sync)
	2.	When rewriting:
	•	Always replace file-based wording with database + MCP + Web UI wording.
	•	Keep the same intent and guarantees (progress consistency, single source of truth, workflow safety), but implement them as cloud behavior, not local files.
	•	Preserve any mention of “markdown” that refers to:
	•	Input format stored in DB (e.g., session notes, wiki content).
	•	Rendering in UI (e.g., “markdown rendered in UI”).
	3.	Confirm:
	•	After edits, the only occurrences of file-specific names like STATUS.md, DEVELOPMENT_PLAN.md, .agent/, .claude/ appear only in the SRS scope clarification section, where they are explicitly declared “out of scope”.
	•	No FR describes local markdown files or git hooks as part of the ProjectPulse product.

⸻

2.6 Final State Requirements

The final 02-SRS.md should:
	•	Be fully aligned with the updated 01-PRD.md:
	•	Cloud-based product
	•	DB + Web UI + MCP as SoT
	•	No local doc-coding as product behavior
	•	Preserve:
	•	FR numbering (FR-001, FR-002, …)
	•	Structure and traceability (PRD ↔ SRS ↔ Backlog ↔ Tests)
	•	Use only cloud/database/MCP/UI concepts when defining features.
	•	Move all doc-coding concepts (markdown files in repos, git hooks, .agent/ folders) out of SRS (except for the explicit “out of scope” note).

I’ve updated 02-SRS.md to align with the cloud-only PRD and removed doc-coding as product behavior. Key changes:

Scope section: Added “Scope Clarification: Product-Only, No Doc Coding” under Document Purpose. It explicitly excludes local markdown files, .agent/.claude folders, git hooks, and doc-coding rituals, and states DB + Web UI + MCP as the single SoT.

Sprint/Phase FRs:

FR-002: Outputs now reflect DB updates and immediate visibility in the Development Cycle page and MCP tools. Removed “markdown sync”.
FR-004: Description and Outputs now mention DB session/roll-up updates; removed “triggers markdown sync”. Dependencies and Traceability adjusted.
FR-005: Repurposed from “Sync Markdown Files” to “Ensure DB/UI/MCP State Consistency” (consistency across UI and MCP reads within <500ms).
FR-011: Renamed to “Write Path Enforcement for Progress & Workflow Data” (API/MCP-only writes; no git hooks/files).
FR-012: Renamed to “Derived View Consistency Validation” (UI/API views match DB).
FR-013: Removed “markdown sync” output/dependency.
FR-017: Removed “Markdown sync triggered”; Outputs note UI/MCP visibility.
FR-019: Outputs: “displayed in UI and via MCP tool responses”.
FR-020: Clarified “Markdown stored in database; rendered in UI”.
Wiki FRs:

FR-114: “Wiki Version Control (DB-Backed)” (wiki_pages + wiki_page_versions; no /docs or git).
FR-115: “Wiki Export” as downloadable archive/API (no /docs folder targets).
Memory Bank System (FR-146–153):

Section reworded to DB entries (no .agent folder).
FR-146/147/150: Titles/Outputs/Validation reworded to DB memory_banks rows.
FR-151: Session start uses memory bank entries; “entries must exist”.
FR-152: Fast pattern lookup via DB search (no grep/paths).
FR-153: Context recovery loads Session/Todos/Progress entries (no current-*.md).
Research Agents (FR-154–158):

Inputs now use sessionId (no contextFilePath).
Outputs return reportId (DB) not file paths.
Reports persist in database; parallel execution returns IDs; validation updated.
Post‑MVP Memory Bank Enhancements:

FR-176/181: Removed file system references; DB-only updates and performance criteria.
FR-178/179/180: Renamed and reworded to update memory banks in DB, not files.
FR-183: Repurposed to “Audit Log Memory Bank Changes” (audit entries instead of git commits).
Snapshot examples preserved but generalized to memory bank versions (no file snapshots).
Dashboard (FR-193) and Data layer:

DB-backed skills, reports, and validations (no .claude/.agent paths).
Data sources list changed to database-only; token counts read from stored content.
Knowledge/Skills cleanups:

FR-102: Skill export/import via API JSON (no .claude compatibility).
FR-086: Export only JSON (removed “.md files for git versioning”).
NFRs:

NFR-007: Read-path update performance (<500ms UI/MCP visibility).
NFR-013: Graceful degradation describes read-path fallback (no markdown sync).
NFR-019: Write Path Enforcement (API/MCP only), replaces git hooks.
“Git Hooks” appendix section replaced with “Write Path Enforcement”.
FR-025: Replaced with “Development Cycle View Customization” (UI configuration; no markdown templates or STATUS.md sections).

Final global cleanup:

Removed all occurrences of STATUS.md, DEVELOPMENT_PLAN.md, current‑*.md, .agent/, .claude/, git hooks, “markdown sync”, and “/docs folder” as a write target across SRS (except in the scope clarification).
Spot checks

Banned substrings occur only in the Scope Clarification section.
FR numbering and structure preserved.
All changed behavior is defined in terms of DB records, Web UI components, and MCP tools/APIs.
If you’d like, I can:

Sweep the remaining post-MVP onboarding examples to replace “tech-context.md/system-patterns.md/progress.md” mentions with “memory bank entry” consistently in narrative examples.
Run a final pass on Architecture/Backlog docs to ensure consistency with these SRS changes.
1 file changed

Undo

View all changes
02-SRS.md
+202
-257

we have been updating in a waterfall model updating top level docs then going down, now i want you to check the docs folder and let me know which document to update next


Recommended Next

Update docs/03-Architecture.md next.
Why

It’s the highest‑impact top‑level spec after PRD/SRS and contains many doc‑coding references that conflict with the new cloud‑only model (92 hits found for STATUS.md, .agent/, git hooks, “markdown sync”, etc.). Aligning architecture with DB + Web UI + MCP ensures downstream docs follow the same design.
Other High‑Impact Files (next in line)

docs/05-AgentOps-Plan.md: 74 conflicts; contains workflow mechanics tied to repo files.
docs/13-Project-Plan.md: 27 conflicts; mentions “auto‑markdown sync”, git hooks.
docs/12-Backlog.md: 22 conflicts; FR/US text referencing markdown/file sync.
docs/04-Data-and-Model-Spec.md: 9 conflicts; needs DB entities clarified for wiki/memory banks.
docs/06-API/openapi.yaml: 13 conflicts; ensure endpoints describe DB‑backed views, not file outputs.
If you want, I can start with 03-Architecture.md and apply the same DB + UI + MCP cleanup pattern used for PRD/SRS.

before you proceed, do you fully understand our vission for our product completely after updating two top level docs ?


Yes — here’s my concise understanding of the product vision, now reflected in PRD + SRS.

What It Is

Cloud‑style platform for agent‑first project management, packaged for self‑hosting.
PostgreSQL is the single source of truth; no repo files as product behavior.
Web UI for humans + MCP tools for agents; both read/write the same DB state.
Core Tenets

Sprint/Phase hierarchy with roll‑ups; checkpoints every ~15K tokens.
Real‑time consistency: DB updates immediately visible in UI and MCP reads.
Memory Banks as DB entries (Project Brief, System Patterns, Tech Context, Active Context, Progress) with versions/snapshots.
Wiki/Knowledge/Skills stored and versioned in DB; markdown is content format, not files.
Write path enforcement: only approved APIs/MCP tools mutate state; strict validation and auth.
No doc‑coding rituals: no STATUS.md/DEVELOPMENT_PLAN.md/current-*.md, no .agent/.claude folders, no git hooks as product behavior.
Implications

Local repos remain clean; all end‑user state lives in DB, exposed via UI/MCP.
Latency targets: UI/MCP reflect writes in <500ms; token‑efficient context loading.
Testing, security, and type‑safety standards apply across APIs and tools.
If this matches your intent, I’ll proceed to bring docs/03-Architecture.md in line with this model. Two quick confirmations:

We’re treating “cloud‑based” as the architecture pattern, deployed locally/self‑hosted (not SaaS), correct?
Any priority focus within Architecture (e.g., Memory Banks model, read‑path consistency, or MCP boundary) you want addressed first?
no our application will be deployed on cloud and work like a saas where users on subscription model will get access to create new projects and all it's details and using ai agent they can connect via mcp http stream to our web app for all project features we provide.

Our architecture docs will have many features aligned which are very clear for end users but there are features which are too similar on how we are building this project using ai workflow so those feature are getting mixed up and being considers as dog fooding to build this project but are actual features of our project.
tell me if you understood now


Yes. Updated vision understood:

SaaS product: Users subscribe, create projects, and use the Web UI. Their AI agents connect over MCP via HTTP streaming to our cloud app to use all features (no repo writes).
Single source of truth: PostgreSQL. All features (Sprint/Phase, Memory Banks, Wiki, Knowledge, Skills, Issues, Workflow Orchestration) are DB-backed, visible in UI, accessible via MCP.
Dogfooding vs product: Any feature that mirrors our internal AI workflow is treated as a first-class product capability if end users/agents can use it via UI/MCP. Internal-only build rituals (e.g., local markdown files, .agent/, git hooks) are not product features and stay out of customer-facing docs.
Proposed Architecture doc alignment (next update):

Multi-tenant SaaS: Tenant/Org, Users, Subscriptions, Projects; RBAC/role bindings per project.
AuthN/Z: UI (OIDC/JWT), MCP (project-scoped API keys or OAuth client creds), per-tool scopes, rate limiting.
MCP over HTTP streaming: define transport (SSE or WebSocket), request/response envelopes, tools as HTTP endpoints, streaming events for progress/updates.
Data model: Memory banks/wiki/issues/skills/sprint check-ins as normalized tables with versioning, snapshots, audit log; derived views for Development Cycle.
Real-time consistency: <500ms UI/MCP read-path freshness (cache invalidation/eventing).
Observability, quotas, and billing hooks (per-tenant limits).
Explicit “No repo mutations” statement; optional read-only integrations don’t become SoT.
Quick clarifications before I patch 03-Architecture.md:

MCP transport: SSE vs WebSocket for the streaming channel?
Auth for MCP: API keys per project vs OAuth client credentials?
Tenancy model: orgs-with-projects or projects directly owned by users?
Any region/data residency constraints or billing provider integration to reference?
MCP transport: SSE vs WebSocket for the streaming channel? for this you can check our implementation work of sprint 5.5 where we built mcp server, you can check using git history or docs/features folder
Auth for MCP: API keys per project since multiple team members may want to work on same project but login from different user account.
projects directly owned by users but you can check the docs folder to see if we already have decision for this
no egion/data residency constraints or billing provider integration to reference as it is something we did not decide yet or you can check docs folder to see if we decided earlier

Please make sure to first understand that we are already in implementing phase and has implemented till sprint 6 as per project plan so your decisions should take them in consideration


Yes, and I’ve verified key implementation details from Sprint 5.5 so our next steps align with what’s already built.

What’s already implemented (Sprint 5.5)

MCP transport: JSON-RPC 2.0 over HTTP with stateless requests and a session header.
Source: docs/MCP_ARCHITECTURE.md: app/api/mcp/route.ts has POST for JSON-RPC and a planned GET handler for SSE streaming. WebSocket is not part of the design; SSE is planned for streaming.
Session management: Mcp-Session-Id header with server-side session manager (in-memory for MVP; Redis/DB later).
Integration: MCP server embedded in Next.js App Router.
Auth (current docs): “None for local” during MVP; OAuth planned for cloud. We’ll keep this consistent with your direction below.
Your decisions incorporated

MCP streaming transport: Use SSE (GET /api/mcp streaming) for progress/events; keep existing POST /api/mcp JSON-RPC for tool calls. No WebSocket needed.
MCP auth: Per-project API keys. We’ll define Mcp-Api-Key (project-scoped) with rotate/revoke endpoints, scopes, rate limits, and audit.
Ownership: Projects directly owned by users. Current docs show MVP “no multi-tenancy” and some forward-looking multi-tenant notes; we’ll align Architecture to SaaS with user-owned projects first, leaving room to add orgs later.
SaaS model: Multi-tenant cloud deployment with subscriptions. No region/data residency or billing provider locked yet; Architecture will reflect TBD and keep seams (per-tenant limits, quotas) ready.
Proposed concrete adjustments in Architecture doc (respecting Sprints 1–6)

Transport: Document POST /api/mcp for JSON-RPC, GET /api/mcp for SSE (Phase 2 rollout), Mcp-Session-Id semantics, back-pressure/heartbeat for SSE.
AuthZ/AuthN:
UI: OIDC/JWT (Phase 4 per plan).
MCP: Mcp-Api-Key per project, header-based auth, project-scoped permissions, rotation API, rate limits per key/project.
Tenancy: User-owned projects for SaaS v1; add “orgs” as evolvable layer (future ADR). Keep all DB foreign keys ready for a simple tenant discriminator when needed.
Consistency: Read-path freshness target <500ms (what we already set in SRS); event fanout to SSE stream and UI cache invalidation.
Backwards compatibility: Do not change existing POST JSON-RPC flow; add auth as a middleware wrapper when enabled; keep SSE opt-in.
If you’d like, I can now:

Patch docs/03-Architecture.md to encode SSE as the streaming channel, add per-project API key auth for MCP, and set user-owned projects as the tenancy model, while preserving all implemented Sprint 5.5 details.
yes proceed with patching now so that architecture doc is fully aligned with top docs like prd and srs then we will go further down


Proceeding with Architecture doc alignment. I updated docs/03-Architecture.md to match the PRD/SRS cloud SaaS vision and removed file-based doc-coding behavior.

What changed

Principles and scope

Database as Source of Truth: clarified as PostgreSQL with UI/MCP read paths; no repo file writes.
Cloud SaaS: replaced “Local-First ($0)” with “Cloud SaaS with per-project access and API keys”.
Removed product mentions of internal markdown export.
MCP transport and diagrams

Transport: HTTP JSON-RPC for tool calls; SSE for streaming progress/notifications.
Updated container and deployment mermaid diagrams:
MCP labeled “HTTP JSON-RPC + SSE”.
Removed filesystem container/edges.
Production diagram uses HTTP JSON-RPC + SSE, not WebSocket.
Actor/Interfaces: AI Agent → MCP now “HTTP JSON-RPC + SSE”.
External systems

Git: Out of scope—ProjectPulse does not write to repos; no git hooks in product.
File System: Removed as product component.
Primary actors and workflows

Agent’s interface: “MCP over HTTP JSON-RPC + SSE; UI/MCP reflect DB state”.
Removed “Internal Markdown Export” as a workflow.
Use case and sequence logic

Replaced all “trigger markdown sync” with “update UI/MCP consistency”.
Checkpoints and completion update DB and roll-ups; UI/MCP reflect changes.
Rewrote sequence steps to read/write via DB/MCP instead of STATUS.md/current-*.md.
Replaced markdown sync triggers section with “Read-Path Consistency Triggers” (UI/MCP freshness).
Sub-agent/report flows

Sub-agents read/write Session notes and research reports in DB; return reportId (no .agent files).
“synthesize-docs” updates DB entries, not folders.
Security and auth

Replaced “Unauthorized MCP access: stdio local” with “Per-project API keys; HTTP auth middleware”.
Authentication & Authorization:
UI: OIDC/JWT.
MCP: Per-project API keys (Mcp-Api-Key), rotation/revocation, scopes, rate limiting.
Added MCP headers and lifecycle:
Mcp-Api-Key: <project_api_key>
Mcp-Session-Id: <uuid> for HTTP session continuity
RBAC and orgs noted as future; user-owned projects now.
Conclusion and summary

Summary updated to “MCP tools (HTTP JSON-RPC + SSE)” and “UI/MCP consistency over DB”; removed local-only claims.
Notable leftovers (safe-to-keep comparisons)

The “No Local Files Philosophy” section still shows a contrast listing traditional .agent/ and STATUS.md to illustrate what the product replaces. It doesn’t claim the product writes files; it clarifies DB tables replace them. This keeps the end-user message clear while avoiding doc-coding as product behavior.
What remains to align (optional next pass)

A few legacy demo/template/comment blocks around markdown templates and one “participant SessionFile” reference are now functionally disconnected; I redirected most flows but can aggressively prune the remaining lines if you want a fully file-free narrative everywhere.
If you want me to remove the comparison table entirely (the “Traditional AI Development” tree), I can replace it with a pure DB model graphic/description.
Next step

I can do a quick cleanup pass to remove the residual markdown template comments and any stray stdio/markdown references, then move on to docs/05-AgentOps-Plan.md and docs/13-Project-Plan.md to bring them in line with the SaaS + DB + UI + MCP model.
1 file changed

Undo

View all changes
03-Architecture.md
+111
-163

do a quick cleanup pass to remove the residual markdown template comments and any stray stdio/markdown references


Completed a quick cleanup pass to remove residual markdown templates and stdio references.

What I changed

docs/03-Architecture.md

Replaced remaining file-based sequences with DB + UI + MCP flows:
Session and todos now persist via MCP/DB; UI invalidation replaces “markdown sync”.
Checkpoint sequences use a Consistency Service (cache invalidation + SSE) instead of file writes.
Validation prerequisites updated from “STATUS.md read” to “current task loaded”.
Removed markdown templates and git hook examples:
Deleted STATUS.md/DEVELOPMENT_PLAN.md template blocks and pre/post-commit hook sections.
Replaced with a concise Consistency Layer code stub.
Cleaned deployment and container references:
Removed File System containers/edges where they implied product behavior.
Kept the “Traditional AI Development” comparison but clarified entries as non-product files.
Updated stray references:
“Plan saved to current-plan.md” → “Plan saved (DB)”.
Removed filesystem references (.claude/skills/, docs/ folder) in integration sections.
Replaced any remaining FS steps and markdown sync triggers with DB updates and UI/MCP consistency events.
docs/02-SRS.md

Updated transport in “4.3 MCP Server”:
stdio → HTTP JSON-RPC (tool calls) + SSE (streams).
Current status

No product behavior references to STATUS.md, DEVELOPMENT_PLAN.md, current-*.md, git hooks, or markdown sync remain in the main flows.
Architecture diagrams and sequences now reflect HTTP JSON-RPC + SSE and DB-backed state with UI/MCP read-path consistency.
The remaining mentions of .agent/, STATUS.md in Architecture are only in the “Traditional AI Development” comparison block, clearly framed as non-product context (acceptable unless you want them purged entirely).
Optional next step

I can remove the entire “Traditional AI Development (Problems)” comparison block to eliminate even illustrative mentions, if you prefer a strictly product-only document.
2 files changed
+63
-212

Undo

View all changes
02-SRS.md
+1
-1

03-Architecture.md
+62
-211

now i need you to check which doc to update now as per waterfall model


Based on a fresh scan, the next highest‑priority doc to align is:

docs/05-AgentOps-Plan.md:73
Why this next

Highest density of doc‑coding references among active, user‑facing docs.
Directly defines agent workflows; must match PRD/SaaS + DB + UI + MCP model to avoid confusion.
Upstream of project plan and backlog details.
Recommended order after that

docs/13-Project-Plan.md:27
Mentions “auto‑markdown sync”, git hooks; sets sprint scope and deliverables — update to DB/UI/MCP.
docs/12-Backlog.md:18
FR/US language still references file outputs — align to database entities and UI/MCP behaviors.
docs/06-API/openapi.yaml:15
Ensure endpoints describe DB‑backed resources and MCP integration (HTTP JSON‑RPC + SSE).
docs/04-Data-and-Model-Spec.md:9
Confirm models for Plans, Sessions, Todos, Memory Banks, Wiki reflect DB‑only storage and derived views.
Lower priority (historical/archive/audits)

docs/audits/* and docs/archive/*: numerous references but archival; update later or annotate as non‑product history.
Want me to start with docs/05-AgentOps-Plan.md now?

yes proceed with docs/05-AgentOps-Plan.md now


Next up: I updated docs/05-AgentOps-Plan.md to align with the PRD/SRS cloud model and removed file-based/doc-coding artifacts.

Key updates

Scope and transport

Added scope clarification: cloud-only; no local files treated as product behavior.
MCP transport now HTTP JSON-RPC (tool calls) + SSE (streaming), not stdio.
Session/Plan/Todos

sprint.session.start outputs: removed contextFile; now returns sessionId, startedAt, taskId.
Auto-actions: insert Session record, log AgentAction, set task IN_PROGRESS.
Removed all .agent paths; replaced with Plan entity and Todo records in DB.
Checkpoint and completion sections update DB + UI consistency rather than files.
Expert and sub-agent flows

workflow.consultExpert now creates a Research Report record (id) rather than a file.
Sub-agents read latest Session record; synthesize-docs and map-system update DB-backed docs.
Context management

Memory banks are DB entries (Project Brief, System Patterns, Tech Context, Active Context, Progress).
Replaced “Session Files” with Session State (Session record, Plan entity, Todo records).
Skills auto-loading examples no longer reference .md filenames.
Checkpoints and recovery

Checkpoint “What gets saved” uses Session record and Todos (DB).
Confirmation output references record ids; no file names.
Recovery workflow uses MCP calls (sprint.getCurrentTask, load latest Session, load Todos).
Token budget and checklists

Token savings refer to Session/Plan/Todos instead of “Context Files”.
Workflow compliance checklist checks DB entities and UI updates, not file existence or STATUS.md updates.
Residual references removed

STATUS.md, current-*.md, .agent/ paths, and docs/13-Project-Plan.md as a write target.
Remaining illustrative mentions replaced with DB + UI + MCP language.
If you want, I can proceed with docs/13-Project-Plan.md next, since it still contains markdown sync and git-hook phrasing that should move to DB/UI/MCP consistency.

1 file changed

Undo

View all changes
05-AgentOps-Plan.md
+93
-100

yes please proceed with docs/13-Project-Plan.md


Updated docs/13-Project-Plan.md to align with the cloud SaaS model (DB + Web UI + MCP) and remove doc-coding artifacts.

What I changed

Core value proposition and performance targets

Database as source of truth now states “all state stored in PostgreSQL and exposed via Web UI and MCP tools”.
“Markdown sync <500ms” replaced with “Read-path updates: UI/MCP reflect DB changes in <500ms”.
Phase A (Foundation) and acceptance criteria

Goal: “auto-markdown sync” → “real-time UI/MCP consistency”.
Key deliverables: removed markdown sync and git hooks; kept consistency target.
Technical stack: MCP Server transport set to HTTP JSON-RPC + SSE.
Acceptance criteria: progress updates visible immediately in UI/MCP; removed git-hook checks.
Risks: removed Windows git hook compatibility.
Memory Banks and Research (Phase E)

“5 Memory Bank Files” → “5 Memory Bank Entries” (Project Brief, System Patterns, Tech Context, Active Context, Progress).
Research report persistence now DB-backed (not .agent/task/).
Acceptance criteria updated accordingly.
Dependencies: removed Filesystem MCP, Git MCP, .agent dir; added MCP endpoints and project API keys; simplified risk.
Sprint 1 references

MCP server foundation/scaffold updated to HTTP JSON-RPC + SSE.
Wiki/versioning

Sprint 7: “Git-Backed Versioning” → “DB-Backed Versioning (audit/history tables)”.
Sprint 5–7 overview: wiki “Auto-Generation” now “DB-stored markdown pages with cross-linking”.
Migration/metrics

Migration: “STATUS.md deprecation” → “Legacy markdown deprecation”.
Read-path targets updated in validation gates and milestones.
Internal references cleanup

Replaced .agent/system update bullets with “system documentation” updates.
Reworded internal plan/report file references to “internal report” (keeps history without implying file-based product behavior).
Left intentionally

A single negative “What We’re NOT Building” bullet: “❌ .agent/ folder creation” is retained as a prohibition, which matches the cloud model.
Next suggested doc

docs/12-Backlog.md: It still has several references to markdown sync and file outputs; I can bring it in line with DB + UI + MCP next.
1 file changed

Undo

View all changes
13-Project-Plan.md
+32
-37

proceed with docs/12-Backlog.md


Proceeding with backlog cleanup. I updated docs/12-Backlog.md to remove doc-coding features and align to DB + Web UI + MCP.

Highlights

EPIC descriptions

EPIC-002: Removed “from CLAUDE.md”; now “12+ predefined workflows”.
Wiki epic: “/docs folder” and “git-backed” replaced by “DB-stored markdown pages” and “DB-backed version history”.
Memory Banks epic: Removed “virtual .agent/ directory”; clarified DB storage and no local files.
Industry Docs epic: Now generates wiki pages stored in DB (no DEVELOPMENT_PLAN.md, no /docs folder).
User stories (key changes)

US-003: “…without manual STATUS.md reading” → “…without manual file reading”.
US-005: Markdown auto-sync → “UI and MCP reads reflect DB changes within 500ms” (FR-005).
US-006: Git hooks for markdown → “Write path enforcement via APIs” (FR-011).
US-025: Sync with .agent/task files → “Hierarchy state consistently available via MCP and reflected in the UI” (FR-025).
US-010-01..05: “file” → “entry” (Project Brief, System Patterns, Tech Context, Active Context, Progress).
US-011-04: Research reports saved to files → saved in the database.
US-013-18: Deprecate STATUS.md/DEVELOPMENT_PLAN.md → deprecate legacy status/plan files when migrating to wiki.
Migration and dependencies (EPIC-012)

Dependencies: “MarkdownFile + SyncService + Git hooks” replaced by “WikiPage + DB TemplateEngine + Consistency Service”.
Document suite: replaced /docs tree block with a DB-stored wiki description.
Migration strategy: file-based steps → wiki-based steps (API-only write paths, deprecation messaging in UI).
Business value and criteria

EPIC-001 business value: “…without manual STATUS.md updates” → “…without manual file updates.”
What remains

File:line in Issues epic is acceptable since it refers to code references, not repo doc-coding.
A negative bullet (“❌ .agent/ folder creation”) is retained as a prohibition, consistent with the cloud vision.
Next suggested doc

If you want to continue waterfall: scan docs/06-API/openapi.yaml for transport/auth alignment (HTTP JSON-RPC + SSE, per-project API keys), then docs/04-Data-and-Model-Spec.md to ensure models reflect Plans, Sessions, Todos, Memory Banks, Wiki as DB entities.