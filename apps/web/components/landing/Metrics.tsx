'use client';

import { Bot, FileText, Gauge, Layers } from 'lucide-react';

const metrics = [
  {
    icon: Bot,
    value: '86+',
    label: 'MCP Tools',
    description: 'Production-ready tools across 19 categories',
  },
  {
    icon: Gauge,
    value: '98%',
    label: 'Token Reduction',
    description: 'Via the skills lazy-loading system',
  },
  {
    icon: FileText,
    value: '15',
    label: 'Auto-Generated Docs',
    description: 'From PRD to deployment guides',
  },
  {
    icon: Layers,
    value: '5',
    label: 'Hierarchy Levels',
    description: 'Phase → Sprint → Week → Day → Task',
  },
];

export function Metrics() {
  return (
    <section className="bg-[#1A1A1A] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="group relative rounded-2xl border border-[#3A3A3A] bg-[#2A2A2A] p-6 transition-all duration-300 hover:border-[#FF8B6A]/50"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-[#FF8B6A]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF8B6A]/10">
                  <metric.icon className="h-6 w-6 text-[#FF8B6A]" />
                </div>
                <div className="mb-1 text-4xl font-bold text-white">{metric.value}</div>
                <div className="mb-1 text-lg font-semibold text-white">{metric.label}</div>
                <div className="text-sm text-gray-500">{metric.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
