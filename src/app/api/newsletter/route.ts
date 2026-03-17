/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { newsletterSchema } from "@/lib/validations/contact";
import prisma from "@/lib/prisma";
import { sendNewsletterWelcomeEmail } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const identifier = getRateLimitIdentifier(req);
        const rateLimit = await applyRateLimit(identifier, apiRateLimit);
        if (!rateLimit.success && rateLimit.error) {
            return rateLimit.error;
        }

        const body = await req.json();

        // Validate with Zod
        const validation = newsletterSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.issues.map(e => e.message).join(", ");
            return NextResponse.json({ error: errors || "Email không hợp lệ." }, { status: 400 });
        }

        const { email } = validation.data;
        const normalized = email.trim().toLowerCase();

        // Use dedicated DB table instead of JSON blob in systemsetting (prevents OOM)
        const existing = await prisma.newslettersubscriber.findUnique({
            where: { email: normalized },
        });

        if (existing) {
            return NextResponse.json({ ok: true, message: "Email đã được đăng ký trước đó." });
        }

        await prisma.newslettersubscriber.create({
            data: { email: normalized },
        });

        logger.info("[NEWSLETTER] New subscriber", { email: normalized });

        // Send welcome email (non-blocking — don't fail the response if mail fails)
        sendNewsletterWelcomeEmail(normalized).catch((err) =>
            logger.error("[NEWSLETTER] Welcome email failed", err as Error, { email: normalized })
        );

        return NextResponse.json({ ok: true, message: "Đăng ký thành công." });
    } catch (error) {
        logger.error("[NEWSLETTER] Subscribe failed", error as Error, { context: "newsletter" });
        return NextResponse.json({ error: "Có lỗi xảy ra, vui lòng thử lại." }, { status: 500 });
    }
}

