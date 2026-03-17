"use client";

/**
 * ProductGrid — Grid/List product rendering with loading, error, empty states
 * Sub-component of Products listing page
 */

import { memo } from "react";
import ProductCard from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/product-skeleton";
import { useLanguage } from "@/lib/i18n/context";
import type { Product } from "@/types/product";

interface ProductGridProps {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    viewMode: "grid" | "list";
    debouncedSearch: string;
    hasActiveFilters: boolean;
    voucherFlags: { hasVoucher: boolean; hasFreeship: boolean };
    // Pagination
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    // Actions
    onRetry: () => void;
    onClearFilters: () => void;
    onSearchChange: (q: string) => void;
    onCategoryReset: () => void;
    onPageReset: () => void;
}

function ProductGridInner({
    products,
    isLoading,
    error,
    viewMode,
    debouncedSearch,
    hasActiveFilters,
    voucherFlags,
    page,
    totalPages,
    onPageChange,
    onRetry,
    onClearFilters,
    onSearchChange,
    onCategoryReset,
    onPageReset,
}: ProductGridProps) {
    const { t, language } = useLanguage();

    // Loading State
    if (isLoading) {
        return <ProductGridSkeleton count={12} />;
    }

    // Error State
    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <p className="text-red-600 font-bold">{error}</p>
                <button
                    onClick={onRetry}
                    className="mt-4 px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                >
                    {t("shopPage.tryAgain")}
                </button>
            </div>
        );
    }

    // Empty State
    if (products.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-20 text-center">
                <p className="text-xl font-black uppercase tracking-tighter mb-2">
                    {t("shopPage.noProductsFound")}
                </p>
                <p className="text-slate-500 font-medium mb-6">
                    {t("shopPage.noResultsFor")}&nbsp;
                    {debouncedSearch ? (
                        <span className="font-black text-slate-900">
                            &ldquo;{debouncedSearch}&rdquo;
                        </span>
                    ) : (
                        t("shopPage.currentFilters")
                    )}
                    .
                </p>

                {/* Quick suggestions */}
                <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                        {t("shopPage.quickSuggestions")}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {(language === "vi"
                            ? ["cá khô", "mực", "tôm khô", "trái cây sấy"]
                            : ["dried fish", "squid", "dried shrimp", "dried fruits"]
                        ).map((suggest) => (
                            <button
                                key={suggest}
                                onClick={() => {
                                    onSearchChange(suggest);
                                    onCategoryReset();
                                    onPageReset();
                                }}
                                className="px-4 py-2 rounded-full bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100"
                            >
                                {suggest}
                            </button>
                        ))}
                    </div>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="px-8 py-4 bg-primary text-white rounded-full font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                    >
                        {t("shopPage.clearFilters")}
                    </button>
                )}
            </div>
        );
    }

    // Product grid + pagination
    return (
        <>
            <div className={`transition-all duration-300 ${viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3"
                : "flex flex-col gap-2.5"
                }`}>
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className="w-full animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${Math.min(index * 15, 200)}ms`, animationFillMode: "both", animationDuration: "200ms" }}
                    >
                        <ProductCard
                            product={{
                                ...product,
                                onSale: product.isOnSale,
                                hasVoucher: voucherFlags.hasVoucher,
                                hasFreeship: voucherFlags.hasFreeship,
                            }}
                            viewMode={viewMode}
                        />
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                    <button
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm disabled:opacity-40 disabled:hover:bg-white/80 disabled:hover:text-slate-700 disabled:hover:border-slate-200 disabled:cursor-not-allowed text-[10px] sm:text-xs"
                    >
                        {t("shopPage.prevPage")}
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl font-black transition-all text-sm sm:text-base ${page === pageNum
                                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                        : "bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300"
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm disabled:opacity-40 disabled:hover:bg-white/80 disabled:hover:text-slate-700 disabled:hover:border-slate-200 disabled:cursor-not-allowed text-[10px] sm:text-xs"
                    >
                        {t("shopPage.nextPage")}
                    </button>
                </div>
            )}
        </>
    );
}

const ProductGrid = memo(ProductGridInner);
export default ProductGrid;
