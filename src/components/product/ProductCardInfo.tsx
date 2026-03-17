"use client";

/**
 * ProductCardInfo — Name, category, weight, rating, sold count, low stock warning
 * Sub-component of ProductCard
 */

import { Star } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

interface ProductCardInfoProps {
    name: string;
    category: string;
    weight?: string | null;
    ratingValue: number;
    ratingCount: number;
    soldCount: number;
    inventory: number;
    isLowStock: boolean;
    language: string;
    t: any;
}

function formatCompactNumber(num: number) {
    if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`;
    return `${num}`;
}

function StarRating({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`Rating: ${value.toFixed(1)} out of 5`}>
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-3 h-3 transition-colors ${
                        i < Math.floor(value)
                            ? 'fill-amber-400 text-amber-400'
                            : i < value
                                ? 'fill-amber-200 text-amber-300'
                                : 'fill-slate-100 text-slate-200'
                    }`}
                />
            ))}
        </div>
    );
}

function ProductCardInfoComponent({
    name,
    category,
    weight,
    ratingValue,
    ratingCount,
    soldCount,
    inventory,
    isLowStock,
    language,
    t,
}: ProductCardInfoProps) {
    return (
        <div className="flex flex-col items-start gap-1.5">
            {/* Category */}
            <Link
                href={`/products?category=${encodeURIComponent(category)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 uppercase tracking-[0.12em] px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
            >
                {category}
            </Link>

            {/* Product Name & Weight */}
            <div className="w-full text-left">
                <h3 className="font-bold text-[11px] sm:text-xs leading-snug text-slate-900 group-hover:text-emerald-700 transition-colors duration-300 line-clamp-2 min-h-[2rem]">
                    {name}
                </h3>
                {weight && (
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">{weight}</p>
                )}
            </div>

            {/* Rating & Sold — hide if no ratings yet */}
            {(ratingValue > 0 || ratingCount > 0 || soldCount > 0) && (
            <div className="flex items-center justify-between w-full gap-1">
                {(ratingValue > 0 || ratingCount > 0) && (
                <div className="flex items-center gap-1">
                    <StarRating value={ratingValue} />
                    <span className="text-[10px] font-semibold text-slate-500">
                        {ratingValue.toFixed(1)}
                        {ratingCount > 0 && <span className="ml-0.5 text-slate-400">({formatCompactNumber(ratingCount)})</span>}
                    </span>
                </div>
                )}
                {soldCount > 0 && (
                    <span className="text-[10px] text-slate-400">
                        {formatCompactNumber(soldCount)} {t('shop.sold')}
                    </span>
                )}
            </div>
            )}

            {/* Low Stock Warning */}
            {isLowStock && inventory > 0 && (
                <div className="w-full flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-md border border-orange-100">
                    <div className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
                    </div>
                    <span className="text-[10px] font-bold text-orange-600">
                        {t('shop.lowStock')}
                    </span>
                </div>
            )}
        </div>
    );
}

export default memo(ProductCardInfoComponent);
