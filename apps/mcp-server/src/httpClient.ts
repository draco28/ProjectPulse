import type { AppConfig } from './config.js';
import type { Logger } from './logger.js';

export interface HttpClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T, B = unknown>(path: string, body?: B, init?: RequestInit): Promise<T>;
  put<T, B = unknown>(path: string, body?: B, init?: RequestInit): Promise<T>;
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
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const request = async <T>(path: string, init?: RequestInit) => {
    const url = ensureAbsoluteUrl(config.apiBaseUrl, path);
    logger.debug('HTTP request', { url, method: init?.method ?? 'GET' });

    const response = await fetch(url, {
      ...init,
      headers: {
        ...defaultHeaders,
        ...init?.headers,
      },
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
  };
};
