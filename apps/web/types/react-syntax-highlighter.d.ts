// Type declarations for react-syntax-highlighter subpaths
// The main @types/react-syntax-highlighter doesn't cover these specific paths

declare module 'react-syntax-highlighter/dist/esm/light' {
  import { ComponentType } from 'react';

  interface SyntaxHighlighterProps {
    children: string;
    language?: string;
    style?: Record<string, React.CSSProperties>;
    customStyle?: React.CSSProperties;
    codeTagProps?: React.HTMLAttributes<HTMLElement>;
    useInlineStyles?: boolean;
    showLineNumbers?: boolean;
    showInlineLineNumbers?: boolean;
    startingLineNumber?: number;
    lineNumberContainerStyle?: React.CSSProperties;
    lineNumberStyle?: React.CSSProperties | ((lineNumber: number) => React.CSSProperties);
    wrapLines?: boolean;
    wrapLongLines?: boolean;
    lineProps?: React.HTMLAttributes<HTMLElement> | ((lineNumber: number) => React.HTMLAttributes<HTMLElement>);
    renderer?: (props: {
      rows: Array<{ tagName: string; properties: Record<string, unknown>; children: unknown[] }>;
      stylesheet: Record<string, React.CSSProperties>;
      useInlineStyles: boolean;
    }) => React.ReactNode;
    PreTag?: keyof JSX.IntrinsicElements | ComponentType<unknown>;
    CodeTag?: keyof JSX.IntrinsicElements | ComponentType<unknown>;
    [key: string]: unknown;
  }

  interface SyntaxHighlighterComponent extends ComponentType<SyntaxHighlighterProps> {
    registerLanguage: (name: string, language: unknown) => void;
  }

  const SyntaxHighlighter: SyntaxHighlighterComponent;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/languages/hljs/*' {
  const language: unknown;
  export default language;
}
