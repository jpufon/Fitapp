// In-memory MMKV shim for Expo Go. Replace with `react-native-mmkv` once on a dev client.
// No cross-session persistence — data is lost on app reload.

type Primitive = string | number | boolean;

export class MMKV {
  private store = new Map<string, Primitive>();

  constructor(_config?: { id?: string; encryptionKey?: string }) {}

  set(key: string, value: Primitive): void {
    this.store.set(key, value);
  }

  getString(key: string): string | undefined {
    const v = this.store.get(key);
    return typeof v === 'string' ? v : undefined;
  }

  getNumber(key: string): number | undefined {
    const v = this.store.get(key);
    return typeof v === 'number' ? v : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const v = this.store.get(key);
    return typeof v === 'boolean' ? v : undefined;
  }

  contains(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }

  clearAll(): void {
    this.store.clear();
  }
}
