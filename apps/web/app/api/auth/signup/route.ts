/**
 * Signup API Route
 * Sprint 8.9: User registration with validation and rate limiting
 * Sprint 17: Migrated to withRateLimit HOC (Ticket #130)
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit/withRateLimit';

const signupSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
});

/**
 * Signup handler
 * Rate limited by withRateLimit HOC: 5 requests per 15 minutes (auth tier)
 */
async function signupHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already exists',
          message: 'An account with this email already exists',
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create account',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/signup
 * Creates a new user account
 *
 * Rate Limited: 5 requests per 15 minutes per IP (auth tier)
 * Response Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 */
export const POST = withRateLimit(signupHandler, { tier: 'auth' });
