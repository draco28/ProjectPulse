/**
 * POST /api/repo/write-minimal
 * 
 * Sprint 9 Refactor: Optional write claude.md and agents.md to user repository
 * Sprint 11: Enhanced with dynamic persona/skill/SOP data from database
 * Only writes if explicitly requested - keeps repos clean by default
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  repoPath: z.string().min(1).max(500)
});

type WriteMinimalRequest = z.infer<typeof requestSchema>;

// ============================================================================
// TEMPLATE GENERATORS
// ============================================================================

interface ProjectData {
  projectId: number;
  projectName: string;
  personas: Array<{ name: string; slug: string; icon?: string | null; description?: string | null; expertise: string[] }>;
  skills: Array<{ title: string; slug: string; category: string; description?: string | null }>;
  sops: Array<{ title: string; slug: string; category: string; description?: string | null }>;
}

function generateClaudeMd(data: ProjectData): string {
  const personaSection = data.personas.length > 0
    ? data.personas.map(p => `- **${p.name}** (\`${p.slug}\`) ${p.icon || ''} - ${p.description || 'Expert agent'}`).join('\n')
    : '- _No personas configured yet_';

  return `# CLAUDE.md - ProjectPulse AI Workflow

**Project**: ${data.projectName}  
**Project ID**: ${data.projectId}  
**Generated**: ${new Date().toISOString()}

## Quick Start

This project uses ProjectPulse for AI-assisted development. Connect to the MCP server to access all workflows, personas, and tools.

### MCP Connection

\`\`\`json
{
  "mcpServers": {
    "projectpulse": {
      "url": "http://192.168.1.15:3001/mcp",
      "transport": "streamable-http"
    }
  }
}
\`\`\`

## Available MCP Tools

### Personas & Skills
- \`projectpulse_persona_list\` - List available expert personas
- \`projectpulse_persona_get\` - Get persona with system prompt
- \`projectpulse_skill_list\` - List available skills
- \`projectpulse_skill_get\` - Load skill content on-demand
- \`projectpulse_sop_list\` - List Standard Operating Procedures
- \`projectpulse_sop_get\` - Get SOP with full procedure

### Sprint & Tasks
- \`projectpulse_sprint_getCurrentTask\` - See current work
- \`projectpulse_sprint_updateProgress\` - Update task progress
- \`projectpulse_sprint_queryHierarchy\` - Query phases/weeks/days

### Workflows
- \`projectpulse_workflow_list\` - List available workflows
- \`projectpulse_workflow_start\` - Start a workflow
- \`projectpulse_workflow_executeStep\` - Execute workflow step

### Knowledge & Wiki
- \`projectpulse_knowledge_search\` - Search knowledge base
- \`projectpulse_wiki_search\` - Search wiki pages

### Tickets
- \`projectpulse_ticket_create\` - Create feature/bug/task
- \`projectpulse_ticket_search\` - Search tickets

## Available Personas

${personaSection}

## Example Usage

\`\`\`
// Start by getting your current task
Use projectpulse_sprint_getCurrentTask

// List available personas to adopt
Use projectpulse_persona_list with projectId: ${data.projectId}

// Load a specific persona's system prompt
Use projectpulse_persona_get with slug: "react-expert"

// Search for relevant skills
Use projectpulse_skill_list with projectId: ${data.projectId}, category: "framework"
\`\`\`

## Dashboard

For more details, visit: http://192.168.1.15:3000
`;
}

function generateAgentsMd(data: ProjectData): string {
  // Group skills by category
  const skillsByCategory: Record<string, typeof data.skills> = {};
  for (const skill of data.skills) {
    const cat = skill.category || 'General';
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(skill);
  }

  const skillsSection = Object.keys(skillsByCategory).length > 0
    ? Object.entries(skillsByCategory).map(([cat, skills]) => {
        const skillLines = skills.map(s => `  - **${s.title}** (\`${s.slug}\`) - ${s.description || 'Skill'}`).join('\n');
        return `### ${cat}\n\n${skillLines}`;
      }).join('\n\n')
    : '_No skills configured yet_';

  // Group SOPs by category
  const sopsByCategory: Record<string, typeof data.sops> = {};
  for (const sop of data.sops) {
    const cat = sop.category || 'General';
    if (!sopsByCategory[cat]) sopsByCategory[cat] = [];
    sopsByCategory[cat].push(sop);
  }

  const sopsSection = Object.keys(sopsByCategory).length > 0
    ? Object.entries(sopsByCategory).map(([cat, sops]) => {
        const sopLines = sops.map(s => `  - **${s.title}** (\`${s.slug}\`) - ${s.description || 'Procedure'}`).join('\n');
        return `### ${cat}\n\n${sopLines}`;
      }).join('\n\n')
    : '_No SOPs configured yet_';

  const personasSection = data.personas.length > 0
    ? data.personas.map(p => {
        const expertiseList = p.expertise?.length > 0 ? p.expertise.join(', ') : 'General';
        return `### ${p.name} ${p.icon || ''}\n\n**Slug**: \`${p.slug}\`  \n**Expertise**: ${expertiseList}\n\n${p.description || '_No description_'}`;
      }).join('\n\n')
    : '_No personas configured yet_';

  return `# AGENTS.md - AI Agent System

**Project**: ${data.projectName}  
**Project ID**: ${data.projectId}  
**Generated**: ${new Date().toISOString()}

## Overview

This project uses ProjectPulse's MCP-based agent system. All personas, skills, and SOPs are stored in the database and accessible via MCP tools.

## Agent Personas

${personasSection}

### Loading a Persona

\`\`\`
// List all personas
Use projectpulse_persona_list with projectId: ${data.projectId}

// Load full persona (includes system prompt)
Use projectpulse_persona_get with projectId: ${data.projectId}, slug: "persona-slug"
\`\`\`

## Skills Library

${skillsSection}

### Using Skills

\`\`\`
// List skills by category
Use projectpulse_skill_list with projectId: ${data.projectId}, category: "framework"

// Load skill content on-demand
Use projectpulse_skill_get with projectId: ${data.projectId}, slug: "skill-slug"
\`\`\`

## Standard Operating Procedures (SOPs)

${sopsSection}

### Using SOPs

\`\`\`
// List all SOPs
Use projectpulse_sop_list with projectId: ${data.projectId}

// Load SOP with full procedure
Use projectpulse_sop_get with projectId: ${data.projectId}, slug: "sop-slug"
\`\`\`

## Workflow Integration

Workflows are available via \`projectpulse_workflow_*\` tools:

\`\`\`
// List available workflows
Use projectpulse_workflow_list

// Start a workflow
Use projectpulse_workflow_start with templateId: 1

// Execute next step
Use projectpulse_workflow_executeStep with runId: 1
\`\`\`

## Dashboard

For more details, visit: http://192.168.1.15:3000
`;
}

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
    
    // 2. Query database for project data (Sprint 11 enhancement)
    const [project, personas, skills, sops] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true }
      }),
      prisma.agentPersona.findMany({
        where: { projectId, isActive: true },
        select: { name: true, slug: true, icon: true, description: true, expertise: true },
        orderBy: { name: 'asc' }
      }),
      prisma.skill.findMany({
        where: { projectId },
        select: { title: true, slug: true, category: true, description: true },
        orderBy: { category: 'asc' }
      }),
      prisma.sOP.findMany({
        where: { projectId },
        select: { title: true, slug: true, category: true, description: true },
        orderBy: { category: 'asc' }
      })
    ]);
    
    const projectData: ProjectData = {
      projectId,
      projectName: project?.name || `Project ${projectId}`,
      personas,
      skills,
      sops
    };
    
    console.log('[POST /api/repo/write-minimal] Fetched project data', {
      projectId,
      projectName: projectData.projectName,
      personaCount: personas.length,
      skillCount: skills.length,
      sopCount: sops.length
    });
    
    // 3. Generate enhanced template content
    const claudeContent = generateClaudeMd(projectData);
    const agentsContent = generateAgentsMd(projectData);
    
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
