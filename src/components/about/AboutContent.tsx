"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, Package, Award, Leaf, Shield, Truck, Heart, ChevronRight, Quote, Star } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function AboutContent() {
    const { language } = useLanguage();
    const vi = language === "vi";

    const stats = [
        { icon: MapPin, value: "50+", label: vi ? "Làng nghề hợp tác" : "Partner villages", color: "from-blue-500 to-cyan-500" },
        { icon: Users, value: "10,000+", label: vi ? "Khách hàng tin tưởng" : "Trusted customers", color: "from-green-500 to-emerald-500" },
        { icon: Package, value: "100+", label: vi ? "Sản phẩm đặc sản" : "Specialty products", color: "from-orange-500 to-amber-500" },
        { icon: Award, value: "100%", label: vi ? "Đạt chuẩn FDA" : "FDA compliant", color: "from-purple-500 to-pink-500" },
    ];

    const values = [
        {
            icon: Leaf,
            title: vi ? "Nguyên liệu tự nhiên" : "Natural ingredients",
            description: vi ? "Tất cả sản phẩm được làm từ nguyên liệu tự nhiên, không chất bảo quản độc hại." : "All products are made from natural ingredients, free of harmful preservatives.",
        },
        {
            icon: Shield,
            title: vi ? "An toàn thực phẩm" : "Food safety",
            description: vi ? "Kiểm định chất lượng nghiêm ngặt theo tiêu chuẩn FDA Hoa Kỳ." : "Strict quality inspection following US FDA standards.",
        },
        {
            icon: Truck,
            title: vi ? "Giao hàng toàn Mỹ" : "US-wide shipping",
            description: vi ? "Ship nhanh đến tất cả 50 bang, đóng gói cẩn thận, giữ nguyên hương vị." : "Fast shipping to all 50 states, carefully packed to preserve flavor.",
        },
        {
            icon: Heart,
            title: vi ? "Tận tâm phục vụ" : "Dedicated service",
            description: vi ? "Đội ngũ hỗ trợ 24/7, sẵn sàng giải đáp mọi thắc mắc của bạn." : "24/7 support team, ready to answer all your questions.",
        },
    ];

    const testimonials = [
        {
            name: vi ? "Chị Lê Huỳnh Nhiên" : "Le Huynh Nhien",
            location: "California, USA",
            content: vi
                ? "Nhờ LIKEFOOD mà gia đình tôi ở Mỹ vẫn được thưởng thức những món ăn quê hương. Cá khô rất ngon, đúng vị Châu Đốc!"
                : "Thanks to LIKEFOOD, my family in the US can still enjoy hometown flavors. The dried fish is delicious, authentic Chau Doc taste!",
            rating: 5,
        },
        {
            name: vi ? "Anh Trần Quốc Vũ" : "Tran Quoc Vu",
            location: "Texas, USA",
            content: vi
                ? "Mua hàng ở đây rất yên tâm, giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ lâu dài!"
                : "Shopping here is very reassuring, fast delivery, careful packaging. Will support long-term!",
            rating: 5,
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50/50">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-300/20 rounded-full blur-[150px]" />
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-300/20 rounded-full blur-[120px]" />
                </div>

                <div className="relative page-container-wide py-20 lg:py-32">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                            <Heart className="w-4 h-4 text-primary" fill="currentColor" />
                            <span className="text-xs font-bold uppercase tracking-widest text-primary">
                                {vi ? "Câu chuyện của chúng tôi" : "Our story"}
                            </span>
                        </div>

                        <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-6">
                            {vi ? (
                                <>Mang <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-cyan-500">hương vị Việt</span> đến người Việt xa xứ</>
                            ) : (
                                <>Bringing <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-cyan-500">Vietnamese flavors</span> to Vietnamese abroad</>
                            )}
                        </h1>

                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
                            {vi
                                ? "LIKEFOOD ra đời từ nỗi nhớ hương vị quê hương da diết của những người con Việt tại Mỹ. Chúng tôi tin rằng, mỗi món ăn không chỉ là thực phẩm, mà là một mảnh ký ức, một sợi dây kết nối bền chặt với cội nguồn."
                                : "LIKEFOOD was born from the deep longing for hometown flavors of Vietnamese in the US. We believe that every dish is not just food, but a piece of memory, a strong connection to our roots."}
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative -mt-16 z-10">
                <div className="page-container-wide">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-100 text-center hover:shadow-2xl transition-all"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                    <stat.icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="text-3xl lg:text-4xl font-black text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 lg:py-32">
                <div className="page-container-wide">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div className="relative">
                            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl bg-slate-100">
                                <Image
                                    src="/images/dacsan.png"
                                    alt={vi ? "Đặc sản khô Việt Nam" : "Vietnamese dried specialties"}
                                    fill
                                    className="object-cover"
                                    sizes="(min-width: 1024px) 50vw, 100vw"
                                    priority
                                />
                            </div>
                            <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl p-6 shadow-2xl max-w-xs hidden lg:block">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <Package className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-primary">500+</div>
                                        <div className="text-sm font-medium text-slate-500">{vi ? "Sản phẩm đặc sản" : "Specialty products"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-xs font-black uppercase tracking-widest text-primary mb-6">
                                {vi ? "Sứ mệnh" : "Mission"}
                            </span>
                            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-6">
                                {vi ? "Mang đặc sản Việt vươn tầm thế giới" : "Bringing Vietnamese specialties worldwide"}
                            </h2>
                            <p className="text-lg text-slate-500 leading-relaxed mb-8">
                                {vi
                                    ? "LIKEFOOD không chỉ bán hàng, chúng tôi kể câu chuyện về những làng nghề truyền thống Việt Nam. Từ đôi bàn tay khéo léo của các nghệ nhân, những sản phẩm tốt nhất được tuyển chọn khắt khe để vượt qua các tiêu chuẩn FDA Hoa Kỳ, mang đến sự an tâm tuyệt đối cho khách hàng."
                                    : "LIKEFOOD doesn't just sell products, we tell stories about traditional Vietnamese craft villages. From the skilled hands of artisans, the best products are stringently selected to meet US FDA standards, bringing absolute peace of mind to customers."}
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <ChevronRight className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900">{vi ? "Kết nối hơn 50 làng nghề truyền thống" : "Connected to 50+ traditional craft villages"}</span>
                                        <p className="text-sm text-slate-500 mt-1">{vi ? "Từ Châu Đốc, Cà Mau, Phan Thiết đến các vùng miền khác." : "From Chau Doc, Ca Mau, Phan Thiet and other regions."}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <ChevronRight className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900">{vi ? "Kiểm định chất lượng 100% tại Mỹ" : "100% quality tested in the US"}</span>
                                        <p className="text-sm text-slate-500 mt-1">{vi ? "Đạt tiêu chuẩn FDA, đảm bảo an toàn thực phẩm." : "FDA compliant, ensuring food safety."}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <ChevronRight className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900">{vi ? "Hỗ trợ cộng đồng người Việt toàn cầu" : "Supporting the global Vietnamese community"}</span>
                                        <p className="text-sm text-slate-500 mt-1">{vi ? "Kết nối và phục vụ hơn 10,000 gia đình Việt tại Mỹ." : "Connecting and serving 10,000+ Vietnamese families in the US."}</p>
                                    </div>
                                </li>
                            </ul>

                            <Link
                                href="/products"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-full font-black uppercase tracking-wider text-sm shadow-xl shadow-primary/30 hover:shadow-2xl transition-all"
                            >
                                {vi ? "Khám phá sản phẩm" : "Explore products"}
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
                <div className="page-container-wide">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-xs font-black uppercase tracking-widest text-primary mb-6">
                            {vi ? "Giá trị cốt lõi" : "Core values"}
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-4">
                            {vi ? "Tại sao chọn LIKEFOOD?" : "Why choose LIKEFOOD?"}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {vi ? "Chúng tôi cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất cho bạn" : "We are committed to delivering the best shopping experience for you"}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all group"
                            >
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all">
                                    <value.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-3">{value.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 lg:py-32">
                <div className="page-container-wide">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="inline-block px-4 py-2 bg-amber-100 rounded-full text-xs font-black uppercase tracking-widest text-amber-700 mb-6">
                            {vi ? "Khách hàng nói gì" : "Customer reviews"}
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter">
                            {vi ? "Yêu thương từ cộng đồng" : "Love from our community"}
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 relative"
                            >
                                <Quote className="w-10 h-10 text-amber-200 absolute top-6 right-6" />
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-amber-400" fill="currentColor" />
                                    ))}
                                </div>
                                <p className="text-slate-700 leading-relaxed mb-6 italic">
                                    &quot;{testimonial.content}&quot;
                                </p>
                                <div>
                                    <div className="font-bold text-slate-900">{testimonial.name}</div>
                                    <div className="text-sm text-slate-500">{testimonial.location}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-primary via-emerald-500 to-cyan-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative page-container-wide text-center">
                    <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter text-white mb-6">
                        {vi ? "Sẵn sàng thưởng thức đặc sản Việt?" : "Ready to savor Vietnamese specialties?"}
                    </h2>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
                        {vi ? "Đặt hàng ngay hôm nay và nhận ưu đãi đặc biệt dành cho khách hàng mới" : "Order today and get special offers for new customers"}
                    </p>
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white text-primary rounded-full font-black uppercase tracking-wider text-sm shadow-2xl hover:shadow-white/30 transition-all"
                    >
                        {vi ? "Mua sắm ngay" : "Shop now"}
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
