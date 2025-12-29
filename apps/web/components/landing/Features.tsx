'use client';

import {
  Bot,
  Brain,
  Kanban,
  Search,
  Ticket,
  Workflow,
  LucideIcon,
} from 'lucide-react';
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
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            A complete platform for AI-assisted development
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Feature list */}
          <div className="space-y-4">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature)}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-300 ${
                  activeFeature.id === feature.id
                    ? 'bg-[#2A2A2A] border-[#FF8B6A]/50 shadow-lg shadow-[#FF8B6A]/10'
                    : 'bg-[#2A2A2A]/50 border-[#3A3A3A] hover:bg-[#2A2A2A] hover:border-[#4A4A4A]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeFeature.id === feature.id
                        ? 'bg-[#FF8B6A]/20'
                        : 'bg-[#3A3A3A]'
                    }`}
                  >
                    <feature.icon
                      className={`w-5 h-5 ${
                        activeFeature.id === feature.id
                          ? 'text-[#FF8B6A]'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.shortDesc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Feature preview */}
          <div className="lg:sticky lg:top-8">
            <div className="p-6 rounded-2xl bg-[#2A2A2A] border border-[#3A3A3A]">
              <h3 className="text-xl font-bold text-white mb-3">{activeFeature.title}</h3>
              <p className="text-gray-400 mb-6">{activeFeature.description}</p>
              <div className="rounded-xl overflow-hidden border border-[#3A3A3A]">
                <Image
                  src={activeFeature.image}
                  alt={activeFeature.title}
                  width={700}
                  height={450}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
