"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useState } from "react";
import { Clock, X, ShoppingBag } from "lucide-react";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";
import PriceDisplay from "@/components/ui/price-display";

type ViewedProduct = {
    id: number;
    name: string;
    slug?: string | null;
    price: number;
    salePrice?: number | null;
    originalPrice?: number | null;
    image?: string | null;
    category?: string;
    inventory?: number;
    badgeText?: string | null;
    isHot?: boolean;
    onSale?: boolean;
    isOnSale?: boolean;
};

export default function RecentlyViewed() {
    const { t } = useLanguage();
    const [products, setProducts] = useState<ViewedProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const viewed = localStorage.getItem("recentlyViewed");
            if (!viewed) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                const ids = [...new Set(JSON.parse(viewed) as string[])].slice(0, 8);
                if (ids.length === 0) {
                    if (isMounted) setLoading(false);
                    return;
                }

                const fetchedProducts = await Promise.all(
                    ids.map(async (id) => {
                        try {
                            const res = await fetch(`/api/products/${id}`, { 
                                cache: "no-store"
                            });
                            if (!res.ok || res.status === 404) return null;
                            const data = await res.json();
                            if (!data?.id) return null;
                            // Fallback ảnh: image → productImages → images (alias từ API)
                            const resolvedImage = data.image 
                                || data.productImages?.[0]?.imageUrl 
                                || data.images?.[0]?.imageUrl 
                                || null;
                            return { ...data, image: resolvedImage };
                        } catch {
                            return null;
                        }
                    })
                );

                if (!isMounted) return;

                const validProducts = (fetchedProducts.filter(Boolean) as ViewedProduct[]);
                const seenIds = new Set<number>();
                setProducts(validProducts.filter((p) => {
                    if (seenIds.has(p.id)) return false;
                    seenIds.add(p.id);
                    return true;
                }));
                setLoading(false);
            } catch (err) {
                if (isMounted) {
                    logger.warn("Failed to parse recentlyViewed", { context: "recently-viewed", error: err as Error });
                    setLoading(false);
                }
            }
        };

        const frame = requestAnimationFrame(() => load());
        return () => {
            isMounted = false;
            cancelAnimationFrame(frame);
        };
    }, []);

    if (loading || products.length === 0) return null;

    return (
        <section className="py-5 border-t border-slate-100">
            <div className="w-full mx-auto px-6 sm:px-10 lg:px-[8%]">
                {/* Compact header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">{t("shop.recentlyViewed")}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {products.length}
                        </span>
                    </div>
                    <button
                        onClick={() => { localStorage.removeItem("recentlyViewed"); setProducts([]); }}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
                    >
                        <X className="w-3 h-3" />
                        {t("shop.clearHistory")}
                    </button>
                </div>

                {/* Horizontal scroll strip */}
                <div
                    className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {products.map((product, idx) => {
                        const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
                        const isOnSale = Boolean(product.onSale || product.isOnSale || hasSalePrice);
                        const currentPrice = hasSalePrice ? product.salePrice! : product.price;
                        const comparePrice =
                            product.originalPrice != null && product.originalPrice > currentPrice
                                ? product.originalPrice
                                : hasSalePrice
                                    ? product.price
                                    : undefined;
                        const url = `/products/${product.slug || product.id}`;

                        return (
                            <Link
                                key={product.id}
                                href={url}
                                className="flex-none w-[130px] sm:w-[148px] group animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}
                            >
                                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                                    {/* Image */}
                                    <div className="relative aspect-square overflow-hidden bg-slate-50">
                                        {product.image ? (
                                            <ImageWithFallback
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                sizes="148px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="w-7 h-7 text-slate-200" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-2">
                                        {product.category && (
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5 truncate">
                                                {product.category}
                                            </p>
                                        )}
                                        <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight mb-1.5 min-h-[2.5em]">
                                            {product.name}
                                        </p>
                                        <div className="mt-auto">
                                            <PriceDisplay
                                                currentPrice={currentPrice}
                                                originalPrice={comparePrice}
                                                salePrice={isOnSale ? currentPrice : undefined}
                                                isOnSale={isOnSale}
                                                size="sm"
                                                showDiscountBadge={false}
                                                className="!gap-1.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
