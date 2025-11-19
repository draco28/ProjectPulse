import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { ToolDefinition, ToolContext } from './types.js';
import { healthCheckTool } from './healthCheck.js';
import { sprintPhaseCreateTool } from './sprintPhaseCreate.js';
import { sprintGetCurrentTaskTool } from './sprintGetCurrentTask.js';
import { sprintUpdateProgressTool } from './sprintUpdateProgress.js';
import { sprintTaskCreateTool } from './sprintTaskCreate.js';
import { sprintSessionCreateTool } from './sprintSessionCreate.js';
import { sprintCheckpointCreateTool } from './sprintCheckpointCreate.js';
import { sprintQueryHierarchyTool } from './sprintQueryHierarchy.js';
import { wikiCreateTool } from './wikiCreate.js';
import { wikiSearchTool } from './wikiSearch.js';
import { wikiUpdateTool } from './wikiUpdate.js';
import { wikiAnalyticsTopPagesTool } from './wikiAnalyticsTopPages.js';
import { wikiGenerateTool } from './wikiGenerate.js';
import { onboardingGetPromptTool } from './onboarding/getPrompt.js';
import { onboardingSubmitResponseTool } from './onboarding/submitResponse.js';
import { blueprintGetTool } from './onboarding/getBlueprintTool.js';
// Sprint 8.6 Phase 1: Session 1 onboarding tools (Agent-Side AI)
import { getQuestionsTool } from './onboarding/getQuestionsTool.js';
import { saveAnswersTool } from './onboarding/saveAnswersTool.js';
import { getExecutiveSummaryPromptTool } from './onboarding/getExecutiveSummaryPromptTool.js';
import { storeExecutiveSummaryTool } from './onboarding/storeExecutiveSummaryTool.js';
// Sprint 8.6 Phase 2: Session 2 document generation tools (Agent-Side AI)
import { getDocumentPromptsTool } from './onboarding/getDocumentPromptsTool.js';
import { storeDocumentTool } from './onboarding/storeDocumentTool.js';
import { listDocumentsTool } from './onboarding/listDocumentsTool.js';
import { workflowListTool } from './workflow/list.js';
import { workflowStartTool } from './workflow/start.js';
import { workflowExecuteStepTool } from './workflow/executeStep.js';
import { workflowGetStatusTool } from './workflow/getStatus.js';
import { workflowPauseTool } from './workflow/pause.js';
import { workflowResumeTool } from './workflow/resume.js';
import { workflowCompleteTool } from './workflow/complete.js';
import { issueCreateTool } from './issues/create.js';
import { issueBulkCreateTool } from './issues/bulkCreate.js';
import { issueUpdateTool } from './issues/update.js';
import { issueSearchTool } from './issues/search.js';
import { issueAddCommentTool } from './issues/addComment.js';
import { issueSetStatusTool } from './issues/setStatus.js';
import { materializeRoadmapTool } from './roadmap/materializeTool.js';
import { getCurrentPositionTool } from './roadmap/getCurrentPositionTool.js';
import { getPhaseProgressTool } from './roadmap/getPhaseProgressTool.js';

const loadTools = (): ToolDefinition[] => [
  healthCheckTool,
  sprintPhaseCreateTool,
  sprintGetCurrentTaskTool,
  sprintUpdateProgressTool,
  sprintTaskCreateTool,
  sprintSessionCreateTool,
  sprintCheckpointCreateTool,
  sprintQueryHierarchyTool,
  wikiCreateTool,
  wikiSearchTool,
  wikiUpdateTool,
  wikiAnalyticsTopPagesTool,
  wikiGenerateTool,
  onboardingGetPromptTool,
  onboardingSubmitResponseTool,
  blueprintGetTool,
  // Sprint 8.6 Phase 1: Session 1 tools (Agent-Side AI)
  getQuestionsTool,
  saveAnswersTool,
  getExecutiveSummaryPromptTool,
  storeExecutiveSummaryTool,
  // Sprint 8.6 Phase 2: Session 2 tools (Agent-Side AI)
  getDocumentPromptsTool,
  storeDocumentTool,
  listDocumentsTool,
  issueCreateTool,
  issueBulkCreateTool,
  issueUpdateTool,
  issueSearchTool,
  issueAddCommentTool,
  issueSetStatusTool,
  workflowListTool,
  workflowStartTool,
  workflowExecuteStepTool,
  workflowGetStatusTool,
  workflowPauseTool,
  workflowResumeTool,
  workflowCompleteTool,
  // Sprint 8.5 Phase 1: Roadmap materialization tools
  materializeRoadmapTool,
  getCurrentPositionTool,
  // Sprint 8.5 Phase 4: Roadmap read tools
  getPhaseProgressTool,
];

export const registerTools = (server: Server, context: ToolContext) => {
  const tools = loadTools();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const tool = tools.find((item) => item.name === name);

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool "${name}". Available tools: ${tools.map((t) => t.name).join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const parsed = tool.schema.parse(rawArgs ?? {});
      return await tool.execute(parsed, context);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      context.logger.error('Tool execution failed', { tool: tool.name, error: details });
      return {
        content: [
          {
            type: 'text',
            text: `Tool "${tool.name}" failed: ${details}`,
          },
        ],
        isError: true,
      };
    }
  });

  context.logger.info('Tools registered', { count: tools.length });
};
