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
import { Prisma } from "@/generated/client";

const isAdmin = (role?: string) => role === "ADMIN" || role === "ADMIN";

// GET - List all brands
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const isActive = searchParams.get("isActive");

        const where: Prisma.brandWhereInput = {};
        
        if (search) {
            where.name = { contains: search };
        }
        
        if (isActive !== null && isActive !== "all") {
            where.isActive = isActive === "true";
        }

        const brands = await prisma.brand.findMany({
            where,
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ brands });
    } catch (error) {
        logger.error("Brands list error", error as Error, { context: "admin-brands-api" });
        return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
    }
}

// POST - Create new brand
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, logo } = body;

        if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
            return NextResponse.json(
                { error: "Brand name must be between 2 and 100 characters" },
                { status: 400 }
            );
        }
        if (logo !== undefined && logo !== null) {
            if (typeof logo !== "string" || logo.length > 500 || !/^https?:\/\//.test(logo)) {
                return NextResponse.json({ error: "logo phải là URL hợp lệ (tối đa 500 ký tự)" }, { status: 400 });
            }
        }

        // Generate slug
        const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        // Check if slug exists
        const existing = await prisma.brand.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json(
                { error: "Brand with this name already exists" },
                { status: 400 }
            );
        }

        const brand = await prisma.brand.create({
            data: {
                name: name.trim(),
                slug,
                logo: logo || null,
            },
        });

        return NextResponse.json(brand, { status: 201 });
    } catch (error) {
        logger.error("Brand create error", error as Error, { context: "admin-brands-api" });
        return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
    }
}

// PATCH - Update brand
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, logo, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
        }

        const updateData: Prisma.brandUpdateInput = {};
        
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
                return NextResponse.json({ error: "Brand name must be between 2 and 100 characters" }, { status: 400 });
            }
            updateData.name = name.trim();
            // Update slug if name changed
            updateData.slug = name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
        }
        if (logo !== undefined && logo !== null) {
            if (typeof logo !== "string" || logo.length > 500 || !/^https?:\/\//.test(logo)) {
                return NextResponse.json({ error: "logo phải là URL hợp lệ (tối đa 500 ký tự)" }, { status: 400 });
            }
        }
        if (logo !== undefined) updateData.logo = logo;
        if (isActive !== undefined && typeof isActive === "boolean") updateData.isActive = isActive;

        const brand = await prisma.brand.update({
            where: { id: Number(id) },
            data: updateData,
        });

        return NextResponse.json(brand);
    } catch (error) {
        logger.error("Brand update error", error as Error, { context: "admin-brands-api" });
        return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
    }
}

// DELETE - Delete brand
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isAdmin(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
        }

        // Check if brand has products
        const productCount = await prisma.product.count({ where: { brandId: Number(id) } });
        
        if (productCount > 0) {
            // Instead of deleting, just deactivate
            await prisma.brand.update({
                where: { id: Number(id) },
                data: { isActive: false },
            });
            
            return NextResponse.json({ 
                message: "Brand has products, so it was deactivated instead of deleted",
                deactivated: true 
            });
        }

        await prisma.brand.delete({ where: { id: Number(id) } });

        return NextResponse.json({ message: "Brand deleted successfully" });
    } catch (error) {
        logger.error("Brand delete error", error as Error, { context: "admin-brands-api" });
        return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
    }
}
