# 🚀 ProjectPulse

> **Intelligent Development Hub with AI-Powered Issue Tracking & Semantic Search**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/draco28/ProjectPulse?style=social)](https://github.com/draco28/ProjectPulse/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/draco28/ProjectPulse)](https://github.com/draco28/ProjectPulse/issues)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

**ProjectPulse** transforms how development teams manage issues, knowledge, and workflows. Built with cutting-edge AI integration, hybrid search capabilities, and seamless Claude Code MCP connectivity, ProjectPulse is the intelligent hub your team needs.

---

## ✨ Key Features

### 🎯 **Intelligent Issue Tracking**
- **Rich Issue Management** - Create, track, and organize issues with custom fields, labels, and priorities
- **Smart Comments & Discussions** - Threaded conversations with markdown support
- **File Attachments** - Screenshots, logs, and documents directly attached to issues
- **Source Code Linking** - Link issues to specific files and code locations in your project

### 🔍 **Hybrid Search Engine**
- **Full-Text Search** - Lightning-fast keyword search using PostgreSQL tsvector
- **Semantic Search** - AI-powered similarity search to find related issues by meaning
- **Hybrid Ranking** - Combines both approaches for best-in-class relevance
- **Local Embeddings** - Privacy-first with local transformers (no cloud API calls)

### 🤖 **Claude Code Integration**
- **MCP Server Built-in** - Native Model Context Protocol support
- **Direct Issue Creation** - Create issues from Claude Code conversations
- **Contextual Search** - Search knowledge base without leaving Claude Code
- **Workflow Automation** - Trigger helper scripts and actions via AI

### 📚 **Knowledge Base** (Coming Soon)
- **Wiki-style Documentation** - Hierarchical, markdown-based documentation
- **Code Patterns Library** - Searchable code snippets and best practices
- **Decision Records** - Track architectural decisions and their reasoning

### 🛡️ **Security & Privacy**
- **Local-First Architecture** - All data stored on your infrastructure
- **No Cloud Dependencies** - Embeddings generated locally via Transformers.js
- **Docker-Isolated** - Containerized deployment with network isolation
- **Secure Process Execution** - Command allowlisting with input validation

---

## 🎬 Demo

> **Note:** ProjectPulse is currently in active development. Screenshots and demo will be added as features are completed.

**Planned Demo Features:**
- Live issue creation workflow
- Hybrid search in action
- Claude Code MCP integration demo
- Knowledge base navigation

---

## 🏗️ Tech Stack

**Frontend & Backend:**
- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library

**Database & Search:**
- [PostgreSQL 16](https://www.postgresql.org/) - Primary data store
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search
- [Prisma ORM](https://www.prisma.io/) - Type-safe database client
- [Transformers.js](https://github.com/xenova/transformers.js) - Local AI embeddings

**AI Integration:**
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) - Claude Code connectivity
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Tool/resource implementation

**Development & Testing:**
- [Jest](https://jestjs.io/) - Unit & integration testing
- [Playwright](https://playwright.dev/) - End-to-end testing
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) - Code quality
- [Husky](https://typicode.github.io/husky/) - Pre-commit hooks

**Deployment:**
- [Docker Compose](https://docs.docker.com/compose/) - Multi-container orchestration
- [pnpm](https://pnpm.io/) - Fast, disk-efficient package manager

---

## 🚀 Quick Start

### Prerequisites
- [Docker](https://www.docker.com/get-started) & Docker Compose
- [Node.js](https://nodejs.org/) 20+ (for local development)
- [pnpm](https://pnpm.io/installation) 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/draco28/ProjectPulse.git
cd ProjectPulse

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Update POSTGRES_PASSWORD with a secure password

# Start services with Docker
docker-compose up -d

# Verify PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs -f
```

### Development Setup

```bash
# Install dependencies
pnpm install

# Run database migrations (after Week 1 Day 3)
pnpm prisma migrate dev

# Seed database with sample data
pnpm prisma db seed

# Start development server
pnpm dev
```

**Access the application:**
- **Web UI:** http://localhost:3000
- **Prisma Studio:** `pnpm prisma:studio`

---

## 💡 Why ProjectPulse?

### **For Solo Developers**
- 📝 Track bugs and features without complex JIRA setups
- 🔍 Find old solutions with semantic search ("how did I fix that memory leak?")
- 🤖 Create issues from Claude Code while debugging
- 📚 Build a personal knowledge base of patterns and solutions

### **For Small Teams**
- 🎯 Lightweight alternative to enterprise issue trackers
- 🔒 Privacy-first with local deployment (no data leaves your network)
- 💰 Zero SaaS costs - run on your own infrastructure
- ⚡ Fast setup with Docker Compose (minutes, not days)

### **For Game Developers**
- 🎮 Purpose-built for game development workflows
- 🔗 Link issues to Unreal Engine project files
- 📊 Track bugs by game module (Combat, UI, Networking, etc.)
- 🖼️ Attach screenshots and video clips directly to issues

---

## 📅 Roadmap

### ✅ Phase 1: Foundation (Week 1) - In Progress
- [x] Docker + PostgreSQL + pgvector setup
- [x] Git workflow & pre-commit hooks
- [ ] Next.js application bootstrap
- [ ] Prisma schema implementation

### 📝 Phase 2: Issue Tracker (Week 2)
- [ ] Issue CRUD operations (Create, Read, Update, Delete)
- [ ] Comments system
- [ ] File attachments
- [ ] Labels and custom fields
- [ ] Basic UI (issue list, detail pages)

### 🔍 Phase 3: Search (Week 3)
- [ ] Full-text search with PostgreSQL tsvector
- [ ] Semantic search with pgvector + local embeddings
- [ ] Hybrid search with weighted ranking
- [ ] Search API + UI components

### 🤖 Phase 4: MCP Integration (Week 4)
- [ ] MCP server implementation
- [ ] Issue tools (create, search, update)
- [ ] Search tools (hybrid query)
- [ ] Claude Code configuration guide

### 📚 Phase 5: Knowledge Base (Week 5-8)
- [ ] Wiki-style documentation system
- [ ] Code snippet library
- [ ] Tag-based organization
- [ ] Rich text editor (TipTap)

### 🚀 Future Enhancements
- Agent Personas (Code Reviewer, Bug Hunter, etc.)
- Semgrep security scanning integration
- Git commit linking (Fix #123)
- Milestone & sprint planning
- Time tracking & analytics
- GitHub/GitLab sync

---

## 🤝 Contributing

We welcome contributions! ProjectPulse is built in the open to help developers learn and contribute.

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring

### Development Setup
See [DEVELOPMENT.md](docs/DEVELOPMENT_PLAN.md) for detailed development guide.

---

## 📖 Documentation

- **[Architecture](docs/01-ARCHITECTURE.md)** - System design and decisions
- **[Database Schema](docs/02-DATABASE-SCHEMA.md)** - Prisma schema documentation
- **[MCP Specification](docs/03-MCP-SPECIFICATION.md)** - Model Context Protocol integration
- **[Quick Start](docs/07-QUICK-START.md)** - 30-minute setup guide
- **[Development Plan](docs/DEVELOPMENT_PLAN.md)** - Week-by-week implementation

---

## 🛠️ MCP Server Usage

ProjectPulse includes a built-in MCP server for Claude Code integration.

**Configure in Claude Desktop:**

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": ["path/to/ProjectPulse/apps/mcp-server/dist/index.js"],
      "env": {
        "API_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

**Available MCP Tools:**
- `create_issue` - Create new issues
- `search_issues` - Hybrid search across issues
- `update_issue` - Update issue status/priority
- `add_comment` - Add comments to issues

**Example Usage in Claude Code:**
```
You: "Create an issue for the bug I just found"
Claude: [Uses create_issue tool] ✅ Created issue #42: Fix memory leak in player controller
```

---

## 📊 Project Status

**Current Version:** 1.0.0-alpha
**Development Phase:** Week 1 - Foundation Setup
**Status:** 🟡 In Active Development

**Completed:**
- ✅ Docker Compose infrastructure
- ✅ PostgreSQL with pgvector extension
- ✅ Git workflow with pre-commit hooks
- ✅ Project architecture documentation

**Next Milestone:** Week 1 Day 2 - Next.js Application Bootstrap

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**draco28**
- GitHub: [@draco28](https://github.com/draco28)
- Email: praveensingh2897@gmail.com

---

## 🙏 Acknowledgments

- Built with guidance from [Claude Code](https://claude.ai/claude-code)
- Inspired by linear.app, GitHub Issues, and Notion
- Thanks to the open-source community for amazing tools

---

## ⭐ Star History

If you find ProjectPulse useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=draco28/ProjectPulse&type=Date)](https://star-history.com/#draco28/ProjectPulse&Date)

---

<div align="center">

**[Website](https://github.com/draco28/ProjectPulse)** • **[Documentation](docs/)** • **[Issues](https://github.com/draco28/ProjectPulse/issues)** • **[Discussions](https://github.com/draco28/ProjectPulse/discussions)**

Made with ❤️ by draco28

</div>
