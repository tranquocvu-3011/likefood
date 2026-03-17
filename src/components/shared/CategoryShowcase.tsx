/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
* LIKEFOOD - Vietnamese Specialty Marketplace
* Copyright (c) 2026 LIKEFOOD Team
* Licensed under the MIT License
* https://github.com/tranquocvu-3011/likefood
*/

"use client";

import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

export default function CategoryShowcase() {
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const { t, language } = useLanguage();

    const handleImageError = (src: string) => {
        setFailedImages(prev => new Set(prev).add(src));
    };

    // Color themes cycle for categories
    const COLOR_THEMES = [
        { color: "bg-blue-50 text-blue-600 border-blue-100", iconBg: "bg-blue-100" },
        { color: "bg-rose-50 text-rose-600 border-rose-100", iconBg: "bg-rose-100" },
        { color: "bg-emerald-50 text-emerald-600 border-emerald-100", iconBg: "bg-emerald-100" },
        { color: "bg-amber-50 text-amber-600 border-amber-100", iconBg: "bg-amber-100" },
        { color: "bg-orange-50 text-orange-600 border-orange-100", iconBg: "bg-orange-100" },
        { color: "bg-violet-50 text-violet-600 border-violet-100", iconBg: "bg-violet-100" },
        { color: "bg-cyan-50 text-cyan-600 border-cyan-100", iconBg: "bg-cyan-100" },
        { color: "bg-pink-50 text-pink-600 border-pink-100", iconBg: "bg-pink-100" },
    ];

    // Static image fallback map (slug → local image path)
    const SLUG_TO_IMAGE: Record<string, string> = {
        "ca-kho": "/cakho.png",
        "tom-muc-kho": "/muckho.png",
        "trai-cay-say": "/traicaysay.png",
        "tra-banh-mut": "/mut_traicay.png",
        "banh-mut": "/mut_traicay.png",
        "gia-vi-viet": "/giavi.png",
        "gia-vi": "/giavi.png",
    };

    // Fallback static categories (used when API unavailable)
    const FALLBACK_CATEGORIES = [
        { name: t('navbar.driedFish'), slug: "ca-kho", image: "/cakho.png", productCount: 0 },
        { name: t('navbar.shrimpSquid'), slug: "tom-muc-kho", image: "/muckho.png", productCount: 0 },
        { name: t('navbar.driedFruits'), slug: "trai-cay-say", image: "/traicaysay.png", productCount: 0 },
        { name: t('navbar.teaSweets'), slug: "banh-mut", image: "/mut_traicay.png", productCount: 0 },
        { name: t('navbar.vietnameseSpices'), slug: "gia-vi-viet", image: "/giavi.png", productCount: 0 },
    ];

    type ApiCategory = { id: string; name: string; slug: string; imageUrl: string | null; productCount: number };
    const [dbCategories, setDbCategories] = useState<ApiCategory[]>([]);

    // Fetch categories with product counts from API (single request, no matching heuristic)
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.ok ? res.json() : [])
            .then((data: unknown) => {
                if (Array.isArray(data) && data.length > 0) {
                    setDbCategories(data as ApiCategory[]);
                }
            })
            .catch(error => {
                logger.warn('Failed to load category showcase', { context: 'category-showcase', error: error as Error });
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Build display categories: from DB when available, else fallback. Exclude "Khác".
    const rawCategories = dbCategories.length > 0 ? dbCategories : FALLBACK_CATEGORIES;
    const filteredRaw = rawCategories.filter((c) => c.name !== "Khác" && c.slug !== "khac");
    const categories = filteredRaw.map((c, i) => ({
        name: c.name,
        slug: c.slug,
        dbName: c.name,
        image: (c as ApiCategory).imageUrl || SLUG_TO_IMAGE[c.slug] || "/placeholder-category.png",
        productCount: c.productCount,
        ...COLOR_THEMES[i % COLOR_THEMES.length],
    }));

    return (
        <section className="bg-slate-50 py-5 md:py-7 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white to-transparent pointer-events-none" />
            <div className="absolute top-10 w-[400px] h-[400px] bg-emerald-100/40 rounded-full blur-[80px] -left-[200px] pointer-events-none" />
            <div className="absolute bottom-10 w-[300px] h-[300px] bg-amber-100/40 rounded-full blur-[80px] -right-[150px] pointer-events-none" />

            <div className="w-full mx-auto px-4 md:px-8 max-w-[82rem] relative z-10">
                {/* Section Header */}
                <div className="flex flex-col items-center text-center mb-6 gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {t('home.explore')}
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                        {t("home.categories")} <span className="text-emerald-600">{t('home.food')}</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl">
                        {t('home.exploreDesc')}
                    </p>
                </div>

                {/* Category Grid - Modern Fresh Design with tighter gaps */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 md:gap-3">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.slug}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="group h-full"
                        >
                            <Link
                                href={`/products?category=${encodeURIComponent(category.dbName)}`}
                                className="block h-full bg-white rounded-2xl p-3 md:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 hover:border-emerald-100 transition-all duration-300 group-hover:-translate-y-1 flex flex-col"
                            >
                                {/* Top Content: Icon & Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${category.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                                        <ShoppingBag className={`w-4 h-4 md:w-5 md:h-5 ${category.color.split(' ')[1]}`} />
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold ${category.color} flex items-center gap-1`}>
                                        <span>{category.productCount}</span>
                                        <span className="opacity-70 text-[9px] uppercase font-semibold">{t('home.items')}</span>
                                    </div>
                                </div>

                                {/* Central Image */}
                                <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden flex items-center justify-center">
                                    <div className="relative w-full h-full transform transition-transform duration-500 group-hover:scale-110">
                                        {failedImages.has(category.image) ? (
                                            <div className={`w-full h-full ${category.iconBg} flex items-center justify-center`}>
                                                <ShoppingBag className={`w-12 h-12 ${category.color.split(' ')[1]} opacity-40`} />
                                            </div>
                                        ) : (
                                            <Image
                                                src={`${category.image}?v=2`}
                                                alt={category.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                                                onError={() => handleImageError(category.image)}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Info */}
                                <div className="mt-auto flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 text-sm md:text-base">
                                        {category.name}
                                    </h3>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors border border-slate-100 group-hover:border-emerald-100">
                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors -translate-x-0.5 group-hover:translate-x-0" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
