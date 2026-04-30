// One-time bootstrap to subscribe the offline mutation queue to NetInfo.
// Mount in App.tsx (top-level) once.

import { useEffect } from 'react';
import { drain, subscribeNetInfo } from '../lib/syncQueue';

export function useSyncBootstrap() {
  useEffect(() => {
    const unsub = subscribeNetInfo();
    // Best-effort drain on cold start in case the app launched offline-then-online
    void drain();
    return unsub;
  }, []);
}
