/**
 * Test Fixtures and Mock Data Generators
 *
 * Provides mock data for testing onboarding workflows without
 * requiring actual AI generation.
 */

import { countWords } from './test-helpers.js';

/**
 * Generate mock answers for onboarding questions
 *
 * @param questions - Array of question objects from getQuestions API
 * @returns Record of questionId -> answer
 */
export function generateMockAnswers(
  questions: Array<{
    id: string;
    text: string;
    minLength?: number;
    maxLength?: number;
  }>
): Record<string, string> {
  const answers: Record<string, string> = {};

  for (const question of questions) {
    // Generate answer that meets min/max length requirements
    const minLength = question.minLength || 10;
    const baseAnswer = `Mock answer for: ${question.text.substring(0, 50)}...`;

    // Repeat answer to meet minimum length
    let answer = baseAnswer;
    while (answer.length < minLength) {
      answer += ` ${baseAnswer}`;
    }

    // Truncate if exceeds max length
    if (question.maxLength && answer.length > question.maxLength) {
      answer = answer.substring(0, question.maxLength);
    }

    answers[question.id] = answer;
  }

  return answers;
}

/**
 * Generate mock executive summary
 *
 * @param targetWords - Target word count (default: 500)
 * @param projectName - Optional project name to include
 * @returns Mock executive summary text
 */
export function generateMockExecutiveSummary(
  targetWords: number = 500,
  projectName: string = 'TaskFlow'
): string {
  const paragraphs = [
    `${projectName} is an AI-powered project management platform designed for solo developers and small development teams. The platform addresses the critical challenge of context switching and task tracking in modern software development workflows.`,

    `Our target users are primarily solo developers (ages 25-45) and small development teams (2-5 people) working in fast-paced startup environments. These users struggle with manual task tracking, losing context during interruptions, and managing multiple projects simultaneously.`,

    `The core value proposition is seamless AI-powered task management that maintains context automatically. Unlike traditional tools like Jira or Linear, ${projectName} integrates directly with AI agents (Claude Code, Cursor, Continue.dev) to capture work automatically without manual entry.`,

    `Key differentiators include: (1) MCP-native architecture for agent integration, (2) automatic context capture from code changes, (3) semantic search powered by vector embeddings, and (4) intelligent task recommendations based on work patterns.`,

    `Success metrics include: 50% reduction in time spent on task management, 80% of users achieving "inbox zero" task state weekly, and 90% context recovery rate after interruptions. We aim for 10,000 active users within 12 months.`,

    `Technical architecture leverages Next.js 14 App Router, PostgreSQL with pgvector extension, Prisma ORM, and Model Context Protocol (MCP) for agent integration. The platform supports both cloud-hosted and self-hosted deployments.`,

    `Go-to-market strategy focuses on developer communities (Reddit r/programming, Hacker News), content marketing (technical blog posts), and integration partnerships with AI coding tools. Pricing model is freemium with premium features at $19/month.`,

    `Primary risks include: adoption challenges in conservative teams, competition from existing tools adding AI features, and potential scalability issues with vector search. Mitigation strategies include comprehensive onboarding, clear differentiation messaging, and early performance optimization.`,

    `The development roadmap spans 6 months across 5 phases: Foundation (database + API), Implementation (UI + agent integration), Testing (E2E + security), Deployment (production infrastructure), and Launch (public beta release). Total estimated effort: 180 days with 2-3 developers.`,

    `This project aligns with the growing trend of AI-native development tools and positions ${projectName} as a leader in the agent-first project management space. With proper execution, we expect to capture 2-3% of the solo developer market within 24 months.`,
  ];

  // Repeat paragraphs to reach target word count
  let summary = paragraphs.join('\n\n');
  while (countWords(summary) < targetWords) {
    summary += `\n\n${paragraphs[Math.floor(Math.random() * paragraphs.length)]}`;
  }

  // Trim to approximately target word count
  const words = summary.split(/\s+/);
  if (words.length > targetWords) {
    summary = words.slice(0, targetWords).join(' ');
  }

  return summary;
}

/**
 * Generate mock document content
 *
 * @param title - Document title
 * @param category - Document category (planning, architecture, implementation, operations)
 * @param targetWords - Target word count
 * @returns Mock document content in Markdown format
 */
