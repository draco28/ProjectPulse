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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Floating Background */}
      <FloatingBackground />

      {/* Content Wrapper */}
      <div className="content-wrapper flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </>
  );
}
