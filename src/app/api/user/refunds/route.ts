/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { Prisma } from "@/generated/client";
import { applyRateLimit, registerRateLimit } from "@/lib/ratelimit";

const createRefundSchema = z.object({
    orderId: z.string().min(1, "Mã đơn hàng không được để trống"),
    orderItemId: z.string().optional().nullable(),
    reason: z.string().min(10, "Lý do hoàn tiền phải có ít nhất 10 ký tự"),
    refundMethod: z.enum(["ORIGINAL", "BANK_TRANSFER"]).optional().default("ORIGINAL"),
    bankAccount: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
});

// GET - List user's refund requests
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const status = url.searchParams.get("status");
        let refPage = parseInt(url.searchParams.get("page") || "1");
        let refLimit = parseInt(url.searchParams.get("limit") || "20");
        if (isNaN(refPage) || refPage < 1) refPage = 1;
        if (isNaN(refLimit) || refLimit < 1 || refLimit > 50) refLimit = 20;
        const refSkip = (refPage - 1) * refLimit;

        const where: Prisma.refundrequestWhereInput = { userId: Number(session.user.id) };
        if (status && status !== "all") {
            where.status = status as Prisma.refundrequestWhereInput["status"];
        }

        const [refunds, total] = await prisma.$transaction([
            prisma.refundrequest.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            status: true,
                            total: true,
                            createdAt: true,
                            orderItems: {
                                include: {
                                    product: {
                                        select: {
                                            name: true,
                                            image: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                take: refLimit,
                skip: refSkip,
            }),
            prisma.refundrequest.count({ where }),
        ]);

        return NextResponse.json({ refunds, total, page: refPage, limit: refLimit });
    } catch (error) {
        logger.error("Refund list error", error as Error, { context: "user-refunds-api" });
        return NextResponse.json({ error: "Lỗi khi tải danh sách hoàn tiền" }, { status: 500 });
    }
}

// POST - Create new refund request
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    try {
        // Rate limit: 3 refund requests per hour per user
        const rl = await applyRateLimit(`refund:${session.user.id}`, registerRateLimit, { windowMs: 3600000, maxRequests: 3 });
        if (!rl.success) return rl.error as unknown as NextResponse;

        const body = await req.json();
        const validation = createRefundSchema.safeParse(body);

        if (!validation.success) {
            const firstError = validation.error.issues?.[0];
            return NextResponse.json(
                { error: firstError?.message || "Dữ liệu không hợp lệ" },
                { status: 400 }
            );
        }

        const { orderId, orderItemId, reason, refundMethod, bankAccount, bankName } = validation.data;

        // Verify order exists and belongs to user
        const order = await prisma.order.findFirst({
            where: {
                id: Number(orderId),
                userId: Number(session.user.id),
            },
            include: {
                orderItems: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Đơn hàng không tồn tại" }, { status: 404 });
        }

        // Check if order can be refunded
        if (order.status === "CANCELLED" || order.status === "REFUNDED") {
            return NextResponse.json({ error: "Đơn hàng đã được hủy hoặc hoàn tiền" }, { status: 400 });
        }

        // Check if there's already a pending refund request
        const existingRefund = await prisma.refundrequest.findFirst({
            where: {
                orderId: Number(orderId),
                status: "PENDING",
            },
        });

        if (existingRefund) {
            return NextResponse.json({ error: "Đơn hàng đã có yêu cầu hoàn tiền đang chờ xử lý" }, { status: 400 });
        }

        // Calculate refund amount
        let amount = order.total;
        if (orderItemId) {
            const orderItem = order.orderItems.find(item => String(item.id) === String(orderItemId));
            if (!orderItem) {
                return NextResponse.json({ error: "Sản phẩm không tồn tại trong đơn hàng" }, { status: 404 });
            }
            amount = orderItem.price * orderItem.quantity;
        }

        // Validate bank transfer details
        if (refundMethod === "BANK_TRANSFER") {
            if (!bankAccount || !bankName) {
                return NextResponse.json({ error: "Vui lòng cung cấp thông tin tài khoản ngân hàng" }, { status: 400 });
            }
        }

        // Create refund request
        const refund = await prisma.refundrequest.create({
            data: {
                orderId: Number(orderId),
                userId: Number(session.user.id),
                orderItemId: orderItemId ? Number(orderItemId) : null,
                reason,
                amount,
                refundMethod,
                bankAccount,
                bankName,
            },
        });

        // Create order event
        await prisma.orderevent.create({
            data: {
                orderId: Number(orderId),
                status: "REFUND_REQUESTED",
                note: `Yêu cầu hoàn tiền: ${reason}`,
            },
        });

        return NextResponse.json({
            message: "Yêu cầu hoàn tiền đã được gửi",
            refund,
        });
    } catch (error) {
        logger.error("Create refund error", error as Error, { context: "user-refunds-api" });
        return NextResponse.json({ error: "Lỗi khi tạo yêu cầu hoàn tiền" }, { status: 500 });
    }
}
