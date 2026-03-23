'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#1F1F1F] to-[#1A1A1A] px-4 py-24 sm:px-6 lg:px-8">
      {/* Background effects */}
      <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-[#FF8B6A]/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF8B6A]/20 bg-[#FF8B6A]/10 px-4 py-2">
          <Sparkles className="h-4 w-4 text-[#FF8B6A]" />
          <span className="text-sm font-medium text-[#FF8B6A]">
            Ready to transform your workflow?
          </span>
        </div>

        <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          Start Building with
          <br />
          <span className="bg-gradient-to-r from-[#FF8B6A] to-[#E67759] bg-clip-text text-transparent">
            AI Agents Today
          </span>
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
          Join developers who are already using ProjectPulse to manage their projects with Claude
          Code, Cursor, and other AI assistants.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF8B6A] to-[#E67759] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[#FF8B6A]/25 transition-all duration-300 hover:scale-105 hover:shadow-[#FF8B6A]/40"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="https://github.com/ProjectPulse/ProjectPulse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A] bg-[#2A2A2A] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-[#3A3A3A]"
          >
            Read the Docs
          </a>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span>MIT License</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span>Self-Hosted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span>No Vendor Lock-in</span>
          </div>
        </div>
      </div>
    </section>
  );
}
