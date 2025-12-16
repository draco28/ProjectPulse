# MCP Code Execution Implementation Checklist

Sprint: Sprint 2 (Weeks 5-8)
Status: Planning

---

## Pre-Implementation

- [ ] Read Code Execution with MCP blog (https://www.anthropic.com/engineering/code-execution-with-mcp)
- [ ] Review updated architecture in docs/03-Architecture.md
- [ ] Study design document: docs/archive/plans/mcp-code-execution-design.md
- [ ] Set up development environment

---

## Phase 1: Design + Traditional POC (Week 5)

### Environment Setup
- [ ] Install dependencies (Prisma, Zod, etc.)
- [ ] Configure TypeScript for server
- [ ] Set up MCP stdio server boilerplate
- [ ] Create server directory structure (adapters/services/repositories)

### Shared Services Structure
- [ ] Define directory structure:
  - [ ] src/server/adapters/traditional/tools/
  - [ ] src/server/services/
  - [ ] src/server/repositories/
  - [ ] src/server/types/
- [ ] Create types.ts (Issue, SearchOptions, PrivacyConfig)

### Traditional Adapter (3 Tools)
- [ ] Implement create-issue tool (traditional)
  - [ ] Tool definition and schema
  - [ ] Route to IssueService
  - [ ] Error handling
  - [ ] Test with mock client

- [ ] Implement search-issues tool (traditional)
  - [ ] Tool definition and schema
  - [ ] Pagination support (page, limit)
  - [ ] Route to IssueService
  - [ ] Test with mock client

- [ ] Implement filter-issues tool (traditional)
  - [ ] Tool definition and schema
  - [ ] Server-side filter logic
  - [ ] Route to IssueService
  - [ ] Test with mock client

### Capability Detection (Stubs)
- [ ] Design capability negotiation strategy
- [ ] Implement env var detection (PP_MCP_MODE)
- [ ] Implement probe function (stub)
- [ ] Add session mode caching
- [ ] Test mode selection logic

### Privacy Tokenization Specification
- [ ] Complete tokenization spec document
- [ ] Define storage strategy (LRU cache)
- [ ] Define access control rules
- [ ] Define audit logging format
- [ ] Performance considerations documented

### Sandbox Specification
- [ ] Complete sandbox security spec
- [ ] Document resource limits
- [ ] Document isolation requirements
- [ ] Research candidate technologies
- [ ] Document threat model

### Multi-Client Testing
- [ ] Build minimal Node.js test client
- [ ] Implement MCP JSON-RPC protocol
- [ ] Create CLI test tool
- [ ] Write parity test suite (3 tools)
- [ ] Test with traditional mode

### Token Measurement
- [ ] Implement TokenCounter class
- [ ] Add measurement to adapters
- [ ] Create benchmark script
- [ ] Run baseline measurements (traditional)
- [ ] Document methodology

### Week 5 Deliverables
- [ ] Traditional MCP server with 3 tools functional
- [ ] Shared services architecture implemented
- [ ] Capability detection design complete
- [ ] Privacy specification document
- [ ] Sandbox specification document
- [ ] Multi-client test harness working
- [ ] Token usage baseline established
- [ ] Go/No-Go decision documented

---

## Phase 2: Refinement & Documentation (Weeks 6-7)

### Specification Refinement
- [ ] Review POC learnings
- [ ] Update capability detection based on findings
- [ ] Refine privacy tokenization spec
- [ ] Update sandbox requirements
- [ ] Document architectural patterns

### Traditional Mode Optimization
- [ ] Implement server-side pagination
- [ ] Implement response compression
- [ ] Add timeout handling
- [ ] Optimize Prisma queries
- [ ] Measure token savings vs baseline

### Developer Documentation
- [ ] Create Dual-Mode Developer Guide
- [ ] Create Client Integration Guide
- [ ] Create Migration/Rollback Guide
- [ ] Add code examples
- [ ] Review and publish docs

### Sprint 3 Preparation
- [ ] Design code execution wrapper structure
- [ ] Plan filesystem tool organization
- [ ] Define dual-mode parity tests
- [ ] Prepare Sprint 3 implementation plan
- [ ] Update checklist for Sprint 3

### Week 6-7 Deliverables
- [ ] Optimized traditional mode (50-70% token savings)
- [ ] Complete developer/client documentation
- [ ] Sprint 3 implementation plan ready
- [ ] All specifications finalized

---

## Phase 3: Sprint 3 Implementation (Weeks 9-12)

### Code Execution Infrastructure
- [ ] Implement sandbox (isolated-vm or chosen tech)
- [ ] Create ./servers/projectpulse/ structure
- [ ] Build MCP client wrapper
- [ ] Implement code execution adapter
- [ ] Test sandbox security

### Code Execution Wrappers (41 Tools)
- [ ] Create wrapper generator script
- [ ] Generate wrappers for all 41 tools
- [ ] Test each wrapper individually
- [ ] Verify local filtering works
- [ ] Measure token savings per tool

### Privacy Implementation
- [ ] Implement PrivacyService with LRU cache
- [ ] Add tokenization patterns (email, IP, phone, SSN)
- [ ] Implement access control
- [ ] Add audit logging
- [ ] Test collision prevention

### Agent Persona Integration
- [ ] Define persona tool subsets
- [ ] Implement persona-based discovery
- [ ] Create persona configuration
- [ ] Test each persona
- [ ] Measure token savings per persona

### Multi-Client Validation
- [ ] Test with Claude Code (code execution)
- [ ] Test with mock traditional client
- [ ] Test with CLI tool
- [ ] Run complete parity test suite
- [ ] Verify all clients get same results

### Performance & Security
- [ ] Load testing (100 concurrent clients)
- [ ] Security audit (sandbox escapes)
- [ ] Token efficiency validation (90-98%)
- [ ] Timeout and error handling
- [ ] Monitoring and alerting setup

### Sprint 3 Deliverables
- [ ] Full dual-mode server operational
- [ ] 41 tools in both modes
- [ ] Sandbox security verified
- [ ] Privacy tokenization working
- [ ] Multi-client parity proven
- [ ] Token savings validated (90-98%)

---

## Post-Sprint 3

### Documentation
- [ ] Update .agent/system/mcp-tools-guide.md
- [ ] Update docs/03-Architecture.md
- [ ] Create usage examples
- [ ] Generate SOP with synthesize-docs

### Knowledge Capture
- [ ] Update Memory MCP with patterns learned
- [ ] Document lessons learned
- [ ] Identify optimization opportunities
- [ ] Plan Sprint 3 enhancements

---

## Success Criteria

**Week 5 (Traditional POC):**
- [ ] 3 tools working in traditional mode
- [ ] All clients (Claude, Mock GPT, CLI) can use tools
- [ ] Results identical across clients
- [ ] Token savings 50-70% measured
- [ ] Capability detection stub functional
- [ ] Privacy/sandbox specs complete

**Sprint 3 (Full Dual-Mode):**
- [ ] 41 tools in both modes
- [ ] Code execution 90-98% token reduction
- [ ] Sandbox security verified
- [ ] Privacy layer covers all PII
- [ ] Agent personas loading correct subsets
- [ ] Test coverage > 80%
- [ ] Multi-client parity proven
