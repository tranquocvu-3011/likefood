/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * REF-002: Cashout Approval Workflow
 *
 * Enforces manual admin approval for cashouts above threshold.
 * Small cashouts auto-approved, large ones require admin review.
 */

import prisma from "@/lib/prisma";

const AUTO_APPROVE_THRESHOLD_USD = 50;

export interface CashoutRequest {
    userId: number;
    amount: number;
    method: string;
    destinationData: string;
}

export interface CashoutResult {
    success: boolean;
    status: "AUTO_APPROVED" | "PENDING_APPROVAL" | "REJECTED";
    message: string;
    cashoutId?: string;
}

/**
 * Process a cashout request with approval workflow
 */
export async function processCashoutRequest(request: CashoutRequest): Promise<CashoutResult> {
    // Verify wallet balance
    const profile = await prisma.referralprofile.findUnique({
        where: { userId: request.userId },
        select: { availableBalance: true, fraudScore: true },
    });

    if (!profile) {
        return { success: false, status: "REJECTED", message: "Referral profile not found" };
    }

    if (Number(profile.availableBalance) < request.amount) {
        return { success: false, status: "REJECTED", message: "Insufficient wallet balance" };
    }

    // High fraud score → always require approval
    if (profile.fraudScore > 50) {
        return createPendingCashout(request, "HIGH_FRAUD_SCORE");
    }

    // Amount check
    if (request.amount <= AUTO_APPROVE_THRESHOLD_USD) {
        return autoApproveCashout(request);
    }

    // Large amount → pending approval
    return createPendingCashout(request, "AMOUNT_EXCEEDS_THRESHOLD");
}

async function autoApproveCashout(request: CashoutRequest): Promise<CashoutResult> {
    const cashout = await prisma.$transaction(async (tx) => {
        // Deduct from wallet
        await tx.referralprofile.update({
            where: { userId: request.userId },
            data: { availableBalance: { decrement: request.amount } },
        });

        // Create approved cashout record
        return tx.referralcashout.create({
            data: {
                userId: request.userId,
                amount: request.amount,
                status: "APPROVED",
                method: request.method,
                destinationData: request.destinationData,
                processedAt: new Date(),
            },
        });
    });

    // Audit log
    await prisma.referralauditlog.create({
        data: {
            targetUserId: request.userId,
            action: "CASHOUT_AUTO_APPROVED",
            entityType: "referralcashout",
            entityId: cashout.id,
            afterData: JSON.stringify({ amount: request.amount }),
        },
    }).catch(() => {});

    return {
        success: true,
        status: "AUTO_APPROVED",
        message: `Cashout $${request.amount} đã được tự động duyệt`,
        cashoutId: String(cashout.id),
    };
}

async function createPendingCashout(
    request: CashoutRequest,
    reason: string
): Promise<CashoutResult> {
    const cashout = await prisma.referralcashout.create({
        data: {
            userId: request.userId,
            amount: request.amount,
            status: "PENDING",
            method: request.method,
            destinationData: request.destinationData,
        },
    });

    // Audit log
    await prisma.referralauditlog.create({
        data: {
            targetUserId: request.userId,
            action: "CASHOUT_PENDING_APPROVAL",
            entityType: "referralcashout",
            entityId: cashout.id,
            afterData: JSON.stringify({ amount: request.amount, reason }),
        },
    }).catch(() => {});

    // Create admin notification
    await prisma.notification.create({
        data: {
            userId: request.userId, // Will be overridden to admin
            type: "system",
            title: "💰 Cashout yêu cầu duyệt",
            message: `Yêu cầu rút $${request.amount} cần admin duyệt. Lý do: ${reason}`,
            link: "/admin/referrals/cashouts",
        },
    }).catch(() => {});

    return {
        success: true,
        status: "PENDING_APPROVAL",
        message: `Yêu cầu rút $${request.amount} đang chờ admin duyệt`,
        cashoutId: String(cashout.id),
    };
}
