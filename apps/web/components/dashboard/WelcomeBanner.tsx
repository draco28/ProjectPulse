/**
 * WelcomeBanner Component
 *
 * Neumorphic welcome banner matching the mockup
 * (dashboard-dark-neumorphic-coral.html lines 361-371)
 *
 * Features:
 * - neu-raised container with rounded-3xl
 * - Coral gradient blob decoration
 * - coral-gradient button
 * - Large typography (text-4xl, text-lg)
 *
 * IMPORTANT: Uses client-only rendering to prevent hydration errors
 * with time-based greeting. The greeting changes based on time of day,
 * so we cannot server-render this component without causing mismatches.
 */
'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WelcomeBannerProps {
  userName?: string;
}

export function WelcomeBanner({ userName: _userName = 'Developer' }: WelcomeBannerProps) {
  // Client-only rendering - no SSR
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    setGreeting(timeGreeting);
  }, []);

  // Don't render anything server-side to prevent hydration errors
  if (!mounted) {
    return (
      <div className="neu-raised smooth-transition relative overflow-hidden rounded-3xl p-8">
        <div className="coral-gradient absolute right-8 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full opacity-20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="mb-2 text-4xl font-bold text-white">
            Good morning! 👋
          </h2>
          <p className="mb-6 text-lg text-slate">Here&apos;s your project pulse for Moksha DevHub</p>
          <button className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-8 py-3 font-semibold text-white">
            <Plus className="h-5 w-5" />
            <span>Create New Issue</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="neu-raised smooth-transition relative overflow-hidden rounded-3xl p-8">
      {/* Coral gradient blob */}
      <div className="coral-gradient absolute right-8 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full opacity-20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        <h2 className="mb-2 text-4xl font-bold text-white">
          {greeting}! 👋
        </h2>
        <p className="mb-6 text-lg text-slate">Here&apos;s your project pulse for Moksha DevHub</p>
        <button className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-8 py-3 font-semibold text-white">
          <Plus className="h-5 w-5" />
          <span>Create New Issue</span>
        </button>
      </div>
    </div>
  );
}
