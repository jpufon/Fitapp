// apps/mobile/src/services/storage.ts
//
// Replaces every `new MMKV()` in the codebase. All MMKV instances must come
// from here so they share the same encryption guarantee.
//
// What this fixes: the architecture doc says "MMKV encrypted wrapper only —
// never raw MMKV", but the example code in §6.2 uses `new MMKV()` with no
// encryption key. On a lost/stolen unlocked phone, that data is plaintext.
//
// What this does:
// 1. On first run, generate a 32-byte random key and store it in Keychain
//    (iOS) / Keystore (Android) via react-native-keychain.
// 2. On every subsequent run, retrieve that key and pass it to MMKV.
// 3. MMKV encrypts the storage file at rest with that key.
//
// Auth tokens still go in Keychain DIRECTLY (never MMKV). MMKV is for
// workout queues, exercise library cache, active workout state, etc.

import { MMKV } from 'react-native-mmkv'
import * as Keychain from 'react-native-keychain'
import { randomBytes } from 'react-native-randombytes' // npm i react-native-randombytes

const KEYCHAIN_SERVICE = 'app.walifit.mmkv'
const KEYCHAIN_KEY = 'mmkv-encryption-key'

let _instance: MMKV | null = null

async function getOrCreateEncryptionKey(): Promise<string> {
  // Try to read existing key
  const existing = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE })
  if (existing && existing.password) return existing.password

  // First launch — generate and store
  const key = await new Promise<string>((resolve, reject) => {
    randomBytes(32, (err, bytes) => {
      if (err) return reject(err)
      resolve(bytes.toString('hex'))
    })
  })

  await Keychain.setGenericPassword('mmkv', key, {
    service: KEYCHAIN_SERVICE,
    // iOS: only accessible after device unlock, on this device only.
    // Survives backup/restore to same device, NOT to a new device — which is
    // the right call. Old MMKV data on a new device shouldn't be readable.
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    // Android: backed by Keystore, hardware-backed where available
  })

  return key
}

/** Initialise once at app startup, before any other storage call. */
export async function initStorage(): Promise<void> {
  if (_instance) return
  const encryptionKey = await getOrCreateEncryptionKey()
  _instance = new MMKV({
    id: 'walifit',
    encryptionKey,
  })
}

/** The single MMKV instance the app uses. Throws if `initStorage()` wasn't called. */
export function storage(): MMKV {
  if (!_instance) {
    throw new Error('storage() called before initStorage(). Call initStorage() in App.tsx before rendering.')
  }
  return _instance
}

// ─── Auth tokens — these go in Keychain DIRECTLY, not MMKV ──────────────
//
// Even with MMKV encrypted, auth tokens deserve a separate lock. Keychain
// gives per-item access control; MMKV does not.

const AUTH_KEYCHAIN_SERVICE = 'app.walifit.auth'

export async function setAuthTokens(tokens: { accessToken: string; refreshToken: string }) {
  await Keychain.setGenericPassword(
    'tokens',
    JSON.stringify(tokens),
    {
      service: AUTH_KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  )
}

export async function getAuthTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const result = await Keychain.getGenericPassword({ service: AUTH_KEYCHAIN_SERVICE })
  if (!result || !result.password) return null
  try {
    return JSON.parse(result.password)
  } catch {
    return null
  }
}

export async function clearAuthTokens() {
  await Keychain.resetGenericPassword({ service: AUTH_KEYCHAIN_SERVICE })
}

// ─── Wipe-on-logout helper ─────────────────────────────────────────────

export async function wipeAllUserData() {
  // Order matters: clear auth first so partially-cleared state can't be used
  await clearAuthTokens()
  storage().clearAll()
  // Note: keep the MMKV encryption key in Keychain. It's not user data;
  // it's per-install. Wiping it would orphan any pending offline queue.
}

// ─── Usage in App.tsx ──────────────────────────────────────────────────
//
// import { initStorage } from './services/storage'
//
// export default function App() {
//   const [ready, setReady] = useState(false)
//   useEffect(() => {
//     initStorage().then(() => setReady(true))
//   }, [])
//   if (!ready) return <SplashScreen />
//   return <RootNavigator />
// }
