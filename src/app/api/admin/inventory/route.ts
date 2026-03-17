/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "../../../../generated/client";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (
            !session?.user ||
            !["ADMIN", "ADMIN"].includes((session.user as { role?: string }).role ?? "")
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") ?? "";
        const sort = searchParams.get("sort") ?? "name";
        const category = searchParams.get("category") ?? "";

        const where: Prisma.productWhereInput = { isDeleted: false };

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { category: { contains: search } },
            ];
        }

        if (category) {
            where.category = category;
        }

        let orderBy: Prisma.productOrderByWithRelationInput = { name: "asc" };
        if (sort === "inventory-asc") orderBy = { inventory: "asc" };
        else if (sort === "inventory-desc") orderBy = { inventory: "desc" };
        else if (sort === "price-asc") orderBy = { price: "asc" };
        else if (sort === "price-desc") orderBy = { price: "desc" };
        else if (sort === "newest") orderBy = { createdAt: "desc" };

        const products = await prisma.product.findMany({
            where,
            orderBy,
            select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                price: true,
                inventory: true,
                soldCount: true,
                productVariants: {
                    select: { sku: true },
                    take: 1,
                },
            },
        });

        const mapped = products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug ?? null,
            sku: p.productVariants[0]?.sku ?? null,
            category: p.category,
            price: p.price,
            inventory: p.inventory,
            soldCount: p.soldCount,
        }));

        return NextResponse.json({ products: mapped, total: mapped.length });
    } catch {
        return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (
            !session?.user ||
            !["ADMIN", "ADMIN"].includes((session.user as { role?: string }).role ?? "")
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as { productId: number; delta: number };
        const { productId, delta } = body;

        if (!productId || typeof delta !== "number" || !Number.isInteger(delta)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const product = await prisma.product.findFirst({
            where: { id: Number(productId), isDeleted: false },
            select: { id: true, inventory: true },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const newInventory = Math.max(0, product.inventory + delta);

        const updated = await prisma.product.update({
            where: { id: Number(productId) },
            data: { inventory: newInventory },
            select: { id: true, inventory: true },
        });

        return NextResponse.json({ product: updated });
    } catch {
        return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
    }
}
