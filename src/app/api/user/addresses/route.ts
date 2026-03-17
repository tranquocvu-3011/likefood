/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { decryptForDisplay, encrypt } from "@/lib/encryption";

const addressSchema = z.object({
    fullName: z.string().min(1).max(100),
    phone: z.string().regex(/^[0-9+\-\s]{7,20}$/, "Số điện thoại không hợp lệ"),
    address: z.string().min(1).max(500),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional().nullable(),
    zipCode: z.string().min(1).max(20),
    country: z.string().max(100).default("Việt Nam"),
    isDefault: z.boolean().default(false),
});

// GET user addresses
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const addresses = await prisma.address.findMany({
            where: { userId: Number(session.user.id) },
            orderBy: [
                { isDefault: "desc" },
                { createdAt: "desc" },
            ],
        });

        const decryptedAddresses = addresses.map(addr => ({
            ...addr,
            phone: decryptForDisplay(addr.phone),
            address: decryptForDisplay(addr.address),
        }));

        return NextResponse.json(decryptedAddresses);
    } catch (error) {
        logger.error("Addresses fetch error", error as Error, { context: "user-addresses-api" });
        return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
    }
}

// POST create address
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 20 address creations per hour
    const identifier = getRateLimitIdentifier(req, String(session.user.id));
    const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 3600000, maxRequests: 20 });
    if (!rl.success && rl.error) {
        return rl.error;
    }

    try {
        const body = await req.json();
        const parsed = addressSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const { fullName, phone, address, city, state, zipCode, country, isDefault } = parsed.data;

        // Limit: max 10 addresses per user
        const addressCount = await prisma.address.count({ where: { userId: Number(session.user.id) } });
        if (addressCount >= 10) {
            return NextResponse.json({ error: "Tối đa 10 địa chỉ giao hàng" }, { status: 400 });
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: Number(session.user.id), isDefault: true },
                data: { isDefault: false },
            });
        }

        const newAddress = await prisma.address.create({
            data: {
                userId: Number(session.user.id),
                fullName,
                phone: encrypt(phone) || phone,
                address: encrypt(address) || address,
                city,
                state: state || null,
                zipCode,
                country: country || "USA",
                isDefault: isDefault || false,
            },
        });

        return NextResponse.json({
            ...newAddress,
            phone: decryptForDisplay(newAddress.phone) ?? phone,
            address: decryptForDisplay(newAddress.address) ?? address,
        }, { status: 201 });
    } catch (error) {
        logger.error("Address creation error", error as Error, { context: "user-addresses-api" });
        return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
    }
}
