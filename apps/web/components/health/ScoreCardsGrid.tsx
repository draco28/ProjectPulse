'use client';

import { Shield, AlertTriangle, Clock, AlertCircle } from 'lucide-react';

interface ScoreCardsGridProps {
  overallScore: number;
  criticalCount: number;
  highPriorityCount: number;
  lastScanTime: string;
}

/**
 * 4-card grid displaying key health metrics
 * Matches mockup design with gradient backgrounds and pulse animations
 */
export function ScoreCardsGrid({
  overallScore,
  criticalCount,
  highPriorityCount,
  lastScanTime,
}: ScoreCardsGridProps) {
  // Score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const scoreColor = getScoreColor(overallScore);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="score-cards-grid">
      {/* Overall Score Card */}
      <div className="neu-raised smooth-transition group relative overflow-hidden rounded-3xl p-6 hover:scale-105" data-testid="overall-score-card">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
        <div className="relative">
          <div className={`mb-1 text-4xl font-bold ${scoreColor}`} data-testid="overall-score">{overallScore}</div>
          <div className="text-sm text-slate-400">Security Score</div>
          <Shield className="absolute right-0 top-0 h-8 w-8 text-green-400/20" aria-hidden="true" />
        </div>
      </div>

      {/* Critical Issues Card */}
      <div className="neu-raised smooth-transition group relative overflow-hidden rounded-3xl p-6 hover:scale-105" data-testid="critical-count-card">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
        <div className="relative">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-red-400">{criticalCount}</span>
            {criticalCount > 0 && (
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
            )}
          </div>
          <div className="text-sm text-slate-400">Critical Issues</div>
          <AlertCircle
            className="absolute right-0 top-0 h-8 w-8 text-red-400/20"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* High Priority Card */}
      <div className="neu-raised smooth-transition group relative overflow-hidden rounded-3xl p-6 hover:scale-105" data-testid="high-priority-card">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent"></div>
        <div className="relative">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-yellow-400">{highPriorityCount}</span>
            {highPriorityCount > 0 && (
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
              </span>
            )}
          </div>
          <div className="text-sm text-slate-400">High Priority</div>
          <AlertTriangle
            className="absolute right-0 top-0 h-8 w-8 text-yellow-400/20"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Last Scan Card */}
      <div className="neu-raised smooth-transition group relative overflow-hidden rounded-3xl p-6 hover:scale-105" data-testid="last-scan-card">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="mb-1 text-4xl font-bold text-blue-400">{lastScanTime}</div>
          <div className="text-sm text-slate-400">Last Scan</div>
          <Clock className="absolute right-0 top-0 h-8 w-8 text-blue-400/20" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
