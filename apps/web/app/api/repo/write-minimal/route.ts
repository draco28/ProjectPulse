/**
 * POST /api/repo/write-minimal
 * 
 * Sprint 9 Refactor: Optional write claude.md and agents.md to user repository
 * Only writes if explicitly requested - keeps repos clean by default
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  repoPath: z.string().min(1).max(500)
});

type WriteMinimalRequest = z.infer<typeof requestSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[POST /api/repo/write-minimal] Writing minimal repo files...');
  
  try {
    // 1. Validate request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('[POST /api/repo/write-minimal] Validation failed:', validation.error);
      
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { projectId, repoPath }: WriteMinimalRequest = validation.data;
    
    console.log('[POST /api/repo/write-minimal] Request validated', {
      projectId,
      repoPath
    });
    
    // 2. Generate claude.md content (simplified for MVP)
    const claudeContent = `# CLAUDE.md - ProjectPulse AI Workflow

**Project ID**: ${projectId}  
**Generated**: ${new Date().toISOString()}

## Quick Start

This project uses ProjectPulse for AI-assisted development. All workflows, personas, and SOPs are stored in the database and accessible via MCP tools.

## MCP Tools Available

- \`projectpulse.onboarding.*\` - Onboarding workflows
- \`projectpulse.sprint.*\` - Sprint planning and tracking
- \`projectpulse.workflow.*\` - Custom workflows
- \`projectpulse.issue.*\` - Issue management
- \`projectpulse.wiki.*\` - Documentation

## Agent Personas

Agent personas are stored in the database. Use MCP tools to query and activate them.

## Next Steps

1. Connect to ProjectPulse MCP server
2. Use \`projectpulse.sprint.getCurrentTask\` to see current work
3. Use \`projectpulse.workflow.list\` to see available workflows

For more details, visit the ProjectPulse dashboard at http://192.168.1.15:3000
`;
    
    // 3. Generate agents.md content (simplified for MVP)
    const agentsContent = `# AGENTS.md - AI Agent System

**Project ID**: ${projectId}  
**Generated**: ${new Date().toISOString()}

## Overview

This project uses ProjectPulse's MCP-based agent system for AI-assisted development.

## Available Agents

All agent personas, skills, and workflows are stored in the database and accessible via MCP tools.

### Query Agents

\`\`\`
# Get current task
projectpulse.sprint.getCurrentTask

# List workflows
projectpulse.workflow.list

# Search issues
projectpulse.issue.search
\`\`\`

## Skills Library

Skills are database-driven and automatically matched to tasks based on context.

## Workflows

Custom workflows are available via \`projectpulse.workflow.*\` tools.

## SOPs

Standard Operating Procedures are stored in the database and referenced by workflows.

For more details, visit the ProjectPulse dashboard at http://192.168.1.15:3000
`;
    
    // 4. Write files to repository
    const filesWritten: string[] = [];
    
    try {
      await writeFile(join(repoPath, 'CLAUDE.md'), claudeContent, 'utf-8');
      filesWritten.push('CLAUDE.md');
      console.log('[POST /api/repo/write-minimal] Wrote CLAUDE.md');
    } catch (error) {
      console.error('[POST /api/repo/write-minimal] Failed to write CLAUDE.md:', error);
      throw new Error(`Failed to write CLAUDE.md: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    try {
      await writeFile(join(repoPath, 'AGENTS.md'), agentsContent, 'utf-8');
      filesWritten.push('AGENTS.md');
      console.log('[POST /api/repo/write-minimal] Wrote AGENTS.md');
    } catch (error) {
      console.error('[POST /api/repo/write-minimal] Failed to write AGENTS.md:', error);
      throw new Error(`Failed to write AGENTS.md: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('[POST /api/repo/write-minimal] Files written successfully', {
      projectId,
      filesWritten,
      repoPath
    });
    
    return NextResponse.json({
      success: true,
      projectId,
      filesWritten,
      repoPath,
      message: `Optional files written to repo ✅ (${filesWritten.join(', ')})`
    });
    
  } catch (error) {
    console.error('[POST /api/repo/write-minimal] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to write minimal repo files', message: errorMessage },
      { status: 500 }
    );
  }
}
