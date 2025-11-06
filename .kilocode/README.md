# Kilocode Integration — ProjectPulse

Use these artifacts to mirror the Claude/Cascade agentic workflow in Kilocode.

- Modes live in `.kilocodemodes`
- Rules in `.kilocode/rules/` — start with `00-index.md`
- Workflows in `.kilocode/workflows/` — start with `01-mandatory-session-protocol.md`

Recommended Start:

1. Select `orchestrator-session-gated` mode
2. Run `01-mandatory-session-protocol` workflow
3. Invoke expert/combined modes as needed (api-implementation, db-migration, ui-component)

Confirmations must match exactly (see rules/01-mandatory-session-protocol.md).
