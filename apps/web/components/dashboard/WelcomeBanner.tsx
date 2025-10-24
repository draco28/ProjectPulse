/**
 * WelcomeBanner Component
 *
 * Hero banner with:
 * - Gradient background
 * - Welcome message
 * - CTA button to create new issue
 */
'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface WelcomeBannerProps {
  userName?: string;
}

export function WelcomeBanner({ userName = 'Developer' }: WelcomeBannerProps) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-primary p-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute right-0 top-0 h-64 w-64 animate-float rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 animate-float-bubble rounded-full bg-white blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-lg text-white/90">
            You have <span className="font-semibold">12 open issues</span> and{' '}
            <span className="font-semibold">3 security findings</span> to review
          </p>
        </div>

        <Button
          size="lg"
          className="bg-white text-accent-primary shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-xl"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Issue
        </Button>
      </div>
    </div>
  );
}
