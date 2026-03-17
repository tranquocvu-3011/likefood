/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import {
    MapPin, Users, Package, Award, Leaf, Shield, Truck, Heart, ChevronRight, Quote, Star,
    Globe, ShoppingBag, TrendingUp, Handshake, Target, History, Box, Zap,
} from "lucide-react";
import { AboutDynamicSection } from "@/components/about/AboutDynamicSection";

export const revalidate = 86400;

type Locale = "vi" | "en";

const META_COPY: Record<Locale, { title: string; description: string; ogDescription: string }> = {
    vi: {
        title: "Về LIKEFOOD – Nền tảng đặc sản Việt Nam tại Mỹ",
        description: "Khám phá LIKEFOOD – nền tảng bán đặc sản Việt Nam uy tín tại Hoa Kỳ. Câu chuyện thương hiệu, sứ mệnh, giá trị, và cam kết mang hương vị quê nhà đến cộng đồng người Việt xa xứ.",
        ogDescription: "LIKEFOOD – Mang đặc sản Việt Nam đến cộng đồng người Việt tại Hoa Kỳ.",
    },
    en: {
        title: "About LIKEFOOD – Vietnamese Specialty Platform in the U.S.",
        description: "Discover LIKEFOOD – the trusted Vietnamese specialty marketplace in the United States. Our story, mission, values, and commitment to bringing authentic Vietnamese flavors to overseas communities.",
        ogDescription: "LIKEFOOD – Bringing authentic Vietnamese specialties to the U.S. market.",
    },
};

const STATS_COPY = {
    vi: [
        { icon: Package, value: "100+", label: "Sản phẩm đặc sản" },
        { icon: MapPin, value: "50+", label: "Tiểu bang phục vụ" },
        { icon: History, value: "2+", label: "Năm hoạt động" },
        { icon: Users, value: "10,000+", label: "Khách hàng tin tưởng" },
    ],
    en: [
        { icon: Package, value: "100+", label: "Specialty products" },
        { icon: MapPin, value: "50+", label: "States served" },
        { icon: History, value: "2+", label: "Years operating" },
        { icon: Users, value: "10,000+", label: "Trusted customers" },
    ],
} as const;

const PRODUCT_CATEGORIES = {
    vi: [
        { icon: "🐟", name: "Cá khô", desc: "Cá lóc, cá sặc, cá chỉ vàng và nhiều loại cá khô đặc sản miền Tây" },
        { icon: "🦐", name: "Tôm khô & Mực khô", desc: "Tôm khô tự nhiên, mực khô hảo hạng từ các vùng biển Việt Nam" },
        { icon: "🥭", name: "Trái cây sấy", desc: "Trái cây sấy tự nhiên, giữ nguyên hương vị và dinh dưỡng" },
        { icon: "🍵", name: "Trà & Bánh mứt", desc: "Trà truyền thống, bánh mứt đậm đà hương vị Tết Việt Nam" },
    ],
    en: [
        { icon: "🐟", name: "Dried fish", desc: "Snakehead, climbing perch, golden threadfin and many Western specialty dried fish" },
        { icon: "🦐", name: "Dried shrimp & squid", desc: "Natural dried shrimp, premium dried squid from Vietnam's coastal regions" },
        { icon: "🥭", name: "Dried fruits", desc: "Naturally dried fruits, preserving authentic flavor and nutrition" },
        { icon: "🍵", name: "Tea & Confectionery", desc: "Traditional tea, cakes and sweets rich in Vietnamese Tet flavors" },
    ],
} as const;

