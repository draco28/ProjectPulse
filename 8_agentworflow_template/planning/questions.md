# Planning Questions Library

This library contains structured question patterns for the project-planner agent to use when guiding users through the 10-phase planning process.

---

## Phase 1: Product Manager Phase

### 1.1 User Personas

**Question 1: Primary User Identification**

```
Who is your primary target user for this project?

Consider:
- What type of person or role (e.g., students, developers, business owners)
- What level of experience they have
- What problems they're trying to solve
```

**Question 2: Demographics & Context**

```
For each persona, describe:
- Age range and background
- Current skill level with relevant technologies
- Goals they want to achieve
- Pain points they experience
- Daily context (when/where/how they'd use this)
```

**Question 3: User Motivation**

```
What motivates this user to use your solution?
- What are they trying to accomplish?
- What alternatives are they currently using?
- Why would they switch to your solution?
```

**Output Format**: Create 2-3 detailed personas following the template structure

---

### 1.2 Core Features & Scope

**Question 1: Problem Statement**

```
What is the ONE core problem this project solves?

Be specific - avoid generic statements. Instead of "help users learn", say "reduce tutorial creation time from 10 hours to 30 minutes"
```

**Question 2: Must-Have Features**

```
What are the 3-5 features that MUST exist for this to be useful?

For each feature, answer:
- What does it do?
- Why is it essential (not just nice-to-have)?
- What happens if we don't include it?
```

**Question 3: Scope Boundaries**

```
What will this project explicitly NOT do?

Define boundaries:
- Features you considered but excluded (and why)
- Use cases you won't support initially
- Integrations you won't build yet
```

**Output Format**: List of core features with clear boundaries

---

### 1.3 MVP User Stories

**Question 1: Critical User Flows**

```
What are the 3-5 critical user flows for MVP?

For each flow, describe:
- What the user wants to do
- What steps they take
- What they see/get as a result
```

**Question 2: Story Format**

```
For each user flow, write a user story in this format:

As a [persona name],
I want to [action],
So that [benefit/outcome],
Acceptance Criteria:
- [specific, testable criteria]
- [specific, testable criteria]
```

**Question 3: Story Prioritization**

```
Which stories are P0 (must have for MVP)?
Which stories are P1 (important but can wait)?
Which stories are P2 (nice to have)?
```

**Output Format**: Prioritized list of user stories with acceptance criteria

---

### 1.4 Post-MVP Roadmap

**Question 1: Future Enhancements**

```
What features would you add after MVP launch?

Consider:
- Features users have requested
- Competitive features you want to match
- Innovative features that differentiate you
```

**Question 2: Scalability Needs**

```
What scalability challenges do you anticipate?
- How many users in 6 months? 12 months?
- What performance requirements will emerge?
- What integrations will users request?
```

**Question 3: Timeline Estimation**

```
When would you add each post-MVP feature?
- Month 1-3 after launch
- Month 4-6 after launch
- Month 7-12 after launch
```

**Output Format**: Phased roadmap with timeline estimates

---

## Phase 2: Strategic Planning

### 2.1 Tech Stack Selection

**Question 1: Technical Constraints**

```
What technical constraints do you have?
- Team expertise (what technologies does your team know?)
- Budget constraints (hosting costs, API costs, etc.)
- Performance requirements (response time, concurrent users)
- Compliance requirements (GDPR, HIPAA, etc.)
```

**Question 2: Stack Preferences**

```
Do you have preferences for:
- Frontend framework (React, Vue, Svelte, etc.)?
- Backend framework (Node.js, Python, Go, etc.)?
- Database (PostgreSQL, MongoDB, MySQL, etc.)?
- Hosting platform (Vercel, AWS, Railway, etc.)?

If yes, why? If no, what factors should guide the choice?
```

**Question 3: Cost Analysis**

```
What is your monthly budget for:
- Hosting/infrastructure
- API costs (AI, payment processing, etc.)
- Database costs
- Third-party services

What cost-per-user target do you have?
```

**Output Format**: Tech stack with cost justification

---

### 2.2 Cost Analysis & Budgeting

**Question 1: Development Budget**

```
What is your total development budget?
- Developer time cost (hours × rate)
- Tool/service subscriptions during development
- Testing/QA resources
```

**Question 2: Operational Budget**

```
What ongoing monthly costs are acceptable?
- Infrastructure (hosting, database, CDN)
- APIs and third-party services
- Monitoring and analytics
- Support and maintenance
```

**Question 3: Revenue Model**

