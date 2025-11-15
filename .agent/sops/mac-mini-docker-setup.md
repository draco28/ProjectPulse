> ⚠️ LEGACY ARCHITECTURE – WINDOWS + MAC MINI SPLIT
>
> This guide describes an older setup where the Mac mini only hosted PostgreSQL
> and **Windows** was the primary development machine (Next.js dev server,
> MCP server, tests). It is kept **only for historical reference**.
>
> **Current reality:** All development and runtime happen directly on the
> **Mac mini** using Docker containers (Next.js, PostgreSQL, MCP) on a single
> machine. Do **not** follow this guide for current work.
>
> Use instead:
> - `.agent/sops/mac-mini-cloud-architecture.md` – current Mac-mini-only setup
> - `.agent/archive/windows-workflows-index.md` – index of legacy Windows flows

# Mac Mini as Remote Docker Host - Setup Guide

**Version**: 1.0
**Last Updated**: 2025-11-08
**Purpose**: Configure Mac mini to host PostgreSQL Docker container for Windows development

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Windows Machine (PRIMARY - Everything runs here)        │
│ ✅ Windsurf IDE (code editing)                          │
│ ✅ Claude Code (AI assistance)                          │
│ ✅ Git repository (F:\Web_Projects\AI_HUB)             │
│ ✅ Next.js dev server (pnpm dev on Windows)            │
│ ✅ MCP server (built and run on Windows)               │
│ ✅ Browser testing (localhost:3000)                    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ DATABASE_URL connection
                          │ postgresql://mac-mini-ip:5432
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Mac Mini (SECONDARY - Only Docker PostgreSQL)           │
│ ✅ Docker Desktop (running PostgreSQL container)        │
│ ✅ PostgreSQL exposed on port 5432                      │
│ ❌ NO code, NO Next.js, NO MCP server                  │
└─────────────────────────────────────────────────────────┘
```

**What This Solves:**
- ❌ Eliminates WSL2 file permission issues
- ❌ Eliminates WSL2 Docker networking issues
- ❌ Eliminates Windows Docker Desktop limitations
- ✅ Keep your entire workflow on Windows (familiar)
- ✅ Only move the problematic piece (PostgreSQL) to Mac

---

## 📋 Prerequisites

**On Windows:**
- [ ] Windsurf IDE installed and working
- [ ] Git repository at `F:\Web_Projects\AI_HUB`
- [ ] Network access to Mac mini (same LAN)
- [ ] Know Mac mini's IP address (e.g., 192.168.1.100)

**On Mac Mini:**
- [ ] macOS with Terminal access
- [ ] Docker Desktop for Mac installed
- [ ] Network connectivity (Ethernet or WiFi)

---

## 🚀 Phase 1: Mac Mini Docker Setup

### Step 1.1: Install Docker Desktop on Mac Mini

**Do this directly on Mac mini (not through Claude Code):**

1. **Download Docker Desktop:**
   - Visit: https://www.docker.com/products/docker-desktop
   - Download Docker Desktop for Mac (Apple Silicon or Intel)

2. **Install Docker Desktop:**
   - Open the `.dmg` file
   - Drag Docker to Applications folder
   - Launch Docker Desktop
   - Accept terms and complete setup

3. **Verify installation:**
   ```bash
   docker --version
   docker-compose --version
   ```

4. **Configure Docker to start on login:**
   - Docker Desktop → Preferences → General
   - Check "Start Docker Desktop when you log in"

---

### Step 1.2: Transfer Docker Compose File to Mac Mini

**Option A: Using Git (Recommended)**

On Mac mini terminal:
```bash
# Clone repository (you'll only need docker-compose.yml)
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/draco28/ProjectPulse.git AI_HUB
cd AI_HUB
git checkout feature/sprint-1-foundation

# Verify docker-compose.yml exists
ls -la docker-compose.yml
```

**Option B: Manual Copy**

On Windows:
1. Copy content of `F:\Web_Projects\AI_HUB\docker-compose.yml`

On Mac mini:
```bash
mkdir -p ~/projectpulse-docker
cd ~/projectpulse-docker
nano docker-compose.yml
# Paste content, save (Ctrl+O, Enter, Ctrl+X)
```

---

### Step 1.3: Start PostgreSQL Container

**On Mac mini terminal:**

```bash
# Navigate to project directory
cd ~/projects/AI_HUB  # or ~/projectpulse-docker if manual copy

