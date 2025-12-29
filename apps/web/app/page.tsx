import { Metadata } from 'next';
import {
  Hero,
  Metrics,
  HowItWorks,
  Features,
  Comparison,
  TechStack,
  CTASection,
  Footer,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'ProjectPulse - Agent-First Project Management',
  description:
    'The project management platform built for AI agents. 86+ MCP tools, automated onboarding, and intelligent knowledge management.',
  keywords: [
    'project management',
    'AI agents',
    'MCP',
    'Model Context Protocol',
    'Claude Code',
    'developer tools',
    'knowledge base',
    'issue tracking',
  ],
  authors: [{ name: 'ProjectPulse Team' }],
  openGraph: {
    title: 'ProjectPulse - Agent-First Project Management',
    description: '86+ MCP tools for AI-driven development',
    url: 'https://projectpulse.dev',
    siteName: 'ProjectPulse',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ProjectPulse - The Project Management Platform Built for AI Agents',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProjectPulse - Agent-First Project Management',
    description: '86+ MCP tools for AI-driven development',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#1A1A1A]">
      <Hero />
      <Metrics />
      <HowItWorks />
      <Features />
      <Comparison />
      <TechStack />
      <CTASection />
      <Footer />
    </main>
  );
}
