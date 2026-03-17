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

// GET - Export products to CSV/JSON
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const format = searchParams.get("format") || "csv";
        const category = searchParams.get("category");
        const status = searchParams.get("status"); // all, published, draft

        const where: Prisma.productWhereInput = {};
        
        if (category && category !== "all") {
            where.category = category;
        }
        
        if (status === "published") {
            where.featured = true;
        } else if (status === "draft") {
            where.featured = false;
        }

        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                originalPrice: true,
                category: true,
                inventory: true,
                soldCount: true,
                featured: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10000,
        });

        if (format === "json") {
            return NextResponse.json(products, {
                headers: {
                    "Content-Disposition": `attachment; filename=products-${Date.now()}.json`
                }
            });
        }

        // CSV format
        const headers = [
            "id", "name", "slug", "description", "price", "originalPrice",
            "category", "inventory", "soldCount", "featured", "createdAt"
        ];

        const csvRows = [headers.join(",")];

        products.forEach(product => {
            const row = headers.map(header => {
                const value = product[header as keyof typeof product];
                if (value === null || value === undefined) return "";
                if (typeof value === "string" && value.includes(",")) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return String(value);
            });
            csvRows.push(row.join(","));
        });

        return new NextResponse(csvRows.join("\n"), {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=products-${Date.now()}.csv`
            }
        });
    } catch (error) {
        logger.error("Export error", error as Error, { context: "admin-products-export-api" });
        return NextResponse.json({ error: "Failed to export products" }, { status: 500 });
    }
}
