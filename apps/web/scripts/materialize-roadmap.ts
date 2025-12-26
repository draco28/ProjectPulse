/**
 * Sprint 8.5: Roadmap Materialization Script
 *
 * Purpose: Convert Roadmap JSON phases → normalized Phase/Sprint/Week/Day records
 * Use: npx tsx scripts/materialize-roadmap.ts <roadmapId>
 *
 * This script:
 * 1. Loads Roadmap record with JSON phases
 * 2. Creates Phase records
 * 3. Creates Sprint records (5th level)
 * 4. Creates Week records (linked to Sprint)
 * 5. Creates Day records (5 days per week: Mon-Fri)
 *
 * Result: Complete 5-level hierarchy materialized in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedRoadmap {
  phases: Array<{
    name: string;
    duration: string;
    sprints: Array<{
      name: string;
      duration: string;
      weeks: string;
      goals: string[];
      deliverables: string[];
      storyPoints: number;
    }>;
  }>;
}

/**
 * Calculate end date from start date and duration string
 * @param startDate - Starting date
 * @param duration - Duration string (e.g., "2 weeks", "6 weeks")
 * @returns End date
 */
function calculateEndDate(startDate: Date, duration: string): Date {
  const weeks = parseInt(duration.match(/(\d+)\s*week/)?.[1] || '2', 10);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeks * 7 - 1);
  return endDate;
}

/**
 * Materialize roadmap JSON to database records
 * @param roadmapId - Roadmap ID to materialize
 */
async function materializeRoadmap(roadmapId: string) {
  try {
    // 1. Load roadmap
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      include: {
        phases_rel: {
          include: {
            sprints: {
              include: {
                weeks: {
                  include: {
                    days: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!roadmap) {
      console.error(`Roadmap not found: ${roadmapId}`);
      process.exit(1);
    }

    // Check if already materialized
    if (roadmap.phases_rel.length > 0) {
      console.log(`⚠️  Roadmap already materialized (${roadmap.phases_rel.length} phases exist)`);
      console.log(
        `Do you want to delete existing records and re-materialize? (This will delete all hierarchy data)`
      );
      console.log(
        `Skipping materialization. To force re-materialization, manually delete Phase records first.`
      );
      return;
    }

    console.log(`\n🚀 Materializing roadmap: ${roadmapId}`);
    console.log(`Project ID: ${roadmap.projectId}\n`);

    const phases = roadmap.phases as unknown as ParsedRoadmap['phases'];

    const createdIds = {
      phaseIds: [] as string[],
      sprintIds: [] as string[],
      weekIds: [] as string[],
      dayIds: [] as string[],
    };

    let currentDate = new Date(); // Start from today
    let globalWeekNumber = 1; // Track absolute week numbers

    // 2. Create Phase records
    for (const phaseJson of phases) {
      console.log(`\n📦 Creating Phase: "${phaseJson.name}"`);

      const phaseEndDate = calculateEndDate(currentDate, phaseJson.duration);

      const phase = await prisma.phase.create({
        data: {
          title: phaseJson.name,
          description: `Duration: ${phaseJson.duration}, Sprints: ${phaseJson.sprints.length}`,
          status: 'NOT_STARTED',
          progress: 0,
          startDate: currentDate,
          endDate: phaseEndDate,
          roadmapId: roadmap.id,
        },
      });

      createdIds.phaseIds.push(phase.id);
      console.log(`   ✅ Phase created (${phase.id})`);
      console.log(
        `   Duration: ${currentDate.toISOString().split('T')[0]} → ${phaseEndDate.toISOString().split('T')[0]}`
      );

      // 3. Create Sprint records
      let sprintStartDate = new Date(currentDate);
      let sprintNumber = 0; // Sprint 15: Track sprint number within phase

      for (const sprintJson of phaseJson.sprints) {
        sprintNumber++; // Sprint 15: Increment before creating
        console.log(`\n  ⚡ Creating Sprint: "${sprintJson.name}" (Sprint ${sprintNumber})`);

        const sprintEndDate = calculateEndDate(sprintStartDate, sprintJson.duration);

        const sprint = await prisma.sprint.create({
          data: {
            title: sprintJson.name,
            description: `Goals: ${sprintJson.goals.length}, Deliverables: ${sprintJson.deliverables.length}`,
            status: 'NOT_STARTED',
            progress: 0,
            startDate: sprintStartDate,
            endDate: sprintEndDate,
            phaseId: phase.id,
            sprintNumber: sprintNumber, // Sprint 15: Set sprint number for FK correlation
          },
        });

        createdIds.sprintIds.push(sprint.id);
        console.log(`     ✅ Sprint created (${sprint.id})`);
        console.log(
          `     Duration: ${sprintStartDate.toISOString().split('T')[0]} → ${sprintEndDate.toISOString().split('T')[0]}`
        );
        console.log(`     Story Points: ${sprintJson.storyPoints}`);

        // 4. Create Week records
        const weekCount = parseInt(sprintJson.duration.match(/(\d+)\s*week/)?.[1] || '2', 10);

        let weekStartDate = new Date(sprintStartDate);

        for (let w = 1; w <= weekCount; w++) {
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 6);

          const week = await prisma.week.create({
            data: {
              title: `Week ${globalWeekNumber}`,
              description: `${sprintJson.name} - Week ${w} of ${weekCount}`,
              status: 'NOT_STARTED',
              progress: 0,
              startDate: weekStartDate,
              endDate: weekEndDate,
              sprintId: sprint.id,
              phaseId: phase.id, // Keep legacy parent for backward compatibility
            },
          });

          createdIds.weekIds.push(week.id);
          console.log(`       📅 Week ${globalWeekNumber} created (${week.id})`);

          // 5. Create Day records (Monday-Friday)
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          let dayDate = new Date(weekStartDate);

          for (let d = 0; d < 5; d++) {
            const dayName = dayNames[d]!; // Non-null assertion: d is always 0-4, array has 5 elements
            const day = await prisma.day.create({
              data: {
                title: dayName,
                description: `Week ${globalWeekNumber} - ${dayName}`,
                status: 'NOT_STARTED',
                progress: 0,
                startDate: dayDate,
                weekId: week.id,
              },
            });

            createdIds.dayIds.push(day.id);

            dayDate = new Date(dayDate);
            dayDate.setDate(dayDate.getDate() + 1);
          }

          console.log(`          ✅ 5 days created (Mon-Fri)`);

          // Move to next week
          weekStartDate = new Date(weekStartDate);
          weekStartDate.setDate(weekStartDate.getDate() + 7);
          globalWeekNumber++;
        }

        // Move to next sprint (start on Monday after previous sprint ends)
        sprintStartDate = new Date(sprintEndDate);
        sprintStartDate.setDate(sprintStartDate.getDate() + 1);
      }

      // Move to next phase
      currentDate = new Date(phaseEndDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`\n✅ Materialization complete!`);
    console.log(`\nCreated:`);
    console.log(`  Phases: ${createdIds.phaseIds.length}`);
    console.log(`  Sprints: ${createdIds.sprintIds.length}`);
    console.log(`  Weeks: ${createdIds.weekIds.length}`);
    console.log(`  Days: ${createdIds.dayIds.length}`);

    console.log(`\nNext step: View roadmap at /roadmap page`);
    console.log(`  (Task B: UI implementation)`);
  } catch (error) {
    console.error('\n❌ Materialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const roadmapId = process.argv[2];

if (!roadmapId) {
  console.error('Usage: npx tsx scripts/materialize-roadmap.ts <roadmapId>');
  process.exit(1);
}

materializeRoadmap(roadmapId);
