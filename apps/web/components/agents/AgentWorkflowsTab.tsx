'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Circle, Workflow } from 'lucide-react';

interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  steps: unknown; // JSONB array
  isActive: boolean;
}

interface AgentWorkflowsTabProps {
  agent: {
    name: string;
    expertise: string[];
    workflows: WorkflowTemplate[];
  };
}

export function AgentWorkflowsTab({ agent }: AgentWorkflowsTabProps) {
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter workflows by category
  const filteredWorkflows = agent.workflows.filter(
    (wf) => categoryFilter === 'all' || wf.category === categoryFilter
  );

  // Extract unique categories
  const categories = Array.from(
    new Set(agent.workflows.map((w) => w.category))
  ).sort();

  // Parse steps count from JSONB
  const getStepCount = (steps: unknown): number => {
    try {
      if (Array.isArray(steps)) {
        return steps.length;
      }
      if (typeof steps === 'string') {
        return JSON.parse(steps).length;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredWorkflows.length} of {agent.workflows.length}{' '}
          workflows
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkflows.map((workflow) => {
          const stepCount = getStepCount(workflow.steps);

          return (
            <Card
              key={workflow.id}
              className="neu-flat hover:neu-raised smooth-transition"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base leading-tight">
                      {workflow.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={workflow.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {workflow.isActive ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <Circle className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {workflow.category}
                      </Badge>
                    </div>
                  </div>
                  <Workflow className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {workflow.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{stepCount} steps</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">🔄</div>
          <p className="text-lg font-medium">No workflows found</p>
          <p className="text-sm text-muted-foreground">
            {categoryFilter !== 'all'
              ? 'Try selecting a different category'
              : `No workflows match ${agent.name}'s expertise areas`}
          </p>
        </div>
      )}

      {/* Info Banner */}
      <div className="neu-inset rounded-lg p-4 text-sm space-y-2">
        <p className="font-medium">🔁 Configured Workflows</p>
        <p className="text-muted-foreground leading-relaxed">
          These workflows are <strong>configured for this agent</strong> based on expertise:{' '}
          <span className="font-medium">
            {agent.expertise.join(', ') || 'None'}
          </span>.
          Note: <strong>All project workflows</strong> are available to all agents. 
          View all workflows in the <strong>Workflows Library</strong> tab.
        </p>
      </div>
    </div>
  );
}
