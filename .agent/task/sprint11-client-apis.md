# Sprint 11: Client Agent Integration APIs (EPIC-013)

**Version**: 1.0.0
**Created**: 2025-11-27
**Status**: 📋 PLANNING
**Sprint Duration**: 2 weeks (~20 story points)
**Branch**: `feature/sprint-11-client-apis`

---

## 1. Executive Summary

### Goal

Expose ProjectPulse AI workflow artifacts (personas, skills, SOPs, workflows) via client-friendly MCP/HTTP APIs so **end-user agents** can consume the same workflows used during onboarding, without requiring `.agent/` or `.claude/` folders in user repositories.

### Business Value

- **End-user agents can discover and use project-specific personas** (e.g., "React Expert", "Security Auditor")
- **Skills library accessible via MCP** (lazy-load patterns, reducing token usage)
- **SOPs retrievable on-demand** (Git workflows, testing procedures, deployment guides)
- **Workflow templates listable and inspectable** (client agents can start predefined workflows)
- **Clean repositories** - All AI context stored in ProjectPulse DB, not user repos

### Success Criteria

| Metric | Target |
|--------|--------|
| Client agents can list personas for a project | ✅ Via MCP tool |
| Client agents can get persona details (including systemPrompt) | ✅ Via MCP tool |
| Client agents can list/get skills | ✅ Via MCP tools |
| Client agents can list/get SOPs | ✅ Via MCP tools |
| CLAUDE.md template documents client APIs | ✅ Enhanced template |
| AGENTS.md template lists available personas/skills | ✅ Enhanced template |
| All APIs project-scoped via bearer token | ✅ Multi-tenancy enforced |
| API response time | <200ms P95 |

---

## 2. Background & Context

### What We Have (Sprint 10 Complete)

1. **Authentication**: Bearer token auth with project scoping (`ProjectToken` model)
2. **Tool Permissions**: `blockedTools[]`, `allowedTools[]` per token
3. **Database Models**: All 4 models exist and are project-scoped:
   - `AgentPersona` - 17 fields including `systemPrompt`, `skills[]`, `tools[]`, `rules[]`
   - `Skill` - 12 fields including `content`, `category`, `tags[]`, `frameworks[]`
   - `SOP` - 9 fields including `content`, `category`, `tags[]`
   - `WorkflowTemplate` - 8 fields including `steps` (JSONB), `category`
4. **Batch CREATE tools**: `batch.createAgentPersonas`, `batch.createSkills`, `batch.createWorkflowTemplates`, `batch.createSOPs`
5. **Repo Write Tool**: `repo.writeMinimal` - Writes CLAUDE.md and AGENTS.md

### What's Missing

| Gap | Impact |
|-----|--------|
| No LIST/GET APIs for personas | Client agents can't discover available personas |
| No LIST/GET APIs for skills | Client agents can't lazy-load skills |
| No LIST/GET APIs for SOPs | Client agents can't reference SOPs |
| CLAUDE.md doesn't document client APIs | Users don't know how to configure agents |
| AGENTS.md is generic | Doesn't list project-specific personas/skills |

### Architecture Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                    End User's Claude Code                        │
│                                                                  │
│  1. Reads CLAUDE.md (generated during onboarding)               │
│  2. Connects to ProjectPulse MCP (bearer token in config)       │
│  3. Calls persona.list → Gets available expert personas         │
│  4. Calls skill.list → Gets available skills (metadata only)    │
│  5. Calls skill.get → Loads specific skill content on-demand    │
│  6. Uses personas/skills to enhance code assistance             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ MCP over HTTP (Bearer Token)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              ProjectPulse MCP Server (port 3001)                 │
│                                                                  │
│  NEW TOOLS:                                                      │
│  • persona.list    → List personas for project                  │
│  • persona.get     → Get persona details + systemPrompt         │
│  • skill.list      → List skills (metadata only)                │
│  • skill.get       → Get skill content                          │
│  • sop.list        → List SOPs (metadata only)                  │
│  • sop.get         → Get SOP content                            │
│                                                                  │
│  EXISTING:                                                       │
│  • workflow.list   → Already exists ✅                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. User Stories

### US-013-01: List Personas (3 points)

**As a** client Claude Code instance  
**I want to** list all agent personas for my project  
**So that** I can discover available expert assistants

