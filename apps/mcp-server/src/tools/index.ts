import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { ToolDefinition, ToolContext } from './types.js';
import { getAgentAuth, isToolAllowed } from '../authContext.js';
// Sprint 11.5: Admin controls for global blocklist and logging
import { checkBlockedTool, logToolCall } from '../adminControls.js';
import { healthCheckTool } from './healthCheck.js';
import { sprintPhaseCreateTool } from './sprintPhaseCreate.js';
// Sprint 12: sprintGetCurrentTask, sprintTask*, sprintSession*, sprintCheckpoint* REMOVED
// Task/Session/Checkpoint models deleted - use AgentSession tools instead
import { sprintUpdateProgressTool } from './sprintUpdateProgress.js';
import { sprintQueryHierarchyTool } from './sprintQueryHierarchy.js';
// Sprint 12: New agent session tools for work tracking
import { agentSessionStartTool } from './agent-session/startTool.js';
import { agentSessionUpdateTool } from './agent-session/updateTool.js';
import { agentSessionEndTool } from './agent-session/endTool.js';
import { wikiCreateTool } from './wikiCreate.js';
import { wikiSearchTool } from './wikiSearch.js';
import { wikiUpdateTool } from './wikiUpdate.js';
import { wikiAnalyticsTopPagesTool } from './wikiAnalyticsTopPages.js';
import { wikiGenerateTool } from './wikiGenerate.js';
import { wikiGetTool } from './wikiGet.js';
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
// Sprint 12: Session 3 sync tool (for batch tool users)
import { syncSession3Tool } from './onboarding/syncSession3Tool.js';
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
// Sprint 10: Ticket tools (unified ticket system - replaces issue tools)
import { ticketCreateTool } from './tickets/create.js';
import { ticketBulkCreateTool } from './tickets/bulkCreate.js';
import { ticketUpdateTool } from './tickets/update.js';
import { ticketSearchTool } from './tickets/search.js';
import { ticketAddCommentTool } from './tickets/addComment.js';
import { ticketSetStatusTool } from './tickets/setStatus.js';
// Sprint 13: Ticket hierarchy tools
import { ticketGetChildrenTool } from './tickets/getChildren.js';
import { ticketGetHierarchyTool } from './tickets/getHierarchy.js';
// Sprint 13: Traceability tools
import { traceabilityGenerateTool } from './traceability/generateTool.js';
// Sprint 10: Legacy issue adapter tools REMOVED (Sprint 11)
// Use ticket tools with kind=issue|bug|scanner_finding instead
import { materializeRoadmapTool } from './roadmap/materializeTool.js';
import { getCurrentPositionTool } from './roadmap/getCurrentPositionTool.js';
import { getPhaseProgressTool } from './roadmap/getPhaseProgressTool.js';
import { roadmapCreateTool } from './roadmap/createTool.js';
// ⚠️ DEPRECATED: Sprint 9 Memory Bank tools (kept for backward compatibility)
// Use context tools below instead - they provide enhanced functionality
import { memorySessionStartTool } from './memory/sessionStartTool.js';    // DEPRECATED → contextLoadTool
import { memoryPatternLookupTool } from './memory/patternLookupTool.js';  // DEPRECATED → contextLookupTool
import { memoryContextRecoveryTool } from './memory/contextRecoveryTool.js'; // DEPRECATED → contextLoadTool with banksToLoad: 'active-only'
// ✅ PREFERRED: Self-Guiding MCP Architecture context tools
import { contextLoadTool } from './context/loadTool.js';      // START HERE - unified entry point
import { contextLookupTool } from './context/lookupTool.js';  // Token-efficient single bank lookup
import { contextUpdateTool } from './context/updateTool.js';  // User-explicit bank updates
// Sprint 9 Phase 3: Knowledge Base Integration
import { knowledgeSearchTool } from './knowledge/searchTool.js';
import { knowledgeCreateTool } from './knowledge/createTool.js';
import { knowledgeExportTool } from './knowledge/exportTool.js';
import { knowledgeImportTool } from './knowledge/importTool.js';
import { knowledgeArchiveTool } from './knowledge/archiveTool.js';
import { knowledgeMetricsTool } from './knowledge/metricsTool.js';
import { knowledgeRelatedTool } from './knowledge/relatedTool.js';
// Sprint 11: Client Agent Integration APIs (EPIC-013)
import { personaListTool } from './personas/listTool.js';
import { personaGetTool } from './personas/getTool.js';
import { skillListTool } from './skills/listTool.js';
import { skillGetTool } from './skills/getTool.js';
import { sopListTool } from './sops/listTool.js';
import { sopGetTool } from './sops/getTool.js';

