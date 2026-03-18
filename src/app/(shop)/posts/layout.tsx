/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Blog/Posts layout with SEO metadata + JSON-LD
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const title = isEn ? "Blog - Food Guides & News | LIKEFOOD" : "Bài Viết - Cẩm Nang & Tin Tức | LIKEFOOD";
    const description = isEn
        ? "Explore LIKEFOOD's blog for Vietnamese food guides, cooking tips, product reviews, promotions, and the latest news from our team."
        : "Khám phá blog LIKEFOOD với cẩm nang ẩm thực Việt, mẹo nấu ăn, đánh giá sản phẩm, khuyến mãi và tin tức mới nhất.";

    return {
        title,
        description,
        keywords: [
            "blog LIKEFOOD", "likefood là gì", "đặc sản Việt Nam", "cẩm nang ẩm thực Việt",
            "Vietnamese food guide", "mẹo nấu ăn Việt Nam", "tin tức LIKEFOOD",
            "hướng dẫn mua đặc sản", "kinh nghiệm mua đồ khô Việt Nam",
            "Vietnamese food blog", "LIKEFOOD news", "đặc sản Việt tại Mỹ blog",
        ],
        alternates: {
            canonical: "/posts",
            languages: {
                'vi': '/posts?lang=vi',
                'en': '/posts?lang=en',
                'x-default': '/posts',
            },
        },
        openGraph: {
            title,
            description,
            type: "website",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${BASE_URL}/posts`,
            images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "LIKEFOOD Blog" }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`${BASE_URL}/og-image.png`],
        },
    };
}

export default async function PostsLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const blogSchema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: isEn ? "LIKEFOOD Blog" : "Blog LIKEFOOD",
        description: isEn
            ? "Vietnamese food guides, cooking tips, product reviews and news from LIKEFOOD."
            : "Cẩm nang ẩm thực Việt, mẹo nấu ăn, đánh giá sản phẩm và tin tức từ LIKEFOOD.",
        url: `${BASE_URL}/posts`,
        inLanguage: isEn ? "en" : "vi",
        publisher: {
            "@type": "Organization",
            name: "LIKEFOOD",
            url: BASE_URL,
            logo: {
                "@type": "ImageObject",
                url: `${BASE_URL}/logo.png`,
            },
        },
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "LIKEFOOD", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: isEn ? "Blog" : "Bài viết", item: `${BASE_URL}/posts` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([blogSchema, breadcrumbSchema]) }}
            />
            {children}
        </>
    );
}
