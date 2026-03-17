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

// GET - Lấy trạng thái kết nối Google
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: {
                googleId: true,
                email: true,
            },
        });

        return NextResponse.json({
            isConnected: !!user?.googleId,
            email: user?.email,
        });
    } catch (error) {
        logger.error("Google link status error", error as Error, { context: "auth-google-link-api" });
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
}

// POST - Kết nối Google (yêu cầu đăng nhập lại với Google)
// Chuyển hướng user đến trang login với query param để connect
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Redirect user to sign in with Google with a state parameter indicating "link"
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        
        // For now, return a URL that will initiate Google OAuth with link mode
        // The frontend will handle the redirect
        const googleAuthUrl = `${baseUrl}/api/auth/signin?error=GoogleLinkRequired`;
        
        return NextResponse.json({
            message: "Please sign in with Google to link your account",
            redirectUrl: googleAuthUrl,
        });
    } catch (error) {
        logger.error("Google link error", error as Error, { context: "auth-google-link-api" });
        return NextResponse.json({ error: "Failed to initiate Google link" }, { status: 500 });
    }
}

// DELETE - Ngắt kết nối Google
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Check if user has password - can't unlink if only login method
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: {
                googleId: true,
                password: true,
            },
        });

        if (!user?.googleId) {
            return NextResponse.json({ error: "Google not connected" }, { status: 400 });
        }

        if (!user.password) {
            return NextResponse.json({ 
                error: "Cannot unlink Google. Please set a password first." 
            }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: Number(session.user.id) },
            data: {
                googleId: null,
            },
        });

        return NextResponse.json({ 
            success: true,
            message: "Google account disconnected" 
        });
    } catch (error) {
        logger.error("Google unlink error", error as Error, { context: "auth-google-link-api" });
        return NextResponse.json({ error: "Failed to disconnect Google" }, { status: 500 });
    }
}
