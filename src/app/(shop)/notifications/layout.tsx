/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Notifications page layout with SEO metadata
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    return {
        title: isEn ? "Notifications - LIKEFOOD" : "Thông Báo - LIKEFOOD",
        description: isEn
            ? "View your LIKEFOOD notifications — order updates, promotions, and important announcements."
            : "Xem thông báo LIKEFOOD — cập nhật đơn hàng, khuyến mãi và thông báo quan trọng.",
        alternates: {
            canonical: "/notifications",
            languages: {
                'vi': '/notifications?lang=vi',
                'en': '/notifications?lang=en',
                'x-default': '/notifications',
            },
        },
        robots: { index: false, follow: false },
        openGraph: {
            title: isEn ? "Notifications - LIKEFOOD" : "Thông Báo - LIKEFOOD",
            description: isEn
                ? "View your LIKEFOOD notifications — order updates, promotions, and important announcements."
                : "Xem thông báo LIKEFOOD — cập nhật đơn hàng, khuyến mãi và thông báo quan trọng.",
            type: "website",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${BASE_URL}/notifications`,
        },
    };
}

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
