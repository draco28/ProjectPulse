/**
 * StatCard Component - Server Component
 *
 * Displays a single metric with:
 * - Icon
 * - Title
 * - Value
 * - Optional trend indicator
 */

import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="neu-float smooth-transition">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="mb-1 text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-3xl font-bold text-text-primary">{value}</p>
            {trend && (
              <p
                className={cn(
                  'mt-2 text-xs',
                  trendPositive && 'text-success',
                  trendNegative && 'text-error',
                  !trendPositive && !trendNegative && 'text-text-tertiary'
                )}
              >
                {trendPositive && '↑'} {trendNegative && '↓'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('bg-accent-primary/10 rounded-lg p-3', iconClassName)}>
            <Icon className="h-6 w-6 text-accent-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
