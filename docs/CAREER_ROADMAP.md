# Career Transition Roadmap: TCS L3 → Product Engineer

**Your Profile:** L3 Developer at TCS (DataPower/IBM App Connect) → Building AI-Agent-First SaaS
**Goal:** Land Product Engineer/AI Engineer role at 20-35 LPA (2-3x current)
**Timeline:** 8 weeks to job offers
**Status:** Week 0 - ProjectPulse 62% complete (315/505 story points)

---

## Phase 1: System Design Mastery (Weeks 1-2) 🎯

### Week 1: Learn the Vocabulary (10 hours)

**Day 1-2: Core Concepts (4 hours)**

- [ ] **Read:** Grokking System Design Interview (Chapters 1-5)
  - Scalability (horizontal vs vertical)
  - Load balancing (NGINX, round-robin, consistent hashing)
  - Caching layers (CDN, application cache, database cache)
  - Database sharding (consistent hashing, range-based)
  - Replication (leader-follower, multi-leader, leaderless)

**Mapping Exercise:**
```
Your ProjectPulse Decision → System Design Concept
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PostgreSQL single instance → Vertical scaling (can add read replicas)
✅ LRU skills cache → Application-level caching with eviction policy
✅ Multi-tenant per-project → Data partitioning by tenant
✅ HTTP JSON-RPC + SSE → API protocol selection (REST alternative)
✅ P95 <500ms targets → Performance SLOs (Service Level Objectives)
```

**Action Items:**
- [ ] Create `system-design-notes.md` document
- [ ] For each concept, write: Definition + ProjectPulse example + When to use
- [ ] Quiz yourself: "Why did I choose PostgreSQL over MongoDB?" (write answer)

---

**Day 3-4: Advanced Patterns (4 hours)**

- [ ] **Read:** CAP Theorem, Consistency Models
  - CAP theorem: Consistency, Availability, Partition tolerance
  - ACID vs BASE
  - Eventual consistency
  - Strong consistency

- [ ] **Read:** API Design Patterns
  - REST vs GraphQL vs gRPC
  - Rate limiting (token bucket, leaky bucket, fixed window)
  - API Gateway pattern
  - Backend for Frontend (BFF)

- [ ] **Read:** Message Queues & Async Processing
  - RabbitMQ vs Kafka vs SQS
  - When to use queues vs HTTP
  - Event-driven architecture

**Mapping Exercise:**
```
ProjectPulse Decision → Advanced Concept
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PostgreSQL ACID → Chose Consistency + Partition tolerance (CP in CAP)
✅ Progress roll-up in transaction → ACID transactions for atomicity
✅ MCP server at /api/mcp → API Gateway pattern (routes to 41 tools)
✅ Real-time updates <500ms → Strong consistency requirement

🔄 What you COULD add:
→ Rate limiting for MCP API (token bucket per project)
→ Message queue for async progress rollup (at scale)
→ Event-driven updates (publish progress events)
```

**Action Items:**
- [ ] Add to notes: "When would I use message queue vs HTTP in ProjectPulse?"
- [ ] Design on paper: "Add rate limiting to MCP server" (token bucket algorithm)
- [ ] Write: "How would I scale ProjectPulse to 10M users?" (1-page answer)

---

**Day 5: Video Deep Dive (2 hours)**

- [ ] **Watch:** Gaurav Sen System Design Playlist
  - "Database Sharding" (15 min)
  - "Load Balancing" (15 min)
  - "Caching" (12 min)
  - "Distributed Systems" (20 min)

- [ ] **Watch:** System Design Interview Channel
  - "Design Instagram" (30 min)
  - "Design URL Shortener" (25 min)

**Action Items:**
- [ ] While watching, pause and ask: "How does this apply to ProjectPulse?"
- [ ] For Instagram design: "What parts are similar to my knowledge graph?"
- [ ] For URL Shortener: "How is this like my wiki slug generation?"

---

### Week 2: Map ProjectPulse to Interview Questions (8 hours)

**Day 1-2: Core System Design Questions (4 hours)**

**Write detailed answers (500-800 words each):**

**Q1: "Walk me through your ProjectPulse architecture."**

Template:
```markdown
# ProjectPulse System Architecture

## Requirements
- Functional: [List 5 key features]
- Non-functional: [Latency, consistency, scale]
- Constraints: Solo developer, $0 budget, local-first

## High-Level Design
[Draw diagram: Browser/AI Agent → Next.js/MCP → PostgreSQL]

## Component Deep Dive
1. Frontend: Next.js 14 App Router
   - Why: Server Components for SEO + performance
   - Trade-off: Client Components for interactivity
   
2. MCP Server: HTTP JSON-RPC + SSE
   - Why: Network-based (not stdio) for multi-client
   - Trade-off: More complex than stdio, but scalable

3. Database: PostgreSQL with pgvector + tsvector
   - Why: ACID + vector search + full-text in one DB
   - Trade-off: vs separate vector DB (Pinecone) + search (Elasticsearch)

## Scaling to 10M Users
- Shard database by projectId
- Add Redis cluster for caching
- NGINX load balancer for MCP servers
- CloudFlare CDN for static assets

## Results
- 62% MVP complete, 315/505 story points
- <200ms P95 latency for queries
- 92% token efficiency improvement
```

**Action:** Write this out, practice presenting in 5 minutes

---

**Q2: "How did you implement your hybrid search algorithm?"**

Template:
```markdown
# Hybrid Search Design

## Problem Statement
Need to balance precision (semantic search) with recall (keyword search)
for knowledge graph queries.

## Requirements
- Performance: <200ms P95 latency
- Token efficiency: <1,500 tokens per query
- Relevance: Better than semantic-only or keyword-only

## Solution Design

### Step 1: Semantic Search (pgvector)
```sql
SELECT id, content, 
       1 - (embedding <=> query_embedding) AS semantic_score
FROM knowledge_items
ORDER BY embedding <=> query_embedding
LIMIT 10
```

### Step 2: Full-Text Search (tsvector)
```sql
SELECT id, content,
       ts_rank_cd(search_vector, to_tsquery('query')) AS fulltext_score
FROM knowledge_items
WHERE search_vector @@ to_tsquery('query')
LIMIT 10
```

### Step 3: Hybrid Ranking
```
final_score = 0.7 × semantic_score + 0.3 × fulltext_score
```

### Why 0.7/0.3 weights?
- Tested with sample queries: technical terms need semantic (0.7)
- But exact keyword matches still important (0.3)
- Configurable via API parameter

## Trade-offs Considered
- Pure semantic: Misses exact keyword matches
- Pure fulltext: Misses synonyms and concepts
- Hybrid: Best of both, slight latency increase (acceptable)

## Results
- P95 latency: 45-122ms (target: <200ms) ✅
- Token reduction: 88% vs full graph traversal
- User testing: 95% relevant results in top 5

## Alternative Approaches
- Elasticsearch: More features but heavier infrastructure
- Pinecone: Dedicated vector DB but additional service
- Chose PostgreSQL: Single DB for simplicity
```

**Action:** Write this, practice whiteboard explanation

