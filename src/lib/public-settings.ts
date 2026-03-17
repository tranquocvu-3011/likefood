/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Module-level cache for /api/public/settings to avoid duplicate fetches
 * across components on the same page. Cache expires after 30 seconds so
 * admin changes (e.g. Turnstile keys) show up quickly on login/register.
 */

type PublicSettings = Record<string, string>;

let cachedPromise: Promise<PublicSettings> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export type GetPublicSettingsOptions = { bypassCache?: boolean };

export async function getPublicSettings(
  options?: GetPublicSettingsOptions
): Promise<PublicSettings> {
  const now = Date.now();
  const useCache = !options?.bypassCache && cachedPromise && now - cacheTimestamp < CACHE_TTL_MS;

  if (useCache && cachedPromise) {
    return cachedPromise;
  }

  const doFetch = () =>
    fetch("/api/public/settings", options?.bypassCache ? { cache: "no-store" } : undefined)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch settings");
        return res.json() as Promise<PublicSettings>;
      })
      .catch(() => {
        cachedPromise = null;
        return {} as PublicSettings;
      });

  if (!options?.bypassCache) {
    cacheTimestamp = now;
    cachedPromise = doFetch();
    return cachedPromise;
  }
  return doFetch();
}
