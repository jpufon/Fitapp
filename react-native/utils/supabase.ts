import * as SecureStore from 'expo-secure-store';
import { createClient, type User } from '@supabase/supabase-js';
import { MMKV } from '../lib/mmkv-shim';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const authStorage = new MMKV({
  id: 'walifit-auth',
});

// SecureStore native module can be missing/mismatched in Expo Go (e.g.
// `getValueWithKeyAsync is not a function` when the Go binary predates the JS
// lib). Wrap every call so the app falls back to MMKV instead of crashing.
let secureStoreWarned = false;
function warnSecureStore(err: unknown) {
  if (secureStoreWarned) return;
  secureStoreWarned = true;
  console.warn('expo-secure-store unavailable; using MMKV-only auth storage.', err);
}

async function safeSecureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    warnSecureStore(err);
    return null;
  }
}

async function safeSecureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    warnSecureStore(err);
  }
}

async function safeSecureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    warnSecureStore(err);
  }
}

const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const secureValue = await safeSecureGet(key);
    if (secureValue != null) {
      return secureValue;
    }

    return authStorage.getString(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    authStorage.set(key, value);
    await safeSecureSet(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    authStorage.delete(key);
    await safeSecureDelete(key);
  },
};

export async function getEncryptionKey(): Promise<string> {
  const storageKey = 'walifit.mmkv.encryption-key';
  const existing = await safeSecureGet(storageKey);

  if (existing) {
    return existing;
  }

  const generated = 'walifit-mmkv-key';
  await safeSecureSet(storageKey, generated);
  return generated;
}

export const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: secureStoreAdapter,
      },
    })
  : null;

export type AuthenticatedUser = User;
