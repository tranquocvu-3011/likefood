/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Custom 404 Page with SEO metadata, internal links, and schema
 */

import type { Metadata } from "next";
import Link from "next/link";
import { MoveLeft, Search, ShoppingBag, BookOpen, HelpCircle } from "lucide-react";
import { cookies } from "next/headers";

export const metadata: Metadata = {
    title: "Trang không tồn tại (404) | LIKEFOOD",
    description: "Trang bạn tìm kiếm không tồn tại. Khám phá đặc sản Việt Nam chính gốc tại LIKEFOOD: cá khô, tôm khô, mực khô, trái cây sấy. Giao hàng toàn nước Mỹ.",
    robots: { index: false, follow: true },
};

const POPULAR_LINKS = [
    { href: "/products", icon: ShoppingBag, vi: "Tất cả sản phẩm", en: "All Products" },
    { href: "/products?category=ca-kho", icon: Search, vi: "Cá khô miền Tây", en: "Dried Fish" },
    { href: "/products?category=tom-muc-kho", icon: Search, vi: "Tôm & Mực khô", en: "Dried Shrimp & Squid" },
    { href: "/posts", icon: BookOpen, vi: "Blog & Hướng dẫn", en: "Blog & Guides" },
    { href: "/faq", icon: HelpCircle, vi: "Câu hỏi thường gặp", en: "FAQ" },
];

export default async function NotFound() {
    const cookieStore = await cookies();
    const lang = cookieStore.get("language")?.value === "en" ? "en" : "vi";

    const copy = {
        vi: {
            title: "Trang không tồn tại!",
            description: "Rất tiếc, đường dẫn bạn đang truy cập không tồn tại hoặc đã bị di dời.",
            tryThis: "Bạn có thể thử:",
            backHome: "Quay lại Trang chủ",
        },
        en: {
            title: "Page Not Found!",
            description: "Sorry, the page you are looking for does not exist or has been moved.",
            tryThis: "You can try:",
            backHome: "Back to Homepage",
        },
    }[lang];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
            <div className="relative mb-6">
                <h1 className="text-[10rem] font-black text-slate-200 leading-none select-none">404</h1>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-3 text-black">{copy.title}</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-base">{copy.description}</p>

            {/* Internal Links — SEO: helps Google discover important pages */}
            <div className="mb-8 w-full max-w-sm">
                <p className="text-sm font-bold text-slate-700 mb-3">{copy.tryThis}</p>
                <div className="space-y-2">
                    {POPULAR_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition text-sm font-medium text-slate-700 hover:text-primary"
                        >
                            <link.icon className="w-4 h-4 shrink-0" />
                            {lang === "en" ? link.en : link.vi}
                        </Link>
                    ))}
                </div>
            </div>

            <Link
                href="/"
                className="flex items-center gap-3 px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-primary transition-all shadow-lg group"
            >
                <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                {copy.backHome}
            </Link>
        </div>
    );
}
