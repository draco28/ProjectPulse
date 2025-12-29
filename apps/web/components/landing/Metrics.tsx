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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="relative group p-6 rounded-2xl bg-[#2A2A2A] border border-[#3A3A3A] hover:border-[#FF8B6A]/50 transition-all duration-300"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-[#FF8B6A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-[#FF8B6A]/10 flex items-center justify-center mb-4">
                  <metric.icon className="w-6 h-6 text-[#FF8B6A]" />
                </div>
                <div className="text-4xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-lg font-semibold text-white mb-1">{metric.label}</div>
                <div className="text-sm text-gray-500">{metric.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
