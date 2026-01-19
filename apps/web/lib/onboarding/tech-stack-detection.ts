/**
 * Tech Stack Detection for Session 3 Onboarding
 *
 * Purpose: Detect frameworks and technologies from project-context.json
 * Used by: Agent persona creation, skills creation
 *
 * Architecture: Pure detection logic (NO AI generation)
 */

// Type definitions for project context
type DependencyMap = Record<string, unknown>;

interface TechStackConfig {
  frontend?: string;
  backend?: string;
  database?: string;
  orm?: string;
  hosting?: string;
}

interface ProjectContext {
  techStack?: TechStackConfig;
  dependencies?: DependencyMap;
  devDependencies?: DependencyMap;
  deployment?: string;
}

export interface TechStackInfo {
  frontend: string | null; // "Next.js", "React", "Vue", "Angular", etc.
  backend: string | null; // "Node.js", "Express", "Fastify", "NestJS", etc.
  database: string | null; // "PostgreSQL", "MySQL", "MongoDB", "SQLite", etc.
  orm: string | null; // "Prisma", "TypeORM", "Sequelize", "Drizzle", etc.
  hosting: string | null; // "Vercel", "AWS", "Railway", "Render", etc.
  testing: string | null; // "Jest", "Vitest", "Playwright", etc.
  styling: string | null; // "Tailwind", "CSS Modules", "Styled Components", etc.
}

/**
 * Main tech stack detection function
 *
 * @param projectContext - project-context.json from Session 1
 * @returns Detected tech stack info
 */
export function detectTechStack(projectContext: ProjectContext): TechStackInfo {
  const techStack = projectContext.techStack || {};
  const dependencies = projectContext.dependencies || {};
  const devDependencies = projectContext.devDependencies || {};

  return {
    frontend: detectFrontend(techStack, dependencies),
    backend: detectBackend(techStack, dependencies),
    database: detectDatabase(techStack, dependencies),
    orm: detectORM(techStack, dependencies),
    hosting: detectHosting(techStack, projectContext.deployment),
    testing: detectTesting(devDependencies),
    styling: detectStyling(dependencies, devDependencies),
  };
}

/**
 * Detect frontend framework
 */
function detectFrontend(techStack: TechStackConfig, dependencies: DependencyMap): string | null {
  const frontend = techStack.frontend || '';

  // Check explicit tech stack declaration
  if (frontend.toLowerCase().includes('next.js') || frontend.toLowerCase().includes('nextjs')) {
    return 'Next.js';
  }
  if (frontend.toLowerCase().includes('react')) {
    return 'React';
  }
  if (frontend.toLowerCase().includes('vue')) {
    return 'Vue.js';
  }
  if (frontend.toLowerCase().includes('angular')) {
    return 'Angular';
  }
  if (frontend.toLowerCase().includes('svelte')) {
    return 'Svelte';
  }

  // Check dependencies
  if (dependencies.next) {
    return 'Next.js';
  }
  if (dependencies.react && !dependencies.next) {
    return 'React';
  }
  if (dependencies.vue) {
    return 'Vue.js';
  }
  if (dependencies['@angular/core']) {
    return 'Angular';
  }
  if (dependencies.svelte) {
    return 'Svelte';
  }

  return null;
}

/**
 * Detect backend framework
 */
function detectBackend(techStack: TechStackConfig, dependencies: DependencyMap): string | null {
  const backend = techStack.backend || '';

  // Check explicit tech stack declaration
  if (backend.toLowerCase().includes('express')) {
    return 'Express';
  }
  if (backend.toLowerCase().includes('fastify')) {
    return 'Fastify';
  }
  if (backend.toLowerCase().includes('nestjs') || backend.toLowerCase().includes('nest.js')) {
    return 'NestJS';
  }
  if (backend.toLowerCase().includes('hono')) {
    return 'Hono';
  }
  if (backend.toLowerCase().includes('koa')) {
    return 'Koa';
  }
  if (backend.toLowerCase().includes('node')) {
    return 'Node.js';
  }

  // Check dependencies
  if (dependencies.express) {
    return 'Express';
  }
  if (dependencies.fastify) {
    return 'Fastify';
  }
  if (dependencies['@nestjs/core']) {
    return 'NestJS';
  }
  if (dependencies.hono) {
    return 'Hono';
  }
  if (dependencies.koa) {
    return 'Koa';
  }

  // Next.js has built-in API routes (no explicit backend framework)
  if (dependencies.next) {
    return 'Next.js API Routes';
  }

  return null;
}

/**
 * Detect database
 */
