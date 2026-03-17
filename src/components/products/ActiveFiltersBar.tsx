"use client";

/**
 * ActiveFiltersBar — Displays active filter chips with individual clear buttons
 * Sub-component of Products listing page
 */

import { Search, X, Star, Package, Truck } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n/context";

interface ActiveFiltersBarProps {
    searchQuery: string;
    selectedCategory: string;
    minPrice: string;
    maxPrice: string;
    minRating: number;
    inStockOnly: boolean;
    freeShippingOnly: boolean;
    sort: string;
    sortOptions: { value: string; label: string }[];
    // Callbacks
    onSearchClear: () => void;
    onCategoryClear: () => void;
    onPriceClear: () => void;
    onRatingClear: () => void;
    onInStockClear: () => void;
    onFreeShippingClear: () => void;
    onSortClear: () => void;
    onClearAll: () => void;
}

export default function ActiveFiltersBar({
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    freeShippingOnly,
    sort,
    sortOptions,
    onSearchClear,
    onCategoryClear,
    onPriceClear,
    onRatingClear,
    onInStockClear,
    onFreeShippingClear,
    onSortClear,
    onClearAll,
}: ActiveFiltersBarProps) {
    const { t, language } = useLanguage();

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">{t("shopPage.filtering")}</span>

            {searchQuery && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200">
                    <Search className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-bold">&quot;{searchQuery}&quot;</span>
                    <button onClick={onSearchClear} className="hover:bg-slate-200 rounded-full p-0.5 transition-colors text-slate-400 hover:text-slate-900"><X className="w-3 h-3" /></button>
                </div>
            )}

            {selectedCategory !== t("shopPage.allCategories") && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                    <Package className="w-3 h-3" />
                    <span className="text-xs font-bold">{selectedCategory}</span>
                    <button onClick={onCategoryClear} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                </div>
            )}

            {(minPrice || maxPrice) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold">
                        {t("shopPage.priceLabel")} {minPrice ? formatPrice(Number(minPrice)) : "0"} – {maxPrice ? formatPrice(Number(maxPrice)) : "∞"}
                    </span>
                    <button onClick={onPriceClear} className="hover:bg-slate-200 rounded-full p-0.5 transition-colors text-slate-400 hover:text-slate-900"><X className="w-3 h-3" /></button>
                </div>
            )}



            {minRating > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold">{minRating}+</span>
                    <button onClick={onRatingClear} className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                </div>
            )}

            {inStockOnly && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-2xl border border-green-200">
                    <span className="text-xs font-bold">{language === "vi" ? "Còn hàng" : "In stock"}</span>
                    <button onClick={onInStockClear} className="hover:bg-green-200 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                </div>
            )}

            {freeShippingOnly && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-2xl border border-sky-200">
                    <Truck className="w-3 h-3" />
                    <span className="text-xs font-bold">{language === "vi" ? "Miễn ship" : "Free ship"}</span>
                    <button onClick={onFreeShippingClear} className="hover:bg-sky-200 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                </div>
            )}

            {sort !== "newest" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-2xl border border-violet-200">
                    <span className="text-xs font-bold">{sortOptions.find(o => o.value === sort)?.label}</span>
                    <button onClick={onSortClear} className="hover:bg-violet-200 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                </div>
            )}

            <button
                onClick={onClearAll}
                className="ml-auto px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-2xl border border-rose-100 hover:border-rose-200 transition-colors uppercase tracking-widest"
            >
                {t("shopPage.clearAll")}
            </button>
        </div>
    );
}