---

**Q3: "Explain your caching strategy for the skills system."**

Template:
```markdown
# Skills Caching Strategy - LRU with TTL

## Problem
Loading full framework docs (Next.js, Prisma) consumes 2,500 tokens per skill.
Need 92% reduction to meet 200K token session limit.

## Solution: Lazy Loading + LRU Cache

### Data Model
```typescript
interface Skill {
  id: string;
  frontmatter: {    // YAML metadata: 70 tokens
    name: string;
    keywords: string[];
    framework: string;
  };
  content: string;  // Markdown: 180 tokens (loaded on demand)
}
```

### Caching Layer
```typescript
class LRUCache<K, V> {
  capacity = 100;           // Max entries
  ttl = 5 * 60 * 1000;     // 5-minute TTL
  
  get(key: K): V | undefined {
    // Check expiration, update access time
  }
  
  set(key: K, value: V): void {
    // Evict least recently used if at capacity
  }
}
```

## Why LRU?
- Access patterns: 80/20 rule (20% skills used 80% of time)
- Memory bound: 100 skills × 0.25KB = 25KB (acceptable)
- Simple to implement vs LFU (least frequently used)

## Why 5-minute TTL?
- Skills don't change during session (static content)
- Auto-eviction prevents stale cache
- Trade-off: Longer TTL = more memory, shorter = more DB hits

## Performance Results
```
Operation          | Before Cache | After Cache | Improvement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Load frontmatter   | 70 tokens    | 70 tokens   | 0% (always load)
Load full skill    | 2,500 tokens | 220 tokens  | 91.2% reduction
Cache hit          | N/A          | <5ms        | N/A
Cache miss         | N/A          | ~100ms      | Acceptable
```

## Alternatives Considered
- Redis: Overkill for MVP, adds infrastructure
- No cache: Every load is 2,500 tokens (unacceptable)
- Infinite cache: Memory leak risk
- LFU cache: More complex, marginal benefit

## Scaling Strategy
- Current: In-memory LRU per server instance
- Scale: Migrate to Redis cluster (distributed cache)
- Monitoring: Track hit rate (target >90%)
```

**Action:** Write this, explain on whiteboard with diagrams

---

**Day 3-4: Practice Classic Interview Questions (4 hours)**

**Pick 3 questions, answer using ProjectPulse patterns:**

**Q1: Design a URL Shortener**

Your answer framework:
```markdown
# URL Shortener Design (Inspired by ProjectPulse)

## 1. Requirements Clarification
Functional:
- Shorten URL: POST /shorten → {shortCode}
- Redirect: GET /{shortCode} → 301 redirect
- Custom aliases (optional)
- Analytics (optional)

Non-functional:
- Scale: 100M URLs
- Latency: <10ms P95 for redirects
- Availability: 99.9%
- Read:Write ratio: 100:1 (like my knowledge queries)

## 2. Capacity Estimation
Storage:
- 100M URLs × 500 bytes = 50GB (single PostgreSQL, like mine)
- Growth: 1M/month = 12M/year (manageable)

Traffic:
- Writes: 10 QPS (manageable)
- Reads: 1,000 QPS (need caching, like my skills LRU)

## 3. High-Level Design
```
Client → API Gateway → App Server → Cache (Redis) → Database (PostgreSQL)
                                     ↓ (if miss)
                                   Database
```

Similar to my ProjectPulse:
- API Gateway: Like my /api/mcp endpoint
- Cache: Like my LRU skills cache (but Redis for distributed)
- Database: PostgreSQL (same as mine)

## 4. Database Schema
```sql
CREATE TABLE urls (
  id BIGSERIAL PRIMARY KEY,
  short_code VARCHAR(7) UNIQUE NOT NULL,  -- Like my wiki slugs
  long_url TEXT NOT NULL,
  user_id INT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  INDEX idx_short_code (short_code),      -- Like my knowledge indexes
  INDEX idx_user_id (user_id)
);
```

## 5. Short Code Generation
Algorithm: Base62 encoding (like my UUID generation for sessions)
```
ID: 12345678
→ Base62: "dBvyz" (7 characters = 62^7 = 3.5 trillion combinations)
```

Why Base62 vs Base64?
- URL-safe: No special characters (like my slug generation)
- Case-sensitive: More combinations

## 6. Caching Strategy
```typescript
// Inspired by my LRU skills cache
const cache = new LRUCache({
  max: 10000,         // Hot URLs
  ttl: 24 * 60 * 60,  // 24-hour TTL (vs my 5-min for skills)
});

// On redirect request
const longUrl = cache.get(shortCode) || await db.query(shortCode);
if (!cache.has(shortCode)) cache.set(shortCode, longUrl);
```

Why 24-hour TTL?
- URLs rarely change (static content)
- Trade-off: Longer TTL vs freshness (acceptable for this use case)

## 7. Rate Limiting
```typescript
// Token bucket (I need this for my MCP API too!)
const rateLimiter = {
  capacity: 100,      // 100 requests
  refillRate: 10,     // per second
  tokens: 100,
};
```

## 8. Scaling to 1B URLs
Current (100M): Single PostgreSQL + Redis
→ Database sharding by short_code range (like I'd shard by projectId)
→ Read replicas for redirects (100:1 read:write ratio)
→ Consistent hashing for cache distribution

## 9. Trade-offs
PostgreSQL vs DynamoDB:
- Chose PostgreSQL: ACID, familiar (like my choice)
- DynamoDB advantage: Auto-scaling, lower latency
- For 1B scale: Consider DynamoDB

Base62 vs Hash:
- Chose Base62: Sequential, predictable
- Hash advantage: No collision handling needed

## 10. Monitoring
- Latency: P95, P99 (like my targets)
- Cache hit rate: Target >95%
- Error rate: <0.1%
```

**Action:** Write full answer, practice whiteboard presentation (30 min)

---

**Q2: Design Instagram (Feed + Storage)**

Focus on parts similar to your project:
```markdown
# Instagram Design (Leveraging ProjectPulse Patterns)

## Part 1: Image Storage (Similar to my wiki attachments)

My approach in ProjectPulse:
- Store file metadata in PostgreSQL (path, size, type)
- Actual files in filesystem or S3

For Instagram:
- Metadata in PostgreSQL (like my Issue.attachments)
- Images in S3/CloudFlare R2
- CDN (CloudFlare) for delivery

## Part 2: Feed Generation (Similar to my knowledge graph)

My hybrid search:
- Semantic search: Find relevant content
- Ranking algorithm: 0.7 semantic + 0.3 fulltext

For Instagram feed:
- Query: Get posts from followees (like my Task.issues relationship)
- Ranking: Machine learning model (vs my simple weighted sum)
- Caching: Pre-generate feed (like my LRU cache)

## Part 3: Real-time Updates (Similar to my SSE streams)

My ProjectPulse:
- SSE for progress updates to MCP clients

For Instagram:
- WebSocket for likes/comments notifications
- Same pattern: Server → Client push
```

**Action:** Write 2-page answer using ProjectPulse analogies

---

**Q3: Design Rate Limiter**

