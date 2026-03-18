/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Vouchers page layout with SEO metadata + JSON-LD
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const title = isEn ? "Vouchers & Promotions | LIKEFOOD" : "Voucher & Khuyến Mãi | LIKEFOOD";
    const description = isEn
        ? "Browse LIKEFOOD vouchers and promotions. Save on premium Vietnamese specialty food with exclusive discount codes and free shipping offers."
        : "Khám phá voucher và khuyến mãi LIKEFOOD. Tiết kiệm khi mua đặc sản Việt Nam với mã giảm giá và ưu đãi miễn phí vận chuyển.";

    return {
        title,
        description,
        keywords: [
            "voucher LIKEFOOD", "mã giảm giá LIKEFOOD", "khuyến mãi đặc sản Việt Nam",
            "LIKEFOOD promo code", "LIKEFOOD discount", "giảm giá thực phẩm Việt",
            "free shipping LIKEFOOD", "miễn phí ship LIKEFOOD",
        ],
        alternates: {
            canonical: "/vouchers",
            languages: {
                'vi': '/vouchers?lang=vi',
                'en': '/vouchers?lang=en',
                'x-default': '/vouchers',
            },
        },
        openGraph: {
            title,
            description,
            type: "website",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${BASE_URL}/vouchers`,
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
    };
}

export default async function VouchersLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "LIKEFOOD", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: isEn ? "Vouchers" : "Voucher", item: `${BASE_URL}/vouchers` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            {children}
        </>
    );
}
