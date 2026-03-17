/**
 * LIKEFOOD - Referral Wallet Service
 * Handles balance operations and wallet transactions with race-condition protection
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/client";
import { WalletTxType, WalletDirection } from "./types";

/**
 * Credit available balance (e.g. commission becomes available, milestone granted)
 * Uses Prisma transaction to prevent race conditions.
 */
export async function creditAvailableBalance(
  userId: number,
  amount: number,
  type: string,
  sourceType: string,
  sourceId: number,
  description?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const profile = await tx.referralprofile.update({
      where: { userId },
      data: { availableBalance: { increment: amount } },
    });

    await tx.referralwallettx.create({
      data: {
        userId,
        type,
        sourceType,
        sourceId,
        direction: WalletDirection.CREDIT,
        amount: new Prisma.Decimal(amount),
        balanceAfter: profile.availableBalance,
        status: "COMPLETED",
        description,
      },
    });
  });
}

/**
 * Credit pending balance (commission just created, on hold)
 */
export async function creditPendingBalance(
  userId: number,
  amount: number,
  sourceType: string,
  sourceId: number,
  description?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.referralprofile.update({
      where: { userId },
      data: { pendingBalance: { increment: amount } },
    });

    await tx.referralwallettx.create({
      data: {
        userId,
        type: WalletTxType.COMMISSION,
        sourceType,
        sourceId,
        direction: WalletDirection.CREDIT,
        amount: new Prisma.Decimal(amount),
        balanceAfter: new Prisma.Decimal(0), // Pending, not in available yet
        status: "PENDING",
        description,
      },
    });
  });
}

/**
 * Move from pending to available (after hold period)
 */
export async function movePendingToAvailable(
  userId: number,
  amount: number,
  sourceId: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const profile = await tx.referralprofile.update({
      where: { userId },
      data: {
        pendingBalance: { decrement: amount },
        availableBalance: { increment: amount },
      },
    });

    await tx.referralwallettx.create({
      data: {
        userId,
        type: WalletTxType.COMMISSION,
        sourceType: "COMMISSION",
        sourceId,
        direction: WalletDirection.CREDIT,
        amount: new Prisma.Decimal(amount),
        balanceAfter: profile.availableBalance,
        status: "COMPLETED",
        description: "Commission hold period completed",
      },
    });
  });
}

/**
 * Debit available balance (cashout, convert to voucher/credit)
 * Returns false if insufficient balance.
 */
export async function debitAvailableBalance(
  userId: number,
  amount: number,
  type: string,
  sourceType: string,
  sourceId: number,
  description?: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.referralprofile.findUnique({
      where: { userId },
    });

    if (!profile || Number(profile.availableBalance) < amount) {
      return false;
    }

    const updated = await tx.referralprofile.update({
      where: { userId },
      data: { availableBalance: { decrement: amount } },
    });

    await tx.referralwallettx.create({
      data: {
        userId,
        type,
        sourceType,
        sourceId,
        direction: WalletDirection.DEBIT,
        amount: new Prisma.Decimal(amount),
        balanceAfter: updated.availableBalance,
        status: "COMPLETED",
        description,
      },
    });

    // Track withdrawn/converted separately
    if (type === WalletTxType.CASHOUT) {
      await tx.referralprofile.update({
        where: { userId },
        data: { withdrawnBalance: { increment: amount } },
      });
    } else if (type === WalletTxType.CONVERT_VOUCHER || type === WalletTxType.CONVERT_CREDIT) {
      await tx.referralprofile.update({
        where: { userId },
        data: { convertedBalance: { increment: amount } },
      });
    }

    return true;
  });
}
