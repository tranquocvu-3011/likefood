/**
 * LIKEFOOD - SEO Landing Page: "LIKEFOOD là gì?"
 * Trang đích SEO chuyên biệt cho từ khóa "likefood", "likefood là gì"
 * Server-rendered để Google có thể crawl đầy đủ nội dung
 */

import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const isEn = cookieStore.get("language")?.value === "en";

    const title = isEn
        ? "What is LIKEFOOD? Vietnamese Specialty Food Platform in the USA"
        : "LIKEFOOD là gì? Nền tảng đặc sản Việt Nam hàng đầu tại Mỹ";
    const description = isEn
        ? "LIKEFOOD is the leading e-commerce platform for authentic Vietnamese specialty food in the United States. Dried fish, shrimp, squid, fruits & more. Fast delivery nationwide."
        : "LIKEFOOD là nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chính gốc tại Hoa Kỳ. Cá khô, tôm khô, mực khô, trái cây sấy. Giao hàng nhanh toàn nước Mỹ.";

    return {
        title,
        description,
        keywords: [
            "likefood", "likefood là gì", "LIKEFOOD", "like food",
            "đặc sản Việt Nam tại Mỹ", "Vietnamese specialty food USA",
            "mua đặc sản Việt Nam online", "cá khô", "tôm khô", "mực khô",
            "ship đặc sản Việt Nam sang Mỹ", "Vietnamese food delivery USA",
            "likefood review", "likefood đặc sản", "thực phẩm Việt tại Mỹ",
        ],
        alternates: {
            canonical: `${BASE_URL}/likefood-la-gi`,
            languages: {
                'vi': `${BASE_URL}/likefood-la-gi?lang=vi`,
                'en': `${BASE_URL}/likefood-la-gi?lang=en`,
                'x-default': `${BASE_URL}/likefood-la-gi`,
            },
        },
        openGraph: {
            title,
            description,
            type: "article",
            locale: isEn ? "en_US" : "vi_VN",
            alternateLocale: isEn ? "vi_VN" : "en_US",
            url: `${BASE_URL}/likefood-la-gi`,
            images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "LIKEFOOD - Đặc sản Việt Nam" }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [`${BASE_URL}/og-image.png`],
        },
    };
}