```
How will this project generate revenue (if applicable)?
- Subscription pricing
- Usage-based pricing
- One-time purchases
- Freemium model
- Other monetization
```

**Output Format**: Detailed cost breakdown with ROI analysis

---

### 2.3 Development Timeline

**Question 1: Target Launch Date**

```
When do you want to launch MVP?
- Specific date (if fixed deadline)
- Or time range (e.g., "within 3 months")

What drives this timeline?
- Market opportunity
- Competition
- Funding runway
- Other factors
```

**Question 2: Phase Breakdown**

```
How should we split the timeline?

Example:
- Phase 1 (Planning): X weeks
- Phase 2 (Backend): X weeks
- Phase 3 (Frontend): X weeks
- Phase 4 (Testing): X weeks
- Phase 5 (Deployment): X weeks
```

**Question 3: Resource Availability**

```
How much time can you dedicate?
- Hours per week
- Full-time vs part-time
- Team size (solo or multiple developers)
```

**Output Format**: Detailed timeline with milestones

---

### 2.4 Risk Assessment

**Question 1: Technical Risks**

```
What technical risks concern you?
- Unproven technologies
- Complex integrations
- Performance challenges
- Scalability issues
```

**Question 2: Business Risks**

```
What business risks exist?
- Market competition
- User adoption challenges
- Monetization uncertainty
- Regulatory changes
```

**Question 3: Mitigation Strategies**

```
For each major risk, what's your mitigation plan?
- How will you detect the risk early?
- What backup plan do you have?
- What's the acceptable risk level?
```

**Output Format**: Risk matrix with mitigation plans

---

## Phase 3: UX/UI Design Phase

### 3.1 User Flow Diagrams

**Question 1: Primary User Journeys**

```
What are the 3-5 primary user journeys?

For each journey, map:
1. Entry point (how user arrives)
2. Steps they take
3. Decisions they make
4. Success outcome
```

**Question 2: Error Flows**

```
What happens when things go wrong?
- Invalid input handling
- Network errors
- Authentication failures
- Data not found scenarios
```

**Output Format**: Flow diagrams for each major journey

---

### 3.2 Wireframes

**Question 1: Key Screens**

```
What are the 5-10 most important screens?

List them in user journey order:
- Landing/home page
- Authentication screens
- Main dashboard/workspace
- Key feature screens
- Settings/profile
```

**Question 2: Layout Preferences**

```
What layout style fits your project?
- Traditional navigation (header + sidebar)
- Modern app style (tab bar, floating actions)
- Minimalist (content-focused, hidden navigation)
- Dashboard style (widgets, cards, panels)
```

**Output Format**: Wireframe descriptions or sketches

---

### 3.3 Component Library Selection

**Question 1: Design System**

```
Will you use an existing design system?
- Material UI
- shadcn/ui
- Ant Design
- Chakra UI
- Custom design system

Why this choice?
```

**Question 2: Customization Needs**

```
How much customization do you need?
- Use components as-is (faster development)
- Light theming (colors, fonts)
- Heavy customization (unique design)
```

**Output Format**: Component library choice with customization plan

---

### 3.4 Design Tokens & Theming

**Question 1: Brand Colors**

```
What are your primary brand colors?
- Primary color (main brand color)
- Secondary color (accents)
- Neutral colors (backgrounds, text)
- Semantic colors (success, error, warning)

If unsure, what mood/feeling should the design convey?
```

**Question 2: Typography**

```
What typography style fits your project?
- Modern/clean (sans-serif like Inter, Roboto)
- Traditional/formal (serif like Merriweather)
- Playful (rounded fonts like Quicksand)
- Technical (monospace for code-heavy apps)
```

**Question 3: Dark Mode**

```
Will you support dark mode?
- Yes, required from launch
- Yes, but post-MVP
- No, not needed

If yes, which is default?
```

**Output Format**: Design tokens specification

---

## Phase 4: System Architecture Phase

### 4.1 Database Schema

**Question 1: Core Entities**

```
What are your core data entities?

For each entity, identify:
- What it represents
- What data it stores
- How it relates to other entities
```

**Question 2: Relationships**

```
How do entities relate?
- One-to-many relationships (user → tutorials)
- Many-to-many relationships (tutorials ↔ tags)
- Self-referential relationships (user → user for follows)
```

**Question 3: Data Access Patterns**

```
How will you query this data?
- Most common queries
- Performance-critical queries
- Queries that need optimization (joins, filters)
```

**Output Format**: Database schema with relationships

