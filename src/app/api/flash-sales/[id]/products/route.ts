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
import { z } from "zod";

// Inline validation schemas - avoid dynamic import issues
const addProductSchema = z.object({
    productId: z.coerce.number().int().positive('productId phải là số dương'),
    flashSalePrice: z.coerce.number().positive('Giá flash sale phải là số dương'),
    stockLimit: z.coerce.number().int().positive().max(100000).optional().nullable(),
});

// GET /api/flash-sales/[id]/products - Lấy sản phẩm trong campaign
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const products = await prisma.flashsaleproduct.findMany({
            where: { campaignId: Number(id) },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        image: true,
                        price: true,
                        category: true,
                        ratingAvg: true,
                        soldCount: true,
                        productImages: {
                            orderBy: { order: "asc" },
                            take: 1,
                            select: { imageUrl: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json(products);
    } catch (error) {
        logger.error("Get flash sale products error", error as Error, {
            context: "flash-sales-products-api-get"
        });
        return NextResponse.json(
            { error: "Lỗi khi tải sản phẩm Flash Sale" },
            { status: 500 }
        );
    }
}

// POST /api/flash-sales/[id]/products - Thêm sản phẩm vào campaign (Admin)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();

        const parsed = addProductSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ";
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const { productId, flashSalePrice, stockLimit } = parsed.data;

        // Check if campaign exists
        const campaign = await prisma.flashsalecampaign.findUnique({
            where: { id: Number(id) }
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Không tìm thấy chiến dịch Flash Sale" },
                { status: 404 }
            );
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, price: true }
        });

        if (!product) {
            return NextResponse.json(
                { error: "Không tìm thấy sản phẩm" },
                { status: 404 }
            );
        }

        // Check if product already in campaign
        const existing = await prisma.flashsaleproduct.findUnique({
            where: {
                campaignId_productId: {
                    campaignId: Number(id),
                    productId: productId,
                }
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Sản phẩm này đã có trong chiến dịch" },
                { status: 409 }
            );
        }

        // Add product to campaign
        const flashSaleProduct = await prisma.flashsaleproduct.create({
            data: {
                campaignId: Number(id),
                productId: productId,
                flashSalePrice,
                stockLimit: stockLimit ?? null,
                soldCount: 0
            },
            include: {
                product: {
                    select: {
                        name: true,
                        slug: true,
                        price: true
                    }
                }
            }
        });

        logger.info("Product added to flash sale", {
            flashSaleProductId: flashSaleProduct.id,
            campaignId: Number(id),
            productId
        });

        return NextResponse.json(flashSaleProduct, { status: 201 });
    } catch (error) {
        logger.error("Add product to flash sale error", error as Error, {
            context: "flash-sales-products-api-post"
        });
        return NextResponse.json(
            { error: "Lỗi khi thêm sản phẩm vào Flash Sale. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}

// DELETE /api/flash-sales/[id]/products - Xóa sản phẩm khỏi campaign
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json(
                { error: "productId là bắt buộc" },
                { status: 400 }
            );
        }

        const numProductId = Number(productId);
        if (isNaN(numProductId) || numProductId <= 0) {
            return NextResponse.json(
                { error: "productId không hợp lệ" },
                { status: 400 }
            );
        }

        await prisma.flashsaleproduct.delete({
            where: {
                campaignId_productId: {
                    campaignId: Number(id),
                    productId: numProductId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Remove product from flash sale error", error as Error, {
            context: "flash-sales-products-api-delete"
        });
        return NextResponse.json(
            { error: "Lỗi khi xoá sản phẩm khỏi Flash Sale" },
            { status: 500 }
        );
    }
}
