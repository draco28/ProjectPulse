# Standard Operating Procedures (SOPs)

This directory contains setup guides and procedures for ProjectPulse development.

---

## 🏗️ Mac Mini Setup Guides

### **Recommended: [mac-mini-cloud-architecture.md](mac-mini-cloud-architecture.md)**

**Use this if you want:**
- ✅ Complete production-like architecture
- ✅ All services in Docker (Next.js + PostgreSQL + MCP)
- ✅ Windows as code editor only (Windsurf + Git + Browser)
- ✅ Mac mini as "local Vercel + Supabase"
- ✅ Full containerization with Docker Compose

**What runs where:**
- **Windows:** Windsurf IDE, Git, Browser testing
- **Mac Mini:** Docker (Next.js container, PostgreSQL container, MCP container)

**Benefits:**
- No Windows WSL2 issues
- Production-like environment
- Easy to scale (add Redis, Nginx, workers)
- Can run Mac mini 24/7 as staging server

---

### **Alternative: [mac-mini-docker-setup.md](mac-mini-docker-setup.md)**

**Use this if you want:**
- ✅ Minimal change to current workflow
- ✅ Only move PostgreSQL to Mac mini
- ✅ Keep Next.js and MCP server running on Windows
- ✅ Quick migration (PostgreSQL only)

**What runs where:**
- **Windows:** Windsurf IDE, Git, Next.js dev server, MCP server
- **Mac Mini:** Docker (PostgreSQL container only)

**Benefits:**
- Smallest architectural change
- Still eliminates WSL2 Docker issues
- Windows still runs the application

---

## 🚨 Git & Development

### [git-workflow.md](git-workflow.md)

Git branch management and commit procedures.

---

## 🛠️ API Development

### [api-route-creation.md](api-route-creation.md)

Standard procedure for creating entity-specific API routes with validation, error handling, and response format.

### [generic-api-routes.md](generic-api-routes.md)

Pattern for creating generic API routes that serve multiple entity types through a single implementation. Use when operation is identical across entities.

### [api-route-pagination-pattern.md](api-route-pagination-pattern.md)

Implementing pagination in API routes for list endpoints.

---

## 🔧 Troubleshooting

### [port-troubleshooting.md](port-troubleshooting.md)

Fix Next.js dev server port configuration issues (3000 vs 3002).

### [ARCHIVED-windows-docker-networking.md](ARCHIVED-windows-docker-networking.md)

**ARCHIVED** - WSL2 Docker networking issues and workarounds (superseded by Mac mini cloud architecture).

---

## 📊 Comparison Matrix

| Feature | Cloud Architecture | Docker-Only Architecture | Current (Windows/WSL2) |
|---------|-------------------|-------------------------|----------------------|
| **Windows WSL2 issues** | ✅ Eliminated | ✅ Eliminated | ❌ Frequent issues |
| **Production-like** | ✅ Very similar | ⚠️ Partial | ❌ Not at all |
| **Containerization** | ✅ Everything | ⚠️ Database only | ⚠️ Database only |
| **Scalability** | ✅ Easy to add services | ⚠️ Limited | ⚠️ Limited |
| **Windows performance** | ✅ Lightweight | ⚠️ Runs Next.js | ⚠️ Runs everything |
| **Setup complexity** | ⚠️ More initial setup | ✅ Quick setup | ✅ Already done |
| **Mac mini utilization** | ✅ Full | ⚠️ Database only | ❌ Not used |
| **Can run 24/7** | ✅ Yes (staging) | ⚠️ Database only | ❌ No |
| **Future Redis/Nginx** | ✅ Easy | ⚠️ Need to move | ❌ Hard on Windows |

---

## 🎯 Recommendation

**For ProjectPulse development, we recommend:**

→ **[mac-mini-cloud-architecture.md](mac-mini-cloud-architecture.md)** (Cloud Architecture)

**Why:**
1. Eliminates all Windows/WSL2 issues permanently
2. Production-like architecture from day one
3. Easy to add future services (Redis, Nginx, workers)
4. Clean separation: Windows = code editor, Mac = runtime
5. Mac mini becomes your personal staging server
6. Better aligns with eventual cloud deployment

**Migration Path:**
- Start with [mac-mini-docker-setup.md](mac-mini-docker-setup.md) if you want quick wins
- Upgrade to [mac-mini-cloud-architecture.md](mac-mini-cloud-architecture.md) when ready for full cloud simulation

---

**Last Updated:** 2025-11-08
