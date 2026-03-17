"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { Check, Package } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface ProductVariant {
    id: number;
    weight?: string | null;
    flavor?: string | null;
    priceAdjustment: number;
    stock: number;
    isActive: boolean;
}

interface VariantSelectorProps {
    variants: ProductVariant[];
    basePrice: number;
    selectedVariant?: ProductVariant | null;
    onVariantChange: (variant: ProductVariant | null) => void;
}

export default function VariantSelector({
    variants,
    basePrice,
    selectedVariant,
    onVariantChange
}: VariantSelectorProps) {
    const weights = [...new Set(variants.map(v => v.weight).filter((w): w is string => Boolean(w)))];
    const flavors = [...new Set(variants.map(v => v.flavor).filter((f): f is string => Boolean(f)))];
    const { isVietnamese } = useLanguage();

    const [selectedWeight, setSelectedWeight] = useState<string | null>(
        selectedVariant?.weight || (weights.length > 0 ? weights[0]! : null)
    );
    const [selectedFlavor, setSelectedFlavor] = useState<string | null>(
        selectedVariant?.flavor || (flavors.length > 0 ? flavors[0]! : null)
    );

    const findVariant = (weight: string | null, flavor: string | null) => {
        return variants.find(v =>
            v.isActive &&
            v.weight === weight &&
            v.flavor === flavor
        ) || null;
    };

    const handleWeightChange = (weight: string) => {
        setSelectedWeight(weight);
        const variant = findVariant(weight, selectedFlavor);
        onVariantChange(variant);
    };

    const handleFlavorChange = (flavor: string) => {
        setSelectedFlavor(flavor);
        const variant = findVariant(selectedWeight, flavor);
        onVariantChange(variant);
    };

    const currentVariant = findVariant(selectedWeight, selectedFlavor);
    const finalPrice = basePrice + (currentVariant?.priceAdjustment || 0);

    const getFlavorColor = (flavor: string) => {
        const lower = flavor.toLowerCase();
        if (lower.includes('cay') || lower.includes('매운')) return 'from-red-500 to-rose-500';
        if (lower.includes('ngọt') || lower.includes('달콤')) return 'from-amber-400 to-orange-500';
        if (lower.includes('mặn')) return 'from-sky-400 to-blue-500';
        if (lower.includes('truyền thống') || lower.includes('original')) return 'from-emerald-400 to-teal-500';
        return 'from-slate-500 to-slate-600';
    };

    if (variants.length === 0) return null;

    return (
        <div className="space-y-5 pt-5 border-t border-slate-100/80">
            {/* Weight Selector */}
            {weights.length > 0 && (
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3 block px-1">
                        <Package className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Khối lượng
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {weights.map((weight) => {
                            const variant = findVariant(weight, selectedFlavor);
                            const isSelected = weight === selectedWeight;
                            const isOutOfStock = !variant || variant.stock === 0;
                            const price = basePrice + (variant?.priceAdjustment || 0);

                            return (
                                <button
                                    key={weight}
                                    onClick={() => !isOutOfStock && handleWeightChange(weight)}
                                    disabled={isOutOfStock}
                                    className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 group ${isSelected
                                        ? "border-emerald-400 bg-emerald-50/50 shadow-md shadow-emerald-500/10"
                                        : isOutOfStock
                                            ? "border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed"
                                            : "border-slate-100 hover:border-slate-300 bg-white hover:shadow-sm"
                                        }`}
                                >
                                    <div className="text-left">
                                        <div className={`font-black text-base ${isSelected ? "text-emerald-700" : "text-slate-900"}`}>
                                            {weight}
                                        </div>
                                        <div className={`text-xs font-bold mt-0.5 ${isSelected ? "text-emerald-600" : "text-slate-500"}`}>
                                            ${(price || 0).toFixed(2)}
                                        </div>
                                        {isOutOfStock && (
                                            <div className="text-[10px] font-bold text-rose-500 mt-0.5">
                                                {isVietnamese ? "Hết hàng" : "Out of Stock"}
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Flavor Selector */}
            {flavors.length > 0 && (
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3 block px-1">
                        {isVietnamese ? "🌶️ Hương vị" : "🌶️ Flavor"}
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                        {flavors.map((flavor) => {
                            const variant = findVariant(selectedWeight, flavor);
                            const isSelected = flavor === selectedFlavor;
                            const isOutOfStock = !variant || variant.stock === 0;
                            const gradient = getFlavorColor(flavor);

                            return (
                                <button
                                    key={flavor}
                                    onClick={() => !isOutOfStock && handleFlavorChange(flavor)}
                                    disabled={isOutOfStock}
                                    className={`relative px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 ${isSelected
                                        ? `bg-gradient-to-r ${gradient} text-white shadow-lg shadow-slate-900/10 scale-[1.03]`
                                        : isOutOfStock
                                            ? "bg-slate-50 text-slate-400 cursor-not-allowed opacity-40 border border-slate-100"
                                            : "bg-white border-2 border-slate-150 text-slate-700 hover:border-slate-300 hover:shadow-sm"
                                        }`}
                                >
                                    {flavor}
                                    {isOutOfStock && (
                                        <span className="ml-1.5 text-[10px] opacity-70">({isVietnamese ? "Hết" : "Out"})</span>
                                    )}
                                    {isSelected && (
                                        <Check className="w-3.5 h-3.5 inline ml-1.5 -mt-0.5" strokeWidth={3} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Summary pill */}
            {currentVariant && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-emerald-50/50 rounded-2xl border border-slate-100/80">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isVietnamese ? "Giá đã chọn" : "Selected Price"}</div>
                        <div className="text-2xl font-black text-emerald-600">${(finalPrice || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isVietnamese ? "Trạng thái" : "Status"}</div>
                        <div className={`text-lg font-black ${currentVariant.stock > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {currentVariant.stock > 0 ? (isVietnamese ? "Còn hàng" : "In Stock") : (isVietnamese ? "Hết hàng" : "Out of Stock")}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