**Acceptance Criteria**:
- `persona.list` MCP tool returns array of personas
- Each persona includes: `id`, `name`, `slug`, `icon`, `description`, `expertise[]`, `isActive`
- Does NOT include `systemPrompt` (loaded on-demand via `persona.get`)
- Filtered by `projectId` from bearer token
- Response < 200ms

**API**: `GET /api/personas?projectId={id}`  
**MCP Tool**: `projectpulse_persona_list`

---

### US-013-02: Get Persona Details (2 points)

**As a** client Claude Code instance  
**I want to** get full details of a specific persona  
**So that** I can adopt its role and follow its rules

**Acceptance Criteria**:
- `persona.get` MCP tool returns full persona including `systemPrompt`
- Includes: `id`, `name`, `slug`, `icon`, `description`, `systemPrompt`, `skills[]`, `tools[]`, `rules[]`, `expertise[]`, `personality`
- Validates `projectId` ownership
- Response < 200ms

**API**: `GET /api/personas/{id}` or `GET /api/personas/by-slug/{slug}`  
**MCP Tool**: `projectpulse_persona_get`

---

### US-013-03: List Skills (3 points)

**As a** client Claude Code instance  
**I want to** list all skills for my project (metadata only)  
**So that** I can discover available patterns without loading full content

**Acceptance Criteria**:
- `skill.list` MCP tool returns array of skill metadata
- Each skill includes: `id`, `slug`, `title`, `category`, `description`, `tags[]`, `frameworks[]`
- Does NOT include `content` (token efficiency)
- Supports optional filters: `category`, `tags`, `frameworks`
- Filtered by `projectId` from bearer token
- Response < 200ms

**API**: `GET /api/skills?projectId={id}&category={cat}&tags={tag1,tag2}`  
**MCP Tool**: `projectpulse_skill_list`

---

### US-013-04: Get Skill Content (2 points)

**As a** client Claude Code instance  
**I want to** load a specific skill's full content  
**So that** I can apply its patterns and procedures

**Acceptance Criteria**:
- `skill.get` MCP tool returns full skill including `content`
- Includes all metadata + `content` (markdown)
- Updates `usageCount` and `lastLoadedAt` for analytics
- Validates `projectId` ownership
- Response < 200ms

**API**: `GET /api/skills/{id}` or `GET /api/skills/by-slug/{slug}`  
**MCP Tool**: `projectpulse_skill_get`

---

### US-013-05: List SOPs (3 points)

**As a** client Claude Code instance  
**I want to** list all SOPs for my project (metadata only)  
**So that** I can discover available procedures

**Acceptance Criteria**:
- `sop.list` MCP tool returns array of SOP metadata
- Each SOP includes: `id`, `slug`, `title`, `description`, `category`, `tags[]`
- Does NOT include `content` (token efficiency)
- Supports optional filter: `category`
- Filtered by `projectId` from bearer token
- Response < 200ms

**API**: `GET /api/sops?projectId={id}&category={cat}`  
**MCP Tool**: `projectpulse_sop_list`

---

### US-013-06: Get SOP Content (2 points)

**As a** client Claude Code instance  
**I want to** load a specific SOP's full content  
**So that** I can follow its procedures

**Acceptance Criteria**:
- `sop.get` MCP tool returns full SOP including `content`
- Includes all metadata + `content` (markdown)
- Validates `projectId` ownership
- Response < 200ms

**API**: `GET /api/sops/{id}` or `GET /api/sops/by-slug/{slug}`  
**MCP Tool**: `projectpulse_sop_get`

---

### US-013-07: Enhanced CLAUDE.md Template (3 points)

**As a** project owner  
**I want** the generated CLAUDE.md to include client API documentation  
**So that** my Claude Code knows how to use ProjectPulse

**Acceptance Criteria**:
- CLAUDE.md template includes MCP connection instructions
- Documents available MCP tools (persona, skill, sop, workflow)
- Shows example usage patterns
- Includes project-specific context (name, tech stack)
- Generated during onboarding Session 3

**File**: Update `apps/mcp-server/src/tools/repo/writeMinimalTool.ts`

---

### US-013-08: Enhanced AGENTS.md Template (2 points)

**As a** project owner  
**I want** the generated AGENTS.md to list my project's personas and skills  
**So that** my Claude Code knows what experts are available

