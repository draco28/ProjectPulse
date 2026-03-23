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
    <section className="bg-[#1F1F1F] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">How It Works</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            From zero to productive in three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="absolute left-full top-12 z-0 hidden h-0.5 w-full bg-gradient-to-r from-[#3A3A3A] to-transparent lg:block" />
              )}

              <div className="relative z-10 h-full rounded-2xl border border-[#3A3A3A] bg-[#2A2A2A] p-8">
                {/* Step number */}
                <div className="mb-6 flex items-center gap-4">
                  <span className="text-5xl font-bold text-[#FF8B6A]/20">{step.number}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF8B6A]/10">
                    <step.icon className="h-6 w-6 text-[#FF8B6A]" />
                  </div>
                </div>

                <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                <p className="mb-4 text-gray-400">{step.description}</p>

                {/* Highlight badge */}
                <div className="inline-flex items-center rounded-full border border-[#FF8B6A]/20 bg-[#FF8B6A]/10 px-3 py-1.5">
                  <span className="text-sm font-medium text-[#FF8B6A]">{step.highlight}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Screenshot */}
        <div className="mt-16 overflow-hidden rounded-xl border border-[#3A3A3A] shadow-2xl shadow-black/50">
          <Image
            src="/images/phase-timeline.png"
            alt="Phase Timeline View"
            width={1400}
            height={900}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
