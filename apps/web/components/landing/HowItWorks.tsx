'use client';

import { ClipboardCheck, Code2, TrendingUp } from 'lucide-react';
import Image from 'next/image';

const steps = [
  {
    number: '01',
    icon: ClipboardCheck,
    title: 'Onboard in 3 Sessions',
    description:
      '96 questions across 10 expert roles generate your project brief, 15 planning documents, and bootstrap personas, skills, and workflows.',
    highlight: '~2 hours → Complete project setup',
  },
  {
    number: '02',
    icon: Code2,
    title: 'Work with MCP Tools',
    description:
      'Your AI agent uses 86+ MCP tools to create tickets, search knowledge, update progress, and manage sessions — all without leaving the conversation.',
    highlight: '95% of interactions via MCP',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Track Progress Automatically',
    description:
      'Progress cascades from tasks to days to weeks to sprints to phases. Close a ticket and watch the roadmap update in real-time.',
    highlight: '5-level automatic cascade',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1F1F1F]">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            From zero to productive in three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#3A3A3A] to-transparent z-0" />
              )}

              <div className="relative z-10 p-8 rounded-2xl bg-[#2A2A2A] border border-[#3A3A3A] h-full">
                {/* Step number */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl font-bold text-[#FF8B6A]/20">{step.number}</span>
                  <div className="w-12 h-12 rounded-xl bg-[#FF8B6A]/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-[#FF8B6A]" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 mb-4">{step.description}</p>

                {/* Highlight badge */}
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#FF8B6A]/10 border border-[#FF8B6A]/20">
                  <span className="text-sm font-medium text-[#FF8B6A]">{step.highlight}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Screenshot */}
        <div className="mt-16 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-[#3A3A3A]">
          <Image
            src="/images/phase-timeline.png"
            alt="Phase Timeline View"
            width={1400}
            height={900}
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
