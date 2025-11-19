/**
 * MCP Tool: blueprint.get
 *
 * Purpose: Retrieve Session 3 blueprint data (project context from onboarding)
 *
 * Use Case: Agent needs to recall onboarding configuration (tech stack, roadmap, budget)
 *
 * Pattern: Zod schema → HTTP GET → Return project-context.json from OnboardingSession
 *
 * @see Sprint 8.5 Phase 2: Blueprint MCP Tool
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

// ============================================================================
// INPUT SCHEMA
// ============================================================================

const getBlueprintSchema = z.object({
  projectId: z.number()
    .int('Project ID must be an integer')
    .positive('Project ID must be positive'),
});

type GetBlueprintInput = z.infer<typeof getBlueprintSchema>;

// API Response Types
interface ProjectContextJson {
  metadata: {
    projectName: string;
    projectType: string;
    domain: string;
    targetUsers: string[];
    valueProposition: string;
    version: string;
    lastUpdated: string;
    createdBy: string;
  };
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    auth?: string;
    ai?: string;
    payments?: string;
    storage?: string;
    caching?: string;
    hosting: string;
    other?: string[];
  };
  phases: Array<{
    id: number;
    name: string;
    duration: string;
    goals: string[];
    deliverables: string[];
    status: string;
  }>;
  timeline: {
    startDate: string;
    estimatedDuration: string;
    targetLaunch: string;
  };
  budget: {
    development: string;
    monthly_operating: string;
    infrastructure?: string;
  };
  features?: Array<{
    id: number;
    name: string;
    description: string;
    priority: string;
    phase: number;
    status: string;
  }>;
  planningAnswers?: {
    strategic: Record<string, any>;
    detailed: Record<string, any>;
  };
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Handler for blueprint.get tool
 *
 * Flow:
 * 1. Call GET /api/onboarding/blueprint with projectId
 * 2. Parse project-context.json from Session 3 response
 * 3. Format response for agent consumption
 */
async function handler(
  input: GetBlueprintInput,
  context: ToolContext
): Promise<string> {
  try {
    // 1. Build query string
    const params = new URLSearchParams({
      projectId: input.projectId.toString(),
    });

    // 2. Call Next.js API
    const url = `/api/onboarding/blueprint?${params.toString()}`;
    const blueprint = await context.httpClient.get<ProjectContextJson>(url);

    // 3. Format response for MCP
    return JSON.stringify({
      message: `Retrieved Session 3 blueprint for project ${input.projectId}`,
      projectName: blueprint.metadata?.projectName || 'Unknown',
      blueprint: {
        metadata: blueprint.metadata,
        techStack: blueprint.techStack,
        phases: blueprint.phases,
        timeline: blueprint.timeline,
        budget: blueprint.budget,
        features: blueprint.features,
      },
      summary: {
        totalPhases: blueprint.phases?.length || 0,
        techStack: Object.keys(blueprint.techStack || {}).length,
        targetLaunch: blueprint.timeline?.targetLaunch || 'Not set',
      },
      usage: [
        'Use metadata to understand project context',
        'Reference techStack for technology decisions',
        'Follow phases for roadmap guidance',
        'Check timeline for deadline awareness',
        'Review budget for cost considerations',
      ],
    }, null, 2);
  } catch (error: any) {
    // Error handling
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';

    return JSON.stringify({
      error: 'Failed to retrieve Session 3 blueprint',
      details: errorMessage,
      suggestion:
        status === 404
          ? 'Session 3 (Bootstrap) not found. Complete onboarding first by running Sessions 1, 2, and 3.'
          : status === 400
          ? 'Invalid projectId provided. Ensure projectId is a positive integer.'
          : 'Verify API is running and projectId is valid. Check if Session 3 was completed successfully.',
      troubleshooting: [
        'Confirm project exists in database',
        'Verify Session 3 was completed (status = "completed")',
        'Check OnboardingSession.response field is not null',
        'Ensure project-context.json was populated in Session 2',
      ],
    }, null, 2);
  }
}

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const blueprintGetTool: ToolDefinition = {
  name: 'projectpulse.blueprint.get',
  description:
    'Retrieve Session 3 blueprint data containing project context, tech stack, roadmap phases, timeline, and budget. Use this to recall onboarding configuration.',
  schema: getBlueprintSchema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID (integer, positive)',
      },
    },
    required: ['projectId'],
  },
  execute: async (params, context) => {
    const input = params as GetBlueprintInput;
    const result = await handler(input, context);

    context.logger.info('Blueprint retrieved', {
      projectId: input.projectId,
    });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  },
};
