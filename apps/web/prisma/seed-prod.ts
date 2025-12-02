/**
 * Production Database Seed Script
 *
 * ADDITIVE & IDEMPOTENT - Safe to run on production databases
 *
 * This script seeds ONLY system templates required for onboarding:
 * - Onboarding Questions (96 questions across 10 phases)
 * - Onboarding Prompt Templates (16 templates)
 *
 * It does NOT:
 * - Delete any existing data
 * - Create users or projects
 * - Touch user-generated content
 *
 * All seed functions use upsert patterns:
 * - If record exists: update it
 * - If record doesn't exist: create it
 *
 * Safe to run multiple times without data loss.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." pnpm db:seed:prod
 */

import { PrismaClient } from '@prisma/client';
import { seedOnboardingPromptTemplates } from './seeds/onboarding-prompt-templates';
import { seedOnboardingQuestions } from './seeds/onboarding-questions';

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  PRODUCTION SEED - Additive & Idempotent');
  console.log('='.repeat(60));
  console.log('');
  console.log('This script will:');
  console.log('  - Upsert 96 onboarding questions');
  console.log('  - Upsert 16 prompt templates');
  console.log('');
  console.log('This script will NOT:');
  console.log('  - Delete any existing data');
  console.log('  - Create users or projects');
  console.log('  - Touch user-generated content');
  console.log('');
  console.log('-'.repeat(60));

  // ========================================================================
  // ONBOARDING QUESTIONS (Session 1)
  // Uses upsert pattern: find by unique key → update or create
  // ========================================================================
  await seedOnboardingQuestions(prisma);

  // ========================================================================
  // PROMPT TEMPLATES (Session 1 & 2)
  // Uses upsert pattern: find by name → update or create
  // ========================================================================
  await seedOnboardingPromptTemplates(prisma);

  // ========================================================================
  // FUTURE: Session 3 Templates (when implemented)
  // All will use upsert patterns for additive seeding
  // ========================================================================
  // await seedAgentPersonas(prisma);      // upsert by slug
  // await seedSkills(prisma);             // upsert by slug
  // await seedWorkflowTemplates(prisma);  // upsert by name
  // await seedSOPs(prisma);               // upsert by slug

  console.log('');
  console.log('='.repeat(60));
  console.log('  PRODUCTION SEED COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log('All templates have been upserted.');
  console.log('Existing user data was preserved.');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('');
    console.error('SEED FAILED:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
