/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * REF-001: Referral Velocity Limits
 *
 * Prevents referral abuse by limiting:
 * - Max 10 referrals/day per user
 * - Max 50 referrals/week per user
 * - Max 200 referrals/month per user
 */

import prisma from "@/lib/prisma";

interface VelocityResult {
    allowed: boolean;
    reason?: string;
    counts: {
        daily: number;
        weekly: number;
        monthly: number;
    };
}

const LIMITS = {
    DAILY: 10,
    WEEKLY: 50,
    MONTHLY: 200,
};

/**
 * Check if a referrer is within velocity limits
 */
export async function checkReferralVelocity(referrerUserId: number): Promise<VelocityResult> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [daily, weekly, monthly] = await Promise.all([
        prisma.referralrelation.count({
            where: {
                referrerUserId,
                createdAt: { gte: oneDayAgo },
            },
        }),
        prisma.referralrelation.count({
            where: {
                referrerUserId,
                createdAt: { gte: oneWeekAgo },
            },
        }),
        prisma.referralrelation.count({
            where: {
                referrerUserId,
                createdAt: { gte: oneMonthAgo },
            },
        }),
    ]);

    if (daily >= LIMITS.DAILY) {
        // Log fraud signal
        await logVelocityFraudSignal(referrerUserId, "DAILY_LIMIT", daily);
        return {
            allowed: false,
            reason: `Đã đạt giới hạn giới thiệu hàng ngày (${LIMITS.DAILY}/ngày)`,
            counts: { daily, weekly, monthly },
        };
    }

    if (weekly >= LIMITS.WEEKLY) {
        await logVelocityFraudSignal(referrerUserId, "WEEKLY_LIMIT", weekly);
        return {
            allowed: false,
            reason: `Đã đạt giới hạn giới thiệu hàng tuần (${LIMITS.WEEKLY}/tuần)`,
            counts: { daily, weekly, monthly },
        };
    }

    if (monthly >= LIMITS.MONTHLY) {
        await logVelocityFraudSignal(referrerUserId, "MONTHLY_LIMIT", monthly);
        return {
            allowed: false,
            reason: `Đã đạt giới hạn giới thiệu hàng tháng (${LIMITS.MONTHLY}/tháng)`,
            counts: { daily, weekly, monthly },
        };
    }

    return {
        allowed: true,
        counts: { daily, weekly, monthly },
    };
}

async function logVelocityFraudSignal(
    referrerUserId: number,
    limitType: string,
    count: number
): Promise<void> {
    try {
        await prisma.referralauditlog.create({
            data: {
                targetUserId: referrerUserId,
                action: "VELOCITY_LIMIT_HIT",
                entityType: "referral_velocity",
                afterData: JSON.stringify({ limitType, count }),
            },
        });
    } catch {
        // Non-critical
    }
}
