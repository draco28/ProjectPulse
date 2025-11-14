'use client';

import { Shield, Code, Zap, Eye } from 'lucide-react';

interface CategoryBreakdownProps {
  securityScore: number;
  qualityScore: number;
  performanceScore: number;
  accessibilityScore: number;
}

/**
 * Display 4 category scores with horizontal bars
 * Weights: Security 40%, Quality 30%, Accessibility 20%, Performance 10%
 */
export function CategoryBreakdown({
  securityScore,
  qualityScore,
  performanceScore,
  accessibilityScore,
}: CategoryBreakdownProps) {
  const categories = [
    {
      name: 'Security',
      icon: Shield,
      score: securityScore,
      weight: 40,
      color: 'bg-purple-500',
    },
    {
      name: 'Code Quality',
      icon: Code,
      score: qualityScore,
      weight: 30,
      color: 'bg-blue-500',
    },
    {
      name: 'Accessibility',
      icon: Eye,
      score: accessibilityScore,
      weight: 20,
      color: 'bg-green-500',
    },
    {
      name: 'Performance',
      icon: Zap,
      score: performanceScore,
      weight: 10,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="neu-raised rounded-3xl p-6">
      <h2 className="mb-4 text-sm font-bold uppercase text-white">Category Breakdown</h2>

      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <div key={category.name}>
              {/* Category Header - Name, weight, and score */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-white">{category.name}</span>
                  <span className="text-xs text-slate-400">({category.weight}%)</span>
                </div>
                <span className="text-sm font-semibold text-white">{category.score}</span>
              </div>

              {/* Progress Bar - Neumorphic pressed background with colored fill */}
              <div className="neu-pressed h-3 overflow-hidden rounded-full">
                <div
                  className={`h-full transition-all duration-500 ${category.color}`}
                  style={{ width: `${category.score}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
