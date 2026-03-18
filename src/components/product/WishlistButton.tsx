"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { Heart } from "lucide-react";
import { useWishlistContext } from "@/contexts/WishlistContext";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/context";
import { analytics } from "@/lib/analytics/sdk";

interface WishlistButtonProps {
    productId: number;
}

export default function WishlistButton({ productId }: WishlistButtonProps) {
    const { isInWishlist, toggleWishlist } = useWishlistContext();
    const { t, isVietnamese } = useLanguage();
    const inWishlist = isInWishlist(productId);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        setIsLoading(true);
        try {
            // Track wishlist event before toggle
            if (inWishlist) {
                analytics.trackRemoveFromWishlist(productId, `product_${productId}`);
            } else {
                analytics.trackAddToWishlist(productId, `product_${productId}`);
            }
            await toggleWishlist(productId);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.button
            onClick={handleToggle}
            disabled={isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={inWishlist ? t('shop.removedFromWishlist') : t('shop.addToWishlist')}
            aria-pressed={inWishlist}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity disabled:cursor-not-allowed"
        >
            <Heart
                className={`w-5 h-5 transition-colors ${
                    inWishlist
                        ? "fill-red-500 text-red-500"
                        : "text-slate-600 hover:text-red-500"
                    }`}
            />
        </motion.button>
    );
}
