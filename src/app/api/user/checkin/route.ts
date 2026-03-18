/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/ratelimit";

const CHECKIN_MILESTONES = [
    { points: 200, code: "CHECKIN-200", discountType: "FIXED", discountValue: 3, maxDiscount: 3, minOrderValue: 0, category: "shipping", description: "Miễn phí ship $3", descriptionEn: "Free shipping $3" },
    { points: 300, code: "CHECKIN-300", discountType: "PERCENTAGE", discountValue: 10, maxDiscount: 5, minOrderValue: 0, category: "checkin", description: "Giảm giá 10%, tối đa $5", descriptionEn: "10% off, max $5" },
    { points: 500, code: "CHECKIN-500", discountType: "PERCENTAGE", discountValue: 20, maxDiscount: 8, minOrderValue: 0, category: "checkin", description: "Giảm giá 20%, tối đa $8", descriptionEn: "20% off, max $8" },
    { points: 1000, code: "CHECKIN-1000", discountType: "PERCENTAGE", discountValue: 40, maxDiscount: 10, minOrderValue: 0, category: "checkin", description: "Giảm giá 40%, tối đa $10", descriptionEn: "40% off, max $10" },
] as const;

// Points per day: Mon-Fri = 10, Sat = 20, Sun = 50
const DAILY_POINTS = [10, 10, 10, 10, 10, 20, 50]; // index 0=Mon...6=Sun

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sessionUserId = Number(session.user.id);
    if (!Number.isInteger(sessionUserId) || sessionUserId <= 0) {
        return NextResponse.json({ error: "Invalid session user id" }, { status: 400 });
    }
    // Rate limit: per-user, 20 requests/minute (tránh "Quá nhiều yêu cầu" khi điểm danh)
    const identifier = `checkin:${sessionUserId}`;
    const rl = await applyRateLimit(identifier, null, { windowMs: 60000, maxRequests: 20 });
    if (!rl.success) return rl.error as unknown as NextResponse;

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = sessionUserId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastCheckIn: true, points: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const now = new Date();
        const lastCheckIn = user.lastCheckIn;

        // Check if already checked in today (Vietnamese timezone UTC+7)
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const todayVN = nowVN.toISOString().slice(0, 10);
        if (lastCheckIn) {
            const lastVN = new Date(lastCheckIn.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
            if (todayVN === lastVN) {
                return NextResponse.json({
                    error: "Bạn đã điểm danh hôm nay rồi!",
                    alreadyCheckedIn: true,
                }, { status: 400 });
            }
        }

        // Points logic: Variable based on day (Mon-Fri=10, Sat=20, Sun=50)
        const vnNowForPoints = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const vnDayOfWeek = vnNowForPoints.getUTCDay(); // 0=Sun, 1=Mon...
        const dayIdx = vnDayOfWeek === 0 ? 6 : vnDayOfWeek - 1; // 0=Mon...6=Sun
        const pointsToEarn = DAILY_POINTS[dayIdx] ?? 10;

        const updatedUser = await prisma.$transaction(async (tx) => {
            const u = await tx.user.update({
                where: { id: userId },
                data: {
                    points: { increment: pointsToEarn },
                    lastCheckIn: now
                }
            });

            await tx.pointtransaction.create({
                data: {
                    userId,
                    amount: pointsToEarn,
                    type: "EARN",
                    description: "Điểm danh hàng ngày",
                }
            });

            return u;
        });

        // Check which milestones are claimed (user must manually claim via /api/user/checkin/claim)
        const claimedMilestoneVouchers = await prisma.uservoucher.findMany({
            where: {
                userId,
                coupon: {
                    category: {
                        in: CHECKIN_MILESTONES.map((m) => `checkin-milestone-${m.points}`),
                    },
                },
            },
            select: { coupon: { select: { category: true } } },
        });
        const claimedCategories = new Set(claimedMilestoneVouchers.map((v) => v.coupon.category));

        // Also check legacy claims (old code-based system)
        const legacyCoupons = await prisma.coupon.findMany({
            where: { code: { in: CHECKIN_MILESTONES.map((m) => m.code) } },
            select: { id: true, code: true },
        });
        const legacyCodeMap = new Map(legacyCoupons.map((c) => [c.code, c.id]));
        const legacyClaimed = new Set(
            (await prisma.uservoucher.findMany({
                where: { userId, couponId: { in: legacyCoupons.map((c) => c.id) } },
                select: { couponId: true },
            })).map((r) => r.couponId)
        );

        const currentPoints = Number(updatedUser.points) || 0;
        const milestoneStatuses = CHECKIN_MILESTONES.map((milestone) => {
            const legacyId = legacyCodeMap.get(milestone.code);
            const isClaimed = claimedCategories.has(`checkin-milestone-${milestone.points}`) ||
                (legacyId ? legacyClaimed.has(legacyId) : false);
            return {
                points: milestone.points,
                code: milestone.code,
                discountType: milestone.discountType,
                discountValue: milestone.discountValue,
                maxDiscount: milestone.maxDiscount,
                category: milestone.category,
                description: milestone.description,
                descriptionEn: milestone.descriptionEn,
                reached: currentPoints >= milestone.points,
                claimed: isClaimed,
            };
        });

        return NextResponse.json({
            message: "Điểm danh thành công!",
            earned: pointsToEarn,
            totalPoints: currentPoints,
            lastCheckIn: updatedUser.lastCheckIn,
            milestones: milestoneStatuses,
        });

    } catch (_error) {
        logger.error("Check-in error", _error as Error, { userId: String(sessionUserId) });
        return NextResponse.json({ error: "Lỗi hệ thống khi điểm danh" }, { status: 500 });
    }
}

