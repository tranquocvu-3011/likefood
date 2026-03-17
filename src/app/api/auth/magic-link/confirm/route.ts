/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { logger } from "@/lib/logger";
// GET /api/auth/magic-link/confirm?token=xxx&email=xxx
// Xác thực magic link và redirect sang app với session
export async function GET(req: NextRequest) {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || req.url;
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            return NextResponse.redirect(new URL("/login?error=invalid_link", baseUrl));
        }

        const user = await prisma.user.findUnique({
            where: { email: decodeURIComponent(email) },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.redirect(new URL("/login?error=invalid_link", baseUrl));
        }

        // Tìm token hợp lệ
        const verificationToken = await prisma.verificationtoken.findFirst({
            where: {
                identifier: `magic:${user.id}`,
                token,
                expires: { gte: new Date() },
            },
        });

        if (!verificationToken) {
            return NextResponse.redirect(new URL("/login?error=expired_link", baseUrl));
        }

        // Redirect đến trang magic-login-success với thông tin để frontend signIn
        // Không xóa token ở đây, để NextAuth authorize handling xóa 
        // để tránh lỗi mất token khi đăng nhập
        const url = new URL("/magic-login-success", baseUrl);
        url.searchParams.set("email", email);
        url.searchParams.set("token", token);
        url.searchParams.set("verified", "true");
        return NextResponse.redirect(url);
    } catch (error) {
        logger.error("Magic link confirm error", error as Error, { context: "auth-magic-link-confirm-api" });
        return NextResponse.redirect(new URL("/login?error=server_error", baseUrl));
    }
}
