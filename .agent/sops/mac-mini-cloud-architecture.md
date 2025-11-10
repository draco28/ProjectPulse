# Mac Mini as Local Cloud - Complete Setup Guide

**Version**: 1.0
**Last Updated**: 2025-11-08
**Purpose**: Configure Mac mini as complete local cloud (Vercel + Supabase replacement)

---

## 🎯 Architecture Overview - Cloud Simulation

### Production Cloud Architecture (What we're replicating)

```
Developer Machine
    ↓ (git push)
GitHub
    ↓ (auto-deploy)
Vercel (Next.js Frontend)
    ↓ (DATABASE_URL connection)
Supabase (PostgreSQL Database)
```

### Your Local Cloud Architecture (Mac Mini)

```
┌─────────────────────────────────────────────────────────┐
│ Windows Machine = Developer Workstation                 │
│ ✅ Windsurf IDE (code editing ONLY)                    │
│ ✅ Git (version control)                                │
│ ✅ Browser (access http://mac-mini-ip:3000)            │
│ ✅ Claude Code (connected to Mac mini MCP)             │
│ ❌ NO servers, NO Docker, NO Next.js                   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ git push/pull
                          │ HTTP requests to Mac mini
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Mac Mini = "Local Cloud" (Vercel + Supabase)           │
│                                                         │
│ 🐳 Docker Container: Next.js App (Vercel)              │
│    Image: node:20-alpine                                │
│    Port: 3000 → 3000                                    │
│    Command: pnpm dev (with --hostname 0.0.0.0)         │
│    Auto-restart on changes                              │
│                                                         │
│ 🐳 Docker Container: PostgreSQL (Supabase)             │
│    Image: postgres:15-alpine                            │
│    Port: 5432 → 5432                                    │
│    Volume: Persistent storage                           │
│                                                         │
│ 🐳 Docker Container: MCP Server (Custom)               │
│    Image: node:20-alpine                                │
│    Command: node dist/index.js                          │
│    Network: Access to Next.js container                 │
│                                                         │
│ 📦 Git Repository Clone                                 │
│    Path: ~/projects/AI_HUB                              │
│    Branch: feature/sprint-1-foundation                  │
│    Auto-pull: Via git hook or manual                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

**On Windows:**
- [ ] Windsurf IDE installed
- [ ] Git repository at `F:\Web_Projects\AI_HUB`
- [ ] All changes committed and pushed to remote
- [ ] Network access to Mac mini (same LAN)

**On Mac Mini:**
- [ ] macOS with Terminal access
- [ ] Docker Desktop for Mac installed
- [ ] Git installed (`git --version`)
- [ ] Homebrew installed (for utilities)

---

## 🚀 Phase 1: Mac Mini Docker Environment Setup

### Step 1.1: Install Required Tools

**On Mac mini terminal:**

```bash
# Install Docker Desktop (if not done)
# Download from: https://www.docker.com/products/docker-desktop

# Verify Docker installation
docker --version
docker-compose --version

# Install Node.js (for local utilities if needed)
brew install node@20
brew install pnpm

# Verify installations
node --version  # Should show v20.x
pnpm --version  # Should show v8.x+
```

---

### Step 1.2: Clone Repository on Mac Mini

**On Mac mini terminal:**

```bash
# Create projects directory
mkdir -p ~/projects
cd ~/projects

# Clone repository
git clone https://github.com/draco28/ProjectPulse.git AI_HUB
cd AI_HUB

# Checkout feature branchWe
git checkout feature/sprint-1-foundation

# Verify clone
ls -la
# Should see: apps/, docker-compose.yml, package.json, etc.

# Show current commit
git log -1 --oneline
```

---

## 🐳 Phase 2: Docker Compose Configuration

### Step 2.1: Create Production-Like Docker Compose

**On Mac mini, create `docker-compose.cloud.yml`:**

```bash
cd ~/projects/AI_HUB

