/**
 * HTTP Client for MCP Server → Next.js API Communication
 * Sprint 10: Security Architecture - Forwards agent auth to APIs
 *
 * Key security features:
 * - Injects Authorization header from authContext
 * - APIs can re-validate token for defense-in-depth
 * - Project isolation enforced at API layer
 */

import type { AppConfig } from './config.js';
import type { Logger } from './logger.js';
import { getAgentAuth } from './authContext.js';

export interface HttpClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T, B = unknown>(path: string, body?: B, init?: RequestInit): Promise<T>;
  put<T, B = unknown>(path: string, body?: B, init?: RequestInit): Promise<T>;
  patch<T, B = unknown>(path: string, body?: B, init?: RequestInit): Promise<T>;
  delete<T>(path: string, init?: RequestInit): Promise<T>;
}

const ensureAbsoluteUrl = (baseUrl: string, path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `API request failed with status ${response.status} ${response.statusText}: ${text}`
    );
  }

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse API response JSON: ${(error as Error).message}`);
  }
}

export const createHttpClient = (config: AppConfig, logger: Logger): HttpClient => {
  const request = async <T>(path: string, init?: RequestInit) => {
    const url = ensureAbsoluteUrl(config.apiBaseUrl, path);
    
    // Build headers with auth context injection
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Inject auth from AsyncLocalStorage context
    const auth = getAgentAuth();
    if (auth?.rawToken) {
      headers['Authorization'] = `Bearer ${auth.rawToken}`;
      // Include project ID header for logging/debugging (API validates from token)
      headers['X-Agent-Project-Id'] = String(auth.projectId);
    }
    
    // Merge with any custom headers from caller
    const finalHeaders = {
      ...headers,
      ...(init?.headers as Record<string, string> | undefined),
    };
    
    logger.debug('HTTP request', { 
      url, 
      method: init?.method ?? 'GET',
      hasAuth: !!auth?.rawToken,
      projectId: auth?.projectId,
    });

    const response = await fetch(url, {
      ...init,
      headers: finalHeaders,
    });

    return handleResponse<T>(response);
  };

  return {
    get: <T>(path: string, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'GET',
      }),
    post: <T, B = unknown>(path: string, body?: B, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    put: <T, B = unknown>(path: string, body?: B, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'PUT',
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    patch: <T, B = unknown>(path: string, body?: B, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'PATCH',
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    delete: <T>(path: string, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'DELETE',
      }),
  };
};
