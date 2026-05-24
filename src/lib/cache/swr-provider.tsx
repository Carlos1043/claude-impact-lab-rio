"use client";

import { useEffect, useState } from "react";
import { SWRConfig } from "swr";
import { createIdbCacheProvider, hydrateFromIdb } from "./idb-provider";

const defaultFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

export function SwrProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<(() => ReturnType<ReturnType<typeof createIdbCacheProvider>>) | null>(null);

  useEffect(() => {
    let cancelled = false;
    void hydrateFromIdb().then((seed) => {
      if (cancelled) return;
      setProvider(() => createIdbCacheProvider(seed));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!provider) {
    // Render with an in-memory cache while IDB hydrates so first paint isn't blocked.
    return (
      <SWRConfig
        value={{
          fetcher: defaultFetcher,
          revalidateOnFocus: true,
          dedupingInterval: 30_000,
        }}
      >
        {children}
      </SWRConfig>
    );
  }

  return (
    <SWRConfig
      value={{
        provider,
        fetcher: defaultFetcher,
        revalidateOnFocus: true,
        dedupingInterval: 30_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
