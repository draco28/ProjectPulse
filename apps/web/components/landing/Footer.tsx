'use client';

import { Github, Twitter, Heart } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Documentation', href: '/docs' },
    {
      label: 'Changelog',
      href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/CHANGELOG.md',
    },
    { label: 'Roadmap', href: 'https://github.com/ProjectPulse/ProjectPulse/projects' },
  ],
  resources: [
    { label: 'Getting Started', href: '/docs/getting-started' },
    { label: 'MCP Tools Guide', href: '/docs/mcp-tools' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Skills System', href: '/docs/skills' },
  ],
  community: [
    { label: 'GitHub', href: 'https://github.com/ProjectPulse/ProjectPulse' },
    { label: 'Discussions', href: 'https://github.com/ProjectPulse/ProjectPulse/discussions' },
    { label: 'Issues', href: 'https://github.com/ProjectPulse/ProjectPulse/issues' },
    {
      label: 'Contributing',
      href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/CONTRIBUTING.md',
    },
  ],
  legal: [
    {
      label: 'MIT License',
      href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/LICENSE',
    },
    {
      label: 'Security',
      href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/SECURITY.md',
    },
    {
      label: 'Code of Conduct',
      href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/CODE_OF_CONDUCT.md',
    },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[#2A2A2A] bg-[#1A1A1A]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="mb-4 inline-block">
              <span className="text-2xl font-bold text-[#FF8B6A]">ProjectPulse</span>
            </Link>
            <p className="mb-4 text-sm text-gray-500">
              The project management platform built for AI agents.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/ProjectPulse/ProjectPulse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 transition-colors hover:text-white"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/projectpulse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 transition-colors hover:text-white"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Community</h4>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#2A2A2A] pt-8 sm:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ProjectPulse. Open source under MIT License.
          </p>
          <p className="flex items-center gap-1 text-sm text-gray-500">
            Made with <Heart className="h-4 w-4 text-[#FF8B6A]" /> for the AI-assisted development
            community
          </p>
        </div>
      </div>
    </footer>
  );
}