```markdown
# Rate Limiter Design (Needed for My MCP API!)

## Problem
Protect my MCP server from abuse:
- Scenario: Malicious agent calls knowledge.search 1000x/sec
- Impact: Database overload, legitimate agents blocked

## Solution: Token Bucket Algorithm

```typescript
interface RateLimiter {
  projectId: string;
  capacity: number;      // 100 tokens
  tokens: number;        // Current available
  refillRate: number;    // 10 tokens/sec
  lastRefill: Date;
}

function allowRequest(projectId: string): boolean {
  const limiter = getLimiter(projectId);
  
  // Refill tokens based on time elapsed
  const now = Date.now();
  const elapsed = (now - limiter.lastRefill.getTime()) / 1000;
  const tokensToAdd = elapsed * limiter.refillRate;
  limiter.tokens = Math.min(limiter.capacity, limiter.tokens + tokensToAdd);
  limiter.lastRefill = new Date(now);
  
  // Check if request allowed
  if (limiter.tokens >= 1) {
    limiter.tokens -= 1;
    return true;
  }
  
  return false;  // Rate limit exceeded
}
```

## Where to Store?
- Current (MVP): In-memory Map (single server)
- Scale: Redis (distributed, like cache)

## Why Token Bucket vs Fixed Window?
Token bucket:
- Smooth traffic (no spike at window boundary)
- Burst handling (accumulate tokens)

Fixed window:
- Simpler but allows double traffic at boundaries

## Integration with ProjectPulse
```typescript
// In my MCP server
export async function POST(request: Request) {
  const projectId = getProjectId(request);
  
  if (!allowRequest(projectId)) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // Process request...
}
```

## Limits for My System
- Per project: 100 requests/minute
- Per tool: knowledge.search (10/min), skill.load (20/min)
- Burst: Allow 10x for 5 seconds (emergency)
```

**Action:** Implement basic rate limiter in ProjectPulse (2 hours)

---

## Phase 2: Portfolio & Resume (Week 3) 📝

### Day 1-2: GitHub Repository Polish (6 hours)

**Checklist:**

- [ ] **README.md Enhancement**
  ```markdown
  # ProjectPulse - AI-Agent-First Project Management SaaS
  
  > 🚀 A revolutionary SaaS platform where AI agents are primary users (95% interaction)
  
  ## 🎯 Key Innovation
  - **Agent-First Architecture**: 41 MCP tools for AI agents via HTTP JSON-RPC
  - **92% Token Efficiency**: Lazy-loading skills system (220 tokens vs 2,500)
  - **Hybrid Search**: Semantic + full-text (88% reduction vs full graph)
  - **Real-Time Sync**: UI/MCP consistency <500ms
  
  ## 🏗️ Architecture Highlights
  [Add C4 diagram from docs/03-Architecture.md]
  
  - Database as Source of Truth (PostgreSQL)
  - HTTP MCP Server (JSON-RPC + SSE)
  - Hybrid Search (pgvector + tsvector)
  - LRU Caching (5-min TTL, 100 entries)
  
  ## 📊 Technical Metrics
  - Lines of Code: ~15,000 (TypeScript)
  - Story Points: 315/505 (62% complete)
  - API Latency: P95 <500ms
  - Test Coverage: 80%+ (business logic)
  
  ## 🛠️ Tech Stack
  **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
  **Backend:** Node.js, Prisma ORM, PostgreSQL 15
  **AI Integration:** MCP Protocol, pgvector, Ollama embeddings
  **Infrastructure:** Docker, Vercel (planned)
  
  ## 🎥 Demo
  [Coming Soon - Deploy to Vercel in Sprint 8]
  
  ## 📚 Documentation
  - [Architecture](docs/03-Architecture.md) - System design decisions
  - [MCP API](docs/MCP_API_REFERENCE.md) - 41 tools specification
  - [Database Schema](docs/04-Data-and-Model-Spec.md) - 10 Prisma models
  
  ## 🚀 Quick Start
  \```bash
  # Clone repo
  git clone https://github.com/yourusername/AI_HUB.git
  
  # Install dependencies
  pnpm install
  
  # Start PostgreSQL
  docker-compose up -d
  
  # Run migrations
  pnpm prisma migrate dev
  
  # Start development server
  pnpm dev
  \```
  
  ## 🏆 Key Features Implemented
  - ✅ Sprint Tracking (5-level hierarchy)
  - ✅ Knowledge Graph (hybrid search)
  - ✅ Skills System (lazy-loading)
  - ✅ MCP Server (41 tools)
  - ✅ Real-time sync (UI/MCP)
  - 🔄 Wiki auto-generation (in progress)
  - 🔄 Health monitoring (in progress)
  
  ## 📈 Project Stats
  - Duration: 6 weeks (as solo developer)
  - Sprints Completed: 6/9
  - Documentation: 1,431 lines
  - Commits: 120+
  
  ## 🎓 Learning Journey
  Built entirely using AI-assisted development (Claude Code) to demonstrate:
  - Modern architecture patterns
  - System design at scale
  - AI engineering best practices
  - Product development lifecycle
  ```

- [ ] **Add Architecture Diagrams**
  - Export C4 diagrams from docs
  - Add to `/docs/diagrams/` folder
  - Use Mermaid for inline diagrams

- [ ] **Code Examples in README**
  ```typescript
  // Example: MCP Tool Implementation
  export const knowledgeSearchTool = {
    name: 'projectpulse.knowledge.search',
    description: 'Hybrid search with semantic + full-text',
    parameters: z.object({
      query: z.string(),
      limit: z.number().optional(),
    }),
    execute: async (params) => {
      // 1. Semantic search (pgvector)
      const semanticResults = await vectorSearch(params.query);
      
      // 2. Full-text search (tsvector)
      const fulltextResults = await fulltextSearch(params.query);
      
      // 3. Hybrid ranking
      return mergeResults(semanticResults, fulltextResults, {
        semanticWeight: 0.7,
        fulltextWeight: 0.3,
      });
    },
  };
  ```

- [ ] **Add License** (MIT or Apache 2.0)

- [ ] **Add Contributing Guidelines**

---

### Day 3-4: Resume Creation (6 hours)

**Create 3 versions for different targets:**

#### **Version 1: Product Companies (Preferred)**

