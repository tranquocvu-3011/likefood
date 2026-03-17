/**
 * LIKEFOOD - Referral Cashout Service
 * Handles cashout requests, conversions to voucher/store credit
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/client";
import { getReferralConfig } from "./config.service";
import { debitAvailableBalance } from "./wallet.service";
import { CashoutStatus, WalletTxType } from "./types";

interface CashoutResult {
  success: boolean;
  error?: string;
  cashoutId?: string;
}

/**
 * Create a cashout request
 */
export async function createCashoutRequest(
  userId: number,
  amount: number,
  method: string,
  destinationData?: Record<string, unknown>
): Promise<CashoutResult> {
  const config = await getReferralConfig();

  // Validate program enabled
  if (!config.programEnabled) {
    return { success: false, error: "Referral program is disabled" };
  }

  // Validate method is enabled
  if (!config.enabledCashoutMethods.includes(method as never)) {
    return { success: false, error: "This cashout method is not available" };
  }

  // Validate amount >= minimum
  if (amount < config.minimumCashoutAmount) {
    return { success: false, error: `Minimum cashout amount is $${config.minimumCashoutAmount}` };
  }

  // Check profile not locked
  const profile = await prisma.referralprofile.findUnique({
    where: { userId },
    select: { availableBalance: true, isLocked: true },
  });
  if (!profile) {
    return { success: false, error: "Referral profile not found" };
  }
  if (profile.isLocked) {
    return { success: false, error: "Your account is under review" };
  }

  // Check sufficient balance
  if (Number(profile.availableBalance) < amount) {
    return { success: false, error: "Insufficient balance" };
  }

  // Check no pending cashout
  const pendingCashout = await prisma.referralcashout.findFirst({
    where: { userId, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (pendingCashout) {
    return { success: false, error: "You already have a pending cashout request" };
  }

  // For STORE_CREDIT and VOUCHER, process immediately
  if (method === "STORE_CREDIT") {
    return processStoreCredit(userId, amount);
  }
  if (method === "VOUCHER") {
    return processVoucherConversion(userId, amount);
  }

  // For PAYPAL/VENMO/BANK — create pending request for admin approval
  const debited = await debitAvailableBalance(
    userId,
    amount,
    WalletTxType.CASHOUT,
    "CASHOUT",
    0,
    `Cashout request: ${method}`
  );
  if (!debited) {
    return { success: false, error: "Failed to debit balance" };
  }

  const cashout = await prisma.referralcashout.create({
    data: {
      userId,
      amount: new Prisma.Decimal(amount),
      method,
      destinationData: destinationData ? JSON.stringify(destinationData) : null,
      status: CashoutStatus.PENDING,
    },
  });

  // Audit log
  await prisma.referralauditlog.create({
    data: {
      actorUserId: userId,
      action: "CASHOUT_REQUESTED",
      entityType: "referralcashout",
      entityId: cashout.id,
      afterData: JSON.stringify({ amount, method }),
    },
  });

  return { success: true, cashoutId: String(cashout.id)};
}

/**
 * Process store credit conversion (immediate)
 */
async function processStoreCredit(userId: number, amount: number): Promise<CashoutResult> {
  const debited = await debitAvailableBalance(
    userId,
    amount,
    WalletTxType.CONVERT_CREDIT,
    "CONVERT",
    0,
    `Converted to store credit`
  );
  if (!debited) {
    return { success: false, error: "Failed to debit balance" };
  }

  // Add to user points (store credit = points in LIKEFOOD)
  await prisma.user.update({
    where: { id: Number(userId) },
    data: { points: { increment: Math.round(amount * 100) } }, // $1 = 100 points
  });

  await prisma.pointtransaction.create({
    data: {
      userId,
      amount: Math.round(amount * 100),
      type: "REFERRAL_CONVERT",
      description: `Converted $${amount} referral balance to store credit`,
    },
  });

  // Create cashout record for tracking
  const cashout = await prisma.referralcashout.create({
    data: {
      userId,
      amount: new Prisma.Decimal(amount),
      method: "STORE_CREDIT",
      status: CashoutStatus.PAID,
      processedAt: new Date(),
    },
  });

  return { success: true, cashoutId: String(cashout.id)};
}

/**
 * Process voucher conversion (immediate)
 */
async function processVoucherConversion(userId: number, amount: number): Promise<CashoutResult> {
  const debited = await debitAvailableBalance(
    userId,
    amount,
    WalletTxType.CONVERT_VOUCHER,
    "CONVERT",
    0,
    `Converted to voucher`
  );
  if (!debited) {
    return { success: false, error: "Failed to debit balance" };
  }

  // Create a coupon
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const coupon = await prisma.coupon.create({
    data: {
      code: `REF-${String(userId).slice(-4)}-${Date.now().toString(36).toUpperCase()}`,
      discountType: "fixed",
      discountValue: amount,
      minOrderValue: 0,
      maxDiscount: amount,
      startDate: new Date(),
      endDate,
      isActive: true,
      usageLimit: 1,
      category: "all",
    },
  });

  await prisma.uservoucher.create({
    data: { userId, couponId: coupon.id, status: "CLAIMED" },
  });

  // Create cashout record for tracking
  const cashout = await prisma.referralcashout.create({
    data: {
      userId,
      amount: new Prisma.Decimal(amount),
      method: "VOUCHER",
      status: CashoutStatus.PAID,
      processedAt: new Date(),
    },
  });

  return { success: true, cashoutId: String(cashout.id)};
}

/**
 * Admin: approve/reject/process a cashout request
 */
export async function processCashoutByAdmin(
  cashoutId: number,
  action: "APPROVED" | "REJECTED" | "PAID",
  adminUserId: string,
  adminNote?: string
): Promise<{ success: boolean; error?: string }> {
  const cashout = await prisma.referralcashout.findUnique({
    where: { id: Number(cashoutId) },
  });
  if (!cashout) {
    return { success: false, error: "Cashout not found" };
  }

  // Validate status transitions
  if (action === "APPROVED" && cashout.status !== "PENDING") {
    return { success: false, error: "Can only approve pending requests" };
  }
  if (action === "REJECTED" && cashout.status !== "PENDING") {
    return { success: false, error: "Can only reject pending requests" };
  }
  if (action === "PAID" && cashout.status !== "APPROVED") {
    return { success: false, error: "Can only mark approved requests as paid" };
  }

  await prisma.referralcashout.update({
    where: { id: Number(cashoutId) },
    data: {
      status: action,
      adminNote,
      processedBy: Number(adminUserId),
      processedAt: new Date(),
    },
  });

  // If rejected, refund the balance
  if (action === "REJECTED") {
    await prisma.$transaction(async (tx) => {
      await tx.referralprofile.updateMany({
        where: { userId: cashout.userId },
        data: {
          availableBalance: { increment: Number(cashout.amount) },
          withdrawnBalance: { decrement: Number(cashout.amount) },
        },
      });

      await tx.referralwallettx.create({
        data: {
          userId: cashout.userId,
          type: "CASHOUT",
          sourceType: "CASHOUT",
          sourceId: cashoutId,
          direction: "CREDIT",
          amount: cashout.amount,
          balanceAfter: new Prisma.Decimal(0),
          status: "COMPLETED",
          description: `Cashout rejected: ${adminNote || "No reason provided"}`,
        },
      });
    });
  }

  // Audit log
  await prisma.referralauditlog.create({
    data: {
      actorUserId: Number(adminUserId),
      targetUserId: cashout.userId,
      action: `CASHOUT_${action}`,
      entityType: "referralcashout",
      entityId: cashoutId,
      afterData: JSON.stringify({ action, adminNote }),
    },
  });

  return { success: true };
}
