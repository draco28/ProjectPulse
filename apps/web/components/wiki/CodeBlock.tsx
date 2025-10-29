'use client';

import { useEffect, useState } from 'react';
// Import directly from light build to avoid bundling all variants
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/light';

interface CodeBlockProps {
  language: string;
  code: string;
  className?: string;
}

export function CodeBlock({ language, code, className }: CodeBlockProps) {
  const [mounted, setMounted] = useState(false);
  const [languagesRegistered, setLanguagesRegistered] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Dynamically import and register only the languages we need
    async function registerLanguages() {
      try {
        const [typescript, javascript, tsx, jsx, json, bash, markdown, css, python] =
          await Promise.all([
            import('react-syntax-highlighter/dist/esm/languages/hljs/typescript'),
            import('react-syntax-highlighter/dist/esm/languages/hljs/javascript'),
            import('react-syntax-highlighter/dist/esm/languages/hljs/typescript'), // Use TS for TSX
            import('react-syntax-highlighter/dist/esm/languages/hljs/javascript'), // Use JS for JSX
            import('react-syntax-highlighter/dist/esm/languages/hljs/json'),
            import('react-syntax-highlighter/dist/esm/languages/hljs/bash'),
            import('react-syntax-highlighter/dist/esm/languages/hljs/markdown'),
            import('react-syntax-highlighter/dist/esm/languages/hljs/css'),
            import('react-syntax-highlighter/dist/esm/languages/hljs/python'),
          ]);

        // Register languages
        SyntaxHighlighter.registerLanguage('typescript', typescript.default);
        SyntaxHighlighter.registerLanguage('javascript', javascript.default);
        SyntaxHighlighter.registerLanguage('tsx', tsx.default);
        SyntaxHighlighter.registerLanguage('jsx', jsx.default);
        SyntaxHighlighter.registerLanguage('json', json.default);
        SyntaxHighlighter.registerLanguage('bash', bash.default);
        SyntaxHighlighter.registerLanguage('sh', bash.default); // Alias
        SyntaxHighlighter.registerLanguage('markdown', markdown.default);
        SyntaxHighlighter.registerLanguage('md', markdown.default); // Alias
        SyntaxHighlighter.registerLanguage('css', css.default);
        SyntaxHighlighter.registerLanguage('python', python.default);
        SyntaxHighlighter.registerLanguage('py', python.default); // Alias

        setLanguagesRegistered(true);
      } catch (error) {
        console.error('Failed to register syntax highlighter languages:', error);
      }
    }

    registerLanguages();
  }, []);

  // Show loading state or plain code while languages load
  if (!mounted || !languagesRegistered) {
    return (
      <pre className={className}>
        <code>{code}</code>
      </pre>
    );
  }

  // Map common language names to registered ones
  const normalizedLang = language.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    sh: 'bash',
    md: 'markdown',
    py: 'python',
  };
  const resolvedLang = langMap[normalizedLang] || normalizedLang;

  return (
    <SyntaxHighlighter
      language={resolvedLang}
      customStyle={{
        margin: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '1rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