# Create new Docker Compose file
cat > docker-compose.cloud.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database (like Supabase)
  postgres:
    image: postgres:15-alpine
    container_name: projectpulse-postgres-cloud
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: projectpulse_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - projectpulse
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Next.js Frontend (like Vercel)
  nextjs:
    image: node:20-alpine
    container_name: projectpulse-nextjs-cloud
    working_dir: /app
    command: sh -c "pnpm install && cd apps/web && pnpm prisma generate && pnpm dev --hostname 0.0.0.0"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/projectpulse_dev
      - NEXT_PUBLIC_API_URL=http://0.0.0.0:3000
      - NODE_ENV=development
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - /app/node_modules
      - /app/apps/web/node_modules
      - /app/apps/web/.next
    networks:
      - projectpulse
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # MCP Server (Custom Backend)
  mcp-server:
    image: node:20-alpine
    container_name: projectpulse-mcp-cloud
    working_dir: /app
    command: sh -c "pnpm install && cd apps/mcp-server && pnpm build && node dist/index.js"
    environment:
      - PROJECTPULSE_API_URL=http://nextjs:3000
      - NODE_ENV=development
    volumes:
      - ./:/app
      - /app/node_modules
      - /app/apps/mcp-server/node_modules
    networks:
      - projectpulse
    depends_on:
      - nextjs
    restart: unless-stopped

networks:
  projectpulse:
    driver: bridge

volumes:
  postgres_data:
    driver: local
EOF

# Verify file created
cat docker-compose.cloud.yml
```

---

### Step 2.2: Start All Services

**On Mac mini terminal:**

```bash
cd ~/projects/AI_HUB

# Pull latest images
docker-compose -f docker-compose.cloud.yml pull

# Start all services (will take 5-10 minutes first time)
docker-compose -f docker-compose.cloud.yml up -d

# Watch logs in real-time
docker-compose -f docker-compose.cloud.yml logs -f

# Wait for these messages:
# ✅ postgres: "database system is ready to accept connections"
# ✅ nextjs: "ready started server on 0.0.0.0:3000"
# ✅ mcp-server: "MCP server started successfully"

# Press Ctrl+C to stop watching logs (services keep running)
```

---

### Step 2.3: Run Database Migrations

**On Mac mini terminal:**

```bash
cd ~/projects/AI_HUB

# Access Next.js container and run migrations
docker exec -it projectpulse-nextjs-cloud sh

# Inside container:
cd apps/web
pnpm prisma migrate deploy
pnpm prisma db seed  # If seed script exists

# Exit container
exit

# Verify migrations applied
docker exec -it projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "\dt"
# Should show: Phase, Week, Day, Task, Session tables
```

---

### Step 2.4: Get Mac Mini IP Address

**On Mac mini terminal:**

```bash
# Get IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Note the IP address (e.g., 192.168.1.100)
# This is what you'll use from Windows browser
```

---

## 🖥️ Phase 3: Windows Development Workflow

**🚨 CRITICAL: Do 95% of work on Windows, NOT Mac mini**

- **Windows**: Code editing, Git operations, API testing (curl to Mac mini), MCP tools, TypeScript checks
- **Mac mini**: ONLY Docker operations, database migrations, server debugging

**The Mac mini is your API server, not your development machine!**

---

### Step 3.1: Development Workflow (Daily Use)

**On Windows in Windsurf:**

```
1. Edit code in Windsurf as usual
   - apps/web/...
   - apps/mcp-server/...

2. Commit changes locally:
   git add .
   git commit -m "feat: implemented X"

3. Push to remote:
   git push origin feature/sprint-1-foundation
```

**On Mac mini (pull changes):**

```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation

# Restart services to pick up changes
docker-compose -f docker-compose.cloud.yml restart nextjs mcp-server

# Watch logs to see rebuild
docker-compose -f docker-compose.cloud.yml logs -f nextjs
```

---

### Step 3.2: Test in Windows Browser

**On Windows:**

1. **Open browser:** `http://192.168.1.100:3000`
   - Replace with your Mac mini IP
   - Should see ProjectPulse application ✅

2. **Test health endpoint:** `http://192.168.1.100:3000/api/health`
   - Should return: `{"status":"ok",...}` ✅