function detectDatabase(techStack: TechStackConfig, dependencies: DependencyMap): string | null {
  const database = techStack.database || '';

  // Check explicit tech stack declaration
  if (
    database.toLowerCase().includes('postgresql') ||
    database.toLowerCase().includes('postgres')
  ) {
    return 'PostgreSQL';
  }
  if (database.toLowerCase().includes('mysql')) {
    return 'MySQL';
  }
  if (database.toLowerCase().includes('mongodb') || database.toLowerCase().includes('mongo')) {
    return 'MongoDB';
  }
  if (database.toLowerCase().includes('sqlite')) {
    return 'SQLite';
  }
  if (database.toLowerCase().includes('redis')) {
    return 'Redis';
  }

  // Check dependencies
  if (dependencies.pg || dependencies['@types/pg']) {
    return 'PostgreSQL';
  }
  if (dependencies.mysql || dependencies.mysql2) {
    return 'MySQL';
  }
  if (dependencies.mongodb) {
    return 'MongoDB';
  }
  if (dependencies.sqlite3 || dependencies['better-sqlite3']) {
    return 'SQLite';
  }
  if (dependencies.redis) {
    return 'Redis';
  }

  return null;
}

/**
 * Detect ORM/Database toolkit
 */
function detectORM(techStack: TechStackConfig, dependencies: DependencyMap): string | null {
  const orm = techStack.orm || '';

  // Check explicit tech stack declaration
  if (orm.toLowerCase().includes('prisma')) {
    return 'Prisma';
  }
  if (orm.toLowerCase().includes('typeorm')) {
    return 'TypeORM';
  }
  if (orm.toLowerCase().includes('sequelize')) {
    return 'Sequelize';
  }
  if (orm.toLowerCase().includes('drizzle')) {
    return 'Drizzle';
  }
  if (orm.toLowerCase().includes('mongoose')) {
    return 'Mongoose';
  }

  // Check dependencies
  if (dependencies['@prisma/client']) {
    return 'Prisma';
  }
  if (dependencies.typeorm) {
    return 'TypeORM';
  }
  if (dependencies.sequelize) {
    return 'Sequelize';
  }
  if (dependencies['drizzle-orm']) {
    return 'Drizzle';
  }
  if (dependencies.mongoose) {
    return 'Mongoose';
  }

  return null;
}

/**
 * Detect hosting platform
 */
function detectHosting(techStack: TechStackConfig, deployment: string | undefined): string | null {
  const hosting = techStack.hosting || '';
  const deploymentStr = deployment || '';

  // Check explicit tech stack declaration
  if (hosting.toLowerCase().includes('vercel')) {
    return 'Vercel';
  }
  if (hosting.toLowerCase().includes('aws')) {
    return 'AWS';
  }
  if (hosting.toLowerCase().includes('railway')) {
    return 'Railway';
  }
  if (hosting.toLowerCase().includes('render')) {
    return 'Render';
  }
  if (hosting.toLowerCase().includes('netlify')) {
    return 'Netlify';
  }
  if (hosting.toLowerCase().includes('docker')) {
    return 'Docker';
  }

  // Check deployment field
  if (deploymentStr.toLowerCase().includes('vercel')) {
    return 'Vercel';
  }
  if (deploymentStr.toLowerCase().includes('aws')) {
    return 'AWS';
  }
  if (deploymentStr.toLowerCase().includes('railway')) {
    return 'Railway';
  }
  if (deploymentStr.toLowerCase().includes('render')) {
    return 'Render';
  }
  if (deploymentStr.toLowerCase().includes('netlify')) {
    return 'Netlify';
  }
  if (deploymentStr.toLowerCase().includes('docker')) {
    return 'Docker';
  }

  return null;
}

/**
 * Detect testing framework
 */
function detectTesting(devDependencies: DependencyMap): string | null {
  if (devDependencies.jest || devDependencies['@types/jest']) {
    return 'Jest';
  }
  if (devDependencies.vitest) {
    return 'Vitest';
  }
  if (devDependencies.playwright || devDependencies['@playwright/test']) {
    return 'Playwright';
  }
  if (devDependencies.cypress) {
    return 'Cypress';
  }
  if (devDependencies.mocha) {
    return 'Mocha';
  }

  return null;
}

/**
 * Detect styling solution
 */
function detectStyling(dependencies: DependencyMap, devDependencies: DependencyMap): string | null {
  if (dependencies.tailwindcss || devDependencies.tailwindcss) {
    return 'Tailwind CSS';
  }
  if (dependencies['styled-components']) {
    return 'Styled Components';
  }
  if (dependencies['@emotion/react'] || dependencies['@emotion/styled']) {
    return 'Emotion';
  }
  if (dependencies.sass || devDependencies.sass) {
    return 'Sass';
  }
  if (dependencies['css-modules']) {
    return 'CSS Modules';
  }

  return null;
}

/**
 * Get human-readable tech stack summary
 */
export function getTechStackSummary(techStack: TechStackInfo): string {
  const parts: string[] = [];

  if (techStack.frontend) parts.push(techStack.frontend);
  if (techStack.backend && techStack.backend !== techStack.frontend) parts.push(techStack.backend);
  if (techStack.database) parts.push(techStack.database);
  if (techStack.orm) parts.push(techStack.orm);

  return parts.join(' + ');
}
