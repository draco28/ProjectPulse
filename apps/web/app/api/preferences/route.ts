import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const PreferencesSchema = z.object({
  theme: z.enum(['desert', 'neon', 'earthy', 'coral']),
});

/**
 * PATCH /api/preferences
 * Update user preferences (theme)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme } = PreferencesSchema.parse(body);

    // TODO: Get userId from session when auth is implemented
    // For now, use a default user ID (will be 1 for the first user)
    const userId = 1;

    // Upsert: update if exists, create if not
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: { theme },
      create: { userId, theme },
    });

    return NextResponse.json({ data: preferences, error: null });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: 'Invalid theme value', details: error.errors },
        { status: 400 }
      );
    }

    // Database error or other errors
    console.error('Preferences API error:', error);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/preferences
 * Get user preferences
 */
export async function GET(_request: NextRequest) {
  try {
    // TODO: Get userId from session when auth is implemented
    const userId = 1;

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Return preferences or default
    return NextResponse.json({
      data: preferences || { theme: 'desert' },
      error: null,
    });
  } catch (error) {
    console.error('Preferences API error:', error);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
