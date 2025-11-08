# Migration Guide: Windows Docker → Mac Mini Cloud Runtime

**Created**: 2025-11-09
**Purpose**: Guide for migrating from Windows Docker Desktop/WSL2 setup to Mac mini cloud runtime
**Target**: Developers transitioning from legacy Windows-based Docker to distributed Mac mini architecture

---

## Overview

This guide helps you migrate from running Docker services on Windows to the Mac mini cloud runtime architecture.

**Before (Legacy)**:
- Windows: Docker Desktop + WSL2 + Next.js + PostgreSQL + MCP Server
- Issues: WSL2 networking, file permissions, TypeScript module resolution

**After (Mac Mini Cloud)**:
- Windows: Code editor only (Windsurf + Git + Browser)
- Mac mini: All runtime services (Docker + Next.js + PostgreSQL + MCP)
- Benefits: Eliminated WSL2 issues, production-like environment, clean separation

---

## Pre-Migration Checklist

Before starting migration, verify:

- [ ] Mac mini is accessible at `192.168.1.15` on your local network
- [ ] You have SSH access to Mac mini (or physical access)
- [ ] Git repository is pushed to remote (to sync between machines)
- [ ] You have backed up any important local data
- [ ] Docker is installed on Mac mini (`docker --version`)
- [ ] Docker Compose is available on Mac mini (`docker compose version`)

---

## Migration Steps

### Step 1: Stop Windows Services

**On Windows**, stop all Docker services:

```bash
# Stop all containers
docker-compose down

# Optional: Stop Docker Desktop completely
# (Right-click Docker Desktop tray icon → Quit Docker Desktop)
```

**Verify services stopped**:
```bash
docker ps
# Should show no containers running
```

### Step 2: Push Latest Code to Git

Ensure all your latest work is committed and pushed:

```bash
# On Windows
git status
git add .
git commit -m "chore: final commit before Mac mini migration"
git push origin feature/your-branch
```

### Step 3: Set Up Mac Mini Runtime

**On Mac mini** (via SSH or direct access):

1. **Clone repository** (if not already done):
   ```bash
   cd ~/Projects  # Or your preferred location
   git clone <your-repo-url>
   cd ProjectPulse
   ```

2. **Install dependencies**:
   ```bash
   # Install pnpm if not already installed
   npm install -g pnpm

   # Install project dependencies
   pnpm install
   ```

3. **Create .env file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment** (edit `.env`):
   ```bash
   # Database
   DATABASE_URL="postgresql://postgres:postgres123@postgres:5432/projectpulse_dev"

   # Application (accessible from Windows at this IP)
   NEXT_PUBLIC_APP_URL="http://192.168.1.15:3000"

   # PostgreSQL
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres123
   POSTGRES_DB=projectpulse_dev
   ```

5. **Start services using cloud compose**:
   ```bash
   docker compose -f docker-compose.cloud.yml up -d
   ```

6. **Verify services are running**:
   ```bash
   docker compose -f docker-compose.cloud.yml ps
   # Should show postgres and nextjs containers running
   ```

7. **Check health**:
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"healthy","database":"connected"}
   ```

### Step 4: Configure Windows for Remote Access

**On Windows**, update your workflow to access Mac mini services:

1. **Update browser bookmarks**:
   - Old: `http://localhost:3000`
   - New: `http://192.168.1.15:3000`

2. **Verify access from Windows**:
   ```bash
   # Test web app
   curl http://192.168.1.15:3000/api/health

   # Should return: {"status":"healthy","database":"connected"}
   ```

3. **Test in browser**:
   - Open: `http://192.168.1.15:3000`
   - Should see ProjectPulse application

### Step 5: Update Testing Configuration

**For Playwright E2E tests** targeting Mac mini:

1. **Create `.env.test` or update existing** (on Windows):
   ```bash
   BASE_URL=http://192.168.1.15:3000
   EXTERNAL_BASE_URL=1
   ```

