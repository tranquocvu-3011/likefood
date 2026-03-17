/**
 * LIKEFOOD - Referral Commission Service
 * Creates and manages commissions from referred users' orders
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/client";
import { getReferralConfig } from "./config.service";
import { creditPendingBalance, movePendingToAvailable } from "./wallet.service";
import { CommissionStatus } from "./types";

/**
 * Create commission for an order from a referred user.
 * Idempotent — will not create duplicate for same order+referrer.
 */
export async function createCommission(
  orderId: number,
  referredUserId: number,
  referrerUserId: number
): Promise<{ created: boolean; reason?: string }> {
  const config = await getReferralConfig();

  // Idempotency: check if commission already exists for this order
  const existing = await prisma.referralcommission.findUnique({
    where: {
      orderId_referrerUserId: { orderId, referrerUserId },
    },
  });
  if (existing) {
    return { created: false, reason: "Commission already exists for this order" };
  }

  // Get the order
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    select: { subtotal: true, total: true, shippingFee: true, userId: true },
  });
  if (!order || order.userId !== referredUserId) {
    return { created: false, reason: "Order not found or user mismatch" };
  }

  // Get the referral relation
  const relation = await prisma.referralrelation.findUnique({
    where: { referredUserId },
    select: { createdAt: true, status: true },
  });
  if (!relation) {
    return { created: false, reason: "No referral relation found" };
  }

  // Check commission scope
  const existingCommissions = await prisma.referralcommission.count({
    where: { referredUserId, referrerUserId },
  });

  if (config.commissionScope === "FIRST_ORDER" && existingCommissions > 0) {
    return { created: false, reason: "Commission only applies to first order" };
  }
  if (
    (config.commissionScope === "FIRST_N_ORDERS" || config.commissionScope === "FIRST_N_WITHIN_DAYS") &&
    existingCommissions >= config.commissionMaxOrders
  ) {
    return { created: false, reason: "Max commission orders reached" };
  }
  if (
    (config.commissionScope === "WITHIN_DAYS" || config.commissionScope === "FIRST_N_WITHIN_DAYS")
  ) {
    const maxDate = new Date(relation.createdAt.getTime() + config.commissionMaxDays * 24 * 60 * 60 * 1000);
    if (new Date() > maxDate) {
      return { created: false, reason: "Commission window has expired" };
    }
  }

  // Calculate base amount per config
  let baseAmount = 0;
  switch (config.commissionBaseAmount) {
    case "SUBTOTAL":
      baseAmount = order.subtotal;
      break;
    case "TOTAL_BEFORE_SHIPPING":
      baseAmount = order.total - order.shippingFee;
      break;
    case "TOTAL_PAID":
      baseAmount = order.total;
      break;
    default:
      baseAmount = order.subtotal;
  }

  const commissionAmount = Math.round(baseAmount * config.commissionRate * 100) / 100;
  if (commissionAmount <= 0) {
    return { created: false, reason: "Commission amount is zero" };
  }

  // Calculate hold until date
  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + config.rewardHoldDays);

  // Create commission
  await prisma.referralcommission.create({
    data: {
      referrerUserId,
      referredUserId,
      orderId,
      rate: new Prisma.Decimal(config.commissionRate),
      baseAmount: new Prisma.Decimal(baseAmount),
      commissionAmount: new Prisma.Decimal(commissionAmount),
      status: CommissionStatus.PENDING,
      holdUntil,
    },
  });

  // Credit pending balance
  await creditPendingBalance(
    referrerUserId,
    commissionAmount,
    "COMMISSION",
    orderId,
    `Commission from order #${String(orderId).slice(-6)}`
  );

  return { created: true };
}

/**
 * Process held commissions that have passed their hold period.
 * Should be called by a cron job or on-demand.
 */
export async function processHeldCommissions(): Promise<number> {
  const now = new Date();

  const pendingCommissions = await prisma.referralcommission.findMany({
    where: {
      status: CommissionStatus.PENDING,
      holdUntil: { lte: now },
    },
    take: 100,
  });

  let processed = 0;
  for (const comm of pendingCommissions) {
    try {
      await prisma.referralcommission.update({
        where: { id: comm.id },
        data: {
          status: CommissionStatus.AVAILABLE,
          availableAt: now,
        },
      });

      await movePendingToAvailable(
        comm.referrerUserId,
        Number(comm.commissionAmount),
        comm.id
      );

      processed++;
    } catch (error) {
      console.error(`[Referral] Failed to process commission ${comm.id}:`, error);
    }
  }

  return processed;
}

/**
 * Void a commission (e.g. order refunded/chargebacked)
 */
export async function voidCommission(
  orderId: number,
  reason: string
): Promise<void> {
  const commissions = await prisma.referralcommission.findMany({
    where: { orderId, status: { in: ["PENDING", "AVAILABLE"] } },
  });

  for (const comm of commissions) {
    const amount = Number(comm.commissionAmount);

    await prisma.$transaction(async (tx) => {
      await tx.referralcommission.update({
        where: { id: comm.id },
        data: { status: CommissionStatus.VOID, voidReason: reason },
      });

      // Reverse the balance
      if (comm.status === "PENDING") {
        await tx.referralprofile.updateMany({
          where: { userId: comm.referrerUserId },
          data: { pendingBalance: { decrement: amount } },
        });
      } else if (comm.status === "AVAILABLE") {
        await tx.referralprofile.updateMany({
          where: { userId: comm.referrerUserId },
          data: { availableBalance: { decrement: amount } },
        });
      }

      await tx.referralwallettx.create({
        data: {
          userId: comm.referrerUserId,
          type: "COMMISSION",
          sourceType: "COMMISSION",
          sourceId: comm.id,
          direction: "DEBIT",
          amount: new Prisma.Decimal(amount),
          balanceAfter: new Prisma.Decimal(0),
          status: "COMPLETED",
          description: `Commission voided: ${reason}`,
        },
      });
    });
  }
}
