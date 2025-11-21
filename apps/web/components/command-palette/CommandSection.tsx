'use client';

/**
 * Command Section Component
 * 
 * Section header with icon and label
 */

interface CommandSectionProps {
  icon: string;
  label: string;
}

export function CommandSection({ icon, label }: CommandSectionProps) {
  return (
    <div className="section-header flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-300">
      <span className="text-coral">{icon}</span>
      {label}
    </div>
  );
}
