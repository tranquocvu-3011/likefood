/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Contact page layout with SEO metadata + JSON-LD
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const title = isEn ? "Contact Us - LIKEFOOD" : "Liên Hệ - LIKEFOOD";
    const description = isEn
        ? "Get in touch with LIKEFOOD. We're here to help with orders, product questions, and customer support. Phone: +1 402-315-8105. 24/7 assistance available."
        : "Liên hệ với LIKEFOOD. Chúng tôi sẵn sàng hỗ trợ đơn hàng, tư vấn sản phẩm và chăm sóc khách hàng. SĐT: +1 402-315-8105. Hỗ trợ 24/7.";

    return {
        title,
        description,
        keywords: [
            "liên hệ LIKEFOOD", "contact LIKEFOOD", "mua đặc sản Việt Nam",
            "đặc sản Việt Nam tại Mỹ", "Vietnamese food USA contact",
            "LIKEFOOD hotline", "đặt hàng đặc sản", "hỗ trợ khách hàng LIKEFOOD",
            "LIKEFOOD phone number", "LIKEFOOD email", "LIKEFOOD address",
        ],
        alternates: {
            canonical: "/contact",
            languages: {
                'vi': '/contact?lang=vi',
                'en': '/contact?lang=en',
                'x-default': '/contact',
            },
        },
        openGraph: {
            title,
            description,
            type: "website",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${BASE_URL}/contact`,
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
    };
}

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const contactSchema = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: isEn ? "Contact LIKEFOOD" : "Liên hệ LIKEFOOD",
        description: isEn
            ? "Contact LIKEFOOD for orders, questions, and customer support."
            : "Liên hệ LIKEFOOD để đặt hàng, hỏi đáp và hỗ trợ khách hàng.",
        url: `${BASE_URL}/contact`,
        mainEntity: {
            "@type": "Organization",
            name: "LIKEFOOD",
            url: BASE_URL,
            telephone: "+1-402-315-8105",
            email: "tranquocvu3011@gmail.com",
            address: {
                "@type": "PostalAddress",
                addressLocality: "Omaha",
                addressRegion: "NE",
                postalCode: "68136",
                addressCountry: "US",
            },
            contactPoint: {
                "@type": "ContactPoint",
                telephone: "+1-402-315-8105",
                contactType: "customer service",
                availableLanguage: ["Vietnamese", "English"],
                hoursAvailable: {
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    opens: "00:00",
                    closes: "23:59",
                },
            },
        },
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "LIKEFOOD", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: isEn ? "Contact" : "Liên hệ", item: `${BASE_URL}/contact` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([contactSchema, breadcrumbSchema]) }}
            />
            {children}
        </>
    );
}
