/**
 * StatCard Component
 *
 * Neumorphic stat card matching the mockup exactly
 * (dashboard-dark-neumorphic-coral.html lines 376-421)
 *
 * Features:
 * - neu-raised container with rounded-3xl
 * - icon-coral gradient container for icon
 * - Large text-4xl value
 * - Trend indicator with color
 */

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  iconClassName?: string;
}

export function StatCard({ title, value, icon: Icon, trend, iconClassName }: StatCardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
            iconClassName || 'icon-coral'
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-sm font-semibold',
              trendPositive && 'text-green-400',
              trendNegative && 'text-red-400',
              !trendPositive && !trendNegative && 'text-slate'
            )}
          >
            {trendPositive && '+'}
            {trend.value}
          </span>
        )}
      </div>
      <h3 className="mb-1 text-4xl font-bold text-white">{value}</h3>
      <p className="text-sm font-medium text-slate">{title}</p>
    </div>
  );
}
