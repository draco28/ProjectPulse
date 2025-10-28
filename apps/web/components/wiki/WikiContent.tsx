'use client';

import ReactMarkdown from 'react-markdown';

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
            // Code blocks (simple styling for now)
            code({ node, inline, className, children, ...props }) {
              return inline ? (
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-coral" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
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
