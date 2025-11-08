> 🚫 ARCHIVED — Superseded by Mac mini Cloud Runtime
> Do NOT use Windows Docker/WSL for ProjectPulse development. All services run on the Mac mini (192.168.1.15).
> Use: docker-compose.cloud.yml on the Mac mini, and follow Git-based communication.
> See: .agent/sops/mac-mini-cloud-architecture.md and .agent/sops/mac-mini-communication-protocol.md

# Windows Docker Desktop + WSL2 Networking Troubleshooting

**Created**: 2025-11-08
**Issue**: PostgreSQL running in Docker Desktop (WSL2 backend) not accessible from Windows host
**Solution**: Run development commands from WSL2 or use docker exec

---

## Problem Description

**Symptoms**:
- Docker container is healthy: `docker ps` shows "Up X minutes (healthy)"
- Port mapping shows: `127.0.0.1:5432->5432/tcp` or `0.0.0.0:5432->5432/tcp`
- Windows host cannot connect: `telnet localhost 5432` fails
- Prisma CLI fails: `Can't reach database server at localhost:5432`
- Next.js dev server cannot start (if it tries to connect to database)

**Root Cause**:
Docker Desktop on Windows uses WSL2 as a backend. When containers bind ports, they bind **inside the WSL2 VM**, not directly on Windows. Docker Desktop is supposed to forward ports from WSL2 to Windows automatically, but this sometimes fails, especially after Windows updates or Docker Desktop restarts.

---

## Quick Diagnosis

### Step 1: Verify Container is Healthy

```bash
docker ps --filter "name=projectpulse-db"
# Expected: Status shows "Up X minutes (healthy)"

docker exec projectpulse-db pg_isready -U projectpulse
# Expected: "accepting connections"
```

### Step 2: Check Port Binding

```bash
docker port projectpulse-db
# Shows: 5432/tcp -> 0.0.0.0:5432 (correct)
# Or: 5432/tcp -> 127.0.0.1:5432 (more restrictive, but should still work)
```

### Step 3: Test Connectivity from Windows

```bash
# Test TCP connection
timeout 5 bash -c "echo > /dev/tcp/127.0.0.1/5432" 2>&1
# Expected: Success (no output)
# If fails: Port forwarding issue

# Test with Prisma
cd apps/web
npx prisma db execute --stdin <<< "SELECT 1;"
# Expected: "Script executed successfully"
# If fails: "Can't reach database server"
```

### Step 4: Test Connectivity from WSL2

```bash
# Check if WSL2 can connect
wsl -d Ubuntu-24.04 -- bash -c "timeout 3 bash -c 'echo > /dev/tcp/localhost/5432' && echo 'WSL can connect' || echo 'WSL cannot connect'"
# Expected: "WSL can connect"

# Check if port is listening in WSL2
wsl -d Ubuntu-24.04 -- netstat -tuln | grep :5432
# Expected: tcp 0 0 0.0.0.0:5432 0.0.0.0:* LISTEN
```

**Decision Tree**:
- ✅ Container healthy + ❌ Windows cannot connect + ✅ WSL2 can connect → **Port forwarding issue (Solution A)**
- ✅ Container healthy + ❌ Windows cannot connect + ❌ WSL2 cannot connect → **Docker networking issue (Solution B)**
- ❌ Container not healthy → **Container/database issue (Solution C)**

---

## Solutions

### Solution A: Run Commands from WSL2 (Recommended)

**When to use**: WSL2 can connect, Windows cannot (most common case)

**Advantages**:
- No admin permissions required
- Works reliably
- Best practice for WSL2 development
- No manual port forwarding maintenance

**Disadvantages**:
- Need to remember to use `wsl` prefix for commands
- Slightly slower file access (Windows filesystem accessed via /mnt/f/)

**How to implement**:

```bash
# 1. Access project from WSL2
wsl -d Ubuntu-24.04
cd /mnt/f/Web_Projects/AI_HUB

# 2. Run development commands
cd apps/web
pnpm dev  # Start Next.js dev server
# or
pnpm prisma studio  # Open Prisma Studio
# or
pnpm prisma migrate dev  # Run migrations

# 3. Test API endpoints (from another WSL2 terminal)
wsl -d Ubuntu-24.04
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/phases -H "Content-Type: application/json" -d '{...}'
```

**One-liner commands** (if you prefer staying in Windows terminal):

```bash
# Run Prisma commands from Windows terminal via WSL2
wsl -d Ubuntu-24.04 -- bash -c "cd /mnt/f/Web_Projects/AI_HUB/apps/web && npx prisma studio"

# Start dev server from Windows terminal via WSL2
wsl -d Ubuntu-24.04 -- bash -c "cd /mnt/f/Web_Projects/AI_HUB/apps/web && pnpm dev"

# Run migration from Windows terminal via WSL2
wsl -d Ubuntu-24.04 -- bash -c "cd /mnt/f/Web_Projects/AI_HUB/apps/web && pnpm prisma migrate dev"
```

---

### Solution B: Use Docker Exec (Quick Tests Only)

**When to use**: One-off database queries, doesn't work for Next.js dev server

**Advantages**:
- No need to enter WSL2
- Fast for quick queries
- No dependencies on host environment

**Disadvantages**:
- Cannot run Next.js dev server (needs file watching)
- Cannot run Prisma Studio (needs browser access)
- More verbose for complex operations

**How to implement**:

