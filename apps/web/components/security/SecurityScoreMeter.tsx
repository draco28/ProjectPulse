'use client';

import { useEffect, useState } from 'react';

interface SecurityScoreMeterProps {
  score: number; // 0-100
  label?: string;
}

export function SecurityScoreMeter({
  score,
  label = 'Security Score',
}: SecurityScoreMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Calculate circle properties
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green-500
    if (score >= 60) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const scoreColor = getScoreColor(animatedScore);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={radius * 2} height={radius * 2}>
          <circle
            stroke="rgba(255, 255, 255, 0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={scoreColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold"
            style={{ color: scoreColor }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-slate">/ 100</span>
        </div>
      </div>

      {/* Label */}
      {label && (
        <p className="mt-4 text-sm font-semibold text-slate">{label}</p>
      )}
    </div>
  );
}
