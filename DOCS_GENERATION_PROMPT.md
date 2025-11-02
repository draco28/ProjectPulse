# AI Documentation Generation Prompt Template

Use this template with any capable AI agent to generate an industry-grade documentation pack from your Executive Summary. Paste your Executive Summary where indicated.

---

## How to use

1. Create your Executive Summary using PROJECT_PLANNING_TEMPLATE.md.
2. Copy this entire prompt into your AI tool.
3. Replace the EXECUTIVE_SUMMARY block with your own content.
4. Ask the AI to write the resulting files into docs/<ProjectName>/ (or return them inline if it cannot write files).

---

## Prompt starts below — copy from here

You are a senior product+platform architect. Given the Executive Summary, produce a complete, production-quality documentation pack to build the product end-to-end. Follow all instructions exactly.

### Inputs

- Executive Summary (source of truth):

```
<EXECUTIVE_SUMMARY>
[PASTE YOUR EXECUTIVE SUMMARY HERE]
</EXECUTIVE_SUMMARY>
```

- Optional Attachments: transcripts, designs, constraints. If absent, proceed with assumptions and clearly mark them.

### Output directory

- Create docs/<ProjectName>/ with this structure:
  - README.md
  - 01-PRD.md
  - 02-SRS.md
  - 03-Architecture.md
  - architecture/ADRs/ADR-001.md, ADR-002.md, ADR-003.md (at least 3 ADRs for key decisions)
  - 04-Data-and-Model-Spec.md
  - 05-MLOps-Plan.md
  - 06-API/openapi.yaml (OpenAPI 3.1)
  - 07-UI-UX.md
  - 08-Security-and-Compliance.md
  - 09-Testing-and-QA.md
  - 10-Observability-and-SRE.md
  - 11-Infrastructure-and-Deployment.md
  - 12-Backlog.md
  - 13-Project-Plan.md

If you cannot write files, return each file as a fenced code block with its intended path as the heading.

### Global rules

- Treat the Executive Summary as the source of truth. Do not contradict it.
- If information is missing, do NOT block. Infer sensible defaults, document assumptions, list open questions, and proceed.
- Prefer vendor features and free tiers specified in the summary. Respect region, budget, scale, and model/provider choices.
- Use clear, concise, implementation-ready language. No filler.
- Use Mermaid diagrams in Markdown for architecture and sequences.
- Use deterministic IDs and consistent naming (e.g., FR-001.. in SRS; ADR-001.. in ADRs).
- Ensure cross-document traceability: PRD → SRS → Architecture → Tests → Backlog.

### Deliverable requirements

1. README.md
   - Scope, contents list, traceability approach, change control.

2. 01-PRD.md (Product Requirements)
   - Goals, users, top use cases, MVP features list with short FR labels.
   - Success metrics and North Star; constraints (budget, region, stack, model strategy).

3. 02-SRS.md (System Requirements)
   - Functional requirements FR-### with acceptance criteria.
   - Non-functional: performance targets, availability, security, compliance, scalability, cost, observability, a11y.
   - Data model (tables, storage buckets) aligned to chosen stack; include example RLS policies if using Postgres.
   - Integrations: Auth/DB/Storage, AI provider(s), cache/RL, monitoring.
   - Traceability table snippet.

4. 03-Architecture.md
   - System context (Mermaid), components/containers, key sequence diagrams (e.g., generation flow, rate limit flow).
   - Cross-cutting concerns: validation, security, observability, cost controls.
   - Reference ADRs (in architecture/ADRs).

5. ADRs (at least 3)
   - Example themes: provider choice; data storage strategy; cost/speed trade-offs; deployment target.
   - Each ADR has Status, Context, Decision, Consequences.

6. 04-Data-and-Model-Spec.md
   - Design brief JSON contract (if applicable), generated artifact schema, DB schema, validation limits, cache keys, telemetry fields.

7. 05-MLOps-Plan.md (or PromptOps for non-fine-tune)
   - Strategy (prompting vs fine-tune, RAG plan), artifacts (prompts/goldens), evaluation (offline/online), governance, delivery/canary.

8. 06-API/openapi.yaml
   - OpenAPI 3.1, bearer JWT security, clear request/response schemas, rate-limit and error responses.

9. 07-UI-UX.md
   - User journeys, states (loading/empty/error/success), accessibility, responsive behaviors, critical components.

10. 08-Security-and-Compliance.md

- Threat model, authn/z, secrets mgmt, storage access, validation, privacy/export/delete flows, incident basics.

11. 09-Testing-and-QA.md

- Test pyramid (unit/integration/E2E), ML quality gates, data validation, performance checks, release gates.

12. 10-Observability-and-SRE.md

- Metrics, dashboards, SLOs/alerts, tracing/logging standards, incident workflow.

13. 11-Infrastructure-and-Deployment.md

- Environments, hosting, CI/CD, secrets, migrations, rollback, cost controls tied to exec constraints.

14. 12-Backlog.md

- Epics → user stories mapped to FR IDs with acceptance criteria placeholders.

15. 13-Project-Plan.md

- Milestones (phases), estimates, risks/mitigations, success criteria.

### Quality bars & checks

- Performance target derived from Executive Summary (e.g., generation P95, TTFD). State explicit numbers.
- Security: Include sample RLS (if Postgres), and signed URL storage practices (if object storage).
- Cost: Document free-tier thresholds and 80% alerting if budget-constrained.
- Accessibility: State WCAG AA baseline.
- Traceability: Include FR IDs in PRD, SRS, Backlog; show snippet mapping in SRS.

### Diagram & spec guidelines

- Mermaid only inside Markdown; keep diagrams readable.
- OpenAPI: 3.1; include reusable schemas; bearerAuth security scheme; error responses (400, 429).

### Missing info policy

- If data is missing, add an Assumptions & Open Questions section in each affected doc and proceed with recommended defaults.

### Output summary

- At the end, print a checklist of generated files with paths. If any files were skipped, explain why and list follow-ups.

## Prompt ends here
