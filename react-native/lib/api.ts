// Authenticated HTTP layer for the backend.
//
// apiQuery: GET (and other read-only). Throws on failure — caller decides cache fallback.
// apiMutate: POST/PATCH/DELETE. Tries to send immediately; on network failure
// hands off to syncQueue for retry-on-reconnect.

import { getAccessToken, refreshAccessToken } from './auth';
import { enqueue } from './syncQueue';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const hasApiConfig = Boolean(rawApiUrl);

function getApiBaseUrl(): string {
  if (!rawApiUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_URL.');
  }
  return rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super(`Network error: ${(cause as Error)?.message ?? String(cause)}`);
    this.name = 'NetworkError';
  }
}

async function authedFetch(path: string, init: RequestInit, attempt = 0): Promise<Response> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });

  // One-shot retry on 401 — try a session refresh, then re-attempt with fresh token.
  if (res.status === 401 && attempt === 0) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return authedFetch(path, init, attempt + 1);
    }
  }

  return res;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiQuery<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await authedFetch(path, { ...init, method: init?.method ?? 'GET' });
  } catch (err) {
    throw new NetworkError(err);
  }

  const body = await parseBody(res);

  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`, res.status, body);
  }

  return body as T;
}

type MutateInput = {
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  body?: unknown;
};

type MutateResult<T> =
  | { kind: 'sent'; data: T }
  | { kind: 'queued'; queuedId: string };

export async function apiMutate<T>(input: MutateInput): Promise<MutateResult<T>> {
  try {
    const res = await authedFetch(input.path, {
      method: input.method,
      body: input.body ? JSON.stringify(input.body) : undefined,
    });
    const body = await parseBody(res);

    if (res.ok) {
      return { kind: 'sent', data: body as T };
    }

    // Permanent (4xx other than 401) — surface to caller, do NOT queue.
    if (res.status >= 400 && res.status < 500 && res.status !== 401) {
      throw new ApiError(`Request failed (${res.status})`, res.status, body);
    }

    // 5xx or 401 after refresh fail — queue for retry
    const queued = enqueue(input);
    return { kind: 'queued', queuedId: queued.id };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Network failure — queue
    const queued = enqueue(input);
    return { kind: 'queued', queuedId: queued.id };
  }
}

// Backward-compat — older code uses apiRequest(path). Treat as a query.
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return apiQuery<T>(path, init);
}