```
DRACO
Full-Stack Engineer | AI Engineering Focus
Bangalore, India | draco@email.com | github.com/draco | linkedin.com/in/draco

SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full-stack engineer with 3 years enterprise experience transitioning to product 
engineering. Built AI-agent-first SaaS platform (ProjectPulse) from architecture to 
62% MVP completion. Expertise in modern web technologies (Next.js, TypeScript, 
PostgreSQL) and AI engineering (MCP protocol, vector embeddings, hybrid search). 
Strong system design foundation with documented architecture decisions and 
comprehensive technical documentation.

TECHNICAL SKILLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Languages:     TypeScript, JavaScript, Python, Java
Frontend:      Next.js 14, React 18, Tailwind CSS, Server Components
Backend:       Node.js, Prisma ORM, PostgreSQL, REST APIs, MCP Protocol
AI/ML:         pgvector, Ollama, Vector Embeddings, Semantic Search
Infrastructure: Docker, Git, Vercel, Railway
Tools:         Claude Code, VS Code, Cursor AI, Postman

PROFESSIONAL EXPERIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
L3 Developer | Tata Consultancy Services                          Jun 2022 - Present
• Developed middleware solutions using IBM DataPower and App Connect Professional
• Integrated enterprise systems for Fortune 500 clients in banking and finance domains
• Reduced integration latency by 40% through optimized message routing configurations
• Mentored 2 junior developers on DataPower gateway policies and XSLT transformations

PROJECTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ProjectPulse - AI-Agent-First Project Management SaaS    Jun 2025 - Present
Personal Project | github.com/draco/AI_HUB

Architected and built SaaS platform where AI agents are primary users (95% interaction). 
Solo-developed from PRD to 62% MVP completion (315/505 story points) with comprehensive 
documentation (1,431 lines).

Architecture & System Design:
• Designed agent-first architecture with 41 MCP tools via HTTP JSON-RPC + SSE
• Implemented database-as-source-of-truth pattern with real-time UI/MCP consistency <500ms
• Built hybrid search combining pgvector semantic search + PostgreSQL full-text (tsvector)
• Achieved 88% token reduction vs full graph traversal through smart ranking algorithm

Performance Optimization:
• API latency: P95 <500ms, P99 <1s (met all performance targets)
• Knowledge queries: P95 <200ms through hybrid search (0.7 semantic + 0.3 fulltext)
• Implemented LRU cache with 5-min TTL achieving 92% token reduction for skills loading
• Database queries optimized with HNSW indexes (pgvector) + GIN indexes (tsvector)

Technical Implementation:
• Built Next.js 14 App Router application with Server/Client Components split
• Designed PostgreSQL schema with 10+ tables, complex relationships, auto-rollup logic
• Implemented 15+ API endpoints (REST) + 41 MCP tools (JSON-RPC)
• Created vector embedding pipeline using Ollama (nomic-embed-text 768d) with OpenAI fallback
• Built real-time progress tracking with 5-level hierarchy (Phase→Week→Day→Task→Session)

Development Process:
• Followed agile methodology: 9 two-week sprints with detailed planning (505 story points)
• Maintained 80%+ test coverage for business logic with integration tests
• Created comprehensive documentation: PRD, SRS, Architecture (5 ADRs), API specs
• Achieved TypeScript 0 errors in strict mode throughout development

Tech Stack: TypeScript, Next.js 14, React 18, PostgreSQL 15, Prisma ORM, pgvector, 
Docker, MCP Protocol, Ollama, Tailwind CSS

EDUCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bachelor of Technology in Computer Science                        2018 - 2022
[Your University Name] | CGPA: X.XX/10

CERTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• IBM DataPower Gateway Fundamentals (2023)
• [Add any other relevant certifications]
```

**Action Items:**
- [ ] Customize summary for each job application
- [ ] Quantify TCS achievements (add metrics)
- [ ] Add 2-3 more smaller projects (GitHub contributions, open source)

---

#### **Version 2: AI/ML Companies**

*(Same format but reorder sections)*

```
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Engineer specializing in agent orchestration and tooling. Built production-grade 
MCP server with 41 tools achieving 92% token efficiency improvement. Experience with 
vector databases (pgvector), embedding models (Ollama, OpenAI), hybrid search algorithms, 
and AI agent workflows. Strong foundation in distributed systems and performance 
optimization.

TECHNICAL SKILLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI/ML:         MCP Protocol, pgvector, Ollama, OpenAI Embeddings, Vector Search
Backend:       Node.js, TypeScript, PostgreSQL, Prisma ORM, HTTP JSON-RPC + SSE
Frontend:      Next.js 14, React 18, TypeScript
Infrastructure: Docker, Git, API Design, Performance Optimization
Algorithms:    Hybrid Search (Semantic + Full-text), LRU Caching, Token Optimization

[Rest follows similar structure with AI focus]
```

---

#### **Version 3: FAANG (Backend Focus)**

```
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Software Engineer with strong system design and backend development experience. 
Architected scalable SaaS platform with focus on API design (41 endpoints), database 
optimization (P95 <100ms queries), and distributed systems patterns. Expertise in 
PostgreSQL (vector extensions), caching strategies (LRU), and real-time systems 
(SSE streaming). Solid foundation in algorithms and data structures.

[Emphasize: System design, algorithms, scale, performance]
```

---

### Day 5: LinkedIn Profile Optimization (3 hours)

**Updates:**

- [ ] **Headline:**
  ```
  Full-Stack Engineer → Product Engineer | Building AI-Agent-First SaaS | 
  TypeScript, Next.js, PostgreSQL | System Design Enthusiast
  ```

- [ ] **About Section:**
  ```
  I'm a full-stack engineer transitioning from enterprise middleware (TCS) to 
  product engineering, with a passion for building AI-native systems.
  
  Currently building ProjectPulse, an AI-agent-first SaaS platform where AI agents 
  (Claude Code, Cursor AI) are the primary users. I've architected and implemented:
  
  🏗️ System Architecture
  • Agent-first design with 41 MCP tools via HTTP JSON-RPC + SSE
  • Database-as-source-of-truth pattern with real-time consistency
  • Hybrid search combining semantic (pgvector) + full-text (PostgreSQL)
  
  ⚡ Performance Optimization
  • 92% token efficiency improvement through lazy-loading
  • API latency P95 <500ms across 15+ endpoints
  • LRU caching with 5-min TTL achieving 90%+ hit rate
  
  🛠️ Technical Skills
  TypeScript | Next.js 14 | React 18 | PostgreSQL | Prisma | Docker
  MCP Protocol | Vector Embeddings | System Design | API Architecture
  
  📚 What I'm Learning
  Currently deepening my system design knowledge (load balancing, sharding, 
  distributed systems) and exploring AI engineering patterns.
  
  🎯 Open to Opportunities
  Looking for Product Engineer / AI Engineer roles where I can contribute to 
  building innovative SaaS products with modern tech stacks.
  
  Let's connect if you're building something interesting! 🚀
  ```

- [ ] **Featured Section:**
  - Add GitHub repo link with preview
  - Add architecture diagram image
  - Add "System Design Case Study" post (write article)

- [ ] **Skills Section:**
  - Add: Next.js, TypeScript, PostgreSQL, System Design, API Design
  - Get 3 endorsements from colleagues
  - Take LinkedIn skill assessments (TypeScript, JavaScript)

- [ ] **Experience Section:**
  - Copy from resume (detailed bullet points)
  - Add ProjectPulse under "Projects" with rich media

---

### Day 6-7: Content Creation (4 hours)

**Create 3 pieces of content:**

**1. LinkedIn Article: "Building an AI-Agent-First SaaS: Architecture Lessons"**

