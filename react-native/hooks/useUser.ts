import { useEffect, useState } from 'react';
import type { AuthenticatedUser } from '../utils/supabase';
import { hasSupabaseConfig, supabase } from '../utils/supabase';
import { getCachedJson, setCachedJson } from '../lib/storage';

const guestUser = {
  id: 'guest-user',
  app_metadata: {},
  user_metadata: {
    displayName: 'Athlete',
  },
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
  email: 'athlete@local.dev',
} as AuthenticatedUser;

const USER_CACHE_KEY = 'profile.user';

// Synthesize a user from EXPO_PUBLIC_DEV_JWT so that screens which gate on
// `useUser().user` render the backend data the dev JWT authorises. Returns null
// in production builds (DEV_JWT unset) or if the token is malformed.
function devJwtUser(): AuthenticatedUser | null {
  const token = process.env.EXPO_PUBLIC_DEV_JWT;
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadJson = globalThis.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as {
      sub?: string;
      email?: string;
      exp?: number;
    };
    if (!payload.sub) return null;

    return {
      id: payload.sub,
      app_metadata: {},
      user_metadata: { displayName: payload.email?.split('@')[0] ?? 'Dev User' },
      aud: 'authenticated',
      created_at: new Date(0).toISOString(),
      email: payload.email ?? `${payload.sub}@dev.local`,
    } as AuthenticatedUser;
  } catch {
    return null;
  }
}

type UseUserState = {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: Error | null;
  isOfflineFallback: boolean;
};

export function useUser(): UseUserState {
  const [state, setState] = useState<UseUserState>(() => ({
    user: getCachedJson<AuthenticatedUser>(USER_CACHE_KEY),
    isLoading: true,
    error: null,
    isOfflineFallback: false,
  }));

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setState({
        user: guestUser,
        isLoading: false,
        error: null,
        isOfflineFallback: false,
      });
      return;
    }

    const client = supabase;
    let active = true;

    const loadUser = async () => {
      try {
        const { data, error } = await client.auth.getUser();
        if (!active) {
          return;
        }

        const resolved = data.user ?? devJwtUser();
        setState({
          user: resolved,
          isLoading: false,
          error: data.user ? error ?? null : null,
          isOfflineFallback: false,
        });
        if (resolved) {
          setCachedJson(USER_CACHE_KEY, resolved);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        const fallback = devJwtUser() ?? getCachedJson<AuthenticatedUser>(USER_CACHE_KEY);
        setState({
          user: fallback,
          isLoading: false,
          error: fallback ? null : error instanceof Error ? error : new Error('Failed to load user.'),
          isOfflineFallback: Boolean(fallback),
        });
      }
    };

    void loadUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      const resolved = session?.user ?? devJwtUser();
      setState((current) => ({
        ...current,
        user: resolved,
        isLoading: false,
        error: null,
        isOfflineFallback: false,
      }));
      if (resolved) {
        setCachedJson(USER_CACHE_KEY, resolved);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
