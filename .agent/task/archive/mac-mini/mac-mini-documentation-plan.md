# Mac Mini Architecture Documentation Update Plan

**Created**: 2025-11-08 23:25 IST
**Purpose**: Ensure all documentation reflects Mac mini cloud architecture and Git-based communication workflow
**Why Critical**: New sessions must immediately understand services run on Mac mini, not Windows

---

## 🎯 Problem Statement

We've implemented a major architectural change:
- **Before**: Windows with WSL2 Docker (hybrid approach)
- **After**: Mac mini as complete cloud (all services in Docker on Mac mini)
- **New Workflow**: Git-based communication between Windows and Mac mini Claude Code instances

**Current Risk**: A new chat session would:
- ❌ Try to run Docker commands on Windows (will fail)
- ❌ Not know Mac mini exists or how to use it
- ❌ Not understand the Git-based communication protocol
- ❌ Waste hours troubleshooting non-existent Windows Docker issues

---

## 📋 Documentation Gaps Analysis

### Critical Files Needing Updates

#### 1. **CLAUDE.md** (Main Integration Guide)
**Current State**: References WSL2, mentions Docker generally
**Needed Updates**:
- ✅ Add "Mac Mini Cloud Architecture" section (after "Pre-Work Checklist")
- ✅ Add "Communicating with Mac Mini Claude Code" section
- ✅ Update Pre-Work Checklist (remove Docker requirements for Windows)
- ✅ Add Mac mini IP and service URLs
- ✅ Clarify: Windows = code editor only, Mac mini = runtime

#### 2. **.agent/README.md** (Agent Documentation Index)
**Current State**: No mention of Mac mini
**Needed Updates**:
- ✅ Add "Mac Mini Cloud" section in "Quick Reference"
- ✅ Link to communication protocol SOP
- ✅ Link to Mac mini setup guide

