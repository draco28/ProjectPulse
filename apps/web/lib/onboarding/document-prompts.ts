/**
 * Session 2 Document Prompt Templates
 * 
 * Agent-Side AI Generation Pattern:
 * - Agent calls GET /api/onboarding/document-prompts
 * - Server returns these 15 prompts WITH project context injected
 * - Agent generates documents with THEIR AI provider
 * - Agent stores documents via POST /api/onboarding/documents
 * 
 * NO server-side AI generation (privacy-first, zero-cost)
 */

export interface DocumentPrompt {
  filename: string;
  title: string;
  category: 'planning' | 'architecture' | 'implementation' | 'operations';
  wordCountTarget: number;
  systemPrompt: string;
  userPromptTemplate: (projectContext: any) => string;
}

export const DOCUMENT_PROMPTS: DocumentPrompt[] = [
  // ============================================================================
  // PLANNING DOCUMENTS (5)
  // ============================================================================
  
  {
    filename: '01-PRD.md',
    title: 'Product Requirements Document',
    category: 'planning',
    wordCountTarget: 2000,
    systemPrompt: 'You are a product manager writing a comprehensive PRD following industry best practices. Write in a clear, structured format with actionable requirements.',
    userPromptTemplate: (ctx) => `
Generate a Product Requirements Document for ${ctx.metadata?.projectName || 'the project'}.

# Project Context
${ctx.executiveSummary || 'No executive summary available'}

# Core Features
${JSON.stringify(ctx.features || [], null, 2)}

# Tech Stack
${JSON.stringify(ctx.techStack || {}, null, 2)}

# Required Sections
1. **Product Vision and Goals** - What problem does this solve? What is the vision?
2. **Target Users and Personas** - Who are the primary users? What are their needs?
3. **Core Features** - List and describe MVP features (3-5 key features)
4. **User Stories** - Write 5-10 user stories in format: "As a [user], I want [goal] so that [benefit]"
5. **Success Metrics and KPIs** - How will you measure success?
6. **Out of Scope** - What is explicitly NOT included in MVP?
7. **Assumptions and Constraints** - What assumptions are we making? What are the constraints?

Generate ~2000 words in markdown format with clear headings, bullet points, and actionable requirements.
    `.trim()
  },
  
  {
    filename: '02-SRS.md',
    title: 'Software Requirements Specification',
    category: 'planning',
    wordCountTarget: 2500,
    systemPrompt: 'You are a software architect writing an SRS document following IEEE 830 standards. Be detailed, technical, and comprehensive.',
    userPromptTemplate: (ctx) => `
Generate a Software Requirements Specification for ${ctx.metadata?.projectName || 'the project'}.

# Project Context
${ctx.executiveSummary || 'No executive summary available'}

# Tech Stack
- Frontend: ${ctx.techStack?.frontend || 'Not specified'}
- Backend: ${ctx.techStack?.backend || 'Not specified'}
- Database: ${ctx.techStack?.database || 'Not specified'}
- Hosting: ${ctx.techStack?.hosting || 'Not specified'}

# Required Sections
1. **Functional Requirements** - Detailed user flows for each feature (step-by-step)
2. **Non-Functional Requirements**:
   - Performance (response time, throughput)
   - Security (authentication, authorization, data protection)
   - Usability (accessibility, user experience)
   - Reliability (uptime, error handling)
   - Scalability (user capacity, data volume)
3. **System Constraints** - Technical limitations, budget, timeline
4. **Acceptance Criteria** - How do we know when each requirement is met?
5. **Data Requirements** - What data needs to be stored? What are the relationships?
6. **External Interfaces** - APIs, third-party integrations, external services

Generate ~2500 words in markdown format with detailed technical specifications.
    `.trim()
  },
  
  {
    filename: '12-Backlog.md',
    title: 'Feature Backlog & Prioritization',
    category: 'planning',
    wordCountTarget: 1500,
    systemPrompt: 'You are a product manager creating a prioritized backlog. Be strategic and data-driven.',
    userPromptTemplate: (ctx) => `
Generate a Feature Backlog for ${ctx.metadata?.projectName || 'the project'}.

# Project Context
${ctx.executiveSummary || 'No executive summary available'}

# Core Features (MVP)
${JSON.stringify(ctx.features || [], null, 2)}

# Required Sections
1. **MVP Features** (Must Have) - Features required for launch
2. **Post-MVP Features** (Should Have) - Features for version 1.1
3. **Future Features** (Nice to Have) - Features for version 2.0
4. **Prioritization Framework**:
   - Impact (High/Medium/Low)
   - Effort (High/Medium/Low)
   - Dependencies (what must be done first)
5. **User Stories** - For each backlog item, write user story
6. **Acceptance Criteria** - Clear definition of done for each item

Generate ~1500 words in markdown format with prioritized backlog items.
    `.trim()
  },
  
  {
    filename: '13-Project-Plan.md',
    title: 'Project Implementation Plan',
    category: 'planning',
    wordCountTarget: 2000,
    systemPrompt: 'You are a project manager creating a detailed implementation roadmap. CRITICAL: Follow the EXACT markdown structure specified - this will be parsed by Session 3.',
    userPromptTemplate: (ctx) => `
Generate a Project Implementation Plan for ${ctx.metadata?.projectName || 'the project'}.

# Timeline
- Start Date: ${ctx.timeline?.startDate || 'TBD'}
- Estimated Duration: ${ctx.timeline?.estimatedDuration || '8-12 weeks'}
- Target Launch: ${ctx.timeline?.targetLaunch || 'TBD'}

# Budget
- Development: ${ctx.budget?.development || 'TBD'}
- Monthly Operating: ${ctx.budget?.monthly_operating || 'TBD'}

# CRITICAL FORMAT REQUIREMENTS (for Session 3 parsing):
You MUST use this EXACT markdown structure:

## Phase 1: [Phase Name] (Weeks X-Y)

**Duration**: X weeks
**Points**: XX points

### Sprint 1 (Weeks X-Y): [Sprint Name] - XX points

**Goals**:
- Goal 1
- Goal 2

**Deliverables**:
- Deliverable 1
- Deliverable 2

**Weeks**:
- Week 1: [Description]
- Week 2: [Description]

### Sprint 2 (Weeks X-Y): [Sprint Name] - XX points

**Goals**:
- Goal 1
- Goal 2

**Weeks**:
- Week 1: [Description]
- Week 2: [Description]

## Phase 2: [Phase Name] (Weeks X-Y)

[... repeat structure ...]

# Required Content
Create 2-4 phases, each with 2-4 sprints. Each sprint should have:
- Clear goals (2-3 per sprint)
- Deliverables (2-4 per sprint)
- Week-by-week breakdown
- Point estimates (Fibonacci: 1, 2, 3, 5, 8, 13, 21)

Example phases:
- Phase 1: Foundation (database, auth, core models)
- Phase 2: Core Features (main functionality)
- Phase 3: Polish & Launch (testing, optimization, deployment)

Generate ~2000 words following the EXACT structure above. Session 3 depends on this format!
    `.trim()
  },
  
  {
    filename: '14-Team-Onboarding.md',
    title: 'Developer Onboarding Guide',
    category: 'operations',
    wordCountTarget: 1000,
    systemPrompt: 'You are a technical lead writing an onboarding guide for new developers. Be practical and comprehensive.',
    userPromptTemplate: (ctx) => `
Generate a Developer Onboarding Guide for ${ctx.metadata?.projectName || 'the project'}.

# Tech Stack
${JSON.stringify(ctx.techStack || {}, null, 2)}

# Required Sections
1. **Getting Started** - Prerequisites, account setup, access
2. **Development Environment Setup**:
   - Install dependencies
   - Environment variables
   - Database setup
   - Local development server
3. **Project Structure** - Directory layout, key files
4. **Development Workflow**:
   - Git workflow
   - Code review process
   - Testing requirements
   - Deployment process
5. **Key Concepts** - Architecture patterns, conventions
6. **Resources** - Documentation, tutorials, team contacts

Generate ~1000 words in markdown format with clear step-by-step instructions.
    `.trim()
  },
  
  // ============================================================================
  // ARCHITECTURE DOCUMENTS (3)
  // ============================================================================
  
  {
    filename: '03-Architecture.md',
    title: 'System Architecture',
    category: 'architecture',
    wordCountTarget: 1800,
    systemPrompt: 'You are a solutions architect documenting system architecture. Be technical, detailed, and include diagrams.',
    userPromptTemplate: (ctx) => `
Generate a System Architecture document for ${ctx.metadata?.projectName || 'the project'}.

# Tech Stack
${JSON.stringify(ctx.techStack || {}, null, 2)}

# Required Sections
1. **Architecture Overview** - High-level component diagram description (client → server → database)
2. **Frontend Architecture**:
   - Framework: ${ctx.techStack?.frontend || 'Not specified'}
   - Routing strategy
   - State management
   - Component structure
3. **Backend Architecture**:
   - Framework: ${ctx.techStack?.backend || 'Not specified'}
   - API design pattern (REST/GraphQL)
   - Middleware layers
   - Business logic organization
4. **Database Design**:
   - Database: ${ctx.techStack?.database || 'Not specified'}
   - Schema design principles
   - Key relationships
   - Indexing strategy
5. **Authentication & Authorization** - How users log in, how permissions work
6. **API Design Pattern** - Endpoint structure, versioning, error handling
7. **Deployment Architecture**:
   - Hosting: ${ctx.techStack?.hosting || 'Not specified'}
   - CI/CD pipeline
   - Environment setup (dev, staging, prod)
8. **Integration Points** - Third-party services, webhooks, external APIs

Generate ~1800 words in markdown with mermaid diagram descriptions where appropriate.
    `.trim()
  },
  
  {
    filename: '04-Data-and-Model-Spec.md',
    title: 'Database Schema & Data Models',
    category: 'architecture',
    wordCountTarget: 1500,
    systemPrompt: 'You are a database architect designing schema and models. Be precise with relationships and constraints.',
    userPromptTemplate: (ctx) => `
Generate a Database Schema & Data Models document for ${ctx.metadata?.projectName || 'the project'}.

# Database
${ctx.techStack?.database || 'Not specified'}

# Features (to model)
${JSON.stringify(ctx.features || [], null, 2)}

# Required Sections
1. **Entity Relationship Overview** - High-level ER diagram description
2. **Core Models** - For each entity:
   - Table name
   - Fields (name, type, constraints)
   - Relationships (one-to-many, many-to-many)
   - Indexes
3. **Key Relationships**:
   - User → Items (what users own)
   - Hierarchies (parent-child relationships)
   - Join tables (many-to-many)
4. **Data Validation Rules** - Required fields, formats, ranges
5. **Migration Strategy** - How to handle schema changes
6. **Seeding Strategy** - Initial data requirements

Generate ~1500 words in markdown format with clear model definitions.
    `.trim()
  },
  
  {
    filename: '05-API-Specification.md',
    title: 'API Endpoints & Contracts',
    category: 'architecture',
    wordCountTarget: 2000,
    systemPrompt: 'You are an API architect designing RESTful endpoints. Be precise with request/response formats.',
    userPromptTemplate: (ctx) => `
Generate an API Specification document for ${ctx.metadata?.projectName || 'the project'}.

# Backend Framework
${ctx.techStack?.backend || 'Not specified'}

# Features (to expose via API)
${JSON.stringify(ctx.features || [], null, 2)}

# Required Sections
1. **API Overview**:
   - Base URL
   - Versioning strategy (/api/v1)
   - Authentication method (JWT, session, API key)
2. **Endpoint Categories** - Group by resource (users, items, etc.)
3. **For Each Endpoint**:
   - Method (GET/POST/PUT/DELETE)
   - Path (/api/v1/users/:id)
   - Authentication required? (Y/N)
   - Request body schema (JSON)
   - Response schema (JSON)
   - Status codes (200, 201, 400, 401, 404, 500)
   - Example request
   - Example response
4. **Error Handling** - Standard error response format
5. **Rate Limiting** - Limits and throttling strategy
6. **Pagination** - How to handle large result sets

Generate ~2000 words in markdown format with clear API contracts.
    `.trim()
  },
  
  // ============================================================================
  // IMPLEMENTATION DOCUMENTS (4)
  // ============================================================================
  
  {
    filename: '06-UI-UX-Design.md',
    title: 'UI/UX Design System',
    category: 'implementation',
    wordCountTarget: 1800,
    systemPrompt: 'You are a UX designer documenting the design system. Be visual and consistent.',
    userPromptTemplate: (ctx) => `
Generate a UI/UX Design System document for ${ctx.metadata?.projectName || 'the project'}.

# Frontend Framework
${ctx.techStack?.frontend || 'Not specified'}

# Target Users
${ctx.metadata?.targetUsers || 'General users'}

# Required Sections
1. **Design Principles** - Core UX principles (simplicity, consistency, accessibility)
2. **Color Palette**:
   - Primary colors
   - Secondary colors
   - Semantic colors (success, error, warning, info)
3. **Typography**:
   - Font families
   - Heading styles (H1-H6)
   - Body text styles
4. **Component Library**:
   - Buttons (primary, secondary, outline, text)
   - Forms (inputs, selects, checkboxes, radio)
   - Cards, modals, tooltips
   - Navigation (navbar, sidebar, breadcrumbs)
5. **Layout Patterns** - Grid system, spacing, responsive breakpoints
6. **Accessibility** - WCAG 2.1 AA compliance, keyboard navigation
7. **User Flows** - Key user journeys (signup, login, main tasks)

Generate ~1800 words in markdown format with visual descriptions.
    `.trim()
  },
  
  {
    filename: '07-Authentication-Security.md',
    title: 'Authentication & Security',
    category: 'implementation',
    wordCountTarget: 1500,
    systemPrompt: 'You are a security engineer designing authentication and security patterns. Be thorough and follow best practices.',
    userPromptTemplate: (ctx) => `
Generate an Authentication & Security document for ${ctx.metadata?.projectName || 'the project'}.

# Tech Stack
${JSON.stringify(ctx.techStack || {}, null, 2)}

# Required Sections
1. **Authentication Strategy**:
   - Method (JWT, session, OAuth)
   - Registration flow
   - Login flow
   - Password reset flow
2. **Authorization Model**:
   - Roles (admin, user, guest)
   - Permissions
   - Resource access control
3. **Security Best Practices**:
   - Password hashing (bcrypt, argon2)
   - JWT security (secret management, expiration)
   - HTTPS enforcement
   - CSRF protection
   - XSS prevention
   - SQL injection prevention
4. **Session Management**:
   - Session storage
   - Timeout policy
   - Logout handling
5. **API Security**:
   - API key management
   - Rate limiting
   - Request validation
6. **Security Checklist** - Pre-deployment security verification

Generate ~1500 words in markdown format with security implementation details.
    `.trim()
  },
  
  {
    filename: '08-Testing-Strategy.md',
    title: 'Testing Approach & Coverage',
    category: 'implementation',
    wordCountTarget: 1500,
    systemPrompt: 'You are a QA engineer designing a comprehensive testing strategy. Be methodical and cover all testing types.',
    userPromptTemplate: (ctx) => `
Generate a Testing Strategy document for ${ctx.metadata?.projectName || 'the project'}.

# Tech Stack
${JSON.stringify(ctx.techStack || {}, null, 2)}

# Required Sections
1. **Testing Philosophy** - Approach, coverage goals (80%+), when to test
2. **Unit Testing**:
   - Framework (Jest, Vitest, Mocha)
   - What to test (business logic, utilities)
   - Mocking strategy
3. **Integration Testing**:
   - API endpoint testing
   - Database integration testing
   - Third-party service mocking
4. **End-to-End Testing**:
   - Framework (Playwright, Cypress)
   - Critical user flows to test
   - Test data management
5. **Testing Best Practices**:
   - Test structure (Arrange-Act-Assert)
   - Test isolation
   - Test naming conventions
   - CI/CD integration
6. **Manual Testing** - When needed, checklist
7. **Performance Testing** - Load testing, stress testing

Generate ~1500 words in markdown format with testing implementation details.
    `.trim()
  },
  
  {
    filename: '15-Maintenance-Guide.md',
    title: 'Maintenance & Support Guide',
    category: 'operations',
    wordCountTarget: 1000,
    systemPrompt: 'You are a DevOps engineer writing a maintenance guide. Be practical and cover common scenarios.',
    userPromptTemplate: (ctx) => `
Generate a Maintenance & Support Guide for ${ctx.metadata?.projectName || 'the project'}.

# Tech Stack
${JSON.stringify(ctx.techStack || {}, null, 2)}

# Required Sections
1. **Routine Maintenance**:
   - Database backups
   - Log rotation
   - Dependency updates
   - Security patches
2. **Monitoring & Alerts**:
   - What to monitor
   - Alert thresholds
   - On-call procedures
3. **Common Issues**:
   - Issue: [Problem]
   - Diagnosis: [How to identify]
   - Solution: [How to fix]
4. **Scaling Guidelines**:
   - When to scale
   - How to scale (vertical vs horizontal)
   - Performance bottlenecks
5. **Backup & Recovery**:
   - Backup strategy
   - Recovery procedures
   - Disaster recovery plan
6. **Support Workflow** - How to handle user issues

Generate ~1000 words in markdown format with practical maintenance procedures.
    `.trim()
  },
  
  // ============================================================================
  // OPERATIONS DOCUMENTS (3)
  // ============================================================================
  
  {
    filename: '09-Deployment-Guide.md',
    title: 'Deployment & Infrastructure',
    category: 'operations',
    wordCountTarget: 1500,
    systemPrompt: 'You are a DevOps engineer writing a deployment guide. Be step-by-step and comprehensive.',
    userPromptTemplate: (ctx) => `
Generate a Deployment Guide for ${ctx.metadata?.projectName || 'the project'}.

# Tech Stack
- Hosting: ${ctx.techStack?.hosting || 'Not specified'}
- Frontend: ${ctx.techStack?.frontend || 'Not specified'}
- Backend: ${ctx.techStack?.backend || 'Not specified'}
- Database: ${ctx.techStack?.database || 'Not specified'}

# Required Sections
1. **Infrastructure Overview**:
   - Hosting provider (${ctx.techStack?.hosting || 'TBD'})
   - Services used (compute, database, storage, CDN)
   - Environment setup (dev, staging, production)
2. **Deployment Process**:
   - Build process
   - Environment variables
   - Database migrations
   - Asset compilation
   - Deployment command
3. **CI/CD Pipeline**:
   - Git workflow (feature branch → PR → merge → deploy)
   - Automated testing
   - Deployment automation
   - Rollback strategy
4. **Environment Configuration**:
   - Development setup
   - Staging setup
   - Production setup
   - Secrets management
5. **Deployment Checklist** - Pre-deployment verification
6. **Rollback Procedure** - How to revert a bad deployment

Generate ~1500 words in markdown format with step-by-step deployment instructions.
    `.trim()
  },
  
  {
    filename: '10-Monitoring-Logging.md',
    title: 'Monitoring & Observability',
    category: 'operations',
    wordCountTarget: 1200,
    systemPrompt: 'You are an SRE engineer designing monitoring and logging strategy. Be proactive and metrics-driven.',
    userPromptTemplate: (ctx) => `
Generate a Monitoring & Logging document for ${ctx.metadata?.projectName || 'the project'}.

# Tech Stack
${JSON.stringify(ctx.techStack || {}, null, 2)}

# Required Sections
1. **Monitoring Strategy**:
   - What to monitor (uptime, performance, errors, usage)
   - Monitoring tools (Prometheus, Grafana, Datadog, New Relic)
   - Alert thresholds
2. **Key Metrics**:
   - Application metrics (response time, throughput, error rate)
   - Infrastructure metrics (CPU, memory, disk, network)
   - Business metrics (signups, conversions, revenue)
3. **Logging Strategy**:
   - Log levels (ERROR, WARN, INFO, DEBUG)
   - Log format (structured JSON)
   - Log aggregation (ELK, Loki, CloudWatch)
   - Log retention policy
4. **Alerting**:
   - Critical alerts (downtime, high error rate)
   - Warning alerts (slow response, high CPU)
   - Alert channels (email, Slack, PagerDuty)
5. **Dashboards**:
   - System health dashboard
   - Performance dashboard
   - Business metrics dashboard
6. **Incident Response** - What to do when alerts fire

Generate ~1200 words in markdown format with monitoring best practices.
    `.trim()
  },
  
  {
    filename: '11-Performance-Optimization.md',
    title: 'Performance Best Practices',
    category: 'operations',
    wordCountTarget: 1200,
    systemPrompt: 'You are a performance engineer optimizing application performance. Be data-driven and practical.',
    userPromptTemplate: (ctx) => `
Generate a Performance Optimization document for ${ctx.metadata?.projectName || 'the project'}.

# Tech Stack
${JSON.stringify(ctx.techStack || {}, null, 2)}

# Required Sections
1. **Performance Goals**:
   - Page load time (< 2 seconds)
   - API response time (< 200ms)
   - Time to interactive (< 3 seconds)
2. **Frontend Optimization**:
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching strategy
   - CDN usage
3. **Backend Optimization**:
   - Database query optimization
   - Caching (Redis, Memcached)
   - Connection pooling
   - Async processing
4. **Database Optimization**:
   - Indexing strategy
   - Query optimization
   - Connection pooling
   - Read replicas
5. **Monitoring Performance**:
   - Profiling tools
   - Performance metrics
   - Bottleneck identification
6. **Optimization Checklist** - Pre-launch performance verification

Generate ~1200 words in markdown format with actionable optimization strategies.
    `.trim()
  }
];

/**
 * Get prompt for a specific document by filename
 */
export function getDocumentPrompt(filename: string): DocumentPrompt | undefined {
  return DOCUMENT_PROMPTS.find(p => p.filename === filename);
}

/**
 * Get all prompts by category
 */
export function getDocumentPromptsByCategory(category: DocumentPrompt['category']): DocumentPrompt[] {
  return DOCUMENT_PROMPTS.filter(p => p.category === category);
}

/**
 * Get total estimated word count for all documents
 */
export function getTotalEstimatedWords(): number {
  return DOCUMENT_PROMPTS.reduce((sum, p) => sum + p.wordCountTarget, 0);
}