---

### 4.2 API Design

**Question 1: API Endpoints**

```
What API endpoints do you need?

For each feature, list:
- Endpoint path (e.g., POST /api/tutorials)
- What data it receives
- What data it returns
- Who can access it (authentication/authorization)
```

**Question 2: API Style**

```
What API style fits your needs?
- RESTful (standard CRUD operations)
- GraphQL (flexible queries)
- tRPC (type-safe, TypeScript-first)
- Mix of styles
```

**Question 3: Real-time Needs**

```
Do you need real-time updates?
- WebSockets for live data
- Server-sent events for notifications
- Polling for periodic updates
- No real-time needed
```

**Output Format**: API specification with endpoints

---

### 4.3 Authentication & Authorization

**Question 1: Auth Strategy**

```
How will users authenticate?
- Email/password
- Social OAuth (Google, GitHub, etc.)
- Magic links (passwordless)
- Mix of methods
```

**Question 2: Authorization Model**

```
What authorization model do you need?
- Simple: Logged in vs logged out
- Role-based: User roles (admin, user, etc.)
- Permission-based: Fine-grained permissions
- Row-level: Users only see their own data
```

**Question 3: Session Management**

```
How will you manage sessions?
- JWT tokens
- Session cookies
- Database sessions
- Third-party auth service (Supabase, Auth0, etc.)
```

**Output Format**: Auth/authz strategy

---

### 4.4 Caching Strategy

**Question 1: Caching Needs**

```
What data should be cached?
- Static content (rarely changes)
- User-specific data (personalized)
- API responses (expensive to generate)
- Database queries (frequently accessed)
```

**Question 2: Cache Infrastructure**

```
What caching infrastructure will you use?
- CDN (Vercel, Cloudflare)
- Application cache (Redis, Memcached)
- Browser cache (service workers)
- Database query cache
```

**Question 3: Cache Invalidation**

```
How will you invalidate cache?
- Time-based (TTL)
- Event-based (on data update)
- Manual invalidation
```

**Output Format**: Caching strategy with TTL values

---

### 4.5 External Integrations

**Question 1: Required Integrations**

```
What external services do you need?
- Payment processing (Stripe, PayPal)
- Email service (SendGrid, Resend)
- AI APIs (OpenAI, Anthropic, Z.ai)
- Analytics (PostHog, Mixpanel)
- Other services
```

**Question 2: Integration Patterns**

```
How will you integrate each service?
- Direct API calls
- SDK/library
- Webhook listeners
- Background jobs/queues
```

**Output Format**: Integration list with implementation approach

---

## Phase 5: DevOps Local Setup

### 5.1 Development Environment

**Question 1: Required Tools**

```
What tools does your team need?
- Code editor (VS Code, WebStorm, etc.)
- Database tools (Supabase Studio, pgAdmin, etc.)
- API testing (Postman, Insomnia, etc.)
- Version control (Git)
```

**Question 2: Environment Variables**

```
What environment variables are needed?
- Database connection strings
- API keys
- Feature flags
- Environment-specific settings
```

**Output Format**: Dev environment setup checklist

---

### 5.2 Local Database Setup

**Question 1: Database Choice**

```
What database will you use locally?
- Same as production (Docker container)
- Lightweight alternative (SQLite)
- Cloud development database
```

**Question 2: Seed Data**

```
What seed data do you need for development?
- Test users
- Sample content
- Reference data
```

**Output Format**: Database setup instructions

---

## Phase 6: Backend Development

### 6.1 API Implementation

**Question 1: Implementation Order**

```
In what order should we implement API endpoints?
- Start with authentication
- Then core features
- Then supporting features
- Finally admin/utility endpoints
```

**Question 2: Testing Strategy**

```
How will you test APIs?
- Unit tests for business logic
- Integration tests for endpoints
- E2E tests for full flows
```

**Output Format**: Implementation plan with testing

---

### 6.2 Database Migrations

**Question 1: Migration Tool**

```
What migration tool will you use?
- Prisma migrations
- Supabase migrations
- Knex migrations
- Custom migration scripts
```

**Output Format**: Migration strategy

---

## Phase 7: Frontend Development

### 7.1 Component Implementation

**Question 1: Component Strategy**

```
How will you structure components?
- Atomic design (atoms, molecules, organisms)
- Feature-based (by page/feature)
- Hybrid approach
```

**Question 2: State Management**

```
How will you manage application state?
- React Context
- Zustand
- Redux
- TanStack Query (for server state)
- No state management library
```

