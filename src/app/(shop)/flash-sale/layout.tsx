/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Flash Sale page layout with SEO metadata + JSON-LD
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const title = isEn ? "Flash Sale - Exclusive Deals | LIKEFOOD" : "Flash Sale - Ưu Đãi Đặc Biệt | LIKEFOOD";
    const description = isEn
        ? "Don't miss LIKEFOOD Flash Sale! Limited-time discounts on premium Vietnamese dried seafood, fruits, and specialty products. Shop now before they're gone."
        : "Đừng bỏ lỡ Flash Sale LIKEFOOD! Giảm giá có thời hạn cho cá khô, tôm khô, trái cây sấy và đặc sản Việt Nam cao cấp. Mua ngay kẻo hết.";

    return {
        title,
        description,
        keywords: [
            "flash sale LIKEFOOD", "giảm giá đặc sản Việt Nam", "khuyến mãi thực phẩm Việt",
            "ưu đãi LIKEFOOD", "Vietnamese food deals", "cá khô giảm giá",
            "tôm khô khuyến mãi", "đặc sản Việt Nam sale", "LIKEFOOD deals",
            "Vietnamese specialty discount", "mua đặc sản giá rẻ",
        ],
        alternates: {
            canonical: "/flash-sale",
            languages: {
                'vi': '/flash-sale?lang=vi',
                'en': '/flash-sale?lang=en',
                'x-default': '/flash-sale',
            },
        },
        openGraph: {
            title,
            description,
            type: "website",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${BASE_URL}/flash-sale`,
            images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "LIKEFOOD Flash Sale" }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`${BASE_URL}/og-image.png`],
        },
    };
}

export default async function FlashSaleLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const offerCatalogSchema = {
        "@context": "https://schema.org",
        "@type": "OfferCatalog",
        name: isEn ? "LIKEFOOD Flash Sale" : "Flash Sale LIKEFOOD",
        description: isEn
            ? "Limited-time deals on premium Vietnamese specialty food."
            : "Ưu đãi có thời hạn cho đặc sản Việt Nam cao cấp.",
        url: `${BASE_URL}/flash-sale`,
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
            { "@type": "ListItem", position: 2, name: "Flash Sale", item: `${BASE_URL}/flash-sale` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([offerCatalogSchema, breadcrumbSchema]) }}
            />
            {children}
        </>
    );
}
