/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { decryptForDisplay } from "@/lib/encryption";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // "orders" or "customers"

        if (type === "orders") {
            const orders = await prisma.order.findMany({
                take: 10000,
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    subtotal: true,
                    shippingFee: true,
                    discount: true,
                    total: true,
                    couponCode: true,
                    shippingAddress: true,
                    shippingCity: true,
                    shippingZipCode: true,
                    shippingPhone: true,
                    shippingMethod: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            });

            const headers = [
                "ID", "User ID", "Trạng thái", "Tạm tính", "Phí ship", "Giảm giá",
                "Tổng", "Mã coupon", "Địa chỉ", "Thành phố", "Zip", "SĐT",
                "Vận chuyển", "Thanh toán", "TT Thanh toán", "Ngày tạo"
            ];

            const rows = orders.map(o => [
                o.id,
                o.userId,
                o.status,
                o.subtotal,
                o.shippingFee,
                o.discount,
                o.total,
                o.couponCode || "",
                decryptForDisplay(o.shippingAddress),
                o.shippingCity || "",
                o.shippingZipCode || "",
                decryptForDisplay(o.shippingPhone),
                o.shippingMethod || "",
                o.paymentMethod || "",
                o.paymentStatus,
                new Date(o.createdAt).toLocaleString("vi-VN"),
            ]);

            const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");

            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="orders_${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        }

        if (type === "customers") {
            const users = await prisma.user.findMany({
                where: { role: "USER" },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    createdAt: true,
                    _count: { select: { reviews: true, wishlists: true } },
                },
                orderBy: { createdAt: "desc" },
            });

            // Get order stats for each user
            const userIds = users.map(u => u.id);
            const orderStats = await prisma.order.groupBy({
                by: ["userId"],
                where: { userId: { in: userIds } },
                _count: true,
                _sum: { total: true },
            });

            const statsMap = new Map(orderStats.map(s => [s.userId, { count: s._count, total: s._sum.total || 0 }]));

            const headers = ["ID", "Email", "Tên", "SĐT", "Đơn hàng", "Tổng chi tiêu", "Đánh giá", "Yêu thích", "Ngày tạo"];

            const rows = users.map(u => {
                const stats = statsMap.get(u.id) || { count: 0, total: 0 };
                return [
                    u.id,
                    u.email,
                    u.name || "",
                    decryptForDisplay(u.phone),
                    stats.count,
                    stats.total,
                    u._count.reviews,
                    u._count.wishlists,
                    new Date(u.createdAt).toLocaleString("vi-VN"),
                ];
            });

            const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");

            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="customers_${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        }

        return NextResponse.json({ error: "Invalid type. Use ?type=orders or ?type=customers" }, { status: 400 });
    } catch (error) {
        logger.error("Export error", error as Error, { context: "admin-export-api" });
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}
