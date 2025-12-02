/**
 * Admin Header Component
 * Sprint 11.5: Header for admin pages
 * 
 * Features:
 * - Page title
 * - Admin badge
 * - Breadcrumb (optional)
 */
'use client';

import { Shield } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function AdminHeader({ title, description, children }: AdminHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-xs font-medium text-coral">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
