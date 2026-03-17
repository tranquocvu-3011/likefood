/**
 * LIKEFOOD - Admin Orders Export API
 * Export orders as CSV for reporting
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { decryptForDisplay } from "@/lib/encryption";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get("days") || "30", 10);
        const format = searchParams.get("format") || "csv";

        const since = new Date();
        since.setDate(since.getDate() - days);

        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: since } },
            include: {
                user: { select: { name: true, email: true } },
                orderItems: {
                    include: { product: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5000,
        });

        if (format === "json") {
            return NextResponse.json({ orders, total: orders.length });
        }

        // CSV format
        const csvRows: string[] = [];
        csvRows.push([
            "Order ID",
            "Date",
            "Customer Name",
            "Customer Email",
            "Status",
            "Payment Method",
            "Payment Status",
            "Subtotal",
            "Shipping Fee",
            "Discount",
            "Total",
            "Items Count",
            "Products",
            "Shipping Address",
            "Notes",
        ].join(","));

        for (const order of orders) {
            const products = order.orderItems
                .map((item) => `${item.product?.name || "Unknown"} x${item.quantity}`)
                .join(" | ");

            csvRows.push([
                `"${order.id}"`,
                `"${order.createdAt.toISOString()}"`,
                `"${order.user?.name || order.shippingPhone || "Guest"}"`,
                `"${order.user?.email || ""}"`,
                `"${order.status}"`,
                `"${order.paymentMethod || ""}"`,
                `"${order.paymentStatus || ""}"`,
                order.subtotal?.toString() || "0",
                order.shippingFee?.toString() || "0",
                order.discount?.toString() || "0",
                order.total.toString(),
                order.orderItems.length.toString(),
                `"${products.replace(/"/g, '""')}"`,
                `"${(decryptForDisplay(order.shippingAddress) || "").replace(/"/g, '""')}"`,
                `"${(order.notes || "").replace(/"/g, '""')}"`,
            ].join(","));
        }

        const csv = csvRows.join("\n");
        const response = new NextResponse(csv);
        response.headers.set("Content-Type", "text/csv; charset=utf-8");
        response.headers.set("Content-Disposition", `attachment; filename="likefood-orders-${days}d.csv"`);
        return response;
    } catch (error) {
        logger.error("Export orders error", error as Error);
        return NextResponse.json({ error: "Failed to export orders" }, { status: 500 });
    }
}
