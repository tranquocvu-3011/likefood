"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import { ShoppingCart, Loader2, Sparkles, Check } from "lucide-react";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/lib/i18n/context";
import { toast } from "sonner";
import PriceDisplay from "@/components/ui/price-display";

interface Product {
    id: number;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    salePrice?: number;
    isOnSale?: boolean;
    image?: string;
    inventory: number;
}

interface FrequentlyBoughtTogetherProps {
    currentProduct: Product;
}

function getEffectivePrice(p: Product) {
    return p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price;
}

export default function FrequentlyBoughtTogether({ currentProduct }: FrequentlyBoughtTogetherProps) {
    const [recommended, setRecommended] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const { addItem } = useCart();
    const { language } = useLanguage();
    const vi = language === "vi";
    const [isAddingAll, setIsAddingAll] = useState(false);

    useEffect(() => {
        const fetchFBT = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/products/recommendations/fbt?product=${currentProduct.slug}`);
                if (!res.ok) throw new Error("Failed to fetch FBT");
                const data = await res.json();
                // Ensure exactly 4 recommended products (total 5 with current)
                const limited = (data as Product[]).slice(0, 4);
                setRecommended(limited);
                setSelectedIds(limited.map((p: Product) => p.id));
            } catch (err) {
                console.error("FBT Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentProduct.slug) {
            fetchFBT();
        }
    }, [currentProduct.slug]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(Number(id))
                ? prev.filter(i => String(i) !== String(id))
                : [...prev, Number(id)]
        );
    };

    const handleAddAll = async () => {
        setIsAddingAll(true);
        const selectedProducts = recommended.filter(p => selectedIds.includes(p.id));

        if (selectedProducts.length === 0) {
            toast.error(vi ? "Vui lòng chọn ít nhất 1 sản phẩm để thêm vào giỏ hàng" : "Please select at least 1 product");
            setIsAddingAll(false);
            return;
        }

        let addedCount = 0;

        // 1. Add current product first
        const currentEffective = getEffectivePrice(currentProduct);
        const currentOriginal = currentProduct.originalPrice && currentProduct.originalPrice > currentEffective ? currentProduct.originalPrice : undefined;
        const addedCurrent = addItem({
            productId: currentProduct.id,
            slug: currentProduct.slug,
            name: currentProduct.name,
            price: currentEffective,
            originalPrice: currentOriginal,
            salePrice: currentOriginal ? currentEffective : undefined,
            isOnSale: !!currentOriginal,
            image: currentProduct.image,
            quantity: 1,
            inventory: currentProduct.inventory,
        });
        if (addedCurrent) addedCount++;

        // 2. Add selected recommended products
        for (const p of selectedProducts) {
            const effectivePrice = getEffectivePrice(p);
            const originalPrice = p.originalPrice && p.originalPrice > effectivePrice ? p.originalPrice : undefined;
            const added = addItem({
                productId: p.id,
                slug: p.slug,
                name: p.name,
                price: effectivePrice,
                originalPrice,
                salePrice: originalPrice ? effectivePrice : undefined,
                isOnSale: !!originalPrice,
                image: p.image,
                quantity: 1,
                inventory: p.inventory,
            });
            if (added) addedCount++;
        }

        if (addedCount > 0) {
            toast.success(vi ? `Đã thêm ${addedCount} sản phẩm vào giỏ hàng!` : `Added ${addedCount} items to cart!`);
        }
        setIsAddingAll(false);
    };

    if (isLoading) return null;
    if (recommended.length === 0) return null;

    // Total price includes current product + selected recommended
    const currentPrice = getEffectivePrice(currentProduct);
    const selectedTotal = recommended
        .filter(p => selectedIds.includes(p.id))
        .reduce((sum, p) => sum + getEffectivePrice(p), 0);
    const totalPrice = currentPrice + selectedTotal;

    return (
        <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">
                        {vi ? "Gợi ý Combo" : "Combo Suggestions"}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                        {vi ? "Kết hợp để có trải nghiệm hoàn hảo" : "Combine for the perfect experience"}
                    </p>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-xl lg:flex items-center gap-12">
                {/* Product List — 3-col grid on mobile, flex-wrap on desktop */}
                <div className="flex-1 grid grid-cols-3 sm:flex sm:flex-wrap items-start sm:items-center justify-items-center sm:justify-center lg:justify-start gap-3 sm:gap-6">
                    {/* Current Product */}
                    <div className="relative group">
                        <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 relative shadow-sm">
                            <ImageWithFallback
                                src={currentProduct.image}
                                alt={currentProduct.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 96px, 160px"
                            />
                            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-3 text-center w-24 sm:w-40">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-900 truncate">{currentProduct.name}</p>
                            <PriceDisplay
                                currentPrice={currentPrice}
                                originalPrice={currentProduct.originalPrice && currentProduct.originalPrice > currentPrice ? currentProduct.originalPrice : undefined}
                                salePrice={currentProduct.salePrice}
                                isOnSale={!!(currentProduct.originalPrice && currentProduct.originalPrice > currentPrice)}
                                size="sm"
                                showDiscountBadge={false}
                                className="justify-center gap-1"
                            />
                        </div>
                    </div>

                    {recommended.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 sm:gap-6">
                            {/* Plus sign — hidden on mobile grid, visible on desktop flex */}
                            <div className="hidden sm:block text-slate-200 text-3xl font-black">+</div>
                            <div
                                className={`relative group cursor-pointer transition-all duration-500 ${selectedIds.includes(product.id) ? "grayscale-0 opacity-100" : "grayscale opacity-40 hover:opacity-70"
                                    }`}
                                onClick={() => toggleSelection(String(product.id))}
                            >
                                <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 relative shadow-md group-hover:shadow-xl transition-all">
                                    <ImageWithFallback
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 96px, 160px"
                                    />
                                    {selectedIds.includes(product.id) && (
                                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-in zoom-in-50 duration-300">
                                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 sm:mt-3 text-center w-24 sm:w-40">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-900 truncate">{product.name}</p>
                                    <PriceDisplay
                                        currentPrice={getEffectivePrice(product)}
                                        originalPrice={product.originalPrice && product.originalPrice > getEffectivePrice(product) ? product.originalPrice : undefined}
                                        salePrice={product.salePrice}
                                        isOnSale={!!(product.originalPrice && product.originalPrice > getEffectivePrice(product))}
                                        size="sm"
                                        showDiscountBadge={false}
                                        className="justify-center gap-1"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bundle Summary & Action */}
                <div className="mt-10 lg:mt-0 lg:w-80 p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                            <span>{vi ? "Sản phẩm đã chọn:" : "Selected products:"}</span>
                            <span className="text-slate-900">{selectedIds.length + 1}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-black uppercase tracking-widest text-slate-400">
                                {vi ? "Tổng cộng:" : "Total:"}
                            </span>
                            <PriceDisplay currentPrice={totalPrice} size="lg" showDiscountBadge={false} className="justify-end" />
                        </div>
                    </div>

                    <Button
                        onClick={handleAddAll}
                        disabled={selectedIds.length === 0 || isAddingAll}
                        className="w-full h-16 rounded-full bg-slate-900 hover:bg-primary text-white font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
                    >
                        {isAddingAll ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <ShoppingCart className="w-5 h-5 mr-3" />
                                {vi ? "Mua cả bộ" : "Buy bundle"}
                            </>
                        )}
                    </Button>
                    <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                        {vi ? "* Tiết kiệm thời gian, tăng trải nghiệm" : "* Save time, enhance your experience"}
                    </p>
                </div>
            </div>
        </section>
    );
}
