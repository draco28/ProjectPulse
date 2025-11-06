# 02 Git Workflow and Branching

- Always work on a feature branch, not master
- Branch types: api/_ (backend), ui/_ (frontend), feature/\* (full-stack)
- Step 1.5 is mandatory before code changes
- Commit order (Step 5):
  1. Documentation first: docs/, STATUS.md, .agent/, etc.
  2. Code second: apps/, packages/, prisma/
- Merge to master:
  - Ensure quality gates pass (lint, type-check, build, test)
  - `git checkout master && git pull`
  - `git merge --no-ff <branch>`
  - `git branch -d <branch>`
- Ask before push or destructive operations

References: .agent/sops/git-workflow.md, AGENTS.md
