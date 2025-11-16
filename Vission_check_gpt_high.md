currently i am in sprint 8 and we have so far built our MVP but i'm not sure if it is as per our vision.  we are in a testing phase, testing the MVP features but if i go from the start as an end user so i will create a project then i will ask my ai agent to connect to projectpulse to initiate onboarding sessions which will start with session one where session one will give agent a session one details which will be 10 step questions to decide the executive summary and then user's agent will store it in our web app db and then user's agent will initiate session two which will start where agents will get the instructions from our web app to create industry-level documentation and those will be stored in our web app db by user's agent one by one, then the user's agent will initiate session 3 which will give user' agent a blueprint template for ai workflow setup, where then end user will decide what sub-agents/skills/sops/workflow/mandatory protocols and few more things which will be part of the ai workflow template will be created by user's agent and stored in our web app db, then those info will be visible to user via our web ui, now i do not think we have any ui wired for session 3 outputs, we were suppose to enhance agent persona page into a agent ai hub page where all sub agents, skills, workflows, mandatory protocols, sops will be visible for user to view and modify, session 1 and session 2 created data can be stored in wiki page as project docs but as per our session 2, the industry-grade documentation which will be created, in that project plan, backlog documents, which will be then used to create user's complete project roadmap of the project, which should have a separate UI page named project roadmap or something, that should show our sprint/phase/week/day kind of scenario which i think have built it in backend, but we do not have a UI for that. roadmap UI page should also be active like where we are in the roadmap and which phase which sprint, this is updated by end user's agent via MCP tool. for now let us tackle this then i will proceed further with more queries i have.


Status
I’ve reloaded the core context from:
.agent/project-brief.md
 (Cloud SaaS + Development Cycle page).
.agent/system-patterns.md
 and 
.agent/tech-context.md
 (hierarchy API, MCP tools, agent/skills/workflow patterns).
apps/web/prisma/schema.prisma
 (Phase/Week/Day/Task/Session, AgentPersona, Skill, OnboardingSession/Template, WorkflowTemplate).
apps/web/app/agents/page.tsx
 and 
app/api/hierarchy/query/route.ts
.
TODOs t1 and t2 are now complete; we’re entering design for t3/t4/t5.
Below is the gap mapping + concrete design proposals so we can pick what to implement next.

Findings: What Exists vs Your Vision
1. Onboarding (Sessions 1–3)
Built (backend + MCP):
Models: OnboardingSession, OnboardingTemplate.
APIs: GET /api/onboarding/prompt, POST /api/onboarding/responses.
MCP tools: projectpulse.onboarding.getPrompt, projectpulse.onboarding.submitResponse.
Gap vs vision:
No human-facing UI that:
Shows Session 3 “AI workflow blueprint” for a project.
Explodes that JSON (sub‑agents, skills, SOPs, protocols) into a structured, editable hub.
Session 1–2 docs are meant to surface via Wiki/Knowledge, but there’s no obvious “Onboarding summary” view.
2. Agent Personas / AI Hub
Built:
Model: AgentPersona (name, slug, systemPrompt, skills: string[], tools: string[], rules: string[], expertise: string[], personality, isActive, AgentSession usage).
Page: /agents (Agent Personas list + basic stats).
Gap vs vision:
/agents is just a persona list, not an Agent AI Hub:
No view that ties personas to:
Onboarding Session 3 blueprint.
Skills (Skill table).
Workflow templates / protocol workflows.
Mandatory protocols and SOPs as first‑class entities.
No sense of “this project’s AI workflow topology”.
3. Roadmap / Development Cycle
Built:
Full hierarchy models: Phase → Week → Day → Task → Session + Checkpoint.
Query API: GET /api/hierarchy/query?level=phase|week|day|task|session&status=&progressMin=&....
Progress roll‑up pattern documented in 
system-patterns.md
.
MCP sprint tools (e.g. sprint.phase.create, sprint.getCurrentTask, sprint.checkpoint) per 
tech-context.md
.
Gap vs vision:
No dedicated UI page for “Development Cycle” / Roadmap.
No phase/week/day timeline.
No “You are here: Phase X → Week Y → Day Z → Task A → Session B” indicator.
No visible link between MCP updates and visual roadmap progress.
Design Proposal: Agent AI Hub (t3)
Goal: Turn the existing /agents area into a project-aware hub that surfaces the Session 3 blueprint + sub‑agents + skills + workflows + protocols, using only existing models where possible.

1. Placement
Route options:
Option A (minimal change): Extend /agents into “Agent AI Hub” (rename title, add tabs).
Option B (explicit): New route /agents/hub linked from sidebar and dashboard.
I’d lean Option A for MVP: same route, richer content.

