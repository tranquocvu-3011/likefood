/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * PriceDisplay – Component hiển thị giá thống nhất (current, original, discount %)
 * Sử dụng ở ProductCard, ProductDetail, Cart, Checkout
 */

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";

interface PriceDisplayProps {
    currentPrice: number;
    originalPrice?: number | null;
    salePrice?: number | null;
    isOnSale?: boolean;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
    showDiscountBadge?: boolean;
}

export default function PriceDisplay({
    currentPrice,
    originalPrice,
    salePrice,
    isOnSale,
    size = "md",
    className,
    showDiscountBadge = true,
}: PriceDisplayProps) {
    const effectivePrice = isOnSale && salePrice ? salePrice : currentPrice;
    const hasDiscount = (isOnSale && salePrice && salePrice < currentPrice) ||
        (originalPrice && originalPrice > effectivePrice);
    const basePrice = originalPrice || currentPrice;
    const discountPercent = hasDiscount ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0;

    const sizeClasses = {
        xs: { current: "text-[13px]", original: "text-[10px]", percent: "text-[10px]", badge: "text-[9px] px-1.5 py-0.5" },
        sm: { current: "text-lg", original: "text-xs", percent: "text-[11px]", badge: "text-[10px] px-2 py-0.5" },
        md: { current: "text-2xl", original: "text-sm", percent: "text-sm", badge: "text-xs px-3 py-1" },
        lg: { current: "text-3xl", original: "text-lg", percent: "text-base", badge: "text-xs px-3 py-1" },
        xl: { current: "text-5xl", original: "text-2xl", percent: "text-lg", badge: "text-sm px-4 py-1.5" },
    };

    const s = sizeClasses[size];

    return (
        <span className={cn("inline-flex items-baseline gap-1.5 flex-wrap", className)}>
            {hasDiscount && (
                <span className={cn("text-slate-400 line-through font-medium", s.original)}>
                    {formatPrice(basePrice)}
                </span>
            )}
            <span
                className={cn(
                    "font-black",
                    s.current,
                    hasDiscount
                        ? "bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent"
                        : "text-slate-900"
                )}
            >
                {formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
                <>
                    {discountPercent > 0 && (
                        <span className={cn("font-bold text-rose-500", s.percent)}>
                            -{discountPercent}%
                        </span>
                    )}
                    {showDiscountBadge && discountPercent > 0 && (
                        <span
                            className={cn(
                                "bg-gradient-to-r from-red-500 to-rose-500 text-white font-black rounded-full shadow-lg shadow-red-500/30",
                                s.badge
                            )}
                        >
                            -{discountPercent}%
                        </span>
                    )}
                </>
            )}
        </span>
    );
}
