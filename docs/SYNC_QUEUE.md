# waliFit — Offline Sync Queue

How the mobile app guarantees that **every mutation eventually reaches the backend**, even when the user is offline, on a flaky network, or the server is briefly unhappy.

> The hard rule in CLAUDE.md says "every mutation goes through the offline sync queue — no direct writes that bypass it." This doc is the contract.

## Where the code lives

| File | Role |
|---|---|
| `react-native/lib/syncQueue.ts` | Queue itself: MMKV-backed FIFO, drain loop, NetInfo subscription |
| `react-native/lib/api.ts` | `apiMutate` — entry point. Tries network first, hands off to the queue on failure. |
| `react-native/hooks/useSyncBootstrap.ts` | Mounted once in `App.tsx`. Subscribes the queue to NetInfo and best-effort drains on cold start. |
| `react-native/hooks/useMutations.ts` | All mutation hooks (`useStartWorkout`, `useLogSet`, `useFinishWorkout`, `useLogNutrition`, `useRecomputeVitality`) call `apiMutate`. |

## API surface

```ts
// lib/syncQueue.ts

export type QueuedMutation = {
  id: string;
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  body?: unknown;
  attempts: number;
  createdAt: number;
};

export function enqueue(req: Omit<QueuedMutation, 'id' | 'attempts' | 'createdAt'>): QueuedMutation;
export async function drain(): Promise<{ sent: number; remaining: number }>;
export function subscribeNetInfo(): () => void;     // call once — returns unsubscribe
export function pendingCount(): number;
export function _clearQueue(): void;                 // dev/test only
```

`apiMutate` is the only caller you should need:

```ts
// lib/api.ts
type MutateInput = { method: 'POST' | 'PATCH' | 'DELETE' | 'PUT'; path: string; body?: unknown };
type MutateResult<T> =
  | { kind: 'sent';   data: T }
  | { kind: 'queued'; queuedId: string };

export async function apiMutate<T>(input: MutateInput): Promise<MutateResult<T>>;
```

## Lifecycle

1. **Mutation hook calls `apiMutate`.** It tries `fetch` immediately with a fresh access token.
2. **2xx** → returns `{ kind: 'sent', data }`. Done.
3. **4xx (other than 401)** → throws `ApiError`. The body is invalid; retrying won't help. The hook surfaces the error to the UI; nothing is queued.
4. **401** → `apiMutate` does one refresh-and-retry. If that still fails, the request is queued.
5. **5xx or network failure** → request is appended to the queue and `apiMutate` returns `{ kind: 'queued', queuedId }`. The caller can show "Saved — will sync when online" UX.
6. **`enqueue` fires `drain()` opportunistically.** `drain` walks the FIFO head-first; on a 2xx the head is removed and it continues. On a retryable failure it bumps `attempts`, leaves the head in place, and stops — preserving order.
7. **NetInfo subscription** drains again whenever the device comes back online (`isConnected && isInternetReachable !== false`). The subscription is mounted in `App.tsx` via `useSyncBootstrap`.

## Storage

The queue lives in a dedicated MMKV bucket: `new MMKV({ id: 'walifit-sync-queue' })`, key `sync.queue`, JSON-encoded array of `QueuedMutation`.

> **Caveat:** in Expo Go, `react-native-mmkv` is shimmed in-memory — the queue is session-scoped. In a dev client or production build (where the native MMKV module is available) it persists across launches. Treat Expo Go as not-actually-offline-safe for development testing of the queue.

The MMKV bucket used for the queue is **not** the same as the encrypted user-data MMKV in `utils/supabase.ts`. The queue does not contain credentials, only the request envelope (method/path/body), so encryption is not required.

## Retry policy

- **No backoff today.** `drain` retries on the next NetInfo "online" event or the next `enqueue` call. There is no scheduled retry timer. If you need exponential backoff, add it inside `drain` — bump `attempts`, and only re-attempt the head if `Date.now() - head.createdAt > backoff(attempts)`.
- **No max-attempts cap.** A retryable failure stays at the head forever until it succeeds or becomes a permanent 4xx. If you ship a "give up after N attempts" rule, decide what to do with the dropped item (surface to UI? log? dead-letter?).
- **Permanent failures are dropped.** A 4xx (other than 401 after refresh) drops the item with a `console.warn`. This matches the V1 spec ("last-write-wins") — the user's offline edit was invalid; we don't retry indefinitely. Consider whether to surface this to the UI in V1.5.

## Ordering and conflicts

- **FIFO.** The queue preserves order. A mutation never jumps ahead of one that was enqueued earlier, even if the earlier one is retrying.
- **Last-write-wins on the server.** Multiple offline edits to the same resource resolve in the order they were enqueued. Server doesn't merge — whichever request arrives last wins.
- **No idempotency keys today.** If the network actually delivered the request and the response was lost, a queue retry will produce a duplicate write. For mutations that aren't naturally idempotent (e.g. `POST /workouts/:id/sets`), this is a real risk on flaky networks. V1.5: add an `Idempotency-Key` header derived from `QueuedMutation.id`.

## Testing the queue

The cleanest way is a dev client + airplane mode:

1. Build a dev client (`npx expo run:ios` or `:android`) — Expo Go won't persist the queue.
2. Sign in, then enable airplane mode.
3. Trigger a mutation (e.g. start a workout, log a set). Confirm `pendingCount()` ticks up.
4. Disable airplane mode. Confirm `useSyncBootstrap` drains and `pendingCount()` returns to 0.
5. Force-quit the app between steps 3 and 4 to confirm persistence.

Dev helpers:

```ts
import { pendingCount, _clearQueue } from '@/lib/syncQueue';
console.log('pending mutations:', pendingCount());
_clearQueue();   // dev/test only
```

## When NOT to use the queue

- **Reads.** `apiQuery` is for reads and never queues. If a read fails offline, the calling hook should fall back to its MMKV-cached value via `useCachedQuery`.
- **Auth flows.** Login/refresh go through Supabase directly, not `apiMutate`. Refresh-on-401 is handled inside `lib/api.ts` separately from the queue.
- **Background sync.** This is a foreground queue. iOS/Android background sync (BackgroundFetch / WorkManager) is a V2 concern — for V1 the queue drains when the user opens the app or the OS wakes JS.

## When adding a new mutation

1. Add the hook in `react-native/hooks/useMutations.ts` (or a feature-specific hook file).
2. Inside the hook, call `apiMutate({ method, path, body })`. **Don't call `fetch` directly.**
3. On success, invalidate any React Query keys that should reflect the change — typically `['home', 'snapshot']`.
4. Decide what UI feedback to show on `{ kind: 'queued' }` — usually a "Saved — will sync" toast.
5. If the operation must not duplicate on retry, add an `Idempotency-Key` header (V1.5 task — not yet implemented).
