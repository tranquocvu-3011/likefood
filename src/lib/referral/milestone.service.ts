/**
 * LIKEFOOD - Referral Milestone Service
 * Checks and grants milestone rewards based on qualified referral count
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/client";

const DEFAULT_REFERRAL_MILESTONES = [
  {
    milestone: 5,
    rewardType: "CASH",
    rewardValue: 3,
    label: "Mốc 5 bạn bè",
    labelEn: "5 Friends Milestone",
    description: "Mời thành công 5 bạn bè mua hàng, nhận thưởng $3.",
    descriptionEn: "Refer 5 friends with successful purchases to earn $3.",
    sortOrder: 10,
  },
  {
    milestone: 10,
    rewardType: "CASH",
    rewardValue: 5,
    label: "Mốc 10 bạn bè",
    labelEn: "10 Friends Milestone",
    description: "Mời thành công 10 bạn bè mua hàng, nhận thưởng $5.",
    descriptionEn: "Refer 10 friends with successful purchases to earn $5.",
    sortOrder: 20,
  },
  {
    milestone: 20,
    rewardType: "CASH",
    rewardValue: 30,
    label: "Mốc 20 bạn bè",
    labelEn: "20 Friends Milestone",
    description: "Mời thành công 20 bạn bè mua hàng, nhận thưởng $30.",
    descriptionEn: "Refer 20 friends with successful purchases to earn $30.",
    sortOrder: 30,
  },
  {
    milestone: 100,
    rewardType: "CASH",
    rewardValue: 50,
    label: "Mốc 100 bạn bè",
    labelEn: "100 Friends Milestone",
    description: "Mời thành công 100 bạn bè mua hàng, nhận thưởng $50.",
    descriptionEn: "Refer 100 friends with successful purchases to earn $50.",
    sortOrder: 40,
  },
] as const;

export async function ensureDefaultReferralMilestones(): Promise<void> {
  await Promise.all(
    DEFAULT_REFERRAL_MILESTONES.map((m) =>
      prisma.referralmilestone.upsert({
        where: { milestone: m.milestone },
        update: {
          rewardType: m.rewardType,
          rewardValue: new Prisma.Decimal(m.rewardValue),
          label: m.label,
          labelEn: m.labelEn,
          description: m.description,
          descriptionEn: m.descriptionEn,
          isActive: true,
          sortOrder: m.sortOrder,
        },
        create: {
          milestone: m.milestone,
          rewardType: m.rewardType,
          rewardValue: new Prisma.Decimal(m.rewardValue),
          label: m.label,
          labelEn: m.labelEn,
          description: m.description,
          descriptionEn: m.descriptionEn,
          isActive: true,
          sortOrder: m.sortOrder,
        },
      })
    )
  );
}

/**
 * Check and grant any newly qualified milestones for a user.
 * Idempotent — uses unique(userId, milestoneId) to prevent duplicates.
 */
