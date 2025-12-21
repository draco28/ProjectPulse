'use client';

/**
 * ImportValidationErrors Component
 *
 * Display validation errors from JSON parsing
 */

import { AlertCircle, XCircle } from 'lucide-react';
import type { ValidationError } from './RoadmapImport';

interface ImportValidationErrorsProps {
  errors: ValidationError[];
}

export function ImportValidationErrors({ errors }: ImportValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <h4 className="font-medium text-red-400">Validation Errors</h4>
      </div>

      <ul className="space-y-2">
        {errors.map((error, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <div>
              {error.path.length > 0 && (
                <span className="mr-2 font-mono text-xs text-red-300">{error.path.join('.')}:</span>
              )}
              <span className="text-red-400">{error.message}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-red-400/70">Please fix these errors and try again.</p>
    </div>
  );
}
