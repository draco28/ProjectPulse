'use client';

import { Shield, Bug, Key, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ScannerStatus {
  id: number;
  name: string;
  type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastRunAt: Date | null;
  findingsCount: number;
}

interface ScannerStatusCardsProps {
  scanners: ScannerStatus[];
}

/**
 * Scanner status cards with pulse animations and last run info
 * Shows status of Semgrep, ESLint, Lighthouse, axe-core scanners
 */
export function ScannerStatusCards({ scanners }: ScannerStatusCardsProps) {
  // Map scanner types to icons and colors
  const getScannerConfig = (type: string) => {
    switch (type) {
      case 'SEMGREP':
        return {
          icon: Shield,
          color: 'text-purple-400',
          bgGradient: 'from-purple-500/10',
        };
      case 'ESLINT':
        return {
          icon: Bug,
          color: 'text-blue-400',
          bgGradient: 'from-blue-500/10',
        };
      case 'LIGHTHOUSE':
        return {
          icon: Shield,
          color: 'text-yellow-400',
          bgGradient: 'from-yellow-500/10',
        };
      case 'AXE':
        return {
          icon: Key,
          color: 'text-green-400',
          bgGradient: 'from-green-500/10',
        };
      default:
        return {
          icon: Shield,
          color: 'text-slate-400',
          bgGradient: 'from-slate-500/10',
        };
    }
  };

  // Format last run time as relative (e.g., "2h ago")
  const formatLastRun = (lastRunAt: Date | null): string => {
    if (!lastRunAt) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastRunAt.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="neu-raised rounded-3xl p-6" data-testid="scanner-status-cards">
      <h2 className="mb-6 text-sm font-bold uppercase text-white">Scanner Status</h2>

      <div className="space-y-4">
        {scanners.map((scanner) => {
          const config = getScannerConfig(scanner.type);
          const Icon = config.icon;
          const isActive = scanner.status === 'ACTIVE';
          const hasError = scanner.status === 'ERROR';

          return (
            <div
              key={scanner.id}
              className="neu-pressed smooth-transition group relative overflow-hidden rounded-2xl p-4 hover:scale-105"
              data-testid={`scanner-card-${scanner.type.toLowerCase()}`}
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} to-transparent opacity-50`}
              ></div>

              <div className="relative flex items-center justify-between">
                {/* Scanner Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Icon className={`h-6 w-6 ${config.color}`} aria-hidden="true" />
                    {/* Pulse dot for active scanners */}
                    {isActive && (
                      <span className="absolute -right-1 -top-1 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-white">{scanner.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <span>{formatLastRun(scanner.lastRunAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Status and Count */}
                <div className="flex items-center gap-3">
                  {/* Findings count */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{scanner.findingsCount}</div>
                    <div className="text-xs text-slate-400">findings</div>
                  </div>

                  {/* Status icon */}
                  {isActive && (
                    <CheckCircle className="h-5 w-5 text-green-400" aria-label="Active" />
                  )}
                  {hasError && <XCircle className="h-5 w-5 text-red-400" aria-label="Error" />}
                  {scanner.status === 'INACTIVE' && (
                    <Clock className="h-5 w-5 text-slate-400" aria-label="Inactive" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
