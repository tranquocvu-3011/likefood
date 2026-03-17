/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { logger } from "@/lib/logger";
// PUT /api/admin/products/[id]/variants/[variantId] - Update variant
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, variantId } = await params;
        const body = await req.json();
        const { weight, flavor, priceAdjustment, stock, sku, isActive } = body;

        // Check variant belongs to product
        const existing = await prisma.productvariant.findFirst({
            where: { id: Number(variantId), productId: Number(id) },
        });
        if (!existing) {
            return NextResponse.json({ error: "Biến thể không tồn tại" }, { status: 404 });
        }

        // Check SKU uniqueness if changed
        if (sku && sku !== existing.sku) {
            const existingSku = await prisma.productvariant.findUnique({ where: { sku } });
            if (existingSku) {
                return NextResponse.json({ error: "SKU đã tồn tại" }, { status: 400 });
            }
        }

        const variant = await prisma.productvariant.update({
            where: { id: Number(variantId) },
            data: {
                weight: weight !== undefined ? (weight || null) : undefined,
                flavor: flavor !== undefined ? (flavor || null) : undefined,
                priceAdjustment: priceAdjustment !== undefined ? parseFloat(priceAdjustment) : undefined,
                stock: stock !== undefined ? parseInt(stock) : undefined,
                sku: sku !== undefined ? (sku || null) : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        });

        return NextResponse.json(variant);
    } catch (error) {
        logger.error("Error updating variant", error as Error, { context: "admin-products-id-variants-variantId-api" });
        return NextResponse.json({ error: "Lỗi cập nhật biến thể" }, { status: 500 });
    }
}

// DELETE /api/admin/products/[id]/variants/[variantId] - Delete variant
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, variantId } = await params;

        // Check variant belongs to product
        const existing = await prisma.productvariant.findFirst({
            where: { id: Number(variantId), productId: Number(id) },
        });
        if (!existing) {
            return NextResponse.json({ error: "Biến thể không tồn tại" }, { status: 404 });
        }

        // Check if variant has order items
        const orderItemCount = await prisma.orderitem.count({
            where: { variantId: Number(variantId) },
        });
        if (orderItemCount > 0) {
            // Soft delete - set isActive to false
            await prisma.productvariant.update({
                where: { id: Number(variantId) },
                data: { isActive: false },
            });
            return NextResponse.json({ message: "Biến thể đã được ẩn (có đơn hàng liên quan)" });
        }

        await prisma.productvariant.delete({
            where: { id: Number(variantId) },
        });

        return NextResponse.json({ message: "Xoá biến thể thành công" });
    } catch (error) {
        logger.error("Error deleting variant", error as Error, { context: "admin-products-id-variants-variantId-api" });
        return NextResponse.json({ error: "Lỗi xoá biến thể" }, { status: 500 });
    }
}
