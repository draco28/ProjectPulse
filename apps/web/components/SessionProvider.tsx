'use client';

/**
 * NextAuth Session Provider Wrapper
 * Sprint 8.9: Client component for auth context
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
