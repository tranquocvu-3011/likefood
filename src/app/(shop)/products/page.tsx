"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { Search, ChevronUp, Loader2, X, Filter } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParams, useRouter } from "next/navigation";
import { tracking } from "@/lib/tracking";
import { prefetchCommonRoutes } from "@/lib/prefetch";
import type { Product, ProductSearchHint } from "@/types/product";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";
import { motion, AnimatePresence } from "framer-motion";

// Sub-components
import FilterSidebar from "@/components/products/FilterSidebar";
import SortBar from "@/components/products/SortBar";
import ActiveFiltersBar from "@/components/products/ActiveFiltersBar";
import ProductGrid from "@/components/products/ProductGrid";

// Categories will be translated dynamically based on language

// Fallback slug → Vietnamese name map (used when API is unavailable)
const CATEGORY_TO_DB_STATIC: Record<string, string> = {
    "ca-kho": "Cá khô",
    "muc-kho": "Tôm & Mực khô",
    "trai-cay-say": "Trái cây sấy",
    "banh-mut": "Trà & Bánh mứt",
    "gia-vi": "Gia vị Việt",
};

// Fallback category names (used when /api/categories is unavailable)
const FALLBACK_CATEGORY_NAMES = {
    vi: ["Cá khô", "Tôm & Mực khô", "Trái cây sấy", "Trà & Bánh mứt", "Gia vị Việt"],
    en: ["Dried fish", "Dried shrimp & squid", "Dried fruits", "Tea & preserves", "Vietnamese spices"],
} as const;

type DbCategory = { id: string; name: string; nameEn: string | null; slug: string };

function ProductCatalogContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t, language } = useLanguage();
    const querySearch = searchParams.get("search") || "";

    // Dynamic categories from DB (admin panel Category model)
    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
    useEffect(() => {
        fetch('/api/categories')
            .then(r => r.ok ? r.json() : [])
            .then((data: unknown) => {
                if (Array.isArray(data) && data.length > 0) setDbCategories(data as DbCategory[]);
            })
            .catch(() => {});
    }, []);

    // Build category list from DB - use nameEn when language is English
    const categoryNames = dbCategories.length > 0
        ? dbCategories.map(c => language === "en" && c.nameEn ? c.nameEn : c.name)
        : FALLBACK_CATEGORY_NAMES[language === "en" ? "en" : "vi"];

    const CATEGORIES = [t("shopPage.allCategories"), ...categoryNames];

    // Build slug → Vietnamese name map: merge static fallback with DB slugs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const CATEGORY_TO_DB = useMemo(() => ({
        ...CATEGORY_TO_DB_STATIC,
        ...Object.fromEntries(dbCategories.map(c => [c.slug, c.name])),
    }), [dbCategories]);



    const SORT_OPTIONS = [
        { value: "newest", label: t("shopPage.sortNewest") },
        { value: "best-selling", label: t("shopPage.sortBestSelling") },
        { value: "top-rated", label: t("shopPage.sortTopRated") },
        { value: "price-asc", label: t("shopPage.sortPriceAsc") },
        { value: "price-desc", label: t("shopPage.sortPriceDesc") },
        { value: "name", label: t("shopPage.sortNameAZ") },
    ];
    const queryCategory = searchParams.get("category") || t("shopPage.allCategories");
    const queryMinPrice = searchParams.get("minPrice") || "";
    const queryMaxPrice = searchParams.get("maxPrice") || "";

    const queryRatingGte = searchParams.get("rating_gte");
    const queryInStock = searchParams.get("in_stock");
    const querySort = searchParams.get("sort") || "newest";
    const queryPage = (() => {
        const raw = searchParams.get("page");
        const num = raw ? parseInt(raw, 10) : 1;
        return Number.isNaN(num) || num < 1 ? 1 : num;
    })();

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search hints & recent searches
    const [searchHints, setSearchHints] = useState<ProductSearchHint[]>([]);
    const [showSearchHints, setShowSearchHints] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [voucherFlags, setVoucherFlags] = useState<{ hasVoucher: boolean; hasFreeship: boolean }>({
        hasVoucher: false,
        hasFreeship: false,
    });

    // Filters
    const [searchQuery, setSearchQuery] = useState(querySearch);
    const [selectedCategory, setSelectedCategory] = useState(queryCategory || t("shopPage.allCategories"));
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState("newest");

    const [minRating, setMinRating] = useState<number>(0);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [freeShippingOnly, setFreeShippingOnly] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // UI States
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(24);

    // Show/hide scroll-to-top button
    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 600);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Debounce search query and price inputs
    const debouncedSearch = useDebounce(searchQuery, 500);
    const debouncedMinPrice = useDebounce(minPrice, 600);
    const debouncedMaxPrice = useDebounce(maxPrice, 600);

    // Track previous filter values to detect actual changes (for page reset)
    const prevFiltersRef = useRef<string>("");
    // Ref to read current page without adding to effect deps
    const pageRef = useRef(page);
    pageRef.current = page;

    // Prefetch common routes on mount for better performance
    useEffect(() => {
        prefetchCommonRoutes(router);
    }, [router]);

    // Load recent searches from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const stored = window.localStorage.getItem("lf_recent_searches");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed.slice(0, 8));
                }
            }
        } catch {
            // ignore
        }
    }, []);

    // Fetch active voucher flags once (best-effort)
    useEffect(() => {
        let active = true;
        const run = async () => {
            try {
                const [allRes, shipRes] = await Promise.all([
                    fetch("/api/vouchers?category=all"),
                    fetch("/api/vouchers?category=shipping"),
                ]);
                const all = allRes.ok ? await allRes.json() : [];
                const ship = shipRes.ok ? await shipRes.json() : [];
                if (!active) return;
                setVoucherFlags({
                    hasVoucher: Array.isArray(all) && all.length > 0,
                    hasFreeship: Array.isArray(ship) && ship.length > 0,
                });
            } catch {
                // ignore
            }
        };
        run();
        return () => {
            active = false;
        };
    }, []);

    // Ref to prevent "Sync URL from state" overwriting the URL with stale state
    // immediately after a URL-driven navigation (race condition fix)
    const skipNextUrlSync = useRef(false);
    // Ref to ensure "Load recent filters" only runs once on mount
    const hasLoadedFiltersRef = useRef(false);
    // AbortController ref for cancelling stale fetch requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // Sync local state from URL query (deep link + back/forward)
    useEffect(() => {
        skipNextUrlSync.current = true;
        setSearchQuery(querySearch);
        // Normalize slug → Vietnamese DB name, then use directly (always VI canonical)
        const viName = CATEGORY_TO_DB[queryCategory] ?? queryCategory;
        setSelectedCategory(viName || queryCategory);
        setMinPrice(queryMinPrice);
        setMaxPrice(queryMaxPrice);

        setMinRating(queryRatingGte ? Number(queryRatingGte) || 0 : 0);
        setInStockOnly(queryInStock === "true");
        setSort(querySort || "newest");
        setPage(queryPage);
    }, [
        querySearch,
        queryCategory,
        language,
        queryMinPrice,
        queryMaxPrice,

        queryRatingGte,
        queryInStock,
        querySort,
        queryPage,
        CATEGORY_TO_DB,
    ]);

    // Sync URL from state (full filter/sort/page)
    useEffect(() => {
        // Skip once after URL→state sync to avoid overwriting the URL with stale state
        if (skipNextUrlSync.current) {
            skipNextUrlSync.current = false;
            return;
        }

        const params = new URLSearchParams();

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedCategory && selectedCategory !== t("shopPage.allCategories")) params.set("category", selectedCategory);
        if (debouncedMinPrice) params.set("minPrice", debouncedMinPrice);
        if (debouncedMaxPrice) params.set("maxPrice", debouncedMaxPrice);

        if (minRating) params.set("rating_gte", minRating.toString());
        if (inStockOnly) params.set("in_stock", "true");
        if (freeShippingOnly) params.set("free_shipping", "true");
        if (sort && sort !== "newest") params.set("sort", sort);
        if (page > 1) params.set("page", page.toString());

        const newQuery = params.toString();
        // Normalize comparison: decode both to avoid %20 vs + encoding mismatch
        const normalizeQuery = (q: string) => new URLSearchParams(q).toString();
        if (normalizeQuery(newQuery) === normalizeQuery(searchParams.toString())) return;

        router.push(newQuery ? `/products?${newQuery}` : "/products", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedSearch,
        selectedCategory,
        debouncedMinPrice,
        debouncedMaxPrice,

        minRating,
        inStockOnly,
        freeShippingOnly,
        sort,
        page,
        router,
        searchParams,
    ]);

    // Fetch products from API
    const fetchProducts = useCallback(async (overridePage?: number) => {
        // Cancel any in-flight request to prevent stale responses overwriting newer ones
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setError(null);

        const currentPage = overridePage ?? pageRef.current;

        try {
            const params = new URLSearchParams();

            if (debouncedSearch) params.append("search", debouncedSearch);
            if (selectedCategory && selectedCategory !== t("shopPage.allCategories")) {
                // Always send the Vietnamese DB-canonical name to the API
                params.append("category", CATEGORY_TO_DB[selectedCategory] ?? selectedCategory);
            }
            if (debouncedMinPrice) params.append("minPrice", debouncedMinPrice);
            if (debouncedMaxPrice) params.append("maxPrice", debouncedMaxPrice);

            if (minRating) params.append("rating_gte", minRating.toString());
            if (inStockOnly) params.append("in_stock", "true");
            if (freeShippingOnly) params.append("free_shipping", "true");
            params.append("sort", sort);
            params.append("page", currentPage.toString());
            params.append("limit", itemsPerPage.toString());

            const res = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal });

            if (!res.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await res.json();
            if (!controller.signal.aborted) {
                setProducts(data.products || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotal(data.pagination?.total || 0);
            }
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            logger.error("Products fetch error", err as Error, {
                context: "products-page",
                search: debouncedSearch,
                category: selectedCategory,
                page: currentPage
            });
            if (!controller.signal.aborted) {
                setError(t("shopPage.loadError"));
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [ // eslint-disable-line react-hooks/exhaustive-deps
        debouncedSearch,
        selectedCategory,
        debouncedMinPrice,
        debouncedMaxPrice,
        sort,

        minRating,
        inStockOnly,
        freeShippingOnly,
        itemsPerPage,
    ]);

    // Fetch search hints when user types
    useEffect(() => {
        let active = true;
        const fetchHints = async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                if (active) {
                    setSearchHints([]);
                }
                return;
            }
            try {
                const res = await fetch(`/api/products/search-hints?q=${encodeURIComponent(debouncedSearch)}`);
                if (!res.ok) return;
                const data = await res.json();
                if (active) {
                    setSearchHints(data.hints || []);
                }
            } catch {
                if (active) {
                    setSearchHints([]);
                }
            }
        };

        fetchHints();

        return () => {
            active = false;
        };
    }, [debouncedSearch]);

    // Close search hints when clicking outside
    const searchContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSearchHints(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const lastTrackedList = useRef<{ category?: string; search?: string } | null>(null);

    // Single effect for filters change → reset page + fetch
    useEffect(() => {
        // Build a fingerprint of current filters to detect changes
        const filterKey = JSON.stringify([
            debouncedSearch, selectedCategory, debouncedMinPrice, debouncedMaxPrice,
            minRating, inStockOnly, freeShippingOnly, sort, itemsPerPage
        ]);

        // If filters changed (not just page), reset to page 1 and fetch
        if (prevFiltersRef.current && prevFiltersRef.current !== filterKey) {
            setPage(1);
            // Fetch with page=1 immediately (don't wait for setPage re-render)
            fetchProducts(1);
        } else {
            // Initial load or same filters — fetch with current page
            fetchProducts();
        }
        prevFiltersRef.current = filterKey;

        // Track view_item_list event (debounced to avoid spam)
        const categoryParam = selectedCategory !== t("shopPage.allCategories") ? selectedCategory : undefined;
        const searchParam = debouncedSearch || undefined;
        const key = { category: categoryParam, search: searchParam };

        if (
            lastTrackedList.current &&
            lastTrackedList.current.category === key.category &&
            lastTrackedList.current.search === key.search
        ) {
            return;
        }

        tracking.viewItemList(categoryParam, searchParam);
        lastTrackedList.current = key;
    }, [fetchProducts, selectedCategory, debouncedSearch, debouncedMinPrice, debouncedMaxPrice, minRating, inStockOnly, freeShippingOnly, sort, itemsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

    // Separate effect for page change only (user clicks pagination)
    useEffect(() => {
        // Skip initial render — handled by the filter effect above
        if (!prevFiltersRef.current) return;
        fetchProducts();
    }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClearFilters = () => {
        setSearchQuery("");
        setSelectedCategory(t("shopPage.allCategories"));
        setMinPrice("");
        setMaxPrice("");

        setMinRating(0);
        setInStockOnly(false);
        setFreeShippingOnly(false);
        setSort("newest");
        setPage(1);
        router.push("/products", { scroll: false });
        // Clear recent filters
        localStorage.removeItem("recent_filters");
    };

    const hasActiveFilters =
        searchQuery !== "" ||
        selectedCategory !== t("shopPage.allCategories") ||
        minPrice !== "" ||
        maxPrice !== "" ||

        minRating > 0 ||
        inStockOnly ||
        freeShippingOnly ||
        sort !== "newest";

    // Save recent filters
    useEffect(() => {
        if (!hasActiveFilters) return;
        const filters = {
            category: selectedCategory,
            minPrice,
            maxPrice,

            rating: minRating,
            inStock: inStockOnly,
            freeShipping: freeShippingOnly,
            sort,
        };
        localStorage.setItem("recent_filters", JSON.stringify(filters));
    }, [selectedCategory, minPrice, maxPrice, minRating, inStockOnly, freeShippingOnly, sort, hasActiveFilters]);

    // Load recent filters on mount ONLY — skip if the URL already carries any params
    useEffect(() => {
        if (hasLoadedFiltersRef.current) return;
        hasLoadedFiltersRef.current = true;
        // Don't restore saved filters when the user navigated here with explicit URL params
        if (searchParams.toString()) return;
        const saved = localStorage.getItem("recent_filters");
        if (saved) {
            try {
                const filters = JSON.parse(saved);
                if (filters.category) setSelectedCategory(filters.category);
                if (filters.minPrice) setMinPrice(filters.minPrice);
                if (filters.maxPrice) setMaxPrice(filters.maxPrice);

                if (filters.rating) setMinRating(filters.rating);
                if (filters.inStock) setInStockOnly(filters.inStock);
                if (filters.sort) setSort(filters.sort);
            } catch {
                logger.warn("Failed to load recent filters", { context: "products-page" });
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Get category gradient based on name  
    const getCategoryGradient = (cat: string) => {
        if (!cat) return 'from-primary to-orange-600';
        const lower = cat.toLowerCase();
        if (lower.includes('cá') || lower.includes('tôm') || lower.includes('mực')) return 'from-sky-500 to-blue-600';
        if (lower.includes('trái cây')) return 'from-emerald-500 to-green-600';
        if (lower.includes('bánh') || lower.includes('trà')) return 'from-amber-500 to-yellow-600';
        if (lower.includes('gia vị')) return 'from-rose-500 to-red-600';
        return 'from-primary to-orange-600';
    };

    return (
        <>
        <div className="bg-slate-50 min-h-screen">
            {/* Layout thu gọn: max-width nhỏ lại ~ một nửa so với full width */}
            <div className="max-w-[82rem] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header section - Cleaned up to avoid double search bar */}
            <section className="bg-white pt-5 pb-4 sm:pt-7 sm:pb-5 border-b border-slate-100">
                <div>
                    {/* Breadcrumbs */}
                    <div className="mb-4 sm:mb-6 flex items-center gap-2 text-sm">
                        <Link href="/" className="text-slate-400 hover:text-primary">
                            {t("common.home")}
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-900 font-bold">{t("common.products")}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-2xl">
                            <h1 className="text-2xl font-black uppercase tracking-tighter sm:text-3xl md:text-5xl text-black">
                                {t("shopPage.shopTitle")} <span className="text-primary">LIKEFOOD</span>
                            </h1>
                            <p className="text-muted-foreground mt-1.5 text-sm">
                                {t("shopPage.qualityProducts")}
                            </p>
                        </div>

                        {/* Search bar + total products — visible on mobile too */}
                        <div className="w-full md:w-[380px] relative" ref={searchContainerRef}>
                            <div className="hidden md:flex bg-slate-900 text-white px-4 py-2 rounded-2xl mb-2 items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                                    {t("shopPage.available")}
                                </span>
                                <span className="font-black text-xl flex items-center gap-2">
                                    {total}
                                    <span className="text-[10px] uppercase opacity-60 tracking-widest font-bold">
                                        {t("shopPage.productsCount")}
                                    </span>
                                </span>
                            </div>
                            <div className="relative">
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                                    <Search className="w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowSearchHints(true);
                                        }}
                                        onFocus={() => setShowSearchHints(true)}
                                        placeholder={t("shopPage.searchPlaceholder")}
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setShowSearchHints(false);
                                            }}
                                            className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                        {/* Search hints + recent searches dropdown */}
                                {showSearchHints && (searchHints.length > 0 || recentSearches.length > 0) && (
                                    <div className="absolute z-20 mt-2 w-full bg-white rounded-2xl border border-slate-100 shadow-xl max-h-80 overflow-y-auto">
                                        {recentSearches.length > 0 && (
                                            <div className="px-4 pt-3 pb-2 border-b border-slate-50">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                                    {t("shopPage.recentSearches")}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {recentSearches.map((term) => (
                                                        <button
                                                            key={term}
                                                            onClick={() => {
                                                                setSearchQuery(term);
                                                                setShowSearchHints(false);
                                                            }}
                                                            className="px-3 py-1.5 rounded-full bg-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                                        >
                                                            {term}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {searchHints.length > 0 && (
                                            <div className="py-2">
                                                {searchHints.map((hint) => (
                                                    <button
                                                        key={hint.id}
                                                        onClick={() => {
                                                            setSearchQuery(hint.name);
                                                            setShowSearchHints(false);

                                                            // Lưu vào recent searches
                                                            try {
                                                                const next = [
                                                                    hint.name,
                                                                    ...recentSearches.filter(
                                                                        (t) => t !== hint.name
                                                                    ),
                                                                ].slice(0, 8);
                                                                setRecentSearches(next);
                                                                if (typeof window !== "undefined") {
                                                                    window.localStorage.setItem(
                                                                        "lf_recent_searches",
                                                                        JSON.stringify(next)
                                                                    );
                                                                }
                                                            } catch {
                                                                // ignore
                                                            }
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                                                            <Search className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {hint.name}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400">
                                                                {hint.category}
                                                            </p>
                                                        </div>
                                                        <span className="text-[11px] font-black text-primary">
                                                            {hint.price != null ? formatPrice(hint.price) : ""}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="py-5">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Mobile: Filter toggle button */}
                    <div className="lg:hidden flex items-center justify-between mb-2">
                        <button
                            onClick={() => setShowMobileFilters(v => !v)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm shadow-sm"
                        >
                            <Filter className="w-4 h-4" />
                            {language === "vi" ? "Bộ lọc" : "Filters"}
                            {hasActiveFilters && (
                                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                                    {[selectedCategory !== t("shopPage.allCategories"), debouncedMinPrice || debouncedMaxPrice, minRating > 0, inStockOnly, freeShippingOnly, sort !== "newest"].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                        <span className="text-xs text-slate-500 font-medium">{total} {t("shopPage.productsLabel")}</span>
                    </div>

                    {/* Filters Sidebar — desktop always visible, mobile conditionally shown */}
                    <div className={`w-full lg:w-64 shrink-0 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
                        <FilterSidebar
                            categories={CATEGORIES}

                            selectedCategory={selectedCategory}
                            minPrice={minPrice}
                            maxPrice={maxPrice}

                            minRating={minRating}
                            inStockOnly={inStockOnly}
                            freeShippingOnly={freeShippingOnly}
                            hasActiveFilters={hasActiveFilters}
                            onCategoryChange={setSelectedCategory}
                            onMinPriceChange={setMinPrice}
                            onMaxPriceChange={setMaxPrice}

                            onRatingChange={setMinRating}
                            onInStockChange={setInStockOnly}
                            onFreeShippingChange={setFreeShippingOnly}
                            onClearFilters={handleClearFilters}
                            onPageReset={() => setPage(1)}
                            getCategoryGradient={getCategoryGradient}
                        />
                    </div>

                    {/* Product Grid Area */}
                    <div className="flex-1">
                        <SortBar
                            total={total}
                            selectedCategory={selectedCategory}
                            debouncedSearch={debouncedSearch}
                            sort={sort}
                            sortOptions={SORT_OPTIONS}
                            onSortChange={setSort}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={setItemsPerPage}
                            onPageReset={() => setPage(1)}
                        />

                        {hasActiveFilters && (
                            <ActiveFiltersBar
                                searchQuery={searchQuery}
                                selectedCategory={selectedCategory}
                                minPrice={minPrice}
                                maxPrice={maxPrice}

                                minRating={minRating}
                                inStockOnly={inStockOnly}
                                freeShippingOnly={freeShippingOnly}
                                sort={sort}

                                sortOptions={SORT_OPTIONS}
                                onSearchClear={() => { setSearchQuery(""); setPage(1); }}
                                onCategoryClear={() => { setSelectedCategory(t("shopPage.allCategories")); setPage(1); }}
                                onPriceClear={() => { setMinPrice(""); setMaxPrice(""); setPage(1); }}

                                onRatingClear={() => { setMinRating(0); setPage(1); }}
                                onInStockClear={() => { setInStockOnly(false); setPage(1); }}
                                onFreeShippingClear={() => { setFreeShippingOnly(false); setPage(1); }}
                                onSortClear={() => { setSort("newest"); setPage(1); }}
                                onClearAll={handleClearFilters}
                            />
                        )}

                        <ProductGrid
                            products={products}
                            isLoading={isLoading}
                            error={error}
                            viewMode={viewMode}
                            debouncedSearch={debouncedSearch}
                            hasActiveFilters={hasActiveFilters}
                            voucherFlags={voucherFlags}
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            onRetry={fetchProducts}
                            onClearFilters={handleClearFilters}
                            onSearchChange={setSearchQuery}
                            onCategoryReset={() => setSelectedCategory(t("shopPage.allCategories"))}
                            onPageReset={() => setPage(1)}
                        />
                    </div>
                </div>
            </div>
            </div>
        </div>

        {/* Scroll to Top Button */}
        <AnimatePresence>
            {showScrollTop && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="fixed bottom-20 lg:bottom-8 right-3 lg:right-8 z-40 w-11 h-11 lg:w-12 lg:h-12 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/25 flex items-center justify-center hover:bg-emerald-600 transition-colors"
                    aria-label={language === "vi" ? "Cuộn lên đầu trang" : "Scroll to top"}
                >
                    <ChevronUp className="w-5 h-5" />
                </motion.button>
            )}
        </AnimatePresence>
        </>
    );
}

export default function ProductCatalog() {
    const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Sản phẩm", item: `${SITE_URL}/products` },
        ],
    };

    return (
        <Suspense fallback={
            <div className="page-container-wide py-8">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </div>
        }>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <ProductCatalogContent />
        </Suspense>
    );
}
