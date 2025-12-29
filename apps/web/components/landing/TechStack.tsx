'use client';

import { ExternalLink } from 'lucide-react';

const technologies = [
  {
    name: 'Next.js 14',
    description: 'App Router',
    logo: '/logos/nextjs.svg',
    url: 'https://nextjs.org',
    color: '#000000',
  },
  {
    name: 'TypeScript',
    description: 'Strict mode',
    logo: '/logos/typescript.svg',
    url: 'https://typescriptlang.org',
    color: '#3178C6',
  },
  {
    name: 'PostgreSQL 16',
    description: 'pgvector',
    logo: '/logos/postgresql.svg',
    url: 'https://postgresql.org',
    color: '#336791',
  },
  {
    name: 'Prisma',
    description: 'Type-safe ORM',
    logo: '/logos/prisma.svg',
    url: 'https://prisma.io',
    color: '#2D3748',
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first',
    logo: '/logos/tailwind.svg',
    url: 'https://tailwindcss.com',
    color: '#06B6D4',
  },
  {
    name: 'MCP SDK',
    description: 'Claude integration',
    logo: '/logos/anthropic.svg',
    url: 'https://modelcontextprotocol.io',
    color: '#FF8B6A',
  },
];

export function TechStack() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built With Modern Tech
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Production-ready stack for performance and developer experience
          </p>
        </div>

        {/* Tech grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {technologies.map((tech) => (
            <a
              key={tech.name}
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] hover:border-[#4A4A4A] transition-all duration-300 text-center"
            >
              {/* Logo placeholder - using text as fallback */}
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
              >
                {tech.name.charAt(0)}
              </div>
              <div className="font-semibold text-white text-sm mb-1">{tech.name}</div>
              <div className="text-xs text-gray-500">{tech.description}</div>
            </a>
          ))}
        </div>

        {/* GitHub stats */}
        <div className="mt-16 p-8 rounded-2xl bg-[#2A2A2A] border border-[#3A3A3A]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Open Source & Free</h3>
              <p className="text-gray-400">
                MIT licensed. Self-host on your infrastructure. No vendor lock-in.
              </p>
            </div>
            <a
              href="https://github.com/ProjectPulse/ProjectPulse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white font-medium transition-colors"
            >
              Star on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
