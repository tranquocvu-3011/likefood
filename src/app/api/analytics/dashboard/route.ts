/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { ORDER_STATUS, normalizeOrderStatus } from "@/lib/commerce";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

interface OrderGroupBy {
  productId: number;
  _sum: {
    quantity: number | null;
  };
}

const REVENUE_STATUSES = new Set<string>([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
]);

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(getRateLimitIdentifier(req), apiRateLimit, { windowMs: 60000, maxRequests: 20 });
  if (!rl.success) return rl.error!;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const end = endDate && !Number.isNaN(new Date(endDate).getTime())
      ? new Date(endDate)
      : new Date();
    const start = startDate && !Number.isNaN(new Date(startDate).getTime())
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (end.getTime() - start.getTime() > 366 * 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Khoang thoi gian khong the vuot qua 1 nam" },
        { status: 400 }
      );
    }

    const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));

    const [
      currentGroupBy,
      prevGroupBy,
      totalCustomers,
      prevCustomers,
      totalProducts,
      lowStockProducts,
      revenueByDayRaw,
      topProducts,
    ] = await Promise.all([
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: start, lte: end } },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: prevStart, lt: start } },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.user.count({
        where: { role: "USER", createdAt: { gte: start, lte: end } },
      }),
      prisma.user.count({
        where: { role: "USER", createdAt: { gte: prevStart, lt: start } },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { inventory: { lt: 10 } } }),
      prisma.$queryRaw<{ date: string; revenue: number }[]>`
        SELECT
          DATE_FORMAT(createdAt, '%Y-%m-%d') AS date,
          CAST(SUM(total) AS DECIMAL(15,2)) AS revenue
        FROM \`order\`
        WHERE createdAt >= ${start}
          AND createdAt <= ${end}
          AND status IN ('DELIVERED', 'COMPLETED')
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
        ORDER BY date ASC
      `,
      prisma.orderitem.groupBy({
        by: ["productId"],
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            status: { notIn: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED] },
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    let totalOrders = 0;
    let completedRevenue = 0;
    let pendingOrders = 0;
    let processingOrders = 0;
    let shippingOrders = 0;
    let deliveredOrders = 0;
    let completedOrdersCount = 0;
    let cancelledOrders = 0;

    for (const group of currentGroupBy) {
      const normalized = normalizeOrderStatus(group.status);
      const count = group._count._all;
      const revenue = group._sum.total ?? 0;

      totalOrders += count;
      if (REVENUE_STATUSES.has(normalized)) completedRevenue += revenue;
      if (normalized === ORDER_STATUS.PENDING) pendingOrders += count;
      else if (normalized === ORDER_STATUS.PROCESSING) processingOrders += count;
      else if (normalized === ORDER_STATUS.SHIPPING) shippingOrders += count;
      else if (normalized === ORDER_STATUS.DELIVERED) deliveredOrders += count;
      else if (normalized === ORDER_STATUS.COMPLETED) completedOrdersCount += count;
      else if (normalized === ORDER_STATUS.CANCELLED) cancelledOrders += count;
    }

    let prevOrdersCount = 0;
    let prevRevenue = 0;
    for (const group of prevGroupBy) {
      const normalized = normalizeOrderStatus(group.status);
      prevOrdersCount += group._count._all;
      if (REVENUE_STATUSES.has(normalized)) prevRevenue += group._sum.total ?? 0;
    }

    const revenueChange = prevRevenue > 0 ? ((completedRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersChange = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;
    const customersChange = prevCustomers > 0 ? ((totalCustomers - prevCustomers) / prevCustomers) * 100 : 0;

    const revenueMap = new Map<string, number>();
    for (const row of revenueByDayRaw) {
      revenueMap.set(row.date, Number(row.revenue));
    }

    const revenueByDay: { date: string; revenue: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateStr = cursor.toISOString().split("T")[0];
      revenueByDay.push({ date: dateStr, revenue: revenueMap.get(dateStr) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item: OrderGroupBy) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, image: true, slug: true },
        });

        return {
          ...product,
          quantitySold: item._sum.quantity || 0,
        };
      })
    );

    return NextResponse.json({
      revenue: {
        total: completedRevenue,
        change: revenueChange,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipping: shippingOrders,
        delivered: deliveredOrders,
        completed: completedOrdersCount,
        cancelled: cancelledOrders,
        change: ordersChange,
      },
      customers: {
        total: totalCustomers,
        change: customersChange,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      revenueByDay,
      topProducts: topProductsWithDetails,
    });
  } catch (error) {
    logger.error("Analytics fetch error", error as Error, { context: "analytics-dashboard-api" });
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
