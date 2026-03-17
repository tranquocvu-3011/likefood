/**
 * LIKEFOOD - Admin Order Cleanup API
 * Cleanup unpaid orders (no inventory restore needed since inventory is only deducted after payment)
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Hours after which unpaid orders are cancelled
const UNPAID_ORDER_TIMEOUT_HOURS = 24;

/**
 * POST - Run cleanup manually (admin only)
 * Note: We do NOT restore inventory for unpaid orders because:
 * - Inventory is only deducted AFTER successful payment (in webhook)
 * - Unpaid orders never had their inventory deducted
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const hours = body.hours || UNPAID_ORDER_TIMEOUT_HOURS;
    
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Find unpaid orders older than cutoff
    const unpaidOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        paymentStatus: { in: ["UNPAID", "PENDING"] },
        createdAt: { lt: cutoffDate },
      },
      include: {
        orderItems: true,
      },
    });

    if (unpaidOrders.length === 0) {
      return NextResponse.json({
        message: "No unpaid orders to clean up",
        cleaned: 0,
      });
    }

    // Process each order
    let cleaned = 0;
    for (const order of unpaidOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Cancel the order (no inventory restore needed for unpaid orders)
          // Inventory is only deducted in webhook AFTER successful payment
          await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });

          // Add event log
          await tx.orderevent.create({
            data: {
              orderId: order.id,
              status: "CANCELLED",
              note: `Auto-cancelled due to unpaid after ${hours} hours`,
            },
          });
        });

        cleaned++;
        logger.info(`[CLEANUP] Cancelled unpaid order ${order.id}`);
      } catch (orderError) {
        logger.error(`[CLEANUP] Failed to cancel order ${order.id}`, orderError as Error);
      }
    }

    return NextResponse.json({
      message: `Cleaned up ${cleaned} unpaid orders`,
      cleaned,
      totalFound: unpaidOrders.length,
    });
  } catch (error) {
    logger.error("Order cleanup error", error as Error, { context: "cleanup-api" });
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

/**
 * GET - Get cleanup status and info
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hours = UNPAID_ORDER_TIMEOUT_HOURS;
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const unpaidCount = await prisma.order.count({
      where: {
        status: "PENDING",
        paymentStatus: { in: ["UNPAID", "PENDING"] },
        createdAt: { lt: cutoffDate },
      },
    });

    const totalPending = await prisma.order.count({
      where: {
        status: "PENDING",
        paymentStatus: { in: ["UNPAID", "PENDING"] },
      },
    });

    return NextResponse.json({
      unpaidTimeoutHours: hours,
      cutoffDate: cutoffDate.toISOString(),
      unpaidOrdersOlderThanCutoff: unpaidCount,
      totalPendingOrders: totalPending,
    });
  } catch (error) {
    logger.error("Cleanup status error", error as Error, { context: "cleanup-status" });
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
