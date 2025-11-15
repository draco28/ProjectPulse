'use client';

import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface ComplianceStandard {
  name: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  percentage: number;
}

interface ComplianceStatusProps {
  standards: ComplianceStandard[];
}

/**
 * Compliance status for security standards (OWASP, CWE, SOC 2)
 * Shows compliance percentage and status badges
 */
export function ComplianceStatus({ standards }: ComplianceStatusProps) {
  // Get status config (icon, color, label)
  const getStatusConfig = (status: string) => {
    if (status === 'compliant') {
      return {
        icon: CheckCircle,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        label: 'Compliant',
      };
    }
    if (status === 'partial') {
      return {
        icon: AlertCircle,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        label: 'Partial',
      };
    }
    return {
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      label: 'Non-Compliant',
    };
  };

  return (
    <div className="neu-raised rounded-3xl p-6" data-testid="compliance-status">
      <div className="mb-6 flex items-center gap-2">
        <Shield className="h-5 w-5 text-coral-400" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase text-white">Compliance Status</h2>
      </div>

      <div className="space-y-4">
        {standards.map((standard) => {
          const config = getStatusConfig(standard.status);
          const Icon = config.icon;

          return (
            <div
              key={standard.name}
              className="neu-pressed smooth-transition rounded-2xl p-4 hover:scale-105"
              data-testid="compliance-standard"
            >
              <div className="mb-3 flex items-start justify-between">
                {/* Standard info */}
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-semibold text-white">{standard.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{standard.description}</p>
                </div>

                {/* Status icon */}
                <Icon className={`ml-3 h-6 w-6 ${config.color}`} aria-hidden="true" />
              </div>

              {/* Compliance percentage bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Compliance</span>
                  <span className="font-semibold text-white" data-testid="compliance-percentage">{standard.percentage}%</span>
                </div>

                <div className="neu-pressed h-3 overflow-hidden rounded-full">
                  <div
                    className={`h-full smooth-transition ${
                      standard.percentage >= 90
                        ? 'bg-green-500'
                        : standard.percentage >= 70
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{
                      width: `${standard.percentage}%`,
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
