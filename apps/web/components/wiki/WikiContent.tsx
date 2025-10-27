'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

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
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
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
