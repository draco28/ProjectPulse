I am thinking of building an VS code fork or just an extension, but not sure what would give me the functionality I want. Currently I give a starter template prompt to ai then it starts brainstorming topic to discuss what we are building then after completion, I ask it to generate a executive summary for it then I give a doc template prompt to generate industry grade documentation for my project with prd, ard, user story etc. The i give ai agent a ai work flow template to set up agentic ai workflow specific to that project like creating specific skills, sub agents, sops and memory management files etc all this to maintain it's context and also a development plan file to track development phases but all this doesn't always work as i have always give context about it and also agents do not always update the documents and progress is not tracked then they loose the track and our project goes sideways. To overcome this I am thinking to build an ide or an extention with agent which can be configured to have multiple sources ai model which would have features like memory, rules, workflow, agents, mcp, documentation which I can set up then that agent should do these things automatically as it would have full context of my repository and the ide should have visual highlights to show our complete project phases then inside each phases, sprint sections and inside section various steps, and whenever we complete a step or sprint or phase then we could visually that where we are, which step is completed and if ai miss to update anything or skipped then we could see visually that there is gap in our progress, this visual chart could be on top or sidebar of ide. Also few more features in agent like after each completion we should have some visual button to create a checkpoint, to save progress (like we click on button and then our progress is saved and our main progress chart is updated with our current phase/step/sprint), also a feature to have a todo list created by agents for each task but unlike they create it in conversation which is lost when out of context, this todo list to be saved in ide and we could see visual the todo list and when context is full for agent then in new conversation agent should again crosscheck it's progress via todo list and progress memory which should be saved automatically when context reaches 80%.

Short answer: build a VS Code extension, not a fork.
You’ll get 95% of what you want via extension APIs (Tree Views, Webviews, Tasks, FS watchers, SCM, notebooks) without owning an entire IDE. If you ever need “outside-the-editor” compute, add a tiny companion CLI/daemon—not a fork.

Here’s a concrete, shippable design you can start building today.

What you’re building

A VS Code extension that turns any repo into a project OS with:

Persistent memory & rules scoped to the repo

Multi-model agent orchestration (OpenAI, local, OSS) with cascades

Phases → Sprints → Steps visual roadmap + progress checks

One-click checkpoints (files + Git tags)

Agent-owned TODOs that survive chat context and drive actions

Auto-docs (PRD/ARD/user stories/SOPs) kept in sync from code events

“Context at 80%” spillover into a saved progress memory, auto-cross-checked next run

MCP servers as first-class data/tools providers

High-level architecture

1. VS Code extension (TypeScript)

UI & UX, commands, persistence, SCM integration.

Key APIs:

TreeDataProvider → left sidebar “Project Map” (Phases/Sprints/Steps, TODOs)

WebviewViewProvider → top/side Progress Board with timeline/graph + buttons

FileSystemWatcher → auto-update docs/TODOs from code changes

SecretStorage → API keys

Memento (globalState, workspaceState) → quick caches; not for long-term memory

vscode.tasks → run build/test/deploy steps that agents schedule

scm & git extension API → tags, branches, PR prep

notebook (optional) → “Agent Notebook” runs for reproducible prompts

2. Project data on disk (in-repo)
   A hidden folder at repo root: .projector/
   Keeps everything portable, reviewable, and git-versioned.

.projector/
project.yaml # name, objectives, rules, model policy, cascade, MCP endpoints
roadmap.yaml # phases → sprints → steps, owners, status
todos.json # agent/user TODOs with IDs & links
memory/ # vector store or chunked JSONL + embeddings
checkpoints/ # metadata per checkpoint + manifest
docs/
PRD.md
ARD.md
UserStories.md
SOPs.md
agents.yaml # sub-agents, skills, tool grants, rate limits
sops/ # task recipes (YAML)
skills/ # reusable prompts/tools config

3. Local agent runner (Node/TS service or simple CLI)

Optional, started by extension when needed.

Handles model calls, embeddings, retrieval, MCP sessions, and long tasks.

Lets you swap model vendors without touching the UI.

Can host a tiny vector DB (e.g., sqlite+FG, disk-backed).

4. MCP

Configure MCP servers in project.yaml.

Agents call MCP tools (issue tracker, calendar, design system docs, cloud APIs) safely.

Minimal schemas (cut-and-paste)

project.yaml

name: Acme SaaS
objectives:

- Build MVP with agentic workflow
  rules:
- "Always update roadmap.yaml after completing a step."
- "Never overwrite docs without diffing and appending a changelog."
  models:
  cascade: - name: gpt-low
  max_tokens: 2048
  cost_weight: 1 - name: gpt-medium
  max_tokens: 4096
  cost_weight: 2 - name: gpt-high
  max_tokens: 8192
  cost_weight: 4
  context_policy:
  spill_threshold: 0.8 # when token use ≥80%, persist spillover
  persist_files: - .projector/memory/\*.jsonl
  mcp:
  servers: - id: jira
  url: http://localhost:port
  tools: [ "issues.search", "issues.create", "issues.update" ]

roadmap.yaml

phases:

- id: P1
  name: Discovery
  status: done|in_progress|blocked|todo
  sprints:
  - id: P1S1
    name: Ideation
    status: done
    steps:
    - id: P1S1-01
      name: Brainstorm topics
      status: done
      evidence: [ "docs/ExecutiveSummary.md" ]
    - id: P1S1-02
      name: Executive summary
      status: done
      evidence: [ "docs/ExecutiveSummary.md" ]
- id: P2
  name: Architecture
  status: in_progress
  sprints:
  - id: P2S1
    name: PRD/ARD
    status: in_progress
    steps:
    - id: P2S1-01
      name: PRD
      status: in_progress
      owner: praveen
      evidence: [ "docs/PRD.md" ]
    - id: P2S1-02
      name: ARD
      status: todo

