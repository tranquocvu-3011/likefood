"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, Grid2X2, List, ChevronDown, Flame, ShoppingCart, Heart, AlertTriangle, Sparkles, Gift, Star, ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";
import PriceDisplay from "@/components/ui/price-display";

interface FlashProduct {
    id: number;
    slug: string;
    name: string;
    originalPrice: number;
    salePrice: number;
    discount: number;
    image: string | null;
    category: string;
    inventory: number;
    soldCount: number;
    badgeText: string | null;
    saleEndAt: string | null;
    isHot: boolean;
}

export default function FlashSalePage() {
    const { t, language, isVietnamese } = useLanguage();
    const { addItem } = useCart();

    const flashT = (key: string, viText: string, enText: string) => {
        const value = t(`flashSale.${key}`);
        return value === `flashSale.${key}` || value.includes(".") ? (isVietnamese ? viText : enText) : value;
    };

    const shopT = (key: string, viText: string, enText: string) => {
        const value = t(`shop.${key}`);
        return value === `shop.${key}` || value.includes(".") ? (isVietnamese ? viText : enText) : value;
    };

    const sortOptions = [
        { value: "popular", label: shopT("sortPopular", "Phổ biến nhất", "Most popular") },
        { value: "discount", label: shopT("sortDiscount", "Giảm giá mạnh", "Biggest discount") },
        { value: "price-asc", label: shopT("sortPriceAscShort", "Giá tăng dần", "Price low to high") },
        { value: "price-desc", label: shopT("sortPriceDescShort", "Giá giảm dần", "Price high to low") },
    ];
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState("popular");
    const [products, setProducts] = useState<FlashProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    // Fetch flash sale products from API
    useEffect(() => {
        const fetchFlashProducts = async () => {
            try {
                const res = await fetch('/api/products/flash-sale');
                if (!res.ok) throw new Error('Failed to fetch flash sale products');
                const data = await res.json();

                if (data.products) {
                    setProducts(data.products);
                    setCountdown(data.countdown);
                }
            } catch (error) {
                logger.error('Failed to fetch flash sale products', error as Error, { context: 'flash-sale-page' });
                toast.error(language === "vi" ? 'Không thể tải sản phẩm Flash Sale' : 'Failed to load Flash Sale products');
            } finally {
                setLoading(false);
            }
        };

        fetchFlashProducts();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Countdown timer
    useEffect(() => {
        let timer: NodeJS.Timeout;

        const calculateTimeLeft = (endTime: number) => {
            const now = Date.now();
            const diff = endTime - now;
            if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
            return {
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            };
        };

        if (countdown) {
            const endTime = new Date(countdown).getTime();
            setTimeLeft(calculateTimeLeft(endTime));
            timer = setInterval(() => setTimeLeft(calculateTimeLeft(endTime)), 1000);
        } else {
            const DURATION = 24 * 60 * 60 * 1000;
            const storedEndTime = typeof window !== 'undefined' ? localStorage.getItem("flash_sale_end_time") : null;
            let endTime: number;

            if (!storedEndTime) {
                endTime = Date.now() + DURATION;
                if (typeof window !== 'undefined') localStorage.setItem("flash_sale_end_time", endTime.toString());
            } else {
                endTime = parseInt(storedEndTime, 10);
                if (endTime <= Date.now()) {
                    endTime = Date.now() + DURATION;
                    if (typeof window !== 'undefined') localStorage.setItem("flash_sale_end_time", endTime.toString());
                }
            }

            setTimeLeft(calculateTimeLeft(endTime));
            timer = setInterval(() => {
                const currentEndTime = parseInt(localStorage.getItem("flash_sale_end_time") || "0", 10);
                setTimeLeft(calculateTimeLeft(currentEndTime));
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [countdown]);

    const handleAddToCart = (product: FlashProduct) => {
        if (product.inventory <= 0) {
            toast.error(flashT("productOutOfStock", "Sản phẩm đã hết hàng", "Product is out of stock"));
            return;
        }
        const hasDiscount = product.originalPrice > product.salePrice;
        addItem({
            productId: product.id,
            slug: product.slug || undefined,
            name: product.name,
            price: product.salePrice,
            originalPrice: hasDiscount ? product.originalPrice : undefined,
            salePrice: hasDiscount ? product.salePrice : undefined,
            isOnSale: hasDiscount,
            image: product.image || undefined,
            inventory: product.inventory,
            category: product.category || undefined,
        });
    };

    const sortedProducts = [...products].sort((a, b) => {
        switch (sortBy) {
            case "discount": return b.discount - a.discount;
            case "price-asc": return a.salePrice - b.salePrice;
            case "price-desc": return b.salePrice - a.salePrice;
            default: return b.soldCount - a.soldCount;
        }
    });

    return (
        <div className="min-h-screen bg-white">

            {/* ═══════════════════════════════════════════════════════
                HERO SECTION — Soft Pastel Pink
            ═══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-gradient-to-b from-rose-50 via-pink-50/70 to-white">
                {/* Soft pastel background */}
                <div className="absolute inset-0 bg-gradient-to-b from-rose-50 via-pink-50/70 to-white" />

                {/* Subtle decorative shapes — very soft, no sparkle */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-rose-100/60 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-100/50 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

                {/* Content */}
                <div className="relative page-container-wide pt-2 lg:pt-3 pb-4 lg:pb-5">
                    <div className="mb-3 flex items-center gap-2 text-sm">
                        <Link href="/" className="text-slate-400 hover:text-rose-400 transition-colors">
                            {flashT("goHome", "Trang chủ", "Home")}
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            Flash Sale
                        </span>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center max-w-2xl mx-auto"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100/80 rounded-full mb-3 border border-rose-200/60"
                        >
                            <Zap className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                                {flashT("exclusiveMemberOffers", "Ưu đãi độc quyền", "Exclusive offers")}
                            </span>
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-wide mb-3 leading-tight">
                            <span className="text-slate-800">FLASH </span>
                            <span className="text-rose-400">SALE</span>
                        </h1>

                        <p className="text-base md:text-lg text-slate-500 font-medium mb-5 max-w-md mx-auto">
                            {shopT("flashSaleSubtitle", "Ưu đãi chớp nhoáng, số lượng có hạn!", "Flash deals, limited quantity!")}
                        </p>

                        {/* ── Countdown Timer ── */}
                        <div className="inline-flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-3xl px-8 py-6 border border-rose-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-rose-300" />
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {flashT("endsIn", "Kết thúc sau", "Ends in")}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {[
                                    { value: timeLeft.hours, label: flashT("hrs", "Giờ", "Hrs") },
                                    { value: timeLeft.minutes, label: flashT("min", "Phút", "Min") },
                                    { value: timeLeft.seconds, label: flashT("sec", "Giây", "Sec") },
                                ].map((unit, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-b from-rose-50 to-pink-50 rounded-2xl flex items-center justify-center border border-rose-100">
                                                <AnimatePresence mode="popLayout">
                                                    <motion.span
                                                        key={unit.value}
                                                        initial={{ y: -10, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ y: 10, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="text-2xl md:text-3xl font-black text-slate-700 tabular-nums"
                                                    >
                                                        {String(unit.value).padStart(2, "0")}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </div>
                                            <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-widest mt-2">{unit.label}</span>
                                        </div>
                                        {i < 2 && (
                                            <div className="flex flex-col gap-1.5 -mt-5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-200" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-200" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FEATURE BADGES
            ═══════════════════════════════════════════════════════ */}
            <section className="page-container-wide py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { icon: Zap, text: isVietnamese ? "Giảm đến 50%" : "Up to 50% off", bg: "bg-rose-50", iconColor: "text-rose-400" },
                        { icon: Package, text: isVietnamese ? "Freeship từ $100" : "Free ship $100+", bg: "bg-pink-50", iconColor: "text-pink-400" },
                        { icon: Gift, text: isVietnamese ? "Quà tặng kèm" : "Free gifts", bg: "bg-rose-50", iconColor: "text-rose-400" },
                        { icon: Star, text: isVietnamese ? "Hàng chính hãng" : "100% authentic", bg: "bg-pink-50", iconColor: "text-pink-400" },
                    ].map((badge, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 hover:border-rose-100 transition-colors"
                        >
                            <div className={`w-9 h-9 rounded-lg ${badge.bg} flex items-center justify-center flex-shrink-0`}>
                                <badge.icon className={`w-4 h-4 ${badge.iconColor}`} />
                            </div>
                            <span className="text-sm font-semibold text-slate-600">{badge.text}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                PRODUCTS SECTION
            ═══════════════════════════════════════════════════════ */}
            <section className="page-container-wide pb-16">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-3.5 border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                            <Flame className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="text-sm">
                            <span className="font-bold text-slate-700">
                                {products.length} {shopT("productsCount", "sản phẩm", "products")}
                            </span>
                            <span className="text-rose-400 font-medium ml-1">
                                {flashT("productsOnSale", "đang giảm giá", "on sale")}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Sort */}
                        <div className="relative hidden sm:block">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600 outline-none cursor-pointer hover:border-rose-200 transition-colors"
                            >
                                {sortOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* View Mode */}
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-rose-400 shadow-sm border border-rose-100" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                <Grid2X2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-rose-400 shadow-sm border border-rose-100" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-10 h-10 border-3 border-rose-100 border-t-rose-300 rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 font-medium text-sm">
                            {flashT("loadingProducts", "Đang tải sản phẩm Flash Sale...", "Loading flash sale products...")}
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && products.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl bg-gradient-to-b from-rose-50/50 to-white border border-rose-100/50 p-12 md:p-16 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-50 rounded-2xl mb-6 border border-rose-100">
                            <Zap className="w-10 h-10 text-rose-300" />
                        </div>

                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 mb-2">
                            {flashT("noProductsYet", "Chương trình sắp bắt đầu!", "Coming soon!")}
                        </h3>
                        <p className="text-slate-400 text-base mb-8 max-w-sm mx-auto">
                            {flashT("comeBackLater", "Các ưu đãi Flash Sale sẽ sớm xuất hiện. Đừng bỏ lỡ nhé!", "Flash Sale deals are coming soon. Stay tuned!")}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold text-sm transition-colors"
                            >
                                <Sparkles className="w-4 h-4" />
                                {flashT("viewAllProducts", "Xem tất cả sản phẩm", "View all products")}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/products?sale=true"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-rose-50 text-rose-400 border border-rose-200 rounded-xl font-semibold text-sm transition-colors"
                            >
                                <Gift className="w-4 h-4" />
                                {flashT("viewAllPromos", "Xem ưu đãi khác", "View other deals")}
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* Products Grid */}
                {!loading && products.length > 0 && (
                    <div className={viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                        : "space-y-4"
                    }>
                        {sortedProducts.map((product, index) => {
                            const totalStock = product.inventory + product.soldCount;
                            const soldPercent = totalStock > 0 ? (product.soldCount / totalStock) * 100 : 0;
                            const isAlmostSoldOut = soldPercent >= 80 || product.inventory <= 5;

                            return (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className={`group bg-white rounded-2xl border border-slate-100 hover:border-rose-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${viewMode === "list" ? "flex" : ""}`}
                                >
                                    {/* Image */}
                                    <Link
                                        href={`/products/${product.slug}`}
                                        className={viewMode === "list" ? "w-52 flex-shrink-0" : "block"}
                                    >
                                        <div className={`relative bg-gradient-to-br from-slate-50 to-rose-50/30 overflow-hidden ${viewMode === "list" ? "h-full" : "aspect-[4/3]"}`}>
                                            {product.image ? (
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="text-4xl mb-2">🔥</div>
                                                        <span className="text-sm font-medium text-slate-300">{product.category}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Discount Badge */}
                                            <div className="absolute top-3 left-3">
                                                <div className="px-2.5 py-1 bg-rose-400 text-white text-xs font-bold rounded-lg">
                                                    -{product.discount}%
                                                </div>
                                            </div>

                                            {/* Hot Badge */}
                                            {product.isHot && (
                                                <div className="absolute top-3 right-3 w-9 h-9 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full flex items-center justify-center shadow-sm">
                                                    <Flame className="w-4 h-4 text-white" />
                                                </div>
                                            )}

                                            {/* Badge Text */}
                                            {product.badgeText && !product.isHot && (
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-amber-400 text-white text-[10px] font-bold rounded-lg">
                                                    {product.badgeText}
                                                </div>
                                            )}

                                            {/* Wishlist Button */}
                                            <button className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                                                <Heart className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-between" : ""}`}>
                                        <div>
                                            <div className="mb-1.5">
                                                <span className="px-2 py-0.5 bg-rose-50 text-rose-400 text-[10px] font-semibold uppercase tracking-wider rounded">
                                                    {product.category}
                                                </span>
                                            </div>

                                            <Link href={`/products/${product.slug}`}>
                                                <h3 className="font-semibold text-sm text-slate-700 group-hover:text-rose-400 transition-colors line-clamp-2 mb-2.5 leading-snug">
                                                    {product.name}
                                                </h3>
                                            </Link>

                                            {/* Price */}
                                            <div className="mb-3">
                                                <PriceDisplay
                                                    currentPrice={product.salePrice}
                                                    originalPrice={product.originalPrice}
                                                    salePrice={product.salePrice}
                                                    isOnSale={product.originalPrice > product.salePrice}
                                                    size="md"
                                                    showDiscountBadge={false}
                                                />
                                            </div>

                                            {/* Stock Progress */}
                                            <div className="mb-3.5">
                                                <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                                                    <span className={isAlmostSoldOut ? "text-rose-500" : "text-slate-400"}>
                                                        {isAlmostSoldOut && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                                                        {isAlmostSoldOut ? flashT("lowStock", "Sắp hết hàng", "Low stock") : shopT("inStock", "Còn hàng", "In stock")}
                                                    </span>
                                                    <span className={isAlmostSoldOut ? "text-rose-500" : "text-rose-300"}>
                                                        {Math.round(soldPercent)}% {shopT("sold", "Đã bán", "Sold")}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-rose-50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${soldPercent}%` }}
                                                        transition={{ delay: index * 0.04 + 0.3, duration: 0.6 }}
                                                        className={`h-full rounded-full ${isAlmostSoldOut
                                                            ? "bg-rose-400"
                                                            : "bg-rose-200"
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add to Cart */}
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={product.inventory <= 0}
                                            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            {product.inventory > 0 ? shopT("addToCart", "Thêm vào giỏ", "Add to cart") : shopT("outOfStock", "Hết hàng", "Out of stock")}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* View All link */}
                {!loading && products.length > 0 && (
                    <div className="text-center mt-10">
                        <Link
                            href="/products?sale=true"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold text-sm transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            {flashT("viewAllPromos", "Xem tất cả ưu đãi", "View all promos")}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
