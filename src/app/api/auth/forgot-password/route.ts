/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import { isValidEmailFormat } from "@/lib/validation";
import { loginRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { verifyTurnstileToken } from "@/lib/captcha";

export async function POST(req: Request) {
    try {
        const identifier = getRateLimitIdentifier(req);
        const rateResult = await applyRateLimit(identifier, loginRateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const { email, turnstileToken } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Vui lòng cung cấp email." },
                { status: 400 }
            );
        }

        if (!isValidEmailFormat(email)) {
            return NextResponse.json(
                { error: "Định dạng email không hợp lệ." },
                { status: 400 }
            );
        }

        const captcha = await verifyTurnstileToken({ req, token: turnstileToken, action: "auth_forgot_password" });
        if (!captcha.ok) {
            return NextResponse.json({ error: captcha.message }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Anti-enumeration: Luôn báo thành công
            return NextResponse.json(
                { message: "Nếu email tồn tại, hướng dẫn khôi phục đã được gửi." },
                { status: 200 }
            );
        }

        // Tạo mã OTP 6 ký tự (Chữ in hoa và số) cho đồng nhất
        const generateOTP = () => {
            const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let result = "";
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        const otp = generateOTP();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

        await prisma.verificationtoken.deleteMany({
            where: { identifier: email }
        });

        await prisma.verificationtoken.create({
            data: {
                identifier: email,
                token: otp,
                expires
            }
        });

        // Gửi email thật
        const emailResult = await sendVerificationEmail(email, otp, "PASSWORD_RESET");

        if (!emailResult.success) {
            logger.error(
                "[MAIL] Failed to send password reset email",
                new Error(emailResult.error || "Unknown mail error"),
                { context: "forgot-password", email }
            );
            return NextResponse.json(
                { error: "Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "Mã xác minh khôi phục mật khẩu đã được gửi đến email của bạn." },
            { status: 200 }
        );
    } catch (error) {
        logger.error("Forgot password error", error as Error, { context: "forgot-password" });
        return NextResponse.json(
            { error: "Đã có lỗi xảy ra." },
            { status: 500 }
        );
    }
}