# Start PostgreSQL container
docker-compose up -d postgres

# Verify container is running
docker ps | grep postgres

# Check logs
docker-compose logs postgres

# Verify PostgreSQL is listening
nc -zv localhost 5432
# Should show: Connection to localhost port 5432 [tcp/postgresql] succeeded!
```

**Expected Output:**
```
✅ Container "projectpulse-postgres" is running
✅ Port 5432 is exposed and listening
✅ PostgreSQL accepts connections
```

---

### Step 1.4: Configure PostgreSQL for Remote Access

**On Mac mini terminal:**

1. **Get container name:**
   ```bash
   docker ps | grep postgres
   # Note the container name (e.g., "ai_hub-postgres-1")
   ```

2. **Access PostgreSQL container:**
   ```bash
   docker exec -it [container-name] bash
   # Replace [container-name] with actual name from step 1
   ```

3. **Inside container, edit postgresql.conf:**
   ```bash
   apt-get update && apt-get install -y nano
   nano /var/lib/postgresql/data/postgresql.conf

   # Find this line (around line 59):
   #listen_addresses = 'localhost'

   # Change to:
   listen_addresses = '*'

   # Save and exit (Ctrl+O, Enter, Ctrl+X)
   ```

4. **Edit pg_hba.conf for network access:**
   ```bash
   nano /var/lib/postgresql/data/pg_hba.conf

   # Add this line at the end:
   host    all             all             0.0.0.0/0               md5

   # Save and exit
   ```

5. **Exit container and restart:**
   ```bash
   exit
   docker-compose restart postgres
   ```

6. **Verify remote access works:**
   ```bash
   # Get Mac mini IP address
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Note the IP (e.g., 192.168.1.100)

   # Test connection with IP (should work)
   psql -h [your-mac-ip] -U postgres -d projectpulse_dev
   # Enter password: postgres123
   # Should connect successfully
   ```

---

### Step 1.5: Configure Mac Firewall

**On Mac mini:**

1. **Open System Preferences:**
   - Apple menu → System Preferences → Security & Privacy → Firewall

2. **If Firewall is ON:**
   - Click "Firewall Options"
   - Add Docker (`/Applications/Docker.app`)
   - Set to "Allow incoming connections"
   - Click OK

3. **Test from Windows (next phase):**
   - We'll verify connection works from Windows machine

---

## 🖥️ Phase 2: Windows Configuration

### Step 2.1: Update DATABASE_URL

**On Windows in Windsurf:**

1. **Get Mac mini IP address** (you noted this in Phase 1):
   - Example: `192.168.1.100`

2. **Edit `apps/web/.env.local`:**
   ```env
   # OLD (localhost - won't work anymore):
   # DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"

   # NEW (Mac mini IP):
   DATABASE_URL="postgresql://postgres:postgres123@192.168.1.100:5432/projectpulse_dev"

   # Replace 192.168.1.100 with your actual Mac mini IP
   ```

3. **Save the file**

---

### Step 2.2: Test Database Connection

**In Windsurf terminal (Windows):**

```bash
# Navigate to web app
cd F:\Web_Projects\AI_HUB\apps\web

# Test Prisma connection
pnpm prisma db pull

# Should succeed and show:
# "Introspected 5 models and wrote them into prisma\schema.prisma..."
```

**If connection fails:**
- Verify Mac mini IP is correct
- Verify PostgreSQL container is running on Mac: `docker ps`
- Verify firewall allows connections
- Try ping: `ping 192.168.1.100`

---

### Step 2.3: Run Prisma Migrations

**In Windsurf terminal (Windows):**

```bash
cd F:\Web_Projects\AI_HUB\apps\web

# Run migrations to set up database schema
pnpm prisma migrate deploy

# Verify migrations applied
pnpm prisma migrate status

# Should show: "Database schema is up to date!"
```

---

### Step 2.4: Start Next.js Dev Server

**In Windsurf terminal (Windows):**

```bash
cd F:\Web_Projects\AI_HUB\apps\web

