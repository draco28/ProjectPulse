/**
 * Internal Service Authentication (HMAC-based)
 *
 * Sprint 17 / Phase 1: Critical Security Hardening (Ticket #129)
 *
 * Provides secure authentication for internal service-to-service communication
 * (MCP server → Web API) using HMAC-SHA256 signatures.
 *
 * Security features:
 * - HMAC-SHA256 signature verification (cryptographically secure)
 * - Timestamp-based replay protection (5-minute window)
 * - Timing-safe comparison to prevent timing attacks
 *
 * Usage:
 * - MCP Server: signInternalRequest(body) → add headers to fetch
 * - Web API: verifyInternalRequest(request) → verify before processing
 */

import crypto from 'crypto';

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the internal secret from environment
 * Throws if not configured (fail closed)
 */
function getInternalSecret(): string {
  const secret = process.env.MCP_INTERNAL_SECRET;
  if (!secret) {
    throw new Error(
      'MCP_INTERNAL_SECRET environment variable is not set. ' +
        'This is required for secure internal service communication.'
    );
  }
  return secret;
}

/**
 * Sign an internal request body for service-to-service communication
 *
 * @param body - The request body to sign
 * @returns Headers to add to the request (timestamp and signature)
 *
 * @example
 * const { timestamp, signature } = signInternalRequest(body);
 * fetch(url, {
 *   headers: {
 *     'x-internal-timestamp': timestamp,
 *     'x-internal-signature': signature,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify(body),
 * });
 */
export function signInternalRequest(body: unknown): {
  timestamp: string;
  signature: string;
} {
  const secret = getInternalSecret();
  const timestamp = Date.now().toString();
  const bodyString = JSON.stringify(body);
  const payload = `${timestamp}.${bodyString}`;

  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return { timestamp, signature };
}

/**
 * Verify an internal request's HMAC signature
 *
 * Checks:
 * 1. Required headers present (x-internal-timestamp, x-internal-signature)
 * 2. Timestamp within replay window (5 minutes)
 * 3. HMAC signature matches (timing-safe comparison)
 *
 * @param request - The incoming request to verify
 * @returns Promise<boolean> - true if valid, false otherwise
 *
 * @example
 * if (!(await verifyInternalRequest(request))) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export async function verifyInternalRequest(request: Request): Promise<boolean> {
  try {
    const secret = getInternalSecret();

    // Get headers
    const timestamp = request.headers.get('x-internal-timestamp');
    const signature = request.headers.get('x-internal-signature');

    if (!timestamp || !signature) {
      return false;
    }

    // Check timestamp is within replay window
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime)) {
      return false;
    }

    const age = Math.abs(Date.now() - requestTime);
    if (age > REPLAY_WINDOW_MS) {
      console.warn('[internal-auth] Request timestamp expired', {
        age: Math.round(age / 1000),
        maxAge: REPLAY_WINDOW_MS / 1000,
      });
      return false;
    }

    // Get body and compute expected signature
    const bodyText = await request.clone().text();
    const payload = `${timestamp}.${bodyText}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    // Timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('[internal-auth] Verification error:', error);
    return false;
  }
}

/**
 * Create headers object for signed internal requests
 * Convenience function for fetch calls
 *
 * @param body - The request body to sign
 * @returns Headers object ready to spread into fetch options
 *
 * @example
 * fetch(url, {
 *   method: 'POST',
 *   headers: {
 *     ...createSignedHeaders(body),
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify(body),
 * });
 */
export function createSignedHeaders(body: unknown): Record<string, string> {
  const { timestamp, signature } = signInternalRequest(body);
  return {
    'x-internal-timestamp': timestamp,
    'x-internal-signature': signature,
  };
}
