/**
 * Dashboard Layout
 *
 * Layout with Sidebar and Header for dashboard pages
 */
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background-darkest">{children}</main>
      </div>
    </div>
  );
}
