/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Referral Code Service — Generate, validate, resolve referral codes
 */

import prisma from "@/lib/prisma";
import { getReferralConfig } from "./config.service";
import crypto from "crypto";

/**
 * Generate a unique system code (8 chars, alphanumeric uppercase)
 */
function generateSystemCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars: 0,O,I,1
  let code = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Ensure system code is unique
 */
async function generateUniqueSystemCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateSystemCode();
    const existing = await prisma.referralprofile.findUnique({
      where: { systemCode: code },
    });
    if (!existing) return code;
  }
  // Fallback: add timestamp suffix
  return generateSystemCode() + Date.now().toString(36).slice(-2).toUpperCase();
}

/**
 * Get or create referral profile for a user.
 * Called lazily when user first accesses referral features.
 */
export async function getOrCreateProfile(userId: number) {
  const existing = await prisma.referralprofile.findUnique({
    where: { userId },
  });

  if (existing) return existing;

  const systemCode = await generateUniqueSystemCode();

  return prisma.referralprofile.create({
    data: {
      userId,
      systemCode,
    },
  });
}

/**
 * Resolve a referral code/phone to a user ID.
 * Priority: customCode → systemCode → verified phone (if enabled)
 */
export async function resolveReferralCode(
  code: string
): Promise<{ userId: number; profileId: number } | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;

  // 1. Try custom code
  const byCustom = await prisma.referralprofile.findUnique({
    where: { customCode: trimmed },
    select: { userId: true, id: true, isLocked: true },
  });
  if (byCustom && !byCustom.isLocked) {
    return { userId: byCustom.userId, profileId: byCustom.id };
  }

  // 2. Try system code
  const bySystem = await prisma.referralprofile.findUnique({
    where: { systemCode: trimmed },
    select: { userId: true, id: true, isLocked: true },
  });
  if (bySystem && !bySystem.isLocked) {
    return { userId: bySystem.userId, profileId: bySystem.id };
  }

  // 3. Try verified phone (if config allows)
  const config = await getReferralConfig();
  if (config.allowPhoneAsReferral) {
    const normalizedPhone = code.replace(/[\s\-\(\)]/g, "");
    const userByPhone = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        referralProfile: {
          select: { id: true, isLocked: true, verifiedPhoneCodeEnabled: true },
        },
      },
    });
    if (
      userByPhone?.referralProfile &&
      !userByPhone.referralProfile.isLocked &&
      userByPhone.referralProfile.verifiedPhoneCodeEnabled
    ) {
      return {
        userId: userByPhone.id,
        profileId: userByPhone.referralProfile.id,
      };
    }
  }

  return null;
}

/**
 * Validate if a custom code is available for use
 */
export async function isCustomCodeAvailable(
  code: string,
  excludeUserId?: string
): Promise<boolean> {
  const normalized = code.trim().toUpperCase();

  // Check against custom codes
  const byCustom = await prisma.referralprofile.findUnique({
    where: { customCode: normalized },
    select: { userId: true },
  });
  if (byCustom && String(byCustom.userId) !== String(excludeUserId)) return false;

  // Check against system codes (no collision allowed)
  const bySystem = await prisma.referralprofile.findUnique({
    where: { systemCode: normalized },
    select: { id: true },
  });
  if (bySystem) return false;

  return true;
}

/**
 * Update user's custom referral code
 */
export async function updateCustomCode(
  userId: number,
  newCode: string
): Promise<{ success: boolean; error?: string }> {
  const config = await getReferralConfig();
  const profile = await getOrCreateProfile(userId);

  if (!config.allowCustomCodeChange) {
    return { success: false, error: "Custom code changes are not allowed" };
  }

  if (profile.customCodeChanges >= config.maxCustomCodeChanges) {
    return {
      success: false,
      error: `Maximum ${config.maxCustomCodeChanges} code changes allowed`,
    };
  }

  const normalized = newCode.trim().toUpperCase();
  const available = await isCustomCodeAvailable(normalized, String(userId));
  if (!available) {
    return { success: false, error: "This code is already taken" };
  }

  await prisma.referralprofile.update({
    where: { userId },
    data: {
      customCode: normalized,
      customCodeChanges: { increment: 1 },
    },
  });

  return { success: true };
}
