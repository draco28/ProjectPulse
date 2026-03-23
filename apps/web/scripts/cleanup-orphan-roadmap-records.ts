#!/usr/bin/env npx tsx
/**
 * Cleanup Orphaned Roadmap Records
 *
 * Sprint 15 Bug Fix: Remove orphaned Phase/Sprint records created by
 * incorrect cascade delete behavior (onDelete: SetNull instead of Cascade).
 *
 * This script:
 * 1. Finds phases with roadmapId IS NULL (orphaned)
 * 2. Finds sprints linked to those orphaned phases
 * 3. Deletes sprints first (FK constraint), then phases
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/cleanup-orphan-roadmap-records.ts
 *
 * For production, use --confirm flag to execute:
 *   DATABASE_URL="..." npx tsx scripts/cleanup-orphan-roadmap-records.ts --confirm
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isConfirmed = args.includes('--confirm');
  const isDryRun = !isConfirmed;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Orphaned Phase/Sprint Cleanup Script                        ║');
  console.log('║  Sprint 15 Bug Fix                                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('   To execute, run with: --confirm');
    console.log('');
  } else {
    console.log('⚠️  LIVE MODE - Changes will be committed to database');
    console.log('');
  }

  // Step 1: Find orphaned phases (roadmapId IS NULL)
  const orphanedPhases = await prisma.phase.findMany({
    where: { roadmapId: null },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      _count: { select: { sprints: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Found ${orphanedPhases.length} orphaned Phase records:`);
  if (orphanedPhases.length > 0) {
    console.log('');
    console.log('   ID                        | Title                          | Sprints | Status');
    console.log(
      '   --------------------------+--------------------------------+---------+----------'
    );
    for (const phase of orphanedPhases) {
      const id = phase.id.padEnd(25);
      const title = phase.title.substring(0, 30).padEnd(30);
      const sprints = String(phase._count.sprints).padStart(7);
      console.log(`   ${id} | ${title} | ${sprints} | ${phase.status}`);
    }
    console.log('');
  }

  // Step 2: Find orphaned sprints (linked to orphaned phases)
  const orphanedPhaseIds = orphanedPhases.map((p) => p.id);
  const orphanedSprints = await prisma.sprint.findMany({
    where: { phaseId: { in: orphanedPhaseIds } },
    select: {
      id: true,
      title: true,
      sprintNumber: true,
      status: true,
      phaseId: true,
    },
    orderBy: { sprintNumber: 'asc' },
  });

  console.log(`📊 Found ${orphanedSprints.length} orphaned Sprint records:`);
  if (orphanedSprints.length > 0 && orphanedSprints.length <= 20) {
    console.log('');
    console.log('   Sprint # | Title                          | Status');
    console.log('   ---------+--------------------------------+----------');
    for (const sprint of orphanedSprints) {
      const num = String(sprint.sprintNumber).padStart(8);
      const title = sprint.title.substring(0, 30).padEnd(30);
      console.log(`   ${num} | ${title} | ${sprint.status}`);
    }
  } else if (orphanedSprints.length > 20) {
    console.log(`   (Showing first 20 of ${orphanedSprints.length})`);
    console.log('');
    console.log('   Sprint # | Title                          | Status');
    console.log('   ---------+--------------------------------+----------');
    for (const sprint of orphanedSprints.slice(0, 20)) {
      const num = String(sprint.sprintNumber).padStart(8);
      const title = sprint.title.substring(0, 30).padEnd(30);
      console.log(`   ${num} | ${title} | ${sprint.status}`);
    }
    console.log(`   ... and ${orphanedSprints.length - 20} more`);
  }
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Total orphaned Phases:  ${orphanedPhases.length}`);
  console.log(`   Total orphaned Sprints: ${orphanedSprints.length}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  if (orphanedPhases.length === 0 && orphanedSprints.length === 0) {
    console.log('✅ No orphaned records found. Database is clean!');
    return;
  }

  if (isDryRun) {
    console.log('🔍 DRY RUN complete. To delete these records, run with --confirm');
    return;
  }

  // Step 3: Execute deletion (LIVE MODE)
  console.log('🗑️  Deleting orphaned records...');
  console.log('');

  // Delete sprints first (FK constraint)
  const deletedSprints = await prisma.sprint.deleteMany({
    where: { phaseId: { in: orphanedPhaseIds } },
  });
  console.log(`   ✅ Deleted ${deletedSprints.count} Sprint records`);

  // Delete phases
  const deletedPhases = await prisma.phase.deleteMany({
    where: { roadmapId: null },
  });
  console.log(`   ✅ Deleted ${deletedPhases.count} Phase records`);

  console.log('');
  console.log('✅ Cleanup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
