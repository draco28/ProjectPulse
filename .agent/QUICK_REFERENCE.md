# Quick Reference Card

**🚨 READ THIS FIRST when starting ANY work or troubleshooting**

---

## Server Architecture (Mac Mini)

**⚠️ CRITICAL: All services run on Mac mini (192.168.1.15), NOT on Windows!**

### Service Locations

| Service | Location | Port | URL/Connection String |
|---------|----------|------|----------------------|
| **Next.js Server** | Mac mini Docker | 3000 | `http://192.168.1.15:3000` |
| **PostgreSQL** | Mac mini Docker | 5432 | `postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev` |
| **MCP Server** | Mac mini Docker | stdio | Internal only |

### Quick Commands

**Check Server Status:**
```bash
# From Mac mini
docker ps
# Expected: 3 containers running (postgres, nextjs, mcp)

# Health check from Windows
curl http://192.168.1.15:3000/api/health
# Expected: {"status":"healthy","database":"connected"}
```

**Restart Services:**
```bash
# From Mac mini
docker restart projectpulse-nextjs-cloud
docker restart projectpulse-postgres-cloud
docker restart projectpulse-mcp-cloud

# OR full rebuild
cd /Users/draco/projects/AI_HUB
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build
```

**View Logs:**
```bash
# From Mac mini
docker logs --tail 50 projectpulse-nextjs-cloud
docker logs --tail 50 projectpulse-postgres-cloud
docker logs --tail 50 projectpulse-mcp-cloud
```

---

## Development Workflow

### Where to Do What

**✅ Do on Windows:**
- All code editing (Read, Edit, Write)
- All Git operations (commit, push, pull)
- API testing via curl to `192.168.1.15:3000`
- TypeScript checks (`pnpm type-check`)
- Unit tests
- Documentation updates

**✅ Do on Mac mini (sparingly):**
- Docker container management (restart, logs, rebuild)
- Database migrations (`npx prisma migrate dev`)
- Prisma client regeneration (`npx prisma generate`)
- Server debugging (when network issues)

**❌ NEVER do:**
- Start `pnpm dev` on Windows (server already running on Mac mini!)
- Install dependencies on Windows expecting Docker to pick them up
- Assume localhost:3000 works (it's `192.168.1.15:3000`)

---

## Common Mistakes to Avoid

1. **Starting redundant server on Windows**
   - ❌ `pnpm dev` on Windows
   - ✅ Use Mac mini server at `192.168.1.15:3000`

2. **Installing dependencies without Docker rebuild**
   - ❌ `pnpm add package` → test immediately
   - ✅ `pnpm add package` → `docker restart projectpulse-nextjs-cloud`
   - ✅✅ Better: Install inside container: `docker exec -w /app/apps/web projectpulse-nextjs-cloud pnpm add package`

3. **Forgetting where services are**
   - ✅ Always check this file FIRST
   - ✅ Services are on **Mac mini (192.168.1.15)**, not Windows

---

## Environment Variables

**Windows (for accessing Mac mini):**
```bash
# .env.local (if testing from Windows)
NEXT_PUBLIC_APP_URL=http://192.168.1.15:3000
DATABASE_URL=postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev
```

**Mac mini Docker (production-like):**
```bash
# Set in docker-compose.cloud.yml
NEXT_PUBLIC_APP_URL=http://192.168.1.15:3000
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/projectpulse_dev
```

---

## Troubleshooting Checklist

**Before starting ANY work:**
- [ ] Verify Mac mini services running: `docker ps`
- [ ] Verify Next.js accessible: `curl http://192.168.1.15:3000/api/health`
- [ ] Verify correct branch: `git branch` (should be feature branch, not master)

**When things don't work:**
1. Check this file FIRST
2. Check container logs: `docker logs projectpulse-nextjs-cloud`
3. Check if dependencies need rebuilding: `docker restart projectpulse-nextjs-cloud`
4. Check if webpack config changed: May need full rebuild

**When installing new dependencies:**
1. Add to package.json: `pnpm add package`
2. Install in container: `docker exec -w /app/apps/web projectpulse-nextjs-cloud pnpm install`
3. Restart container: `docker restart projectpulse-nextjs-cloud`
4. Verify server starts: Check logs for "Ready in Xms"

---

## File Locations Reference

**Memory Bank Files** (read at session start):
- `.agent/project-brief.md` - WHAT we're building and WHY
- `.agent/system-patterns.md` - HOW we build (architecture patterns)
- `.agent/tech-context.md` - Technical stack and THIS quick reference
- `.agent/active-context.md` - Current focus
- `.agent/progress.md` - Progress tracking

**SOPs** (standard procedures):
- `.agent/sops/port-troubleshooting.md` - Port configuration issues
- `.agent/sops/git-workflow.md` - Git branch management
- `.agent/sops/mac-mini-cloud-architecture.md` - Full Mac mini setup (if exists)

**Current Work**:
- `.agent/task/current-session-*.md` - Active session tracking
- `.agent/task/current-plan.md` - Implementation plan
- `docs/13-Project-Plan.md` - Sprint roadmap

---

**Last Updated:** 2025-11-14
**Update this file when architecture changes!**