3. **Test API endpoint:**
   ```bash
   # In Windows terminal
   curl -X POST http://192.168.1.100:3000/api/phases ^
     -H "Content-Type: application/json" ^
     -d "{\"title\":\"Test Phase\",\"startDate\":\"2025-01-01T00:00:00Z\",\"endDate\":\"2025-01-08T00:00:00Z\"}"
   ```

---

### Step 3.3: Configure Claude Code MCP (Windows)

**On Windows, edit Claude Code MCP config:**

Location: `C:\Users\[YourUsername]\.claude\mcp.json`

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "projectpulse-mcp-cloud",
        "node",
        "/app/apps/mcp-server/dist/index.js"
      ],
      "env": {
        "PROJECTPULSE_API_URL": "http://192.168.1.100:3000"
      }
    }
  }
}
```

**Note:** This requires Docker CLI on Windows OR use SSH tunnel (next section).

---

### Step 3.4: Alternative - MCP via SSH Tunnel (Recommended)

**On Windows, install SSH client if not present:**
- Git Bash (comes with Git for Windows) has SSH

**Create SSH tunnel to Mac mini:**

```bash
# In Git Bash on Windows
ssh -N -L 9000:localhost:9000 [your-mac-username]@[mac-mini-ip]

# Keep this terminal open (tunnel runs in foreground)
```

**On Mac mini, expose MCP server via TCP:**

Update `docker-compose.cloud.yml` to add:
```yaml
mcp-server:
  ports:
    - "9000:9000"  # Expose MCP stdio via TCP
```

**Then in Claude Code MCP config:**
```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "nc",
      "args": ["localhost", "9000"],
      "env": {
        "PROJECTPULSE_API_URL": "http://192.168.1.100:3000"
      }
    }
  }
}
```

---

## 🔄 Phase 4: Auto-Update Workflow (Optional Advanced)

### Step 4.1: Git Auto-Pull on Mac Mini

**Create git hook for auto-pull:**

```bash
cd ~/projects/AI_HUB

# Create post-receive hook simulation
cat > ~/bin/auto-pull-projectpulse.sh << 'EOF'
#!/bin/bash
cd ~/projects/AI_HUB
git fetch origin feature/sprint-1-foundation
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/feature/sprint-1-foundation)

if [ $LOCAL != $REMOTE ]; then
    echo "🔄 Pulling latest changes..."
    git pull origin feature/sprint-1-foundation

    echo "🐳 Restarting Docker services..."
    docker-compose -f docker-compose.cloud.yml restart nextjs mcp-server

    echo "✅ Update complete!"
fi
EOF

chmod +x ~/bin/auto-pull-projectpulse.sh

# Add to cron (every 5 minutes)
crontab -e
# Add this line:
# */5 * * * * ~/bin/auto-pull-projectpulse.sh >> ~/auto-pull.log 2>&1
```

**Now your workflow is:**
1. Edit code on Windows
2. `git push`
3. Wait 5 minutes (or manually trigger on Mac)
4. Refresh browser - changes are live! ✅

---

## ✅ Phase 5: Verification & Testing

### Step 5.1: Complete System Check

**Run these verifications:**

**1. PostgreSQL Health:**
```bash
# On Mac mini
docker exec projectpulse-postgres-cloud pg_isready -U postgres
# Should show: accepting connections
```

**2. Next.js Health:**
```bash
# From Windows
curl http://192.168.1.100:3000/api/health
# Should return: {"status":"ok",...}
```

**3. MCP Server Health:**
```bash
# On Mac mini
docker logs projectpulse-mcp-cloud | tail -20
# Should show: "MCP server started" or similar
```

**4. End-to-End Test:**
```bash
# From Windows, create test phase
curl -X POST http://192.168.1.100:3000/api/phases ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"E2E Test\",\"startDate\":\"2025-01-01T00:00:00Z\",\"endDate\":\"2025-01-08T00:00:00Z\"}"

