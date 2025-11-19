/**
 * Sprint 8.5 Data Migration: Add Sprint Layer
 *
 * Purpose: Migrate existing Phase → Week hierarchy to Phase → Sprint → Week
 *
 * What this does:
 * 1. For each Phase with Weeks, create a "Default Sprint"
 * 2. Update all Weeks in that Phase to point to the new Sprint
 * 3. Maintain backward compatibility (keep phaseId until Task 0.3 complete)
 *
 * Run with: npx tsx scripts/migrate-sprint-layer.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToSprintLayer() {
  console.log('🚀 Starting Sprint layer migration...\n');

  try {
    // Get all Phases with their Weeks
    const phases = await prisma.phase.findMany({
      include: {
        weeks: {
          where: {
            sprintId: null, // Only migrate Weeks without Sprint
          },
        },
      },
    });

    console.log(`📊 Found ${phases.length} phases to process\n`);

    for (const phase of phases) {
      if (phase.weeks.length === 0) {
        console.log(`⏭️  Skipping "${phase.title}" - no unmigrated weeks`);
        continue;
      }

      console.log(`\n📦 Processing Phase: "${phase.title}"`);
      console.log(`   Weeks to migrate: ${phase.weeks.length}`);

      // Create Sprint for this Phase
      const sprint = await prisma.sprint.create({
        data: {
          title: `${phase.title} - Default Sprint`,
          description: 'Auto-generated Sprint for backward compatibility during Sprint 8.5 migration',
          status: phase.status,
          progress: phase.progress,
          startDate: phase.startDate,
          endDate: phase.endDate,
          phaseId: phase.id,
        },
      });

      console.log(`   ✅ Created Sprint: "${sprint.title}" (${sprint.id})`);

      // Update all Weeks in this Phase to point to the new Sprint
      const updateResult = await prisma.week.updateMany({
        where: {
          phaseId: phase.id,
          sprintId: null, // Only update unmigrated weeks
        },
        data: {
          sprintId: sprint.id,
        },
      });

      console.log(`   ✅ Updated ${updateResult.count} weeks with sprintId`);
    }

    // Verify migration
    const unmigrated = await prisma.week.count({
      where: { sprintId: null },
    });

    console.log('\n📊 Migration Results:');
    console.log(`   ✅ Unmigrated weeks remaining: ${unmigrated}`);

    if (unmigrated === 0) {
      console.log('\n🎉 Sprint layer migration completed successfully!');
      console.log('   All Week records now have a Sprint parent.');
    } else {
      console.log(`\n⚠️  Warning: ${unmigrated} weeks still need migration`);
      console.log('   Run this script again to complete the migration.');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToSprintLayer()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
