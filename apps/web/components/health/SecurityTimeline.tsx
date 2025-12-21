'use client';

import { Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface TimelineEvent {
  id: number;
  type: 'scan' | 'fix' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SecurityTimelineProps {
  events: TimelineEvent[];
  maxEvents?: number;
}

/**
 * Security activity timeline showing recent scans, fixes, and alerts
 * Displays chronological list with colored indicators
 */
export function SecurityTimeline({ events, maxEvents = 5 }: SecurityTimelineProps) {
  const displayEvents = events.slice(0, maxEvents);

  // Get event icon and color based on type
  const getEventConfig = (event: TimelineEvent) => {
    if (event.type === 'scan') {
      return {
        icon: Activity,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
      };
    }
    if (event.type === 'fix') {
      return {
        icon: CheckCircle,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
      };
    }
    // alert
    return {
      icon: AlertCircle,
      color: event.severity === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400',
      bgColor: event.severity === 'CRITICAL' ? 'bg-red-500/20' : 'bg-yellow-500/20',
    };
  };

  // Format timestamp as relative time
  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="neu-raised rounded-3xl p-6" data-testid="security-timeline">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase text-white">Security Activity</h2>
        <Clock className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      <div className="space-y-4">
        {displayEvents.map((event, index) => {
          const config = getEventConfig(event);
          const Icon = config.icon;
          const isLast = index === displayEvents.length - 1;

          return (
            <div key={event.id} className="relative pl-8" data-testid="timeline-event">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-3 top-8 h-full w-px bg-gradient-to-b from-slate-700 to-transparent"></div>
              )}

              {/* Event icon */}
              <div
                className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full ${config.bgColor}`}
              >
                <Icon className={`h-4 w-4 ${config.color}`} aria-hidden="true" />
              </div>

              {/* Event content */}
              <div className="neu-pressed smooth-transition rounded-2xl p-3 hover:scale-105">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white">{event.title}</h3>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{event.description}</p>

                {/* Severity badge if present */}
                {event.severity && (
                  <div className="mt-2">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        event.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400'
                          : event.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400'
                            : event.severity === 'MEDIUM'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {event.severity}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View all link */}
      {events.length > maxEvents && (
        <div className="mt-4 text-center">
          <button className="text-coral-400 hover:text-coral-300 text-sm font-medium">
            View all {events.length} events →
          </button>
        </div>
      )}
    </div>
  );
}
