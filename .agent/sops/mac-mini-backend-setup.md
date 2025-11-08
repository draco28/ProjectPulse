# Mac Mini Backend Setup Guide

**Version**: 1.0
**Last Updated**: 2025-11-08
**Purpose**: Complete guide for Claude Code on Mac mini to set up ProjectPulse backend server

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Windows Machine (Primary Development)                   │
│ - VSCode + Claude Code (code editing)                   │
│ - Git repository (F:\Web_Projects\AI_HUB)              │
│ - Push changes to Git                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Git sync
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Mac Mini (Backend Server)                               │
│ - PostgreSQL (port 5432)                                │
│ - Next.js dev server (port 3000)                        │
│ - MCP server (stdio transport)                          │
│ - Git repository clone                                  │
│ - Pull changes from Git                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Network access
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Windows Browser                                         │
│ - http://[mac-mini-ip]:3000 (Next.js app)              │
│ - Test and interact with application                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites Checklist

**On Windows Machine:**
- [ ] Git repository at `F:\Web_Projects\AI_HUB`
- [ ] All changes committed and pushed to `feature/sprint-1-foundation` branch
- [ ] Network access to Mac mini (same LAN)

**On Mac Mini:**
- [ ] macOS with Terminal access
- [ ] Claude Code installed and configured
- [ ] Network connectivity (Ethernet or WiFi)
- [ ] Homebrew installed (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`)

---

## 🚀 Phase 1: Initial Setup on Mac Mini

### Step 1.1: Install Required Tools

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Install development tools for ProjectPulse backend

Install the following tools in order:

1. Node.js 20.x (via nvm for version management):
   - Install nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   - Reload shell: source ~/.zshrc (or ~/.bash_profile)
   - Install Node: nvm install 20
   - Verify: node --version (should show v20.x.x)

2. pnpm (package manager):
   - Install: npm install -g pnpm
   - Verify: pnpm --version

3. PostgreSQL 15+ (via Homebrew):
   - Install: brew install postgresql@15
   - Start service: brew services start postgresql@15
   - Verify: psql --version

4. Git (should be pre-installed, but verify):
   - Verify: git --version
   - Configure if needed:
     git config --global user.name "Your Name"
     git config --global user.email "your.email@example.com"

Confirm each installation by showing version numbers.
```

**Expected Result:**
- Node.js v20.x.x installed
- pnpm 8.x+ installed
- PostgreSQL 15+ installed and running
- Git configured

---

### Step 1.2: Clone Repository

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Clone ProjectPulse repository

1. Choose a directory (e.g., ~/projects):
   mkdir -p ~/projects
   cd ~/projects

2. Clone the repository:
   git clone [YOUR_GIT_REMOTE_URL] AI_HUB
   cd AI_HUB

3. Checkout the feature branch:
   git checkout feature/sprint-1-foundation

4. Verify the clone:
   ls -la
   # Should see: apps/, docs/, .agent/, package.json, etc.

5. Show current branch and last commit:
   git branch
   git log -1

Confirm the repository is cloned and on the correct branch.
```

**Expected Result:**
- Repository cloned to `~/projects/AI_HUB`
- On `feature/sprint-1-foundation` branch
- All files present and matching Windows repository

---

## 🗄️ Phase 2: Database Setup

### Step 2.1: Initialize PostgreSQL

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Set up PostgreSQL database for ProjectPulse

CONTEXT:
- Database name: projectpulse_dev
- Prisma schema: apps/web/prisma/schema.prisma
- Migration history: apps/web/prisma/migrations/

STEPS:

1. Create the database:
   psql postgres -c "CREATE DATABASE projectpulse_dev;"

2. Verify database created:
   psql postgres -c "\l" | grep projectpulse_dev

3. Set DATABASE_URL environment variable:
   export DATABASE_URL="postgresql://[YOUR_MAC_USERNAME]@localhost:5432/projectpulse_dev"
   # Replace [YOUR_MAC_USERNAME] with output of: whoami

4. Navigate to web app:
   cd ~/projects/AI_HUB/apps/web

5. Run Prisma migrations:
   pnpm prisma migrate deploy

6. Verify migrations:
   pnpm prisma migrate status

7. Optional - Seed database (if seed script exists):
   pnpm prisma db seed

8. Verify tables created:
   psql projectpulse_dev -c "\dt"
   # Should show: Phase, Week, Day, Task, Session tables

Confirm database is set up and all migrations applied successfully.
```

**Expected Result:**
- `projectpulse_dev` database created
- All Prisma migrations applied (10+ migrations)
- Tables created: Phase, Week, Day, Task, Session
- Database ready for Next.js app

---

### Step 2.2: Create Environment File

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Create .env.local file for Next.js app

CONTEXT:
- File location: apps/web/.env.local
- Reference: apps/web/.env.example (if exists)

STEPS:

1. Navigate to web app:
   cd ~/projects/AI_HUB/apps/web

2. Get your Mac username:
   whoami
   # Save this output - you'll need it for DATABASE_URL

3. Find your Mac mini's local IP address:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Save the IP (usually starts with 192.168.x.x or 10.0.x.x)

4. Create .env.local file with this content:
   ```
   # Database
   DATABASE_URL="postgresql://[YOUR_MAC_USERNAME]@localhost:5432/projectpulse_dev"

   # Next.js
   NEXT_PUBLIC_API_URL="http://0.0.0.0:3000"
   NODE_ENV="development"

   # MCP Server (for future integration)
   PROJECTPULSE_API_URL="http://localhost:3000"
   ```

5. Replace [YOUR_MAC_USERNAME] with the output from step 2

6. Verify file created:
   cat .env.local

7. Test database connection:
   pnpm prisma db pull
   # Should succeed without errors

Confirm .env.local is created and database connection works.
```

**Expected Result:**
- `.env.local` file created with correct DATABASE_URL
- Prisma can connect to database
- Environment variables set for development

---

## 📦 Phase 3: Install Dependencies

### Step 3.1: Install Project Dependencies

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Install all project dependencies

CONTEXT:
- Monorepo with pnpm workspaces
- Root package.json + workspace packages (apps/web, apps/mcp-server)

STEPS:

1. Navigate to project root:
   cd ~/projects/AI_HUB

2. Install all dependencies (this may take 5-10 minutes):
   pnpm install

3. Verify installations:
   ls -la node_modules | head -20
   ls -la apps/web/node_modules | head -20
   ls -la apps/mcp-server/node_modules | head -20

4. Check for any installation errors:
   # If errors occurred, show the full output

5. Verify Next.js and Prisma CLIs:
   cd apps/web
   pnpm next --version
   pnpm prisma --version

Confirm all dependencies installed successfully without errors.
```

**Expected Result:**
- All dependencies installed (900+ packages)
- No ENOENT or permission errors
- Next.js and Prisma CLIs working

---

## 🌐 Phase 4: Start Next.js Development Server

### Step 4.1: Build and Start Next.js

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Start Next.js development server

CONTEXT:
- Next.js 14 App Router application
- Must bind to 0.0.0.0 (not localhost) for network access
- Port 3000

STEPS:

1. Navigate to web app:
   cd ~/projects/AI_HUB/apps/web

2. Build the application first (to catch any TypeScript errors):
   pnpm build

3. If build succeeds, start development server:
   pnpm dev

4. Verify server started:
   # Look for output: "ready started server on 0.0.0.0:3000"
   # NOT "ready started server on 0.0.0.0:3002" (wrong port!)

5. Test health endpoint locally:
   curl http://localhost:3000/api/health

6. Find Mac mini IP address:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Note the IP (e.g., 192.168.1.100)

7. Show me the IP so I can test from Windows:
   echo "Next.js running at: http://[YOUR_MAC_IP]:3000"

IMPORTANT: Keep this terminal open - the dev server must keep running!

Confirm dev server is running on port 3000 and show the Mac IP address.
```

**Expected Result:**
- Next.js dev server running on `0.0.0.0:3000`
- Health endpoint responds: `{"status":"ok","timestamp":"..."}`
- Mac mini IP address noted (e.g., `192.168.1.100`)
- Server accessible from Windows browser at `http://[mac-ip]:3000`

---

### Step 4.2: Test from Windows

**Do this on Windows machine:**

1. Open browser
2. Navigate to `http://[mac-mini-ip]:3000`
3. Should see ProjectPulse application load
4. Test health endpoint: `http://[mac-mini-ip]:3000/api/health`

**If connection fails:**
- Check Mac firewall: System Preferences → Security & Privacy → Firewall
- Ensure port 3000 is allowed
- Verify both machines are on same network

---

## 🔧 Phase 5: Build MCP Server

### Step 5.1: Build MCP Server TypeScript

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Build MCP server for ProjectPulse

CONTEXT:
- MCP server location: apps/mcp-server
- TypeScript project that compiles to dist/
- Provides tools for Claude Code to interact with Next.js API

STEPS:

1. Navigate to MCP server:
   cd ~/projects/AI_HUB/apps/mcp-server

2. Install dependencies (if not done):
   pnpm install

3. Build the TypeScript:
   pnpm build

4. Check for TypeScript errors:
   # If errors occur, show the full output
   # Expected: 0 errors, successful compilation

5. Verify dist/ directory created:
   ls -la dist/
   # Should see: index.js, index.d.ts, tools/ directory

6. Test the compiled server:
   node dist/index.js --help

Confirm MCP server builds successfully with 0 TypeScript errors.
```

**Expected Result:**
- TypeScript compilation succeeds
- `dist/` directory created with compiled JavaScript
- No type errors
- MCP server ready to use

---

## 🔗 Phase 6: Configure MCP Server for Claude Code

### Step 6.1: Register MCP Server in Claude Code

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Configure MCP server in Claude Code settings

CONTEXT:
- MCP servers are configured in Claude Code settings
- ProjectPulse MCP server uses stdio transport
- Must set PROJECTPULSE_API_URL environment variable

STEPS:

1. Find the Claude Code MCP configuration file:
   # Location varies by Claude Code installation
   # Common locations:
   # - ~/.config/claude-code/mcp.json
   # - ~/Library/Application Support/Claude/mcp.json

2. Add ProjectPulse MCP server configuration:
   ```json
   {
     "mcpServers": {
       "projectpulse": {
         "command": "node",
         "args": ["/Users/[YOUR_USERNAME]/projects/AI_HUB/apps/mcp-server/dist/index.js"],
         "env": {
           "PROJECTPULSE_API_URL": "http://localhost:3000"
         }
       }
     }
   }
   ```

3. Replace [YOUR_USERNAME] with output of: whoami

4. Restart Claude Code to load the new MCP server

5. Verify MCP server loaded:
   # In Claude Code, check MCP tools are available
   # Should see tools like:
   # - projectpulse.health.check
   # - projectpulse.sprint.phase.create
   # - projectpulse.sprint.getCurrentTask
   # - projectpulse.sprint.updateProgress
   # - projectpulse.sprint.task.create
   # - projectpulse.sprint.session.create

Confirm MCP server is registered and tools are available in Claude Code.
```

**Expected Result:**
- MCP server configured in Claude Code
- All 6 ProjectPulse tools available
- Can invoke tools from Claude Code on Mac mini

---

## ✅ Phase 7: Verification & Testing

### Step 7.1: End-to-End Verification

**Copy this into Mac mini Claude Code session:**

```markdown
TASK: Verify complete Mac mini backend setup

Run these verification checks:

1. **PostgreSQL Status:**
   psql projectpulse_dev -c "SELECT COUNT(*) FROM \"Phase\";"
   # Should return count (0 or more)

2. **Next.js Server:**
   curl http://localhost:3000/api/health
   # Should return: {"status":"ok",...}

3. **MCP Server Build:**
   ls -la ~/projects/AI_HUB/apps/mcp-server/dist/index.js
   # Should exist

4. **MCP Tools Available:**
   # List available MCP tools in Claude Code
   # Should show 6 ProjectPulse tools

5. **Network Access from Windows:**
   # Get Mac IP: ifconfig | grep "inet " | grep -v 127.0.0.1
   # Test from Windows browser: http://[mac-ip]:3000

6. **Create Test Phase (End-to-End Test):**
   # Use MCP tool to create a phase:
   Use projectpulse.sprint.phase.create with:
   - title: "Test Phase"
   - startDate: "2025-01-01T00:00:00Z"
   - endDate: "2025-01-08T00:00:00Z"

   # Should return success with phase ID and generated weeks

Show results of all 6 checks. If any fail, troubleshoot and fix.
```

**Expected Result:**
- ✅ PostgreSQL running and accessible
- ✅ Next.js server running on 0.0.0.0:3000
- ✅ MCP server built successfully
- ✅ All 6 MCP tools available
- ✅ Accessible from Windows browser
- ✅ Can create test phase via MCP tool

---

## 🔄 Phase 8: Development Workflow

### Daily Development Workflow

**On Windows (Primary Development):**

1. Edit code in VSCode
2. Commit changes to git
3. Push to remote repository:
   ```bash
   git add .
   git commit -m "feat: implemented feature X"
   git push origin feature/sprint-1-foundation
   ```

**On Mac Mini (Backend Server):**

```markdown
TASK: Pull latest changes and restart server

1. Navigate to project:
   cd ~/projects/AI_HUB

2. Pull latest changes:
   git pull origin feature/sprint-1-foundation

3. Install any new dependencies:
   pnpm install

4. Run database migrations (if any new ones):
   cd apps/web
   pnpm prisma migrate deploy

5. Rebuild MCP server (if MCP tools changed):
   cd ../mcp-server
   pnpm build

6. Restart Next.js dev server:
   cd ../web
   # Stop existing server (Ctrl+C in terminal)
   pnpm dev

Confirm changes pulled and server restarted successfully.
```

---

## 🐛 Troubleshooting

### Issue: Next.js server not accessible from Windows

**Solution:**
1. Check Mac firewall settings:
   - System Preferences → Security & Privacy → Firewall
   - Allow incoming connections for Node.js
2. Verify server bound to 0.0.0.0:
   ```bash
   lsof -i :3000
   # Should show 0.0.0.0:3000, not 127.0.0.1:3000
   ```
3. Check if both machines are on same network

---

### Issue: MCP tools not showing in Claude Code

**Solution:**
1. Verify MCP server built successfully:
   ```bash
   ls -la ~/projects/AI_HUB/apps/mcp-server/dist/index.js
   ```
2. Check Claude Code MCP configuration:
   - Ensure absolute path to index.js is correct
   - Ensure PROJECTPULSE_API_URL is set
3. Restart Claude Code completely
4. Check Claude Code logs for MCP server errors

---

### Issue: TypeScript compilation errors in MCP server

**Solution:**
1. Clean build artifacts:
   ```bash
   cd ~/projects/AI_HUB/apps/mcp-server
   rm -rf dist/ .tsbuildinfo
   ```
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   pnpm install
   ```
3. Rebuild:
   ```bash
   pnpm build
   ```
4. If errors persist, check tsconfig.json for correct module resolution

---

### Issue: Database connection errors

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   brew services list | grep postgresql
   ```
2. Check DATABASE_URL in .env.local:
   ```bash
   cd ~/projects/AI_HUB/apps/web
   cat .env.local | grep DATABASE_URL
   ```
3. Test connection:
   ```bash
   psql projectpulse_dev -c "SELECT 1;"
   ```
4. Verify username in DATABASE_URL matches `whoami`

---

## 📝 Quick Reference Commands

### Start Everything (After Initial Setup)

```bash
# Terminal 1: Start Next.js
cd ~/projects/AI_HUB/apps/web
pnpm dev

# Terminal 2: Watch logs (optional)
cd ~/projects/AI_HUB/apps/web
tail -f .next/trace

# Terminal 3: Monitor database (optional)
psql projectpulse_dev
```

### Pull Latest Changes

```bash
cd ~/projects/AI_HUB
git pull origin feature/sprint-1-foundation
pnpm install
cd apps/web && pnpm prisma migrate deploy
cd ../mcp-server && pnpm build
cd ../web && pnpm dev
```

### Rebuild MCP Server

```bash
cd ~/projects/AI_HUB/apps/mcp-server
pnpm build
# Then restart Claude Code
```

---

## 🎯 Success Criteria

You'll know the setup is complete when:

- ✅ PostgreSQL running with `projectpulse_dev` database
- ✅ Next.js dev server running on `http://0.0.0.0:3000`
- ✅ Windows browser can access `http://[mac-ip]:3000`
- ✅ MCP server built with 0 TypeScript errors
- ✅ All 6 MCP tools available in Mac mini Claude Code
- ✅ Can create test phase via MCP tool and see it in database
- ✅ Health endpoint returns 200 OK from Windows

---

## 📚 Additional Resources

- **ProjectPulse Documentation:** `~/projects/AI_HUB/docs/README.md`
- **Architecture Guide:** `~/projects/AI_HUB/docs/03-Architecture.md`
- **API Spec:** `~/projects/AI_HUB/docs/06-API/openapi.yaml`
- **Database Schema:** `~/projects/AI_HUB/.agent/system/database-schema.md`
- **MCP Tools Guide:** `~/projects/AI_HUB/.agent/system/mcp-tools-guide.md`

---

**Last Updated:** 2025-11-08
**Maintained By:** Claude Code (Mac Mini) + User