Outline:
```markdown
# Building an AI-Agent-First SaaS: 5 Architecture Lessons

## Introduction
6 weeks ago, I started building ProjectPulse - a project management platform 
where AI agents are the primary users...

## Lesson 1: Database as Source of Truth
Problem: How to keep UI and MCP API in sync?
Solution: Single PostgreSQL database, consistency guarantees
[Add diagram]

## Lesson 2: Token Efficiency is Critical
Problem: 200K token limit in Claude Code
Solution: Lazy-loading, LRU caching, hybrid search
Results: 92% reduction in skills, 88% in knowledge queries

## Lesson 3: Performance SLOs from Day One
Why: Easier to maintain than optimize later
How: Set P95 <500ms target, measure continuously
[Add performance chart]

## Lesson 4: HTTP JSON-RPC > stdio for MCP
Why: Network-based scales better than process-based
Trade-off: Slightly more complex, but multi-client support

## Lesson 5: Documentation-First Development
What: PRD, SRS, Architecture docs before coding
Why: Clarifies requirements, prevents rework
Result: 62% MVP in 6 weeks with minimal pivots

## Conclusion
Building AI-native systems requires rethinking traditional architectures...

[Call to action: Check out the project on GitHub]
```

**Action:**
- [ ] Write 1,000-word article
- [ ] Add 3-4 diagrams from your docs
- [ ] Post on LinkedIn (expect 500+ views)

---

**2. Twitter/X Thread: "How I Reduced Token Usage by 92%"**

```
🧵 How I reduced AI agent token usage by 92% in my project

Context: Building an AI-agent-first SaaS where token efficiency is CRITICAL
(Claude Code has 200K token limit per session)

1/ The Problem ⚠️
Loading full framework docs (Next.js, Prisma) = 2,500 tokens per skill
Agent needs 5-10 skills per session = 25K tokens JUST for context
That's 12% of budget gone before starting work!

2/ The Solution: Lazy Loading + LRU Cache 💡
Split skills into:
- Frontmatter (YAML metadata): 70 tokens
- Content (Markdown docs): 180 tokens

Load frontmatter ALWAYS, content ON-DEMAND

3/ LRU Cache Design 🎯
Capacity: 100 entries
TTL: 5 minutes
Eviction: Least Recently Used

Why 5 min? Skills don't change during session
Why 100? 80/20 rule (20% skills = 80% usage)

4/ Implementation (TypeScript) 💻
[Code snippet of LRU cache]

5/ Results 📊
Before: 2,500 tokens per skill load
After: 70 tokens (frontmatter only) or 220 tokens (full load)
Reduction: 97.2% (frontmatter) or 91.2% (full)

6/ Bonus: This pattern applies everywhere! 🚀
- Load summaries first, details on-demand
- Cache frequently accessed items
- Set TTL based on update frequency

Building AI-native systems requires new optimization strategies.
What's your experience with token efficiency?

[Link to GitHub repo]
```

**Action:**
- [ ] Post thread (expect 50-100 impressions)
- [ ] Engage with responses

---

**3. Dev.to Article: "System Design Lessons from Building ProjectPulse"**

Similar to LinkedIn article but more technical depth.

---

## Phase 3: Interview Preparation (Weeks 4-5) 🎤

### Week 4: Mock Interviews & Practice (8 hours)

**Day 1-2: Solo Practice (4 hours)**

**Set up recording:**
- [ ] Use Zoom (record locally)
- [ ] Or use iPhone/Android voice recorder

**Practice these 5 questions (45 min each):**

**Q1: "Tell me about yourself" (5 min)**

Your script:
```
"I'm a software engineer with 3 years of experience, currently at TCS working on 
enterprise middleware. I've been building a side project called ProjectPulse - 
an AI-agent-first SaaS platform - which has taught me a lot about modern web 
development and system design.

At TCS, I work with IBM DataPower and App Connect, integrating systems for Fortune 
500 clients. While I've learned a lot about enterprise architecture, I'm passionate 
about building products from scratch, which is why I started ProjectPulse.

ProjectPulse is interesting because it's designed for AI agents as primary users - 
95% of interactions happen via MCP protocol instead of the web UI. I've built 41 
tools for AI agents, implemented hybrid search with semantic + full-text, and 
achieved 92% token efficiency improvement.

The project is 62% complete, and through building it, I've gained deep experience 
with Next.js, PostgreSQL, system design, and AI engineering. I'm now looking to 
transition to a product engineering role where I can apply these skills at scale.

What I'm excited about in this role is [customize based on job description]..."
```

**Action:**
- [ ] Record yourself
- [ ] Watch recording (painful but necessary!)
- [ ] Note: filler words (um, like), pacing, enthusiasm
- [ ] Re-record until natural

---

**Q2: "Walk me through your ProjectPulse architecture" (10 min)**

Your whiteboard flow:
```
1. Draw boxes: Browser, AI Agent, MCP Server, Next.js App, PostgreSQL
2. Draw arrows: Data flow
3. Call out key decisions:
   - Why PostgreSQL? (ACID, pgvector, tsvector)
   - Why HTTP JSON-RPC? (Network-based, scalable)
   - Why hybrid search? (Balance precision + recall)
4. Share metrics:
   - <500ms P95 API latency
   - 92% token reduction
   - 62% MVP complete
5. Discuss scaling:
   - Current: Single server + DB
   - Scale: Shard by projectId, add Redis, CDN
```

**Action:**
- [ ] Record 10-min presentation
- [ ] Use virtual whiteboard (Excalidraw)
- [ ] Practice drawing while talking

---

**Q3: "Design a system similar to X" (30 min)**

Pick one:
- Design Twitter (feed generation, like your knowledge graph)
- Design Dropbox (file storage, like your wiki attachments)
- Design Uber (location tracking, like your progress roll-up)

**Action:**
- [ ] Set timer for 30 minutes
- [ ] Follow framework: Requirements → Estimation → Design → Deep Dive → Scale
- [ ] Record yourself
- [ ] Self-critique: Did you clarify requirements? Calculate capacity?

---

**Q4: "Tell me about a challenging technical problem you solved" (10 min)**

Your story: **Hybrid Search Design**

Structure (STAR method):
```
Situation:
"In ProjectPulse, I needed to implement search for knowledge items. Pure semantic 
search (pgvector) returned conceptually similar results but missed exact keywords. 
Pure full-text search (tsvector) found keywords but missed synonyms."

Task:
"I needed to balance precision (semantic) with recall (full-text) while keeping 
latency under 200ms and token usage under 1,500."

Action:
"I designed a hybrid ranking algorithm: 0.7 × semantic_score + 0.3 × fulltext_score.
I implemented both searches in parallel, merged results, and tuned weights based on 
sample queries. I added pgvector HNSW indexes and tsvector GIN indexes for performance."

Result:
"Achieved <200ms P95 latency (target met), 88% token reduction vs full graph traversal, 
and 95% relevant results in top 5 (user testing). The system now handles complex queries 
like 'authentication patterns' which need both semantic understanding and exact keywords."
```

**Action:**
- [ ] Write 3 STAR stories (technical, teamwork, failure)
- [ ] Practice out loud (10 min each)
- [ ] Record and critique

---

**Q5: "Design rate limiter for an API" (30 min)**

