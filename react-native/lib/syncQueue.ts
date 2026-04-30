// Offline mutation queue — MMKV-backed FIFO of pending mutations.
// Spec: V1 features doc §F11 — "Every mutation queues locally if offline.
// Sync on reconnect via queueOrSend(). Last-write-wins for V1."
//
// Lifecycle:
//   enqueue(req)        → append + try drain
//   drain()             → walk FIFO, send each; remove on 2xx, retry on 5xx/network
//   subscribeNetInfo()  → drain when connection comes back
//
// Note: in Expo Go the MMKV shim is in-memory, so queue is session-scoped.
// In a dev client / production build, react-native-mmkv persists across launches.

import NetInfo from '@react-native-community/netinfo';
import { MMKV } from './mmkv-shim';
import { getAccessToken } from './auth';

const QUEUE_KEY = 'sync.queue';
const queueStorage = new MMKV({ id: 'walifit-sync-queue' });

export type QueuedMutation = {
  id: string;
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  body?: unknown;
  attempts: number;
  createdAt: number;
};

let draining = false;
let netInfoSubscribed = false;

function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error('EXPO_PUBLIC_API_URL is not configured.');
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function readQueue(): QueuedMutation[] {
  const raw = queueStorage.getString(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedMutation[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedMutation[]): void {
  queueStorage.set(QUEUE_KEY, JSON.stringify(items));
}

export function pendingCount(): number {
  return readQueue().length;
}

export function enqueue(req: Omit<QueuedMutation, 'id' | 'attempts' | 'createdAt'>): QueuedMutation {
  const item: QueuedMutation = {
    ...req,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    attempts: 0,
    createdAt: Date.now(),
  };
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);

  // Best-effort drain — fire and forget
  void drain();
  return item;
}

async function sendOne(item: QueuedMutation): Promise<{ ok: boolean; status?: number; permanent?: boolean }> {
  let token: string | null;
  try {
    token = await getAccessToken();
  } catch {
    return { ok: false };
  }

  if (!token) return { ok: false };

  try {
    const res = await fetch(`${getApiBaseUrl()}${item.path}`, {
      method: item.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: item.body ? JSON.stringify(item.body) : undefined,
    });

    if (res.ok) return { ok: true, status: res.status };

    // 4xx other than 401 are permanent — body is invalid, retrying won't help.
    if (res.status >= 400 && res.status < 500 && res.status !== 401) {
      return { ok: false, status: res.status, permanent: true };
    }
    return { ok: false, status: res.status };
  } catch {
    // Network failure — retryable
    return { ok: false };
  }
}

export async function drain(): Promise<{ sent: number; remaining: number }> {
  if (draining) return { sent: 0, remaining: pendingCount() };
  draining = true;

  let sent = 0;
  try {
    while (true) {
      const queue = readQueue();
      if (queue.length === 0) break;

      const head = queue[0];
      const result = await sendOne(head);

      if (result.ok) {
        // Remove head, continue
        writeQueue(queue.slice(1));
        sent += 1;
        continue;
      }

      if (result.permanent) {
        // Drop bad mutation — log and continue. Last-write-wins per spec.
        console.warn(`[syncQueue] dropping permanent ${result.status} mutation`, head.path);
        writeQueue(queue.slice(1));
        continue;
      }

      // Retryable failure — bump attempts, leave at head, stop draining
      head.attempts += 1;
      writeQueue([head, ...queue.slice(1)]);
      break;
    }
  } finally {
    draining = false;
  }

  return { sent, remaining: pendingCount() };
}

export function subscribeNetInfo(): () => void {
  if (netInfoSubscribed) return () => {};
  netInfoSubscribed = true;

  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void drain();
    }
  });

  return () => {
    netInfoSubscribed = false;
    unsubscribe();
  };
}

// Test/dev helper — clears the queue. Don't call in production paths.
export function _clearQueue(): void {
  writeQueue([]);
}
