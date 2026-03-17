/**
 * LIKEFOOD - Google Account Link/Unlink API
 * POST: Link Google account → lưu googleId vào user
 * DELETE: Unlink Google account → xóa googleId (chỉ cho phép nếu có password)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// POST: Link Google account to current user
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { googleId, avatarUrl } = await req.json();

        if (!googleId) {
            return NextResponse.json({ error: "Thiếu Google ID" }, { status: 400 });
        }

        const userId = Number(session.user.id);

        // Check if googleId already used by another account
        const existing = await prisma.user.findFirst({
            where: { googleId, id: { not: userId } },
        });
        if (existing) {
            return NextResponse.json(
                { error: "Tài khoản Google này đã được liên kết với tài khoản khác" },
                { status: 400 }
            );
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                googleId,
                ...(avatarUrl && { avatarUrl }),
            },
        });

        return NextResponse.json({ success: true, message: "Đã liên kết tài khoản Google" });
    } catch (error) {
        logger.error("Link Google error", error as Error, { context: "user-link-google-api" });
        return NextResponse.json({ error: "Không thể liên kết tài khoản Google" }, { status: 500 });
    }
}

// DELETE: Unlink Google account
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = Number(session.user.id);

        // Check if user has a password (can't unlink Google if no password)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true, googleId: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User không tồn tại" }, { status: 404 });
        }

        if (!user.googleId) {
            return NextResponse.json({ error: "Tài khoản chưa liên kết Google" }, { status: 400 });
        }

        if (!user.password) {
            return NextResponse.json(
                { error: "Bạn cần tạo mật khẩu trước khi hủy liên kết Google (vì hiện tại bạn chỉ đăng nhập bằng Google)" },
                { status: 400 }
            );
        }

        await prisma.user.update({
            where: { id: userId },
            data: { googleId: null },
        });

        return NextResponse.json({ success: true, message: "Đã hủy liên kết Google" });
    } catch (error) {
        logger.error("Unlink Google error", error as Error, { context: "user-link-google-api" });
        return NextResponse.json({ error: "Không thể hủy liên kết Google" }, { status: 500 });
    }
}

// GET: Check Google link status
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = Number(session.user.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleId: true, password: true },
        });

        return NextResponse.json({
            isLinked: !!user?.googleId,
            hasPassword: !!user?.password,
        });
    } catch (error) {
        logger.error("Check Google link error", error as Error, { context: "user-link-google-api" });
        return NextResponse.json({ error: "Lỗi kiểm tra" }, { status: 500 });
    }
}
