/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FAQContent } from "@/components/faq/FAQContent";

export const revalidate = 86400; // 24 hours for static content

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const title = isEn ? "Frequently Asked Questions - LIKEFOOD" : "Câu hỏi thường gặp - LIKEFOOD";
    const description = isEn
            ? "Answers for common questions about ordering, shipping, payments, and return policies at LIKEFOOD."
            : "Giải đáp các câu hỏi thường gặp về đặt hàng, vận chuyển, thanh toán và chính sách đổi trả tại LIKEFOOD.";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

    return {
        title,
        description,
        alternates: {
            canonical: "/faq",
            languages: {
                'vi': '/faq?lang=vi',
                'en': '/faq?lang=en',
                'x-default': '/faq',
            },
        },
        openGraph: {
            title,
            description,
            type: "website",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${baseUrl}/faq`,
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
    };
}

const FAQ_SCHEMA_DATA = {
    vi: [
        { q: "Tôi có thể mua hàng mà không cần tài khoản không?", a: "Có. Bạn có thể checkout với tư cách khách vãng lai. Tuy nhiên, tài khoản sẽ giúp theo dõi đơn hàng, lưu địa chỉ, nhận voucher và dùng điểm LIKEFOOD Xu thuận tiện hơn." },
        { q: "LIKEFOOD giao hàng tới khu vực nào?", a: "LIKEFOOD phục vụ toàn nước Mỹ. Thời gian nhận hàng phụ thuộc khu vực và phương thức vận chuyển mà bạn chọn trong lúc thanh toán." },
        { q: "Khi nào tôi được miễn phí vận chuyển?", a: "Đơn hàng từ $500 sẽ được miễn phí vận chuyển." },
        { q: "LIKEFOOD hỗ trợ những phương thức thanh toán nào?", a: "Hệ thống hiện hỗ trợ COD, chuyển khoản ngân hàng, thẻ và các cổng thanh toán trực tuyến." },
        { q: "Thông tin thanh toán có an toàn không?", a: "Có. Thanh toán được xử lý qua các cổng bảo mật với các lớp bảo vệ dữ liệu." },
        { q: "Khi nào tôi có thể yêu cầu đổi trả hoặc hoàn tiền?", a: "Bạn có thể gửi yêu cầu khi sản phẩm bị lỗi, giao sai hoặc không đúng mô tả." },
        { q: "LIKEFOOD Xu dùng để làm gì?", a: "LIKEFOOD Xu là điểm thưởng tích lũy khi bạn tương tác và mua sắm. Bạn có thể dùng điểm ở bước thanh toán để giảm giá đơn hàng." },
    ],
    en: [
        { q: "Can I check out without creating an account?", a: "Yes. Guest checkout is available. Creating an account makes it easier to track orders, save addresses, receive vouchers, and redeem LIKEFOOD points." },
        { q: "Where does LIKEFOOD ship?", a: "LIKEFOOD serves customers across the United States. Delivery time depends on your location and selected shipping method at checkout." },
        { q: "When do I qualify for free shipping?", a: "Orders from $500 qualify for free shipping." },
        { q: "What payment methods are available?", a: "Available options include cash on delivery, bank transfer, cards, and selected online payment methods." },
        { q: "Is payment information secure?", a: "Yes. Payments are processed through secure gateways with layered data protections." },
        { q: "When can I request a return or refund?", a: "You can submit a request if a product is damaged, delivered incorrectly, or not as described." },
        { q: "What are LIKEFOOD points used for?", a: "LIKEFOOD points are rewards earned through activity and purchases. Eligible accounts can redeem points at checkout for discounts." },
    ],
};

export default async function FAQPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";

    const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

    const faqBreadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "LIKEFOOD", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: locale === "vi" ? "Câu hỏi thường gặp" : "FAQ", item: `${SITE_URL}/faq` },
        ],
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: FAQ_SCHEMA_DATA[locale].map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
            },
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([faqBreadcrumb, faqJsonLd]) }}
            />
            <FAQContent />
        </>
    );
}
