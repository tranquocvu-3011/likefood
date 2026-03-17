"use client";

/**
 * ProductCardPrice — Price display using PriceDisplay design system component
 * Sub-component of ProductCard
 */

import PriceDisplay from "@/components/ui/price-display";
import QuickAddButton from "./QuickAddButton";
import { memo } from "react";

interface ProductCardPriceProps {
    currentPrice: number;
    originalPrice?: number | null;
    salePrice?: number | null;
    isOnSale?: boolean;
    hasDiscount: boolean;
    basePriceForDiscount: number;
    // Quick Add
    product: {
        id: number;
        slug?: string;
        name: string;
        price: number;
        originalPrice?: number | null;
        salePrice?: number | null;
        isOnSale?: boolean;
        image?: string | null;
        inventory: number;
    };
}

function ProductCardPriceComponent({
    currentPrice,
    originalPrice,
    salePrice,
    isOnSale,
    hasDiscount,
    basePriceForDiscount,
    product,
}: ProductCardPriceProps) {
    return (
        <div className="flex items-center justify-between w-full gap-2 pt-1 border-t border-slate-100 mt-0.5">
            <PriceDisplay
                currentPrice={currentPrice}
                originalPrice={hasDiscount ? (originalPrice ?? basePriceForDiscount) : undefined}
                salePrice={salePrice}
                isOnSale={isOnSale}
                size="sm"
                showDiscountBadge={false}
                className="flex-col items-start gap-0"
            />

            <QuickAddButton product={product} />
        </div>
    );
}

export default memo(ProductCardPriceComponent);
