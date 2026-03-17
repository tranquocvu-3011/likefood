/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/products/[slug]/specifications - Lấy thông số kỹ thuật
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Tìm product by slug
        const product = await prisma.product.findUnique({
            where: { slug },
            select: { id: true }
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Lấy specifications
        const specifications = await prisma.productspecification.findMany({
            where: { productId: product.id },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(specifications);
    } catch (error) {
        logger.error("Get specifications error", error as Error, {
            context: "specifications-api-get"
        });
        return NextResponse.json(
            { error: "Failed to fetch specifications" },
            { status: 500 }
        );
    }
}

// POST /api/products/[slug]/specifications - Tạo specification mới (Admin)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { slug } = await params;
        const body = await request.json();
        const { key, value, order } = body;

        if (!key || !value) {
            return NextResponse.json(
                { error: "Key and value are required" },
                { status: 400 }
            );
        }

        // Tìm product by slug
        const product = await prisma.product.findUnique({
            where: { slug },
            select: { id: true }
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Tạo specification
        const specification = await prisma.productspecification.create({
            data: {
                productId: product.id,
                key,
                value,
                order: order ?? 0
            }
        });

        logger.info("Specification created", {
            specificationId: specification.id,
            productId: product.id
        });

        return NextResponse.json(specification, { status: 201 });
    } catch (error) {
        logger.error("Create specification error", error as Error, {
            context: "specifications-api-post"
        });
        return NextResponse.json(
            { error: "Failed to create specification" },
            { status: 500 }
        );
    }
}

// PUT /api/products/[slug]/specifications - Update specification
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { slug } = await params;
        const body = await request.json();
        const { id, key, value, order } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Specification ID is required" },
                { status: 400 }
            );
        }

        // Ownership check: verify spec belongs to this product
        const existing = await prisma.productspecification.findFirst({
            where: { id: Number(id), product: { slug } }
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Specification not found" },
                { status: 404 }
            );
        }

        const specification = await prisma.productspecification.update({
            where: { id: existing.id },
            data: {
                ...(key && { key }),
                ...(value && { value }),
                ...(order !== undefined && { order })
            }
        });

        return NextResponse.json(specification);
    } catch (error) {
        logger.error("Update specification error", error as Error, {
            context: "specifications-api-put"
        });
        return NextResponse.json(
            { error: "Failed to update specification" },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[slug]/specifications - Delete specification
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Specification ID is required" },
                { status: 400 }
            );
        }

        // Ownership check: verify spec belongs to this product
        const existing = await prisma.productspecification.findFirst({
            where: { id: Number(id), product: { slug } }
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Specification not found" },
                { status: 404 }
            );
        }

        await prisma.productspecification.delete({
            where: { id: existing.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Delete specification error", error as Error, {
            context: "specifications-api-delete"
        });
        return NextResponse.json(
            { error: "Failed to delete specification" },
            { status: 500 }
        );
    }
}
