import type { CreateOrderRequest } from '@/types/api.types';

const STORAGE_KEY = 'ec_pending_checkout_v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface CheckoutRecord {
  fingerprint: string;
  key: string;
}

interface ManagerOptions {
  getStorage?: () => StorageLike | undefined;
  createKey?: () => string;
}

const getSessionStorage = (): StorageLike | undefined => {
  if (typeof window === 'undefined') return undefined;

  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)])
    );
  }
  return value;
};

const fingerprintPayload = async (payload: CreateOrderRequest): Promise<string> => {
  const normalizedPayload: CreateOrderRequest = {
    ...payload,
    products: {
      ...payload.products,
      items: [...payload.products.items]
        .map((item) => ({...item, productId: item.productId.toLowerCase()}))
        .sort((left, right) => left.productId.localeCompare(right.productId)),
    },
  };
  const serialized = JSON.stringify(canonicalize(normalizedPayload));
  const bytes = new TextEncoder().encode(serialized);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const createCheckoutIdempotencyManager = ({
  getStorage = getSessionStorage,
  createKey = () => globalThis.crypto.randomUUID(),
}: ManagerOptions = {}) => {
  let memoryRecord: CheckoutRecord | undefined;

  const readStoredRecord = (storage: StorageLike): CheckoutRecord | undefined => {
    try {
      const rawRecord = storage.getItem(STORAGE_KEY);
      if (!rawRecord) return undefined;

      const record: unknown = JSON.parse(rawRecord);
      if (
        !record ||
        typeof record !== 'object' ||
        !('fingerprint' in record) ||
        !('key' in record) ||
        typeof record.fingerprint !== 'string' ||
        typeof record.key !== 'string' ||
        !UUID_PATTERN.test(record.key)
      ) {
        return undefined;
      }

      return {fingerprint: record.fingerprint, key: record.key};
    } catch {
      return undefined;
    }
  };

  return {
    async getKey(payload: CreateOrderRequest): Promise<string> {
      const fingerprint = await fingerprintPayload(payload);
      if (memoryRecord?.fingerprint === fingerprint) return memoryRecord.key;

      const storage = getStorage();
      const storedRecord = storage && readStoredRecord(storage);
      if (storedRecord?.fingerprint === fingerprint) {
        memoryRecord = storedRecord;
        return storedRecord.key;
      }

      const key = createKey();
      if (!UUID_PATTERN.test(key)) {
        throw new Error('Checkout idempotency keys must be UUIDs.');
      }

      memoryRecord = {fingerprint, key};
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(memoryRecord));
      } catch {
        // Keep the operation key in memory when browser storage is unavailable.
      }
      return key;
    },

    clear(): void {
      memoryRecord = undefined;
      try {
        getStorage()?.removeItem(STORAGE_KEY);
      } catch {
        // The next checkout still gets a fresh in-memory key.
      }
    },
  };
};

export const checkoutIdempotency = createCheckoutIdempotencyManager();

export const idempotencyKeyHeaders = (key: string) => ({
  'Idempotency-Key': key,
});

export const isRetryableCheckoutNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;

  const networkError = error as {code?: string; response?: unknown};
  return !networkError.response && [
    'ERR_NETWORK',
    'ECONNABORTED',
    'ETIMEDOUT',
    'ECONNRESET',
  ].includes(networkError.code || '');
};
