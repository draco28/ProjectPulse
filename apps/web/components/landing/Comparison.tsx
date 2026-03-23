'use client';

import { Check, X, Minus } from 'lucide-react';

type ComparisonValue = true | false | 'partial';

interface ComparisonCell {
  value: ComparisonValue;
  note: string;
}

interface ComparisonRow {
  feature: string;
  projectpulse: ComparisonCell;
  jira: ComparisonCell;
  github: ComparisonCell;
  notion: ComparisonCell;
}

const comparisons: ComparisonRow[] = [
  {
    feature: 'AI Agent Integration',
    projectpulse: { value: true, note: '86+ MCP tools' },
    jira: { value: false, note: 'No native support' },
    github: { value: 'partial', note: 'Copilot only' },
    notion: { value: 'partial', note: 'AI writing assist' },
  },
  {
    feature: 'Token-Efficient Context',
    projectpulse: { value: true, note: '98% reduction' },
    jira: { value: false, note: 'N/A' },
    github: { value: false, note: 'N/A' },
    notion: { value: false, note: 'N/A' },
  },
  {
    feature: 'Semantic Search',
    projectpulse: { value: true, note: 'Hybrid search' },
    jira: { value: false, note: 'JQL only' },
    github: { value: 'partial', note: 'Code search' },
    notion: { value: true, note: 'AI search' },
  },
  {
    feature: 'Knowledge Graph',
    projectpulse: { value: true, note: 'Graph traversal' },
    jira: { value: false, note: 'Confluence links' },
    github: { value: false, note: 'No graph' },
    notion: { value: 'partial', note: 'Backlinks' },
  },
  {
    feature: 'Automated Onboarding',
    projectpulse: { value: true, note: '15 docs generated' },
    jira: { value: false, note: 'Manual setup' },
    github: { value: false, note: 'Manual setup' },
    notion: { value: 'partial', note: 'Templates' },
  },
  {
    feature: 'Progress Cascade',
    projectpulse: { value: true, note: '5-level auto rollup' },
    jira: { value: 'partial', note: 'Manual rollup' },
    github: { value: false, note: 'No hierarchy' },
    notion: { value: false, note: 'Manual' },
  },
  {
    feature: 'Local/Self-Hosted',
    projectpulse: { value: true, note: 'Docker ready' },
    jira: { value: 'partial', note: 'Data Center $$$' },
    github: { value: 'partial', note: 'Enterprise only' },
    notion: { value: false, note: 'Cloud only' },
  },
  {
    feature: 'Open Source',
    projectpulse: { value: true, note: 'MIT License' },
    jira: { value: false, note: 'Proprietary' },
    github: { value: false, note: 'Proprietary' },
    notion: { value: false, note: 'Proprietary' },
  },
];

function StatusIcon({ value }: { value: boolean | 'partial' }) {
  if (value === true) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
        <Check className="h-4 w-4 text-green-400" />
      </div>
    );
  }
  if (value === 'partial') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20">
        <Minus className="h-4 w-4 text-yellow-400" />
      </div>
    );
  }
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20">
      <X className="h-4 w-4 text-red-400" />
    </div>
  );
}

export function Comparison() {
  return (
    <section className="bg-[#1F1F1F] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Why ProjectPulse?</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Built from the ground up for AI-assisted development
          </p>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3A3A3A]">
                <th className="px-4 py-4 text-left font-medium text-gray-400">Feature</th>
                <th className="px-4 py-4 text-center">
                  <span className="font-bold text-[#FF8B6A]">ProjectPulse</span>
                </th>
                <th className="px-4 py-4 text-center text-gray-400">JIRA</th>
                <th className="px-4 py-4 text-center text-gray-400">GitHub Issues</th>
                <th className="px-4 py-4 text-center text-gray-400">Notion</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, index) => (
                <tr
                  key={row.feature}
                  className={`border-b border-[#3A3A3A]/50 ${
                    index % 2 === 0 ? 'bg-[#2A2A2A]/30' : ''
                  }`}
                >
                  <td className="px-4 py-4 font-medium text-white">{row.feature}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <StatusIcon value={row.projectpulse.value} />
                      <span className="text-xs text-gray-500">{row.projectpulse.note}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <StatusIcon value={row.jira.value} />
                      <span className="text-xs text-gray-500">{row.jira.note}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <StatusIcon value={row.github.value} />
                      <span className="text-xs text-gray-500">{row.github.note}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <StatusIcon value={row.notion.value} />
                      <span className="text-xs text-gray-500">{row.notion.note}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
