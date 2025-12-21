/**
 * Demo User Cleanup Script
 * Sprint 11.5: Remove demo user (dev@projectpulse.local) and all their data
 *
 * SAFETY FEATURES:
 * - Hardcoded email target (cannot accidentally delete other users)
 * - --dry-run mode shows what would be deleted without deleting
 * - Without --dry-run, requires explicit confirmation
 * - Cascade deletion handled by database (all projects/data deleted automatically)
 *
 * Usage:
 *   # Dry run (shows what would be deleted):
 *   DATABASE_URL="postgresql://..." pnpm db:cleanup-demo-dry
 *
 *   # Actual cleanup:
 *   DATABASE_URL="postgresql://..." pnpm db:cleanup-demo
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// HARDCODED: Only this email can be deleted by this script
const DEMO_USER_EMAIL = 'dev@projectpulse.local';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  projectCount: number;
  projectNames: string[];
  onboardingSessionCount: number;
}

async function getDemoUserData(): Promise<UserData | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
        },
      },
      onboardingSessions: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    projectCount: user.projects.length,
    projectNames: user.projects.map((p) => p.name),
    onboardingSessionCount: user.onboardingSessions.length,
  };
}

async function getProjectDetails(projectNames: string[]): Promise<void> {
  // Get additional counts for each project
  for (const projectName of projectNames) {
    const project = await prisma.project.findUnique({
      where: { name: projectName },
      include: {
        _count: {
          select: {
            tickets: true,
            skills: true,
            workflowRuns: true,
          },
        },
      },
    });

    if (project) {
      console.log(`    - ${projectName}:`);
      console.log(`        Tickets: ${project._count.tickets}`);
      console.log(`        Skills: ${project._count.skills}`);
      console.log(`        Workflow Runs: ${project._count.workflowRuns}`);
    }
  }
}

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('');
  console.log('='.repeat(60));
  console.log('  DEMO USER CLEANUP SCRIPT');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Target email: ${DEMO_USER_EMAIL}`);
  console.log(
    `Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE (will delete data)'}`
  );
  console.log('');
  console.log('-'.repeat(60));

  // Find demo user
  console.log('\n📋 Checking for demo user...\n');
  const userData = await getDemoUserData();

  if (!userData) {
    console.log(`✓ Demo user "${DEMO_USER_EMAIL}" not found in database.`);
    console.log('  Nothing to clean up.\n');
    return;
  }

  // Show what would be deleted
  console.log('🎯 Found demo user:');
  console.log(`  ID: ${userData.id}`);
  console.log(`  Email: ${userData.email}`);
  console.log(`  Name: ${userData.name || '(no name)'}`);
  console.log(`  Role: ${userData.role}`);
  console.log(`  Active: ${userData.isActive}`);
  console.log(`  Created: ${userData.createdAt.toISOString()}`);
  console.log('');
  console.log('📦 Related data that will be CASCADE DELETED:');
  console.log(`  Projects: ${userData.projectCount}`);

  if (userData.projectCount > 0) {
    await getProjectDetails(userData.projectNames);
  }

  console.log(`  Onboarding Sessions: ${userData.onboardingSessionCount}`);
  console.log('');

  if (isDryRun) {
    console.log('-'.repeat(60));
    console.log('');
    console.log('🔍 DRY RUN COMPLETE - No changes were made.');
    console.log('');
    console.log('To actually delete this user and all their data, run:');
    console.log('  DATABASE_URL="..." pnpm db:cleanup-demo');
    console.log('');
    return;
  }

  // Confirm deletion
  console.log('⚠️  WARNING: This action is IRREVERSIBLE!');
  console.log('');
  const confirmed = await askConfirmation('Type "yes" to confirm deletion: ');

  if (!confirmed) {
    console.log('');
    console.log('❌ Cleanup cancelled. No changes were made.');
    console.log('');
    return;
  }

  // Delete the user (cascades handle related data)
  console.log('');
  console.log('🗑️  Deleting demo user...');

  await prisma.user.delete({
    where: { email: DEMO_USER_EMAIL },
  });

  console.log('');
  console.log('='.repeat(60));
  console.log('  ✓ CLEANUP COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Deleted user: ${userData.email}`);
  console.log(
    `Cascade deleted: ${userData.projectCount} project(s), ${userData.onboardingSessionCount} onboarding session(s)`
  );
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('');
    console.error('CLEANUP FAILED:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
