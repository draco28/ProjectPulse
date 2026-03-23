'use client';

import { ArrowRight, Github } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A] via-[#1A1A1A] to-[#2A2A2A]" />

      {/* Gradient orbs */}
      <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[#FF8B6A]/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#3A3A3A] bg-[#2A2A2A] px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-sm text-gray-400">v1.0.0-alpha now available</span>
        </div>

        {/* Main headline */}
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Project Management
          <br />
          <span className="bg-gradient-to-r from-[#FF8B6A] to-[#E67759] bg-clip-text text-transparent">
            Built for AI Agents
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
          The platform where{' '}
          <span className="font-semibold text-white">95% of interactions happen via MCP tools</span>
          , not clicking through UIs. Finally, your AI assistant can manage projects autonomously.
        </p>

        {/* CTA Buttons */}
        <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF8B6A] to-[#E67759] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[#FF8B6A]/25 transition-all duration-300 hover:scale-105 hover:shadow-[#FF8B6A]/40"
          >
            Get Started
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="https://github.com/ProjectPulse/ProjectPulse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A] bg-[#2A2A2A] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-[#3A3A3A]"
          >
            <Github className="h-5 w-5" />
            View on GitHub
          </a>
        </div>

        {/* Hero Image */}
        <div className="relative overflow-hidden rounded-xl border border-[#3A3A3A] shadow-2xl shadow-black/50">
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
          <Image
            src="/images/hero-dashboard.png"
            alt="ProjectPulse Dashboard"
            width={1200}
            height={675}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
    </section>
  );
}
