// Type declarations for react-syntax-highlighter subpaths
// The main @types/react-syntax-highlighter doesn't cover these specific paths

declare module 'react-syntax-highlighter/dist/esm/light' {
  import * as React from 'react';

  export interface SyntaxHighlighterProps {
    children: string;
    language?: string;
    style?: { [key: string]: React.CSSProperties };
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
    lineProps?:
      | React.HTMLAttributes<HTMLElement>
      | ((lineNumber: number) => React.HTMLAttributes<HTMLElement>);
    PreTag?: keyof JSX.IntrinsicElements | React.ComponentType<unknown>;
    CodeTag?: keyof JSX.IntrinsicElements | React.ComponentType<unknown>;
  }

  export interface LightSyntaxHighlighter extends React.FC<SyntaxHighlighterProps> {
    registerLanguage(name: string, language: unknown): void;
  }

  const SyntaxHighlighter: LightSyntaxHighlighter;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/languages/hljs/*' {
  const language: unknown;
  export default language;
}
