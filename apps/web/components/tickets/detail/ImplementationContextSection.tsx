/**
 * ImplementationContextSection Component (Sprint 11.7)
 *
 * Displays implementation context for a ticket:
 * - Phase/Sprint reference (links to roadmap)
 * - Files to modify with change severity badges
 * - Files to create with purpose
 * - Schema changes warning banner
 * - Implementation blueprint (markdown preview)
 *
 * Props:
 * - context: ImplementationContextProps from serialized ticket
 */

'use client';

import { useState } from 'react';
import {
  Map,
  ChevronDown,
  ChevronRight,
  FileEdit,
  FilePlus,
  Database,
  AlertTriangle,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImplementationContextProps } from '@/types/issue';

// ============================================================================
// TYPES
// ============================================================================

interface ImplementationContextSectionProps {
  ticketId: string;
  context?: ImplementationContextProps;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get badge color for estimated changes
 */
function getChangeSeverityBadge(severity?: 'minor' | 'moderate' | 'major') {
  switch (severity) {
    case 'minor':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'moderate':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'major':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

/**
 * Extract filename from path
 */
function getFileName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ImplementationContextSection({
  ticketId,
  context,
}: ImplementationContextSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't render if no context
  if (!context) {
    return null;
  }

  const hasFilesToModify = context.filesToModify.length > 0;
  const hasFilesToCreate = context.filesToCreate.length > 0;
  const hasSchemaChanges = context.schemaChanges?.required;
  const hasBlueprint = !!context.implementationBlueprint;
  const hasPhaseRef = !!context.phaseSprintRef?.displayName;

  // Don't render if completely empty
  if (
    !hasFilesToModify &&
    !hasFilesToCreate &&
    !hasSchemaChanges &&
    !hasBlueprint &&
    !hasPhaseRef
  ) {
    return null;
  }

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group mb-4 flex w-full items-center justify-between"
      >
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <Map className="h-5 w-5 text-coral" aria-hidden="true" />
          Implementation Context
        </h3>
        <span className="text-slate transition-colors group-hover:text-white">
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Phase/Sprint Reference */}
          {hasPhaseRef && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate">Roadmap:</span>
              <span className="rounded-lg border border-coral/30 bg-coral/10 px-2 py-1 font-medium text-coral">
                {context.phaseSprintRef?.displayName}
              </span>
            </div>
          )}

          {/* Schema Changes Warning */}
          {hasSchemaChanges && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="font-semibold text-yellow-200">Schema Changes Required</span>
                  </div>
                  {context.schemaChanges?.migrationName && (
                    <p className="mt-1 text-sm text-yellow-300/80">
                      Migration:{' '}
                      <code className="rounded bg-yellow-500/20 px-1 font-mono">
                        {context.schemaChanges.migrationName}
                      </code>
                    </p>
                  )}
                  {context.schemaChanges?.models && context.schemaChanges.models.length > 0 && (
                    <p className="mt-1 text-sm text-yellow-300/80">
                      Models:{' '}
                      {context.schemaChanges.models.map((m, i) => (
                        <code key={i} className="mx-0.5 rounded bg-yellow-500/20 px-1 font-mono">
                          {m}
                        </code>
                      ))}
                    </p>
                  )}
                  {context.schemaChanges?.description && (
                    <p className="mt-2 text-sm text-yellow-300/70">
                      {context.schemaChanges.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Files to Modify */}
          {hasFilesToModify && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <FileEdit className="h-4 w-4 text-blue-400" />
                Files to Modify
                <span className="font-normal text-slate">({context.filesToModify.length})</span>
              </h4>
              <div className="space-y-2">
                {context.filesToModify.map((file, index) => (
                  <div
                    key={index}
                    className="smooth-transition rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-3 hover:border-blue-500/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 flex-shrink-0 text-blue-400" />
                          <span className="truncate font-mono text-sm text-white">
                            {getFileName(file.path)}
                          </span>
                          {file.estimatedChanges && (
                            <span
                              className={cn(
                                'flex-shrink-0 rounded border px-1.5 py-0.5 text-xs',
                                getChangeSeverityBadge(file.estimatedChanges)
                              )}
                            >
                              {file.estimatedChanges}
                            </span>
                          )}
                        </div>
                        <p
                          className="mt-0.5 truncate font-mono text-xs text-slate"
                          title={file.path}
                        >
                          {file.path}
                        </p>
                        {file.reason && <p className="mt-1 text-xs text-slate/80">{file.reason}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files to Create */}
          {hasFilesToCreate && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <FilePlus className="h-4 w-4 text-green-400" />
                Files to Create
                <span className="font-normal text-slate">({context.filesToCreate.length})</span>
              </h4>
              <div className="space-y-2">
                {context.filesToCreate.map((file, index) => (
                  <div
                    key={index}
                    className="smooth-transition rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-3 hover:border-green-500/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 flex-shrink-0 text-green-400" />
                          <span className="truncate font-mono text-sm text-white">
                            {getFileName(file.path)}
                          </span>
                          {file.template && (
                            <span className="flex-shrink-0 rounded border border-slate-500/30 bg-slate-500/20 px-1.5 py-0.5 text-xs text-slate-400">
                              {file.template}
                            </span>
                          )}
                        </div>
                        <p
                          className="mt-0.5 truncate font-mono text-xs text-slate"
                          title={file.path}
                        >
                          {file.path}
                        </p>
                        {file.purpose && (
                          <p className="mt-1 text-xs text-slate/80">{file.purpose}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Implementation Blueprint */}
          {hasBlueprint && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Map className="h-4 w-4 text-coral" />
                Implementation Blueprint
              </h4>
              <div className="rounded-xl border border-[#2A2A2A] bg-[#0f0f1a] p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate">
                  {context.implementationBlueprint}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
