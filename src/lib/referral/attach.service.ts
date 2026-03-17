/**
 * LIKEFOOD - Referral Attach Service
 * Handles attaching referrer to new users, with validation and fraud checks
 */

import prisma from "@/lib/prisma";
import { getReferralConfig } from "./config.service";
import { resolveReferralCode, getOrCreateProfile } from "./code.service";
import { runFraudChecks } from "./fraud.service";
import { ReferralStatus } from "./types";

interface AttachResult {
  success: boolean;
  error?: string;
  relationId?: string;
}

interface AttachContext {
  userId: number;
  code: string;
  source: string;
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

/**
 * Attach a referrer to a user. Validates all rules:
 * - Program enabled
 * - Grace period not expired
 * - No self-referral
 * - No existing referrer
 * - Valid referral code
 * - Fraud checks
 */
export async function attachReferral(ctx: AttachContext): Promise<AttachResult> {
  const config = await getReferralConfig();

  // 1. Check program enabled
  if (!config.programEnabled) {
    return { success: false, error: "Referral program is currently disabled" };
  }

  // 2. Check if user already has a referrer
  const existingRelation = await prisma.referralrelation.findUnique({
    where: { referredUserId: ctx.userId },
  });
  if (existingRelation) {
    return { success: false, error: "You already have a referrer" };
  }

  // 3. Resolve referral code
  const resolved = await resolveReferralCode(ctx.code);
  if (!resolved) {
    return { success: false, error: "Invalid referral code" };
  }

  // 4. No self-referral
  if (resolved.userId === ctx.userId) {
    return { success: false, error: "Cannot refer yourself" };
  }

  // 5. Check grace period (user created within allowed window)
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { createdAt: true },
  });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const gracePeriodMs = config.referralGracePeriodHours * 60 * 60 * 1000;
  const gracePeriodEnd = new Date(user.createdAt.getTime() + gracePeriodMs);
  if (new Date() > gracePeriodEnd) {
    return { success: false, error: "Referral grace period has expired" };
  }

  // 6. Ensure referrer has a profile
  await getOrCreateProfile(resolved.userId);

  // 7. Create referral relation
  const relation = await prisma.referralrelation.create({
    data: {
      referrerUserId: resolved.userId,
      referredUserId: ctx.userId,
      referralCodeUsed: ctx.code.trim().toUpperCase(),
      source: ctx.source,
      status: ReferralStatus.SIGNED_UP,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      deviceFingerprint: ctx.deviceFingerprint,
    },
  });

  // 8. Update referrer profile invite count
  await prisma.referralprofile.updateMany({
    where: { userId: resolved.userId },
    data: { totalInvites: { increment: 1 } },
  });

  // 9. Run fraud checks
  const fraudScore = await runFraudChecks({
    referrerUserId: resolved.userId,
    referredUserId: ctx.userId,
    relationId: relation.id,
    ip: ctx.ip,
    deviceFingerprint: ctx.deviceFingerprint,
  });

  // 10. If high fraud score, set to FRAUD_REVIEW
  if (fraudScore >= config.fraudScoreThreshold) {
    await prisma.referralrelation.update({
      where: { id: relation.id },
      data: { status: ReferralStatus.FRAUD_REVIEW },
    });
  }

  // 11. Create audit log
  await prisma.referralauditlog.create({
    data: {
      actorUserId: ctx.userId,
      targetUserId: resolved.userId,
      action: "REFERRAL_ATTACHED",
      entityType: "referralrelation",
      entityId: relation.id,
      afterData: JSON.stringify({
        code: ctx.code,
        source: ctx.source,
        fraudScore,
      }),
    },
  });

  return { success: true, relationId: String(relation.id)};
}
