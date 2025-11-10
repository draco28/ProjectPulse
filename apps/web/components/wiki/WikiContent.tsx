'use client';

import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';

// Lazy load EnhancedCodeBlock (~300KB with syntax highlighter)
// Only loads when markdown contains code blocks
const EnhancedCodeBlock = dynamic(() => import('./EnhancedCodeBlock').then((mod) => ({ default: mod.EnhancedCodeBlock })), {
  loading: () => (
    <div className="neu-pressed animate-pulse rounded-2xl p-4">
      <div className="h-4 w-3/4 rounded bg-slate/20"></div>
      <div className="mt-2 h-4 w-1/2 rounded bg-slate/20"></div>
    </div>
  ),
  ssr: false, // Code highlighting only needed client-side
});

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface WikiContentProps {
  content: string;
  tocItems: TOCItem[];
}

export function WikiContent({ content, tocItems }: WikiContentProps) {
  return (
    <div className="neu-raised smooth-transition rounded-3xl p-8">
      <article className="prose prose-invert max-w-none">
        <ReactMarkdown
          components={{
            // Add IDs to headings for TOC scroll spy
            h1: ({ children, ...props }) => {
              const text = String(children);
              const tocItem = tocItems.find((item) => item.text === text);
              return (
                <h1 id={tocItem?.id} {...props}>
                  {children}
                </h1>
              );
            },
            h2: ({ children, ...props }) => {
              const text = String(children);
              const tocItem = tocItems.find((item) => item.text === text);
              return (
                <h2 id={tocItem?.id} {...props}>
                  {children}
                </h2>
              );
            },
            h3: ({ children, ...props }) => {
              const text = String(children);
              const tocItem = tocItems.find((item) => item.text === text);
              return (
                <h3 id={tocItem?.id} {...props}>
                  {children}
                </h3>
              );
            },
            // Code blocks with syntax highlighting
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');

              // Inline code (no language class)
              if (!match || !match[1]) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              // Code block with syntax highlighting
              const language = match[1];
              const code = String(children).replace(/\n$/, '');

              return <EnhancedCodeBlock language={language} code={code} />;
            },
            // Links
            a: ({ href, children, ...props }) => (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-coral hover:underline"
                {...props}
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
