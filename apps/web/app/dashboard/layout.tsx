/**
 * Dashboard Layout
 *
 * Neumorphic dashboard layout matching the mockup
 * (dashboard-dark-neumorphic-coral.html lines 254-263 and 263-592)
 *
 * Features:
 * - FloatingBackground with hexagons and bubbles
 * - Sidebar with neumorphic design
 * - Header with glass effect
 * - Content wrapper with proper z-index
 */
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { FloatingBackground } from '@/components/FloatingBackground';
import { CommandPalette } from '@/components/command-palette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

      {/* Command Palette */}
      <CommandPalette />

      {/* Content Wrapper */}
      <div className="content-wrapper flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area - Responsive padding (mobile: 16px, tablet: 24px, desktop: 32px) */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 py-3 md:gap-4 md:p-6 lg:p-8">
          {/* Header */}
          <Header />

          {/* Page content */}
          <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