**Acceptance Criteria**:
- AGENTS.md template queries actual personas from DB
- Lists available skills by category
- Lists available SOPs by category
- Generated during onboarding Session 3 (or regenerable on-demand)

**File**: Update `apps/mcp-server/src/tools/repo/writeMinimalTool.ts`

---

## 4. Technical Specification

### 4.1 API Routes

#### GET /api/personas

```typescript
// apps/web/app/api/personas/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  isActive: z.coerce.boolean().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  const personas = await prisma.agentPersona.findMany({
    where: {
      projectId: query.projectId,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      description: true,
      expertise: true,
      isActive: true,
      isBuiltIn: true,
      // Exclude systemPrompt for list view (token efficiency)
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ personas, count: personas.length });
}
```

#### GET /api/personas/[id]

```typescript
// apps/web/app/api/personas/[id]/route.ts

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const { searchParams } = new URL(request.url);
  const projectId = parseInt(searchParams.get('projectId') || '0');

  const persona = await prisma.agentPersona.findFirst({
    where: { id, projectId }, // Validate ownership
  });

  if (!persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
  }

  return NextResponse.json(persona);
}
```

#### GET /api/skills

```typescript
// apps/web/app/api/skills/route.ts

const querySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  frameworks: z.string().optional(), // Comma-separated
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  const skills = await prisma.skill.findMany({
    where: {
      projectId: query.projectId,
      ...(query.category && { category: query.category }),
      ...(query.tags && { tags: { hasSome: query.tags.split(',') } }),
      ...(query.frameworks && { frameworks: { hasSome: query.frameworks.split(',') } }),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      description: true,
      tags: true,
      frameworks: true,
      usageCount: true,
      // Exclude content for list view (token efficiency)
    },
    orderBy: { title: 'asc' },
  });

  return NextResponse.json({ skills, count: skills.length });
}
```

#### GET /api/skills/[id]

```typescript
// apps/web/app/api/skills/[id]/route.ts

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const { searchParams } = new URL(request.url);
  const projectId = parseInt(searchParams.get('projectId') || '0');

  const skill = await prisma.skill.findFirst({
    where: { id, projectId }, // Validate ownership
  });

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Update usage tracking
  await prisma.skill.update({
    where: { id },
    data: {
      usageCount: { increment: 1 },
      lastLoadedAt: new Date(),
    },
  });

  return NextResponse.json(skill);
}
```

#### Similar patterns for SOPs

- `GET /api/sops` - List SOPs (metadata only)
- `GET /api/sops/[id]` - Get SOP with content

---

### 4.2 MCP Tools

#### persona.list

```typescript
// apps/mcp-server/src/tools/personas/listTool.ts

export const personaListTool: ToolDefinition = {
  name: 'projectpulse_persona_list',
  description: 'List all agent personas for a project. Returns metadata only (no systemPrompt). Use persona.get to load full details.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID (required for multi-tenancy)',
      },
      isActive: {
        type: 'boolean',
        description: 'Filter by active status (optional)',
      },
    },
    required: ['projectId'],
  },
  schema: z.object({
    projectId: z.number().int().positive(),
    isActive: z.boolean().optional(),
  }),
  execute: async (args, context) => {
    const response = await context.httpClient.get('/api/personas', {
      params: {
        projectId: args.projectId,
        ...(args.isActive !== undefined && { isActive: args.isActive }),
      },
    });

    const { personas, count } = response;

    // Format for agent readability
    const formatted = personas.map((p: any) => 
      `• **${p.name}** (${p.slug}) ${p.icon || ''}\n  ${p.description || 'No description'}\n  Expertise: ${p.expertise?.join(', ') || 'General'}`
    ).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `# Available Personas (${count})\n\n${formatted}\n\n_Use persona.get to load full details including systemPrompt._`,
      }],
    };
  },
};
```

#### persona.get

```typescript
// apps/mcp-server/src/tools/personas/getTool.ts

