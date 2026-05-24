import { createStore, entries, set as idbSet, del as idbDel } from "idb-keyval";
import type { Cache } from "swr";

const STORE = createStore("compstat-rio", "swr");

export async function hydrateFromIdb(): Promise<Map<string, unknown>> {
  try {
    const all = await entries(STORE);
    const map = new Map<string, unknown>();
    for (const [k, v] of all) {
      if (typeof k === "string") map.set(k, v);
    }
    return map;
  } catch {
    return new Map();
  }
}

export function createIdbCacheProvider(seed: Map<string, unknown>): () => Cache {
  return () => {
    const map = new Map<string, unknown>(seed);
    const cache: Cache = {
      get: (key: string) => map.get(key) as ReturnType<Cache["get"]>,
      set: (key: string, value) => {
        map.set(key, value);
        void idbSet(key, value, STORE).catch(() => {});
      },
      delete: (key: string) => {
        map.delete(key);
        void idbDel(key, STORE).catch(() => {});
      },
      keys: () => map.keys(),
    };
    return cache;
  };
}