export async function GET(_req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sessionUserId = Number(session.user.id);
    if (!Number.isInteger(sessionUserId) || sessionUserId <= 0) {
        return NextResponse.json({ error: "Invalid session user id" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: sessionUserId },
            select: { lastCheckIn: true, points: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let canCheckIn = true;
        if (user.lastCheckIn) {
            const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
            const todayVN = nowVN.toISOString().slice(0, 10);
            const lastVN = new Date(user.lastCheckIn.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
            canCheckIn = todayVN !== lastVN;
        }

        // Calculate the Monday of the current week (UTC+7 Vietnam time)
        const now = new Date();
        const vnOffset = 7 * 60 * 60 * 1000;
        const vnNow = new Date(now.getTime() + vnOffset);
        const vnDow = vnNow.getUTCDay(); // 0=Sun, 1=Mon...
        const daysToMonday = vnDow === 0 ? 6 : vnDow - 1;
        const mondayVN = new Date(vnNow);
        mondayVN.setUTCDate(vnNow.getUTCDate() - daysToMonday);
        mondayVN.setUTCHours(0, 0, 0, 0);
        // Convert back to UTC for DB query
        const mondayUTC = new Date(mondayVN.getTime() - vnOffset);

        // Get all daily check-in transactions this week
        const weekCheckIns = await prisma.pointtransaction.findMany({
            where: {
                userId: sessionUserId,
                type: "EARN",
                description: "Điểm danh hàng ngày",
                createdAt: { gte: mondayUTC },
            },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        // Map each check-in to a day index (0=Mon ... 6=Sun) in Vietnam timezone
        const checkedDaysThisWeek: number[] = weekCheckIns.map((t) => {
            const vnDate = new Date(t.createdAt.getTime() + vnOffset);
            const dow = vnDate.getUTCDay(); // 0=Sun, 1=Mon...
            return dow === 0 ? 6 : dow - 1; // 0=Mon...6=Sun
        });

        // Check claimed milestones (new system: category-based)
        const claimedMilestoneVouchers = await prisma.uservoucher.findMany({
            where: {
                userId: sessionUserId,
                coupon: {
                    category: {
                        in: CHECKIN_MILESTONES.map((m) => `checkin-milestone-${m.points}`),
                    },
                },
            },
            select: { coupon: { select: { category: true } } },
        });
        const claimedCategories = new Set(claimedMilestoneVouchers.map((v) => v.coupon.category));

        // Also check legacy claims (old code-based system for backward compat)
        const legacyCoupons = await prisma.coupon.findMany({
            where: { code: { in: CHECKIN_MILESTONES.map((m) => m.code) } },
            select: { id: true, code: true },
        });
        const legacyCodeMap = new Map(legacyCoupons.map((c) => [c.code, c.id]));
        const legacyClaimed = new Set(
            (await prisma.uservoucher.findMany({
                where: { userId: sessionUserId, couponId: { in: legacyCoupons.map((c) => c.id) } },
                select: { couponId: true },
            })).map((r) => r.couponId)
        );

        const currentPoints = Number(user.points) || 0;
        const milestones = CHECKIN_MILESTONES.map((milestone) => {
            const reached = currentPoints >= milestone.points;
            const legacyId = legacyCodeMap.get(milestone.code);
            const isClaimed = claimedCategories.has(`checkin-milestone-${milestone.points}`) ||
                (legacyId ? legacyClaimed.has(legacyId) : false);
            return {
                points: milestone.points,
                code: milestone.code,
                discountType: milestone.discountType,
                discountValue: milestone.discountValue,
                maxDiscount: milestone.maxDiscount,
                category: milestone.category,
                description: milestone.description,
                descriptionEn: milestone.descriptionEn,
                reached,
                claimed: isClaimed,
            };
        });

        return NextResponse.json({
            points: currentPoints,
            lastCheckIn: user.lastCheckIn,
            canCheckIn,
            checkedDaysThisWeek,
            milestones,
        });
    } catch (_error) {
        return NextResponse.json({ error: "Failed to fetch check-in status" }, { status: 500 });
    }
}