export async function checkAndGrantMilestones(userId: number): Promise<string[]> {
  await ensureDefaultReferralMilestones();

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

  const newlyUnlocked: string[] = [];

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
          status: "PENDING",
        },
      });

      newlyUnlocked.push(String(ms.id));

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: "referral",
          title: `🎉 Đạt mốc ${ms.milestone} bạn bè!`,
          message: `Bạn đã mở khóa thưởng $${Number(ms.rewardValue)}. Vào mục Mốc thưởng để nhận ngay.`,
          link: "/profile/referrals",
        },
      }).catch(() => { /* ignore notification errors */ });

      // Audit log
      await prisma.referralauditlog.create({
        data: {
          targetUserId: userId,
          action: "MILESTONE_UNLOCKED",
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

  return newlyUnlocked;
}

export async function claimMilestoneReward(userId: number, milestoneId: number) {
  await ensureDefaultReferralMilestones();

  const profile = await prisma.referralprofile.findUnique({
    where: { userId },
    select: { qualifiedInvites: true },
  });
  const qualifiedCount = profile?.qualifiedInvites ?? 0;

  const milestone = await prisma.referralmilestone.findUnique({
    where: { id: milestoneId },
  });
  if (!milestone || !milestone.isActive) {
    throw new Error("Mốc thưởng không tồn tại.");
  }

  if (qualifiedCount < milestone.milestone) {
    throw new Error("Bạn chưa đạt đủ số bạn bè mua hàng thành công để nhận mốc này.");
  }

  return prisma.$transaction(async (tx) => {
    let reward = await tx.referralmilestonereward.findUnique({
      where: {
        userId_milestoneId: {
          userId,
          milestoneId: milestone.id,
        },
      },
    });

    if (!reward) {
      reward = await tx.referralmilestonereward.create({
        data: {
          userId,
          milestoneId: milestone.id,
          rewardType: milestone.rewardType,
          rewardValue: milestone.rewardValue,
          status: "PENDING",
        },
      });
    }

    if (reward.status === "GRANTED" || reward.status === "CONVERTED") {
      return {
        alreadyClaimed: true,
        milestone: milestone.milestone,
        rewardType: reward.rewardType,
        rewardValue: Number(reward.rewardValue),
      };
    }

    if (reward.status === "VOID") {
      throw new Error("Mốc thưởng này không thể nhận.");
    }

    if (reward.rewardType === "CASH" || reward.rewardType === "STORE_CREDIT") {
      const updatedProfile = await tx.referralprofile.update({
        where: { userId },
        data: { availableBalance: { increment: Number(reward.rewardValue) } },
      });

      await tx.referralwallettx.create({
        data: {
          userId,
          type: "MILESTONE",
          sourceType: "MILESTONE",
          sourceId: reward.id,
          direction: "CREDIT",
          amount: reward.rewardValue,
          balanceAfter: updatedProfile.availableBalance,
          status: "COMPLETED",
          description: `Claimed milestone reward: ${milestone.label || `${milestone.milestone} referrals`}`,
        },
      });
    }

    if (reward.rewardType === "VOUCHER") {
      const voucherConfig = milestone.voucherConfig ? JSON.parse(milestone.voucherConfig) : {};
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (voucherConfig.validDays || 30));

      const coupon = await tx.coupon.create({
        data: {
          code: `REF-${String(userId).slice(-4)}-M${milestone.milestone}-${Date.now().toString(36).toUpperCase()}`,
          discountType: voucherConfig.discountType || "fixed",
          discountValue: Number(reward.rewardValue),
          minOrderValue: voucherConfig.minOrder || 0,
          maxDiscount: voucherConfig.maxDiscount || Number(reward.rewardValue),
          startDate: new Date(),
          endDate,
          isActive: true,
          usageLimit: 1,
          category: "all",
        },
      });

      await tx.uservoucher.create({
        data: {
          userId,
          couponId: coupon.id,
          status: "CLAIMED",
        },
      });

      await tx.referralmilestonereward.update({
        where: { id: reward.id },
        data: { couponId: coupon.id },
      });
    }

    if (reward.rewardType === "BADGE") {
      if (milestone.milestone >= 50) {
        await tx.referralprofile.update({ where: { userId }, data: { tier: "AMBASSADOR" } });
      } else if (milestone.milestone >= 30) {
        await tx.referralprofile.update({ where: { userId }, data: { tier: "GOLD" } });
      }
    }

    await tx.referralmilestonereward.update({
      where: { id: reward.id },
      data: { status: "GRANTED", grantedAt: new Date() },
    });

    await tx.notification.create({
      data: {
        userId,
        type: "referral",
        title: `🎁 Đã nhận thưởng mốc ${milestone.milestone}!`,
        message: `Bạn đã nhận thành công $${Number(reward.rewardValue)} từ mốc giới thiệu bạn bè.`,
        link: "/profile/referrals",
      },
    }).catch(() => undefined);

    await tx.referralauditlog.create({
      data: {
        targetUserId: userId,
        action: "MILESTONE_CLAIMED",
        entityType: "referralmilestonereward",
        entityId: reward.id,
        afterData: JSON.stringify({
          milestone: milestone.milestone,
          rewardType: reward.rewardType,
          rewardValue: Number(reward.rewardValue),
        }),
      },
    });

    return {
      alreadyClaimed: false,
      milestone: milestone.milestone,
      rewardType: reward.rewardType,
      rewardValue: Number(reward.rewardValue),
    };
  });
}

/**
 * Get milestone progress for a user
 */
export async function getMilestoneProgress(userId: number) {
  await ensureDefaultReferralMilestones();

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
    const reached = qualifiedCount >= ms.milestone;
    const claimed = granted?.status === "GRANTED" || granted?.status === "CONVERTED";
    const claimable = reached && !claimed && granted?.status !== "VOID";

    return {
      id: ms.id,
      milestone: ms.milestone,
      rewardType: ms.rewardType,
      rewardValue: Number(ms.rewardValue),
      label: ms.label,
      labelEn: ms.labelEn,
      isActive: ms.isActive,
      achieved: claimed,
      reached,
      claimed,
      claimable,
      grantedAt: granted?.grantedAt?.toISOString() || null,
      status: granted?.status || (reached ? "PENDING" : null),
      remaining: Math.max(0, ms.milestone - qualifiedCount),
    };
  });
}