2. **Run tests from Windows**:
   ```bash
   pnpm test:e2e
   # Tests will target Mac mini services
   ```

### Step 6: Verify Development Workflow

Test the complete workflow:

1. **Edit code on Windows** (using Windsurf/VS Code)
2. **Commit and push**:
   ```bash
   git add .
   git commit -m "test: verify Mac mini workflow"
   git push origin feature/your-branch
   ```
3. **Pull on Mac mini**:
   ```bash
   # On Mac mini
   git pull origin feature/your-branch

   # Services automatically reload (hot reload enabled)
   ```
4. **Verify changes** in browser at `http://192.168.1.15:3000`

---

## Updated Development Commands

### Where to Run What

| Task | Run On | Command |
|------|--------|---------|
| Edit code | Windows | Use Windsurf IDE |
| Git operations | Windows | `git add/commit/push` |
| Start services | Mac mini | `docker compose -f docker-compose.cloud.yml up -d` |
| Stop services | Mac mini | `docker compose -f docker-compose.cloud.yml down` |
| View logs | Mac mini | `docker compose -f docker-compose.cloud.yml logs -f` |
| Database migrations | Mac mini | `pnpm --filter web prisma migrate dev` |
| Run tests | Windows | `pnpm test` (targets Mac mini if configured) |
| Access web app | Windows | Browser → `http://192.168.1.15:3000` |
| Database queries | Mac mini | `pnpm --filter web prisma studio` |

### Daily Workflow

**Morning startup**:
```bash
# On Mac mini (or it may already be running 24/7)
docker compose -f docker-compose.cloud.yml up -d

# Verify from Windows
curl http://192.168.1.15:3000/api/health
```

**During development** (on Windows):
```bash
# Edit files in Windsurf
# Git operations as normal
git add .
git commit -m "feat: add new feature"
git push
```

**On Mac mini** (to pull latest changes):
```bash
git pull origin feature/your-branch
# Hot reload will pick up changes automatically
```

**End of day** (optional - Mac mini can run 24/7):
```bash
# On Mac mini
docker compose -f docker-compose.cloud.yml down
```

---

## Environment Variables Reference

### Mac Mini `.env`

```bash
# Database (container-to-container)
DATABASE_URL="postgresql://postgres:postgres123@postgres:5432/projectpulse_dev"

# Direct database access (from Mac mini host)
DIRECT_DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"

# Application URL (accessible from network)
NEXT_PUBLIC_APP_URL="http://192.168.1.15:3000"

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=projectpulse_dev
POSTGRES_MAX_CONNECTIONS=100

# Node environment
NODE_ENV=development
```

### Windows Testing `.env.test` (optional)

```bash
# Point tests to Mac mini
BASE_URL=http://192.168.1.15:3000
EXTERNAL_BASE_URL=1
```

---

## Troubleshooting

### Issue: Can't Access Mac Mini from Windows

**Symptoms**:
- `curl http://192.168.1.15:3000` times out
- Browser can't reach `http://192.168.1.15:3000`

**Solutions**:
1. Verify Mac mini is on same network:
   ```bash
   ping 192.168.1.15
   ```
2. Check Mac mini firewall settings (allow port 3000)
3. Verify services are running on Mac mini:
   ```bash
   docker compose -f docker-compose.cloud.yml ps
   ```
4. Check if containers are listening on correct interface:
   ```bash
   docker compose -f docker-compose.cloud.yml logs nextjs | grep "0.0.0.0:3000"
   ```

### Issue: Database Connection Fails

**Symptoms**:
- Health check returns database error
- Prisma can't connect

**Solutions**:
1. Verify PostgreSQL container is running:
   ```bash
   docker compose -f docker-compose.cloud.yml ps postgres
   ```
2. Check DATABASE_URL in Mac mini `.env`:
   ```bash
   # Should be: postgresql://postgres:postgres123@postgres:5432/projectpulse_dev
   # NOT: localhost (use service name 'postgres')
   ```
