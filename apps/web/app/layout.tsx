import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme-provider';
import { SessionProvider } from '@/components/SessionProvider';
// import { CommandPaletteProvider } from '@/components/command-palette';
import { CommandPaletteProvider } from '@/components/command-palette/CommandPaletteProvider';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: "ProjectPulse - Your Project's Heartbeat",
  description:
    'AI-powered development hub with issue tracking, knowledge base, wiki, and agent personas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* React Grab - Point and click UI elements for AI editing (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <script src="https://unpkg.com/react-grab@latest/dist/react-grab.js" defer />
        )}
      </head>
      <body>
        <SessionProvider>
          <ThemeProvider>
            {/* CommandPaletteProvider temporarily disabled - causing webpack errors */}
            <CommandPaletteProvider>{children}</CommandPaletteProvider>
            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                className: 'bg-slate-800 border-slate-700',
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
