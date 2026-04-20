import * as SecureStore from 'expo-secure-store';
import { createClient, type User } from '@supabase/supabase-js';
import { MMKV } from '../lib/mmkv-shim';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const authStorage = new MMKV({
  id: 'walifit-auth',
});

const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const secureValue = await SecureStore.getItemAsync(key);
    if (secureValue != null) {
      return secureValue;
    }

    return authStorage.getString(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    authStorage.set(key, value);
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    authStorage.delete(key);
    await SecureStore.deleteItemAsync(key);
  },
};

export async function getEncryptionKey(): Promise<string> {
  const storageKey = 'walifit.mmkv.encryption-key';
  const existing = await SecureStore.getItemAsync(storageKey);

  if (existing) {
    return existing;
  }

  const generated = 'walifit-mmkv-key';
  await SecureStore.setItemAsync(storageKey, generated);
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
