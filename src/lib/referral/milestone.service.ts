/**
 * LIKEFOOD - Referral Milestone Service
 * Checks and grants milestone rewards based on qualified referral count
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/client";
import { creditAvailableBalance } from "./wallet.service";

/**
 * Check and grant any newly qualified milestones for a user.
 * Idempotent — uses unique(userId, milestoneId) to prevent duplicates.
 */
export async function checkAndGrantMilestones(userId: number): Promise<string[]> {
  const profile = await prisma.referralprofile.findUnique({
    where: { userId },
    select: { qualifiedInvites: true },
  });
  if (!profile) return [];

  const qualifiedCount = profile.qualifiedInvites;

  // Get all active milestones that user qualifies for
  const eligibleMilestones = await prisma.referralmilestone.findMany({
    where: {
      isActive: true,
      milestone: { lte: qualifiedCount },
    },
    orderBy: { milestone: "asc" },
  });

  // Get already granted milestones
  const grantedIds = new Set(
    (
      await prisma.referralmilestonereward.findMany({
        where: { userId },
        select: { milestoneId: true },
      })
    ).map((r) => r.milestoneId)
  );

  const newlyGranted: string[] = [];

  for (const ms of eligibleMilestones) {
    if (grantedIds.has(ms.id)) continue;

    try {
      // Create milestone reward (unique constraint prevents duplicates)
      const reward = await prisma.referralmilestonereward.create({
        data: {
          userId,
          milestoneId: ms.id,
          rewardType: ms.rewardType,
          rewardValue: ms.rewardValue,
          status: "GRANTED",
        },
      });

      // Grant reward based on type
      switch (ms.rewardType) {
        case "CASH":
        case "STORE_CREDIT":
          await creditAvailableBalance(
            userId,
            Number(ms.rewardValue),
            "MILESTONE",
            "MILESTONE",
            reward.id,
            `Milestone reward: ${ms.label || `${ms.milestone} referrals`}`
          );
          break;

        case "VOUCHER": {
          // Create a voucher/coupon for the user
          const voucherConfig = ms.voucherConfig ? JSON.parse(ms.voucherConfig) : {};
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (voucherConfig.validDays || 30));

          const coupon = await prisma.coupon.create({
            data: {
              code: `REF-${String(userId).slice(-4)}-M${ms.milestone}-${Date.now().toString(36).toUpperCase()}`,
              discountType: voucherConfig.discountType || "fixed",
              discountValue: Number(ms.rewardValue),
              minOrderValue: voucherConfig.minOrder || 0,
              maxDiscount: voucherConfig.maxDiscount || Number(ms.rewardValue),
              startDate: new Date(),
              endDate,
              isActive: true,
              usageLimit: 1,
              category: "all",
            },
          });

          // Link coupon to milestone reward
          await prisma.referralmilestonereward.update({
            where: { id: reward.id },
            data: { couponId: coupon.id },
          });

          // Auto-claim voucher for user
          await prisma.uservoucher.create({
            data: {
              userId,
              couponId: coupon.id,
              status: "CLAIMED",
            },
          });
          break;
        }

        case "BADGE":
          // Update tier based on milestone
          if (ms.milestone >= 50) {
            await prisma.referralprofile.update({
              where: { userId },
              data: { tier: "AMBASSADOR" },
            });
          } else if (ms.milestone >= 30) {
            await prisma.referralprofile.update({
              where: { userId },
              data: { tier: "GOLD" },
            });
          }
          break;
        // FREE_SHIPPING, FREE_GIFT — handled similarly to VOUCHER or via notification
      }

      newlyGranted.push(String(ms.id));

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: "referral",
          title: `🎉 Milestone ${ms.milestone} Reached!`,
          message: `You've earned a ${ms.rewardType} reward worth $${ms.rewardValue} for referring ${ms.milestone} friends!`,
          link: "/profile/referrals",
        },
      }).catch(() => { /* ignore notification errors */ });

      // Audit log
      await prisma.referralauditlog.create({
        data: {
          targetUserId: userId,
          action: "MILESTONE_GRANTED",
          entityType: "referralmilestonereward",
          entityId: reward.id,
          afterData: JSON.stringify({
            milestone: ms.milestone,
            rewardType: ms.rewardType,
            rewardValue: Number(ms.rewardValue),
          }),
        },
      });
    } catch (error) {
      // Likely unique constraint violation — already granted
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      console.error(`[Referral] Failed to grant milestone ${ms.milestone}:`, error);
    }
  }

  return newlyGranted;
}

/**
 * Get milestone progress for a user
 */
export async function getMilestoneProgress(userId: number) {
  const profile = await prisma.referralprofile.findUnique({
    where: { userId },
    select: { qualifiedInvites: true },
  });

  const milestones = await prisma.referralmilestone.findMany({
    where: { isActive: true },
    orderBy: { milestone: "asc" },
  });

  const grantedRewards = await prisma.referralmilestonereward.findMany({
    where: { userId },
    select: { milestoneId: true, status: true, grantedAt: true },
  });

  const grantedMap = new Map(grantedRewards.map((r) => [r.milestoneId, r]));
  const qualifiedCount = profile?.qualifiedInvites || 0;

  return milestones.map((ms) => {
    const granted = grantedMap.get(ms.id);
    return {
      id: ms.id,
      milestone: ms.milestone,
      rewardType: ms.rewardType,
      rewardValue: Number(ms.rewardValue),
      label: ms.label,
      labelEn: ms.labelEn,
      isActive: ms.isActive,
      achieved: !!granted,
      grantedAt: granted?.grantedAt?.toISOString() || null,
      status: granted?.status || null,
      remaining: Math.max(0, ms.milestone - qualifiedCount),
    };
  });
}
