/**
 * LIKEFOOD - Referral Fraud Detection Service
 */

import prisma from "@/lib/prisma";
import { FraudSignalType } from "./types";

interface FraudCheckContext {
  referrerUserId: number;
  referredUserId: number;
  relationId: number;
  ip?: string | null;
  deviceFingerprint?: string | null;
}

/**
 * Run fraud checks on a new referral relation.
 * Returns total fraud score. Signals are persisted to DB.
 */
export async function runFraudChecks(ctx: FraudCheckContext): Promise<number> {
  const signals: Array<{
    signalType: string;
    severity: string;
    score: number;
    details: Record<string, unknown>;
  }> = [];

  // 1. Self-referral check
  if (ctx.referrerUserId === ctx.referredUserId) {
    signals.push({
      signalType: FraudSignalType.SELF_REFERRAL,
      severity: "CRITICAL",
      score: 100,
      details: { reason: "User referred themselves" },
    });
  }

  // 2. Same IP check
  if (ctx.ip) {
    const sameIpRelations = await prisma.referralrelation.count({
      where: {
        referrerUserId: ctx.referrerUserId,
        ip: ctx.ip,
        id: { not: ctx.relationId },
      },
    });
    if (sameIpRelations > 0) {
      signals.push({
        signalType: FraudSignalType.SAME_IP,
        severity: "HIGH",
        score: 30,
        details: { ip: ctx.ip, matchCount: sameIpRelations },
      });
    }
  }

  // 3. Same device fingerprint check
  if (ctx.deviceFingerprint) {
    const sameDevice = await prisma.referralrelation.count({
      where: {
        referrerUserId: ctx.referrerUserId,
        deviceFingerprint: ctx.deviceFingerprint,
        id: { not: ctx.relationId },
      },
    });
    if (sameDevice > 0) {
      signals.push({
        signalType: FraudSignalType.SAME_DEVICE,
        severity: "HIGH",
        score: 40,
        details: { fingerprint: ctx.deviceFingerprint, matchCount: sameDevice },
      });
    }
  }

  // 4. Rapid signup check (many referrals from same referrer in short window)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.referralrelation.count({
    where: {
      referrerUserId: ctx.referrerUserId,
      createdAt: { gte: oneHourAgo },
    },
  });
  if (recentCount > 5) {
    signals.push({
      signalType: FraudSignalType.RAPID_SIGNUP,
      severity: "MEDIUM",
      score: 20,
      details: { recentSignups: recentCount, window: "1h" },
    });
  }

  // Persist signals
  if (signals.length > 0) {
    await prisma.referralfraudsignal.createMany({
      data: signals.map((s) => ({
        relationId: ctx.relationId,
        signalType: s.signalType,
        severity: s.severity,
        score: s.score,
        details: JSON.stringify(s.details),
      })),
    });
  }

  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);

  // Update profile fraud score
  if (totalScore > 0) {
    await prisma.referralprofile.updateMany({
      where: { userId: ctx.referrerUserId },
      data: { fraudScore: { increment: totalScore } },
    });
  }

  return totalScore;
}

/**
 * Check shipping address similarity between referrer and referred
 */
export async function checkAddressFraud(
  referrerUserId: number,
  referredUserId: number,
  relationId: number
): Promise<void> {
  const [referrerAddresses, referredAddresses] = await Promise.all([
    prisma.address.findMany({ where: { userId: referrerUserId }, select: { address: true, zipCode: true } }),
    prisma.address.findMany({ where: { userId: referredUserId }, select: { address: true, zipCode: true } }),
  ]);

  for (const ra of referrerAddresses) {
    for (const rd of referredAddresses) {
      if (ra.zipCode === rd.zipCode && ra.address.toLowerCase() === rd.address.toLowerCase()) {
        await prisma.referralfraudsignal.create({
          data: {
            relationId,
            signalType: FraudSignalType.SAME_ADDRESS,
            severity: "HIGH",
            score: 35,
            details: JSON.stringify({ zipCode: ra.zipCode }),
          },
        });
        await prisma.referralprofile.updateMany({
          where: { userId: referrerUserId },
          data: { fraudScore: { increment: 35 } },
        });
        return;
      }
    }
  }
}
