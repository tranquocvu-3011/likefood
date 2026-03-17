/**
 * LIKEFOOD - Referral Events Service
 * Orchestrates referral logic when key events happen (order completed, etc.)
 */

import prisma from "@/lib/prisma";
import { getReferralConfig } from "./config.service";
import { createCommission } from "./commission.service";
import { checkAndGrantMilestones } from "./milestone.service";
import { ReferralStatus } from "./types";

/**
 * Called when an order is completed/delivered.
 * Orchestrates: qualification check → commission → milestone → notifications
 * 
 * This should be called from the order status update webhook/API.
 * It is idempotent — safe to call multiple times for the same order.
 */
export async function onOrderCompleted(orderId: number): Promise<void> {
  const config = await getReferralConfig();
  if (!config.programEnabled) return;

  // Get the order
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    select: {
      id: true,
      userId: true,
      status: true,
      subtotal: true,
      total: true,
    },
  });
  if (!order) return;

  // Check if order status qualifies
  if (!config.qualifyingOrderStatuses.includes(order.status)) return;

  // Check if this user was referred
  const relation = await prisma.referralrelation.findUnique({
    where: { referredUserId: order.userId },
    select: {
      id: true,
      referrerUserId: true,
      referredUserId: true,
      status: true,
    },
  });
  if (!relation) return;

  // Skip if already qualified or fraud-flagged
  if (relation.status === ReferralStatus.QUALIFIED) {
    // Already qualified — still create commission if applicable
    await createCommission(orderId, order.userId, relation.referrerUserId);
    return;
  }
  if (relation.status === ReferralStatus.REJECTED || relation.status === ReferralStatus.FRAUD_REVIEW) {
    return;
  }

  // Check minimum order amount
  if (order.subtotal < config.minimumQualifiedOrderAmount) {
    return;
  }

  // Qualify the referral
  await prisma.$transaction(async (tx) => {
    // Update relation status to QUALIFIED
    await tx.referralrelation.update({
      where: { id: relation.id },
      data: {
        status: ReferralStatus.QUALIFIED,
        qualifiedAt: new Date(),
      },
    });

    // Increment qualified invites counter on referrer profile
    await tx.referralprofile.updateMany({
      where: { userId: relation.referrerUserId },
      data: { qualifiedInvites: { increment: 1 } },
    });
  });

  // Create commission for this order
  await createCommission(orderId, order.userId, relation.referrerUserId);

  // Check if any milestones are now reached
  await checkAndGrantMilestones(relation.referrerUserId);

  // Audit log
  await prisma.referralauditlog.create({
    data: {
      targetUserId: relation.referrerUserId,
      action: "REFERRAL_QUALIFIED",
      entityType: "referralrelation",
      entityId: relation.id,
      afterData: JSON.stringify({
        orderId,
        orderAmount: order.subtotal,
        referredUserId: order.userId,
      }),
    },
  });

  // Notify referrer
  await prisma.notification.create({
    data: {
      userId: relation.referrerUserId,
      type: "referral",
      title: "🎉 New qualified referral!",
      message: `One of your referred friends has completed a qualifying order! Check your referral dashboard for updates.`,
      link: "/profile/referrals",
    },
  }).catch(() => { /* ignore */ });
}

/**
 * Called when an order is refunded/cancelled to void commissions.
 */
export async function onOrderRefunded(orderId: number, reason: string): Promise<void> {
  const { voidCommission } = await import("./commission.service");
  await voidCommission(orderId, reason);
}