2. Data Sources
Personas: AgentPersona + AgentSession stats.
Blueprint (session 3): OnboardingSession for sessionNumber = 3 for a selected projectId.
Use its response JSON + template variables.expectedVariables to know which fields to surface.
Skills: Skill where projectId = currentProjectId.
Workflows / Protocols:
WorkflowTemplate (especially the “5-Step Mandatory Protocol” template).
WorkflowRun filtered by projectId.
3. UI Structure (Server + Client)
Server page (
/agents/page.tsx
):

Fetch:
AgentPersona list (+ usage counts from AgentSession).
Current project’s OnboardingSession (session 3) + OnboardingTemplate.
Project Skill records.
WorkflowTemplate + active WorkflowRun for this project.
Render something like:

Header: “Agent AI Hub” + active project selector.
Tabs:
Overview
Personas
Skills & SOPs
Workflows & Protocols
Client components inside tabs handle interactivity (filters, expanding cards).

4. Key Sections
Overview tab:
“Session 3 Blueprint” summary:
Primary agent persona / orchestrator.
Number of sub‑agents, skills, workflows, SOPs defined in the response.
“Active Protocols”:
Display mandatory workflow (e.g., 5-step protocol) and any project‑specific SOP skills.
Personas tab:
Reuse existing AgentCard, but extend to show:
expertise tags.
skills (string tags from AgentPersona.skills).
rules as collapsible “Governance” section.
Basic usage metrics (sessions, last used).
Controls to toggle isActive.
Skills & SOPs tab:
Pull from Skill (category filtered to things like workflow, troubleshooting, SOP).
Group by category and tags.
Link back to blueprint fields (e.g. if blueprint lists SOP slugs, highlight them here).
Workflows & Protocols tab:
List relevant WorkflowTemplates (category development/project-management).
For each:
Show step count, category, and description.
If there’s an active WorkflowRun for this project, show status + current step.
Explicit highlight for your Mandatory Session Protocol workflow.
Design Proposal: Project Roadmap / Development Cycle (t4)
Goal: A single page that visualizes the 5‑level hierarchy and where the project currently is, powered by existing DB + /api/hierarchy/query.

1. Placement
New route:
/development-cycle or /roadmap
Linked from:
Sidebar and dashboard widget (“View Roadmap”).
2. Data Sources
Hierarchy:
Direct Prisma queries (Phase, Week, Day, Task, Session) or via GET /api/hierarchy/query.
“Current position”:
For MVP: last Task/Session with status = IN_PROGRESS or latest updatedAt.
Later: wire to MCP sprint.getCurrentTask so the agent is the source of truth.
3. UI Structure
Server page:

Load all current phases with aggregated counts (weeks/days/tasks/sessions) and progress.
Compute the “current” task/session.
Suggested layout:

Top strip: “You are here” breadcrumb:
Phase → Week → Day → Task → Session with progress badges.
Main area: Two panes:
Left: Phase timeline (cards for each Phase with progress, dates, status).
Right: Drill-down tree:
Selecting a phase shows weeks; selecting a week shows days; etc.
Uses /api/hierarchy/query with level and filters.
Filters at top:

Status chips (IN_PROGRESS, BLOCKED, etc.).
Progress slider (0–100%).
Implementation Breakdown (t5 – high-level)
Agent AI Hub
Extend 
/agents/page.tsx
 to:
Accept a projectId (URL param or select).
Fetch session 3 onboarding data, skills, workflows.
Wrap content into tabbed layout and add Blueprint/Protocols views.
Add tests:
Integration tests for data fetching.
Playwright test: after running onboarding MCP script, hub shows session 3 data.
Project Roadmap
New page /development-cycle/page.tsx:
Server-side fetch of phases + children, plus “current” task/session.
Use /api/hierarchy/query to drive filters & pagination.
Add tests:
Integration tests for /api/hierarchy/query filtering.
Playwright test to assert “You are here” and correct hierarchy rendering.
What I Need From You
To resume concretely:

Which do you want to prioritize first for this session?
Option 1: Deep-dive Agent AI Hub – finalize its UX (sections, fields from Session 3 JSON), then draft the exact component/data flow changes in 
/agents/page.tsx
 and related components.
Option 2: Deep-dive Project Roadmap – finalize the /development-cycle UX and then plan the exact queries and components.
Once you choose, I’ll mark that TODO as in_progress, refine the design to implementation-level detail, and then we can start editing the actual Next.js/Prisma code.