# Start dev server
pnpm dev

# Should show:
# ✓ Ready on http://localhost:3000
# (or http://0.0.0.0:3000)
```

---

### Step 2.5: Test Application

**In Windows browser:**

1. **Open:** `http://localhost:3000`
   - Application should load ✅

2. **Test health endpoint:** `http://localhost:3000/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`  ✅

3. **Create test phase via API:**
   ```bash
   # In Windsurf terminal
   curl -X POST http://localhost:3000/api/phases \
     -H "Content-Type: application/json" \
     -d "{\"title\":\"Test Phase\",\"startDate\":\"2025-01-01T00:00:00Z\",\"endDate\":\"2025-01-08T00:00:00Z\"}"

   # Should return phase ID and generated weeks
   ```

4. **Verify in database:**
   ```bash
   # On Mac mini terminal
   docker exec -it [container-name] psql -U postgres -d projectpulse_dev

   # Inside psql:
   SELECT * FROM "Phase";
   # Should show the test phase
   ```

---

## 🔧 Phase 3: MCP Server Setup (Windows)

### Step 3.1: Build MCP Server

**In Windsurf terminal (Windows):**

```bash
cd F:\Web_Projects\AI_HUB\apps\mcp-server

# Install dependencies (if not done)
pnpm install

# Build TypeScript
pnpm build

# Should succeed with 0 errors
# Creates: dist/index.js
```

---

### Step 3.2: Configure MCP Server in Claude Code

**In Claude Code settings (Windows):**

1. **Find MCP config file:**
   - Usually: `C:\Users\[YourUsername]\.claude\mcp.json`

2. **Add ProjectPulse MCP server:**
   ```json
   {
     "mcpServers": {
       "projectpulse": {
         "command": "node",
         "args": ["F:\\Web_Projects\\AI_HUB\\apps\\mcp-server\\dist\\index.js"],
         "env": {
           "PROJECTPULSE_API_URL": "http://localhost:3000"
         }
       }
     }
   }
   ```

3. **Restart Claude Code** to load MCP server

4. **Verify tools available:**
   - In Claude Code, ask: "What ProjectPulse MCP tools are available?"
   - Should list 6 tools:
     - `projectpulse.health.check`
     - `projectpulse.sprint.phase.create`
     - `projectpulse.sprint.getCurrentTask`
     - `projectpulse.sprint.updateProgress`
     - `projectpulse.sprint.task.create`
     - `projectpulse.sprint.session.create`

---

## ✅ Phase 4: End-to-End Verification

### Step 4.1: Full Workflow Test

**In Claude Code on Windows, test this workflow:**

```markdown
TASK: Test complete ProjectPulse workflow

1. Create a phase using MCP tool:
   Use projectpulse.sprint.phase.create:
   - title: "Sprint 1 Week 2"
   - startDate: "2025-01-08T00:00:00Z"
   - endDate: "2025-01-15T00:00:00Z"

   Expected: Returns phase ID and 2 generated weeks

2. Get the current task:
   Use projectpulse.sprint.getCurrentTask

   Expected: Returns most recently updated task or null

3. Verify in database (Mac mini):
   On Mac: docker exec -it [container] psql -U postgres -d projectpulse_dev
   Query: SELECT * FROM "Phase" WHERE title = 'Sprint 1 Week 2';

   Expected: Phase exists with 2 child weeks

4. Test in browser (Windows):
   Open: http://localhost:3000
   Expected: Application loads and connects to database

Show results of all 4 checks.
```

**Expected Result:**
- ✅ All MCP tools work
- ✅ Data persists in Mac mini PostgreSQL
- ✅ Next.js connects to remote database
- ✅ Browser application works

---

## 🔄 Daily Development Workflow

### Your Normal Workflow (No Changes!)

**In Windsurf on Windows:**

1. Edit code as usual
2. Git commit and push as usual
3. Run `pnpm dev` as usual
4. Test in browser as usual

**The ONLY difference:**
- Database is on Mac mini instead of Windows
- Everything else stays exactly the same

---

### Restarting After Reboot

**On Mac mini (one-time after restart):**
```bash
cd ~/projects/AI_HUB  # or ~/projectpulse-docker
docker-compose up -d postgres
```

