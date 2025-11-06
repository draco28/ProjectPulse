import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 * Returns system status and current timestamp
 *
 * @returns JSON response with status and ISO timestamp
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