3. Restart services:
   ```bash
   docker compose -f docker-compose.cloud.yml restart
   ```

### Issue: Hot Reload Not Working

**Symptoms**:
- Code changes on Windows don't reflect after git pull on Mac mini

**Solutions**:
1. Verify volume mounts in `docker-compose.cloud.yml`:
   ```yaml
   volumes:
     - .:/app
     - /app/node_modules
   ```
2. Check Next.js logs for errors:
   ```bash
   docker compose -f docker-compose.cloud.yml logs -f nextjs
   ```
3. Force rebuild:
   ```bash
   docker compose -f docker-compose.cloud.yml up -d --build
   ```

### Issue: Git Sync Between Machines

**Symptoms**:
- Changes on Windows not appearing on Mac mini after pull

**Solutions**:
1. Ensure you're on same branch:
   ```bash
   # On both machines
   git branch
   ```
2. Push from Windows:
   ```bash
   git push origin feature/your-branch
   ```
3. Pull on Mac mini:
   ```bash
   git pull origin feature/your-branch
   ```
4. Check for merge conflicts

---

## Rollback Plan

If you need to roll back to Windows Docker:

1. **Stop Mac mini services**:
   ```bash
   docker compose -f docker-compose.cloud.yml down
   ```

2. **On Windows, start Docker Desktop**

3. **Use legacy compose file**:
   ```bash
   docker-compose up -d
   ```

4. **Update .env back to localhost**:
   ```bash
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"
   ```

5. **Verify**:
   ```bash
   curl http://localhost:3000/api/health
   ```

**Note**: Legacy Windows setup is documented in `.agent/sops/ARCHIVED-windows-docker-networking.md`

---

## Benefits of Mac Mini Cloud Runtime

After migration, you'll experience:

✅ **Eliminated WSL2 Issues**:
- No more Docker Desktop port forwarding problems
- No file permission conflicts
- No Windows/Linux path translation issues

✅ **Production-Like Environment**:
- Services run in Linux containers (like production)
- Network access pattern matches cloud deployment
- Same compose file structure as staging/production

✅ **Clean Separation**:
- Windows = Code editor (lightweight, fast)
- Mac mini = Runtime (isolated, can run 24/7)
- Clear mental model: edit vs execute

✅ **Better Performance**:
- No Windows overhead for Docker
- Mac mini can dedicate resources to services
- Windows runs faster without Docker

✅ **Easier Scaling**:
- Add Redis, Nginx, workers without Windows limitations
- Mac mini becomes personal staging server
- Easy to add monitoring, logging services

---

## Next Steps

After successful migration:

1. **Update documentation bookmarks**:
   - Primary guide: `.agent/sops/mac-mini-cloud-architecture.md`
   - Communication protocol: `.agent/sops/mac-mini-communication-protocol.md`

2. **Configure Claude Code on Mac mini** (if using MCP):
   - See: `.agent/sops/mac-mini-communication-protocol.md`
   - Set up Git-based task delegation

3. **Optional: Set Mac mini as 24/7 server**:
   - Configure auto-start on boot
   - Set up monitoring
   - Add backup automation

4. **Clean up Windows** (optional):
   - Uninstall Docker Desktop (if not needed for other projects)
   - Remove WSL2 distributions (if not needed)
   - Archive old .env files

---

## Support

**Documentation**:
- Architecture: `.agent/sops/mac-mini-cloud-architecture.md`
- Communication: `.agent/sops/mac-mini-communication-protocol.md`
- Troubleshooting: `.agent/sops/port-troubleshooting.md`

**Common Issues**:
- Archived WSL2 guide: `.agent/sops/ARCHIVED-windows-docker-networking.md`
- Infrastructure docs: `docs/11-Infrastructure-and-Deployment.md`

---

**Migration completed?** Welcome to the Mac mini cloud runtime! 🎉

**Last Updated**: 2025-11-09
