/**
 * Admin Layout
 * Sprint 11.5: Separate layout for admin pages
 *
 * Features:
 * - Admin-specific sidebar
 * - No project context required
 * - Different navigation from main app
 */

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { FloatingBackground } from '@/components/FloatingBackground';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Skip to Content Link - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-2xl focus:bg-coral focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Floating Background */}
      <FloatingBackground />

      {/* Content Wrapper */}
      <div className="flex h-screen overflow-hidden">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Main content area */}
        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden px-6 py-4 md:px-8">
          {/* Page content */}
          <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
