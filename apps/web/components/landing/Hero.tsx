'use client';

import { ArrowRight, Github } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A] via-[#1A1A1A] to-[#2A2A2A]" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FF8B6A]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2A2A2A] border border-[#3A3A3A] mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-400">v1.0.0-alpha now available</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
          Project Management
          <br />
          <span className="bg-gradient-to-r from-[#FF8B6A] to-[#E67759] bg-clip-text text-transparent">
            Built for AI Agents
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          The platform where <span className="text-white font-semibold">95% of interactions happen via MCP tools</span>,
          not clicking through UIs. Finally, your AI assistant can manage projects autonomously.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF8B6A] to-[#E67759] text-white font-semibold text-lg shadow-lg shadow-[#FF8B6A]/25 hover:shadow-[#FF8B6A]/40 transition-all duration-300 hover:scale-105"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/ProjectPulse/ProjectPulse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold text-lg hover:bg-[#3A3A3A] transition-all duration-300"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>

        {/* Hero Image */}
        <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-[#3A3A3A]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent z-10 pointer-events-none" />
          <Image
            src="/images/hero-dashboard.png"
            alt="ProjectPulse Dashboard"
            width={1200}
            height={675}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
}
