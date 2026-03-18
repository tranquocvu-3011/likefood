/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Metadata } from "next";
import { cookies, headers } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const isEn = cookieStore.get("language")?.value === "en";

    // Extract page number from URL for pagination canonical
    const url = headerStore.get("x-url") || headerStore.get("x-invoke-path") || "";
    const urlObj = url ? (() => { try { return new URL(url, BASE_URL); } catch { return null; } })() : null;
    const pageNum = urlObj ? parseInt(urlObj.searchParams.get("page") || "1", 10) : 1;
    const currentPage = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;

    // Self-referencing canonical with pagination
    const canonicalPath = currentPage > 1 ? `/products?page=${currentPage}` : "/products";

    const title = isEn
        ? "Vietnamese Specialty Products | 100+ Authentic Items"
        : "Đặc Sản Việt Nam Chính Gốc | 100+ Sản Phẩm Miền Tây";
    const description = isEn
        ? "Shop 100+ authentic Vietnamese specialty products at LIKEFOOD. Premium dried fish, Cà Mau shrimp, squid, tropical dried fruits, traditional sauces & spices. Fast 2-3 day delivery across USA. Free shipping on orders $500+."
        : "Mua 100+ sản phẩm đặc sản Việt Nam chính gốc tại LIKEFOOD. Cá khô miền Tây, tôm khô Cà Mau, mực khô, trái cây sấy, mắm truyền thống, gia vị Việt. Giao hàng 2-3 ngày toàn nước Mỹ. Miễn phí ship từ $500.";

    return {
        title,
        description,
        keywords: [
            "đặc sản Việt Nam", "đặc sản Việt Nam tại Mỹ", "cá khô miền Tây", "tôm khô Cà Mau", "mực khô nguyên con",
            "trái cây sấy Việt Nam", "gia vị Việt Nam", "mắm truyền thống", "nước mắm Phú Quốc",
            "Vietnamese specialty products", "Vietnamese food in USA", "Vietnamese dried fish",
            "dried shrimp USA", "Vietnamese grocery online", "buy Vietnamese food in America",
            "đặc sản miền Tây", "đồ khô Việt Nam", "mua đặc sản Việt Nam online",
            "khô bò", "trà Việt Nam", "bánh tráng", "Vietnamese snacks USA",
        ],
        alternates: {
            canonical: canonicalPath,
            languages: {
                'vi': '/products?lang=vi',
                'en': '/products?lang=en',
                'x-default': '/products',
            },
        },
        openGraph: {
            title,
            description,
            type: "website",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${BASE_URL}/products`,
            images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "LIKEFOOD Products" }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`${BASE_URL}/og-image.png`],
        },
    };
}

// Enable ISR for product listing page
export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProductsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: isEn ? "Vietnamese Specialty Products" : "Sản phẩm đặc sản Việt Nam",
        description: isEn
            ? "Browse our collection of premium Vietnamese specialty food including dried fish, shrimp, squid, fruits and spices."
            : "Khám phá bộ sưu tập đặc sản Việt Nam bao gồm cá khô, tôm khô, mực khô, trái cây sấy và gia vị.",
        url: `${BASE_URL}/products`,
        isPartOf: { "@type": "WebSite", name: "LIKEFOOD", url: BASE_URL },
        provider: {
            "@type": "Organization",
            name: "LIKEFOOD",
            url: BASE_URL,
        },
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "LIKEFOOD", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: isEn ? "Products" : "Sản phẩm", item: `${BASE_URL}/products` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([collectionSchema, breadcrumbSchema]) }}
            />
            {children}
        </>
    );
}