export const personaGetTool: ToolDefinition = {
  name: 'projectpulse_persona_get',
  description: 'Get full details of a specific persona including systemPrompt, skills, tools, and rules.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'Project ID (required for multi-tenancy)',
      },
      id: {
        type: 'number',
        description: 'Persona ID (use either id or slug)',
      },
      slug: {
        type: 'string',
        description: 'Persona slug (use either id or slug)',
      },
    },
    required: ['projectId'],
  },
  schema: z.object({
    projectId: z.number().int().positive(),
    id: z.number().int().positive().optional(),
    slug: z.string().optional(),
  }).refine(data => data.id || data.slug, {
    message: 'Either id or slug is required',
  }),
  execute: async (args, context) => {
    const endpoint = args.id 
      ? `/api/personas/${args.id}`
      : `/api/personas/by-slug/${args.slug}`;
    
    const persona = await context.httpClient.get(endpoint, {
      params: { projectId: args.projectId },
    });

    return {
      content: [{
        type: 'text',
        text: `# ${persona.name} ${persona.icon || ''}\n\n` +
          `**Slug**: ${persona.slug}\n` +
          `**Description**: ${persona.description || 'No description'}\n\n` +
          `## System Prompt\n\n${persona.systemPrompt}\n\n` +
          `## Skills\n${persona.skills?.map((s: string) => `- ${s}`).join('\n') || 'None'}\n\n` +
          `## Tools\n${persona.tools?.map((t: string) => `- ${t}`).join('\n') || 'None'}\n\n` +
          `## Rules\n${persona.rules?.map((r: string) => `- ${r}`).join('\n') || 'None'}`,
      }],
    };
  },
};
```

#### Similar patterns for skills and SOPs

- `projectpulse_skill_list` - List skills (metadata only)
- `projectpulse_skill_get` - Get skill with content
- `projectpulse_sop_list` - List SOPs (metadata only)
- `projectpulse_sop_get` - Get SOP with content

---

### 4.3 Enhanced CLAUDE.md Template

```markdown
# CLAUDE.md — {{projectName}}

**Generated by ProjectPulse**: {{generatedAt}}
**Project ID**: {{projectId}}

---

## Quick Start

This project uses **ProjectPulse** for AI workflow management. Your Claude Code
instance should connect to the ProjectPulse MCP server to access:

- **Agent Personas**: Expert roles with specialized prompts
- **Skills Library**: Patterns and procedures for common tasks
- **SOPs**: Standard operating procedures for this project
- **Workflows**: Predefined development workflows

---

## MCP Connection

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://{{mcpHost}}:3001/mcp"],
      "env": {
        "MCP_BEARER_TOKEN": "{{bearerTokenPlaceholder}}"
      }
    }
  }
}
```

> **Get your token**: Visit ProjectPulse → Settings → Agent Tokens → Create Token

---

## Available MCP Tools

### Personas
- `projectpulse_persona_list` - List available expert personas
- `projectpulse_persona_get` - Load persona details with systemPrompt

### Skills
- `projectpulse_skill_list` - List skills (metadata only)
- `projectpulse_skill_get` - Load skill content on-demand

### SOPs
- `projectpulse_sop_list` - List standard operating procedures
- `projectpulse_sop_get` - Load SOP content

### Workflows
- `projectpulse_workflow_list` - List workflow templates
- `projectpulse_workflow_start` - Start a workflow

### Tickets
- `projectpulse_ticket_create` - Create tickets/issues
- `projectpulse_ticket_search` - Search tickets

---

## Project Context

**Name**: {{projectName}}
**Tech Stack**: {{techStack}}
**Description**: {{projectDescription}}

---

## Usage Examples

### Load a Persona

```
Use persona.list to see available experts, then persona.get to load one:

1. projectpulse_persona_list({ projectId: {{projectId}} })
2. projectpulse_persona_get({ projectId: {{projectId}}, slug: "react-expert" })
```

### Load a Skill

```
Skills are lazy-loaded for token efficiency:

1. projectpulse_skill_list({ projectId: {{projectId}}, category: "debugging" })
2. projectpulse_skill_get({ projectId: {{projectId}}, slug: "systematic-debugging" })
```

---

## Golden Rules

1. **Database as Source of Truth** - All state in ProjectPulse, not local files
2. **Lazy Load Skills** - Only load what you need to save tokens
3. **Use Personas** - Adopt expert roles for specialized tasks
4. **Follow SOPs** - Reference procedures for consistency
5. **Track Tickets** - Log bugs and features in ProjectPulse

---

_This file was generated by ProjectPulse. Do not edit manually._
```

---

