# Sprint 8.5 Phase 3: Agent AI Hub Tabs

**Phase**: Sprint 8.5 Phase 3 of 4
**Story Points**: 8 points
**Duration**: 2 days (~16 hours)
**Status**: PENDING (can run parallel with Phase 2)
**Created**: 2025-11-17
**Dependencies**: None (independent UI work)

---

## Executive Summary

### Goal
Enhance `/agents` page with 3 tabs for comprehensive agent management:
1. **Skills Tab** - View agent skills with category filters and search
2. **Workflows Tab** - View workflow templates and execution status
3. **Config Tab** - View system prompt, rules, expertise, and MCP tools

### Why Important
- Current `/agents` page shows basic persona list only
- No way to view agent skills, workflows, or system prompts
- No way to configure agents beyond toggle active/inactive
- Agents need detailed configuration UI for transparency

### Architecture Overview

```
/agents page (existing)
    ↓
User clicks AgentCard
    ↓
Opens AgentDetailModal (new)
    ↓
Modal displays 3 tabs:
├─ Skills Tab
│   ├─ Skills list grouped by category
│   ├─ Tag display (frameworks, tags)
│   ├─ Usage count
│   └─ Search/filter functionality
├─ Workflows Tab
│   ├─ Workflow cards (name, description, category)
│   ├─ Step count display
│   ├─ Active/inactive status
│   └─ Filter by category
└─ Config Tab
    ├─ System prompt (collapsible for long text)
    ├─ Rules list (bullet points)
    ├─ Expertise tags (chips)
    ├─ MCP tools list (table)
    └─ Built-in vs custom indicator
```

---

## Implementation Plan

### Part A: Modal Infrastructure (6 hours)

#### Task A.1: Agent Detail Modal

**File**: `apps/web/components/agents/AgentDetailModal.tsx` (~120 lines)

**Purpose**: Modal container with tab navigation

**Implementation**:
```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentSkillsTab } from './AgentSkillsTab';
import { AgentWorkflowsTab } from './AgentWorkflowsTab';
import { AgentConfigTab } from './AgentConfigTab';

interface AgentDetailModalProps {
  agent: AgentPersona;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailModal({ agent, open, onOpenChange }: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState('skills');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agent.icon} {agent.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="skills">
            <AgentSkillsTab agent={agent} />
          </TabsContent>

          <TabsContent value="workflows">
            <AgentWorkflowsTab agent={agent} />
          </TabsContent>

          <TabsContent value="config">
            <AgentConfigTab agent={agent} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance**:
- [ ] Modal opens on agent card click
- [ ] Tab navigation works (switches between 3 tabs)
- [ ] Responsive layout (mobile + desktop)
- [ ] Close button works

**Files**:
- `apps/web/components/agents/AgentDetailModal.tsx` (CREATE)

---

#### Task A.2: API Route

**File**: `apps/web/app/api/agents/[id]/route.ts` (~60 lines)

**Purpose**: Fetch full agent data with relations

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const agentId = parseInt(params.id);

  const agent = await prisma.agentPersona.findUnique({
    where: { id: agentId },
    include: {
      skills: true, // Link to Skill model
      sessions: {
        take: 10,
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  if (!agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }

  // Also fetch workflows (not directly linked to agent)
  const workflows = await prisma.workflowTemplate.findMany({
    where: {
      category: { in: agent.expertise }, // Match by expertise
    },
  });

  return NextResponse.json({
    ...agent,
    workflows,
  });
}
```

**Acceptance**:
- [ ] GET `/api/agents/[id]` returns full agent data
- [ ] Includes skills, sessions, workflows
- [ ] 404 if agent not found
- [ ] Returns correct JSON structure

**Files**:
- `apps/web/app/api/agents/[id]/route.ts` (CREATE)

---

#### Task A.3: Agent Card Update

**File**: `apps/web/components/agents/AgentCard.tsx` (~10 lines added)

**Purpose**: Add click handler to open modal

**Implementation**:
```typescript
'use client';

import { useState } from 'react';
import { AgentDetailModal } from './AgentDetailModal';

export function AgentCard({ agent }: { agent: AgentPersona }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setModalOpen(true)}
      >
        {/* Existing card content */}
      </Card>

      <AgentDetailModal
        agent={agent}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
```

**Acceptance**:
- [ ] Card is clickable
- [ ] Modal opens on click
- [ ] Loading state during fetch (optional)
- [ ] Hover effect indicates clickability

**Files**:
- `apps/web/components/agents/AgentCard.tsx` (UPDATE)

---

### Part B: Tab Components (8 hours)

#### Task B.1: Skills Tab

**File**: `apps/web/components/agents/AgentSkillsTab.tsx` (~100 lines)

**Purpose**: Display agent skills with filtering and search

