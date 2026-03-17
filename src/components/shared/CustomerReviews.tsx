"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

type Testimonial = {
    id: string | number;
    name: string;
    quote: string;
    rating: number;
    avatar: string;
    location: string;
};

const STATIC_REVIEWS: Record<"vi" | "en", Testimonial[]> = {
    vi: [
        {
            id: "rev-1",
            name: "Trần Quốc Vũ",
            quote: "Gói cá khô gửi sang Texas vẫn còn rất thơm và mới. Đóng gói cực kỳ cẩn thận, hút chân không kỹ càng nên không hề có mùi. Gia đình mình rất hài lòng!",
            rating: 5,
            avatar: "👩‍💼",
            location: "Houston, Texas"
        },
        {
            id: "rev-2",
            name: "Lê Huỳnh Nhiên",
            quote: "Lần đầu mua mực khô của shop mà bất ngờ quá. Mực dày cơm, nướng lên thơm phức cả nhà. Sẽ ủng hộ shop dài dài trong những đợt tới.",
            rating: 5,
            avatar: "👨‍🍳",
            location: "Orange County, California"
        },
        {
            id: "rev-3",
            name: "Võ Trương Thành Dân",
            quote: "Trái cây sấy dẻo không quá ngọt, giữ được vị tự nhiên của trái cây Việt. Ship hàng nhanh, nhân viên tư vấn rất nhiệt tình và chu đáo.",
            rating: 5,
            avatar: "👵",
            location: "Seattle, Washington"
        },
        {
            id: "rev-4",
            name: "Huỳnh Nhật Phát",
            quote: "Mình mua mứt Tết về biếu gia đình chồng người Mỹ, họ khen nức nở. Hộp quà sang trọng, mang đậm nét văn hóa truyền thống Việt Nam.",
            rating: 5,
            avatar: "👩‍🎓",
            location: "Chicago, Illinois"
        },
        {
            id: "rev-5",
            name: "Hoàng Công Huy",
            quote: "Gia vị chuẩn vị quê nhà, nấu bát phở mà cảm giác như đang ở giữa lòng Hà Nội. Cảm ơn shop đã mang hương vị quê hương sang tận Mỹ.",
            rating: 5,
            avatar: "👨‍💻",
            location: "Atlanta, Georgia"
        }
    ],
    en: [
        {
            id: "rev-1",
            name: "Tran Quoc Vu",
            quote: "The dried fish package arrived in Texas fresh and aromatic. The vacuum sealing and careful packaging were excellent. My family is very happy with the quality.",
            rating: 5,
            avatar: "👩‍💼",
            location: "Houston, Texas"
        },
        {
            id: "rev-2",
            name: "Le Huynh Nhien",
            quote: "My first time ordering dried squid here and I was impressed. Thick texture, great flavor when grilled, and very reliable quality. I will definitely order again.",
            rating: 5,
            avatar: "👨‍🍳",
            location: "Orange County, California"
        },
        {
            id: "rev-3",
            name: "Vo Truong Thanh Dan",
            quote: "The dried fruit is not overly sweet and still tastes natural. Shipping was fast, and customer support was friendly and attentive.",
            rating: 5,
            avatar: "👵",
            location: "Seattle, Washington"
        },
        {
            id: "rev-4",
            name: "Huynh Nhat Phat",
            quote: "I bought Tet sweets as gifts for my American in-laws and they loved them. The gift box looked premium and beautifully represented Vietnamese culture.",
            rating: 5,
            avatar: "👩‍🎓",
            location: "Chicago, Illinois"
        },
        {
            id: "rev-5",
            name: "Hoang Cong Huy",
            quote: "The seasoning tastes just like home. A single bowl of pho brought back memories of Hanoi. Thank you for delivering authentic Vietnamese flavors to the U.S.",
            rating: 5,
            avatar: "👨‍💻",
            location: "Atlanta, Georgia"
        }
    ]
};