### 4.4 Enhanced AGENTS.md Template

```markdown
# AGENTS.md — {{projectName}}

**Generated by ProjectPulse**: {{generatedAt}}

---

## Available Agent Personas

{{#each personas}}
### {{icon}} {{name}}

**Slug**: `{{slug}}`
**Expertise**: {{expertise}}

{{description}}

**When to use**: {{personality}}

```
projectpulse_persona_get({ projectId: {{../projectId}}, slug: "{{slug}}" })
```

{{/each}}

---

## Skills Library

{{#each skillCategories}}
### {{category}}

{{#each skills}}
- **{{title}}** (`{{slug}}`) - {{description}}
{{/each}}

{{/each}}

---

## Standard Operating Procedures

{{#each sopCategories}}
### {{category}}

{{#each sops}}
- **{{title}}** (`{{slug}}`) - {{description}}
{{/each}}

{{/each}}

---

## Workflow Templates

{{#each workflows}}
- **{{name}}** ({{category}}) - {{description}}
{{/each}}

---

## How to Use

1. **List personas**: `projectpulse_persona_list({ projectId: {{projectId}} })`
2. **Load persona**: `projectpulse_persona_get({ projectId: {{projectId}}, slug: "..." })`
3. **List skills**: `projectpulse_skill_list({ projectId: {{projectId}} })`
4. **Load skill**: `projectpulse_skill_get({ projectId: {{projectId}}, slug: "..." })`
5. **List SOPs**: `projectpulse_sop_list({ projectId: {{projectId}} })`
6. **Load SOP**: `projectpulse_sop_get({ projectId: {{projectId}}, slug: "..." })`

---

_This file was generated by ProjectPulse and reflects your project's AI configuration._
```

---

## 5. Implementation Plan

### Week 1: APIs and MCP Tools (Days 1-5)

| Day | Task | Points |
|-----|------|--------|
| 1 | Create `GET /api/personas` and `GET /api/personas/[id]` | 1.5 |
| 1 | Create `projectpulse_persona_list` and `projectpulse_persona_get` MCP tools | 1.5 |
| 2 | Create `GET /api/skills` and `GET /api/skills/[id]` | 1.5 |
| 2 | Create `projectpulse_skill_list` and `projectpulse_skill_get` MCP tools | 1.5 |
| 3 | Create `GET /api/sops` and `GET /api/sops/[id]` | 1.5 |
| 3 | Create `projectpulse_sop_list` and `projectpulse_sop_get` MCP tools | 1.5 |
| 4 | Add by-slug routes for all entities | 2 |
| 5 | Integration tests for all new APIs and MCP tools | 3 |

**Week 1 Total**: 14 points

### Week 2: Templates and Polish (Days 6-10)

| Day | Task | Points |
|-----|------|--------|
| 6 | Enhance CLAUDE.md template in `writeMinimalTool` | 2 |
| 7 | Enhance AGENTS.md template (query DB for personas/skills/SOPs) | 2 |
| 8 | E2E tests for template generation | 1 |
| 9 | Documentation updates (MCP guide, API catalog) | 1 |
| 10 | Final verification, performance testing, Sprint 11 sign-off | 1 |

**Week 2 Total**: 7 points

---

## 6. File Structure

```
apps/
├── web/
│   └── app/api/
│       ├── personas/
│       │   ├── route.ts              # GET /api/personas (list)
│       │   ├── [id]/route.ts         # GET /api/personas/[id]
│       │   └── by-slug/[slug]/route.ts # GET /api/personas/by-slug/[slug]
│       ├── skills/
│       │   ├── route.ts              # GET /api/skills (list)
│       │   ├── [id]/route.ts         # GET /api/skills/[id]
│       │   └── by-slug/[slug]/route.ts # GET /api/skills/by-slug/[slug]
│       └── sops/
│           ├── route.ts              # GET /api/sops (list)
│           ├── [id]/route.ts         # GET /api/sops/[id]
│           └── by-slug/[slug]/route.ts # GET /api/sops/by-slug/[slug]
└── mcp-server/
    └── src/tools/
        ├── personas/
        │   ├── listTool.ts           # projectpulse_persona_list
        │   └── getTool.ts            # projectpulse_persona_get
        ├── skills/
        │   ├── listTool.ts           # projectpulse_skill_list
        │   └── getTool.ts            # projectpulse_skill_get
        ├── sops/
        │   ├── listTool.ts           # projectpulse_sop_list
        │   └── getTool.ts            # projectpulse_sop_get
        └── repo/
            └── writeMinimalTool.ts   # Enhanced CLAUDE.md & AGENTS.md
```

