# Legacy Windows & Handoff Workflows (Archive Index)

> ⚠️ LEGACY ARCHITECTURES – WINDOWS + MAC MINI SPLIT
>
> These documents describe the old setup where Windows was the primary dev machine
> and the Mac mini was used as a remote runtime or database host. They are kept
> **only for historical reference** and must **not** be used for current work.
>
> **Current reality:** All development and runtime happen directly on the Mac mini
> using Docker containers (Next.js, PostgreSQL, MCP server) on this single machine.

---

## Legacy Documents

- `.agent/sops/mac-mini-docker-setup.md`
  - Mac mini hosting PostgreSQL only; Windows runs Next.js + MCP + tests.
- `.agent/sops/migration-windows-to-mac-mini.md`
  - Migration from Windows Docker/WSL2 to "Mac mini cloud" with Windows editor.
- `.agent/sops/mac-mini-communication-protocol.md`
  - Git-based instruction file workflow between Windows Claude and Mac mini Claude.
- `.agent/task/README-mac-mini-communication.md`
  - Overview of the Windows ↔ Mac mini communication protocol.
- `.agent/sops/ARCHIVED-windows-docker-networking.md`
  - Troubleshooting Windows Docker Desktop + WSL2 networking.

These flows all assume **two machines** and a Git-based handoff. They are no longer
part of the supported setup.

---

## Use This Instead (Current Setup)

For the Mac-mini-only Docker environment, use:

- `docs/11-Infrastructure-and-Deployment.md` – canonical infra & Docker architecture
- `.agent/sops/mac-mini-cloud-architecture.md` – agent-facing environment guide
- `docs/07-QUICK-START.md` – Mac mini Docker quick start (current)

Agents should:

- Assume they are running **on the Mac mini itself**.
- Use Docker (`docker compose -f docker-compose.cloud.yml ...`) to manage services.
- **Never** start local dev servers (`pnpm dev`) by default.
