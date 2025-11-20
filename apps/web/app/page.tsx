/**
 * Root Page - Redirect to appropriate destination
 * Sprint 8.9: Redirect to /app if authenticated, /login if not
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/app');
  } else {
    redirect('/login');
  }
}
