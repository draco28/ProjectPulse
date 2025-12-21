'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, X, Loader } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

interface EnhancedCodeBlockProps {
  language: string;
  code: string;
  className?: string;
}

type CopyState = 'idle' | 'copying' | 'success' | 'error';

export function EnhancedCodeBlock({ language, code, className }: EnhancedCodeBlockProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  // Auto-reset copy state after 2 seconds
  useEffect(() => {
    if (copyState === 'success' || copyState === 'error') {
      const timer = setTimeout(() => setCopyState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyState]);

  // Memoize copy handler to prevent unnecessary re-renders
  const handleCopy = useCallback(async () => {
    setCopyState('copying');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Modern Clipboard API (preferred)
        await navigator.clipboard.writeText(code);
        setCopyState('success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          setCopyState('success');
        } else {
          setCopyState('error');
        }
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      setCopyState('error');
    }
  }, [code]);

  // Button configuration for each state
  const buttonStates = {
    idle: { Icon: Copy, text: 'Copy', className: 'neu-raised hover:bg-darkCard' },
    copying: { Icon: Loader, text: 'Copying...', className: 'neu-pressed opacity-50' },
    success: { Icon: Check, text: 'Copied!', className: 'bg-green-500 text-white' },
    error: { Icon: X, text: 'Failed', className: 'bg-red-500 text-white' },
  };

  const { Icon, text, className: buttonClassName } = buttonStates[copyState];

  return (
    <div className="code-block relative mb-6 overflow-hidden rounded-2xl">
      {/* Header: Language + Copy Button */}
      <div className="bg-darkCard flex items-center justify-between border-b border-white/5 px-4 py-2">
        <span className="font-mono text-sm font-medium text-white">{language}</span>
        <button
          onClick={handleCopy}
          disabled={copyState === 'copying'}
          className={`smooth-transition flex items-center rounded px-3 py-1 text-xs ${buttonClassName} disabled:cursor-not-allowed`}
          aria-label={copyState === 'idle' ? 'Copy code to clipboard' : text}
          type="button"
        >
          <Icon
            className={`mr-2 inline-block h-3 w-3 ${copyState === 'copying' ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {text}
        </button>
      </div>

      {/* Code Block - Pass through to existing component */}
      <CodeBlock language={language} code={code} className={className} />
    </div>
  );
}
