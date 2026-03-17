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
import crypto from "crypto";
import { admin2FARateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";

// Helper functions (same as in proxy.ts)
const ADMIN_COOKIE_SECRET = process.env.ADMIN_2FA_SECRET || process.env.NEXTAUTH_SECRET;

function verifyAdminCookie(signedValue: string): { valid: boolean; value: string } {
    try {
        if (!ADMIN_COOKIE_SECRET) {
            return { valid: false, value: "" };
        }
        const parts = signedValue.split(".");
        if (parts.length !== 2) {
            return { valid: false, value: "" };
        }
        const [value, signature] = parts;
        const expectedSignature = crypto
            .createHmac("sha256", ADMIN_COOKIE_SECRET)
            .update(value)
            .digest("hex");
        
        if (signature !== expectedSignature) {
            return { valid: false, value: "" };
        }
        return { valid: true, value };
    } catch {
        return { valid: false, value: "" };
    }
}

// POST: Verify OTP and create admin session
export async function POST(req: NextRequest) {
    try {
        // Apply rate limiting to prevent brute force
        const identifier = getRateLimitIdentifier(req);
        const rateResult = await applyRateLimit(identifier, admin2FARateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const session = await getServerSession(authOptions);

        if (!session?.user?.email || (session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { otp } = body;

        if (!otp) {
            return NextResponse.json({ error: "OTP là bắt buộc." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
        }

        // Tìm token hợp lệ
        const token = await prisma.twofactortoken.findFirst({
            where: {
                userId: user.id,
                token: otp,
                expires: { gte: new Date() },
            },
        });

        if (!token) {
            return NextResponse.json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn." }, { status: 400 });
        }

        // Xóa token đã dùng
        await prisma.twofactortoken.delete({ where: { id: token.id } });

        // Sign the cookie value with HMAC - 30 minutes session
        const expiresAt = Date.now() + 30 * 60 * 1000;
        const rawValue = `verified:${expiresAt}`;
        
        if (!ADMIN_COOKIE_SECRET) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }
        
        const signature = crypto
            .createHmac("sha256", ADMIN_COOKIE_SECRET)
            .update(rawValue)
            .digest("hex");
        const signedValue = `${rawValue}.${signature}`;

        // Tạo response và set cookie `admin_auth_session`
        const response = NextResponse.json({ success: true, message: "Xác thực thành công." });

        response.cookies.set({
            name: "admin_auth_session",
            value: signedValue,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 30, // 30 minutes
            path: "/", // Must be / so cookie is sent to /api/ endpoints too
        });

        return response;
    } catch (error) {
        logger.error("Admin 2FA verify error", error as Error, { context: "auth-admin-verify-api" });
        return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
    }
}

// GET: Check if admin 2FA session is valid
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email || (session.user.role !== "ADMIN")) {
            return NextResponse.json({ verified: false }, { status: 401 });
        }

        const adminAuthSession = req.cookies.get("admin_auth_session");
        const sessionValue = adminAuthSession?.value;

        if (!sessionValue) {
            return NextResponse.json({ verified: false });
        }

        const verification = verifyAdminCookie(sessionValue);
        
        if (!verification.valid || !verification.value.startsWith("verified:")) {
            return NextResponse.json({ verified: false });
        }

        const [, timestampStr] = verification.value.split(":");
        const expiresAt = parseInt(timestampStr, 10);

        if (isNaN(expiresAt) || Date.now() > expiresAt) {
            return NextResponse.json({ verified: false });
        }

        return NextResponse.json({ verified: true });
    } catch (error) {
        logger.error("Admin 2FA check error", error as Error, { context: "auth-admin-verify-api" });
        return NextResponse.json({ verified: false, error: "Server error" }, { status: 500 });
    }
}

// PATCH: Renew admin session cookie (sliding window on activity)
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email || session.user.role !== "ADMIN") {
            return NextResponse.json({ renewed: false }, { status: 401 });
        }

        const adminAuthSession = req.cookies.get("admin_auth_session");
        const sessionValue = adminAuthSession?.value;

        if (!sessionValue) {
            return NextResponse.json({ renewed: false });
        }

        const verification = verifyAdminCookie(sessionValue);
        if (!verification.valid || !verification.value.startsWith("verified:")) {
            return NextResponse.json({ renewed: false });
        }

        const [, timestampStr] = verification.value.split(":");
        const expiresAt = parseInt(timestampStr, 10);

        if (isNaN(expiresAt) || Date.now() > expiresAt) {
            return NextResponse.json({ renewed: false });
        }

        // Cookie still valid - renew with fresh 30 min expiry
        const newExpiresAt = Date.now() + 30 * 60 * 1000;
        const rawValue = `verified:${newExpiresAt}`;

        if (!ADMIN_COOKIE_SECRET) {
            return NextResponse.json({ renewed: false, error: "Server configuration error" }, { status: 500 });
        }

        const signature = crypto
            .createHmac("sha256", ADMIN_COOKIE_SECRET)
            .update(rawValue)
            .digest("hex");
        const signedValue = `${rawValue}.${signature}`;

        const response = NextResponse.json({ renewed: true });

        response.cookies.set({
            name: "admin_auth_session",
            value: signedValue,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 30, // 30 minutes
            path: "/",
        });

        return response;
    } catch (error) {
        logger.error("Admin session renew error", error as Error, { context: "auth-admin-verify-api" });
        return NextResponse.json({ renewed: false, error: "Server error" }, { status: 500 });
    }
}