**Implementation**:
```typescript
'use client';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

export function AgentSkillsTab({ agent }: { agent: AgentPersona }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredSkills = agent.skills.filter((skill) => {
    const matchesSearch = skill.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || skill.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(agent.skills.map((s) => s.category))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      {/* Skills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map((skill) => (
          <Card key={skill.id} className="p-4">
            <h4 className="font-semibold">{skill.title}</h4>
            <p className="text-sm text-muted-foreground">
              {skill.description}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline">{skill.category}</Badge>
              {skill.frameworks.map((fw) => (
                <Badge key={fw} variant="secondary">
                  {fw}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Used {skill.usageCount} times
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Acceptance**:
- [ ] Skills list displays correctly
- [ ] Category filter works
- [ ] Search functionality works
- [ ] Usage count displayed
- [ ] Tags/frameworks shown as badges

**Files**:
- `apps/web/components/agents/AgentSkillsTab.tsx` (CREATE)

---

#### Task B.2: Workflows Tab

**File**: `apps/web/components/agents/AgentWorkflowsTab.tsx` (~90 lines)

**Purpose**: Display workflow templates

**Implementation**:
```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AgentWorkflowsTab({ agent }: { agent: AgentPersona & { workflows: WorkflowTemplate[] } }) {
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredWorkflows = agent.workflows.filter((wf) =>
    categoryFilter === 'all' || wf.category === categoryFilter
  );

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <option value="all">All Categories</option>
        <option value="development">Development</option>
        <option value="testing">Testing</option>
        <option value="deployment">Deployment</option>
      </Select>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{workflow.name}</h4>
              <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                {workflow.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {workflow.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{workflow.category}</Badge>
              <span className="text-xs text-muted-foreground">
                {JSON.parse(workflow.steps as string).length} steps
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Acceptance**:
- [ ] Workflows display correctly
- [ ] Category filter works
- [ ] Step count displayed
- [ ] Active/inactive status shown
- [ ] Grid layout responsive

**Files**:
- `apps/web/components/agents/AgentWorkflowsTab.tsx` (CREATE)

---

#### Task B.3: Config Tab

**File**: `apps/web/components/agents/AgentConfigTab.tsx` (~100 lines)

**Purpose**: Display agent configuration (system prompt, rules, expertise, tools)

**Implementation**:
```typescript
'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

export function AgentConfigTab({ agent }: { agent: AgentPersona }) {
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <div>
        <h4 className="font-semibold mb-2">System Prompt</h4>
        <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronDown className={promptOpen ? 'rotate-180' : ''} />
            {promptOpen ? 'Hide' : 'Show'} prompt
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-4 bg-muted rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">
                {agent.systemPrompt}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Rules */}
      <div>
        <h4 className="font-semibold mb-2">Rules</h4>
        <ul className="list-disc list-inside space-y-1">
          {agent.rules.map((rule, idx) => (
            <li key={idx} className="text-sm">
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Expertise */}
      <div>
        <h4 className="font-semibold mb-2">Expertise</h4>
        <div className="flex flex-wrap gap-2">
          {agent.expertise.map((exp) => (
            <Badge key={exp}>{exp}</Badge>
          ))}
        </div>
      </div>

      {/* MCP Tools */}
      <div>
        <h4 className="font-semibold mb-2">MCP Tools</h4>
        <div className="space-y-2">
          {agent.tools.map((tool) => (
            <div key={tool} className="flex items-center gap-2">
              <code className="text-sm">{tool}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Built-in vs Custom */}
      <div>
        <Badge variant={agent.isBuiltIn ? 'default' : 'secondary'}>
          {agent.isBuiltIn ? 'Built-in' : 'Custom'}
        </Badge>
      </div>
    </div>
  );
}
```

**Acceptance**:
- [ ] System prompt collapsible works
- [ ] Rules list displays correctly
- [ ] Expertise tags shown as badges
- [ ] MCP tools list formatted as code
- [ ] Built-in indicator shown

**Files**:
- `apps/web/components/agents/AgentConfigTab.tsx` (CREATE)

---

### Part C: Testing (2 hours)

#### Task C.1: E2E Tests

**File**: `apps/web/tests/e2e/agents.spec.ts` (extend existing, ~70 lines added)

**Tests**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Agent Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
  });

  test('should open agent detail modal', async ({ page }) => {
    const agentCard = page.locator('[data-testid="agent-card"]').first();
    await agentCard.click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Skills')).toBeVisible();
  });

  test('should display skills tab', async ({ page }) => {
    await page.click('[data-testid="agent-card"]');
    await page.click('text=Skills');
    
    await expect(page.getByPlaceholder('Search skills...')).toBeVisible();
    await expect(page.getByText(/api-patterns|component-patterns/)).toBeVisible();
  });

  test('should filter skills by category', async ({ page }) => {
    await page.click('[data-testid="agent-card"]');
    await page.click('text=Skills');
    
    await page.selectOption('select', 'workflow');
    await expect(page.getByText('api-patterns')).not.toBeVisible();
  });

  test('should display workflows tab', async ({ page }) => {
    await page.click('[data-testid="agent-card"]');
    await page.click('text=Workflows');
    
    await expect(page.getByText(/Development|Testing|Deployment/)).toBeVisible();
  });

  test('should display config tab', async ({ page }) => {
    await page.click('[data-testid="agent-card"]');
    await page.click('text=Configuration');
    
    await expect(page.getByText('System Prompt')).toBeVisible();
    await expect(page.getByText('Rules')).toBeVisible();
    await expect(page.getByText('Expertise')).toBeVisible();
  });

  test('should show system prompt when expanded', async ({ page }) => {
    await page.click('[data-testid="agent-card"]');
    await page.click('text=Configuration');
    await page.click('text=Show prompt');
    
    await expect(page.locator('pre')).toBeVisible();
  });

  test('should close modal', async ({ page }) => {
    await page.click('[data-testid="agent-card"]');
    await expect(page.getByRole('dialog')).toBeVisible();
    
    await page.click('[aria-label="Close"]');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
```

**Acceptance**:
- [ ] 5-7 tests passing
- [ ] Tests cover all 3 tabs
- [ ] Tests cover modal open/close
- [ ] Tests cover filtering functionality

**Files**:
- `apps/web/tests/e2e/agents.spec.ts` (UPDATE - extend existing tests)

---

## Success Criteria

### Phase 3 Complete When:
- [ ] AgentDetailModal component created
- [ ] All 3 tab components created (Skills, Workflows, Config)
- [ ] API route `GET /api/agents/[id]` implemented
- [ ] Modal opens on agent card click
- [ ] Skills tab shows skills grouped by category with search
- [ ] Workflows tab shows workflow templates with filters
- [ ] Config tab shows system prompt, rules, expertise, tools
- [ ] E2E tests: 5-7 tests passing
- [ ] Responsive design (mobile + desktop)
- [ ] Loading states implemented

---

## File Inventory

### New Files (7 total)
1. `apps/web/components/agents/AgentDetailModal.tsx` (CREATE)
2. `apps/web/components/agents/AgentSkillsTab.tsx` (CREATE)
3. `apps/web/components/agents/AgentWorkflowsTab.tsx` (CREATE)
4. `apps/web/components/agents/AgentConfigTab.tsx` (CREATE)
5. `apps/web/app/api/agents/[id]/route.ts` (CREATE)
6. `apps/web/components/agents/SkillPicker.tsx` (OPTIONAL - not used in Phase 3)
7. `apps/web/tests/e2e/agents.spec.ts` (UPDATE - extend)

### Modified Files (1 total)
1. `apps/web/components/agents/AgentCard.tsx` (UPDATE - add click handler)

---

## Dependencies

### External
- **AgentPersona model** - Already exists with skills[], tools[], rules[]
- **Skill model** - Already exists
- **WorkflowTemplate model** - Already exists
- **shadcn/ui components** - Dialog, Tabs, Badge, Card (already installed)

### Internal
- None (independent UI work, no dependencies on Phase 1-2)

---

## Timeline

**Part A: Modal Infrastructure** - 6 hours
- Task A.1: Agent Detail Modal (3 hours)
- Task A.2: API Route (2 hours)
- Task A.3: Agent Card Update (1 hour)

**Part B: Tab Components** - 8 hours
- Task B.1: Skills Tab (3 hours)
- Task B.2: Workflows Tab (2.5 hours)
- Task B.3: Config Tab (2.5 hours)

**Part C: Testing** - 2 hours
- Task C.1: E2E Tests (2 hours)

**Total**: 16 hours (2 days)

---

## Risks & Mitigations

### Risk 1: Modal UX Complexity (MEDIUM)
- **Mitigation**: Use existing modal patterns from issue detail
- **Contingency**: Simplify to separate page instead of modal

### Risk 2: Tab State Management (LOW)
- **Mitigation**: Use shadcn/ui Tabs component (built-in state)
- **Contingency**: Manual useState if shadcn/ui has issues

### Risk 3: Large System Prompts (LOW)
- **Mitigation**: Collapsible with max-height + scroll
- **Contingency**: Truncate with "Show more" button

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Open agent detail modal from agent card
- [ ] Switch between all 3 tabs
- [ ] Search skills by name
- [ ] Filter skills by category
- [ ] Filter workflows by category
- [ ] Expand/collapse system prompt
- [ ] View rules, expertise, tools
- [ ] Close modal
- [ ] Test on mobile layout
- [ ] Test with multiple agents

### Automated Testing
- [ ] 5-7 E2E tests in `agents.spec.ts`
- [ ] API route test (optional - covered by E2E)
- [ ] Component unit tests (optional - Phase 4 if time)

---

**Plan Created**: 2025-11-17
**Last Updated**: 2025-11-17
**Source**: Sprint 8.5 detailed planning
**Review Cycle**: Daily checkpoints
**Next Phase**: Phase 4 (MCP Read Tools) - Depends on Phase 1