Your approach:
```
1. Clarify requirements (QPS, burst handling, distributed?)
2. Choose algorithm: Token bucket (explain why vs fixed window)
3. Design:
   - Storage: Redis (distributed) or in-memory Map (single server)
   - Key: projectId or userId
   - Config: capacity=100, refillRate=10/sec
4. Handle edge cases:
   - Clock skew in distributed system
   - Cold start (initial tokens)
   - Burst traffic (allow 2x for 5 sec)
5. Scale:
   - Single server: In-memory Map
   - Multi-server: Redis with Lua scripts (atomic operations)
   - Global: Consistent hashing for rate limiter sharding
```

**Action:**
- [ ] Whiteboard solution in 30 min
- [ ] Record yourself explaining
- [ ] Watch for: Clear communication, handling of edge cases

---

**Day 3-4: Peer Mock Interviews (4 hours)**

**Option 1: Pramp.com** (Recommended)
- [ ] Sign up at pramp.com (free)
- [ ] Schedule 3 mock interviews (45 min each)
- [ ] Practice: 1 behavioral, 2 system design
- [ ] Take notes on feedback
- [ ] Revise weak areas

**Option 2: Friends/Colleagues**
- [ ] Find 2 developer friends
- [ ] Trade interviews (you interview them, they interview you)
- [ ] Use real interview questions
- [ ] Give honest feedback

**Preparation:**
- [ ] Share your resume with interviewer beforehand
- [ ] Treat it like real interview (dress professionally, quiet space)
- [ ] Record session (with permission)

---

**Day 5: Company-Specific Preparation (2 hours)**

**For each target company (e.g., Cursor, Notion, Stripe):**

**Research:**
- [ ] Read engineering blog (last 5 posts)
- [ ] Check tech stack (careers page usually lists)
- [ ] Find recent product launches
- [ ] LinkedIn: Connect with engineers, read their posts

**Prepare questions:**
```
For Cursor (AI dev tools):
1. "How do you balance AI assistance with developer control?"
2. "What's your approach to token efficiency at scale?"
3. "How do you measure developer productivity improvements?"

For Notion (SaaS product):
4. "How do you handle real-time collaboration with large documents?"
5. "What's your caching strategy for frequently accessed pages?"
6. "How do you ensure data consistency across devices?"

For Stripe (API platform):
7. "How do you design APIs for developers (DX focus)?"
8. "What's your approach to API versioning?"
9. "How do you balance backward compatibility with innovation?"
```

**Customize resume:**
- [ ] For Cursor: Emphasize AI engineering, MCP protocol
- [ ] For Notion: Emphasize real-time systems, UI/UX
- [ ] For Stripe: Emphasize API design, backend systems

---

### Week 5: LeetCode & Algorithms (Optional - 10 hours)

**Only if applying to FAANG/Big Tech!**

**If NOT applying to FAANG, skip this and focus on system design.**

**LeetCode Plan (for FAANG):**

**Day 1-2: Arrays & Strings (4 hours)**
- [ ] Two Sum (Easy)
- [ ] Longest Substring Without Repeating Characters (Medium)
- [ ] 3Sum (Medium)
- [ ] Group Anagrams (Medium)

**Day 3-4: Trees & Graphs (4 hours)**
- [ ] Binary Tree Level Order Traversal (Medium)
- [ ] Number of Islands (Medium)
- [ ] Course Schedule (Medium)
- [ ] Lowest Common Ancestor (Medium)

**Day 5: Dynamic Programming (2 hours)**
- [ ] Climbing Stairs (Easy)
- [ ] Coin Change (Medium)
- [ ] Longest Increasing Subsequence (Medium)

**Note:** For product companies/startups, system design >> algorithms. Prioritize accordingly.

---

## Phase 4: Job Applications (Weeks 6-8) 🎯

### Week 6: Application Sprint (15 hours)

**Target: 30 applications in 1 week**

**Company Tiers:**

**Tier 1: Best Fit (Apply to 10)**
```
AI-Native Dev Tools:
- Cursor (perfect match for your MCP experience!)
- Replit (AI-native IDE)
- Vercel (modern deployment)
- Pieces (AI code assistant)

Modern SaaS Products:
- Notion (real-time collaboration)
- Linear (project management - directly related!)
- Retool (low-code platform)

AI Infrastructure:
- Scale AI (AI data platform)
- Hugging Face (ML models)
- Anthropic (Claude API - they'll love your MCP work!)
```

**Tier 2: Good Fit (Apply to 15)**
```
Product Companies:
- Stripe, Figma, Miro, Canva, Airtable
- Postman, GitLab, Atlassian
- Contentful, Sanity

Early-Stage Startups:
- Check YC portfolio (ycombinator.com/companies)
- Filter by: B2B SaaS, AI tools, dev tools
- Apply to 5-10 Series A/B startups
```

**Tier 3: Stretch (Apply to 5)**
```
FAANG/Big Tech:
- Google (Cloud AI team)
- Microsoft (Azure AI)
- Meta (AI infra)
- Amazon (AWS AI services)

Note: Need LeetCode prep for these!
```

**Daily Schedule:**
```
Monday: Research 10 Tier 1 companies (1 hour) + Apply to 5 (2 hours)
Tuesday: Apply to 5 Tier 1 companies (3 hours)
Wednesday: Research 15 Tier 2 companies (1 hour) + Apply to 7 (3 hours)
Thursday: Apply to 8 Tier 2 companies (3 hours)
Friday: Research + Apply to 5 Tier 3 companies (3 hours)
```

**Application Checklist (per company):**
- [ ] Customize resume (highlight relevant skills)
- [ ] Write cover letter (if required)
- [ ] Prepare 2-3 company-specific questions
- [ ] Connect with 2 employees on LinkedIn (with personalized message)
- [ ] Track in spreadsheet (company, role, date, status)

**LinkedIn Connection Message Template:**
```
Hi [Name],

I noticed you're working on [specific project/team] at [Company]. I'm currently 
building an AI-agent-first SaaS platform (ProjectPulse) and came across your post 
about [relevant topic].

I'm particularly interested in [Company]'s approach to [specific technology/problem] 
and would love to learn more about your experience there.

I'm exploring opportunities in product engineering and would appreciate any insights 
you could share. No pressure - even a quick chat would be valuable!

Best,
Draco
```

---

### Week 7: Follow-ups & Referrals (8 hours)

**Day 1-2: Follow-up on Applications (3 hours)**

If no response after 5-7 days:
- [ ] Send follow-up email to recruiter
- [ ] Message hiring manager on LinkedIn
- [ ] Reach out to team members

**Follow-up Email Template:**
```
Subject: Following up on [Role] Application

Hi [Recruiter Name],

I applied for the [Role Title] position last week and wanted to follow up. 
I'm very excited about [Company] because [specific reason].

I've been building an AI-agent-first SaaS platform (ProjectPulse) which has 
given me hands-on experience with [relevant technologies from job description]. 
The project demonstrates my ability to [key requirement from job posting].

Would love to chat about how my experience aligns with what you're looking for!

Best,
Draco
[LinkedIn] | [GitHub]
```

