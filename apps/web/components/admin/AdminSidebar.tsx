/**
 * Admin Sidebar Component
 * Sprint 11.5: Navigation for admin panel
 *
 * Features:
 * - Admin-specific navigation
 * - Back to main app link
 * - Mobile responsive drawer
 */
'use client';

import { LayoutDashboard, Users, Settings, ArrowLeft, Shield, Menu, X, Bot } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
}

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Bot, label: 'Agents', href: '/admin/agents' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on navigation
  const handleNavClick = () => {
    setIsMobileOpen(false);
  };

  // Focus trap and scroll lock for mobile drawer
  const drawerRef = useFocusTrap(isMobileOpen);
  useBodyScrollLock(isMobileOpen);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const NavContent = () => (
    <>
      {/* Logo / Header */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-coral/80 shadow-lg">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">ProjectPulse</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-coral/10 text-coral dark:bg-coral/20'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        {/* Back to App */}
        <Link
          href="/app"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to App</span>
        </Link>

        {/* Theme Switcher */}
        <div className="px-3 py-2">
          <ThemeSwitcher />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200/50 bg-white/80 p-4 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80 md:flex md:flex-col">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200/50 bg-white/80 px-4 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80 md:hidden">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-coral" />
          <span className="font-bold text-gray-900 dark:text-white">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        ref={drawerRef}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white p-4 shadow-xl transition-transform dark:bg-gray-900 md:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>

      {/* Mobile Content Spacer */}
      <div className="h-14 md:hidden" />
    </>
  );
}
