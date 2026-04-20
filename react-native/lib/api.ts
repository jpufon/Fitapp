const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const hasApiConfig = Boolean(rawApiUrl);

function getApiBaseUrl(): string {
  if (!rawApiUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_URL for workout API requests.');
  }

  return rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
