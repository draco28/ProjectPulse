/**
 * AgentPersonasWidget Component
 *
 * Displays active agent personas with:
 * - Agent name and description
 * - Status indicator with breathing animation
 * - Last activity timestamp
 */
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'offline';
  lastActivity: string;
  avatar: string;
  color: string;
}

interface AgentPersonasWidgetProps {
  agents: Agent[];
}

const statusConfig: Record<
  Agent['status'],
  { label: string; className: string; showPulse: boolean }
> = {
  active: {
    label: 'Active',
    className: 'bg-success',
    showPulse: true,
  },
  idle: {
    label: 'Idle',
    className: 'bg-warning',
    showPulse: false,
  },
  offline: {
    label: 'Offline',
    className: 'bg-text-tertiary',
    showPulse: false,
  },
};

export function AgentPersonasWidget({ agents }: AgentPersonasWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Active Agents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {agents.map((agent) => {
          const statusInfo = statusConfig[agent.status];

          return (
            <div
              key={agent.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-background-light"
            >
              <div className="relative">
                <Avatar className={cn('border-2', `border-${agent.color}`)}>
                  <AvatarFallback
                    className="font-semibold text-white"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.avatar}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5">
                  {statusInfo.showPulse ? (
                    <div className="pulse-indicator !h-3 !w-3 animate-breathing">
                      <div className={cn('pulse-dot', statusInfo.className)} />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full border-2 border-background-dark',
                        statusInfo.className
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between">
                  <h4 className="truncate text-sm font-medium text-text-primary">{agent.name}</h4>
                  <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="mb-1 line-clamp-2 text-xs text-text-secondary">{agent.description}</p>
                <p className="text-xs text-text-tertiary">{agent.lastActivity}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