todos.json

[
{
"id": "T-001",
"title": "Define core user journeys",
"scope": "P2S1-01",
"assignee": "agent:planner",
"status": "open",
"links": ["docs/PRD.md#user-journeys"]
}
]

Checkpoint manifest (create on button click)

{
"id": "ckpt-2025-11-01-1203",
"message": "Completed P2S1-01 PRD first pass",
"gitTag": "checkpoint/P2S1-01/v1",
"files": [
"docs/PRD.md",
".projector/roadmap.yaml",
".projector/todos.json"
],
"createdAt": "2025-11-01T12:03:00+05:30"
}

UX you described → mapped to VS Code UI

Progress Board (webview): top/side panel with a lane view: Phases → Sprints → Steps.
Buttons: Run agent, Create checkpoint, Sync docs, Cross-check, Mark done.

Project Map (tree view): repo → phases → sprints → steps → evidence files. Context menu to open files, mark status, or request agent action.

Status bar items: current phase/sprint; context usage (e.g., “Context 72%”); last checkpoint.

“Agent TODOs” view: table of TODOs with filters; double-click opens source file or doc anchor.

Diff & gaps: highlight steps marked “done” without evidence, or evidence changed without roadmap update.

Core flows (that fix your pain)

Bootstrap

Command: “Initialize Projector”.
Creates .projector/ + skeleton docs (PRD/ARD/UserStories/SOPs) from your templates.
Prompts for model keys once; stores in SecretStorage.

Agent runs with full, stable context

Before each run, the runner assembles context from:

project.yaml rules

Current sprint + open TODOs

Relevant memory chunks (retrieval by embedding)

Diff since last checkpoint

If token use ≥ spill_threshold, extra notes → memory/\*.jsonl and not lost.

After run, it must:

Update todos.json (create/resolve)

Propose patches for roadmap.yaml & docs (PR-style)

Write a runlog.md with decisions + citations

Checkpoints (one click)

Save manifest, tag the repo (checkpoint/<phase>/<sprint>/<step>/vN)

Push optional remote tag

Update Progress Board instantly

Auto-doc upkeep

FS watchers on src/ and infra/ paths trigger a “doc drift” job:

Generate diffs → update ARD sections or open a patch

If agents skip updates, the Board shows a red badge “Doc drift”.

Cross-check on new conversation

New chat session starts with:
“Load open TODOs + current sprint state → respond with plan/next commands.”
This is automatic—no manual context re-feeding.

Implementation slices (sane roadmap)

MVP (2–3 weeks worth of evenings)

Project init command + .projector/ scaffolding

Project Map (TreeDataProvider)

Progress Board (Webview) with lanes & two buttons: Run agent, Checkpoint

roadmap.yaml + todos.json read/write

Basic single-model agent runner with file I/O, no MCP yet

Git tag checkpoints

v0.2

Multi-model cascade policy

Memory store (embeddings + retrieval) in .projector/memory/

Context spillover at 80% with auto-persist

FS watchers → “doc drift” badge and quick-fix command

v0.3

MCP connectors (issue tracker, calendar, design system)

SOP/Skills YAML (task recipes) → agent can run sops/\*.yaml as plans

Notebook view for “repro runs” (agent notebooks)

v0.4

Graphical diff/review for doc/roadmap patches inside the webview

Metrics: lead time per step, % automation vs manual, token/cost per phase

How agents stay reliable (guardrails)

Write-then-apply patches: Agents never overwrite; they propose file patches you review/auto-apply.

Evidence-required transitions: A step cannot move to “done” without at least one evidence file link.

Schema validation: On every write to roadmap/TODOs, validate against JSON Schema/YAML schema; show errors in Problems panel.

Deterministic SOPs: Repeatable tasks live in sops/\*.yaml; agents call them rather than freestyle prompting.

Run logs: Every agent action logs inputs/outputs to .projector/runlogs/ for traceability.

Token/context strategy

Chunk .md and code with stable hashing to avoid re-embedding unchanged text.

Retrieval prioritization: current sprint nodes → linked evidence → related TODOs → rules.

Spillover at 80%: summarize remainder and persist to memory/overflow-YYYYMMDD.jsonl with indices so the next run can rehydrate from summaries first.

Multi-model policy (example)

Low for brainstorming, TODO creation, boilerplate docs

Medium for spec refinement, ARD updates, code-aware summaries

High for critical refactors, PRD finalization, complex multi-file diffs

Automatic switch-up when:

step is “critical=true”

doc drift > threshold

previous attempt failed validation

Keyboard shortcuts (defaults)

Ctrl/Cmd+Shift+P → “Projector: Initialize”

Ctrl/Cmd+K Ctrl/Cmd+P → “Projector: Create Checkpoint”

Ctrl/Cmd+K Ctrl/Cmd+T → “Projector: Open TODOs”

Ctrl/Cmd+K Ctrl/Cmd+R → “Projector: Run Agent (current sprint)”

Risks & mitigations

Model drift / non-determinism: SOPs + schema validation + patch workflow.

Context blowups: embedding-first retrieval + spillover + summarization.

User trust: evidence-gated status changes + run logs + Git tags.

Lock-in: all state is in plain files under .projector/.

Why not a fork?

You’ll be responsible for updates, perf, and cross-platform bugs forever.

Extensions already allow custom panels, graphs, commands, file systems, and background compute via a helper process. Forking only makes sense if you need brand-new core editor primitives (you don’t).

If you want, I can sketch the extension’s file/folder scaffold (TS + Webview), a minimal TreeDataProvider, and the checkpoint command that adds a Git tag and writes the manifest.
