/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import { isValidEmailFormat, isDisposableEmail, isStrongPassword } from "@/lib/validation";
import { hasMXRecord } from "@/lib/validation-server";
import { registerRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { verifyTurnstileToken } from "@/lib/captcha";
import { notifyNewRegistration } from "@/lib/telegram";

export async function POST(req: Request) {
    try {
        const identifier = getRateLimitIdentifier(req);
        const rateResult = await applyRateLimit(identifier, registerRateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const { email, password, name, phone, referralCode, turnstileToken } = await req.json();

        if (!email || !password || !name || !phone) {
            return NextResponse.json(
                { error: "Vui lòng nhập đầy đủ thông tin." },
                { status: 400 }
            );
        }

        const captcha = await verifyTurnstileToken({ req, token: turnstileToken, action: "auth_register" });
        if (!captcha.ok) {
            return NextResponse.json({ error: captcha.message }, { status: 400 });
        }

        // --- NEW VALIDATION ---
        if (!isValidEmailFormat(email)) {
            return NextResponse.json(
                { error: "Định dạng email không hợp lệ." },
                { status: 400 }
            );
        }

        if (isDisposableEmail(email)) {
            return NextResponse.json(
                { error: "Chúng tôi không chấp nhận dịch vụ email rác. Vui lòng dùng email thật." },
                { status: 400 }
            );
        }

        const mxExists = await hasMXRecord(email);
        if (!mxExists) {
            return NextResponse.json(
                { error: "Email này không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại." },
                { status: 400 }
            );
        }
        if (!isStrongPassword(password)) {
            return NextResponse.json(
                { error: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt." },
                { status: 400 }
            );
        }

        // --- END NEW VALIDATION ---

        // Ràng buộc độ dài số điện thoại cơ bản ở Backend
        if (phone.length < 9 || phone.length > 13) {
            return NextResponse.json(
                { error: "Số điện thoại không hợp lệ." },
                { status: 400 }
            );
        }

        // Check if user already exists
        // Check BOTH email and phone in the same query to prevent enumeration
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phone: { contains: phone.replace(/\D/g, "").slice(-9) } }
                ]
            }
        });

        // Return GENERIC message for BOTH cases to prevent user enumeration
        // Never reveal whether it's email or phone that exists
        if (existingUser) {
            return NextResponse.json(
                { error: "Tài khoản đã tồn tại. Vui lòng đăng nhập hoặc khôi phục mật khẩu." },
                { status: 200 } // Return 200 to not reveal that account exists
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                role: "USER"
            }
        });

        // Process referral code (non-blocking, don't fail registration)
        if (referralCode && typeof referralCode === "string" && referralCode.trim()) {
            try {
                const code = referralCode.trim().toUpperCase();
                const referrerProfile = await prisma.referralprofile.findFirst({
                    where: {
                        OR: [
                            { customCode: code },
                            { systemCode: code },
                        ],
                        isLocked: false,
                    },
                });
                if (referrerProfile && referrerProfile.userId !== newUser.id) {
                    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
                    const ua = req.headers.get("user-agent") || "";
                    await prisma.$transaction([
                        prisma.referralrelation.create({
                            data: {
                                referrerUserId: referrerProfile.userId,
                                referredUserId: newUser.id,
                                referralCodeUsed: code,
                                source: "REGISTER",
                                status: "SIGNED_UP",
                                ip,
                                userAgent: ua,
                            },
                        }),
                        prisma.referralprofile.update({
                            where: { id: referrerProfile.id },
                            data: { totalInvites: { increment: 1 } },
                        }),
                    ]);
                    logger.info("[REFERRAL] New referral created", { referrer: referrerProfile.userId, referred: newUser.id, code });
                }
            } catch (refErr) {
                logger.error("[REFERRAL] Failed to process referral code", refErr as Error, { referralCode });
                // Don't fail registration for referral errors
            }
        }

        // Tạo mã OTP 6 ký tự (Chữ in hoa và số)
        const generateOTP = () => {
            const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let result = "";
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        const otp = generateOTP();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

        await prisma.verificationtoken.create({
            data: {
                identifier: email,
                token: otp,
                expires
            }
        });

        // Gửi email xác thực thật
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const verifyUrl = `${baseUrl}/verify-email?token=${otp}`;
        const emailResult = await sendVerificationEmail(email, otp, "VERIFY", undefined, verifyUrl);

        if (!emailResult.success) {
            logger.error(
                "[MAIL] Failed to send verification email",
                new Error(emailResult.error || "Unknown mail error"),
                { context: "auth-register", email }
            );
            return NextResponse.json(
                { error: "Không thể gửi email xác thực. Vui lòng kiểm tra cấu hình SMTP." },
                { status: 500 }
            );
        }

        // Gửi thông báo Telegram (không block response)
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
        notifyNewRegistration({ name, email, phone, ip }).catch(() => {});

        // n8n webhook: new-user (non-blocking)
        import("@/lib/n8n-trigger")
            .then(({ triggerNewUser }) => triggerNewUser({ userId: 0, name, email }))
            .catch(() => {});

        return NextResponse.json(
            {
                ok: true,
                status: "PENDING_EMAIL_VERIFY",
                message: "Vui lòng kiểm tra email để xác thực tài khoản."
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error("Registration error", error as Error, { context: "auth-register" });
        return NextResponse.json(
            { error: "Đã có lỗi xảy ra trong quá trình đăng ký." },
            { status: 500 }
        );
    }
}
