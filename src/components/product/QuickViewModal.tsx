"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { X, ShoppingBag, Star, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/lib/i18n/context";
import PriceDisplay from "@/components/ui/price-display";

interface QuickViewModalProps {
    product: {
        id: number;
        name: string;
        price: number;
        originalPrice?: number | null;
        salePrice?: number | null;
        isOnSale?: boolean;
        category: string;
        description?: string | null;
        image?: string | null;
        rating?: number;
        inventory?: number;
        slug?: string | null;
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
    const { addItem } = useCart();
    const [quantity, setQuantity] = useState(1);
    const { t, isVietnamese } = useLanguage();

    if (!product) return null;

    const { name, price, originalPrice, salePrice, isOnSale, category, description, image, rating = 5 } = product;

    const hasSalePrice = salePrice != null && salePrice < price;

    const currentPrice = hasSalePrice ? salePrice : price;

    const basePriceForDiscount =
        originalPrice && originalPrice > currentPrice
            ? originalPrice
            : hasSalePrice
                ? price
                : undefined;

    const hasDiscount = !!basePriceForDiscount && basePriceForDiscount > currentPrice;

    const handleQuantityChange = (type: "plus" | "minus") => {
        if (type === "plus") {
            if (product.inventory !== undefined && quantity >= product.inventory) return;
            setQuantity(prev => prev + 1);
        } else {
            if (quantity <= 1) return;
            setQuantity(prev => prev - 1);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setQuantity(1);
                            onClose();
                        }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden z-10"
                    >
                        <button
                            onClick={() => {
                                setQuantity(1);
                                onClose();
                            }}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100/80 backdrop-blur-md text-slate-500 hover:bg-slate-900 hover:text-white transition-all z-20 shadow-sm"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
                            {/* Left: Image */}
                            <div className="aspect-square bg-slate-50 relative group p-4 sm:p-8">
                                <div className="relative w-full h-full rounded-2xl sm:rounded-[2rem] overflow-hidden bg-white shadow-sm border border-slate-100">
                                    <ImageWithFallback
                                        src={image}
                                        alt={name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        sizes="(max-width: 768px) 90vw, 45vw"
                                    />
                                </div>

                                <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex gap-3 sm:gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                                    <Button variant="secondary" className="rounded-2xl sm:rounded-2xl shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 font-bold transition-all px-4 sm:px-6">
                                        <Share2 className="w-4 h-4 mr-2" /> <span className="hidden xs:inline">{t('shop.share')}</span>
                                    </Button>
                                    <Button variant="secondary" className="rounded-2xl sm:rounded-2xl shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-md hover:bg-rose-50 hover:text-rose-500 text-slate-700 font-bold transition-all px-4 sm:px-6">
                                        <Heart className="w-4 h-4 mr-2" /> <span className="hidden xs:inline">{t('shop.addToWishlist')}</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Right: Info */}
                            <div className="p-10 lg:p-16 flex flex-col justify-center">
                                <div className="mb-4">
                                    <span className="text-xs font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-4 py-2 rounded-full">
                                        {category}
                                    </span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 leading-[1.1] tracking-tighter uppercase">
                                    {name}
                                </h2>

                                <div className="flex items-center gap-2 mb-6">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < rating ? "fill-orange-400 text-orange-400" : "text-slate-200"}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 mt-0.5">4.9 ({isVietnamese ? "127 đánh giá" : "127 reviews"})</span>
                                </div>

                                <div className="mb-6">
                                    <PriceDisplay
                                        currentPrice={currentPrice}
                                        originalPrice={hasDiscount ? basePriceForDiscount : undefined}
                                        salePrice={hasDiscount ? currentPrice : undefined}
                                        isOnSale={hasDiscount}
                                        size="lg"
                                        showDiscountBadge={false}
                                    />
                                </div>

                                <div className="prose prose-slate mb-10 text-lg text-slate-500 leading-relaxed max-h-48 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                                    <p className="whitespace-pre-line">
                                        {description || (isVietnamese 
                                            ? "Đặc sản chính gốc Việt Nam, được tuyển chọn kỹ lưỡng và đóng gói theo tiêu chuẩn khắt khe để giữ trọn vẹn hương vị truyền thống. Sản phẩm hiện đang có sẵn tại các kho hàng của LIKEFOOD tại Mỹ."
                                            : "Authentic Vietnamese specialty, carefully selected and packaged to preserve traditional flavors. Products are available at LIKEFOOD warehouses in the USA.")}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                        <div className="flex-1 flex items-center justify-between border border-slate-200 rounded-2xl p-1.5 h-[52px] bg-slate-50/50">
                                            <button
                                                onClick={() => handleQuantityChange("minus")}
                                                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all"
                                            >
                                                -
                                            </button>
                                            <span className="w-12 text-center font-black text-lg text-slate-900">{quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange("plus")}
                                                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (product.inventory !== undefined && product.inventory <= 0) return;
                                                addItem({
                                                    productId: product.id,
                                                    slug: product.slug || undefined,
                                                    name: product.name,
                                                    price: currentPrice,
                                                    originalPrice: hasDiscount ? basePriceForDiscount : undefined,
                                                    salePrice: hasDiscount ? currentPrice : undefined,
                                                    isOnSale: Boolean(isOnSale || hasDiscount),
                                                    quantity,
                                                    image: product.image || undefined,
                                                });
                                                setQuantity(1);
                                                onClose();
                                            }}
                                            disabled={product.inventory !== undefined && product.inventory <= 0}
                                            className="flex-[2] h-[52px] rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/0 hover:shadow-emerald-500/25 font-bold uppercase tracking-widest disabled:opacity-50 transition-all duration-300"
                                        >
                                            {product.inventory !== undefined && product.inventory <= 0 ? t('shop.outOfStock') : t('shop.addToCart')}
                                        </Button>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/50">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide leading-tight">Giao nhanh<br />3-5 ngày</div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/50">
                                            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                                <Star className="w-5 h-5" />
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide leading-tight">Chất lượng<br />Đảm bảo</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
