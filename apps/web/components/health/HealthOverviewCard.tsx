'use client';

import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthOverviewCardProps {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Display overall health score with grade badge and trend indicator
 * Circular score display with A-F grading system
 */
export function HealthOverviewCard({ score, trend }: HealthOverviewCardProps) {
  // Calculate grade (A-F scale)
  const getGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Color mapping by score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Trend icon and color mapping
  const getTrendConfig = (trend: string) => {
    if (trend === 'improving')
      return { Icon: TrendingUp, color: 'text-green-400', label: 'Improving' };
    if (trend === 'declining')
      return { Icon: TrendingDown, color: 'text-red-400', label: 'Declining' };
    return { Icon: Minus, color: 'text-slate-400', label: 'Stable' };
  };

  const grade = getGrade(score);
  const scoreColor = getScoreColor(score);
  const { Icon: TrendIcon, color: trendColor, label: trendLabel } = getTrendConfig(trend);

  return (
    <div className="neu-raised rounded-3xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-coral-400" />
        <h2 className="text-sm font-bold uppercase text-white">Overall Health</h2>
      </div>

      {/* Score Display - Large centered number */}
      <div className="mb-4 text-center">
        <div className={`text-6xl font-bold ${scoreColor}`}>{score}</div>
        <div className="mt-2 text-sm text-slate-400">out of 100</div>
      </div>

      {/* Grade Badge - Neumorphic pressed style */}
      <div className="mb-4 flex justify-center">
        <div
          className={`neu-pressed flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold ${scoreColor}`}
        >
          {grade}
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <TrendIcon className={`h-5 w-5 ${trendColor}`} />
        <span className="capitalize text-white">{trendLabel}</span>
      </div>
    </div>
  );
}
