/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { decryptForDisplay, encrypt } from "@/lib/encryption";

const addressUpdateSchema = z.object({
    fullName: z.string().min(1).max(100),
    phone: z.string().regex(/^[0-9+\-\s]{7,20}$/, "Số điện thoại không hợp lệ"),
    address: z.string().min(1).max(500),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional().nullable(),
    zipCode: z.string().min(1).max(20),
    country: z.string().max(100).default("Việt Nam"),
    isDefault: z.boolean().default(false),
});

// PUT update address
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = addressUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const { fullName, phone, address, city, state, zipCode, country, isDefault } = parsed.data;

        // Verify ownership
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: Number(id),
                userId: Number(session.user.id),
            },
        });

        if (!existingAddress) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 });
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany({
                where: {
                    userId: Number(session.user.id),
                    id: { not: Number(id) },
                    isDefault: true,
                },
                data: { isDefault: false },
            });
        }

        const updatedAddress = await prisma.address.update({
            where: { id: Number(id) },
            data: {
                ...(fullName && { fullName }),
                ...(phone && { phone: encrypt(phone) || phone }),
                ...(address && { address: encrypt(address) || address }),
                ...(city && { city }),
                ...(state !== undefined && { state }),
                ...(zipCode && { zipCode }),
                ...(country && { country }),
                ...(isDefault !== undefined && { isDefault }),
            },
        });

        return NextResponse.json({
            ...updatedAddress,
            phone: decryptForDisplay(updatedAddress.phone),
            address: decryptForDisplay(updatedAddress.address),
        });
    } catch (error) {
        logger.error("Address update error", error as Error, { context: "user-addresses-id-api" });
        return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
    }
}

// DELETE address
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        // Verify ownership
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: Number(id),
                userId: Number(session.user.id),
            },
        });

        if (!existingAddress) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 });
        }

        await prisma.address.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ message: "Address deleted successfully" });
    } catch (error) {
        logger.error("Address delete error", error as Error, { context: "user-addresses-id-api" });
        return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
    }
}
