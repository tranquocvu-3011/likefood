/**
 * LIKEFOOD - Structured Data Component (Server Component)
 * Renders merged Organization+LocalBusiness, WebSite, BreadcrumbList,
 * and WebPage JSON-LD server-side so Google can see them in the initial HTML response.
 *
 * SEO-FIX: Merged Organization + LocalBusiness into a single entity
 * with @type array per Google best practices.
 * Added @id to BreadcrumbList so WebPage can reference it.
 */

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";
const SITE_NAME = "LIKEFOOD - Đặc Sản Việt Nam Tại Mỹ";

export default function StructuredData() {
    // Merged Organization + LocalBusiness into a single entity (Google recommended)
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": ["Organization", "LocalBusiness"],
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/logo.png`,
        },
        image: `${SITE_URL}/og-image.png`,
        description: "LIKEFOOD - Cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. 100+ sản phẩm chính gốc miền Tây: cá khô, tôm khô Cà Mau, mực khô, trái cây sấy, mắm truyền thống. Giao hàng nhanh 2-3 ngày toàn nước Mỹ. Chất lượng FDA.",
        telephone: "+1-402-315-8105",
        email: "tranquocvu3011@gmail.com",
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+1-402-315-8105",
            email: "tranquocvu3011@gmail.com",
            contactType: "customer service",
            availableLanguage: ["Vietnamese", "English"],
        },
        address: {
            "@type": "PostalAddress",
            addressLocality: "Omaha",
            addressRegion: "NE",
            postalCode: "68136",
            addressCountry: "US",
        },
        priceRange: "$$",
        currenciesAccepted: "USD",
        paymentAccepted: "Credit Card, Stripe, Apple Pay, Google Pay",
        areaServed: {
            "@type": "Country",
            name: "United States",
        },
        geo: {
            "@type": "GeoCoordinates",
            latitude: 41.2149,
            longitude: -96.1249,
        },
        hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Đặc sản Việt Nam",
            itemListElement: [
                { "@type": "OfferCatalog", name: "Cá khô miền Tây" },
                { "@type": "OfferCatalog", name: "Tôm & Mực khô" },
                { "@type": "OfferCatalog", name: "Trái cây sấy" },
                { "@type": "OfferCatalog", name: "Gia vị Việt Nam" },
                { "@type": "OfferCatalog", name: "Trà & Bánh mứt" },
            ],
        },
        openingHoursSpecification: [
            {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                opens: "00:00",
                closes: "23:59"
            }
        ],
        sameAs: [
            "https://www.facebook.com/profile.php?id=100076170558548",
            "https://instagram.com/likefood",
            "https://likefood.app",
        ],
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: "vi",
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/#breadcrumb`,
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: SITE_NAME,
                item: SITE_URL,
            },
        ],
    };

    const webPageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        name: "LIKEFOOD - Đặc Sản Việt Nam Chính Gốc Tại Mỹ | Vietnamese Specialty Food USA",
        description: "LIKEFOOD - Cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. 100+ sản phẩm chính gốc: cá khô miền Tây, tôm khô Cà Mau, mực khô, trái cây sấy, mắm truyền thống, gia vị Việt. Giao hàng nhanh 2-3 ngày toàn nước Mỹ. Miễn phí ship đơn từ $500.",
        url: SITE_URL,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        primaryImageOfPage: {
            "@type": "ImageObject",
            url: `${SITE_URL}/og-image.png`,
        },
        inLanguage: "vi",
        breadcrumb: { "@id": `${SITE_URL}/#breadcrumb` },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify([organizationSchema, websiteSchema, breadcrumbSchema, webPageSchema]),
            }}
        />
    );
}
