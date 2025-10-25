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

import { Home, ListTodo, Lightbulb, Book, Shield, Users, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-background-light bg-background-dark">
      {/* Logo */}
      <div className="border-b border-background-light p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 animate-heartbeat items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 animate-pulse-glow rounded-lg border-2 border-accent-primary opacity-0" />
          </div>
          <div>
            <h1 className="gradient-text text-lg font-bold">Moksha</h1>
            <p className="text-xs text-text-tertiary">DevHub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between rounded-lg px-4 py-3 transition-all duration-200',
                isActive
                  ? 'bg-accent-primary/20 border-accent-primary/30 border text-accent-primary'
                  : 'text-text-secondary hover:bg-background-light hover:text-text-primary'
              )}
            >
              <div className="flex items-center gap-3">
                {item.pulse && (
                  <div className="pulse-indicator">
                    <div className="pulse-dot" />
                    <div className="pulse-ring" />
                  </div>
                )}
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform group-hover:scale-110',
                    isActive && 'text-accent-primary'
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <Badge
                  variant={item.badgeVariant === 'warning' ? 'destructive' : 'default'}
                  className={cn(
                    'h-5 px-2 text-xs',
                    item.badgeVariant === 'warning' &&
                      'bg-warning/20 border-warning/30 text-warning'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Settings */}
      <div className="p-4">
        <Link
          href="/settings"
          className={cn(
            'group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200',
            pathname === '/settings'
              ? 'bg-accent-primary/20 border-accent-primary/30 border text-accent-primary'
              : 'text-text-secondary hover:bg-background-light hover:text-text-primary'
          )}
        >
          <Settings className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>

      <Separator />

      {/* User Profile */}
      <div className="p-4">
        <div className="flex cursor-pointer items-center gap-3 rounded-lg bg-background-medium p-3 transition-colors hover:bg-background-light">
          <Avatar>
            <AvatarFallback className="bg-accent-primary font-semibold text-white">
              DV
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">Developer</p>
            <p className="truncate text-xs text-text-tertiary">dev@moksha.local</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-success" title="Online" />
        </div>
      </div>
    </aside>
  );
}
