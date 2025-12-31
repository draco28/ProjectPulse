/**
 * Content Security Policy (CSP) Configuration
 *
 * Production Hardening Spec Section 1.2
 * @see docs/PRODUCTION-HARDENING-SPEC.md
 *
 * CSP directives configured for Next.js 14 + Tailwind CSS compatibility.
 * Note: next.config.js is CommonJS, so this module serves as:
 * 1. Documentation of CSP directives
 * 2. Reference for API routes or middleware that need CSP awareness
 * 3. Future use when Next.js fully supports ESM config
 */

/**
 * CSP Directives for Next.js 14 + Tailwind compatibility
 *
 * Why these specific values:
 * - 'unsafe-inline' for script-src: Next.js injects inline scripts for SSR hydration
 * - 'unsafe-eval' for script-src: Required for development (source maps) and some dynamic imports
 * - 'unsafe-inline' for style-src: Tailwind CSS uses inline styles
 * - data: for img-src: Next.js image optimization uses data URIs
 * - https: for img-src: Allow external images over HTTPS
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
} as const;

export type CSPDirective = keyof typeof CSP_DIRECTIVES;

/**
 * Build CSP header string based on environment
 *
 * @param isDev - Whether running in development mode
 * @returns CSP header value string
 *
 * @example
 * // Production
 * buildCSPHeader(false)
 * // => "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."
 *
 * @example
 * // Development (includes WebSocket for HMR)
 * buildCSPHeader(true)
 * // => "... connect-src 'self' ws: wss:; ..."
 */
export function buildCSPHeader(isDev: boolean): string {
  // Deep clone to avoid mutating the constant
  const directives: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(CSP_DIRECTIVES)) {
    directives[key] = [...value];
  }

  // Relax for development (HMR WebSocket connections)
  if (isDev) {
    const connectSrc = directives['connect-src'];
    if (connectSrc) {
      connectSrc.push('ws:', 'wss:');
    }
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Pre-built CSP header values for use in next.config.js
 * These are the actual strings used in the headers() function
 */
export const CSP_HEADER_PRODUCTION = buildCSPHeader(false);
export const CSP_HEADER_DEVELOPMENT = buildCSPHeader(true);

/**
 * Additional security headers (non-CSP)
 */
export const SECURITY_HEADERS = {
  /**
   * X-XSS-Protection: Legacy XSS filter for older browsers
   * Modern browsers use CSP, but this helps with IE/Edge Legacy
   */
  'X-XSS-Protection': '1; mode=block',

  /**
   * Permissions-Policy: Disable device APIs we don't use
   * Prevents malicious scripts from accessing camera/mic/location
   */
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  /**
   * Strict-Transport-Security (HSTS): Force HTTPS
   * max-age: 1 year (31536000 seconds)
   * includeSubDomains: Apply to all subdomains
   *
   * WARNING: Only enable in production with valid HTTPS!
   * Once set, browsers will refuse HTTP for the duration.
   */
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;
