/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import crypto from "crypto";
import { loginRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/captcha";
import { logger } from "@/lib/logger";

// POST /api/auth/magic-link — Gửi Magic Link đăng nhập
export async function POST(req: NextRequest) {
    try {
        const { email, turnstileToken } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
        }

        // Tích hợp chống Bruteforce/Spam Rate Limiting cho riêng Magic Link/OTP
        const identifier = getRateLimitIdentifier(req);
        const rateResult = await applyRateLimit(identifier, loginRateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const captcha = await verifyTurnstileToken({ req, token: turnstileToken, action: "auth_magic_link" });
        if (!captcha.ok) {
            return NextResponse.json({ error: captcha.message }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, email: true, emailVerified: true },
        });

        // Anti-enumeration: luôn trả về thành công
        if (!user || !user.emailVerified) {
            return NextResponse.json({ message: "Nếu email tồn tại, link đăng nhập đã được gửi." });
        }

        // Tạo token an toàn
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

        // Xóa old tokens, lưu mới vào verificationtoken
        await prisma.verificationtoken.deleteMany({
            where: { identifier: `magic:${user.id}` },
        });
        await prisma.verificationtoken.create({
            data: {
                identifier: `magic:${user.id}`,
                token: token,
                expires,
            },
        });

        const magicUrl = `${process.env.NEXTAUTH_URL}/api/auth/magic-link/confirm?token=${token}&email=${encodeURIComponent(email)}`;

        const emailResult = await sendVerificationEmail(email, token, "MAGIC_LINK", magicUrl);
        
        if (!emailResult.success) {
            logger.error(`[magic-link] Failed to send email: ${emailResult.error}`);
            return NextResponse.json(
                { error: "Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP." },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Link đăng nhập đã được gửi vào email của bạn." });
    } catch (error) {
        const _message = error instanceof Error ? error.message : String(error);
        logger.error("[magic-link] Error", error as Error, { context: "auth-magic-link" });
        return NextResponse.json(
            { error: "Lỗi server. Kiểm tra cấu hình SMTP và env." },
            { status: 500 }
        );
    }
}
