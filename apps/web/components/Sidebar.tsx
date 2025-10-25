/**
 * Sidebar Component
 *
 * Main navigation sidebar with:
 * - Logo with pulse animation
 * - Navigation items with badges and icons
 * - Theme switcher
 * - User profile
 */
'use client';

import { Home, ListTodo, Lightbulb, Book, Shield, Users, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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

  return (
    <aside className="flex w-64 flex-col gap-4 p-4">
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
      <nav className="flex flex-1 flex-col gap-2">
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
            <p className="text-xs text-slate">dev@moksha.local</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
