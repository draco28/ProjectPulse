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
    <div className="mx-auto max-w-xl space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Project Information</h2>
        <p className="text-sm text-slate">
          Start by giving your roadmap a name and setting a start date
        </p>
      </div>

      {/* Title Field */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
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
            neu-pressed w-full rounded-xl bg-transparent
            px-4 py-3
            text-white transition-all
            duration-200 placeholder:text-slate/50 focus:outline-none
            focus:ring-2 focus:ring-coral/50
            ${errors.title ? 'ring-2 ring-red-500' : ''}
          `}
        />
        <div className="mt-1 flex justify-between">
          {errors.title ? <span className="text-xs text-red-400">{errors.title}</span> : <span />}
          <span className="text-xs text-slate">{data.title.length}/200</span>
        </div>
      </div>

      {/* Start Date Field */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
          <Calendar className="h-4 w-4 text-coral" />
          Start Date
          <span className="text-coral">*</span>
        </label>
        <input
          type="date"
          value={data.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
          className={`
            neu-pressed w-full rounded-xl bg-transparent
            px-4 py-3
            text-white
            transition-all duration-200 [color-scheme:dark]
            focus:outline-none focus:ring-2
            focus:ring-coral/50
            ${errors.startDate ? 'ring-2 ring-red-500' : ''}
          `}
        />
        {errors.startDate && (
          <span className="mt-1 block text-xs text-red-400">{errors.startDate}</span>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
          <AlignLeft className="h-4 w-4 text-coral" />
          Description
          <span className="text-xs font-normal text-slate">(optional)</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description of this roadmap's goals and scope..."
          maxLength={2000}
          rows={4}
          className={`
            neu-pressed w-full resize-none rounded-xl
            bg-transparent px-4
            py-3 text-white
            transition-all duration-200 placeholder:text-slate/50
            focus:outline-none focus:ring-2 focus:ring-coral/50
            ${errors.description ? 'ring-2 ring-red-500' : ''}
          `}
        />
        <div className="mt-1 flex justify-between">
          {errors.description ? (
            <span className="text-xs text-red-400">{errors.description}</span>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate">{data.description.length}/2000</span>
        </div>
      </div>

      {/* Tip */}
      <div className="neu-flat mt-8 rounded-xl p-4">
        <p className="text-sm text-slate">
          <span className="font-medium text-coral">Tip:</span> Your progress is automatically saved.
          You can close this page and return later to continue.
        </p>
      </div>
    </div>
  );
}
