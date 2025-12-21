'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface WorkflowDetail {
  id: number;
  name: string;
  description: string;
  category: string;
  steps: Array<{
    name: string;
    description?: string;
    tool?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowDetailModalProps {
  workflowId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowDetailModal({ workflowId, open, onOpenChange }: WorkflowDetailModalProps) {
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && workflowId) {
      setLoading(true);
      setError(null);

      fetch(`/api/workflows/by-id/${workflowId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setWorkflow(data);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [open, workflowId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {loading ? 'Loading...' : error ? 'Error' : workflow?.name}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading workflow details...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {workflow && !loading && !error && (
          <div className="mt-4 space-y-6">
            {/* Metadata */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline">{workflow.category}</Badge>
              <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
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
            </div>

            {/* Description */}
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {workflow.description}
              </p>
            </div>

            {/* Steps */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">
                Workflow Steps ({workflow.steps.length})
              </h4>
              <div className="space-y-3">
                {workflow.steps.map((step, index) => (
                  <div key={index} className="neu-raised rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coral/20 text-sm font-semibold text-coral">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h5 className="font-semibold text-white">{step.name}</h5>
                        {step.description && (
                          <p className="text-sm text-slate">{step.description}</p>
                        )}
                        {step.tool && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {step.tool}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="mt-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div className="neu-inset rounded-lg p-4">
                <div className="mb-1 text-xs text-muted-foreground">Created</div>
                <div className="text-sm font-medium text-white">
                  {new Date(workflow.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="neu-inset rounded-lg p-4">
                <div className="mb-1 text-xs text-muted-foreground">Last Updated</div>
                <div className="text-sm font-medium text-white">
                  {new Date(workflow.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