const VALUES_COPY = {
    vi: [
        { icon: Leaf, title: "Nguyên liệu tự nhiên", description: "Sản phẩm được tuyển chọn từ nguyên liệu tự nhiên, qua sàng lọc kỹ lưỡng từ đội ngũ tại Việt Nam." },
        { icon: Shield, title: "An toàn thực phẩm", description: "Quy trình kiểm định chất lượng nghiêm ngặt, đóng gói theo tiêu chuẩn phù hợp thị trường Hoa Kỳ." },
        { icon: Truck, title: "Giao hàng toàn Mỹ", description: "Giao nhanh đến 50 bang, đóng gói cẩn thận để giữ trọn chất lượng và hương vị sản phẩm." },
        { icon: Heart, title: "Tận tâm phục vụ", description: "Đội ngũ hỗ trợ luôn sẵn sàng đồng hành và giải đáp mọi thắc mắc của bạn mọi lúc." },
        { icon: Handshake, title: "Thương hiệu riêng", description: "LIKEFOOD – thương hiệu riêng, cam kết hương vị Việt, đóng gói chuẩn, nâng tầm giá trị." },
        { icon: Globe, title: "Omnichannel", description: "Kết hợp bán hàng offline hiện hữu và online, trải nghiệm mua sắm liền mạch mọi lúc." },
    ],
    en: [
        { icon: Leaf, title: "Natural ingredients", description: "Products are carefully selected from natural sources by our team in Vietnam." },
        { icon: Shield, title: "Food safety", description: "Rigorous quality controls, packaged to meet U.S. market standards." },
        { icon: Truck, title: "Nationwide U.S. shipping", description: "Fast delivery to all 50 states with careful packaging to preserve quality and flavor." },
        { icon: Heart, title: "Dedicated support", description: "Our support team is always ready to help you with any questions anytime." },
        { icon: Handshake, title: "Own brand", description: "LIKEFOOD – our own brand, committed to Vietnamese flavor, standardized packaging." },
        { icon: Globe, title: "Omnichannel", description: "Combining existing offline and online sales for a seamless shopping experience." },
    ],
} as const;

const TESTIMONIALS_COPY = {
    vi: [
        { name: "Chị Lê Huỳnh Nhiên", location: "California, USA", content: "Nhờ LIKEFOOD mà gia đình tôi ở Mỹ vẫn được thưởng thức hương vị quê nhà. Sản phẩm chất lượng, đóng gói rất cẩn thận.", rating: 5 },
        { name: "Anh Trần Quốc Vũ", location: "Texas, USA", content: "Mua hàng ở đây rất yên tâm, giao nhanh và hỗ trợ nhiệt tình. Tôi sẽ tiếp tục ủng hộ lâu dài.", rating: 5 },
    ],
    en: [
        { name: "Le Huynh Nhien", location: "California, USA", content: "LIKEFOOD helps my family in the U.S. stay connected to Vietnamese flavors. Product quality and packaging are excellent.", rating: 5 },
        { name: "Tran Quoc Vu", location: "Texas, USA", content: "Ordering is reliable, delivery is quick, and support is very helpful. I will keep coming back.", rating: 5 },
    ],
} as const;

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const locale: Locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = META_COPY[locale];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";
    return {
        title: copy.title,
        description: copy.description,
        alternates: {
            canonical: "/about",
            languages: {
                'vi': '/about?lang=vi',
                'en': '/about?lang=en',
                'x-default': '/about',
            },
        },
        openGraph: {
            title: copy.title,
            description: copy.ogDescription,
            type: "website",
            locale: locale === "en" ? "en_US" : "vi_VN",
            alternateLocale: locale === "en" ? "vi_VN" : "en_US",
            url: `${baseUrl}/about`
        },
    };
}

/* ─── Unified palette: soft teal / cyan light ─── */
const ACCENT = "text-teal-600";
const ACCENT_LIGHT = "text-teal-500";
const ACCENT_BG = "bg-teal-500";
const ACCENT_BG_SOFT = "bg-teal-50";
const ACCENT_BORDER = "border-teal-100";

