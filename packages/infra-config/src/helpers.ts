/**
 * URL manipulation helpers for infrastructure configuration
 */

/**
 * Remove trailing slash from a URL
 */
export function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Join URL segments, handling slashes correctly
 *
 * @example
 * joinUrl('http://localhost:3000', 'api', 'health')
 * // => 'http://localhost:3000/api/health'
 *
 * @example
 * joinUrl('http://localhost:3000/', '/api/', '/health/')
 * // => 'http://localhost:3000/api/health'
 */
export function joinUrl(base: string, ...paths: string[]): string {
  const baseUrl = stripTrailingSlash(base);
  const joinedPath = paths.map(p => p.replace(/^\/|\/$/g, '')).join('/');
  return joinedPath ? `${baseUrl}/${joinedPath}` : baseUrl;
}

/**
 * Extract port from URL, falling back to default based on protocol
 */
export function getPortFromUrl(url: string): number {
  try {
    const parsed = new URL(url);
    if (parsed.port) {
      return parseInt(parsed.port, 10);
    }
    return parsed.protocol === 'https:' ? 443 : 80;
  } catch {
    return 80;
  }
}
