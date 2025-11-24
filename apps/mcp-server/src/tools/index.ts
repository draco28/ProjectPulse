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
// Sprint 9 Refactor: Session 1 refactored tools
import { getPhasedQuestionsTool } from './onboarding/getPhasedQuestionsTool.js';
import { savePhaseTool } from './onboarding/savePhaseTool.js';
import { finalizeSummaryTool } from './onboarding/finalizeSummaryTool.js';
import { checkTokenBudgetTool } from './onboarding/checkTokenBudgetTool.js';
// Sprint 8.6 Phase 2: Session 2 document generation tools (Agent-Side AI)
import { getDocumentPromptsTool } from './onboarding/getDocumentPromptsTool.js';
import { storeDocumentTool } from './onboarding/storeDocumentTool.js';
import { listDocumentsTool } from './onboarding/listDocumentsTool.js';
// Sprint 9 Refactor: Session 2 refactored tools
import { getDocBatchPromptTool } from './onboarding/getDocBatchPromptTool.js';
import { storeBatchTool } from './onboarding/storeBatchTool.js';
// Sprint 8.6 Phase 3: Session 3 bootstrap tool (Template-Based)
import { bootstrapTool } from './onboarding/bootstrapTool.js';
// Sprint 9 Refactor: Session 3 refactored tools
import { getBootstrapPromptTool } from './onboarding/getBootstrapPromptTool.js';
import { writeMinimalTool } from './repo/writeMinimalTool.js';
// Week 3 Enhancement: Batch create tools for Session 3 bootstrap
import { createAgentPersonaBatchTool } from './batch/createAgentPersonaBatchTool.js';
import { createSkillBatchTool } from './batch/createSkillBatchTool.js';
import { createWorkflowTemplateBatchTool } from './batch/createWorkflowTemplateBatchTool.js';
import { createSOPBatchTool } from './batch/createSOPBatchTool.js';
// Week 3 Enhancement: Observability tools for agent action logging
import { logStepTool } from './observability/logStepTool.js';
import { completeSessionTool } from './observability/completeSessionTool.js';
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
// Sprint 9: Memory Bank System
import { memorySessionStartTool } from './memory/sessionStartTool.js';
import { memoryPatternLookupTool } from './memory/patternLookupTool.js';
import { memoryContextRecoveryTool } from './memory/contextRecoveryTool.js';

export const loadTools = (): ToolDefinition[] => [
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
  // Sprint 8.6 Phase 1: Session 1 tools (Agent-Side AI - Legacy, kept for backward compat)
  getQuestionsTool,
  saveAnswersTool,
  getExecutiveSummaryPromptTool,
  storeExecutiveSummaryTool,
  // Sprint 9 Refactor: Session 1 refactored tools (New)
  getPhasedQuestionsTool,
  savePhaseTool,
  finalizeSummaryTool,
  checkTokenBudgetTool,
  // Sprint 8.6 Phase 2: Session 2 tools (Agent-Side AI - Legacy, kept for backward compat)
  getDocumentPromptsTool,
  storeDocumentTool,
  listDocumentsTool,
  // Sprint 9 Refactor: Session 2 refactored tools (New)
  getDocBatchPromptTool,
  storeBatchTool,
  // Sprint 8.6 Phase 3: Session 3 bootstrap tool (Template-Based - Legacy)
  bootstrapTool,
  // Sprint 9 Refactor: Session 3 refactored tools (New)
  getBootstrapPromptTool,
  writeMinimalTool,
  // Week 3 Enhancement: Batch create tools for Session 3 bootstrap (New)
  createAgentPersonaBatchTool,
  createSkillBatchTool,
  createWorkflowTemplateBatchTool,
  createSOPBatchTool,
  // Week 3 Enhancement: Observability tools (New)
  logStepTool,
  completeSessionTool,
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
  // Sprint 9: Memory Bank System tools
  memorySessionStartTool,
  memoryPatternLookupTool,
  memoryContextRecoveryTool,
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