export default async function AboutPage() {
    const cookieStore = await cookies();
    const locale: Locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const isVi = locale === "vi";
    const stats = STATS_COPY[locale];
    const values = VALUES_COPY[locale];
    const testimonials = TESTIMONIALS_COPY[locale];
    const products = PRODUCT_CATEGORIES[locale];

    const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

    const aboutBreadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "LIKEFOOD", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: isVi ? "Về chúng tôi" : "About us", item: `${SITE_URL}/about` },
        ],
    };

    const aboutOrgSchema = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: isVi ? "Về LIKEFOOD" : "About LIKEFOOD",
        description: META_COPY[locale].description,
        url: `${SITE_URL}/about`,
        mainEntity: {
            "@type": "Organization",
            name: "LIKEFOOD",
            url: SITE_URL,
            description: isVi
                ? "Nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chất lượng cao tại Hoa Kỳ."
                : "E-commerce platform providing premium Vietnamese specialty food in the United States.",
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-cyan-50/30">
            {/* SEO: Breadcrumb + AboutPage JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([aboutBreadcrumb, aboutOrgSchema]) }}
            />

            {/* ═══════════════ HERO ═══════════════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/40">
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-1/4 w-[500px] h-[400px] bg-teal-200/30 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-cyan-200/20 rounded-full blur-[120px]" />
                </div>

                <div className="relative page-container-wide py-10 lg:py-14">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-200 rounded-full mb-5">
                            <Heart className="w-3.5 h-3.5 text-teal-500" fill="currentColor" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-teal-600">
                                {isVi ? "Câu chuyện của chúng tôi" : "Our story"}
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-slate-800 mb-4 leading-[1.1]">
                            {isVi ? "Mang " : "Bringing "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500">
                                {isVi ? "hương vị Việt" : "Vietnamese flavor"}
                            </span>
                            <br />
                            {isVi ? "đến người Việt xa xứ" : "to overseas Vietnamese"}
                        </h1>

                        <p className="text-base lg:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
                            {isVi
                                ? "LIKEFOOD ra đời từ nỗi nhớ hương vị quê hương của cộng đồng người Việt tại Mỹ. Chúng tôi tin rằng mỗi món đặc sản không chỉ là thực phẩm, mà còn là sợi dây kết nối với cội nguồn và gia đình."
                                : "LIKEFOOD was born from the longing for home flavors among Vietnamese communities in the U.S. We believe each specialty is not just food, but a connection to roots and family."}
                        </p>
                    </div>

                    {/* Stats inline */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 max-w-3xl mx-auto">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white border border-teal-100 rounded-2xl p-4 text-center shadow-sm">
                                <stat.icon className="w-5 h-5 text-teal-500 mx-auto mb-2" />
                                <div className="text-xl lg:text-2xl font-black text-slate-800">{stat.value}</div>
                                <div className="text-[11px] font-medium text-slate-400 mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <AboutDynamicSection />

            {/* ═══════════════ BỐI CẢNH & SỨ MỆNH ═══════════════ */}
            <section className="py-10 lg:py-14 bg-white">
                <div className="page-container-wide">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                        <div className="relative">
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-teal-50 border border-teal-100/60 shadow-lg shadow-teal-100/30">
                                <Image
                                    src="/images/dacsan.png"
                                    alt={isVi ? "Đặc sản khô Việt Nam" : "Vietnamese dry specialties"}
                                    fill
                                    className="object-cover"
                                    sizes="(min-width: 1024px) 50vw, 100vw"
                                    priority
                                />
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-white border border-teal-100 rounded-xl p-4 shadow-lg hidden lg:flex items-center gap-3">
                                <div className={`w-10 h-10 ${ACCENT_BG_SOFT} rounded-xl flex items-center justify-center`}>
                                    <Target className={`w-5 h-5 ${ACCENT}`} />
                                </div>
                                <div>
                                    <div className={`text-sm font-black ${ACCENT}`}>{isVi ? "Thương hiệu riêng" : "Own brand"}</div>
                                    <div className="text-xs text-slate-400">{isVi ? "Đóng gói theo tiêu chuẩn" : "Standard packaging"}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className={`inline-block px-3 py-1.5 ${ACCENT_BG_SOFT} ${ACCENT_BORDER} border rounded-full text-[11px] font-bold uppercase tracking-widest ${ACCENT} mb-4`}>
                                {isVi ? "Bối cảnh & Sứ mệnh" : "Context & Mission"}
                            </span>
                            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800 mb-4">
                                {isVi ? "Vì sao LIKEFOOD ra đời?" : "Why was LIKEFOOD created?"}
                            </h2>
                            <p className="text-sm lg:text-base text-slate-500 leading-relaxed mb-5">
                                {isVi
                                    ? "Cộng đồng người Việt tại Mỹ có nhu cầu lớn với các đặc sản truyền thống như cá khô, tôm khô, mực khô, trái cây sấy, trà, bánh mứt. Tuy nhiên, thị trường hiện tại tồn tại nhiều hạn chế:"
                                    : "The Vietnamese community in the U.S. has a strong demand for traditional specialties. However, the current market has significant limitations:"}
                            </p>
                            <div className="space-y-3">
                                {[
                                    { t: isVi ? "Khó tiếp cận sản phẩm đúng hương vị" : "Hard to find authentic flavors", d: isVi ? "Người tiêu dùng khó tìm được đặc sản đúng hương vị Việt Nam trên thị trường Mỹ." : "Consumers struggle to find authentic Vietnamese flavored specialties in the U.S. market.", accent: false },
                                    { t: isVi ? "Thiếu thương hiệu uy tín online" : "Lack of trusted online brands", d: isVi ? "Thiếu các thương hiệu có nguồn gốc rõ ràng, quy trình sản xuất – phân phối minh bạch." : "Few brands with clear origins, transparent production and distribution processes online.", accent: false },
                                    { t: isVi ? "LIKEFOOD giải quyết vấn đề này" : "LIKEFOOD solves this problem", d: isVi ? "Xây dựng nền tảng bán hàng online chuyên nghiệp, đáng tin cậy riêng cho cộng đồng người Việt tại Mỹ." : "Building a professional, trustworthy online marketplace specifically for Vietnamese communities in the U.S.", accent: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`w-7 h-7 ${item.accent ? ACCENT_BG_SOFT : 'bg-slate-50'} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${item.accent ? ACCENT_BORDER : 'border-slate-100'}`}>
                                            <ChevronRight className={`w-4 h-4 ${item.accent ? ACCENT : 'text-slate-400'}`} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 text-sm">{item.t}</span>
                                            <p className="text-xs text-slate-400 mt-0.5">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ MỤC TIÊU DỰ ÁN ═══════════════ */}
            <section className="py-10 lg:py-14 bg-gradient-to-b from-teal-50/50 to-white">
                <div className="page-container-wide">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <span className={`inline-block px-3 py-1.5 ${ACCENT_BG_SOFT} ${ACCENT_BORDER} border rounded-full text-[11px] font-bold uppercase tracking-widest ${ACCENT} mb-3`}>
                            {isVi ? "Mục tiêu" : "Objectives"}
                        </span>
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800">
                            {isVi ? "Mục tiêu dự án LIKEFOOD" : "LIKEFOOD project objectives"}
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: TrendingUp, title: isVi ? "Số hóa kinh doanh" : "Digitize business", desc: isVi ? "Số hóa hoạt động kinh doanh đặc sản Việt Nam tại thị trường Mỹ" : "Digitize Vietnamese specialty business operations in the U.S. market" },
                            { icon: ShoppingBag, title: isVi ? "Bán hàng đa kênh" : "Omnichannel sales", desc: isVi ? "Chuẩn hóa mô hình bán hàng online đa kênh kết hợp offline" : "Standardize multi-channel online sales combined with offline" },
                            { icon: Globe, title: isVi ? "Mở rộng tiếp cận" : "Expand reach", desc: isVi ? "Tiếp cận khách hàng qua Website, Facebook, TikTok" : "Reach customers through Website, Facebook, TikTok" },
                            { icon: Zap, title: isVi ? "Tích hợp AI" : "AI integration", desc: isVi ? "Sẵn sàng tích hợp AI để nâng cao trải nghiệm mua sắm" : "Ready to integrate AI to enhance shopping experience" },
                        ].map((item, i) => (
                            <div key={i} className="bg-white border border-teal-100/60 rounded-2xl p-6 group hover:shadow-lg hover:shadow-teal-100/40 transition-all hover:border-teal-200/80">
                                <div className={`w-11 h-11 ${ACCENT_BG} rounded-xl flex items-center justify-center mb-4 shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform`}>
                                    <item.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-2">{item.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ SẢN PHẨM KINH DOANH ═══════════════ */}
            <section className="py-10 lg:py-14 bg-white">
                <div className="page-container-wide">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <span className={`inline-block px-3 py-1.5 ${ACCENT_BG_SOFT} ${ACCENT_BORDER} border rounded-full text-[11px] font-bold uppercase tracking-widest ${ACCENT} mb-3`}>
                            {isVi ? "Nhóm sản phẩm" : "Product categories"}
                        </span>
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800 mb-2">
                            {isVi ? "Đặc sản Việt Nam chính hiệu" : "Authentic Vietnamese specialties"}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {isVi ? "Hương vị Việt – đóng gói theo tiêu chuẩn – thương hiệu riêng LIKEFOOD" : "Vietnamese flavor – standardized packaging – LIKEFOOD's own brand"}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {products.map((p, i) => (
                            <div key={i} className="relative bg-gradient-to-br from-teal-50/60 to-cyan-50/40 border border-teal-100/60 rounded-2xl p-6 group hover:shadow-lg hover:shadow-teal-100/40 transition-all overflow-hidden">
                                <div className="absolute top-3 right-3 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">{p.icon}</div>
                                <div className="text-4xl mb-4">{p.icon}</div>
                                <h3 className="text-base font-bold text-slate-800 mb-2">{p.name}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <Link
                            href="/products"
                            className={`inline-flex items-center gap-2.5 px-7 py-3.5 ${ACCENT_BG} text-white rounded-full font-bold text-sm shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all hover:scale-[1.02]`}
                        >
                            {isVi ? "Khám phá tất cả sản phẩm" : "Explore all products"}
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════ FOUNDER & MODEL ═══════════════ */}
            <section className="py-10 lg:py-14 bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/30 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-[50%] h-[60%] bg-teal-100/40 blur-[150px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-[40%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
                </div>

                <div className="relative page-container-wide">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
                        <div>
                            <span className={`inline-block px-3 py-1.5 ${ACCENT_BG_SOFT} ${ACCENT_BORDER} border rounded-full text-[11px] font-bold uppercase tracking-widest ${ACCENT} mb-4`}>
                                {isVi ? "Người sáng lập" : "Founder"}
                            </span>
                            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800 mb-4">
                                {isVi ? "Câu chuyện thương hiệu" : "Brand story"}
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed mb-5">
                                {isVi
                                    ? "Anh Lê Văn Hiển – người sáng lập LIKEFOOD – đã dành hơn 2 năm xây dựng và phát triển thương hiệu đặc sản Việt Nam tại thị trường Mỹ. Với niềm đam mê mang hương vị quê hương đến cộng đồng người Việt xa xứ, anh đã:"
                                    : "Le Van Hien – the founder of LIKEFOOD – has spent over 2 years building and developing a Vietnamese specialty brand in the U.S. market. With a passion for bringing homeland flavors to overseas Vietnamese, he has:"}
                            </p>

                            <div className="space-y-3">
                                {[
                                    { icon: Box, title: isVi ? "Đưa hơn 100 sản phẩm sang Mỹ" : "Brought 100+ products to the U.S.", desc: isVi ? "Tuyển chọn kỹ lưỡng từ các vùng đặc sản nổi tiếng Việt Nam" : "Carefully selected from Vietnam's most famous specialty regions" },
                                    { icon: MapPin, title: isVi ? "Tổ chức bán hàng offline tại nhiều tiểu bang" : "Organized offline sales across states", desc: isVi ? "Xây dựng kênh bán hàng trực tiếp, tạo niềm tin với cộng đồng" : "Built direct sales channels, earning community trust" },
                                    { icon: Award, title: isVi ? "Quy trình sản xuất chuyên nghiệp" : "Professional production process", desc: isVi ? "Đội ngũ tại Việt Nam trực tiếp khảo sát, chọn lọc, đóng gói và phát triển dưới thương hiệu LIKEFOOD" : "Team in Vietnam directly surveys, selects, packages, and develops under the LIKEFOOD brand" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`w-9 h-9 ${ACCENT_BG_SOFT} ${ACCENT_BORDER} border rounded-xl flex items-center justify-center flex-shrink-0`}>
                                            <item.icon className={`w-4 h-4 ${ACCENT}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                                            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Business model card */}
                        <div className="bg-white border border-teal-100/60 rounded-2xl p-6 lg:p-8 shadow-sm">
                            <h3 className={`text-xl font-black uppercase tracking-tight mb-5 ${ACCENT}`}>
                                {isVi ? "Mô hình kinh doanh" : "Business model"}
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100/60">
                                    <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                                        <ShoppingBag className={`w-4 h-4 ${ACCENT_LIGHT}`} />
                                        {isVi ? "Bán trực tiếp (B2C)" : "Direct to consumer (B2C)"}
                                    </h4>
                                    <p className="text-xs text-slate-500">{isVi ? "Kết hợp bán offline (hiện có) và online để mở rộng quy mô, tiếp cận cộng đồng người Việt trên toàn nước Mỹ." : "Combining existing offline and online sales to expand reach across Vietnamese communities throughout the U.S."}</p>
                                </div>

                                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100/60">
                                    <h4 className="font-bold text-slate-800 text-sm mb-2">{isVi ? "Kênh bán hàng" : "Sales channels"}</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[{ icon: "🌐", name: "Website" }, { icon: "📘", name: "Facebook" }, { icon: "🎵", name: "TikTok" }].map((ch, i) => (
                                            <div key={i} className="bg-white rounded-lg p-2.5 text-center border border-teal-100/50 shadow-sm">
                                                <div className="text-xl mb-0.5">{ch.icon}</div>
                                                <div className="text-[10px] font-bold text-slate-500">{ch.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100/60">
                                    <h4 className="font-bold text-slate-800 text-sm mb-2">{isVi ? "Khách hàng mục tiêu" : "Target customers"}</h4>
                                    <ul className="space-y-1.5 text-xs text-slate-500">
                                        <li className="flex items-center gap-2"><Users className={`w-3.5 h-3.5 ${ACCENT_LIGHT} flex-shrink-0`} />{isVi ? "Người Việt Nam tại Mỹ (25 – 55 tuổi)" : "Vietnamese in the U.S. (ages 25 – 55)"}</li>
                                        <li className="flex items-center gap-2"><ShoppingBag className={`w-3.5 h-3.5 ${ACCENT_LIGHT} flex-shrink-0`} />{isVi ? "Mua đặc sản để sử dụng hoặc làm quà tặng" : "Buy specialties for personal use or as gifts"}</li>
                                        <li className="flex items-center gap-2"><Truck className={`w-3.5 h-3.5 ${ACCENT_LIGHT} flex-shrink-0`} />{isVi ? "Ưu tiên mua online, giao hàng nội địa Mỹ" : "Prefer online ordering with U.S. domestic shipping"}</li>
                                        <li className="flex items-center gap-2"><Heart className={`w-3.5 h-3.5 ${ACCENT_LIGHT} flex-shrink-0`} />{isVi ? "Tin tưởng thương hiệu có lịch sử hoạt động rõ ràng" : "Trust brands with clear operational history"}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ GIÁ TRỊ CỐT LÕI ═══════════════ */}
            <section className="py-10 lg:py-14 bg-gradient-to-b from-teal-50/40 to-white">
                <div className="page-container-wide">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <span className={`inline-block px-3 py-1.5 ${ACCENT_BG_SOFT} ${ACCENT_BORDER} border rounded-full text-[11px] font-bold uppercase tracking-widest ${ACCENT} mb-3`}>
                            {isVi ? "Giá trị cốt lõi" : "Core values"}
                        </span>
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800 mb-2">
                            {isVi ? "Tại sao chọn LIKEFOOD?" : "Why choose LIKEFOOD?"}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {isVi ? "Chúng tôi cam kết mang đến trải nghiệm mua sắm tốt nhất cho bạn" : "We are committed to delivering an outstanding shopping experience."}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {values.map((value, i) => (
                            <div key={i} className="bg-white border border-teal-100/60 rounded-2xl p-6 group hover:shadow-lg hover:shadow-teal-100/40 transition-all hover:border-teal-200/80">
                                <div className={`w-11 h-11 ${ACCENT_BG_SOFT} ${ACCENT_BORDER} border rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-500 transition-all`}>
                                    <value.icon className={`w-5 h-5 ${ACCENT} group-hover:text-white transition-colors`} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-2">{value.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ TESTIMONIALS ═══════════════ */}
            <section className="py-10 lg:py-14 bg-white">
                <div className="page-container-wide">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <span className={`inline-block px-3 py-1.5 ${ACCENT_BG_SOFT} ${ACCENT_BORDER} border rounded-full text-[11px] font-bold uppercase tracking-widest ${ACCENT} mb-3`}>
                            {isVi ? "Khách hàng nói gì" : "What customers say"}
                        </span>
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800">
                            {isVi ? "Yêu thương từ cộng đồng" : "Love from the community"}
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                        {testimonials.map((t, i) => (
                            <div key={i} className="bg-gradient-to-br from-teal-50/60 to-cyan-50/40 border border-teal-100/60 rounded-2xl p-6 relative">
                                <Quote className="w-8 h-8 text-teal-200 absolute top-5 right-5" />
                                <div className="flex items-center gap-0.5 mb-3">
                                    {[...Array(t.rating)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 text-teal-400" fill="currentColor" />
                                    ))}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">
                                    &quot;{t.content}&quot;
                                </p>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                                    <div className="text-xs text-slate-400">{t.location}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ CTA ═══════════════ */}
            <section className="py-10 lg:py-14 bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-white/10 rounded-full blur-[100px]" />
                </div>
                <div className="relative page-container-wide text-center">
                    <h2 className="text-2xl lg:text-4xl font-black uppercase tracking-tight text-white mb-4">
                        {isVi ? "Sẵn sàng thưởng thức đặc sản Việt?" : "Ready to enjoy Vietnamese specialties?"}
                    </h2>
                    <p className="text-base text-white/80 max-w-xl mx-auto mb-7">
                        {isVi ? "Đặt hàng ngay hôm nay và nhận ưu đãi đặc biệt dành cho khách hàng mới" : "Place your order today and unlock special offers for new customers."}
                    </p>
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-teal-600 rounded-full font-black uppercase tracking-wider text-sm shadow-2xl hover:shadow-white/30 transition-all hover:scale-[1.02]"
                    >
                        {isVi ? "Mua sắm ngay" : "Shop now"}
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
