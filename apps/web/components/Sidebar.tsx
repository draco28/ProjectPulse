/**
 * Sidebar Component
 *
 * Main navigation sidebar with:
 * - Logo with pulse animation
 * - Navigation items with badges and icons
 * - Theme switcher
 * - User profile
 * - Mobile drawer with hamburger menu
 */
'use client';

import {
  Home,
  ListTodo,
  Lightbulb,
  Book,
  Shield,
  Users,
  Settings,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface NavItem {
  icon: typeof Home;
  label: string;
  href: string;
  badge?: number;
  badgeVariant?: 'default' | 'destructive' | 'warning';
  pulse?: boolean;
}

const navigationItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/dashboard', pulse: true },
  { icon: ListTodo, label: 'Issues', href: '/issues', badge: 12 },
  { icon: Lightbulb, label: 'Knowledge', href: '/knowledge' },
  { icon: Book, label: 'Wiki', href: '/wiki' },
  {
    icon: Shield,
    label: 'Security',
    href: '/security',
    badge: 3,
    badgeVariant: 'warning',
  },
  { icon: Users, label: 'Agent Personas', href: '/agents' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Custom hooks
  const drawerRef = useFocusTrap(isMobileMenuOpen);
  useBodyScrollLock(isMobileMenuOpen);

  // Close drawer on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile/tablet */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="neu-raised smooth-transition fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl text-slate hover:text-white md:hidden"
        aria-label="Open navigation menu"
        aria-expanded={isMobileMenuOpen}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay - Only renders when drawer is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile drawer */}
      <aside
        ref={drawerRef}
        className={cn(
          'flex flex-col gap-4 p-4',
          // Desktop: fixed width, always visible
          'md:w-64',
          // Mobile: full drawer behavior
          'fixed inset-y-0 left-0 z-50 w-80 bg-background transition-transform duration-300 md:static md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Close Button - Mobile only */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="neu-raised smooth-transition absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate hover:text-white md:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo Card */}
        <div className="neu-raised smooth-transition rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <div className="icon-coral heartbeat flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Moksha</h1>
              <p className="text-xs text-slate">DevHub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'smooth-transition flex items-center gap-3 rounded-2xl px-5 py-4',
                  isActive ? 'coral-gradient text-white' : 'neu-raised text-slate hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.pulse && isActive && (
                  <div className="pulse-glow ml-auto h-2 w-2 rounded-full bg-white" />
                )}
                {item.badge && (
                  <span
                    className={cn(
                      'ml-auto rounded-full px-2.5 py-1 text-xs font-semibold shadow-md',
                      item.badgeVariant === 'warning'
                        ? 'bg-red-500 text-white'
                        : 'bg-coral text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Settings at bottom of nav */}
          <div className="mt-auto">
            <Link
              href="/settings"
              className={cn(
                'smooth-transition flex items-center gap-3 rounded-2xl px-5 py-4',
                pathname === '/settings'
                  ? 'coral-gradient text-white'
                  : 'neu-raised text-slate hover:text-white'
              )}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </nav>

        {/* User Profile */}
        <div className="neu-raised smooth-transition rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="icon-coral flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg">
              DV
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Developer</p>
              <p className="text-xs text-slate">dev@projectpulse.local</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
