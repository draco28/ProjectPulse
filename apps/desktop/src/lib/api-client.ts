import { invoke } from '@tauri-apps/api/core';

interface ApiResponse {
  status: number;
  body: string;
}

interface ApiEnvelope<T> {
  data: T;
}

class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await invoke<ApiResponse>('api_fetch', {
    path,
    method,
    body: body ? JSON.stringify(body) : null,
  });

  if (response.status >= 400) {
    let code = 'UNKNOWN';
    let message = response.body;
    try {
      const parsed = JSON.parse(response.body);
      if (parsed.error) {
        code = parsed.error.code || code;
        message = parsed.error.message || message;
      }
    } catch {
      // body wasn't JSON, use raw string
    }
    throw new ApiError(response.status, code, message);
  }

  const parsed = JSON.parse(response.body);
  // Axum wraps responses in { data: T }
  return (parsed as ApiEnvelope<T>).data ?? parsed;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, 'GET');
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, 'POST', body);
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, 'PATCH', body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, 'PUT', body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, 'DELETE');
}

export { ApiError };
