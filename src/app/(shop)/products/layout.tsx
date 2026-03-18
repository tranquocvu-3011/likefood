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

    const title = isEn ? "Products | LIKEFOOD" : "Sản phẩm | LIKEFOOD";
    const description = isEn
        ? "Explore premium Vietnamese specialty products at LIKEFOOD. Dried fish, shrimp, squid, fruits and more. Nationwide US delivery."
        : "Khám phá các sản phẩm đặc sản Việt Nam chất lượng cao tại LIKEFOOD. Cá khô, tôm khô, mực khô, trái cây sấy. Giao hàng toàn nước Mỹ.";

    return {
        title,
        description,
        keywords: [
            "sản phẩm LIKEFOOD", "đặc sản Việt Nam", "cá khô", "tôm khô", "mực khô",
            "trái cây sấy", "gia vị Việt Nam", "Vietnamese specialty products",
            "đặc sản Việt tại Mỹ", "likefood products", "mua đồ khô Việt Nam online",
            "dried fish USA", "dried shrimp USA", "Vietnamese food online",
            "khô bò", "khô gà", "đặc sản quê hương", "mua đặc sản Việt Nam",
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
