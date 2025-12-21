/**
 * Seed file for Onboarding Questions (Sprint 8.6 - Session 1)
 *
 * 10 Phases of Strategic Planning Questions
 * Total: 98 questions across 10 phases
 *
 * Based on: .agent/task/3-session-onboarding-REFERENCE.md
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QuestionData {
  phase: number;
  subsection: string;
  questionNumber: number;
  questionText: string;
  placeholder?: string;
  helpText?: string;
  validationType?: string;
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
}

const questions: QuestionData[] = [
  // ========================================================================
  // PHASE 1: PRODUCT MANAGER - FOUNDATION (11 questions)
  // ========================================================================

  // 1.1 User Personas (3 questions)
  {
    phase: 1,
    subsection: '1.1 User Personas',
    questionNumber: 1,
    questionText: 'Who are the primary users of your product?',
    placeholder: 'e.g., Solo developers, small dev teams (2-5 people), CTOs at startups',
    helpText: 'Be specific about demographics, roles, and company sizes',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 1,
    subsection: '1.1 User Personas',
    questionNumber: 2,
    questionText: 'What are their demographics, behaviors, and pain points?',
    placeholder:
      'e.g., Ages 25-45, work remotely, struggle with manual task tracking and context switching',
    validationType: 'text',
    minLength: 20,
    maxLength: 1000,
  },
  {
    phase: 1,
    subsection: '1.1 User Personas',
    questionNumber: 3,
    questionText: 'What would success look like for your users?',
    placeholder:
      'e.g., Save 10+ hours per week on manual tracking, achieve 80% task completion rate',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // 1.2 Core Features & Scope (3 questions)
  {
    phase: 1,
    subsection: '1.2 Core Features & Scope',
    questionNumber: 1,
    questionText: 'What are the 3-5 core features of your product?',
    placeholder:
      'e.g., 1) AI task tracking, 2) Progress visualization, 3) Agent integration, 4) Roadmap planning',
    validationType: 'text',
    minLength: 20,
    maxLength: 1000,
  },
  {
    phase: 1,
    subsection: '1.2 Core Features & Scope',
    questionNumber: 2,
    questionText: 'What features are explicitly OUT of scope for MVP?',
    placeholder: 'e.g., Mobile app, team collaboration, payment processing, analytics dashboard',
    validationType: 'text',
    maxLength: 1000,
  },
  {
    phase: 1,
    subsection: '1.2 Core Features & Scope',
    questionNumber: 3,
    questionText: 'What makes your product different from alternatives?',
    placeholder: 'e.g., AI-native design, agent-first workflow, local-first data storage',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // 1.3 MVP User Stories (3 questions)
  {
    phase: 1,
    subsection: '1.3 MVP User Stories',
    questionNumber: 1,
    questionText:
      'List 5-10 critical user stories for MVP (format: "As a [user], I want to [action] so that [benefit]")',
    placeholder:
      'e.g., As a developer, I want to see my current task so that I know what to work on next',
    validationType: 'text',
    minLength: 50,
    maxLength: 2000,
  },
  {
    phase: 1,
    subsection: '1.3 MVP User Stories',
    questionNumber: 2,
    questionText: 'Which user story is the most critical (North Star)?',
    placeholder:
      'e.g., As a developer, I want AI to auto-update task progress so that I never manually track status',
    validationType: 'text',
    minLength: 20,
    maxLength: 500,
  },
  {
    phase: 1,
    subsection: '1.3 MVP User Stories',
    questionNumber: 3,
    questionText: 'What user stories can be deferred to v2?',
    placeholder: 'e.g., Team collaboration features, mobile app, integrations with Jira/Linear',
    validationType: 'text',
    maxLength: 1000,
  },

  // 1.4 Roadmap Planning (2 questions)
  {
    phase: 1,
    subsection: '1.4 Roadmap Planning',
    questionNumber: 1,
    questionText: 'What are your top 3 priorities for MVP?',
    placeholder: 'e.g., 1) Core task tracking, 2) AI agent integration, 3) Basic UI/UX',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 1,
    subsection: '1.4 Roadmap Planning',
    questionNumber: 2,
    questionText: 'What features do you envision for post-MVP (6 months after launch)?',
    placeholder:
      'e.g., Team collaboration, mobile app, advanced analytics, marketplace integrations',
    validationType: 'text',
    maxLength: 1000,
  },

  // ========================================================================
  // PHASE 2: STRATEGIC PLANNING - BUSINESS & TECH (10 questions)
  // ========================================================================

  // 2.1 Tech Stack Selection (3 questions)
  {
    phase: 2,
    subsection: '2.1 Tech Stack Selection',
    questionNumber: 1,
    questionText: 'What tech stack are you considering? (e.g., Next.js + Supabase, T3 Stack, MERN)',
    placeholder: 'e.g., Next.js 14 + PostgreSQL + Prisma + Vercel',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 2,
    subsection: '2.1 Tech Stack Selection',
    questionNumber: 2,
    questionText: 'Do you have any constraints? (e.g., must use PostgreSQL, must deploy to AWS)',
    placeholder: 'e.g., Must use PostgreSQL for data integrity, prefer serverless for cost savings',
    validationType: 'text',
    maxLength: 1000,
  },
  {
    phase: 2,
    subsection: '2.1 Tech Stack Selection',
    questionNumber: 3,
    questionText: 'Do you need real-time features? (WebSockets, Server-Sent Events, polling)',
    placeholder: 'e.g., Yes, need real-time task updates via WebSockets for agent communication',
    validationType: 'text',
    maxLength: 500,
  },

  // 2.2 Cost Analysis (2 questions)
  {
    phase: 2,
    subsection: '2.2 Cost Analysis',
    questionNumber: 1,
    questionText: 'What is your estimated monthly active users (MAU) for MVP?',
    placeholder: 'e.g., 100-500 MAU in first 3 months, 1K-5K by month 6',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 2,
    subsection: '2.2 Cost Analysis',
    questionNumber: 2,
    questionText: 'What is your budget for infrastructure costs during MVP phase?',
    placeholder: 'e.g., $50-200/month for hosting, database, and AI API calls',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },

  // 2.3 Timeline & Milestones (3 questions)
  {
    phase: 2,
    subsection: '2.3 Timeline & Milestones',
    questionNumber: 1,
    questionText: 'When do you want to launch MVP?',
    placeholder: 'e.g., 3 months from now, Q1 2025, ASAP (within 6 weeks)',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 2,
    subsection: '2.3 Timeline & Milestones',
    questionNumber: 2,
    questionText: 'Are you building solo or with a team?',
    placeholder: 'e.g., Solo developer, 2-person team (1 frontend + 1 backend), 5-person startup',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 2,
    subsection: '2.3 Timeline & Milestones',
    questionNumber: 3,
    questionText: 'How many hours per week can you dedicate to development?',
    placeholder: 'e.g., 20 hours/week (side project), 40+ hours/week (full-time)',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },

  // 2.4 Risk Assessment (2 questions)
  {
    phase: 2,
    subsection: '2.4 Risk Assessment',
    questionNumber: 1,
    questionText: 'What are the biggest technical risks for this project?',
    placeholder:
      'e.g., AI integration complexity, real-time sync reliability, database performance at scale',
    validationType: 'text',
    minLength: 10,
    maxLength: 1000,
  },
  {
    phase: 2,
    subsection: '2.4 Risk Assessment',
    questionNumber: 2,
    questionText:
      'What dependencies or integrations are critical? (e.g., Stripe, OpenAI, SendGrid)',
    placeholder:
      'e.g., OpenAI for AI features, GitHub API for repo integration, Stripe for payments',
    validationType: 'text',
    maxLength: 1000,
  },

  // ========================================================================
  // PHASE 3: UX/UI DESIGN - USER EXPERIENCE (9 questions)
  // ========================================================================

  // 3.1 User Flows (3 questions)
  {
    phase: 3,
    subsection: '3.1 User Flows',
    questionNumber: 1,
    questionText: 'Describe the primary user flow (from landing to value delivery)',
    placeholder:
      'e.g., User signs up → Connects repo → AI creates initial roadmap → User starts first task → AI tracks progress',
    validationType: 'text',
    minLength: 20,
    maxLength: 1000,
  },
  {
    phase: 3,
    subsection: '3.1 User Flows',
    questionNumber: 2,
    questionText: 'What onboarding experience do you envision?',
    placeholder:
      'e.g., 3-step wizard: 1) Project setup, 2) Tech stack selection, 3) Initial roadmap generation',
    validationType: 'text',
    minLength: 10,
    maxLength: 1000,
  },
  {
    phase: 3,
    subsection: '3.1 User Flows',
    questionNumber: 3,
    questionText: 'What is the "aha moment" for your users?',
    placeholder: 'e.g., When AI automatically updates their task progress for the first time',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // 3.2 Wireframes & Layout (3 questions)
  {
    phase: 3,
    subsection: '3.2 Wireframes & Layout',
    questionNumber: 1,
    questionText: 'Do you have wireframes or mockups? (attach images or describe layouts)',
    placeholder:
      'e.g., Yes, Figma designs attached. Main layout: sidebar + kanban board + right panel for task details',
    validationType: 'text',
    isRequired: false,
    maxLength: 1000,
  },
  {
    phase: 3,
    subsection: '3.2 Wireframes & Layout',
    questionNumber: 2,
    questionText: 'What pages are essential for MVP? (e.g., landing, dashboard, settings)',
    placeholder:
      'e.g., Dashboard (main view), Roadmap page, Task detail page, Settings, Onboarding wizard',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 3,
    subsection: '3.2 Wireframes & Layout',
    questionNumber: 3,
    questionText:
      'What design system or component library do you prefer? (shadcn/ui, Material UI, custom)',
    placeholder:
      'e.g., shadcn/ui for rapid development, custom neumorphic design for differentiation',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },

  // 3.3 Component Library (3 questions)
  {
    phase: 3,
    subsection: '3.3 Component Library',
    questionNumber: 1,
    questionText: 'What UI components are needed? (tables, forms, modals, charts, etc.)',
    placeholder:
      'e.g., Kanban boards, data tables, forms with validation, modals, charts for analytics',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 3,
    subsection: '3.3 Component Library',
    questionNumber: 2,
    questionText: 'What accessibility standards must you meet? (WCAG 2.1 AA, Section 508)',
    placeholder: 'e.g., WCAG 2.1 AA for keyboard navigation and screen readers',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 3,
    subsection: '3.3 Component Library',
    questionNumber: 3,
    questionText: 'What browsers/devices must you support? (Chrome-only MVP vs cross-browser)',
    placeholder: 'e.g., Chrome/Firefox/Safari on desktop, mobile-responsive but desktop-first',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },

  // ========================================================================
  // PHASE 4: SYSTEM ARCHITECTURE - TECHNICAL FOUNDATION (12 questions)
  // ========================================================================

  // 4.1 Database Design (3 questions)
  {
    phase: 4,
    subsection: '4.1 Database Design',
    questionNumber: 1,
    questionText: 'What are your core data models? (e.g., User, Project, Task)',
    placeholder: 'e.g., User, Project, Phase, Sprint, Week, Day, Task, Session, Issue',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 4,
    subsection: '4.1 Database Design',
    questionNumber: 2,
    questionText: 'What are the key relationships? (one-to-many, many-to-many)',
    placeholder:
      'e.g., Project has many Phases (1:N), Phase has many Sprints (1:N), Task belongs to Day (N:1)',
    validationType: 'text',
    minLength: 10,
    maxLength: 1000,
  },
  {
    phase: 4,
    subsection: '4.1 Database Design',
    questionNumber: 3,
    questionText: 'Do you need multi-tenancy? (workspaces, organizations)',
    placeholder: 'e.g., Yes, project-scoped data isolation. No, single-user MVP',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },

  // 4.2 API Design (3 questions)
  {
    phase: 4,
    subsection: '4.2 API Design',
    questionNumber: 1,
    questionText: 'Will you use REST, GraphQL, or tRPC?',
    placeholder: 'e.g., REST for simplicity, tRPC for type-safety, GraphQL for flexibility',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 4,
    subsection: '4.2 API Design',
    questionNumber: 2,
    questionText: 'What are the key API endpoints? (CRUD operations, custom actions)',
    placeholder:
      'e.g., GET/POST /api/tasks, GET /api/roadmap, POST /api/sessions, GET /api/current-position',
    validationType: 'text',
    minLength: 10,
    maxLength: 1000,
  },
  {
    phase: 4,
    subsection: '4.2 API Design',
    questionNumber: 3,
    questionText: 'Do you need webhooks or background jobs?',
    placeholder: 'e.g., Yes, background job for AI progress updates every 5 minutes',
    validationType: 'text',
    maxLength: 500,
  },

  // 4.3 Authentication & Authorization (3 questions)
  {
    phase: 4,
    subsection: '4.3 Authentication & Authorization',
    questionNumber: 1,
    questionText: 'What auth methods do you need? (email/password, OAuth, magic links)',
    placeholder: 'e.g., GitHub OAuth for quick signup, email/password for flexibility',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 4,
    subsection: '4.3 Authentication & Authorization',
    questionNumber: 2,
    questionText: 'What user roles exist? (admin, member, viewer)',
    placeholder: 'e.g., Owner (full access), Member (read/write), Viewer (read-only)',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 4,
    subsection: '4.3 Authentication & Authorization',
    questionNumber: 3,
    questionText: 'What permission model? (RBAC, ABAC, RLS)',
    placeholder: 'e.g., Project-scoped RBAC with Row-Level Security in PostgreSQL',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },

  // 4.4 Caching & Performance (3 questions)
  {
    phase: 4,
    subsection: '4.4 Caching & Performance',
    questionNumber: 1,
    questionText:
      'What performance targets do you have? (e.g., <3s page load, <500ms API response)',
    placeholder: 'e.g., <2s initial page load, <150ms API responses, <100ms database queries',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 4,
    subsection: '4.4 Caching & Performance',
    questionNumber: 2,
    questionText: 'Do you need caching? (Redis, in-memory, CDN)',
    placeholder: 'e.g., Redis for session storage, in-memory for frequently accessed data',
    validationType: 'text',
    maxLength: 500,
  },
  {
    phase: 4,
    subsection: '4.4 Caching & Performance',
    questionNumber: 3,
    questionText: 'What content is cacheable vs real-time?',
    placeholder:
      'e.g., Static pages cached (CDN), task updates real-time (WebSocket), roadmap cached (5 min)',
    validationType: 'text',
    maxLength: 1000,
  },

  // ========================================================================
  // PHASE 5: DEVOPS & LOCAL DEVELOPMENT (9 questions)
  // ========================================================================

  // 5.1 Local Development Setup (3 questions)
  {
    phase: 5,
    subsection: '5.1 Local Development Setup',
    questionNumber: 1,
    questionText: 'What development tools are you using? (VSCode, Cursor, Windsurf)',
    placeholder: 'e.g., VSCode with Cursor AI, Claude Code integration, GitHub Copilot',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 5,
    subsection: '5.1 Local Development Setup',
    questionNumber: 2,
    questionText: 'Do you prefer Docker for local dev or native setup?',
    placeholder: 'e.g., Docker Compose for consistency, native for faster iteration',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 5,
    subsection: '5.1 Local Development Setup',
    questionNumber: 3,
    questionText: 'What testing strategy? (unit, integration, E2E)',
    placeholder: 'e.g., Jest for unit tests, Playwright for E2E, aim for 80% coverage',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // 5.2 CI/CD Pipeline (3 questions)
  {
    phase: 5,
    subsection: '5.2 CI/CD Pipeline',
    questionNumber: 1,
    questionText: 'What CI/CD platform? (GitHub Actions, Vercel, GitLab CI)',
    placeholder: 'e.g., GitHub Actions for CI, Vercel for CD, automated preview deployments',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 5,
    subsection: '5.2 CI/CD Pipeline',
    questionNumber: 2,
    questionText: 'What checks must pass before deployment? (tests, linting, type-checking)',
    placeholder: 'e.g., All tests pass, ESLint clean, TypeScript 0 errors, Lighthouse score >90',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 5,
    subsection: '5.2 CI/CD Pipeline',
    questionNumber: 3,
    questionText: 'What deployment strategy? (blue-green, rolling, canary)',
    placeholder: 'e.g., Vercel preview deployments, promote to production after manual QA',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },

  // 5.3 Monitoring & Observability (3 questions)
  {
    phase: 5,
    subsection: '5.3 Monitoring & Observability',
    questionNumber: 1,
    questionText: 'What monitoring tools? (Sentry, LogRocket, Vercel Analytics)',
    placeholder:
      'e.g., Sentry for error tracking, Vercel Analytics for performance, custom health checks',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 5,
    subsection: '5.3 Monitoring & Observability',
    questionNumber: 2,
    questionText: 'What alerts are critical? (error rate, downtime, budget thresholds)',
    placeholder: 'e.g., API error rate >1%, database connection loss, cost exceeds $200/month',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 5,
    subsection: '5.3 Monitoring & Observability',
    questionNumber: 3,
    questionText: 'What metrics to track? (MAU, API latency, error rates)',
    placeholder: 'e.g., Daily active users, API p95 latency, database query times, AI API costs',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // ========================================================================
  // PHASE 6: BACKEND DEVELOPMENT (9 questions)
  // ========================================================================

  // 6.1 Data Layer (3 questions)
  {
    phase: 6,
    subsection: '6.1 Data Layer',
    questionNumber: 1,
    questionText: 'What ORM/query builder? (Prisma, Drizzle, raw SQL)',
    placeholder: 'e.g., Prisma for type-safety and migrations, raw SQL for complex queries',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 6,
    subsection: '6.1 Data Layer',
    questionNumber: 2,
    questionText: 'What migration strategy? (versioned migrations vs schema sync)',
    placeholder: 'e.g., Prisma Migrate with versioned migrations for production safety',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 6,
    subsection: '6.1 Data Layer',
    questionNumber: 3,
    questionText: 'What seeding strategy for development data?',
    placeholder: 'e.g., Prisma seed script with realistic test data, factories for tests',
    validationType: 'text',
    minLength: 5,
    maxLength: 500,
  },

  // 6.2 Business Logic (3 questions)
  {
    phase: 6,
    subsection: '6.2 Business Logic',
    questionNumber: 1,
    questionText: 'What are the core business rules? (e.g., max 5 projects per user on free plan)',
    placeholder:
      'e.g., Free users: 1 project, 100 tasks. Pro users: unlimited projects, AI features enabled',
    validationType: 'text',
    minLength: 10,
    maxLength: 1000,
  },
  {
    phase: 6,
    subsection: '6.2 Business Logic',
    questionNumber: 2,
    questionText: 'What validation rules are critical? (email format, unique slugs, rate limits)',
    placeholder: 'e.g., Email validation, unique project slugs, max 100 API requests/minute',
    validationType: 'text',
    minLength: 10,
    maxLength: 1000,
  },
  {
    phase: 6,
    subsection: '6.2 Business Logic',
    questionNumber: 3,
    questionText: 'What background jobs are needed? (email sending, report generation, cleanup)',
    placeholder:
      'e.g., AI progress updates every 5 min, daily report generation, cleanup old sessions weekly',
    validationType: 'text',
    maxLength: 1000,
  },

  // 6.3 Integrations (3 questions)
  {
    phase: 6,
    subsection: '6.3 Integrations',
    questionNumber: 1,
    questionText: 'What third-party APIs? (Stripe, OpenAI, SendGrid, etc.)',
    placeholder: 'e.g., OpenAI for AI features, GitHub for OAuth, SendGrid for emails',
    validationType: 'text',
    maxLength: 500,
  },
  {
    phase: 6,
    subsection: '6.3 Integrations',
    questionNumber: 2,
    questionText: 'What data needs to sync? (calendar events, CRM records)',
    placeholder: 'e.g., GitHub commits → task progress updates, Jira issues → ProjectPulse tasks',
    validationType: 'text',
    isRequired: false,
    maxLength: 1000,
  },
  {
    phase: 6,
    subsection: '6.3 Integrations',
    questionNumber: 3,
    questionText: 'What webhooks to handle? (payment success, subscription cancelled)',
    placeholder: 'e.g., Stripe payment webhooks, GitHub push webhooks for auto-updates',
    validationType: 'text',
    isRequired: false,
    maxLength: 1000,
  },

  // ========================================================================
  // PHASE 7: FRONTEND DEVELOPMENT (9 questions)
  // ========================================================================

  // 7.1 State Management (3 questions)
  {
    phase: 7,
    subsection: '7.1 State Management',
    questionNumber: 1,
    questionText: 'What state management approach? (React Context, Zustand, Redux)',
    placeholder: 'e.g., Server state in RSC, client state in Zustand, URL state for filters',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 7,
    subsection: '7.1 State Management',
    questionNumber: 2,
    questionText: 'What data needs client-side state? (user preferences, form drafts, UI state)',
    placeholder: 'e.g., Theme preference, sidebar collapsed state, current filter selection',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 7,
    subsection: '7.1 State Management',
    questionNumber: 3,
    questionText: 'What data should be server-driven? (user data, permissions, content)',
    placeholder: 'e.g., All task data, roadmap structure, user permissions, project settings',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // 7.2 Data Fetching (3 questions)
  {
    phase: 7,
    subsection: '7.2 Data Fetching',
    questionNumber: 1,
    questionText: 'What data fetching pattern? (SWR, React Query, Server Components)',
    placeholder: 'e.g., Server Components for initial data, SWR for client-side revalidation',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 7,
    subsection: '7.2 Data Fetching',
    questionNumber: 2,
    questionText:
      'What data needs real-time updates? (notifications, chat messages, collaborative editing)',
    placeholder: 'e.g., Task progress updates via WebSocket, real-time collaboration cursors',
    validationType: 'text',
    maxLength: 500,
  },
  {
    phase: 7,
    subsection: '7.2 Data Fetching',
    questionNumber: 3,
    questionText: 'What optimistic UI updates are needed? (like buttons, status toggles)',
    placeholder: 'e.g., Task status change, progress percentage update, mark task complete',
    validationType: 'text',
    maxLength: 500,
  },

  // 7.3 Forms & Validation (3 questions)
  {
    phase: 7,
    subsection: '7.3 Forms & Validation',
    questionNumber: 1,
    questionText: 'What form library? (react-hook-form, Formik, native)',
    placeholder: 'e.g., react-hook-form for performance, Zod for validation',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 7,
    subsection: '7.3 Forms & Validation',
    questionNumber: 2,
    questionText: 'What validation approach? (Zod, Yup, custom)',
    placeholder: 'e.g., Zod for type-safe validation shared between client and server',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 7,
    subsection: '7.3 Forms & Validation',
    questionNumber: 3,
    questionText: 'What complex forms are needed? (multi-step wizards, conditional fields)',
    placeholder: 'e.g., 3-step onboarding wizard, task creation with conditional priority fields',
    validationType: 'text',
    maxLength: 1000,
  },

  // ========================================================================
  // PHASE 8: QA & TESTING (9 questions)
  // ========================================================================

  // 8.1 Test Coverage (3 questions)
  {
    phase: 8,
    subsection: '8.1 Test Coverage',
    questionNumber: 1,
    questionText: 'What test coverage target? (70%+ business logic, 50%+ overall)',
    placeholder: 'e.g., 80% for business logic, 60% overall, 100% for critical paths',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 8,
    subsection: '8.1 Test Coverage',
    questionNumber: 2,
    questionText: 'What testing frameworks? (Jest, Vitest, Playwright)',
    placeholder:
      'e.g., Vitest for unit tests, Playwright for E2E, React Testing Library for components',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 8,
    subsection: '8.1 Test Coverage',
    questionNumber: 3,
    questionText: 'What features are critical to test end-to-end? (checkout flow, auth flow)',
    placeholder: 'e.g., User signup → project creation → task creation → AI update → mark complete',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // 8.2 Quality Gates (3 questions)
  {
    phase: 8,
    subsection: '8.2 Quality Gates',
    questionNumber: 1,
    questionText: 'What checks must pass for PR merge? (tests, linting, type-checking)',
    placeholder: 'e.g., All tests pass, ESLint clean, TypeScript 0 errors, no console.logs',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 8,
    subsection: '8.2 Quality Gates',
    questionNumber: 2,
    questionText: 'What manual QA is needed? (accessibility audit, cross-browser testing)',
    placeholder: 'e.g., Accessibility audit with axe DevTools, test on Chrome/Firefox/Safari',
    validationType: 'text',
    maxLength: 500,
  },
  {
    phase: 8,
    subsection: '8.2 Quality Gates',
    questionNumber: 3,
    questionText: 'What performance budgets? (bundle size, lighthouse score)',
    placeholder: 'e.g., <200KB initial bundle, Lighthouse score >90 on all metrics, FCP <1.5s',
    validationType: 'text',
    maxLength: 500,
  },

  // 8.3 Bug Tracking (3 questions)
  {
    phase: 8,
    subsection: '8.3 Bug Tracking',
    questionNumber: 1,
    questionText: 'What bug tracking system? (GitHub Issues, Linear, Jira)',
    placeholder: 'e.g., GitHub Issues for simplicity, Linear for advanced workflows',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 8,
    subsection: '8.3 Bug Tracking',
    questionNumber: 2,
    questionText: 'What bug severity levels? (critical, high, medium, low)',
    placeholder:
      'e.g., Critical (app broken), High (feature broken), Medium (minor bug), Low (nice to have)',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 8,
    subsection: '8.3 Bug Tracking',
    questionNumber: 3,
    questionText: 'What is your bug triage process?',
    placeholder:
      'e.g., Critical bugs fixed immediately, high/medium in next sprint, low in backlog',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // ========================================================================
  // PHASE 9: PRODUCTION DEPLOYMENT (9 questions)
  // ========================================================================

  // 9.1 Hosting & Infrastructure (3 questions)
  {
    phase: 9,
    subsection: '9.1 Hosting & Infrastructure',
    questionNumber: 1,
    questionText: 'What hosting platform? (Vercel, Railway, AWS, Render)',
    placeholder: 'e.g., Vercel for frontend, Supabase for PostgreSQL, Redis Labs for caching',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 9,
    subsection: '9.1 Hosting & Infrastructure',
    questionNumber: 2,
    questionText: 'What environment setup? (staging, production, preview)',
    placeholder: 'e.g., Production (main branch), Staging (develop branch), Preview (per PR)',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 9,
    subsection: '9.1 Hosting & Infrastructure',
    questionNumber: 3,
    questionText: 'What database hosting? (Supabase, PlanetScale, RDS)',
    placeholder: 'e.g., Supabase for managed PostgreSQL with row-level security',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },

  // 9.2 Secrets Management (3 questions)
  {
    phase: 9,
    subsection: '9.2 Secrets Management',
    questionNumber: 1,
    questionText: 'How to manage secrets? (.env.local, Vercel Env Vars, AWS Secrets Manager)',
    placeholder: 'e.g., Vercel Environment Variables for production, .env.local for development',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 9,
    subsection: '9.2 Secrets Management',
    questionNumber: 2,
    questionText: 'What secrets are needed? (API keys, database URLs, JWT secrets)',
    placeholder: 'e.g., DATABASE_URL, OPENAI_API_KEY, NEXTAUTH_SECRET, GITHUB_CLIENT_ID',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 9,
    subsection: '9.2 Secrets Management',
    questionNumber: 3,
    questionText: 'What rotation strategy for secrets?',
    placeholder: 'e.g., Rotate API keys quarterly, JWT secrets on security incidents',
    validationType: 'text',
    maxLength: 500,
  },

  // 9.3 Rollout Plan (3 questions)
  {
    phase: 9,
    subsection: '9.3 Rollout Plan',
    questionNumber: 1,
    questionText: 'What is your launch plan? (public launch, private beta, waitlist)',
    placeholder: 'e.g., Private beta (100 users), public launch after 2 weeks, Product Hunt launch',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 9,
    subsection: '9.3 Rollout Plan',
    questionNumber: 2,
    questionText: 'What feature flags are needed? (beta features, A/B tests)',
    placeholder: 'e.g., AI features behind flag for gradual rollout, A/B test new UI',
    validationType: 'text',
    isRequired: false,
    maxLength: 500,
  },
  {
    phase: 9,
    subsection: '9.3 Rollout Plan',
    questionNumber: 3,
    questionText: 'What rollback plan if launch fails?',
    placeholder:
      'e.g., Vercel instant rollback to previous deployment, database backup restore process',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // ========================================================================
  // PHASE 10: SECURITY & COMPLIANCE (9 questions)
  // ========================================================================

  // 10.1 Security Hardening (3 questions)
  {
    phase: 10,
    subsection: '10.1 Security Hardening',
    questionNumber: 1,
    questionText: 'What security measures are required? (HTTPS, CSP, CORS, rate limiting)',
    placeholder: 'e.g., HTTPS enforced, CSP headers, CORS for API, rate limiting (100 req/min)',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 10,
    subsection: '10.1 Security Hardening',
    questionNumber: 2,
    questionText: 'What authentication security? (password hashing, MFA, session management)',
    placeholder: 'e.g., bcrypt for passwords, optional MFA, JWT with 7-day expiry',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 10,
    subsection: '10.1 Security Hardening',
    questionNumber: 3,
    questionText: 'What input validation? (SQL injection, XSS, CSRF protection)',
    placeholder:
      'e.g., Zod validation, Prisma parameterized queries, React escapes output, CSRF tokens',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // 10.2 Data Privacy (3 questions)
  {
    phase: 10,
    subsection: '10.2 Data Privacy',
    questionNumber: 1,
    questionText: 'What user data do you collect? (PII, usage data, analytics)',
    placeholder: 'e.g., Email, project data, usage analytics (anonymized), no tracking cookies',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
  {
    phase: 10,
    subsection: '10.2 Data Privacy',
    questionNumber: 2,
    questionText: 'What privacy regulations apply? (GDPR, CCPA, HIPAA)',
    placeholder: 'e.g., GDPR compliant (EU users), CCPA compliant (CA users)',
    validationType: 'text',
    minLength: 5,
    maxLength: 200,
  },
  {
    phase: 10,
    subsection: '10.2 Data Privacy',
    questionNumber: 3,
    questionText: 'What data retention policy?',
    placeholder:
      'e.g., Active users indefinite, deleted users purged after 30 days, logs retained 90 days',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },

  // 10.3 Compliance (3 questions)
  {
    phase: 10,
    subsection: '10.3 Compliance',
    questionNumber: 1,
    questionText: 'What compliance requirements? (SOC 2, HIPAA, PCI-DSS)',
    placeholder: 'e.g., No formal compliance needed for MVP, SOC 2 after 1K users',
    validationType: 'text',
    isRequired: false,
    maxLength: 500,
  },
  {
    phase: 10,
    subsection: '10.3 Compliance',
    questionNumber: 2,
    questionText: 'What legal pages needed? (Privacy Policy, Terms of Service, Cookie Policy)',
    placeholder: 'e.g., Privacy Policy, Terms of Service, GDPR cookie consent banner',
    validationType: 'text',
    minLength: 10,
    maxLength: 200,
  },
  {
    phase: 10,
    subsection: '10.3 Compliance',
    questionNumber: 3,
    questionText: 'What user consent mechanisms? (cookie banners, data processing agreements)',
    placeholder: 'e.g., Cookie consent banner (EU only), explicit consent for marketing emails',
    validationType: 'text',
    minLength: 10,
    maxLength: 500,
  },
];

export async function seedOnboardingQuestions(prisma: PrismaClient) {
  console.log('🌱 Seeding onboarding questions...');

  let created = 0;
  let updated = 0;

  for (const question of questions) {
    const existing = await prisma.onboardingQuestion.findUnique({
      where: {
        phase_subsection_questionNumber: {
          phase: question.phase,
          subsection: question.subsection,
          questionNumber: question.questionNumber,
        },
      },
    });

    if (existing) {
      await prisma.onboardingQuestion.update({
        where: { id: existing.id },
        data: question,
      });
      updated++;
    } else {
      await prisma.onboardingQuestion.create({
        data: question,
      });
      created++;
    }
  }

  console.log(`✅ Seeded ${created} new questions, updated ${updated} existing questions`);
  console.log(`📊 Total questions: ${questions.length}`);

  // Verify counts by phase
  const phaseCounts = await prisma.onboardingQuestion.groupBy({
    by: ['phase'],
    _count: { phase: true },
  });

  console.log('\n📋 Questions by phase:');
  phaseCounts.forEach((count) => {
    console.log(`  Phase ${count.phase}: ${count._count.phase} questions`);
  });
}

// Run if called directly
if (require.main === module) {
  seedOnboardingQuestions(prisma)
    .then(() => {
      console.log('\n✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedOnboardingQuestions;
