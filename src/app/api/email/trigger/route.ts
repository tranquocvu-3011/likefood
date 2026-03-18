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
import { sendEmail } from "@/lib/email/send";

type EmailType = 
  | "welcome"
  | "abandoned_cart"
  | "order_confirmation"
  | "shipping_notification"
  | "delivery_complete"
  | "review_request"
  | "re_engagement"
  | "win_back"
  | "flash_sale";

interface EmailTriggerBody {
  type: EmailType;
  userId?: string;
  email?: string;
  data?: Record<string, unknown>;
}

function buildEmailBody(
  type: EmailType,
  language: "vi" | "en",
  data?: Record<string, unknown>,
  recipientName?: string
): string {
  const name = recipientName || (language === "vi" ? "Bạn" : "you");
  const greeting = language === "vi" ? `Xin chào ${name},` : `Hello ${name},`;
  const signOff = language === "vi" ? "Trân trọng,\nĐội ngũ LIKEFOOD" : "Best regards,\nThe LIKEFOOD Team";
  let body = "";
  if (type === "welcome") {
    body =
      language === "vi"
        ? "Chào mừng bạn đã đến với LIKEFOOD! Chúng tôi rất vui được đồng hành cùng bạn khám phá đặc sản Việt."
        : "Welcome to LIKEFOOD! We're excited to help you explore Vietnamese specialty foods.";
  } else if (type === "abandoned_cart") {
    body =
      language === "vi"
        ? "Bạn có sản phẩm đang chờ trong giỏ. Hoàn tất đơn hàng để không bỏ lỡ ưu đãi."
        : "You have items waiting in your cart. Complete your order so you don't miss out.";
  } else {
    body =
      language === "vi"
        ? "Cảm ơn bạn đã quan tâm đến LIKEFOOD. Nếu cần hỗ trợ, hãy liên hệ tranquocvu3011@gmail.com."
        : "Thank you for your interest in LIKEFOOD. For support, contact tranquocvu3011@gmail.com.";
  }
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;"><p>${greeting}</p><p>${body}</p><p>${signOff}</p></body></html>`;
}

const EMAIL_TEMPLATES: Record<EmailType, { subject: { vi: string; en: string }; templateKey: string }> = {
  welcome: {
    subject: { vi: "Chào mừng đến với LIKEFOOD!", en: "Welcome to LIKEFOOD!" },
    templateKey: "welcome_email",
  },
  abandoned_cart: {
    subject: { vi: "Bạn quên gì đó trong giỏ hàng!", en: "You forgot something in your cart!" },
    templateKey: "abandoned_cart",
  },
  order_confirmation: {
    subject: { vi: "Xác nhận đơn hàng #ORDER_ID", en: "Order Confirmation #ORDER_ID" },
    templateKey: "order_confirmation",
  },
  shipping_notification: {
    subject: { vi: "Đơn hàng của bạn đang được giao!", en: "Your order is on the way!" },
    templateKey: "shipping_notification",
  },
  delivery_complete: {
    subject: { vi: "Đơn hàng đã giao thành công!", en: "Order delivered successfully!" },
    templateKey: "delivery_complete",
  },
  review_request: {
    subject: { vi: "Đánh giá sản phẩm bạn đã mua", en: "Review your purchased products" },
    templateKey: "review_request",
  },
  re_engagement: {
    subject: { vi: "Chúng tôi nhớ bạn!", en: "We miss you!" },
    templateKey: "re_engagement",
  },
  win_back: {
    subject: { vi: "Quay lại với ưu đãi đặc biệt!", en: "Come back with a special offer!" },
    templateKey: "win_back",
  },
  flash_sale: {
    subject: { vi: "Flash Sale bắt đầu rồi!", en: "Flash Sale is live now!" },
    templateKey: "flash_sale",
  },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body: EmailTriggerBody = await req.json();
    const { type, userId, email, data } = body;

    if (!type || !EMAIL_TEMPLATES[type]) {
      return NextResponse.json(
        { error: `Invalid email type: ${type}` },
        { status: 400 }
      );
    }

    let recipientEmail = email;
    let recipientName = "";

    if (userId && !recipientEmail) {
      const user = await prisma.user.findUnique({
        where: { id: Number(userId)},
        select: { email: true, name: true },
      });

      if (!user || !user.email) {
        return NextResponse.json(
          { error: "User not found or no email" },
          { status: 404 }
        );
      }

      recipientEmail = user.email;
      recipientName = user.name || "";
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Missing required field: email or userId" },
        { status: 400 }
      );
    }

    const template = EMAIL_TEMPLATES[type];
    const language = recipientEmail.includes(".vn") || !recipientEmail.includes("@") ? "vi" : "en";

    // Create email record in database
    const emailRecord = await prisma.emailqueue.create({
      data: {
        userId: userId ? Number(userId) : null,
        email: recipientEmail,
        subject: template.subject[language],
        templateKey: template.templateKey,
        data: data !== undefined ? JSON.stringify(data) : undefined,
        status: "PENDING",
        priority: type === "abandoned_cart" || type === "win_back" ? "HIGH" : "NORMAL",
        scheduledAt: new Date(),
      },
    });

    // Gửi email ngay nếu đã cấu hình SMTP (Nodemailer)
    const bodyHtml = buildEmailBody(type, language, data, recipientName);
    const result = await sendEmail({
      to: recipientEmail,
      subject: template.subject[language],
      html: bodyHtml,
      text: bodyHtml.replace(/<[^>]*>/g, "").trim(),
    });
    if (result.success) {
      await prisma.emailqueue.update({
        where: { id: emailRecord.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } else {
      logger.warn(`Email queue ${emailRecord.id} created but send failed`, { error: result.error, context: "email-trigger" });
    }

    return NextResponse.json({
      success: true,
      messageId: emailRecord.id,
      type,
      recipient: recipientEmail,
    });
  } catch (error) {
    logger.error("Error triggering email", error as Error, { context: "email-trigger-api" });
    return NextResponse.json(
      { error: "Failed to trigger email" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const emails = await prisma.emailqueue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    });
  } catch (error) {
    logger.error("Error fetching emails", error as Error, { context: "email-trigger-api" });
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
