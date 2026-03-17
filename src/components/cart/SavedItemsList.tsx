"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Link from "next/link";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X } from "lucide-react";
import PriceDisplay from "@/components/ui/price-display";
import { useLanguage } from "@/lib/i18n/context";

export interface SavedItem {
    id: string | number;
    name: string;
    slug?: string;
    price: number;
    originalPrice?: number;
    salePrice?: number;
    isOnSale?: boolean;
    quantity?: number;
    image?: string;
    inventory?: number;
    productId: number;
}

interface SavedItemsListProps {
    items: SavedItem[];
    onMoveToCart: (item: SavedItem) => void;
    onRemove: (id: string) => void;
}

export function SavedItemsList({ items, onMoveToCart, onRemove }: SavedItemsListProps) {
    const { t, language } = useLanguage();

    if (items.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">{t('cart.savedItemsEmpty')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex gap-4 md:gap-8 p-4 md:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm"
                >
                    <Link
                        href={`/products/${item.slug || item.id}`}
                        className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-100 relative"
                    >
                        <ImageWithFallback src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                    </Link>
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <Link href={`/products/${item.slug || item.id}`} prefetch={true}>
                                <h3 className="font-black text-lg md:text-xl hover:text-primary transition-colors">{item.name}</h3>
                            </Link>
                            <PriceDisplay
                                currentPrice={item.price}
                                originalPrice={item.originalPrice}
                                salePrice={item.salePrice}
                                isOnSale={item.isOnSale || (item.originalPrice != null && item.originalPrice > item.price)}
                                size="md"
                                className="mt-1"
                                showDiscountBadge={false}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <Button
                                onClick={() => onMoveToCart({ ...item, productId: Number(item.productId || item.id) })}
                                className="flex-1 h-12 rounded-full bg-primary text-white font-bold"
                            >
                                {t("shop.addToCart")}
                            </Button>
                            <button
                                onClick={() => onRemove(String(item.id))}
                                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
