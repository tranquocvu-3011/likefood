"use client";

import { memo } from "react";

/**
 * FilterSidebar — Category, price range, tags, rating, stock/freeship filters
 * Sub-component of Products listing page
 */

import { SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface FilterSidebarProps {
    categories: string[];
    // State values
    selectedCategory: string;
    minPrice: string;
    maxPrice: string;
    minRating: number;
    inStockOnly: boolean;
    freeShippingOnly: boolean;
    hasActiveFilters: boolean;
    // Setters
    onCategoryChange: (cat: string) => void;
    onMinPriceChange: (val: string) => void;
    onMaxPriceChange: (val: string) => void;
    onRatingChange: (rating: number) => void;
    onInStockChange: (val: boolean) => void;
    onFreeShippingChange: (val: boolean) => void;
    onClearFilters: () => void;
    onPageReset: () => void;
    getCategoryGradient: (cat: string) => string;
}

function FilterSidebarInner({
    categories,
    selectedCategory,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    freeShippingOnly,
    hasActiveFilters,
    onCategoryChange,
    onMinPriceChange,
    onMaxPriceChange,
    onRatingChange,
    onInStockChange,
    onFreeShippingChange,
    onClearFilters,
    onPageReset,
    getCategoryGradient,
}: FilterSidebarProps) {
    const { t } = useLanguage();

    return (
        <div className="bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-xl border border-slate-100/80 sticky top-20 shadow-[0_8px_40px_rgba(0,0,0,0.04)] max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    {t("shopPage.filters")}
                </h3>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                        {t("shopPage.clearFilters")}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Categories */}
                <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2 px-1">
                        {t("shopPage.productCategories")}
                    </h4>
                    <div className="flex flex-col gap-0.5">
                        {categories.map((cat) => {
                            const isActive = selectedCategory === cat;
                            const gradient = getCategoryGradient(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => onCategoryChange(cat)}
                                    className={`text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                                        ? `bg-gradient-to-r ${gradient} text-white shadow-md scale-[1.01]`
                                        : "text-slate-600 hover:bg-slate-50 hover:pl-4"
                                        }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Price Range */}
                <div className="pt-3 border-t border-slate-100/80">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2 px-1">
                        {t("shopPage.priceRange")}
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5">
                        <input
                            type="number"
                            placeholder={t("shopPage.priceFrom")}
                            value={minPrice}
                            onChange={(e) => onMinPriceChange(e.target.value)}
                            className="bg-slate-50/80 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all"
                        />
                        <input
                            type="number"
                            placeholder={t("shopPage.priceTo")}
                            value={maxPrice}
                            onChange={(e) => onMaxPriceChange(e.target.value)}
                            className="bg-slate-50/80 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all"
                        />
                    </div>
                </div>



                {/* Rating */}
                <div className="pt-3 border-t border-slate-100/80">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2 px-1">
                        {t("shopPage.rating")}
                    </h4>
                    <button
                        onClick={() => onRatingChange(minRating === 4 ? 0 : 4)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${minRating === 4
                            ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 bg-white border border-slate-100"
                            }`}
                    >
                        <span className="text-amber-400">⭐</span> {t("shopPage.ratingAbove4")}
                    </button>
                </div>

                {/* Stock & Free Shipping */}
                <div className="pt-3 border-t border-slate-100/80 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => { onInStockChange(e.target.checked); onPageReset(); }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-300 transition-all"
                        />
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                            {t("shopPage.inStockOnly")}
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={freeShippingOnly}
                            onChange={(e) => { onFreeShippingChange(e.target.checked); onPageReset(); }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-300 transition-all"
                        />
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                            {t("shopPage.freeShippingOnly")}
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
}

const FilterSidebar = memo(FilterSidebarInner);
export default FilterSidebar;
