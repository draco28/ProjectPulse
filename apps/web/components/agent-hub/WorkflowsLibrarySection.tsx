'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, CheckCircle2, Circle, Workflow as WorkflowIcon } from 'lucide-react';
import { WorkflowDetailModal } from './modals/WorkflowDetailModal';

interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  steps: unknown;
  isActive: boolean;
}

interface WorkflowsLibrarySectionProps {
  workflows: WorkflowTemplate[];
}

export function WorkflowsLibrarySection({ workflows }: WorkflowsLibrarySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);

  // Filter workflows
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      searchTerm === '' ||
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || workflow.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && workflow.isActive) ||
      (statusFilter === 'inactive' && !workflow.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Extract unique categories
  const categories = Array.from(new Set(workflows.map((w) => w.category))).sort();

  // Get step count
  const getStepCount = (steps: unknown): number => {
    try {
      if (Array.isArray(steps)) return steps.length;
      if (typeof steps === 'string') return JSON.parse(steps).length;
      return 0;
    } catch {
      return 0;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Search and Filters Bar */}
        <div className="neu-raised smooth-transition rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredWorkflows.length} of {workflows.length} workflows
          </p>
        </div>

        {/* Workflows Grid */}
        {filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows.map((workflow) => {
              const stepCount = getStepCount(workflow.steps);

              return (
                <Card
                  key={workflow.id}
                  className="neu-raised smooth-transition cursor-pointer hover:shadow-lg"
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <CardTitle className="text-lg leading-tight text-white">
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
                      <WorkflowIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate leading-relaxed mb-3">
                      {workflow.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/10">
                      <span className="font-medium">{stepCount} steps</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="mb-2 text-xl font-bold text-white">No workflows found</h3>
            <p className="text-sm text-slate">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No workflows have been created for this project yet'}
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="neu-inset rounded-3xl p-6">
          <div className="space-y-2">
            <p className="font-semibold text-white flex items-center gap-2">
              <span>🔁</span> How Workflows Work
            </p>
            <p className="text-sm text-slate leading-relaxed">
              Workflows are multi-step processes available to <strong>all agents</strong> in your project. 
              Any agent can execute workflows when needed to accomplish complex tasks. Workflows are created 
              during Session 3 and can be customized for your project&apos;s specific needs.
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <WorkflowDetailModal
          workflowId={selectedWorkflow}
          open={!!selectedWorkflow}
          onOpenChange={(open) => !open && setSelectedWorkflow(null)}
        />
      )}
    </>
  );
}