**Output Format**: Component architecture plan

---

### 7.2 Form Handling

**Question 1: Form Library**

```
Will you use a form library?
- React Hook Form
- Formik
- No library (native forms)

Why this choice?
```

**Output Format**: Form handling strategy

---

## Phase 8: QA & Testing

### 8.1 Testing Strategy

**Question 1: Test Coverage Goals**

```
What test coverage do you want?
- Critical paths: 100%
- Business logic: 80%+
- UI components: 50%+
- Overall: X%
```

**Question 2: Testing Tools**

```
What testing tools will you use?
- Unit tests (Vitest, Jest)
- Integration tests (Supertest, Testing Library)
- E2E tests (Playwright, Cypress)
```

**Output Format**: Testing strategy with coverage goals

---

### 8.2 Performance Testing

**Question 1: Performance Targets**

```
What are your performance targets?
- Page load time (< X seconds)
- API response time (< X ms)
- Time to interactive (< X seconds)
```

**Output Format**: Performance benchmarks

---

## Phase 9: Production Deployment

### 9.1 Hosting Selection

**Question 1: Hosting Platform**

```
Where will you host?
- Frontend: Vercel, Netlify, Cloudflare Pages
- Backend: Railway, Render, AWS, Fly.io
- Database: Supabase, PlanetScale, AWS RDS

Why these choices?
```

**Question 2: Deployment Strategy**

```
How will you deploy?
- Git-based (push to deploy)
- CI/CD pipeline
- Manual deployment
```

**Output Format**: Deployment plan

---

### 9.2 Monitoring & Logging

**Question 1: Monitoring Tools**

```
What will you monitor?
- Application performance (response times, errors)
- Infrastructure (CPU, memory, disk)
- User analytics (usage patterns)
```

**Question 2: Logging Strategy**

```
What will you log?
- Error logs (always)
- Access logs (requests/responses)
- Business events (user actions)
- Debug logs (development only)
```

**Output Format**: Monitoring and logging setup

---

## Phase 10: Security Audit

### 10.1 Security Checklist

**Question 1: Authentication Security**

```
Have you implemented:
- Password hashing (bcrypt, Argon2)
- Rate limiting on auth endpoints
- CSRF protection
- Secure session management
```

**Question 2: Data Security**

```
Have you implemented:
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- File upload validation (if applicable)
```

**Question 3: Infrastructure Security**

```
Have you configured:
- HTTPS/TLS certificates
- Security headers (CSP, HSTS, etc.)
- Environment variable protection
- Database connection encryption
```

**Output Format**: Security audit checklist

---

## Using This Question Library

### For the Planning Agent:

1. **Phase-by-Phase Flow**: Work through phases sequentially (1 → 10)
2. **Question Selection**: Ask relevant questions based on project type
3. **Adaptive Questioning**: Skip questions if answer is obvious from context
4. **Capture Decisions**: Document all answers in PLANNING_PHASES.md
5. **Validation**: Ensure each phase is complete before moving to next

### Question Flow Example:

```
Agent: "Let's start with Phase 1: Product Manager Phase. First, I need to understand your target users."

Agent: [Asks Question 1.1.1 - Primary User Identification]
User: [Provides answer]

Agent: "Great! Now let's dive deeper into their context..."
Agent: [Asks Question 1.1.2 - Demographics & Context]
User: [Provides answer]

Agent: "I see. What motivates them to use your solution?"
Agent: [Asks Question 1.1.3 - User Motivation]
User: [Provides answer]

Agent: "Perfect! I've documented your first persona. Let's create the second one..."
[Repeat questions for Persona 2]

Agent: "Excellent! We've defined 2 personas. Moving to section 1.2: Core Features & Scope..."
```

### Adaptation Guidelines:

- **Simple projects**: Skip detailed questions, use high-level summaries
- **Complex projects**: Ask all questions, request detailed answers
- **SaaS projects**: Emphasize Phase 2 (cost analysis) and Phase 10 (security)
- **Internal tools**: Simplify Phase 1 (personas) and Phase 7 (UI)
- **MVPs**: Focus on P0 stories, defer post-MVP planning

### Output Quality Checklist:

For each phase, ensure:

- [ ] All subsections have content (no "TO BE DEFINED")
- [ ] Decisions are specific (not vague/generic)
- [ ] Rationale is documented (why this choice?)
- [ ] Trade-offs are considered (what alternatives were rejected?)
- [ ] Status is updated (⏸️ → ⏳ → ✅)