# Verify in database (Mac mini)
docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "SELECT title FROM \"Phase\" WHERE title = 'E2E Test';"
# Should show: E2E Test
```

---

## 🐛 Troubleshooting

### Issue: Next.js container keeps restarting

**Check logs:**
```bash
docker logs projectpulse-nextjs-cloud
```

**Common causes:**
- Missing dependencies → Check pnpm install succeeded
- Port already in use → Kill process on port 3000
- Database not ready → Wait for postgres healthcheck

**Solution:**
```bash
# Rebuild container
docker-compose -f docker-compose.cloud.yml down nextjs
docker-compose -f docker-compose.cloud.yml up -d nextjs
```

---

### Issue: Cannot access from Windows browser

**Check Mac firewall:**
```bash
# On Mac mini
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

**Allow Docker:**
- System Preferences → Security & Privacy → Firewall → Firewall Options
- Add Docker, set to "Allow incoming connections"

**Verify ports are open:**
```bash
# On Mac mini
lsof -i :3000
# Should show Docker process
```

---

### Issue: Database connection refused

**Check if postgres is running:**
```bash
docker ps | grep postgres
```

**Check postgres logs:**
```bash
docker logs projectpulse-postgres-cloud
```

**Verify DATABASE_URL in Next.js container:**
```bash
docker exec projectpulse-nextjs-cloud env | grep DATABASE_URL
# Should show: postgresql://postgres:postgres123@postgres:5432/projectpulse_dev
```

---

### Issue: Changes not reflecting after git pull

**Restart services:**
```bash
cd ~/projects/AI_HUB
docker-compose -f docker-compose.cloud.yml restart nextjs mcp-server
```

**If still not working, rebuild:**
```bash
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build
```

---

## 📝 Quick Reference

### Daily Commands

**Mac Mini - Start Everything:**
```bash
cd ~/projects/AI_HUB
docker-compose -f docker-compose.cloud.yml up -d
```

**Mac Mini - Pull Latest Changes:**
```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
docker-compose -f docker-compose.cloud.yml restart nextjs mcp-server
```

**Mac Mini - View Logs:**
```bash
# All services
docker-compose -f docker-compose.cloud.yml logs -f

# Specific service
docker logs -f projectpulse-nextjs-cloud
docker logs -f projectpulse-postgres-cloud
docker logs -f projectpulse-mcp-cloud
```

**Mac Mini - Stop Everything:**
```bash
docker-compose -f docker-compose.cloud.yml down
```

**Windows - Test Application:**
```bash
# Browser
http://192.168.1.100:3000

# Health check
curl http://192.168.1.100:3000/api/health
```

---

## 🎯 Success Criteria

Your local cloud is ready when:

- ✅ All 3 Docker containers running on Mac mini
- ✅ PostgreSQL accepts connections (port 5432)
- ✅ Next.js serves on 0.0.0.0:3000
- ✅ Windows browser can access Mac mini Next.js
- ✅ API endpoints respond correctly
- ✅ Database persists data across restarts
- ✅ Git pull + restart updates the application
- ✅ MCP server connects to Next.js API

---

## 💡 Benefits of This Architecture

**vs Development on Windows:**
- ✅ No WSL2 issues ever
- ✅ Clean separation (edit vs run)
- ✅ Production-like architecture
- ✅ Easy to add Redis, Nginx, etc.

**vs Cloud Services (Vercel/Supabase):**
- ✅ No API rate limits
- ✅ No cold starts
- ✅ Full control over environment
- ✅ Instant updates (no deploy wait)
- ✅ Free (no subscription costs)

**vs Running Everything Locally:**
- ✅ Containerized = reproducible
- ✅ Can snapshot entire state
- ✅ Mac mini can run 24/7 (staging server)
- ✅ Windows stays lightweight

---

## 🚀 Future Enhancements

**Add these services later:**

1. **Redis Cache:**
   ```yaml
   redis:
     image: redis:7-alpine
     ports:
       - "6379:6379"
   ```

2. **Nginx Reverse Proxy:**
   ```yaml
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
     volumes:
       - ./nginx.conf:/etc/nginx/nginx.conf
   ```

3. **Background Workers:**
   ```yaml
   worker:
     image: node:20-alpine
     command: node apps/worker/index.js
   ```

4. **Monitoring (Grafana + Prometheus):**
   ```yaml
   prometheus:
     image: prom/prometheus
   grafana:
     image: grafana/grafana
   ```

---

**Last Updated:** 2025-11-08
**Maintained By:** Claude Code + User
