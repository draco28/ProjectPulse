# Cascade Quick Commands - Moksha DevHub

## Session Management

"Start session for Phase X Day Y" → Initializes with protocol
"Continue" → Resumes from last checkpoint
"Checkpoint" → Force checkpoint update
"Complete phase" → Runs Step 5 completion workflow

## Agent Invocation

"Consult react-expert about [topic]" → Invokes react expert
"Consult next-js-expert about [topic]" → Invokes Next.js expert
"Consult prisma-expert about [topic]" → Invokes Prisma expert
"Find all [pattern] in codebase" → Invokes explore-codebase
"Analyze how [feature] works" → Invokes analyze-architecture

## Workflow Commands

"Implement [feature] with TDD" → TDD workflow
"Review [code] for quality" → Auditor patterns
"Generate SOP for [topic]" → Synthesize-docs agent
"Update system docs" → Map-system agent

## Skill Loading

"Load api-patterns skill" → Reads API skill
"Load testing-patterns skill" → Reads testing skill
Skills auto-load based on keywords in phase description

## Documentation

"Update STATUS.md" → Updates project status
"Create COMPLETION doc" → Creates completion document
"Update progress metrics" → Updates .agent/progress.md

## Protocol Enforcement

Missing Step 1? → "Initialize session NOW"
Missing Step 2? → "Save plan NOW"
Missing Step 3? → "Consult expert NOW"
Missing checkpoint? → "Update progress NOW"

## Quality Checks

"Run all quality gates"
"Check test coverage"
"Verify TypeScript strict"