#### 3. **.agent/tech-context.md** (Technical Stack)
**Current State**: Generic "Docker" mentions
**Needed Updates**:
- ✅ Add "Runtime Environment: Mac Mini Cloud" section
- ✅ Document network architecture (Windows <-> Mac mini)
- ✅ Document all service URLs (http://192.168.1.15:3000, etc.)
- ✅ Document Docker Compose file location (docker-compose.cloud.yml)
- ✅ Clarify Windows role (code editor + browser only)

#### 4. **.agent/system-patterns.md** (Implementation Patterns)
**Current State**: No cross-machine communication patterns
**Needed Updates**:
- ✅ Add "Git-Based Cross-Machine Communication" pattern
- ✅ Add "Delegating Tasks to Mac Mini" pattern
- ✅ Add examples of when to use Mac mini vs Windows

#### 5. **.agent/active-context.md** (Current State)
**Current State**: May have outdated Docker references
**Needed Updates**:
- ✅ Document current Mac mini setup status
- ✅ Document what services are running where
- ✅ Update "Current Infrastructure" section

#### 6. **NEW: .agent/sops/mac-mini-communication-protocol.md**
**Current State**: Doesn't exist (only README-mac-mini-communication.md exists)
**Needed Creation**:
- ✅ Title: "SOP: Communicating with Mac Mini Claude Code"
- ✅ When to delegate tasks to Mac mini
- ✅ How to write instructions (template)
- ✅ How Mac mini should read and execute
- ✅ How Mac mini should report back
- ✅ Complete workflow examples

#### 7. **.claude/agents/** (Agent Definitions)
**Current State**: May have Docker assumptions
**Needed Review**:
- ✅ Check devhub-fullstack.md (any Docker commands?)
- ✅ Check devhub-testing.md (test execution location?)
- ✅ Check devhub-architect.md (architecture assumptions?)
- ✅ Update any hardcoded "localhost" references to use Mac mini IP

---

## 📝 Implementation Plan

### Phase 1: Create New SOP (Foundation)
**Order**: Do this first - it's referenced by other files

**File**: `.agent/sops/mac-mini-communication-protocol.md`

**Content Structure**:
```markdown
# SOP: Communicating with Mac Mini Claude Code

## When to Use Mac Mini

- Database operations (Prisma migrations, queries)
- Docker operations (container restart, logs, status)
- Service verification (health checks, API testing)
- Build operations (MCP server rebuild, Next.js restart)
- Mac mini-specific tasks (network config, Docker setup)

## When to Use Windows

- Code editing (all file operations)
- Git operations (commit, push, pull)
- Documentation updates
- Planning and design
- Reading codebase

## Communication Protocol

### Step 1: Windows Writes Instructions
[Template and examples]

### Step 2: Windows Commits to Git
[Git commands]

### Step 3: Mac Mini Reads Instructions
[Mac mini workflow]

### Step 4: Mac Mini Executes
[Execution guidelines]

### Step 5: Mac Mini Reports Back
[Reporting template]

### Step 6: Windows Reads Results
[Windows workflow]

## Examples
[3-5 real-world examples from our session]
```

---

### Phase 2: Update Memory Bank Files (Core Context)
**Order**: Do this second - these are read every session

#### 2A. Update `.agent/tech-context.md`

**Add New Section** (after "Dependencies"):
```markdown
## Runtime Environment: Mac Mini Cloud

### Architecture Overview

ProjectPulse uses a distributed development architecture:

**Windows Machine** (Code Editor):
- Windsurf IDE (code editing)
- Browser (accessing Mac mini services)
- Git operations
- Documentation updates
- NO Docker, NO local services

**Mac Mini** (Runtime Environment):
- IP Address: 192.168.1.15
- All services run in Docker containers
- Docker Compose file: docker-compose.cloud.yml

### Services on Mac Mini

| Service | Port | Access from Windows | Purpose |
|---------|------|---------------------|---------|
| PostgreSQL | 5432 | 192.168.1.15:5432 | Database |
| Next.js | 3000 | http://192.168.1.15:3000 | Web app |
| MCP Server | stdio | N/A (stdio only) | AI tools |

### Communication

**Code Sync**: Git push/pull
**Service Access**: HTTP over local network
**Claude Code Instances**: Git-based instruction files (.agent/task/mac-mini-instructions.md)

See: .agent/sops/mac-mini-communication-protocol.md
```

#### 2B. Update `.agent/system-patterns.md`

**Add New Section** (after existing patterns):
```markdown
## Git-Based Cross-Machine Communication

### Pattern: Delegating Tasks to Mac Mini

**When**: Need Docker, database, or service operations on Mac mini

**How**:
1. Write instructions to .agent/task/mac-mini-instructions.md
2. Commit with message: "task: [description] for Mac mini"
3. Push to feature branch
4. User tells Mac mini Claude Code: "pull git and execute instructions"
5. Mac mini pulls, reads, executes, updates file with results
6. Mac mini commits and pushes
7. Windows pulls and reads results

**Template**: See .agent/task/README-mac-mini-communication.md

**Benefits**:
- No manual copy-paste
- Versioned in Git
- Reproducible
- Asynchronous execution

**Example Use Cases**:
- "Rebuild MCP server"
- "Run database migration"
- "Get service logs"
- "Restart Docker containers"
```

#### 2C. Update `.agent/active-context.md`

**Update "Current Infrastructure" section**:
```markdown
## Current Infrastructure

**Development Architecture**: Mac Mini Cloud

**Windows Machine**:
- Role: Code editor only
- Tools: Windsurf, Browser, Git
- Services: None (all on Mac mini)

**Mac mini (192.168.1.15)**:
- Status: ✅ Running
- Docker Compose: docker-compose.cloud.yml
- Services:
  - PostgreSQL 15: ✅ Running (port 5432)
  - Next.js: ✅ Running (port 3000)
  - MCP Server: ✅ Building successfully
- Setup Guide: .agent/sops/mac-mini-cloud-architecture.md
- Communication: .agent/sops/mac-mini-communication-protocol.md

**Access URLs**:
- Web App: http://192.168.1.15:3000
- API Health: http://192.168.1.15:3000/api/health
- Database: postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev
```

---

### Phase 3: Update Main Integration Guide
**Order**: Do this third - references the SOPs and context created above

#### 3A. Update `CLAUDE.md`

**Add After "Pre-Work Checklist" section**:
```markdown
---

## 🖥️ Mac Mini Cloud Architecture

**IMPORTANT**: Services run on Mac mini (local network), NOT on Windows.

### Architecture Overview

ProjectPulse uses a distributed development setup:

```
┌─────────────────────────────────────┐
│ Windows (192.168.1.x)               │
│  - Windsurf (code editor)           │
│  - Browser → http://192.168.1.15:3000│
│  - Git push/pull                    │
│  - NO Docker, NO local services     │
└──────────────┬──────────────────────┘
               │
               │ Git + HTTP
               │
┌──────────────▼──────────────────────┐
│ Mac mini (192.168.1.15)             │
│  - Docker Compose (all services)    │
│  - PostgreSQL :5432                 │
│  - Next.js :3000                    │
│  - MCP Server (stdio)               │
└─────────────────────────────────────┘
```

### Service URLs

- **Web App**: http://192.168.1.15:3000
- **API Health**: http://192.168.1.15:3000/api/health
- **Database**: `postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev`

### When to Use Mac Mini

Use Mac mini for:
- ✅ Docker operations (restart containers, view logs)
- ✅ Database operations (migrations, queries)
- ✅ Service verification (health checks, builds)
- ✅ Mac mini-specific setup

Use Windows for:
- ✅ Code editing (all file operations)
- ✅ Git operations
- ✅ Documentation
- ✅ Planning and design

**Complete Setup Guide**: [.agent/sops/mac-mini-cloud-architecture.md](.agent/sops/mac-mini-cloud-architecture.md)

---

## 🔄 Communicating with Mac Mini Claude Code

### The Problem

Windows Claude Code and Mac mini Claude Code are separate instances. Manually copy-pasting prompts between machines is tedious.

### The Solution: Git-Based Communication

Use `.agent/task/mac-mini-instructions.md` as an instruction queue.

### Quick Workflow

**On Windows** (when you need Mac mini to do something):
1. I write instructions to `.agent/task/mac-mini-instructions.md`
2. I commit: `git commit -m "task: [description] for Mac mini"`
3. I push: `git push origin feature/sprint-1-foundation`
4. You tell Mac mini: "Pull git and execute mac-mini-instructions"

**On Mac mini** (when you say "pull git and work as instructed"):
1. Mac mini Claude Code pulls: `git pull origin feature/sprint-1-foundation`
2. Reads: `.agent/task/mac-mini-instructions.md`
3. Executes instructions step by step
4. Updates file with results
5. Commits and pushes back

**Windows pulls to see results**.

**Complete Protocol**: [.agent/sops/mac-mini-communication-protocol.md](.agent/sops/mac-mini-communication-protocol.md)
**Protocol Overview**: [.agent/task/README-mac-mini-communication.md](.agent/task/README-mac-mini-communication.md)

---
```

**Update "Pre-Work Checklist" section** (remove Docker requirement):
```markdown
## 🚨 CRITICAL: Pre-Work Checklist

**BEFORE starting ANY coding work:**

### 1. Service Verification

**Check Mac mini services are running:**
```bash
curl http://192.168.1.15:3000/api/health
# ✅ MUST return: {"status":"healthy","database":"connected"}
```

**If services down:**
- Tell user to start Mac mini Docker services
- Or use Git communication to tell Mac mini: "Start Docker services"

### 2. Port Configuration (Windows)

```bash
pnpm dev
# ✅ MUST show: "ready started server on 0.0.0.0:3000"
# (Only if running Next.js locally on Windows - not typical)
```

**Note**: Usually you won't run pnpm dev on Windows. Access Mac mini: http://192.168.1.15:3000

### 3. Git Branch
[Keep existing content]
```

---

### Phase 4: Update Documentation Indexes
**Order**: Do this fourth - ensures discoverability

#### 4A. Update `.agent/README.md`

**Add in "Quick Reference" section**:
```markdown
### Mac Mini Cloud

**Runtime Environment**: All services run on Mac mini (192.168.1.15), not Windows

**Key Documents**:
- **Setup Guide**: [sops/mac-mini-cloud-architecture.md](sops/mac-mini-cloud-architecture.md)
- **Communication Protocol**: [sops/mac-mini-communication-protocol.md](sops/mac-mini-communication-protocol.md)
- **Setup Completion Report**: [sops/mac-mini-setup-complete.md](sops/mac-mini-setup-complete.md)

**Service Access**:
- Web App: http://192.168.1.15:3000
- Database: 192.168.1.15:5432
- Docker: On Mac mini only

**Communication**: Git-based instruction files (`.agent/task/mac-mini-instructions.md`)

See: [tech-context.md](tech-context.md) for complete architecture details
```

---

### Phase 5: Review Agent Definitions
**Order**: Do this fifth - check for hardcoded assumptions

#### 5A. Check `.claude/agents/devhub-fullstack.md`

**Look for**:
- Any Docker commands (should reference Mac mini)
- "localhost" references (should use 192.168.1.15)
- Service URLs (should use Mac mini IP)

**If found**: Update with Mac mini context

#### 5B. Check `.claude/agents/devhub-testing.md`

**Look for**:
- Test execution environment assumptions
- Database connection strings
- Service URLs

**If found**: Update with Mac mini context

#### 5C. Check Other Agents

Review all `.claude/agents/*.md` files for:
- Infrastructure assumptions
- Service locations
- Docker references

---

### Phase 6: Verification
**Order**: Do this last - ensure nothing missed

#### 6A. Create Verification Checklist

**File**: `.agent/task/mac-mini-docs-verification.md`

**Content**:
```markdown
# Mac Mini Documentation Verification Checklist

## New Session Simulation

If I start a new session and read these files in order, do I understand:

- [ ] Services run on Mac mini, not Windows?
- [ ] Mac mini IP address (192.168.1.15)?
- [ ] How to access services from Windows?
- [ ] When to use Mac mini vs Windows?
- [ ] How to delegate tasks to Mac mini Claude Code?
- [ ] Where to find Mac mini setup guide?
- [ ] Where to find communication protocol?

## File-by-File Check

- [ ] CLAUDE.md mentions Mac mini architecture
- [ ] CLAUDE.md explains Git-based communication
- [ ] CLAUDE.md updated pre-work checklist (no Windows Docker)
- [ ] .agent/README.md links to Mac mini docs
- [ ] .agent/tech-context.md documents Mac mini as runtime
- [ ] .agent/system-patterns.md has communication pattern
- [ ] .agent/active-context.md shows current Mac mini status
- [ ] .agent/sops/mac-mini-communication-protocol.md exists
- [ ] .claude/agents/*.md reviewed for assumptions

## Quick Start Test

A new session should be able to:
1. Read CLAUDE.md → understand Mac mini architecture immediately
2. Find communication protocol in .agent/sops/
3. Know Mac mini IP and service URLs
4. Know when to delegate to Mac mini
5. Access web app: http://192.168.1.15:3000
```

#### 6B. Simulate New Session Read

**Mentally walk through**:
1. New session starts
2. Reads CLAUDE.md
3. Does it mention Mac mini? ✅
4. Does it explain communication? ✅
5. Does it provide service URLs? ✅
6. Are all referenced SOPs created? ✅

---

## 📊 Summary of Changes

### Files to Create (1)
1. `.agent/sops/mac-mini-communication-protocol.md` - Complete SOP for Git-based communication

### Files to Update (7)
1. `CLAUDE.md` - Add Mac mini architecture and communication sections
2. `.agent/README.md` - Add Mac mini quick reference
3. `.agent/tech-context.md` - Document Mac mini as runtime environment
4. `.agent/system-patterns.md` - Add Git communication pattern
5. `.agent/active-context.md` - Update current infrastructure section
6. `.claude/agents/*.md` - Review and update assumptions (3-5 files)
7. Create verification checklist

### Total Changes: ~8 files

---

## 🎯 Success Criteria

A new chat session should:
- ✅ Immediately know services run on Mac mini (192.168.1.15)
- ✅ Know NOT to run Docker on Windows
- ✅ Know how to communicate with Mac mini Claude Code
- ✅ Know when to delegate tasks to Mac mini
- ✅ Be able to find all Mac mini documentation easily
- ✅ Have all service URLs (web app, database, API)

---

## 📝 Implementation Order

1. ✅ Create plan (this file)
2. ⏳ Create `.agent/sops/mac-mini-communication-protocol.md` (foundation)
3. ⏳ Update `.agent/tech-context.md` (memory bank)
4. ⏳ Update `.agent/system-patterns.md` (memory bank)
5. ⏳ Update `.agent/active-context.md` (memory bank)
6. ⏳ Update `CLAUDE.md` (main guide)
7. ⏳ Update `.agent/README.md` (index)
8. ⏳ Review `.claude/agents/*.md` (check assumptions)
9. ⏳ Create verification checklist
10. ⏳ Simulate new session read-through

---

**Created**: 2025-11-08 23:25 IST
**Priority**: HIGH (blocks new sessions from understanding architecture)
**Estimated Time**: 45-60 minutes
**Token Cost**: ~15-20K tokens