```bash
# Execute SQL directly
docker exec -i projectpulse-db psql -U projectpulse -d projectpulse_db -c "SELECT version();"

# Run Prisma migration (via docker exec calling Prisma inside web container)
# NOTE: Only works if web container is running
docker exec -i projectpulse-web npx prisma migrate dev

# Interactive psql session
docker exec -it projectpulse-db psql -U projectpulse -d projectpulse_db
```

---

### Solution C: Manual Windows Port Forwarding (Advanced)

**When to use**: Need Windows apps to access PostgreSQL directly (rare)

**Advantages**:
- Windows apps can connect to localhost:5432
- Works for GUI database tools like pgAdmin

**Disadvantages**:
- Requires admin permissions
- Fragile (breaks when WSL2 IP changes after restart)
- Manual maintenance required
- Not recommended for development

**How to implement**:

```bash
# 1. Get WSL2 IP (changes on restart!)
wsl -d Ubuntu-24.04 hostname -I
# Example output: 192.168.1.7 2401:...

# 2. Add port forwarding rule (requires Admin PowerShell)
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=5432 connectaddress=192.168.1.7 connectport=5432

# 3. Verify rule added
netsh interface portproxy show all

# 4. Test connection
telnet localhost 5432

# To remove rule later:
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=5432
```

**Automation script** (PowerShell, must run as Admin):

```powershell
# wsl-port-forward.ps1
$wslIp = wsl -d Ubuntu-24.04 hostname -I | ForEach-Object { $_.Split(' ')[0] }
Write-Host "WSL2 IP: $wslIp"

# Remove old rule if exists
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=5432 2>$null

# Add new rule
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=5432 connectaddress=$wslIp connectport=5432

Write-Host "Port forwarding configured: 0.0.0.0:5432 -> ${wslIp}:5432"
```

---

## Docker Compose Configuration

**Current configuration** (docker-compose.yml line 33):

```yaml
ports:
  - "0.0.0.0:5432:5432"  # Bind to all interfaces (required for WSL2)
```

**Why 0.0.0.0 instead of 127.0.0.1**:
- `127.0.0.1:5432:5432` - Only accessible via localhost inside WSL2
- `0.0.0.0:5432:5432` - Accessible via all network interfaces (including WSL2 → Windows bridge)

**Security note**: 
- In development, `0.0.0.0` is safe because Docker Desktop isolates WSL2 networking
- In production, remove port mapping entirely (containers communicate via Docker network)

---

## Verification Checklist

After applying Solution A (WSL2), verify:

- [ ] Can connect to database from WSL2
  ```bash
  wsl -d Ubuntu-24.04 -- bash -c "timeout 3 bash -c 'echo > /dev/tcp/localhost/5432' && echo OK"
  ```

- [ ] Can run Prisma commands from WSL2
  ```bash
  wsl -d Ubuntu-24.04 -- bash -c "cd /mnt/f/Web_Projects/AI_HUB/apps/web && npx prisma db execute --stdin <<< 'SELECT 1;'"
  ```

- [ ] Can start Next.js dev server from WSL2
  ```bash
  wsl -d Ubuntu-24.04 -- bash -c "cd /mnt/f/Web_Projects/AI_HUB/apps/web && pnpm dev" &
  # Wait 10 seconds, then:
  curl http://localhost:3000/api/health
  ```

---

## Troubleshooting

### Issue: "pnpm not found" in WSL2

**Solution**: Install pnpm in WSL2

```bash
wsl -d Ubuntu-24.04
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Issue: "node_modules" missing errors

**Solution**: WSL2 and Windows use different node_modules

```bash
# Install dependencies in WSL2
wsl -d Ubuntu-24.04
cd /mnt/f/Web_Projects/AI_HUB/apps/web
rm -rf node_modules  # Remove Windows node_modules
pnpm install  # Install for WSL2
```

**Note**: Keep separate node_modules for Windows and WSL2, or work exclusively in one environment.

### Issue: WSL2 IP changes after restart

**Symptom**: Manual port forwarding (Solution C) stops working

**Solution**: Re-run the PowerShell script to update forwarding rule

### Issue: "Permission denied" accessing /mnt/f/

**Solution**: Check WSL2 has access to Windows drives

```bash
# In WSL2
ls -la /mnt/f/Web_Projects/AI_HUB
# Should show files, not "Permission denied"

# If permission denied, remount:
sudo umount /mnt/f
sudo mount -t drvfs F: /mnt/f
```

---

## Long-Term Recommendations

### For Solo Development (Current)
- **Use Solution A** (WSL2) for all development work
- Keep development environment entirely in WSL2
- Avoid mixing Windows and WSL2 (causes node_modules conflicts)

### For Team Development (Future)
- Document WSL2 requirement in README
- Provide setup script for WSL2 environment
- Consider using Docker Desktop alternatives (WSL2 + native Docker)

### For Production
- Remove port mappings from docker-compose.yml
- Use internal Docker networks only
- Deploy to Linux environments (avoid Windows production)

---

## Related Documentation

- `.agent/sops/port-troubleshooting.md` - Port configuration issues (different problem)
- `docker-compose.yml` - Container configuration
- `.env` - DATABASE_URL configuration

---

**Last Updated**: 2025-11-08
**Tested On**: Windows 11 + Docker Desktop 28.5.1 + WSL2 (Ubuntu 24.04)
**Status**: Verified working with Solution A (WSL2)
