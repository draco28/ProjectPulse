/**
 * Production Database Seed Script
 *
 * ADDITIVE & IDEMPOTENT - Safe to run on production databases
 *
 * This script seeds:
 * - Onboarding Questions (96 questions across 10 phases)
 * - Onboarding Prompt Templates (16 templates)
 * - Admin User (if ADMIN_EMAIL and ADMIN_PASSWORD env vars are set)
 *
 * It does NOT:
 * - Delete any existing data
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
 *
 * To seed admin user:
 *   ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="secure-password" DATABASE_URL="..." pnpm db:seed:prod
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedOnboardingPromptTemplates } from './seeds/onboarding-prompt-templates';
import { seedOnboardingQuestions } from './seeds/onboarding-questions';

const prisma = new PrismaClient();

/**
 * Seed admin user if environment variables are set
 * Uses upsert pattern: updates role to ADMIN if user exists, creates if not
 */
async function seedAdminUser(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('  [Admin] Skipped - ADMIN_EMAIL and ADMIN_PASSWORD not set');
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    console.log('  [Admin] Skipped - Invalid email format');
    return false;
  }

  // Validate password minimum requirements
  if (adminPassword.length < 8) {
    console.log('  [Admin] Skipped - Password must be at least 8 characters');
    return false;
  }

  const normalizedEmail = adminEmail.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: normalizedEmail,
      name: 'Administrator',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`  [Admin] ✓ Admin user ready: ${admin.email}`);
  return true;
}

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  PRODUCTION SEED - Additive & Idempotent');
  console.log('='.repeat(60));
  console.log('');
  console.log('This script will:');
  console.log('  - Upsert 96 onboarding questions');
  console.log('  - Upsert 16 prompt templates');
  console.log('  - Upsert admin user (if ADMIN_EMAIL/ADMIN_PASSWORD set)');
  console.log('');
  console.log('This script will NOT:');
  console.log('  - Delete any existing data');
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
  // ADMIN USER (Sprint 11.5)
  // Uses upsert pattern: find by email → update role or create
  // Only runs if ADMIN_EMAIL and ADMIN_PASSWORD env vars are set
  // ========================================================================
  console.log('\n📋 Admin User...');
  await seedAdminUser();

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