---

## 7. Testing Strategy

### Unit Tests

- API route validation (Zod schemas)
- MCP tool input validation
- Template rendering with mock data

### Integration Tests

- API → Database queries (Prisma)
- MCP tools → API calls → Database
- Authentication flow (bearer token → projectId scoping)

### E2E Tests

```typescript
// tests/e2e/client-apis.spec.ts

describe('Client Agent APIs', () => {
  describe('Personas', () => {
    it('lists personas for authenticated project', async () => {
      const response = await mcpClient.callTool('projectpulse_persona_list', {
        projectId: testProjectId,
      });
      expect(response.content[0].text).toContain('Available Personas');
    });

    it('gets persona details with systemPrompt', async () => {
      const response = await mcpClient.callTool('projectpulse_persona_get', {
        projectId: testProjectId,
        slug: 'react-expert',
      });
      expect(response.content[0].text).toContain('System Prompt');
    });

    it('rejects cross-project access', async () => {
      // Token for project 1 tries to access persona from project 2
      await expect(
        mcpClient.callTool('projectpulse_persona_get', {
          projectId: otherProjectId,
          slug: 'react-expert',
        })
      ).rejects.toThrow('not found');
    });
  });

  // Similar tests for skills and SOPs
});
```

---

## 8. Security Considerations

| Risk | Mitigation |
|------|------------|
| Cross-project data access | All queries filter by `projectId` from authenticated token |
| systemPrompt leakage | Only returned via `persona.get`, requires valid token |
| Token enumeration | Rate limiting on auth endpoint |
| Excessive skill loading | Usage tracking, optional rate limits |

---

## 9. Performance Targets

| Operation | Target | Rationale |
|-----------|--------|-----------|
| List personas | <100ms | Small dataset, indexed |
| Get persona | <150ms | Single record lookup |
| List skills | <100ms | Metadata only, indexed |
| Get skill | <150ms | Single record + usage update |
| List SOPs | <100ms | Metadata only, indexed |
| Get SOP | <150ms | Single record lookup |
| Generate CLAUDE.md | <500ms | Template + context queries |
| Generate AGENTS.md | <1000ms | Queries personas, skills, SOPs |

---

## 10. Dependencies

### Required (Already Have)

- ✅ Bearer token authentication (`ProjectToken` model)
- ✅ `AgentPersona`, `Skill`, `SOP`, `WorkflowTemplate` models
- ✅ MCP server infrastructure (`index-http.ts`)
- ✅ `writeMinimalTool` for repo file generation

### No New Dependencies

This sprint uses existing infrastructure and patterns. No new npm packages required.

---

## 11. Rollback Plan

If issues arise:

1. **API Issues**: Revert API route changes (isolated in new directories)
2. **MCP Tool Issues**: Remove new tools from `tools/index.ts` registry
3. **Template Issues**: Revert `writeMinimalTool.ts` changes

All changes are additive, no breaking changes to existing functionality.

---

## 12. Definition of Done

- [ ] All 8 user stories implemented and tested
- [ ] 6 new MCP tools registered and documented
- [ ] 6 new API routes created
- [ ] CLAUDE.md template enhanced with client API docs
- [ ] AGENTS.md template queries actual project data
- [ ] Integration tests passing (80%+ coverage)
- [ ] E2E tests for MCP tools
- [ ] Performance targets met (<200ms P95)
- [ ] Documentation updated (MCP guide, API catalog)
- [ ] Sprint 11 sign-off document created

---

## 13. Sprint 11.5 Preview: EPIC-011 (Research Agent Orchestration)

After Sprint 11, we'll tackle EPIC-011 (~24 points):

- `explore-codebase` sub-agent
- `analyze-architecture` sub-agent
- Sub-agent invocation workflow
- Report persistence system
- Parallel research support

This builds on Sprint 11's client APIs to enable multi-agent coordination.

---

**Document Status**: 📋 PLANNING → Ready for Review
**Next Step**: Create feature branch and begin implementation
