'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AgentPersona } from '@prisma/client';

interface AgentConfigTabProps {
  agent: AgentPersona & {
    project: {
      id: number;
      name: string;
    };
  };
}

export function AgentConfigTab({ agent }: AgentConfigTabProps) {
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* System Prompt Section */}
      <Card className="neu-flat">
        <CardHeader>
          <CardTitle className="text-base">System Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {promptOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span>{promptOpen ? 'Hide' : 'Show'} system prompt</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="neu-inset mt-4 max-h-96 overflow-y-auto rounded-lg p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed sm:text-sm">
                  {agent.systemPrompt}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Rules Section */}
      <Card className="neu-flat">
        <CardHeader>
          <CardTitle className="text-base">Rules & Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          {agent.rules && agent.rules.length > 0 ? (
            <ul className="space-y-2">
              {agent.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-accent-primary mt-0.5">•</span>
                  <span className="flex-1">{rule}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No rules configured</p>
          )}
        </CardContent>
      </Card>

      {/* Expertise Section */}
      <Card className="neu-flat">
        <CardHeader>
          <CardTitle className="text-base">Expertise Areas</CardTitle>
        </CardHeader>
        <CardContent>
          {agent.expertise && agent.expertise.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {agent.expertise.map((exp) => (
                <Badge key={exp} variant="default">
                  {exp}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No expertise areas defined</p>
          )}
        </CardContent>
      </Card>

      {/* MCP Tools Section */}
      <Card className="neu-flat">
        <CardHeader>
          <CardTitle className="text-base">MCP Tools</CardTitle>
        </CardHeader>
        <CardContent>
          {agent.tools && agent.tools.length > 0 ? (
            <div className="space-y-2">
              {agent.tools.map((tool) => (
                <div
                  key={tool}
                  className="flex items-center gap-2 rounded bg-background px-3 py-2 font-mono text-sm"
                >
                  <code>{tool}</code>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tools configured</p>
          )}
        </CardContent>
      </Card>

      {/* Personality Section */}
      {agent.personality && (
        <Card className="neu-flat">
          <CardHeader>
            <CardTitle className="text-base">Personality & Style</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{agent.personality}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata Section */}
      <Card className="neu-flat">
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Project:</span>
              <p className="font-medium">{agent.project.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium">{agent.isBuiltIn ? 'Built-in' : 'Custom'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium">
                <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                  {agent.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="font-medium">{new Date(agent.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
