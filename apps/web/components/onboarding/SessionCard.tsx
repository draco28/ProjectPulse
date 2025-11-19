/**
 * SessionCard Component
 *
 * Status card for onboarding sessions with neumorphic styling
 * Shows session progress, status badge, and navigation
 */

import Link from 'next/link';
import { LucideIcon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  session: 1 | 2 | 3;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'complete';
  href: string;
  disabled?: boolean;
  icon: LucideIcon;
}

export function SessionCard({
  session,
  title,
  description,
  status,
  href,
  disabled = false,
  icon: Icon,
}: SessionCardProps) {
  const statusConfig = {
    not_started: {
      badge: 'Not Started',
      color: 'text-slate-400',
      bgColor: 'bg-slate-400/10',
    },
    in_progress: {
      badge: 'In Progress',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    complete: {
      badge: 'Complete',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
  };

  const config = statusConfig[status];

  const CardContent = (
    <div
      className={cn(
        'neu-raised smooth-transition rounded-3xl p-6 h-full',
        disabled ? 'opacity-50 cursor-not-allowed' : 'neu-float cursor-pointer hover:scale-[1.02]'
      )}
    >
      {/* Header with Session Number and Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="icon-coral flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
            {disabled ? (
              <Lock className="h-5 w-5 text-white" />
            ) : (
              <Icon className="h-5 w-5 text-white" />
            )}
          </div>
          <span className="text-sm font-semibold text-slate">Session {session}</span>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold',
            config.color,
            config.bgColor
          )}
        >
          {config.badge}
        </span>
      </div>

      {/* Title and Description */}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate leading-relaxed">{description}</p>

      {/* Locked Message */}
      {disabled && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Lock className="h-3 w-3" />
          <span>Complete previous session to unlock</span>
        </div>
      )}
    </div>
  );

  if (disabled) {
    return CardContent;
  }

  return (
    <Link href={href} className="block">
      {CardContent}
    </Link>
  );
}
