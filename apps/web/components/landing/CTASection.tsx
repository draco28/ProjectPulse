'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1F1F1F] to-[#1A1A1A] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF8B6A]/10 rounded-full blur-[120px]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF8B6A]/10 border border-[#FF8B6A]/20 mb-8">
          <Sparkles className="w-4 h-4 text-[#FF8B6A]" />
          <span className="text-sm text-[#FF8B6A] font-medium">Ready to transform your workflow?</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
          Start Building with
          <br />
          <span className="bg-gradient-to-r from-[#FF8B6A] to-[#E67759] bg-clip-text text-transparent">
            AI Agents Today
          </span>
        </h2>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
          Join developers who are already using ProjectPulse to manage their projects
          with Claude Code, Cursor, and other AI assistants.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF8B6A] to-[#E67759] text-white font-semibold text-lg shadow-lg shadow-[#FF8B6A]/25 hover:shadow-[#FF8B6A]/40 transition-all duration-300 hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/ProjectPulse/ProjectPulse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold text-lg hover:bg-[#3A3A3A] transition-all duration-300"
          >
            Read the Docs
          </a>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>MIT License</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Self-Hosted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>No Vendor Lock-in</span>
          </div>
        </div>
      </div>
    </section>
  );
}
