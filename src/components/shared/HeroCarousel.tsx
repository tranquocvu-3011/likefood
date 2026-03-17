"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { tracking } from "@/lib/tracking";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

interface Banner {
    id: string | number;
    imageUrl: string;
    title: string;
    subtitle?: string | null;
    ctaText?: string | null;
    ctaLink?: string | null;
}

// Module-level cache: persists across navigations within a page session
let cachedBanners: Banner[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export default function HeroCarousel() {
    const { t, isVietnamese } = useLanguage();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchBanners() {
            // Return cached data if still fresh
            if (cachedBanners && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
                setBanners(cachedBanners);
                setIsLoading(false);
                return;
            }
            try {
                const res = await fetch("/api/banners?placement=home");
                if (res.ok) {
                    const data = await res.json();
                    cachedBanners = data;
                    cacheTimestamp = Date.now();
                    setBanners(data);
                }
            } catch (error) {
                logger.warn("Failed to fetch banners", { context: 'hero-carousel', error: error as Error });
            } finally {
                setIsLoading(false);
            }
        }
        fetchBanners();
    }, []);

    // Auto-play carousel
    useEffect(() => {
        if (banners.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [banners.length]);

    // Track view_home event on mount
    useEffect(() => {
        tracking.viewHome();
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    };

    // Fallback static banner if no banners from DB
    const defaultBanner: Banner = {
        id: "default",
        // Sử dụng banner chuẩn trong thư mục public
        imageUrl: "/banner.png",
        title: isVietnamese ? "Hương vị quê nhà ngay tầm tay bạn" : "Homeland flavors right at your fingertips",
        subtitle: isVietnamese 
            ? "LIKEFOOD mang đến hơn 100 loại đặc sản tinh túy nhất từ mọi miền Việt Nam đến tận nhà bạn tại Hoa Kỳ. Chất lượng tuyển chọn, giao hàng nhanh chóng."
            : "LIKEFOOD brings you over 100 finest Vietnamese specialties from every region to your home in the USA. Premium quality, fast delivery.",
        ctaText: t('home.shopNow'),
        ctaLink: "/products"
    };

    const displayBanners = banners.length > 0 ? banners : [defaultBanner];
    const activeBanner = displayBanners[currentSlide];

    if (isLoading) {
        return (
            <section className="relative overflow-hidden pt-32 pb-20 bg-slate-50">
                <div className="w-full mx-auto px-6 sm:px-10 lg:px-[8%]">
                    <div className="h-96 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden lg:min-h-[55vh] flex items-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" style={{ padding: 'clamp(0.75rem, 1.5vw, 1.5rem) clamp(0.75rem, 2vw, 2rem)' }}>
            <div className="w-full mx-auto relative z-10" style={{ maxWidth: '100%' }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(1.5rem,3vw,2.5rem)] items-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-8 text-center lg:text-left"
                        >
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-600 font-black uppercase tracking-wider px-4 py-2 text-xs md:text-sm">
                                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" /> {t('shop.vietnamSpecialtiesUSA')}
                                </div>
                                <h1 className="font-black text-slate-900 leading-[1.1] tracking-tight text-2xl sm:text-4xl md:text-6xl lg:text-7xl">
                                    {activeBanner.title}
                                </h1>
                                {activeBanner.subtitle && (
                                    <p className="text-slate-600 font-medium leading-relaxed text-base sm:text-lg md:text-2xl">
                                        {activeBanner.subtitle}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                                <Link href={activeBanner.ctaLink || "/products"}>
                                    <Button className="h-14 px-10 rounded-2xl bg-gradient-to-r from-primary to-amber-500 text-white font-black text-lg shadow-lg shadow-primary/30 transition-all flex gap-2 w-full sm:w-auto">
                                        {activeBanner.ctaText || t('home.shopNow')} <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link href="/about">
                                    <Button variant="outline" className="h-14 px-10 rounded-2xl border-2 border-primary/30 text-slate-700 font-black text-lg transition-all w-full sm:w-auto">
                                        {t('shop.learnMore')}
                                    </Button>
                                </Link>
                            </div>

                            {/* Carousel indicators */}
                            {displayBanners.length > 1 && (
                                <div className="flex items-center gap-4 pt-4 justify-center lg:justify-start">
                                    <button
                                        onClick={prevSlide}
                                        className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex gap-2">
                                        {displayBanners.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentSlide(idx)}
                                                className={`h-2 rounded-full transition-all ${idx === currentSlide ? "w-8 bg-primary" : "w-2 bg-slate-200"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={nextSlide}
                                        className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`image-${currentSlide}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="mt-8 lg:mt-0 relative"
                        >
                            {activeBanner.imageUrl ? (
                                <div className="relative aspect-[39/15] rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-2xl">
                                    <Image
                                        src={activeBanner.imageUrl}
                                        alt={activeBanner.title}
                                        fill
                                        className="object-cover"
                                        sizes="(min-width: 1024px) 60vw, 100vw"
                                        priority
                                    />
                                </div>
                            ) : (
                                <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 p-8 flex items-center justify-center">
                                    <div className="text-[12rem] filter drop-shadow-2xl">🍜</div>
                                </div>
                            )}

                            {/* Subtle background glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px] -z-10" />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
