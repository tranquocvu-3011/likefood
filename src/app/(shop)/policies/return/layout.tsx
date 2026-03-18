/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Return Policy layout with SEO metadata
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const title = isEn ? "Return Policy | LIKEFOOD" : "Chính Sách Đổi Trả | LIKEFOOD";
    const description = isEn
        ? "LIKEFOOD return and refund policy. Learn about eligible return cases, the return process, and our commitment to customer satisfaction."
        : "Chính sách đổi trả và hoàn tiền tại LIKEFOOD. Tìm hiểu các trường hợp đổi trả, quy trình và cam kết chất lượng khách hàng.";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

    return {
        title,
        description,
        alternates: {
            canonical: "/policies/return",
            languages: {
                'vi': '/policies/return?lang=vi',
                'en': '/policies/return?lang=en',
                'x-default': '/policies/return',
            },
        },
        openGraph: {
            title,
            description,
            type: "website",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${baseUrl}/policies/return`,
        },
    };
}

export default function ReturnPolicyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
