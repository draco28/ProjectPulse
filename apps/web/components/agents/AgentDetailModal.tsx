'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentSkillsTab } from './AgentSkillsTab';
import { AgentWorkflowsTab } from './AgentWorkflowsTab';
import { AgentConfigTab } from './AgentConfigTab';
import type { AgentPersona } from '@prisma/client';

// Extended type with fetched relations
interface AgentWithDetails extends AgentPersona {
  project: {
    id: number;
    name: string;
  };
  skillDetails: Array<{
    id: number;
    slug: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    frameworks: string[];
    usageCount: number;
    lastLoadedAt: Date | null;
  }>;
  workflows: Array<{
    id: number;
    name: string;
    description: string;
    category: string;
    steps: unknown;
    isActive: boolean;
  }>;
}

interface AgentDetailModalProps {
  agentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailModal({ agentId, open, onOpenChange }: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState('skills');
  const [agent, setAgent] = useState<AgentWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent data when modal opens
  useEffect(() => {
    if (open && !agent) {
      setLoading(true);
      setError(null);

      fetch(`/api/agents/${agentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setAgent(data);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [open, agent, agentId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setAgent(null);
      setActiveTab('skills');
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {loading ? (
              'Loading...'
            ) : error ? (
              'Error Loading Agent'
            ) : agent ? (
              <>
                <span className="mr-2">{agent.icon || '🤖'}</span>
                {agent.name}
              </>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading agent details...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {agent && !loading && !error && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="skills">Skills ({agent.skillDetails.length})</TabsTrigger>
              <TabsTrigger value="workflows">Workflows ({agent.workflows.length})</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="mt-6">
              <AgentSkillsTab agent={agent} />
            </TabsContent>

            <TabsContent value="workflows" className="mt-6">
              <AgentWorkflowsTab agent={agent} />
            </TabsContent>

            <TabsContent value="config" className="mt-6">
              <AgentConfigTab agent={agent} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
