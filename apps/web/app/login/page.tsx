'use client';

/**
 * Login & Signup Page
 * Sprint 8.9: Public authentication page with neumorphic design
 * 
 * Features:
 * - Toggle between login and signup forms
 * - Email/password authentication
 * - Rate limiting (5 attempts / 15min)
 * - Error handling and validation
 * - Redirects to /app on success
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Signup flow
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            setError('Too many attempts. Please try again later.');
          } else if (response.status === 409) {
            setError('An account with this email already exists.');
          } else if (data.issues) {
            setError(data.issues[0]?.message || 'Validation failed');
          } else {
            setError(data.message || 'Failed to create account');
          }
          setLoading(false);
          return;
        }

        // Auto-login after successful signup
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError('Account created but login failed. Please try logging in manually.');
          setMode('login');
        } else {
          router.push('/app');
        }
      } else {
        // Login flow
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Invalid email or password');
        } else {
          router.push('/app');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setName('');
  };

  return (
    <>
      {/* Floating Background */}
      <FloatingBackground />

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Sign in to access your projects'
                : 'Sign up to get started with ProjectPulse'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            {/* Toggle mode */}
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </span>
              {' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-primary hover:underline"
                disabled={loading}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            {/* Demo credentials hint */}
            {mode === 'login' && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <strong>Demo:</strong> dev@projectpulse.local / dev123456
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