export default async function LikefoodLaGiPage() {
    const cookieStore = await cookies();
    const isVi = cookieStore.get("language")?.value !== "en";

    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: isVi ? "LIKEFOOD là gì? Nền tảng đặc sản Việt Nam hàng đầu tại Mỹ" : "What is LIKEFOOD?",
            description: isVi
                ? "Tìm hiểu LIKEFOOD - nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam tại Hoa Kỳ."
                : "Learn about LIKEFOOD - the e-commerce platform for Vietnamese specialty food in the USA.",
            image: `${BASE_URL}/og-image.png`,
            author: { "@type": "Organization", name: "LIKEFOOD", url: BASE_URL },
            publisher: {
                "@type": "Organization",
                name: "LIKEFOOD",
                url: BASE_URL,
                logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
            },
            datePublished: "2026-01-01T00:00:00+07:00",
            dateModified: new Date().toISOString(),
            mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/likefood-la-gi` },
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "LIKEFOOD", item: BASE_URL },
                { "@type": "ListItem", position: 2, name: isVi ? "LIKEFOOD là gì?" : "What is LIKEFOOD?", item: `${BASE_URL}/likefood-la-gi` },
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: isVi ? "LIKEFOOD là gì?" : "What is LIKEFOOD?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: isVi
                            ? "LIKEFOOD là nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chính gốc tại Hoa Kỳ, bao gồm cá khô, tôm khô, mực khô, trái cây sấy và nhiều sản phẩm đặc sản khác."
                            : "LIKEFOOD is an e-commerce platform specializing in authentic Vietnamese specialty food in the United States.",
                    },
                },
                {
                    "@type": "Question",
                    name: isVi ? "LIKEFOOD giao hàng ở đâu?" : "Where does LIKEFOOD deliver?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: isVi
                            ? "LIKEFOOD giao hàng toàn nước Mỹ đến tất cả 50 bang, trong thời gian 2-3 ngày làm việc. Miễn phí vận chuyển cho đơn hàng từ $500."
                            : "LIKEFOOD delivers to all 50 US states within 2-3 business days. Free shipping for orders from $500.",
                    },
                },
                {
                    "@type": "Question",
                    name: isVi ? "LIKEFOOD bán sản phẩm gì?" : "What products does LIKEFOOD sell?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: isVi
                            ? "LIKEFOOD chuyên cung cấp đặc sản Việt Nam: cá khô miền Tây, tôm khô Cà Mau, mực khô, trái cây sấy, gia vị, nước mắm Phú Quốc và nhiều sản phẩm đặc sản khác."
                            : "LIKEFOOD specializes in Vietnamese specialties: dried fish, Ca Mau dried shrimp, dried squid, dried fruits, spices, Phu Quoc fish sauce and more.",
                    },
                },
            ],
        },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <article className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-amber-50/30">
                {/* Breadcrumb */}
                <div className="page-container-wide pt-6 pb-2">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
                        <Link href="/" className="hover:text-primary transition-colors">
                            {isVi ? "Trang chủ" : "Home"}
                        </Link>
                        <span>/</span>
                        <span className="text-primary font-semibold">LIKEFOOD {isVi ? "là gì?" : "- What is?"}</span>
                    </nav>
                </div>

                {/* Hero */}
                <header className="page-container-wide py-8 md:py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full mb-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                {isVi ? "Giới thiệu thương hiệu" : "Brand Introduction"}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
                            {isVi ? (
                                <>LIKEFOOD là gì?<br /><span className="text-primary">Đặc sản Việt Nam tại Mỹ</span></>
                            ) : (
                                <>What is LIKEFOOD?<br /><span className="text-primary">Vietnamese Specialties in the USA</span></>
                            )}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            {isVi
                                ? "LIKEFOOD là nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chính gốc tại Hoa Kỳ. Mang hương vị quê hương đến gần hơn với người Việt xa xứ."
                                : "LIKEFOOD is the leading e-commerce platform for authentic Vietnamese specialty food in the United States. Bringing homeland flavors closer to Vietnamese abroad."}
                        </p>
                    </div>
                </header>

                {/* Main Content */}
                <div className="page-container-wide pb-16">
                    <div className="max-w-4xl mx-auto">
                        {/* Section 1: Giới thiệu */}
                        <section className="mb-12">
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">
                                    {isVi ? "🏪 LIKEFOOD — Nền tảng đặc sản Việt Nam hàng đầu" : "🏪 LIKEFOOD — The Leading Vietnamese Specialty Platform"}
                                </h2>
                                <div className="prose prose-lg max-w-none text-slate-600">
                                    {isVi ? (
                                        <>
                                            <p><strong>LIKEFOOD</strong> là thương hiệu thương mại điện tử ra đời từ tình yêu và nỗi nhớ hương vị quê hương của cộng đồng người Việt tại Hoa Kỳ. Chúng tôi chuyên cung cấp hơn <strong>100 loại đặc sản Việt Nam</strong> được tuyển chọn kỹ lưỡng từ các vùng miền khắp cả nước.</p>
                                            <p>Từ <strong>cá khô miền Tây</strong>, <strong>tôm khô Cà Mau</strong>, <strong>mực khô Phan Thiết</strong> đến <strong>trái cây sấy</strong>, <strong>gia vị truyền thống</strong> — tất cả đều được sàng lọc chất lượng và đóng gói theo tiêu chuẩn an toàn thực phẩm phù hợp thị trường Mỹ.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p><strong>LIKEFOOD</strong> is an e-commerce brand born from the love and nostalgia for homeland flavors among the Vietnamese community in the United States. We specialize in providing over <strong>100 types of Vietnamese specialties</strong> carefully selected from regions across the country.</p>
                                            <p>From <strong>Western dried fish</strong>, <strong>Ca Mau dried shrimp</strong>, <strong>Phan Thiet dried squid</strong> to <strong>dried fruits</strong> and <strong>traditional spices</strong> — all quality-checked and packaged to U.S. food safety standards.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Sản phẩm */}
                        <section className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center">
                                {isVi ? "🛍️ Sản phẩm LIKEFOOD" : "🛍️ LIKEFOOD Products"}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { icon: "🐟", title: isVi ? "Cá khô miền Tây" : "Dried Fish", desc: isVi ? "Cá lóc khô, cá sặc khô, cá chỉ vàng... Chế biến truyền thống, hương vị đậm đà" : "Snakehead, climbing perch, golden threadfin... Traditional preparation, rich flavor" },
                                    { icon: "🦐", title: isVi ? "Tôm khô & Mực khô" : "Dried Shrimp & Squid", desc: isVi ? "Tôm khô Cà Mau, mực khô Phan Thiết — 100% tự nhiên, không chất bảo quản" : "Ca Mau dried shrimp, Phan Thiet dried squid — 100% natural, no preservatives" },
                                    { icon: "🥭", title: isVi ? "Trái cây sấy" : "Dried Fruits", desc: isVi ? "Xoài sấy, mít sấy, chuối sấy... Snack lành mạnh cho cả gia đình" : "Dried mango, jackfruit, banana... Healthy snacks for the family" },
                                    { icon: "🍵", title: isVi ? "Gia vị & Trà" : "Spices & Tea", desc: isVi ? "Nước mắm Phú Quốc, sa tế, trà truyền thống và nhiều gia vị đặc trưng" : "Phu Quoc fish sauce, chili paste, traditional tea and authentic spices" },
                                ].map((item, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-primary/30 hover:shadow-md transition-all">
                                        <div className="text-4xl mb-4">{item.icon}</div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                                        <p className="text-slate-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 3: Tại sao chọn LIKEFOOD */}
                        <section className="mb-12">
                            <div className="bg-gradient-to-br from-primary/5 to-amber-50 rounded-3xl p-8 md:p-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center">
                                    {isVi ? "⭐ Tại sao chọn LIKEFOOD?" : "⭐ Why Choose LIKEFOOD?"}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { num: "01", title: isVi ? "Chính gốc 100%" : "100% Authentic", desc: isVi ? "Sản phẩm tuyển chọn trực tiếp từ các vùng đặc sản nổi tiếng Việt Nam" : "Products sourced directly from Vietnam's famous specialty regions" },
                                        { num: "02", title: isVi ? "Giao toàn Mỹ" : "US Nationwide", desc: isVi ? "Giao hàng nhanh 2-3 ngày đến tất cả 50 bang. Miễn ship đơn từ $500" : "Fast 2-3 day delivery to all 50 states. Free shipping from $500" },
                                        { num: "03", title: isVi ? "An toàn thực phẩm" : "Food Safety", desc: isVi ? "Quy trình kiểm định chất lượng nghiêm ngặt, đạt chuẩn thị trường Mỹ" : "Rigorous quality control meeting U.S. market standards" },
                                    ].map((item, i) => (
                                        <div key={i} className="text-center">
                                            <div className="inline-flex w-12 h-12 rounded-xl bg-primary/10 text-primary font-black text-lg items-center justify-center mb-4">{item.num}</div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                                            <p className="text-slate-500 text-sm">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section FAQ */}
                        <section className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center">
                                {isVi ? "❓ Câu hỏi thường gặp về LIKEFOOD" : "❓ Frequently Asked Questions about LIKEFOOD"}
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { q: isVi ? "LIKEFOOD là gì?" : "What is LIKEFOOD?", a: isVi ? "LIKEFOOD là nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chính gốc tại Hoa Kỳ — cá khô, tôm khô, mực khô, trái cây sấy, gia vị truyền thống." : "LIKEFOOD is an e-commerce platform for authentic Vietnamese specialty food in the United States." },
                                    { q: isVi ? "LIKEFOOD giao hàng ở đâu?" : "Where does LIKEFOOD deliver?", a: isVi ? "LIKEFOOD giao hàng toàn nước Mỹ đến tất cả 50 bang, thời gian 2-3 ngày làm việc. Miễn phí ship cho đơn hàng từ $500." : "LIKEFOOD delivers to all 50 US states within 2-3 business days. Free shipping from $500." },
                                    { q: isVi ? "LIKEFOOD có uy tín không?" : "Is LIKEFOOD trustworthy?", a: isVi ? "Có. LIKEFOOD cam kết sản phẩm chính gốc, kiểm định chất lượng nghiêm ngặt, hỗ trợ 24/7 và chính sách đổi trả linh hoạt." : "Yes. LIKEFOOD guarantees authentic products, rigorous quality control, 24/7 support, and flexible return policies." },
                                ].map((item, i) => (
                                    <details key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden group" open={i === 0}>
                                        <summary className="px-6 py-4 cursor-pointer font-semibold text-slate-700 hover:text-primary transition-colors list-none flex items-center justify-between">
                                            {item.q}
                                            <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="px-6 pb-4 text-slate-500">{item.a}</div>
                                    </details>
                                ))}
                            </div>
                        </section>

                        {/* CTA */}
                        <section className="text-center">
                            <div className="bg-gradient-to-r from-primary to-amber-500 rounded-3xl p-8 md:p-12 text-white">
                                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                                    {isVi ? "Khám phá LIKEFOOD ngay hôm nay!" : "Discover LIKEFOOD today!"}
                                </h2>
                                <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                                    {isVi
                                        ? "Hơn 100 sản phẩm đặc sản Việt Nam chính gốc, giao hàng nhanh toàn nước Mỹ. Đặt hàng ngay để thưởng thức hương vị quê nhà!"
                                        : "Over 100 authentic Vietnamese specialty products with fast nationwide U.S. delivery. Order now to enjoy homeland flavors!"}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:bg-white/90 transition-colors"
                                    >
                                        {isVi ? "Xem sản phẩm" : "View Products"} →
                                    </Link>
                                    <Link
                                        href="/about"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
                                    >
                                        {isVi ? "Về chúng tôi" : "About Us"}
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* Internal Links for SEO */}
                        <nav className="mt-12 text-center" aria-label="Related pages">
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">
                                {isVi ? "Tìm hiểu thêm" : "Learn More"}
                            </h3>
                            <div className="flex flex-wrap justify-center gap-3">
                                {[
                                    { href: "/products", label: isVi ? "Tất cả sản phẩm" : "All Products" },
                                    { href: "/about", label: isVi ? "Về LIKEFOOD" : "About LIKEFOOD" },
                                    { href: "/posts", label: isVi ? "Blog & Tin tức" : "Blog & News" },
                                    { href: "/faq", label: "FAQ" },
                                    { href: "/contact", label: isVi ? "Liên hệ" : "Contact" },
                                    { href: "/flash-sale", label: "Flash Sale" },
                                ].map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="px-4 py-2 bg-slate-50 hover:bg-primary/5 text-slate-600 hover:text-primary rounded-lg text-sm font-medium transition-colors border border-slate-100"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>
                    </div>
                </div>
            </article>
        </>
    );
}
