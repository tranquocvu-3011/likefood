/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

type SettingValue = string | null;

const CACHE_TTL_MS = 15_000; // keep short so Admin changes propagate quickly
const cache = new Map<string, { value: SettingValue; at: number }>();

function getCached(key: string): SettingValue | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(key: string, value: SettingValue) {
  cache.set(key, { value, at: Date.now() });
}

export async function getSystemSetting(key: string): Promise<SettingValue> {
  const cached = getCached(key);
  if (cached !== undefined) return cached;

  try {
    const row = await prisma.systemsetting.findUnique({ where: { key } });
    const value = row?.value ?? null;
    setCached(key, value);
    return value;
  } catch (error) {
    logger.warn("[SETTINGS] Failed to read system setting", {
      context: "system-settings",
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getSystemSettingTrimmed(key: string): Promise<string> {
  const v = await getSystemSetting(key);
  return (v ?? "").trim();
}

export async function getSystemSettingBooleanOnOff(
  key: string,
  fallback: boolean
): Promise<boolean> {
  const raw = (await getSystemSettingTrimmed(key)).toUpperCase();
  if (raw === "ON" || raw === "TRUE" || raw === "1" || raw === "YES") return true;
  if (raw === "OFF" || raw === "FALSE" || raw === "0" || raw === "NO") return false;
  return fallback;
}

