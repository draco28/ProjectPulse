# Kilocode Integration Plan v1.0 — ProjectPulse

Date: 2025-11-06
Scope: Refactor Kilocode to mirror Claude/Cascade protocols with enforceable modes, rules, and workflows.

## Objectives

- Protocol parity: Mandatory Session Protocol with Step 4.5 verification gate
- Expert mapping: next-js-expert, prisma-expert, react-expert
- Quality gates: build/test/security/architecture
- Local-first privacy and MCP API-only pattern

## Deliverables

- Updated `.kilocodemodes` with `orchestrator-session-gated`, experts, and combined modes
- Rules in `.kilocode/rules/` (00–10)
- Workflows in `.kilocode/workflows/` (01–11)
- `.kilocode/README.md`

## File Map

- Modes: orchestrator-session-gated, next-js-expert, prisma-expert, react-expert, api-implementation, db-migration, ui-component
- Rules: 00-index, 01-mandatory-session-protocol, 02-git-workflow-and-branching, 03-quality-gates, 04-security-and-privacy, 05-typescript-and-validation, 06-data-driven-and-config, 07-nextjs-and-prisma-patterns, 08-mcp-integration, 09-port-configuration, 10-documentation-commit-order
- Workflows: 01-mandatory-session-protocol, 02-feature-development, 03-bugfix-regression, 04-api-endpoint-implementation, 05-database-migration-and-seeding, 06-component-ui-page, 07-mcp-tool-creation, 08-testing-and-coverage, 09-audit-security-review, 10-docs-maintenance-and-system-refresh, 11-verification-gate-checklist

## Process

1. Modes refactor — add orchestrator + experts + combined modes (DONE)
2. Author rules suite (DONE)
3. Author workflows (DONE)
4. Cross-linking: modes reference required rules/workflows (DONE)
5. Dry run validation on a small endpoint (PENDING)

## Acceptance Criteria (Evidence-Based)

- Quality gates pass for any exercised code path (lint/type-check/build/test)
- Step 4.5 verification collects:
  - Files changed list with highlights
  - pnpm test and coverage summary (≥80% for new code)
  - Example API responses (curl or client)
  - DB assertion outputs (counts/constraints)
  - Doc update summary

## Risks

- Overwriting `.agent/task/current-plan.md` conflicts with active sprint plan
  - Mitigation: Save plan as `kilocode-integration-plan.md` and seek approval to replace `current-plan.md`

## Next Steps

- Approve replacing `.agent/task/current-plan.md` with this plan (or keep separate)
- Run dry run (Workflow 04) on a small POST endpoint and capture Step 4.5 evidence
- If new patterns emerge, update rules/workflows accordingly

## References

- CLAUDE.md (Session Start Pattern, Skills loading)
- AGENTS.md (Golden Rules, Quality Gates)
- .agent/MANDATORY_SESSION_PROTOCOL.md
