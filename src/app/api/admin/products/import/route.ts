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

// POST - Import products from CSV/JSON
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["application/json", "text/csv"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only JSON and CSV are allowed" }, { status: 400 });
        }

        const text = await file.text();

        interface ImportedProduct {
            name?: string;
            slug?: string;
            description?: string;
            price?: string;
            originalPrice?: string;
            category?: string;
            image?: string;
            inventory?: string;
            featured?: string;
            tags?: string;
            [key: string]: string | undefined;
        }

        let products: ImportedProduct[] = [];

        if (file.type === "application/json") {
            products = JSON.parse(text);
            if (!Array.isArray(products)) {
                return NextResponse.json({ error: "JSON must be an array of products" }, { status: 400 });
            }
        } else if (file.type === "text/csv") {
            // Simple CSV parser
            const lines = text.split("\n").filter(line => line.trim());
            if (lines.length < 2) {
                return NextResponse.json({ error: "CSV file must have header and at least one product" }, { status: 400 });
            }
            
            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(",");
                const product: ImportedProduct = {};
                
                headers.forEach((header, index) => {
                    product[header] = values[index]?.trim();
                });
                
                products.push(product);
            }
        }

        // Hard limit: max 500 rows per import
        if (products.length > 500) {
            return NextResponse.json({ error: "Tối đa 500 sản phẩm mỗi lần import" }, { status: 400 });
        }

        // Pre-fetch all existing slugs in one batch to avoid N+1 inside loop
        const baseSlugSet = new Set<string>();
        for (const product of products) {
            if (product.slug) baseSlugSet.add(product.slug);
        }
        const existingSlugs = await prisma.product.findMany({
            where: { slug: { in: Array.from(baseSlugSet) } },
            select: { slug: true },
        });
        const usedSlugs = new Set(existingSlugs.map((p) => p.slug ?? ""));

        // Validate and process products
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
            products: [] as { id: string; name: string; slug: string }[]
        };

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            try {
                // Validate required fields + price
                if (!product.name || !product.price) {
                    results.failed++;
                    results.errors.push(`Row ${i + 1}: Missing required fields (name, price)`);
                    continue;
                }

                const parsedPrice = parseFloat(product.price);
                if (isNaN(parsedPrice) || parsedPrice <= 0) {
                    results.failed++;
                    results.errors.push(`Row ${i + 1}: Giá sản phẩm phải là số dương`);
                    continue;
                }

                // Generate unique slug using pre-fetched set (avoids N+1)
                const baseSlug = product.slug || product.name
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");

                let slug = baseSlug;
                let counter = 1;
                while (usedSlugs.has(slug)) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                usedSlugs.add(slug);

                // Create product
                const created = await prisma.product.create({
                    data: {
                        name: product.name,
                        slug,
                        description: product.description || "",
                        price: parsedPrice,
                        originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
                        category: product.category || "Uncategorized",
                        inventory: parseInt(product.inventory ?? "0") || 0,
                        soldCount: parseInt(product.soldCount ?? "0") || 0,
                        featured: product.featured === "true" || product.featured === "1",
                    }
                });

                results.success++;
                results.products.push({
                    id: String(created.id),
                    name: created.name,
                    slug: created.slug ?? ""
                });
            } catch (err) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
        }

        return NextResponse.json({
            message: `Import completed: ${results.success} products created, ${results.failed} failed`,
            results
        });
    } catch (error) {
        logger.error("Import error", error as Error, { context: "admin-products-import" });
        return NextResponse.json({ error: "Failed to import products" }, { status: 500 });
    }
}

// GET - Download sample CSV template
export async function GET() {
    const sampleProducts = [
        {
            name: "Cá khô cá lóc",
            price: 150000,
            originalPrice: 180000,
            category: "Cá khô",
            inventory: 100,
            description: "Cá khô cá lóc chất lượng cao, phơi tự nhiên",
            featured: "true"
        },
        {
            name: "Mực khô Hạ Long",
            price: 250000,
            originalPrice: "",
            category: "Mực khô",
            inventory: 50,
            description: "Mực khô Hạ Long, thơm ngon đặc sản",
            featured: "true"
        }
    ];

    const headers = Object.keys(sampleProducts[0]).join(",");
    const rows = sampleProducts.map(p => Object.values(p).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=products-template.csv"
        }
    });
}
