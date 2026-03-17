/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * SEO-001: JSON-LD Structured Data Component
 *
 * Generates structured data for Google Rich Results.
 * Supports: Organization, Product, BreadcrumbList, FAQ.
 */

import React from "react";

type JsonLdProps = {
    data: Record<string, unknown>;
};

/**
 * Renders JSON-LD structured data in a script tag
 */
export function JsonLd({ data }: JsonLdProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

/**
 * Organization structured data for LIKEFOOD
 */
export function OrganizationJsonLd({ url }: { url: string }) {
    const data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "LIKEFOOD",
        url,
        logo: `${url}/icon-512.png`,
        description:
            "Nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chất lượng cao tại Hoa Kỳ.",
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: ["Vietnamese", "English"],
        },
        sameAs: [],
    };

    return <JsonLd data={data} />;
}

/**
 * Product structured data
 */
export function ProductJsonLd({
    name,
    description,
    image,
    price,
    salePrice,
    currency = "USD",
    availability,
    ratingValue,
    ratingCount,
    brand,
    sku,
    url,
}: {
    name: string;
    description: string;
    image: string;
    price: number;
    salePrice?: number | null;
    currency?: string;
    availability: "InStock" | "OutOfStock" | "PreOrder";
    ratingValue?: number;
    ratingCount?: number;
    brand?: string;
    sku?: string | null;
    url: string;
}) {
    const data: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description,
        image,
        url,
        offers: {
            "@type": "Offer",
            price: salePrice ?? price,
            priceCurrency: currency,
            availability: `https://schema.org/${availability}`,
            ...(salePrice && {
                priceValidUntil: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                )
                    .toISOString()
                    .split("T")[0],
            }),
        },
    };

    if (brand) {
        data.brand = { "@type": "Brand", name: brand };
    }
    if (sku) {
        data.sku = sku;
    }
    if (ratingValue && ratingCount && ratingCount > 0) {
        data.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue,
            reviewCount: ratingCount,
            bestRating: 5,
            worstRating: 1,
        };
    }

    return <JsonLd data={data} />;
}

/**
 * Breadcrumb structured data
 */
export function BreadcrumbJsonLd({
    items,
}: {
    items: { name: string; url: string }[];
}) {
    const data = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return <JsonLd data={data} />;
}

/**
 * FAQ structured data
 */
export function FAQJsonLd({
    questions,
}: {
    questions: { question: string; answer: string }[];
}) {
    const data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: q.answer,
            },
        })),
    };

    return <JsonLd data={data} />;
}