export function generateMockDocument(
  title: string,
  category: string,
  targetWords: number = 2000
): string {
  const sections = {
    planning: [
      '## Overview',
      '## Problem Statement',
      '## Solution Approach',
      '## User Stories',
      '## Acceptance Criteria',
      '## Success Metrics',
      '## Timeline and Milestones',
      '## Dependencies and Risks',
    ],
    architecture: [
      '## System Architecture',
      '## Component Design',
      '## Data Flow',
      '## API Design',
      '## Security Considerations',
      '## Performance Requirements',
      '## Scalability Strategy',
      '## Technology Stack',
    ],
    implementation: [
      '## Implementation Plan',
      '## Module Structure',
      '## Code Organization',
      '## Testing Strategy',
      '## Error Handling',
      '## Logging and Monitoring',
      '## Deployment Process',
      '## Rollback Procedures',
    ],
    operations: [
      '## Operations Overview',
      '## Deployment Strategy',
      '## Monitoring Setup',
      '## Incident Response',
      '## Backup and Recovery',
      '## Performance Tuning',
      '## Security Procedures',
      '## Maintenance Schedule',
    ],
  };

  const categorySection = sections[category as keyof typeof sections] || sections.planning;

  let content = `# ${title}\n\n`;
  content += `**Category**: ${category}\n`;
  content += `**Generated**: ${new Date().toISOString().split('T')[0]}\n\n`;
  content += `## Executive Summary\n\n`;
  content += `This document provides comprehensive coverage of ${title.toLowerCase()}. `;
  content += `It serves as a reference for the development team and stakeholders. `;
  content += `The document is organized into logical sections covering all key aspects.\n\n`;

  // Add sections with lorem ipsum content
  for (const section of categorySection) {
    content += `${section}\n\n`;
    content += `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. `;
    content += `Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. `;
    content += `Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. `;
    content += `Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n`;

    // Add subsections
    content += `### Key Points\n\n`;
    content += `- **Point 1**: Important consideration related to ${section.replace('##', '').trim()}\n`;
    content += `- **Point 2**: Technical implementation details and best practices\n`;
    content += `- **Point 3**: Dependencies and integration requirements\n`;
    content += `- **Point 4**: Testing and validation approach\n\n`;

    // Stop if we've reached target word count
    if (countWords(content) >= targetWords) {
      break;
    }
  }

  // Add conclusion
  content += `## Conclusion\n\n`;
  content += `This document provides a comprehensive foundation for ${title.toLowerCase()}. `;
  content += `It should be reviewed and updated regularly as the project evolves. `;
  content += `For questions or clarifications, please refer to the project documentation or contact the technical lead.\n`;

  return content;
}

/**
 * Generate mock 13-Project-Plan.md content with proper format for Session 3 parsing
 *
 * @returns Mock project plan content
 */
export function generateMockProjectPlan(): string {
  return `# Project Implementation Plan

**Project**: TaskFlow AI-Powered Project Management
**Duration**: 6 months (24 weeks)
**Team Size**: 2-3 developers

## Phase 1: Foundation (Weeks 1-4, Sprints 1-2)

**Duration**: 4 weeks
**Points**: 20 points
**Goal**: Establish database schema and API foundation

### Sprint 1 (Weeks 1-2): Database Setup - 8 points

**Goals**:
- Set up PostgreSQL with pgvector extension
- Implement Prisma schema for core entities
- Create database migrations

**Weeks**:
- **Week 1**: Database models (User, Project, Task, Issue)
- **Week 2**: Authentication and authorization

**Deliverables**:
- Complete Prisma schema
- Migration files
- Seed data

### Sprint 2 (Weeks 3-4): Core API - 12 points

**Goals**:
- Build REST API endpoints
- Add input validation with Zod
- Implement error handling

**Weeks**:
- **Week 3**: CRUD endpoints for tasks and issues
- **Week 4**: Search and filtering APIs

**Deliverables**:
- OpenAPI specification
- API test suite
- Documentation

## Phase 2: Implementation (Weeks 5-8, Sprints 3-4)

**Duration**: 4 weeks
**Points**: 25 points
**Goal**: Build user interface and agent integration

### Sprint 3 (Weeks 5-6): Frontend Foundation - 13 points

**Goals**:
- Set up Next.js 14 App Router
- Implement component library with shadcn/ui
- Build responsive layouts

**Weeks**:
- **Week 5**: Component library and design system
- **Week 6**: Dashboard and navigation

**Deliverables**:
- Reusable UI components
- Responsive layouts
- Storybook documentation

### Sprint 4 (Weeks 7-8): Agent Integration - 12 points

**Goals**:
- Implement MCP server
- Build agent communication layer
- Add context capture

**Weeks**:
- **Week 7**: MCP tool implementation
- **Week 8**: Agent workflow testing

**Deliverables**:
- MCP server
- Agent integration guide
- E2E agent tests

## Phase 3: Testing and Quality (Weeks 9-12, Sprints 5-6)

**Duration**: 4 weeks
**Points**: 18 points
**Goal**: Comprehensive testing and quality assurance

### Sprint 5 (Weeks 9-10): Testing - 10 points

**Goals**:
- Write unit tests for all components
- Add integration tests for APIs
- Implement E2E tests with Playwright

**Weeks**:
- **Week 9**: Unit and integration tests
- **Week 10**: E2E test coverage

**Deliverables**:
- >80% code coverage
- E2E test suite
- CI/CD pipeline

### Sprint 6 (Weeks 11-12): Security and Performance - 8 points

**Goals**:
- Security audit and fixes
- Performance optimization
- Accessibility compliance (WCAG 2.1 AA)

**Weeks**:
- **Week 11**: Security hardening
- **Week 12**: Performance tuning

**Deliverables**:
- Security audit report
- Performance benchmarks
- Accessibility report
`;
}

/**
 * Test constants
 */
export const TEST_CONSTANTS = {
  MCP_URL: process.env.MCP_URL || 'http://192.168.1.15:3001',
  TEST_PROJECT_ID: parseInt(process.env.TEST_PROJECT_ID || '3', 10),
  TEST_TIMEOUT_MS: 60000, // 60 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};
