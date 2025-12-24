# {{PROJECT_NAME}} - AI Agent Resources

**Project ID**: {{PROJECT_ID}}
**MCP Server**: {{MCP_URL}}
**Dashboard**: {{DASHBOARD_URL}}

---

## Overview

This document catalogs all AI agent resources available for {{PROJECT_NAME}} via ProjectPulse MCP.

Resources are loaded on-demand to save tokens. Use `list` tools to discover what's available, then `get` tools to load specific resources when needed.

---

## Available Personas

Personas define expert behaviors and domain knowledge. Load one to adopt its expertise.

### How to Use Personas

```
# List all available personas
projectpulse_persona_list(projectId: {{PROJECT_ID}})

# Load a specific persona
projectpulse_persona_get(projectId: {{PROJECT_ID}}, slug: "<persona-slug>")
→ Returns: name, systemPrompt, expertise, rules, skills, tools
```

### When to Load Personas

- Before starting specialized work (API development → load "backend-developer")
- When you need domain expertise and specific rules
- When the project requires a specific communication style or approach

### Persona Catalog

| Persona | Slug | Expertise |
|---------|------|-----------|
| *(Populated from database when file is generated)* |

---

## Available Skills

Skills contain reusable coding patterns, templates, and conventions for the project.

### How to Use Skills

```
# List all skills
projectpulse_skill_list(projectId: {{PROJECT_ID}})

# Filter by category
projectpulse_skill_list(projectId: {{PROJECT_ID}}, category: "framework")

# Filter by framework
projectpulse_skill_list(projectId: {{PROJECT_ID}}, frameworks: "react,nextjs")

# Load a specific skill
projectpulse_skill_get(projectId: {{PROJECT_ID}}, slug: "<skill-slug>")
→ Returns: Full content with code examples
```

### Skill Categories

| Category | Description |
|----------|-------------|
| `framework` | Framework-specific patterns (React, Next.js, Prisma, etc.) |
| `testing` | Testing patterns and strategies |
| `workflow` | Development workflow patterns |
| `troubleshooting` | Debugging and problem-solving guides |

### Skills by Category

#### Framework Skills
*(Populated from database when file is generated)*

#### Testing Skills
*(Populated from database when file is generated)*

#### Workflow Skills
*(Populated from database when file is generated)*

#### Troubleshooting Skills
*(Populated from database when file is generated)*

---

## Standard Operating Procedures (SOPs)

SOPs provide step-by-step procedures for common tasks.

### How to Use SOPs

```
# List all SOPs
projectpulse_sop_list(projectId: {{PROJECT_ID}})

# Filter by category
projectpulse_sop_list(projectId: {{PROJECT_ID}}, category: "Development")

# Load a specific SOP
projectpulse_sop_get(projectId: {{PROJECT_ID}}, slug: "<sop-slug>")
→ Returns: Full procedure with steps and checklists
```

### SOP Categories

| Category | Description |
|----------|-------------|
| `Development` | Coding procedures and patterns |
| `Testing` | Testing and QA procedures |
| `Deployment` | Deployment and release procedures |
| `Operations` | Operational and maintenance procedures |

### SOPs by Category

#### Development SOPs
*(Populated from database when file is generated)*

#### Testing SOPs
*(Populated from database when file is generated)*

#### Deployment SOPs
*(Populated from database when file is generated)*

#### Operations SOPs
*(Populated from database when file is generated)*

---

## Workflow Templates

Workflow templates define multi-step processes for common tasks.

### How to Use Workflows

```
# List available workflows
projectpulse_workflow_list(projectId: {{PROJECT_ID}})

# Start a workflow
projectpulse_workflow_start({
  templateId: 1,
  projectId: {{PROJECT_ID}},
  initialContext: { featureName: "auth" }
})
→ Returns: runId, first step details

# Execute current step
projectpulse_workflow_executeStep({
  runId: 123,
  stepResult: { branchName: "feature/auth" }
})

# Check status
projectpulse_workflow_getStatus({ runId: 123 })

# Pause/Resume
projectpulse_workflow_pause({ runId: 123, reason: "Waiting for review" })
projectpulse_workflow_resume({ runId: 123 })
```

### Available Workflow Templates
*(Populated from database when file is generated)*

---

## Knowledge Base

Project knowledge items store decisions, discoveries, and solutions.

### How to Access Knowledge

```
# Search knowledge
projectpulse_knowledge_search({
  projectId: {{PROJECT_ID}},
  query: "authentication",
  mode: "hybrid"
})

# Get full item
projectpulse_knowledge_get({
  projectId: {{PROJECT_ID}},
  itemId: 123
})

# Find related items
projectpulse_knowledge_related({
  projectId: {{PROJECT_ID}},
  itemId: 123,
  maxDepth: 2
})
```

---

## Wiki

Project documentation in wiki format.

### How to Access Wiki

```
# Search wiki
projectpulse_wiki_search({ query: "API reference" })

# Get page by path
projectpulse_wiki_get({ path: "/guides/api-reference" })
```

---

## Token-Efficient Loading Pattern

To minimize token usage, follow this pattern:

```
1. Start with context_load (all memory banks)
   → Get project brief, patterns, tech context

2. List resources when needed
   → persona_list, skill_list, sop_list return metadata only (~100 tokens each)

3. Load full content on-demand
   → persona_get, skill_get, sop_get return full content

4. Search before creating
   → knowledge_search, wiki_search to find existing info
```

### Example: Implementing a New Feature

```
# 1. Load context
projectpulse_context_load(projectId: {{PROJECT_ID}})

# 2. Check if there's existing knowledge
projectpulse_knowledge_search({
  projectId: {{PROJECT_ID}},
  query: "similar feature patterns"
})

# 3. Load relevant persona
projectpulse_persona_get(projectId: {{PROJECT_ID}}, slug: "backend-developer")

# 4. Load relevant skills
projectpulse_skill_get(projectId: {{PROJECT_ID}}, slug: "api-patterns")

# 5. Check SOPs for procedures
projectpulse_sop_list(projectId: {{PROJECT_ID}}, category: "Development")
projectpulse_sop_get(projectId: {{PROJECT_ID}}, slug: "feature-development")

# 6. Start coding with all context loaded
```

---

## Dashboard

View and manage all resources:

**{{DASHBOARD_URL}}projects/{{PROJECT_ID}}**

- **Personas**: {{DASHBOARD_URL}}projects/{{PROJECT_ID}}/personas
- **Skills**: {{DASHBOARD_URL}}projects/{{PROJECT_ID}}/skills
- **SOPs**: {{DASHBOARD_URL}}projects/{{PROJECT_ID}}/sops
- **Knowledge**: {{DASHBOARD_URL}}projects/{{PROJECT_ID}}/knowledge
- **Wiki**: {{DASHBOARD_URL}}projects/{{PROJECT_ID}}/wiki