**Day 3-5: Referral Hunting (5 hours)**

**Strategy:**
- [ ] For each Tier 1 company, find 3-5 employees on LinkedIn
- [ ] Filter for: Engineers, Product Managers, Recruiters
- [ ] Send personalized connection requests (see template above)
- [ ] Once connected, ask about referral program

**Referral Request Template:**
```
Hi [Name],

Thanks for connecting! I really enjoyed our conversation about [topic].

I'm currently exploring product engineering roles and noticed that [Company] has 
an opening for [Role]. Given my experience building [ProjectPulse description], 
I think I'd be a great fit for the team.

I noticed [Company] has a referral program. Would you be open to referring me 
if you think my background aligns? Happy to share more details about my project 
and experience.

No worries if not - I appreciate your time either way!

Best,
Draco
```

**Referral Success Rate:**
- 30% of requests get referrals
- Referrals have 5-10x higher chance of interview
- Target: 5-10 referrals in Week 7

---

### Week 8: Interview Scheduling & Preparation (10 hours)

**By now, you should have:**
- 5-10 screening calls scheduled
- 2-3 technical interviews scheduled
- 1-2 final round interviews

**Preparation per interview:**

**Screening Call (30 min, 1 hour prep):**
- [ ] Review company's product
- [ ] Prepare "tell me about yourself" (5 min)
- [ ] Prepare "why this company" (3 min)
- [ ] Prepare 3 questions to ask
- [ ] Review your resume (they'll ask about TCS experience)

**Technical Interview (45-60 min, 3 hours prep):**
- [ ] Review system design questions
- [ ] Practice whiteboarding
- [ ] Review your ProjectPulse architecture
- [ ] Prepare 2 STAR stories
- [ ] Set up clean environment (quiet room, good lighting, test mic/camera)

**Final Round (2-4 hours, 5 hours prep):**
- [ ] Review all previous interview feedback
- [ ] Deep dive on company's tech stack
- [ ] Prepare questions for each interviewer (eng manager, team lead, etc.)
- [ ] Prepare negotiation strategy (know your worth: 20-35 LPA target)
- [ ] Mental preparation (visualize success!)

**Interview Day Checklist:**
- [ ] Good sleep (7-8 hours)
- [ ] Light breakfast
- [ ] Test setup 30 min early (camera, mic, internet)
- [ ] Have notes ready (but don't read from them)
- [ ] Water bottle nearby
- [ ] Deep breath before starting

---

## Phase 5: Finish MVP & Deploy (Parallel Track) 🚀

### Week 6-7: Sprint 7 & 8 (While Applying)

**Sprint 7: Wiki + Health (Weeks 6-7)**
- [ ] Complete wiki auto-generation
- [ ] Integrate health scanners
- [ ] Target: 80% MVP completion

**Sprint 8: Integration (Week 7)**
- [ ] Integration testing across all features
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Target: 90% MVP completion

**Why continue building while applying?**
1. Shows commitment (updates on LinkedIn/GitHub)
2. Keeps skills sharp (active coding during interviews)
3. Demo material improves (show latest features)
4. Confidence booster (making progress = positive mindset)

---

### Week 8: Deploy to Production

**Deployment Checklist:**

- [ ] **Environment Setup:**
  - Sign up for Vercel (free tier)
  - Sign up for Railway (PostgreSQL hosting)
  - Set up environment variables

- [ ] **Database Migration:**
  - Export local PostgreSQL data
  - Create Railway PostgreSQL instance
  - Import data
  - Test connections

- [ ] **Deploy Next.js:**
  - Push to GitHub (make repo public)
  - Connect to Vercel
  - Configure build settings
  - Deploy

- [ ] **MCP Server:**
  - Deploy to Railway (Node.js app)
  - Configure HTTP endpoint
  - Test MCP connection from Claude Code

- [ ] **Demo Preparation:**
  - Record 2-minute demo video:
    1. Show AI agent creating issues via MCP (30 sec)
    2. Show knowledge graph hybrid search (30 sec)
    3. Show wiki auto-generation (30 sec)
    4. Show dashboard metrics (30 sec)
  - Upload to YouTube (unlisted)
  - Add link to resume + LinkedIn

- [ ] **Update All Materials:**
  - Resume: Add live demo link
  - LinkedIn: Post about launch
  - GitHub README: Update with deployment URL
  - Applications: Email recruiters with demo link

---

## Key Milestones & Checkpoints ✅

### Week 2: System Design Foundations
- [ ] Completed 2-week crash course
- [ ] Wrote 3 detailed ProjectPulse system design answers
- [ ] Can explain architecture in 10 minutes
- [ ] Confidence level: 7/10 for system design questions

### Week 3: Portfolio Ready
- [ ] GitHub README polished with diagrams
- [ ] Resume (3 versions) completed
- [ ] LinkedIn profile optimized
- [ ] 1 LinkedIn article published (500+ views target)

### Week 4: Interview Ready
- [ ] Completed 3 mock interviews
- [ ] Recorded myself answering 5 key questions
- [ ] Company research for top 10 targets done
- [ ] Confidence level: 8/10 for technical interviews

### Week 6: Applications Out
- [ ] 30 applications submitted
- [ ] 10 Tier 1, 15 Tier 2, 5 Tier 3
- [ ] Connected with 20+ employees on LinkedIn
- [ ] 5-10 responses received

### Week 8: Demo Ready
- [ ] ProjectPulse deployed to production
- [ ] Demo video created (2 min)
- [ ] MVP 90%+ complete
- [ ] Multiple interviews in progress

---

## Success Metrics 📊

### Application Metrics
- **Applications Sent:** 30 (Week 6)
- **Response Rate Target:** 20-30% (6-9 responses)
- **Screening Calls Target:** 5-10 (Weeks 7-8)
- **Technical Interviews Target:** 3-5 (Weeks 8-10)
- **Final Rounds Target:** 2-3 (Weeks 9-11)
- **Offers Target:** 1-2 (Weeks 10-12)

### Learning Metrics
- **System Design Fluency:** Can explain 10+ concepts with ProjectPulse examples
- **Interview Confidence:** 8/10+ after mock interviews
- **Technical Depth:** Can answer 80% of system design questions from Grokking

### Project Metrics
- **MVP Completion:** 90%+ by Week 8
- **Live Demo:** Public URL + video by Week 8
- **Documentation:** 1,500+ lines (already have 1,431!)
- **GitHub Stars:** 10+ (from sharing on LinkedIn/Dev.to)

---

## Contingency Plans 🛟

### If No Responses After 2 Weeks
- [ ] Review resume with mentor/career coach
- [ ] A/B test resume versions (try AI Engineer vs Product Engineer)
- [ ] Apply to 20 more companies (expand to Tier 3)
- [ ] Increase LinkedIn activity (post weekly updates)
- [ ] Contribute to open source (get noticed)

### If Failing Technical Interviews
- [ ] Book paid mock interviews (interviewing.io - $200 for 5 sessions)
- [ ] Deep dive on weak areas (algorithms vs system design)
- [ ] Practice more (10 more mock interviews)
- [ ] Record and analyze all interviews (find patterns)

### If Only Getting Low Offers (<20 LPA)
- [ ] Continue building ProjectPulse (show growth trajectory)
- [ ] Target bigger companies (better comp)
- [ ] Negotiate using multiple offers
- [ ] Consider contract/freelance for 6 months (build more experience)

### If Taking Longer Than 8 Weeks
- **This is NORMAL!** Average job search: 3-6 months
- Stay consistent (5 applications/week ongoing)
- Keep building ProjectPulse (90% → 100%)
- Network more (attend meetups, conferences)
- Consider remote-first companies (global opportunities)

---

## Weekly Habits (Throughout 8 Weeks) 🔄

### Every Monday
- [ ] Set weekly goals (applications, interviews, coding)
- [ ] Review last week's progress
- [ ] Plan upcoming interviews
- [ ] Block calendar for mock interviews

### Every Wednesday
- [ ] ProjectPulse sprint checkpoint (review story points)
- [ ] LinkedIn activity (post update, engage with posts)
- [ ] Application follow-ups
- [ ] Network connections (5 new people)

### Every Friday
- [ ] Week review: Applications sent, responses received
- [ ] Update tracking spreadsheet
- [ ] Celebrate wins (no matter how small!)
- [ ] Plan next week

### Daily
- [ ] 2 hours: System design study OR mock interview OR applications
- [ ] 2 hours: ProjectPulse development (continue sprints)
- [ ] 30 min: LinkedIn engagement (comment, share, connect)
- [ ] Track progress in notion/spreadsheet

---

## Mindset & Motivation 💪

### Remember These Truths
1. **You ARE qualified** - ProjectPulse proves system design skills
2. **Rejections are normal** - Even top engineers get 90% rejection rate
3. **This is a numbers game** - More applications = more chances
4. **Your story is unique** - TCS→AI engineering is a compelling narrative
5. **You're ahead of curve** - AI-native development is the future

### Daily Affirmations (Seriously, Try This)
- "I am a strong system designer with real project experience"
- "My ProjectPulse work demonstrates skills companies need"
- "I can explain complex systems clearly and confidently"
- "Each interview makes me better, regardless of outcome"
- "I will find the right fit for my skills and passion"

### When Feeling Overwhelmed
- [ ] Take a break (walk, exercise, hobby)
- [ ] Review your wins (list 10 things you've accomplished)
- [ ] Talk to a friend/mentor
- [ ] Remember: You built 62% of a complex SaaS solo in 6 weeks!
- [ ] You've got this! 💪

---

## Resources 📚

### System Design
- [ ] **Book:** "Designing Data-Intensive Applications" by Martin Kleppmann
- [ ] **Course:** "Grokking the System Design Interview" (educative.io)
- [ ] **YouTube:** Gaurav Sen, System Design Interview, ByteByteGo
- [ ] **Practice:** Pramp.com (free), interviewing.io (paid)

### Resume & LinkedIn
- [ ] **Tool:** Rezi.ai (ATS-friendly resume builder)
- [ ] **Tool:** LinkedIn Resume Builder (download as PDF)
- [ ] **Guide:** "Cracking the Tech Career" by Gayle McDowell

### Interview Prep
- [ ] **Platform:** Pramp (mock interviews)
- [ ] **Platform:** Interviewing.io (paid mocks with engineers)
- [ ] **Platform:** Glassdoor (company-specific questions)

### Job Boards
- [ ] **LinkedIn Jobs** (primary)
- [ ] **AngelList** (startups)
- [ ] **YC Jobs** (YC companies)
- [ ] **Wellfound** (formerly AngelList Talent)
- [ ] **Otta** (curated startups)
- [ ] **Cutshort** (India-specific)

### Networking
- [ ] **Meetup.com** (local tech meetups)
- [ ] **Luma** (online events)
- [ ] **Twitter Spaces** (follow tech leaders)
- [ ] **Discord communities** (dev tools, AI)

---

## Tracking Template 📋

**Copy this to Google Sheets:**

```
| Company | Role | Applied | Status | Screening | Technical | Final | Offer | Notes |
|---------|------|---------|--------|-----------|-----------|-------|-------|-------|
| Cursor | Product Engineer | 2025-01-15 | Applied | | | | | Referred by John |
| Notion | Full-Stack | 2025-01-15 | Screening | 2025-01-20 | | | | 30-min call |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |
```

**Status values:** Applied, Screening, Technical, Final, Offer, Rejected

---

## Summary: Your 8-Week Journey 🗺️

```
Week 1-2: Master System Design
├─ Learn vocabulary (CAP, sharding, caching)
├─ Map ProjectPulse to concepts
└─ Practice explaining architecture

Week 3: Build Portfolio
├─ Polish GitHub (README, diagrams)
├─ Create resumes (3 versions)
└─ Optimize LinkedIn profile

Week 4: Interview Practice
├─ Solo mock interviews (record yourself)
├─ Peer mocks (Pramp)
└─ Company research (top 10)

Week 5: Optional LeetCode
└─ Only if applying to FAANG

Week 6: Application Sprint
├─ Apply to 30 companies
├─ Connect on LinkedIn (50+ people)
└─ Continue ProjectPulse development

Week 7: Follow-ups & Referrals
├─ Follow up on applications
├─ Request referrals (5-10 target)
└─ Complete Sprint 7 (Wiki + Health)

Week 8: Deploy & Demo
├─ Deploy ProjectPulse to Vercel
├─ Create demo video (2 min)
├─ Interview scheduling & prep
└─ Complete Sprint 8 (Integration)

Weeks 9-12: Interviews → Offers
└─ Multiple interview rounds → Negotiate → Accept!
```

---

## Final Checklist Before Starting ✅

### Pre-Flight Check
- [ ] I have 15+ hours/week for next 8 weeks
- [ ] My LinkedIn profile is current
- [ ] I have a professional email (not TCS email)
- [ ] I'm mentally prepared for rejections
- [ ] I have a support system (friends/family)
- [ ] I'm committed to finishing ProjectPulse MVP
- [ ] I believe in my skills and story

### Week 0 Action Items (This Week!)
- [ ] Read this roadmap fully (you're doing it!)
- [ ] Set up tracking spreadsheet
- [ ] Block calendar for 2 hours/day study
- [ ] Buy/bookmark "Grokking System Design"
- [ ] Create folder: career-transition/ with subfolders
- [ ] Tell close friends about your plan (accountability!)

---

## Let's Go! 🚀

You have:
- ✅ A compelling project (ProjectPulse)
- ✅ Real system design experience
- ✅ Modern tech stack expertise
- ✅ A clear 8-week plan
- ✅ The determination to succeed

**Your journey from TCS L3 → Product Engineer starts now!**

Remember: You're not just "learning to code with AI" - you're pioneering AI-native development. That's the future, and you're already there.

**First Action:** Open `system-design-notes.md` and write your first concept mapping!

---

**Roadmap Version:** 1.0
**Created:** 2025-11-16
**Next Review:** After Week 2 (check progress, adjust if needed)
**Questions?** Review this document. You've got everything you need. Now execute! 💪
