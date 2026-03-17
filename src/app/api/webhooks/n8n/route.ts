/**
 * LIKEFOOD — n8n Webhook API
 * ──────────────────────────
 * Endpoint để n8n gọi vào LIKEFOOD (trigger actions)
 * và LIKEFOOD gọi ra n8n (trigger workflows)
 * 
 * POST /api/webhooks/n8n — nhận webhook từ n8n
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { logger } from "@/lib/logger";
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || "n8n_webhook_secret_likefood_2026";

// ─── Verify webhook signature ────────────────────────────────

function verifyWebhook(req: NextRequest): boolean {
  const secret = req.headers.get("x-webhook-secret");
  return secret === WEBHOOK_SECRET;
}

// ─── POST: Nhận webhook từ n8n ───────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!verifyWebhook(req)) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      // n8n gửi → cập nhật trạng thái đơn hàng
      case "update_order_status": {
        const { orderId, status } = data;
        await prisma.order.update({
          where: { id: Number(orderId) },
          data: { status },
        });
        return NextResponse.json({ success: true, action: "order_updated" });
      }

      // n8n gửi → tạo notification cho user
      case "send_notification": {
        const { userId, title, message, type } = data;
        await prisma.notification.create({
          data: {
            userId: Number(userId),
            title,
            message,
            type: type || "SYSTEM",
            isRead: false,
          },
        });
        return NextResponse.json({ success: true, action: "notification_sent" });
      }

      // n8n gửi → cập nhật tồn kho
      case "update_inventory": {
        const { productId, inventory } = data;
        await prisma.product.update({
          where: { id: Number(productId) },
          data: { inventory: Number(inventory) },
        });
        return NextResponse.json({ success: true, action: "inventory_updated" });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    logger.error("[N8N_WEBHOOK] Error", error as Error, { context: "webhooks-n8n-api" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// ─── GET: Lấy data cho n8n ───────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    if (!verifyWebhook(req)) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    switch (type) {
      // n8n lấy đơn hàng mới (cho daily report)
      case "new_orders": {
        const since = url.searchParams.get("since") || new Date(Date.now() - 86400000).toISOString();
        const orders = await prisma.order.findMany({
          where: { createdAt: { gte: new Date(since) } },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        return NextResponse.json({ orders, count: orders.length });
      }

      // n8n lấy sản phẩm sắp hết hàng
      case "low_stock": {
        const threshold = Number(url.searchParams.get("threshold") || 10);
        const products = await prisma.product.findMany({
          where: { inventory: { lte: threshold }, isVisible: true, isDeleted: false },
          select: { id: true, name: true, slug: true, inventory: true, price: true },
          orderBy: { inventory: "asc" },
        });
        return NextResponse.json({ products, count: products.length });
      }

      // n8n lấy khách hàng bỏ giỏ hàng
      case "abandoned_carts": {
        const hoursAgo = Number(url.searchParams.get("hours") || 2);
        const cutoff = new Date(Date.now() - hoursAgo * 3600000);
        const carts = await prisma.cart.findMany({
          where: {
            updatedAt: { lte: cutoff },
            items: { some: {} },
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: {
              include: { product: { select: { name: true, price: true, salePrice: true } } },
            },
          },
          take: 50,
        });
        return NextResponse.json({ carts, count: carts.length });
      }

      // n8n lấy daily stats
      case "daily_stats": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [orderCount, revenue, newUsers] = await Promise.all([
          prisma.order.count({ where: { createdAt: { gte: today } } }),
          prisma.order.aggregate({
            where: { createdAt: { gte: today }, status: { in: ["DELIVERED", "COMPLETED", "CONFIRMED"] } },
            _sum: { total: true },
          }),
          prisma.user.count({ where: { createdAt: { gte: today } } }),
        ]);
        return NextResponse.json({
          date: today.toISOString().split("T")[0],
          orderCount,
          revenue: revenue._sum.total ?? 0,
          newUsers,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    logger.error("[N8N_WEBHOOK] GET Error", error as Error, { context: "webhooks-n8n-api" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
