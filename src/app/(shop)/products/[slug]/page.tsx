/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Product Detail Page — Server Component
 * Fetches product data server-side for SEO, then passes to interactive client component.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import ProductDetailClient from "./ProductDetailClient";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { truncateDescription } from "@/lib/seo-utils";

// PERF-004: ISR — revalidate every 5 minutes
export const revalidate = 300;

// PERF-004: Generate static params for top products at build time
export async function generateStaticParams() {
    try {
        const products = await prisma.product.findMany({
            where: { isDeleted: false, isVisible: true },
            select: { slug: true },
            take: 50,
            orderBy: { soldCount: "desc" },
        });
        return products
            .filter((p) => p.slug)
            .map((p) => ({ slug: p.slug! }));
    } catch {
        // Fallback to runtime rendering when DB is unavailable during image build.
        return [];
    }
}

// SEO-003: Dynamic metadata per product
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";
    const { slug } = await params;
    const product = await getProduct(slug);
    if (!product) {
        return { title: isEn ? "Product not found" : "Sản phẩm không tồn tại" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";
    const url = `${baseUrl}/products/${product.slug || product.id}`;
    const price = product.salePrice || product.price;

    const desc = truncateDescription(product.description || "", 155)
        || (isEn
            ? `Buy high-quality ${product.name} at LIKEFOOD`
            : `Mua ${product.name} chất lượng cao tại LIKEFOOD`);

    return {
        title: `${product.name} | LIKEFOOD`,
        description: desc,
        openGraph: {
            title: product.name,
            description: desc,
            url,
            type: "article",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            siteName: "LIKEFOOD",
            images: product.image ? [{ url: product.image, width: 800, height: 800, alt: product.name }] : [],
        },
        twitter: {
            card: "summary_large_image",
            title: product.name,
            description: desc,
            images: product.image ? [product.image] : [],
        },
        alternates: {
            canonical: url,
            languages: {
                'vi': url,
                'en': `${url}?lang=en`,
                'x-default': url,
            },
        },
        other: {
            "product:price:amount": String(price),
            "product:price:currency": "USD",
        },
    };
}

async function getProduct(slug: string) {
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                ...(Number.isFinite(Number(slug)) ? [{ id: Number(slug) }] : []),
                { slug: slug },
            ],
            isDeleted: false,
            isVisible: true,
        },
        include: {
            categoryRel: true,
            productImages: {
                orderBy: [
                    { isPrimary: "desc" },
                    { order: "asc" },
                ],
            },
            productVariants: {
                where: { isActive: true },
                orderBy: { createdAt: "asc" },
            },
            specifications: {
                orderBy: { order: "asc" },
            },
            shipping: true,
            productTags: {
                include: { tag: true },
            },
            reviews: {
                include: { user: { select: { name: true, image: true } } },
                orderBy: { createdAt: "desc" },
                take: 20,
            },
        },
    });

    if (!product) return null;

    const productMetrics = product as unknown as {
        ratingAvg?: number | null;
        ratingCount?: number | null;
        originalPrice?: number | null;
        salePrice?: number | null;
        soldCount?: number | null;
    };

    const avgRating = productMetrics.ratingAvg ?? 0;
    const reviewCount = productMetrics.ratingCount ?? 0;

    // Flash sale check
    const now = new Date();
    const isFlashSale =
        product.isOnSale &&
        product.salePrice &&
        product.saleStartAt &&
        product.saleEndAt &&
        product.saleStartAt <= now &&
        product.saleEndAt >= now;

    return {
        ...product,
        avgRating: Math.round((avgRating as number) * 10) / 10,
        reviewCount,
        images: product.productImages,
        variants: product.productVariants,
        tags: product.productTags?.map((pt) => pt.tag).filter(Boolean) ?? [],
        specifications: product.specifications ?? [],
        shipping: product.shipping ?? null,
        originalPrice: productMetrics.originalPrice || null,
        salePrice: productMetrics.salePrice || null,
        soldCount: productMetrics.soldCount || 0,
        isFlashSale: !!isFlashSale,
        saleStartAt: product.saleStartAt,
        saleEndAt: product.saleEndAt,
        // Serialize dates/Decimals for client component
        reviews: product.reviews.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
        })),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    };
}

async function getRelatedProducts(slug: string) {
    try {
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    ...(Number.isFinite(Number(slug)) ? [{ id: Number(slug) }] : []),
                    { slug: slug },
                ],
                isDeleted: false,
            },
            select: { id: true, category: true },
        });

        if (!product) return [];

        const related = await prisma.product.findMany({
            where: {
                category: product.category,
                id: { not: product.id },
                isDeleted: false,
                isVisible: true,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                originalPrice: true,
                salePrice: true,
                isOnSale: true,
                image: true,
                category: true,
                inventory: true,
                badgeText: true,
            },
            take: 4,
            orderBy: { createdAt: "desc" },
        });

        return related;
    } catch {
        return [];
    }
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        notFound();
    }

    const relatedProducts = await getRelatedProducts(slug);

    // Serialize for client: convert any remaining Date/Decimal to plain values
    const serializedProduct = JSON.parse(JSON.stringify(product));
    const serializedRelated = JSON.parse(JSON.stringify(relatedProducts));

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";
    const productUrl = `${baseUrl}/products/${product.slug || product.id}`;

    return (
        <>
            {/* SEO-001: JSON-LD Structured Data */}
            <ProductJsonLd
                name={product.name}
                description={product.description || ""}
                image={product.image || ""}
                price={product.price}
                salePrice={product.salePrice}
                availability={product.inventory > 0 ? "InStock" : "OutOfStock"}
                ratingValue={product.avgRating}
                ratingCount={product.reviewCount}
                brand={product.categoryRel?.name || "LIKEFOOD"}
                sku={String(product.id)}
                url={productUrl}
            />
            <BreadcrumbJsonLd
                items={[
                    { name: "Trang chủ", url: baseUrl },
                    { name: "Sản phẩm", url: `${baseUrl}/products` },
                    { name: product.name, url: productUrl },
                ]}
            />
            <ProductDetailClient
                initialProduct={serializedProduct}
                initialRelated={serializedRelated}
            />
        </>
    );
}
