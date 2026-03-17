/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { applyRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { sendContactEmail } from "@/lib/mail";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { contactSchema } from "@/lib/validations/contact";
import { verifyTurnstileToken } from "@/lib/captcha";
import { notifyContactMessage } from "@/lib/telegram";

export async function POST(req: Request) {
    try {
        const identifier = getRateLimitIdentifier(req);
        const rateLimit = await applyRateLimit(identifier, null, { windowMs: 60 * 1000, maxRequests: 5 });

        if (!rateLimit.success && rateLimit.error) {
            return rateLimit.error;
        }

        const body = await req.json();

        // Validate with Zod
        const validation = contactSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.issues.map(e => e.message).join(", ");
            return NextResponse.json(
                { error: errors || "Dữ liệu không hợp lệ." },
                { status: 400 }
            );
        }

        const { name, email, phone, subject, message, turnstileToken } = validation.data;

        const captcha = await verifyTurnstileToken({ req, token: turnstileToken, action: "contact" });
        if (!captcha.ok) {
            return NextResponse.json({ error: captcha.message }, { status: 400 });
        }

        // 1. Lưu vào Database
        const contactMessage = await prisma.contactmessage.create({
            data: {
                name,
                email,
                phone: phone || null,
                subject,
                message,
            },
        });

        // 2. Gửi Email thông báo
        const result = await sendContactEmail({
            name,
            email,
            phone: phone || "",
            subject,
            message,
        });

        // Gửi thông báo Telegram (không block response)
        notifyContactMessage({ name, email, phone: phone || "", subject, message }).catch(() => {});

        if (!result.success) {
            logger.error(
                "Failed to send contact email notification",
                new Error(result.error || "Unknown contact mail error"),
                { context: "contact-email", contactId: contactMessage.id }
            );
            return NextResponse.json(
                { error: "Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                ok: true,
                message: "Cảm ơn bạn đã liên hệ! Chúng tôi đã nhận được tin nhắn và sẽ phản hồi sớm nhất có thể.",
                id: contactMessage.id
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error("Contact API error", error as Error, { context: "contact-api" });
        return NextResponse.json(
            { error: "Đã có lỗi xảy ra. Vui lòng thử lại sau." },
            { status: 500 }
        );
    }
}
