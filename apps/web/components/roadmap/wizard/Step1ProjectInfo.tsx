'use client';

/**
 * Step1ProjectInfo Component
 *
 * First wizard step: Basic project information
 * - Title (required, max 200 chars)
 * - Description (optional, max 2000 chars)
 * - Start Date (required)
 */

import { FileText, Calendar, AlignLeft } from 'lucide-react';
import type { WizardData } from './RoadmapWizard';

interface Step1Props {
  data: WizardData;
  errors: Record<string, string>;
  onChange: (data: Partial<WizardData>) => void;
}

export function Step1ProjectInfo({ data, errors, onChange }: Step1Props) {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Project Information</h2>
        <p className="text-slate text-sm">
          Start by giving your roadmap a name and setting a start date
        </p>
      </div>

      {/* Title Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
          <FileText className="h-4 w-4 text-coral" />
          Roadmap Title
          <span className="text-coral">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., Q1 2025 Development Roadmap"
          maxLength={200}
          className={`
            w-full px-4 py-3 rounded-xl
            neu-pressed bg-transparent
            text-white placeholder:text-slate/50
            focus:outline-none focus:ring-2 focus:ring-coral/50
            transition-all duration-200
            ${errors.title ? 'ring-2 ring-red-500' : ''}
          `}
        />
        <div className="flex justify-between mt-1">
          {errors.title ? (
            <span className="text-xs text-red-400">{errors.title}</span>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate">{data.title.length}/200</span>
        </div>
      </div>

      {/* Start Date Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
          <Calendar className="h-4 w-4 text-coral" />
          Start Date
          <span className="text-coral">*</span>
        </label>
        <input
          type="date"
          value={data.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
          className={`
            w-full px-4 py-3 rounded-xl
            neu-pressed bg-transparent
            text-white
            focus:outline-none focus:ring-2 focus:ring-coral/50
            transition-all duration-200
            [color-scheme:dark]
            ${errors.startDate ? 'ring-2 ring-red-500' : ''}
          `}
        />
        {errors.startDate && (
          <span className="text-xs text-red-400 mt-1 block">{errors.startDate}</span>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
          <AlignLeft className="h-4 w-4 text-coral" />
          Description
          <span className="text-slate text-xs font-normal">(optional)</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description of this roadmap's goals and scope..."
          maxLength={2000}
          rows={4}
          className={`
            w-full px-4 py-3 rounded-xl
            neu-pressed bg-transparent
            text-white placeholder:text-slate/50
            focus:outline-none focus:ring-2 focus:ring-coral/50
            transition-all duration-200 resize-none
            ${errors.description ? 'ring-2 ring-red-500' : ''}
          `}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <span className="text-xs text-red-400">{errors.description}</span>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate">{data.description.length}/2000</span>
        </div>
      </div>

      {/* Tip */}
      <div className="neu-flat rounded-xl p-4 mt-8">
        <p className="text-sm text-slate">
          <span className="text-coral font-medium">Tip:</span> Your progress is automatically
          saved. You can close this page and return later to continue.
        </p>
      </div>
    </div>
  );
}