export const loadTools = (): ToolDefinition[] => [
  healthCheckTool,
  sprintPhaseCreateTool,
  // Sprint 12: Task/Session/Checkpoint tools removed - models deleted
  sprintUpdateProgressTool,
  sprintQueryHierarchyTool,
  // Sprint 12: New agent session tools
  agentSessionStartTool,
  agentSessionUpdateTool,
  agentSessionEndTool,
  wikiCreateTool,
  wikiSearchTool,
  wikiGetTool,
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
  // Sprint 12: Session 3 sync tool (for batch tool users)
  syncSession3Tool,
  // Week 3 Enhancement: Batch create tools for Session 3 bootstrap (New)
  createAgentPersonaBatchTool,
  createSkillBatchTool,
  createWorkflowTemplateBatchTool,
  createSOPBatchTool,
  // Week 3 Enhancement: Observability tools (New)
  logStepTool,
  completeSessionTool,
  // Sprint 10: Ticket tools (unified ticket system - implements all 7 kinds including issue)
  ticketCreateTool,
  ticketBulkCreateTool,
  ticketUpdateTool,
  ticketSearchTool,
  ticketAddCommentTool,
  ticketSetStatusTool,
  // Sprint 13: Ticket hierarchy tools
  ticketGetChildrenTool,
  ticketGetHierarchyTool,
  // Sprint 13: Traceability tools
  traceabilityGenerateTool,
  // Sprint 10: Legacy issue tools REMOVED (Sprint 11) - use ticket tools instead
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
  // Sprint 9: Roadmap creation tool for MCP agents
  roadmapCreateTool,
  // ⚠️ DEPRECATED: Sprint 9 Memory Bank tools (kept for backward compatibility)
  // Use context tools below instead - they provide enhanced functionality
  memorySessionStartTool,       // DEPRECATED → use contextLoadTool
  memoryPatternLookupTool,      // DEPRECATED → use contextLookupTool
  memoryContextRecoveryTool,    // DEPRECATED → use contextLoadTool with banksToLoad: 'active-only'
  // ✅ PREFERRED: Self-Guiding MCP Architecture context tools
  contextLoadTool,      // 🚀 START HERE - unified entry with banks + session + hints
  contextLookupTool,    // Token-efficient single bank lookup with formatting
  contextUpdateTool,    // User-explicit bank updates with budget validation
  // Sprint 9 Phase 3: Knowledge Base Integration
  knowledgeSearchTool,
  knowledgeCreateTool,
  knowledgeExportTool,
  knowledgeImportTool,
  knowledgeArchiveTool,
  knowledgeMetricsTool,
  knowledgeRelatedTool,
  // Sprint 11: Client Agent Integration APIs (EPIC-013)
  personaListTool,
  personaGetTool,
  skillListTool,
  skillGetTool,
  sopListTool,
  sopGetTool,
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
    const auth = getAgentAuth();
    const startTime = Date.now();

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

    // Sprint 10: Check per-token tool permissions
    if (!isToolAllowed(name)) {
      context.logger.warn('Tool execution denied by token permissions', {
        tool: name,
        projectId: auth?.projectId,
        blockedTools: auth?.blockedTools,
        allowedTools: auth?.allowedTools,
      });

      // Log the blocked attempt (fire-and-forget)
      if (auth) {
        logToolCall({
          tokenId: auth.tokenId,
          projectId: auth.projectId,
          toolName: name,
          duration: Date.now() - startTime,
          success: false,
          error: 'Blocked by token permissions',
        }).catch(() => {}); // Non-blocking
      }

      return {
        content: [
          {
            type: 'text',
            text: `Tool "${name}" is not authorized for this token. Contact your project admin to update permissions.`,
          },
        ],
        isError: true,
      };
    }

    // Sprint 11.5: Check global admin blocklist
    try {
      const isGloballyBlocked = await checkBlockedTool(name);
      if (isGloballyBlocked) {
        context.logger.warn('Tool execution denied by global admin blocklist', {
          tool: name,
          projectId: auth?.projectId,
        });

        // Log the blocked attempt (fire-and-forget)
        if (auth) {
          logToolCall({
            tokenId: auth.tokenId,
            projectId: auth.projectId,
            toolName: name,
            duration: Date.now() - startTime,
            success: false,
            error: 'Blocked by admin: Global blocklist',
          }).catch(() => {}); // Non-blocking
        }

        return {
          content: [
            {
              type: 'text',
              text: `Tool "${name}" is currently disabled by administrator. Please try again later or contact support.`,
            },
          ],
          isError: true,
        };
      }
    } catch (err) {
      // Fail open on blocklist check errors
      context.logger.warn('Global blocklist check failed, allowing tool', {
        tool: name,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      const parsed = tool.schema.parse(rawArgs ?? {});
      const result = await tool.execute(parsed, context);
      const duration = Date.now() - startTime;

      // Sprint 11.5: Log successful tool call (fire-and-forget)
      if (auth) {
        logToolCall({
          tokenId: auth.tokenId,
          projectId: auth.projectId,
          toolName: name,
          duration,
          success: !result.isError,
          error: result.isError ? (result.content[0] as { text?: string })?.text : undefined,
        }).catch(() => {}); // Non-blocking
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const details = error instanceof Error ? error.message : String(error);
      context.logger.error('Tool execution failed', { tool: tool.name, error: details });

      // Sprint 11.5: Log failed tool call (fire-and-forget)
      if (auth) {
        logToolCall({
          tokenId: auth.tokenId,
          projectId: auth.projectId,
          toolName: name,
          duration,
          success: false,
          error: details,
        }).catch(() => {}); // Non-blocking
      }

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
