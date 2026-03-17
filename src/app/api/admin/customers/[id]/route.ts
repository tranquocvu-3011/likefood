/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { decryptForDisplay } from "@/lib/encryption";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const customer = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        createdAt: true,
        addresses: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            product: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        wishlists: {
          select: {
            id: true,
            product: { select: { name: true, image: true, price: true } },
          },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            wishlists: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [orders, orderAggregate, completedOrders] = await Promise.all([
      prisma.order.findMany({
        where: { userId: Number(id) },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          orderItems: {
            select: {
              quantity: true,
              product: { select: { name: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.order.aggregate({
        where: { userId: Number(id) },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.count({
        where: {
          userId: Number(id),
          status: { in: ["COMPLETED", "DELIVERED"] },
        },
      }),
    ]);

    const totalSpent = orderAggregate._sum.total || 0;
    const orderCount = orderAggregate._count.id || 0;
    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

    return NextResponse.json({
      ...customer,
      phone: decryptForDisplay(customer.phone),
      addresses: customer.addresses.map(addr => ({
        ...addr,
        phone: decryptForDisplay(addr.phone),
        address: decryptForDisplay(addr.address),
      })),
      orders: orders.map((order) => ({
        ...order,
        items: order.orderItems,
      })),
      totalSpent,
      completedOrders,
      avgOrderValue,
      _count: {
        ...customer._count,
        orders: orderCount,
      },
    });
  } catch (error) {
    logger.error("Customer detail error", error as Error, { context: "admin-customers-id-api" });
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}