**On Windows (same as before):**
```bash
cd F:\Web_Projects\AI_HUB\apps\web
pnpm dev
```

---

## 🐛 Troubleshooting

### Issue: Cannot connect to database from Windows

**Check 1: Mac mini Docker running?**
```bash
# On Mac mini:
docker ps | grep postgres
# Should show running container
```

**Check 2: Can Windows reach Mac mini?**
```bash
# On Windows:
ping 192.168.1.100
# Should get replies
```

**Check 3: Firewall blocking?**
- On Mac: System Preferences → Security & Privacy → Firewall
- Allow Docker connections

**Check 4: DATABASE_URL correct?**
```bash
# On Windows, check .env.local:
cd F:\Web_Projects\AI_HUB\apps\web
type .env.local | findstr DATABASE_URL
# Should show Mac mini IP, not localhost
```

---

### Issue: MCP server build fails on Windows

**Solution: Clean and rebuild**
```bash
cd F:\Web_Projects\AI_HUB\apps\mcp-server
rmdir /s /q dist
rmdir /s /q node_modules
pnpm install
pnpm build
```

---

### Issue: Next.js can't find database tables

**Solution: Run migrations**
```bash
cd F:\Web_Projects\AI_HUB\apps\web
pnpm prisma migrate deploy
pnpm prisma generate
```

---

### Issue: Mac mini IP address changed

**When Mac mini gets new IP (DHCP):**

1. **On Mac mini, find new IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **On Windows, update .env.local:**
   ```bash
   cd F:\Web_Projects\AI_HUB\apps\web
   # Edit .env.local with new IP
   # Restart pnpm dev
   ```

**Permanent solution:**
- Configure Mac mini with static IP in router settings
- Or use hostname instead of IP (if DNS resolution works)

---

## 📝 Quick Reference

### Start Everything

**Mac mini (once):**
```bash
docker-compose up -d postgres
```

**Windows (every dev session):**
```bash
cd F:\Web_Projects\AI_HUB\apps\web
pnpm dev
```

### Stop Everything

**Windows:**
```
Ctrl+C in terminal (stops Next.js)
```

**Mac mini (optional):**
```bash
docker-compose stop postgres
# Optional: Only if you need to save resources
```

### Check Status

**Mac mini:**
```bash
docker ps
docker-compose logs postgres
```

**Windows:**
```bash
# Test database connection:
cd F:\Web_Projects\AI_HUB\apps\web
pnpm prisma db pull
```

---

## 🎯 Success Criteria

You'll know setup is complete when:

- ✅ PostgreSQL container running on Mac mini (port 5432)
- ✅ Windows can connect to Mac mini PostgreSQL
- ✅ Prisma migrations applied successfully
- ✅ Next.js dev server runs on Windows (port 3000)
- ✅ MCP server built successfully on Windows
- ✅ All 6 MCP tools available in Claude Code
- ✅ Browser can access http://localhost:3000
- ✅ Can create phase via MCP tool and see in database

---

## 💡 Benefits of This Setup

**vs Windows Docker Desktop:**
- ✅ No WSL2 file permission issues
- ✅ No WSL2 networking complexity
- ✅ No Windows path conversion problems
- ✅ Stable PostgreSQL performance

**vs Full Mac Backend:**
- ✅ Keep familiar Windows workflow
- ✅ Keep Windsurf IDE on Windows
- ✅ Keep Claude Code on Windows
- ✅ Only move problematic piece (Docker)

**vs localhost everything:**
- ✅ Clean separation of concerns
- ✅ Database can be backed up independently
- ✅ Can restart Windows without losing database
- ✅ Production-like architecture (separate DB server)

---

## 📚 Next Steps

After successful setup:

1. ✅ Complete Day 8-9 verification (build MCP server on Windows)
2. ✅ Run manual API tests (curl to localhost:3000)
3. ✅ Run integration tests (phase → week → day → task → session)
4. ✅ Update documentation (API catalog, MCP tools guide)
5. ✅ Continue with Sprint 1 Week 2 Day 10-11

---

**Last Updated:** 2025-11-08
**Maintained By:** Claude Code + User
