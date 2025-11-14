'use client';

import { FileCode, AlertTriangle, AlertCircle, Info, Shield, Code, Zap, Eye } from 'lucide-react';

interface FindingRowProps {
  finding: {
    id: number;
    category: string;
    severity: string;
    ruleId: string;
    message: string;
    filePath: string;
    lineNumber: number | null;
    status: string;
    scanner: {
      name: string;
      type: string;
    };
  };
}

/**
 * Display individual finding as card
 * Follows neumorphic coral theme with hover effects
 */
export function FindingRow({ finding }: FindingRowProps) {
  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return <Shield className="h-4 w-4 text-purple-400" />;
      case 'CODE_QUALITY':
        return <Code className="h-4 w-4 text-blue-400" />;
      case 'PERFORMANCE':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'ACCESSIBILITY':
        return <Eye className="h-4 w-4 text-green-400" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  // Severity styling
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
        };
      case 'HIGH':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
        };
      case 'MEDIUM':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
        };
      case 'LOW':
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10',
        };
    }
  };

  const categoryIcon = getCategoryIcon(finding.category);
  const { icon: severityIcon, color, bg } = getSeverityStyle(finding.severity);

  return (
    <div className="neu-pressed group rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className="neu-raised flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
          {categoryIcon}
        </div>

        {/* Finding Details */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-white transition-colors duration-200 group-hover:text-coral-400">
                {finding.message}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                <FileCode className="mr-1 inline h-3 w-3" />
                {finding.filePath}
                {finding.lineNumber && `:${finding.lineNumber}`}
              </p>
            </div>

            {/* Severity Badge */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg} ${color}`}
            >
              {severityIcon}
              <span className="capitalize">{finding.severity.toLowerCase()}</span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Category:</span>
              <span className="capitalize">{finding.category.toLowerCase().replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Scanner:</span>
              <span>{finding.scanner.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Rule:</span>
              <span className="font-mono">{finding.ruleId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
