// Resolves the access token used for backend Bearer auth.
// Priority: real Supabase session → EXPO_PUBLIC_DEV_JWT (dev-only fallback).
// EXPO_PUBLIC_DEV_JWT lets us exercise the API without a real signed-in user
// while AuthScreen wiring lands in feature work.

import { supabase } from '../utils/supabase';

const DEV_JWT = process.env.EXPO_PUBLIC_DEV_JWT;

export async function getAccessToken(): Promise<string | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  }

  if (DEV_JWT) return DEV_JWT;

  return null;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session?.access_token) return null;
  return data.session.access_token;
}
