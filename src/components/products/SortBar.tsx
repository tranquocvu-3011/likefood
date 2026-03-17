"use client";

/**
 * SortBar — Sort dropdown, view mode toggle, items per page
 * Sub-component of Products listing page
 */

import { memo, useState } from "react";
import { ChevronDown, LayoutGrid, List } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface SortBarProps {
    total: number;
    selectedCategory: string;
    debouncedSearch: string;
    // Sort
    sort: string;
    sortOptions: { value: string; label: string }[];
    onSortChange: (val: string) => void;
    // View mode
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
    // Items per page
    itemsPerPage: number;
    onItemsPerPageChange: (n: number) => void;
    onPageReset: () => void;
}

function SortBarInner({
    total,
    selectedCategory,
    debouncedSearch,
    sort,
    sortOptions,
    onSortChange,
    viewMode,
    onViewModeChange,
    itemsPerPage,
    onItemsPerPageChange,
    onPageReset,
}: SortBarProps) {
    const { t, language } = useLanguage();
    const [showSortMenu, setShowSortMenu] = useState(false);

    return (
        <div className="flex flex-wrap justify-between items-start gap-2 mb-5">
            {/* Product count info */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
                <p className="text-slate-600 font-semibold text-xs">
                    {t("shopPage.showing")} <span className="text-emerald-600 font-black px-1.5 py-0.5 bg-emerald-50 rounded-md">{total}</span> {t("shopPage.productsLabel")}
                    {selectedCategory !== t("shopPage.allCategories") && (
                        <> {t("shopPage.inCategory")} <span className="text-slate-900 font-black tracking-wide">&quot;{selectedCategory}&quot;</span></>
                    )}
                    {debouncedSearch && (
                        <> {t("shopPage.forSearch")} <span className="text-slate-900 font-black tracking-wide">&quot;{debouncedSearch}&quot;</span></>
                    )}
                </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {/* Items per page */}
                <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-2.5 py-2 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">{language === "vi" ? "Hiển thị" : "Show"}:</span>
                    {[12, 24, 48].map(n => (
                        <button
                            key={n}
                            onClick={() => { onItemsPerPageChange(n); onPageReset(); }}
                            className={`w-9 h-8 rounded-lg text-xs font-bold transition-all ${itemsPerPage === n ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                        >{n}</button>
                    ))}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center gap-1.5 font-semibold text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                        {t("shopPage.sortBy")} {sortOptions.find(opt => opt.value === sort)?.label || t("shopPage.sortNewest")}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showSortMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onSortChange(option.value);
                                            setShowSortMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${sort === option.value
                                            ? "bg-primary text-white"
                                            : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-1 shadow-sm">
                    <button
                        onClick={() => onViewModeChange("grid")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "grid"
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                        title="Grid View"
                        aria-label="Grid view"
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onViewModeChange("list")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "list"
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                        title="List View"
                        aria-label="List view"
                    >
                        <List className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

const SortBar = memo(SortBarInner);
export default SortBar;
