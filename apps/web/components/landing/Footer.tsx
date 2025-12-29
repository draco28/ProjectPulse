'use client';

import { Github, Twitter, Heart } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Changelog', href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/CHANGELOG.md' },
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
    { label: 'Contributing', href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/CONTRIBUTING.md' },
  ],
  legal: [
    { label: 'MIT License', href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/LICENSE' },
    { label: 'Security', href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/SECURITY.md' },
    { label: 'Code of Conduct', href: 'https://github.com/ProjectPulse/ProjectPulse/blob/master/CODE_OF_CONDUCT.md' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#1A1A1A] border-t border-[#2A2A2A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-[#FF8B6A]">ProjectPulse</span>
            </Link>
            <p className="text-gray-500 text-sm mb-4">
              The project management platform built for AI agents.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/ProjectPulse/ProjectPulse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/projectpulse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} ProjectPulse. Open source under MIT License.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-[#FF8B6A]" /> for the AI-assisted development community
          </p>
        </div>
      </div>
    </footer>
  );
}
