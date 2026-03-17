"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import { ShoppingCart, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PriceDisplay from "@/components/ui/price-display";

interface StickyBuyBarProps {
    productName: string;
    price: number;
    originalPrice?: number;
    inStock: boolean;
    isAddingToCart: boolean;
    onAddToCart: () => void;
    onBuyNow: () => void;
    t: (key: string) => string;
}

export default function StickyBuyBar({
    productName,
    price,
    originalPrice,
    inStock,
    isAddingToCart,
    onAddToCart,
    onBuyNow,
    t,
}: StickyBuyBarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past 500px
            setIsVisible(window.scrollY > 500);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
                >
                    <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] px-4 py-3 safe-area-bottom">
                        <div className="flex items-center gap-3">
                            {/* Price Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-400 truncate font-bold uppercase tracking-wider mb-0.5">{productName}</p>
                                <PriceDisplay
                                    currentPrice={price}
                                    originalPrice={originalPrice && originalPrice > price ? originalPrice : undefined}
                                    size="lg"
                                    showDiscountBadge={false}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    onClick={onAddToCart}
                                    disabled={!inStock || isAddingToCart}
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 disabled:opacity-40 transition-all shadow-sm"
                                    aria-label={t("shop.addToCart")}
                                >
                                    {isAddingToCart ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full"
                                        />
                                    ) : (
                                        <ShoppingCart className="w-5 h-5" />
                                    )}
                                </motion.button>
                                
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={onBuyNow}
                                    disabled={!inStock}
                                    className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-slate-900 to-black text-white font-black text-[13px] uppercase tracking-widest disabled:opacity-40 shadow-xl shadow-slate-900/20"
                                >
                                    <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    {t("shop.buyNow")}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