export default function CustomerReviews() {
    const { language } = useLanguage();
    const locale = language === "en" ? "en" : "vi";
    const isVi = locale === "vi";
    const [dynamicReviews, setDynamicReviews] = useState<Testimonial[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [loading, setLoading] = useState(true);

    const reviews = useMemo(() => {
        const base = STATIC_REVIEWS[locale];
        const ids = new Set(base.map((r) => r.id));
        const dynamicUnique = dynamicReviews.filter((r) => !ids.has(r.id));
        return [...base, ...dynamicUnique].slice(0, 10);
    }, [dynamicReviews, locale]);

    // Fetch dynamic reviews
    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/reviews/featured');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const normalized: Testimonial[] = data
                            .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
                            .map((item, index) => {
                                const safeId = typeof item.id === "string" && item.id.length > 0 ? item.id : `review-${index}`;
                                const safeName = locale === "en"
                                    ? (typeof item.nameEn === "string" ? item.nameEn : (typeof item.name === "string" ? item.name : "Anonymous"))
                                    : (typeof item.name === "string" ? item.name : "Ẩn danh");
                                const safeQuote = locale === "en"
                                    ? (typeof item.quoteEn === "string" ? item.quoteEn : (typeof item.quote === "string" ? item.quote : ""))
                                    : (typeof item.quote === "string" ? item.quote : "");
                                const safeRating = typeof item.rating === "number" ? item.rating : Number(item.rating ?? 5);
                                const safeAvatar = typeof item.avatar === "string" ? item.avatar : "😊";
                                const safeLocation = locale === "en"
                                    ? (typeof item.locationEn === "string" ? item.locationEn : (typeof item.location === "string" ? item.location : ""))
                                    : (typeof item.location === "string" ? item.location : "");

                                return {
                                    id: safeId,
                                    name: safeName,
                                    quote: safeQuote,
                                    rating: Number.isFinite(safeRating) ? Math.max(1, Math.min(5, Math.round(safeRating))) : 5,
                                    avatar: safeAvatar,
                                    location: safeLocation,
                                } satisfies Testimonial;
                            });

                        if (normalized.length > 0) {
                            setDynamicReviews(normalized);
                        }
                    }
                }
            } catch (err) {
                logger.warn("Failed to fetch reviews", { context: 'customer-reviews', error: err as Error });
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [locale]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [locale]);

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying || reviews.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % reviews.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [isAutoPlaying, reviews.length]);

    const nextSlide = () => {
        if (reviews.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
        setIsAutoPlaying(false);
    };

    const previousSlide = () => {
        if (reviews.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
        setIsAutoPlaying(false);
    };

    if (loading) {
        return (
            <section className="bg-gradient-to-b from-white to-slate-50 py-6 md:py-10 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </section>
        );
    }

    if (reviews.length === 0) {
        return (
            <section className="bg-gradient-to-b from-white to-slate-50 py-6 md:py-10">
                <div className="w-full mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">💬 {isVi ? "Khách hàng" : "What customers"} <span className="text-primary">{isVi ? "nói gì?" : "say?"}</span></h2>
                    <p className="text-slate-600 italic">{isVi ? "Chưa có đánh giá nào. Hãy là người đầu tiên!" : "No reviews yet. Be the first one!"}</p>
                </div>
            </section>
        );
    }

    const currentTestimonial = reviews[currentIndex];

    return (
        <section className="bg-gradient-to-b from-white to-slate-50 py-6 md:py-10">
            <div className="w-full mx-auto px-6 sm:px-10 lg:px-[8%]">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                        💬 {isVi ? "Khách hàng" : "What customers"} <span className="text-primary">{isVi ? "nói gì?" : "say?"}</span>
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        {isVi ? "Hàng nghìn đánh giá 5 sao từ cộng đồng người Việt ở Mỹ" : "Thousands of 5-star reviews from Vietnamese communities in the U.S."}
                    </p>
                </div>

                {/* Testimonials Carousel */}
                <div className="page-container-wide">
                    <div className="relative min-h-[400px] flex items-center justify-center">
                        {/* Previous Review (Left - Faded with Animation) */}
                        <motion.div
                            key={`prev-${currentIndex}`}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 0.3, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-[280px] scale-90 pointer-events-none group/preview"
                        >
                            <div className="bg-white rounded-2xl p-8 shadow-lg blur-[1px] relative overflow-hidden">
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-50"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-center gap-1 mb-4">
                                        {[...Array(reviews[(currentIndex - 1 + reviews.length) % reviews.length].rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-600 text-center mb-4 line-clamp-3">
                                        &ldquo;{reviews[(currentIndex - 1 + reviews.length) % reviews.length].quote}&rdquo;
                                    </p>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-3xl">{reviews[(currentIndex - 1 + reviews.length) % reviews.length].avatar}</div>
                                        <p className="font-bold text-slate-900 text-sm">
                                            {reviews[(currentIndex - 1 + reviews.length) % reviews.length].name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Main Review (Center with Enhanced Effects) */}
                        <div className="w-full max-w-4xl mx-auto px-4 lg:px-16">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.22, 1, 0.36, 1] // Custom easing
                                    }}
                                    className="bg-white rounded-3xl p-12 md:p-16 shadow-2xl relative overflow-hidden group"
                                >
                                    {/* Animated Gradient Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-pink-50 opacity-60"></div>

                                    {/* Glow Effect - Removed */}

                                    {/* Quote Icon with Animation */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.3, duration: 0.5 }}
                                        className="absolute top-8 left-8 opacity-10"
                                    >
                                        <Quote className="w-16 h-16 text-primary" />
                                    </motion.div>

                                    <div className="relative z-10">
                                        {/* Rating Stars with Stagger Animation */}
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex justify-center gap-1 mb-6"
                                        >
                                            {[...Array(currentTestimonial.rating)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ delay: 0.3 + i * 0.1 }}
                                                >
                                                    <Star className="w-6 h-6 fill-amber-400 text-amber-400 drop-shadow-md" />
                                                </motion.div>
                                            ))}
                                        </motion.div>

                                        {/* Quote Text with Fade In */}
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4, duration: 0.6 }}
                                            className="text-xl md:text-2xl text-slate-700 text-center mb-8 leading-relaxed font-medium italic"
                                        >
                                            &ldquo;{currentTestimonial.quote}&rdquo;
                                        </motion.p>

                                        {/* Author with Slide Up */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5, duration: 0.5 }}
                                            className="flex flex-col items-center gap-3"
                                        >
                                            <div className="text-5xl">{currentTestimonial.avatar}</div>
                                            <div className="text-center">
                                                <p className="font-bold text-slate-900 text-lg">
                                                    {currentTestimonial.name}
                                                </p>
                                                <p className="text-slate-500">
                                                    📍 {currentTestimonial.location}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Next Review (Right - Faded with Animation) */}
                        <motion.div
                            key={`next-${currentIndex}`}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 0.3, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[280px] scale-90 pointer-events-none group/preview"
                        >
                            <div className="bg-white rounded-2xl p-8 shadow-lg blur-[1px] relative overflow-hidden">
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-orange-50/50 opacity-50"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-center gap-1 mb-4">
                                        {[...Array(reviews[(currentIndex + 1) % reviews.length].rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-600 text-center mb-4 line-clamp-3">
                                        &ldquo;{reviews[(currentIndex + 1) % reviews.length].quote}&rdquo;
                                    </p>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-3xl">{reviews[(currentIndex + 1) % reviews.length].avatar}</div>
                                        <p className="font-bold text-slate-900 text-sm">
                                            {reviews[(currentIndex + 1) % reviews.length].name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Enhanced Navigation Arrows */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={previousSlide}
                            className="absolute left-2 lg:left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gradient-to-br from-white to-slate-50 shadow-xl flex items-center justify-center transition-all duration-300 border-2 border-slate-100"
                            aria-label={isVi ? "Đánh giá trước" : "Previous review"}
                        >
                            <ChevronLeft className="w-6 h-6 text-slate-700" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={nextSlide}
                            className="absolute right-2 lg:right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gradient-to-br from-white to-slate-50 shadow-xl flex items-center justify-center transition-all duration-300 border-2 border-slate-100"
                            aria-label={isVi ? "Đánh giá tiếp theo" : "Next review"}
                        >
                            <ChevronRight className="w-6 h-6 text-slate-700" />
                        </motion.button>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-8">
                        {reviews.map((_, index: number) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setIsAutoPlaying(false);
                                }}
                                className={`h-2 rounded-full transition-all ${index === currentIndex
                                    ? 'w-8 bg-primary'
                                    : 'w-2 bg-slate-300'
                                    }`}
                                aria-label={isVi ? `Xem đánh giá ${index + 1}` : `Go to review ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
