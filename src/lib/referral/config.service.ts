/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Referral Config Service — Read/write referral config from systemsetting table
 */

import prisma from "@/lib/prisma";
import { type ReferralProgramConfig, DEFAULT_REFERRAL_CONFIG } from "./types";

const CONFIG_KEY = "referral_program_config";

/**
 * Get full referral program config, merged with defaults for any missing keys.
 * Uses systemsetting key-value store (existing pattern in LIKEFOOD).
 */
export async function getReferralConfig(): Promise<ReferralProgramConfig> {
  try {
    const setting = await prisma.systemsetting.findUnique({
      where: { key: CONFIG_KEY },
    });

    if (!setting) {
      return { ...DEFAULT_REFERRAL_CONFIG };
    }

    const stored = JSON.parse(setting.value) as Partial<ReferralProgramConfig>;
    // Merge with defaults — ensures new config keys always have a value
    return { ...DEFAULT_REFERRAL_CONFIG, ...stored };
  } catch {
    return { ...DEFAULT_REFERRAL_CONFIG };
  }
}

/**
 * Update referral program config (partial update, merges with existing).
 * Only admin should call this.
 */
export async function updateReferralConfig(
  updates: Partial<ReferralProgramConfig>
): Promise<ReferralProgramConfig> {
  const current = await getReferralConfig();
  const merged = { ...current, ...updates };

  await prisma.systemsetting.upsert({
    where: { key: CONFIG_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: CONFIG_KEY, value: JSON.stringify(merged) },
  });

  return merged;
}

/**
 * Check if referral program is enabled
 */
export async function isProgramEnabled(): Promise<boolean> {
  const config = await getReferralConfig();
  return config.programEnabled;
}
