/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * API: Claim check-in milestone voucher
 * Creates a unique random discount code per user per milestone
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/ratelimit";
import crypto from "crypto";

const CHECKIN_MILESTONES = [
    { points: 200, discountType: "FIXED", discountValue: 3, maxDiscount: 3, minOrderValue: 0, category: "shipping", description: "Miễn phí ship $3", descriptionEn: "Free shipping $3" },
    { points: 300, discountType: "PERCENTAGE", discountValue: 10, maxDiscount: 5, minOrderValue: 0, category: "checkin", description: "Giảm giá 10%, tối đa $5", descriptionEn: "10% off, max $5" },
    { points: 500, discountType: "PERCENTAGE", discountValue: 20, maxDiscount: 8, minOrderValue: 0, category: "checkin", description: "Giảm giá 20%, tối đa $8", descriptionEn: "20% off, max $8" },
    { points: 1000, discountType: "PERCENTAGE", discountValue: 40, maxDiscount: 10, minOrderValue: 0, category: "checkin", description: "Giảm giá 40%, tối đa $10", descriptionEn: "40% off, max $10" },
] as const;

function generateVoucherCode(milestonePoints: number): string {
    const random = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
    return `LF-${milestonePoints}-${random}`;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId) || userId <= 0) {
        return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    // Rate limit
    const rl = await applyRateLimit(`checkin-claim:${userId}`, null, { windowMs: 60000, maxRequests: 10 });
    if (!rl.success) return rl.error as unknown as NextResponse;

    try {
        const { milestonePoints } = await req.json();

        // Validate milestone exists
        const milestone = CHECKIN_MILESTONES.find((m) => m.points === milestonePoints);
        if (!milestone) {
            return NextResponse.json(
                { error: "Mốc thưởng không hợp lệ", errorEn: "Invalid milestone" },
                { status: 400 }
            );
        }

        // Check user has enough points
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if ((Number(user.points) || 0) < milestone.points) {
            return NextResponse.json(
                { error: "Bạn chưa đủ xu để nhận mốc thưởng này", errorEn: "Not enough points for this milestone" },
                { status: 400 }
            );
        }

        // Check if already claimed this milestone
        // We track by looking for uservoucher with coupon category matching `checkin-milestone-{points}`
        const existingClaim = await prisma.uservoucher.findFirst({
            where: {
                userId,
                coupon: {
                    category: `checkin-milestone-${milestone.points}`,
                },
            },
            select: { id: true, coupon: { select: { code: true } } },
        });

        if (existingClaim) {
            return NextResponse.json(
                {
                    error: "Bạn đã nhận mốc thưởng này rồi",
                    errorEn: "You have already claimed this milestone",
                    code: existingClaim.coupon.code,
                },
                { status: 400 }
            );
        }

        // Generate unique voucher code
        let code = generateVoucherCode(milestone.points);
        let attempts = 0;
        while (attempts < 5) {
            const exists = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
            if (!exists) break;
            code = generateVoucherCode(milestone.points);
            attempts++;
        }

        // Create coupon + claim in transaction
        const result = await prisma.$transaction(async (tx) => {
            const coupon = await tx.coupon.create({
                data: {
                    code,
                    discountType: milestone.discountType,
                    discountValue: milestone.discountValue,
                    minOrderValue: milestone.minOrderValue,
                    maxDiscount: milestone.maxDiscount,
                    startDate: new Date(),
                    endDate: new Date("2035-12-31T23:59:59.999Z"),
                    isActive: true,
                    usageLimit: 1,
                    usedCount: 0,
                    category: `checkin-milestone-${milestone.points}`,
                },
            });

            await tx.uservoucher.create({
                data: {
                    userId,
                    couponId: coupon.id,
                    status: "CLAIMED",
                },
            });

            await tx.notification.create({
                data: {
                    userId,
                    type: "VOUCHER",
                    title: `Nhận voucher mốc ${milestone.points} Xu thành công!`,
                    message: `Bạn đã nhận mã ${code} - ${milestone.description}. Sử dụng khi thanh toán.`,
                    link: "/profile/vouchers",
                },
            });

            return { coupon };
        });

        logger.info("Milestone voucher claimed", { userId: String(userId), milestonePoints, code });

        return NextResponse.json({
            success: true,
            code: result.coupon.code,
            discountType: milestone.discountType,
            discountValue: milestone.discountValue,
            maxDiscount: milestone.maxDiscount,
            description: milestone.description,
            descriptionEn: milestone.descriptionEn,
            message: `Nhận thành công mã ${code}!`,
            messageEn: `Successfully claimed code ${code}!`,
        });
    } catch (error) {
        logger.error("Claim milestone error", error as Error, { userId: String(userId) });
        return NextResponse.json({ error: "Lỗi hệ thống khi nhận voucher" }, { status: 500 });
    }
}
