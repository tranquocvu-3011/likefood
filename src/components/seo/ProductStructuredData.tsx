/**
 * LIKEFOOD - Product Structured Data (Server Component)
 * Renders Product JSON-LD server-side for Google rich results.
 */

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

interface ProductForSchema {
    name: string;
    slug?: string | null;
    description?: string;
    price: number;
    salePrice?: number | null;
    images?: string[];
    stock?: number;
    avgRating?: number | null;
    reviewCount?: number;
    category?: { name: string; slug?: string | null } | null;
    brand?: { name: string } | null;
}

interface Props {
    product: ProductForSchema;
}

export default function ProductStructuredData({ product }: Props) {
    const url = `${SITE_URL}/products/${product.slug || ""}`;
    const imageUrl = product.images?.[0]
        ? (product.images[0].startsWith("http") ? product.images[0] : `${SITE_URL}${product.images[0]}`)
        : `${SITE_URL}/og-image.png`;

    const price = product.salePrice || product.price;
    const availability = (product.stock ?? 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": url,
        name: product.name,
        description: product.description || product.name,
        image: imageUrl,
        url,
        brand: {
            "@type": "Brand",
            name: product.brand?.name || "LIKEFOOD",
        },
        seller: {
            "@type": "Organization",
            name: "LIKEFOOD",
        },
        offers: {
            "@type": "Offer",
            url,
            priceCurrency: "USD",
            price: price.toFixed(2),
            availability,
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: "LIKEFOOD" },
        },
    };

    if (product.avgRating && (product.reviewCount ?? 0) > 0) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: product.avgRating.toFixed(1),
            reviewCount: product.reviewCount,
            bestRating: "5",
            worstRating: "1",
        };
    }

    const breadcrumbItems = [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Sản phẩm", item: `${SITE_URL}/products` },
    ];

    if (product.category) {
        breadcrumbItems.push({
            "@type": "ListItem",
            position: 3,
            name: product.category.name,
            item: `${SITE_URL}/products?category=${product.category.slug || ""}`,
        });
    }

    breadcrumbItems.push({
        "@type": "ListItem",
        position: breadcrumbItems.length + 1,
        name: product.name,
        item: url,
    });

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, breadcrumbSchema]) }}
        />
    );
}
