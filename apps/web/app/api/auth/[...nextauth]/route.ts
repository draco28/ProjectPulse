/**
 * NextAuth API Route Handler
 * Sprint 8.9: Handles all auth requests (signin, signout, session, etc.)
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
