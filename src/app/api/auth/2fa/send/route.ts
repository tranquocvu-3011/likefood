/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import { loginRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

// POST /api/auth/2fa/send — Gửi OTP 2FA
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const identifier = getRateLimitIdentifier(req);
        const rateResult = await applyRateLimit(identifier, loginRateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, twoFactorEnabled: true },
        });

        if (!user) {
            // Anti-enumeration: không lộ user không tồn tại
            return NextResponse.json({ message: "OTP đã được gửi nếu tài khoản tồn tại" });
        }

        // Tạo OTP 6 chữ số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        // Xóa token cũ, lưu token mới
        await prisma.twofactortoken.deleteMany({ where: { userId: user.id } });
        await prisma.twofactortoken.create({
            data: { userId: user.id, token: otp, expires },
        });

        // Gửi email OTP
        const emailResult = await sendVerificationEmail(email, otp, "2FA");
        
        if (!emailResult.success) {
            logger.error(
                "[2FA] Failed to send email",
                new Error(emailResult.error || "Unknown email error"),
                { context: "2fa-send", email }
            );
            return NextResponse.json({ error: "Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP." }, { status: 500 });
        }

        return NextResponse.json({ message: "OTP đã được gửi" });
    } catch (error) {
        logger.error("2FA send error", error as Error, { context: "2fa-send" });
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}
