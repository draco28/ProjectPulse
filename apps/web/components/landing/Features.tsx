'use client';

import { Bot, Brain, Kanban, Search, Ticket, Workflow, LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  shortDesc: string;
  description: string;
  image: string;
}

const features: Feature[] = [
  {
    id: 'mcp-tools',
    icon: Bot,
    title: 'MCP Tools',
    shortDesc: '86+ production-ready tools',
    description:
      'Context management, ticket CRUD, knowledge search, roadmap navigation, session checkpointing, and more — all accessible via the Model Context Protocol.',
    image: '/images/agent-sessions.png',
  },
  {
    id: 'knowledge',
    icon: Brain,
    title: 'Knowledge Base',
    shortDesc: 'Hybrid semantic + full-text search',
    description:
      'Store and retrieve knowledge with 92% context reduction. PostgreSQL tsvector for keywords plus pgvector for semantic similarity — all with local embeddings.',
    image: '/images/knowledge-base.png',
  },
  {
    id: 'tickets',
    icon: Ticket,
    title: 'Smart Tickets',
    shortDesc: 'Parent-child hierarchies',
    description:
      'Features contain tasks, tasks contain subtasks. Full traceability from requirements to implementation. Agents can create, search, and update programmatically.',
    image: '/images/issues-tracker.png',
  },
  {
    id: 'roadmaps',
    icon: Kanban,
    title: 'Roadmaps & Sprints',
    shortDesc: '5-level progress hierarchy',
    description:
      'Visualize your project as phases, sprints, weeks, and days. Progress automatically cascades up when you close tickets or complete tasks.',
    image: '/images/sprint-kanban.png',
  },
  {
    id: 'sessions',
    icon: Workflow,
    title: 'Agent Sessions',
    shortDesc: 'Survive context compaction',
    description:
      'Track work across conversation boundaries. Save plans, todos, and progress. Resume paused sessions with full context recovery.',
    image: '/images/agent-sessions.png',
  },
  {
    id: 'skills',
    icon: Search,
    title: 'Skills System',
    shortDesc: '98% token reduction',
    description:
      'Lazy-load coding patterns only when needed. Instead of dumping 50K tokens of docs, load 500-token skill snippets on demand.',
    image: '/images/knowledge-base.png',
  },
];

export function Features() {
  const [activeFeature, setActiveFeature] = useState<Feature>(features[0]!);

  return (
    <section className="bg-[#1A1A1A] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Everything You Need</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            A complete platform for AI-assisted development
          </p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Feature list */}
          <div className="space-y-4">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature)}
                className={`w-full rounded-xl border p-5 text-left transition-all duration-300 ${
                  activeFeature.id === feature.id
                    ? 'border-[#FF8B6A]/50 bg-[#2A2A2A] shadow-lg shadow-[#FF8B6A]/10'
                    : 'border-[#3A3A3A] bg-[#2A2A2A]/50 hover:border-[#4A4A4A] hover:bg-[#2A2A2A]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                      activeFeature.id === feature.id ? 'bg-[#FF8B6A]/20' : 'bg-[#3A3A3A]'
                    }`}
                  >
                    <feature.icon
                      className={`h-5 w-5 ${
                        activeFeature.id === feature.id ? 'text-[#FF8B6A]' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.shortDesc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Feature preview */}
          <div className="lg:sticky lg:top-8">
            <div className="rounded-2xl border border-[#3A3A3A] bg-[#2A2A2A] p-6">
              <h3 className="mb-3 text-xl font-bold text-white">{activeFeature.title}</h3>
              <p className="mb-6 text-gray-400">{activeFeature.description}</p>
              <div className="overflow-hidden rounded-xl border border-[#3A3A3A]">
                <Image
                  src={activeFeature.image}
                  alt={activeFeature.title}
                  width={700}
                  height={450}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
