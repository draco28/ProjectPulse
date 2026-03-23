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
    <section className="bg-[#1A1A1A] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Built With Modern Tech</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Production-ready stack for performance and developer experience
          </p>
        </div>

        {/* Tech grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {technologies.map((tech) => (
            <a
              key={tech.name}
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-[#3A3A3A] bg-[#2A2A2A] p-6 text-center transition-all duration-300 hover:border-[#4A4A4A]"
            >
              {/* Logo placeholder - using text as fallback */}
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-bold"
                style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
              >
                {tech.name.charAt(0)}
              </div>
              <div className="mb-1 text-sm font-semibold text-white">{tech.name}</div>
              <div className="text-xs text-gray-500">{tech.description}</div>
            </a>
          ))}
        </div>

        {/* GitHub stats */}
        <div className="mt-16 rounded-2xl border border-[#3A3A3A] bg-[#2A2A2A] p-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div>
              <h3 className="mb-2 text-2xl font-bold text-white">Open Source & Free</h3>
              <p className="text-gray-400">
                MIT licensed. Self-host on your infrastructure. No vendor lock-in.
              </p>
            </div>
            <a
              href="https://github.com/ProjectPulse/ProjectPulse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4A4A4A]"
            >
              Star on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
