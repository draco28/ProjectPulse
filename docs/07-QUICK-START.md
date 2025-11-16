# 07 - ProjectPulse: Quick Start Guide

**Goal:** Get ProjectPulse running in 30 minutes  
**Status:** Production Ready ✅

---
## CURRENT Quick Start – Mac mini Docker (Single Machine)

> **Current reality:** All development and runtime happen directly on the
> **Mac mini** using Docker (Next.js, PostgreSQL, MCP server). Do **not** use
> Windows Docker/WSL or separate Windows dev machines for ProjectPulse.

### Prerequisites (Mac mini)

- macOS on Mac mini (with Terminal access)
- [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- Node.js 20+ and `pnpm` installed on the Mac mini
- Git installed

### Step 1: Clone and Install

```bash
# On Mac mini
git clone <your-repo-url> AI_HUB
cd AI_HUB

# Install dependencies
pnpm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env

# Edit .env (see docs/11-Infrastructure-and-Deployment.md for full details)
# Key values:
# NEXT_PUBLIC_APP_URL="http://192.168.1.15:3000"  # Mac mini LAN IP
# DATABASE_URL="postgresql://projectpulse:...@postgres:5432/projectpulse_db"
```

### Step 3: Start Docker Services

```bash
# On Mac mini
docker compose -f docker-compose.cloud.yml up -d

# Check status
docker compose -f docker-compose.cloud.yml ps
```

### Step 4: Verify Health

```bash
# From Mac mini host
curl http://localhost:3000/api/health

# From another device on LAN (optional)
curl http://192.168.1.15:3000/api/health
```

Expected JSON:

```json
{"status":"healthy","database":"connected"}
```

### Step 5: Open ProjectPulse

- On Mac mini: open `http://localhost:3000` in a browser.
- From other devices: open `http://192.168.1.15:3000`.

> **Important:** Do **not** run `pnpm dev` by default. Assume the Docker
> containers are the primary runtime. Only start a local dev server if you
> have a very specific reason and know it will not conflict with Docker.

---

## Legacy Quick Start – Windows 11 + Docker Desktop (Archived)

> ⚠️ This section describes the **old** Windows-based workflow where Windows
> was the primary dev machine and the Mac mini was optional for LAN access.
> It is kept only for historical reference. For the current setup, use the
> Mac mini Docker quick start above.

## ✅ Prerequisites Checklist

Before starting, ensure you have:

### Required

- [ ] **Windows 11 PC** (primary development machine)
- [ ] **Docker Desktop** with WSL2 enabled
- [ ] **Node.js 20+** installed
- [ ] **pnpm** installed (`npm install -g pnpm`)
- [ ] **Git** installed
- [ ] **~10GB** free disk space
- [ ] **14 hours/week** available for development

### Optional

- [ ] **Mac Mini** (for LAN access testing)
- [ ] **Claude Code** installed
- [ ] **VS Code** or preferred IDE

---

## 🚀 30-Minute Setup

### Step 1: Install Docker Desktop (5 minutes)

```powershell
# Download Docker Desktop for Windows
# URL: https://www.docker.com/products/docker-desktop/

# During installation:
# ✅ Enable WSL2 integration
# ✅ Enable Kubernetes (optional)

# After installation, verify:
docker --version
# Should show: Docker version 24.x.x

docker-compose --version
# Should show: Docker Compose version 2.x.x

# Start Docker Desktop (should auto-start)
```

**Troubleshooting:**

```powershell
# If Docker won't start:
wsl --install
wsl --set-default-version 2
wsl --update

# Restart Docker Desktop
```

---

### Step 2: Create Project (5 minutes)

```powershell
# Navigate to your projects directory
cd F:\  # Or wherever you keep projects

# Create project directory
mkdir projectpulse
cd projectpulse

# Initialize git
git init

# Create directory structure
mkdir apps, scripts, uploads
mkdir apps\web, apps\mcp-server
```

---

### Step 3: Setup Configuration Files (5 minutes)

#### 3.1 Create Root Files

**pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
```

**package.json**

```json
{
  "name": "projectpulse",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "start": "pnpm --filter web start",
    "db:studio": "pnpm --filter web prisma studio",
    "db:migrate": "pnpm --filter web prisma migrate dev",
    "db:seed": "pnpm --filter web prisma db seed"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**.gitignore**

```
node_modules/
.env
.env.local
.next/
dist/
build/
*.log
.DS_Store
uploads/*
!uploads/.gitkeep
.pnpm-store/
```

**.env**

```env
# Database
POSTGRES_USER=projectpulse
POSTGRES_PASSWORD=projectpulse_dev_password_2025
POSTGRES_DB=projectpulse
DATABASE_URL=postgresql://projectpulse:projectpulse_dev_password_2025@postgres:5432/projectpulse

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ProjectPulse Project
PROJECTPULSE_PROJECT_ROOT=F:/Web_Projects/ProjectPulse

# Optional: OpenAI API Key (for future use)
OPENAI_API_KEY=
```

**docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: projectpulse-db
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - projectpulse-network

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: projectpulse-web
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    networks:
      - projectpulse-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  projectpulse-network:
    driver: bridge
```

---

### Step 4: Setup Next.js App (10 minutes)

```powershell
cd apps\web

# Create Next.js app
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Answer prompts:
# TypeScript: Yes
# ESLint: Yes
# Tailwind CSS: Yes
# App Router: Yes
# Turbopack: Yes (optional)
# Import alias: @/*

# Install additional dependencies
pnpm add @prisma/client swr axios lucide-react
pnpm add -D prisma tsx
```

#### 4.1 Setup Prisma

```powershell
# Initialize Prisma
pnpm prisma init

# Copy schema from 02-DATABASE-SCHEMA.md
# Paste into: prisma/schema.prisma

# Generate Prisma client
pnpm prisma generate

# Create initial migration (will fail first time - expected)
# We'll run this after Docker is up
```

#### 4.2 Create Dockerfile

**apps/web/Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build Next.js
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

---

### Step 5: Create Initial Database Script (2 minutes)

**scripts/init-db.sql**

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Database is created automatically by Docker
-- Prisma will handle table creation
```

---

### Step 6: Start Docker (3 minutes)

```powershell
# Back to project root
cd ..\..

# Start only PostgreSQL first
docker-compose up -d postgres

# Wait for PostgreSQL to be ready (watch for "healthy" status)
docker-compose ps

# Check logs
docker-compose logs postgres

# You should see: "database system is ready to accept connections"
```

**Verify PostgreSQL:**

```powershell
# Connect to PostgreSQL
docker exec -it projectpulse-db psql -U projectpulse -d projectpulse

# In psql:
\l              # List databases
\q              # Quit
```

---

### Step 7: Run Database Migration (2 minutes)

```powershell
cd apps\web

# Run Prisma migration
pnpm prisma migrate dev --name init

# Seed database with default data
pnpm prisma db seed

# (Optional) Open Prisma Studio to view data
pnpm prisma studio
# Opens: http://localhost:5555
```

---

### Step 8: Build and Start Web App (3 minutes)

```powershell
# Back to root
cd ..\..

# Build web container
docker-compose build web

# Start web app
docker-compose up -d web

# Watch logs
docker-compose logs -f web

# Wait for: "ready - started server on 0.0.0.0:3000"
```

---

### Step 9: Access DevHub (1 minute)

```powershell
# Open browser
start http://localhost:3000
```

**You should see:**

- ProjectPulse homepage
- Sidebar with navigation
- Issue list (empty or with seed data)

---

### Step 10: Create First Issue (1 minute)

1. **Click "New Issue"** in top right
2. **Fill in details:**
   - Title: "Setup complete!"
   - Description: "Successfully set up ProjectPulse"
   - Priority: Medium
   - Module: Core
   - Labels: setup
3. **Click "Create Issue"**
4. **Verify:** Issue appears in list

**Congratulations! ProjectPulse is running!**

---

## LAN Access (Mac Mini)

### Step 1: Find Windows PC IP

```powershell
# On Windows PC:
ipconfig

# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100
```

### Step 2: Configure Windows Firewall

```powershell
# Allow ports 3000 through firewall
New-NetFirewallRule -DisplayName "ProjectPulse" `
  -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Verify rule created
Get-NetFirewallRule -DisplayName "ProjectPulse"
```

### Step 3: Access from Mac Mini

```bash
# On Mac Mini, open browser:
http://192.168.1.100:3000

# Replace 192.168.1.100 with your Windows PC IP
```

**You should see the same DevHub interface!**

---

## MCP Server Setup (Optional - Week 3)

This is optional for MVP, but here's how to set it up:

### Step 1: Create MCP Server

```powershell
cd apps
mkdir mcp-server
cd mcp-server

# Initialize package
pnpm init

# Install dependencies
pnpm add @modelcontextprotocol/sdk axios
pnpm add -D typescript @types/node tsx
```

### Step 2: Configure MCP Server

**apps/mcp-server/package.json**

```json
{
  "name": "@projectpulse/mcp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**apps/mcp-server/src/index.ts**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const server = new Server(
  {
    name: 'projectpulse',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Example tool: create_issue
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'create_issue') {
    const response = await axios.post(`${API_URL}/issues`, {
      title: request.params.arguments.title,
      description: request.params.arguments.description,
      priority: request.params.arguments.priority || 'medium',
      module: request.params.arguments.module,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Created issue #${response.data.id}: ${response.data.title}`,
        },
      ],
    };
  }

  throw new Error('Unknown tool');
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('MCP server running on stdio');
```

### Step 3: Configure Claude Code

**Important:** This uses Claude Code (VS Code Extension), NOT Claude Desktop.

Edit Claude Code MCP configuration:

**Windows:** `C:\Users\<username>\.claude.json`
**Mac/Linux:** `~/.claude.json`

**Configuration Structure (project-scoped):**

```json
{
  "projects": {
    "F:\\Web_Projects\\AI_HUB": {
      "mcpServers": {
        "projectpulse": {
          "type": "stdio",
          "command": "node",
          "args": ["F:\\Web_Projects\\AI_HUB\\apps\\mcp-server\\dist\\index.js"],
          "env": {
            "DATABASE_URL": "postgresql://projectpulse:projectpulse_dev_password_2025@localhost:5432/projectpulse"
          }
        }
      }
    }
  }
}
```

**Note:** Claude Code requires:

- Project-specific configuration under `projects[path]`
- `"type": "stdio"` field
- Absolute paths (not relative)

### Step 4: Test MCP

```bash
# Start MCP server
cd apps/mcp-server
pnpm dev

# In Claude Code:
# Type: "Create an issue titled 'Test from MCP'"
# Claude should use the create_issue tool
```

---

## Troubleshooting

### Docker won't start

```powershell
# Check WSL2
wsl --status

# Update WSL2
wsl --update

# Restart Docker Desktop
# Settings → General → "Use WSL 2 based engine" (checked)
```

### Database connection failed

```powershell
# Check if PostgreSQL is running
docker ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port 3000 already in use

```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml:
ports:
  - "3001:3000"  # Use 3001 instead
```

### Prisma migration failed

```powershell
# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d postgres

# Wait for PostgreSQL to be ready, then:
pnpm prisma migrate dev --name init
```

### Can't access from Mac Mini

```powershell
# On Windows, check firewall:
Get-NetFirewallRule -DisplayName "ProjectPulse"

# If not found, create rule:
New-NetFirewallRule -DisplayName "ProjectPulse" `
  -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Verify Windows PC IP hasn't changed:
ipconfig
```

---

## Verification Checklist

After setup, verify:

### Database

- [ ] PostgreSQL running (`docker ps`)
- [ ] Can connect to database (`docker exec -it projectpulse-db psql -U projectpulse -d projectpulse`)
- [ ] Tables created (`\dt` in psql)
- [ ] Extensions enabled (`\dx` in psql)

### Web Application

- [ ] Web container running (`docker ps`)
- [ ] Accessible at `http://localhost:3000`
- [ ] Can create issues
- [ ] Can view issues
- [ ] Can add comments
- [ ] Can upload attachments

### LAN Access (if applicable)

- [ ] Accessible from Mac Mini at `http://192.168.x.x:3000`
- [ ] All features work from Mac Mini

### MCP (if set up)

- [ ] MCP server runs without errors
- [ ] Claude Code can call MCP tools
- [ ] Issues created via MCP appear in UI

---

## Next Steps

Now that DevHub is running:

1. **Read 03-Architecture.md** to continue building features
2. **Week 2:** Add issue detail page, filters, custom fields
3. **Week 3:** Implement search (full-text + semantic)
4. **Week 4:** Complete MCP integration

---

## Useful Commands

### Daily Usage

```powershell
# Start DevHub
docker-compose up -d

# Stop DevHub
docker-compose down

# Restart after code changes
docker-compose restart web

# View logs
docker-compose logs -f web

# Database backup
docker exec projectpulse-db pg_dump -U projectpulse projectpulse > backup.sql

# Database restore
docker exec -i projectpulse-db psql -U projectpulse projectpulse < backup.sql
```

### Development

```powershell
# Run Next.js in development mode (outside Docker)
cd apps\web
pnpm dev

# Watch Prisma schema changes
pnpm prisma studio

# Create new migration
pnpm prisma migrate dev --name description_of_change

# Seed database
pnpm prisma db seed
```

---

## Success!

You now have:
ProjectPulse running locally  
 PostgreSQL database with Prisma  
 Issue tracker with basic features  
 Accessible from Mac Mini (if configured)  
 Ready to continue implementation

**Time to build more features! **

---

## Getting Help

If stuck:

1. Check **troubleshooting section** above
2. Review **02-DATABASE-SCHEMA.md** for database issues
3. Review **03-Architecture.md** for architecture questions
4. Check Docker logs: `docker-compose logs`
5. Check Prisma schema: `pnpm prisma validate`

---

**Quick start complete! Let's build! **
