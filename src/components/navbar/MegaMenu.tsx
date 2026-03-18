"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ArrowRight, Package } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { useState, useEffect } from "react";
import PriceDisplay from "@/components/ui/price-display";

interface MegaMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuProduct {
    id: number;
    slug: string;
    name: string;
    price: number;
    salePrice: number | null;
    originalPrice: number | null;
    image: string | null;
}

interface MenuCategory {
    id: number;
    name: string;
    slug: string;
    products: MenuProduct[];
}

const ACCENT_COLORS = [
    { accent: "bg-blue-500",    textAccent: "text-blue-600",   border: "border-blue-100",   bg: "bg-blue-50" },
    { accent: "bg-orange-500",  textAccent: "text-orange-600", border: "border-orange-100", bg: "bg-orange-50" },
    { accent: "bg-emerald-500", textAccent: "text-emerald-600",border: "border-emerald-100",bg: "bg-emerald-50" },
    { accent: "bg-amber-500",   textAccent: "text-amber-600",  border: "border-amber-100",  bg: "bg-amber-50" },
    { accent: "bg-red-500",     textAccent: "text-red-600",    border: "border-red-100",    bg: "bg-red-50" },
    { accent: "bg-violet-500",  textAccent: "text-violet-600", border: "border-violet-100", bg: "bg-violet-50" },
    { accent: "bg-cyan-500",    textAccent: "text-cyan-600",   border: "border-cyan-100",   bg: "bg-cyan-50" },
    { accent: "bg-pink-500",    textAccent: "text-pink-600",   border: "border-pink-100",   bg: "bg-pink-50" },
];

export default function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
    const { t } = useLanguage();
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        if (!isOpen) return;
        fetch("/api/categories/menu")
            .then((r) => r.ok ? r.json() : { categories: [] })
            .then((data: { categories: MenuCategory[] }) => {
                if (Array.isArray(data.categories) && data.categories.length > 0) {
                    setCategories(data.categories);
                    setActiveIdx(0);
                }
            })
            .catch(() => {});
    }, [isOpen]);

    const activeCategory = categories[activeIdx];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60]"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[900px] max-w-[calc(100vw-32px)] bg-white border border-slate-200/80 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.12)] z-[70] overflow-hidden"
                    >
                        {/* Accent line */}
                        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-400 via-primary to-teal-400" />

                        <div className="flex">
                            {/* -- Left: Category list -- */}
                            <aside className="w-[190px] flex-shrink-0 bg-slate-50/80 border-r border-slate-100 py-4">
                                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400 px-5 mb-3">
                                    {t("navbar.categoriesSummary")}
                                </p>
                                <ul className="space-y-0.5">
                                    {categories.map((cat, i) => {
                                        const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
                                        const isActive = i === activeIdx;
                                        return (
                                            <li key={cat.id}>
                                                <button
                                                    type="button"
                                                    onMouseEnter={() => setActiveIdx(i)}
                                                    onClick={() => setActiveIdx(i)}
                                                    className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left transition-all ${
                                                        isActive
                                                            ? "bg-white text-slate-900 font-bold shadow-sm"
                                                            : "text-slate-600 hover:bg-white/70 hover:text-slate-800"
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.accent}`} />
                                                    <span className="text-[12px] leading-snug">{cat.name}</span>
                                                    {isActive && <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0 text-slate-400" />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <div className="px-5 mt-4">
                                    <Link
                                        href="/products"
                                        onClick={onClose}
                                        className="text-[11px] font-bold text-primary hover:text-primary/75 flex items-center gap-1 transition-colors"
                                    >
                                        {t("common.viewAll")} <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </aside>

                            {/* -- Right: Products grid -- */}
                            <div className="flex-1 p-5 min-h-[280px]">
                                {activeCategory ? (
                                    <motion.div
                                        key={activeCategory.id}
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {/* Category header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-[13px] font-extrabold text-slate-900 tracking-tight">
                                                    {activeCategory.name}
                                                </h3>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {activeCategory.products.length} {t("common.products")}
                                                </p>
                                            </div>
                                            <Link
                                                href={`/products?category=${encodeURIComponent(activeCategory.slug)}`}
                                                onClick={onClose}
                                                className="text-[11px] font-bold text-primary hover:text-primary/75 flex items-center gap-1 transition-colors"
                                            >
                                                {t("common.viewAll")} <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>

                                        {/* 4-product grid */}
                                        <div className="grid grid-cols-4 gap-3">
                                            {activeCategory.products.map((product) => {
                                                const isOnSale = product.salePrice != null && product.salePrice < product.price;
                                                const displayPrice = isOnSale ? product.salePrice! : product.price;
                                                const comparePrice = product.originalPrice && product.originalPrice > displayPrice
                                                    ? product.originalPrice
                                                    : isOnSale
                                                        ? product.price
                                                        : undefined;
                                                return (
                                                    <Link
                                                        key={product.id}
                                                        href={`/products/${product.slug}`}
                                                        onClick={onClose}
                                                        className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                                                    >
                                                        {/* Product image */}
                                                        <div className="relative aspect-square bg-white overflow-hidden">
                                                            {product.image ? (
                                                                <Image
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    fill
                                                                    sizes="150px"
                                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                                    <Package className="w-8 h-8 text-slate-300" />
                                                                </div>
                                                            )}
                                                            {product.salePrice && (
                                                                <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                                    SALE
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Product info */}
                                                        <div className="p-2">
                                                            <p className="text-[11px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                                                {product.name}
                                                            </p>
                                                            <PriceDisplay
                                                                currentPrice={displayPrice}
                                                                originalPrice={comparePrice}
                                                                salePrice={isOnSale ? displayPrice : undefined}
                                                                isOnSale={isOnSale}
                                                                size="sm"
                                                                showDiscountBadge={false}
                                                                className="mt-1 !gap-1"
                                                            />
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* Loading skeleton */
                                    <div className="grid grid-cols-4 gap-3">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden animate-pulse">
                                                <div className="aspect-square bg-slate-200" />
                                                <div className="p-2 space-y-1.5">
                                                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Footer CTA */}
                                <div className="mt-5 pt-4 border-t border-slate-100">
                                    <Link
                                        href="/products"
                                        onClick={onClose}
                                        className="group flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-[12px] font-bold tracking-wide transition-all shadow-sm hover:shadow-md hover:shadow-primary/20"
                                    >
                                        {t("navbar.exploreAllProducts")}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}