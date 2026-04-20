import { MMKV } from './mmkv-shim';

export const storage = new MMKV({
  id: 'walifit-train-cache',
});

export function getCachedJson<T>(key: string): T | null {
  const value = storage.getString(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setCachedJson<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}
