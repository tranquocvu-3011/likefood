/**
 * LIKEFOOD - Points Redemption API
 * POST: Redeem points for a voucher at specified milestone
 * GET: Get available milestones and current points
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Point milestones and their corresponding voucher rewards
const POINT_MILESTONES = [
    {
        points: 200,
        discountType: "PERCENTAGE" as const,
        discountValue: 5,
        maxDiscount: 5,
        minOrderValue: 20,
        description: { vi: "Giảm 5% (tối đa $5)", en: "5% off (max $5)" },
    },
    {
        points: 300,
        discountType: "FIXED" as const,
        discountValue: 3,
        maxDiscount: null,
        minOrderValue: 15,
        description: { vi: "Giảm $3", en: "$3 off" },
    },
    {
        points: 500,
        discountType: "PERCENTAGE" as const,
        discountValue: 10,
        maxDiscount: 10,
        minOrderValue: 30,
        description: { vi: "Giảm 10% (tối đa $10)", en: "10% off (max $10)" },
    },
    {
        points: 1000,
        discountType: "FIXED" as const,
        discountValue: 15,
        maxDiscount: null,
        minOrderValue: 30,
        description: { vi: "Giảm $15", en: "$15 off" },
    },
];

function generateRedeemCode(milestone: number): string {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REWARD${milestone}-${rand}`;
}

// GET - Get current points + available milestones
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: { points: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get user's redemption history to show which milestones have been used recently
        const recentRedemptions = await prisma.pointtransaction.findMany({
            where: {
                userId: Number(session.user.id),
                type: "REDEEM",
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
            },
            select: { amount: true, createdAt: true, description: true },
            orderBy: { createdAt: "desc" },
        });

        const milestones = POINT_MILESTONES.map((m) => ({
            points: m.points,
            discountType: m.discountType,
            discountValue: m.discountValue,
            maxDiscount: m.maxDiscount,
            minOrderValue: m.minOrderValue,
            description: m.description,
            canRedeem: user.points >= m.points,
        }));

        return NextResponse.json({
            currentPoints: user.points,
            milestones,
            recentRedemptions,
        });
    } catch (error) {
        logger.error("Failed to get redemption info", error as Error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Redeem points for a voucher
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { milestonePoints } = body;

        // Validate milestone
        const milestone = POINT_MILESTONES.find((m) => m.points === milestonePoints);
        if (!milestone) {
            return NextResponse.json(
                { error: "Mốc điểm không hợp lệ" },
                { status: 400 }
            );
        }

        // Check user points
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: { points: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.points < milestone.points) {
            return NextResponse.json(
                { error: "Không đủ điểm để quy đổi" },
                { status: 400 }
            );
        }

        // Generate unique coupon code
        const code = generateRedeemCode(milestone.points);
        const now = new Date();
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

        // Transaction: deduct points + create coupon + assign to user
        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct points
            const updatedUser = await tx.user.update({
                where: { id: Number(session.user.id) },
                data: { points: { decrement: milestone.points } },
                select: { points: true },
            });

            // 2. Create coupon
            const coupon = await tx.coupon.create({
                data: {
                    code,
                    discountType: milestone.discountType,
                    discountValue: milestone.discountValue,
                    maxDiscount: milestone.maxDiscount,
                    minOrderValue: milestone.minOrderValue,
                    startDate: now,
                    endDate,
                    isActive: true,
                    usageLimit: 1,
                    category: "reward",
                },
            });

            // 3. Assign to user
            await tx.uservoucher.create({
                data: {
                    userId: Number(session.user.id),
                    couponId: coupon.id,
                    status: "CLAIMED",
                },
            });

            // 4. Record point transaction
            await tx.pointtransaction.create({
                data: {
                    userId: Number(session.user.id),
                    amount: -milestone.points,
                    type: "REDEEM",
                    description: `Quy đổi ${milestone.points} xu → Voucher ${code}`,
                },
            });

            return { coupon, remainingPoints: updatedUser.points };
        });

        return NextResponse.json({
            success: true,
            message: "Quy đổi thành công!",
            voucher: {
                code: result.coupon.code,
                discountType: result.coupon.discountType,
                discountValue: result.coupon.discountValue,
                maxDiscount: result.coupon.maxDiscount,
                expiresAt: endDate.toISOString(),
            },
            remainingPoints: result.remainingPoints,
        });
    } catch (error) {
        logger.error("Points redemption error", error as Error, { userId: String(Number(session.user.id))});
        return NextResponse.json(
            { error: "Lỗi hệ thống khi quy đổi điểm" },
            { status: 500 }
        );
    }
}
