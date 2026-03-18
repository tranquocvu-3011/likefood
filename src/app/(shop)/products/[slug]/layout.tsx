/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Metadata } from "next";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    try {
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { id: Number(slug)},
                    { slug: slug }
                ]
            },
            select: {
                name: true,
                description: true,
                price: true,
                salePrice: true,
                image: true,
                category: true,
            },
        });

        if (!product) {
            return {
                title: isEn ? "Product Not Found" : "Sản phẩm không tồn tại",
                description: isEn ? "The requested product could not be found." : "Không tìm thấy sản phẩm yêu cầu.",
                alternates: {
                    canonical: `${BASE_URL}/products/${slug}`,
                    languages: {
                        'vi': `${BASE_URL}/products/${slug}?lang=vi`,
                        'en': `${BASE_URL}/products/${slug}?lang=en`,
                        'x-default': `${BASE_URL}/products/${slug}`,
                    },
                },
            };
        }

        const currentPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
        const priceStr = `$${currentPrice.toFixed(2)}`;
        const title = `${product.name} - ${product.category}`;
        const productUrl = `${BASE_URL}/products/${slug}`;
        
        // Build SEO description with price while keeping concise length.
        const description = product.description 
            ? `${product.description.substring(0, 140)}... ${isEn ? `[Price: ${priceStr}]` : `[Giá: ${priceStr}]`}`
            : isEn
                ? `Buy authentic ${product.name} from the ${product.category} category at LIKEFOOD for ${priceStr}. Fast U.S. shipping and trusted food quality.`
                : `Mua ngay ${product.name} chính gốc - Đặc sản ${product.category} chất lượng cao tại LIKEFOOD chỉ với ${priceStr}. Giao hàng nhanh toàn nước Mỹ, đảm bảo vệ sinh an toàn thực phẩm.`;

        const images = product.image ? [product.image] : ["/og-image.png"];

        return {
            title,
            description,
            alternates: {
                canonical: productUrl,
                languages: {
                    'vi': productUrl,
                    'en': `${productUrl}?lang=en`,
                    'x-default': productUrl,
                },
            },
            openGraph: {
                title,
                description,
                images,
                type: "website",
                siteName: "LIKEFOOD",
                locale: isEn ? "en_US" : "vi_VN",
                alternateLocale: isEn ? "vi_VN" : "en_US",
                url: productUrl,
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images,
                creator: "@likefood",
            },
        };
    } catch {
        return {
            title: isEn ? "Vietnamese Specialty Products" : "Sản phẩm đặc sản Việt Nam",
            description: isEn
                ? "Explore premium Vietnamese specialty products at LIKEFOOD."
                : "Khám phá các loại đặc sản Việt Nam chất lượng cao tại LIKEFOOD.",
            alternates: {
                canonical: `${BASE_URL}/products/${slug}`,
                languages: {
                    'vi': `${BASE_URL}/products?lang=vi`,
                    'en': `${BASE_URL}/products?lang=en`,
                    'x-default': `${BASE_URL}/products`,
                },
            },
        };
    }
}

export default function ProductLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
