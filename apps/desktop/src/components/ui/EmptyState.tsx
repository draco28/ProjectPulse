import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={40} className="text-gray-600 mb-3" />
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>
      )}
    </div>
  );
}
