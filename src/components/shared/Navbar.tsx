"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Link from "next/link";
import Image from "next/image";
import {
    ShoppingCart, User, Search, Menu, X, ChevronDown,
    Heart, Phone, Home, Flame,
    Settings, FileText, ShoppingBag, Info,
    HelpCircle, Gift, UserPlus } from "lucide-react";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useCartState } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import MiniCart from "@/components/cart/MiniCart";
import MegaMenu from "@/components/navbar/MegaMenu";
import UserDropdown from "@/components/navbar/UserDropdown";
import LanguageToggle from "@/components/navbar/LanguageToggle";
import SearchSuggestions from "@/components/navbar/SearchSuggestions";
import { useLanguage } from "@/lib/i18n/context";
import { useNavbarScroll } from "@/hooks/useNavbarScroll";
import { useNavbarConfig } from "@/hooks/useNavbarConfig";
import { useWishlistCount } from "@/hooks/useWishlistCount";
import { useSearchHints } from "@/hooks/useSearchHints";

// ── Mobile inline search — expands in-header on tap, no drawer required
// ─────────────────────────────────────────────────────────────────────────────
// Mobile inline search — expands in-header on tap, no drawer required
// ─────────────────────────────────────────────────────────────────────────────
function MobileSearchInput({
    value, onChange, onSubmit, onClose, onKeyDown
}: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();
    useEffect(() => { inputRef.current?.focus(); }, []);
    return (
        <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={onSubmit}
            className="flex-1 flex items-center gap-2"
        >
            <div className="flex-1 flex items-center gap-2 bg-white border-2 border-primary/30 rounded-2xl px-3 py-2 shadow-sm">
                <Search className="w-4 h-4 text-primary flex-shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={t("common.searchPlaceholder")}
                    className="flex-1 bg-transparent text-[13px] font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                />
                {value && (
                    <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="text-slate-300 hover:text-slate-500">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label={t("common.closeSearch")}
                className="p-2 text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
            >
                <X className="w-5 h-5" />
            </button>
        </motion.form>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Navbar content (must be inside Suspense for useSearchParams)
// ─────────────────────────────────────────────────────────────────────────────
function NavbarContent() {
    const { t, dict } = useLanguage();

    // ── Custom hooks (replaces 15+ inline states) ─────────────────────────
    const { isScrolled, isHidden } = useNavbarScroll();
    const { supportPhone, navLinks } = useNavbarConfig();
    const wishlistCount = useWishlistCount();

    // ── Local UI state only ───────────────────────────────────────────────
    const [isOpen, setIsOpen] = useState(false);
    const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // ── i18n dynamic data ───────────────────────────────────────────────
    const TRENDING_KEYWORDS: string[] = Array.isArray((dict as any)?.common?.trendingKeywords)
        ? (dict as any).common.trendingKeywords
        : [];

    // ── Search history ────────────────────────────────────────────────────
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem("searchHistory") || "[]");
            if (Array.isArray(stored)) setSearchHistory(stored);
        } catch {}
    }, []);

    const saveSearchHistory = useCallback((query: string) => {
        const q = query.trim();
        if (!q || q.length < 2) return;
        setSearchHistory(prev => {
            const next = [q, ...prev.filter(h => h !== q)].slice(0, 5);
            try { localStorage.setItem("searchHistory", JSON.stringify(next)); } catch {}
            return next;
        });
    }, []);

    const clearSearchHistory = useCallback(() => {
        setSearchHistory([]);
        try { localStorage.removeItem("searchHistory"); } catch {}
    }, []);

    // ── Search state ──────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileSearchActive, setMobileSearchActive] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const { suggestions, isLoading: isLoadingHints } = useSearchHints(searchQuery, showSuggestions || mobileSearchActive);

    const desktopSearchRef = useRef<HTMLInputElement>(null);
    const { totalItems, lastAddedId } = useCartState();
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isAdminUser = session?.user?.role === "ADMIN" || session?.user?.role === "ADMIN";

    const featuredCategories = [
        { name: t("navbar.driedFish"), icon: "🐟", color: "bg-blue-50", href: "/products?category=Cá khô" },
        { name: t("navbar.shrimpSquid"), icon: "🦐", color: "bg-rose-50", href: "/products?category=Tôm & Mực khô" },
        { name: t("navbar.fruits"), icon: "🥭", color: "bg-emerald-50", href: "/products?category=Trái cây sấy" },
        { name: t("navbar.spices"), icon: "🌶️", color: "bg-orange-50", href: "/products?category=Gia vị Việt" },
    ];

    const mobilePrimaryLinks = [
        { label: t("common.home"), href: "/", icon: <Home className="w-5 h-5" /> },
        { label: t("common.products"), href: "/products", icon: <ShoppingBag className="w-5 h-5" /> },
        { label: t("common.about"), href: "/about", icon: <Info className="w-5 h-5" /> },
        { label: t("common.flashSale"), href: "/flash-sale", icon: <Flame className="w-5 h-5" /> },
        { label: t("navbar.voucher"), href: "/vouchers", icon: <Gift className="w-5 h-5 text-primary" /> },
        { label: t("navbar.posts"), href: "/posts", icon: <FileText className="w-5 h-5 text-emerald-500" /> },
        { label: t("common.faq"), href: "/faq", icon: <HelpCircle className="w-5 h-5 text-sky-500" /> },
        { label: t("common.contact"), href: "/contact", icon: <Phone className="w-5 h-5 text-primary" /> },
    ];

    const mobileAccountLinks = [
        { label: t("navbar.orderHistory"), href: "/profile/orders", icon: <ShoppingCart className="w-5 h-5" /> },
        { label: t("navbar.wishlist"), href: "/profile/wishlist", icon: <Heart className="w-5 h-5 text-rose-500" /> },
        { label: t("navbar.referral"), href: "/profile/referrals", icon: <UserPlus className="w-5 h-5 text-emerald-500" /> },
        { label: t("navbar.myVouchers"), href: "/profile/vouchers", icon: <Gift className="w-5 h-5 text-primary" /> },
        { label: t("navbar.accountSettings"), href: "/profile", icon: <Settings className="w-5 h-5 text-slate-600" /> },
    ];

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        const query = searchParams.get("search");
        if (query) setSearchQuery(query);
    }, [searchParams]);

    useEffect(() => {
        setSelectedIndex(-1);
    }, [searchQuery, showSuggestions]);

    const handleSearch = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        saveSearchHistory(q);
        setShowSuggestions(false);
        setMobileSearchActive(false);
        router.push(`/products?search=${encodeURIComponent(q)}`);
    }, [searchQuery, router, saveSearchHistory]);

    const handleSuggestionClick = useCallback((slug: string | undefined, id: string) => {
        setShowSuggestions(false);
        setMobileSearchActive(false);
        // Reset search query after navigation to prevent stale state
        setTimeout(() => {
            setSearchQuery("");
        }, 100);
        router.push(`/products/${slug || id}`);
    }, [router]);

    const handleTrendingClick = useCallback((kw: string) => {
        saveSearchHistory(kw);
        setShowSuggestions(false);
        router.push(`/products?search=${encodeURIComponent(kw)}`);
        // Reset search query sau khi navigate
        setTimeout(() => {
            setSearchQuery("");
        }, 100);
    }, [router, saveSearchHistory]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;

        const navItemsCount = searchQuery.length < 1 
            ? TRENDING_KEYWORDS.length 
            : suggestions.length + 1; // +1 for "View All Results"

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1 >= navItemsCount ? 0 : prev + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev <= 0 ? navItemsCount - 1 : prev - 1));
        } else if (e.key === "Enter") {
            if (selectedIndex === -1) {
                handleSearch();
            } else {
                e.preventDefault();
                if (searchQuery.length < 1) {
                    handleTrendingClick(TRENDING_KEYWORDS[selectedIndex]);
                } else if (selectedIndex < suggestions.length) {
                    const item = suggestions[selectedIndex];
                    handleSuggestionClick(item.slug, String(item.id));
                } else {
                    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
                    setShowSuggestions(false);
                }
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
            desktopSearchRef.current?.blur();
        }
    };

    const renderMobileNavLink = (
        item: { label: string; href: string; icon: React.ReactNode; highlight?: boolean },
        idx: number,
        baseDelay: number
    ) => (
        <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: baseDelay + idx * 0.05 }}
        >
            <Link
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 p-3 rounded-2xl transition-all border ${item.highlight ? "bg-red-50/50 border-red-100/50" : "bg-slate-50 border-transparent hover:border-slate-100"}`}
            >
                <div className="w-9 h-9 rounded-2xl bg-white shadow-sm flex items-center justify-center transition-transform">
                    {item.icon}
                </div>
                <span className={`text-[13px] font-bold ${item.highlight ? "text-red-600" : "text-slate-700"}`}>{item.label}</span>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-300 ml-auto" />
            </Link>
        </motion.div>
    );


    return (
        <>
            <motion.nav
                className={`sticky top-0 z-[100] transition-all duration-200 ease-out will-change-transform ${isScrolled
                    ? "bg-white/95 backdrop-blur-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)]"
                    : "bg-white"
                    }`}
                initial={{ y: 0 }}
                animate={{ y: isHidden ? -120 : 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Skip to Content Link for Accessibility */}
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:p-4 focus:bg-white focus:text-slate-900 focus:font-bold focus:rounded-br-2xl focus:shadow-xl top-0 left-0 transition-transform">
                    {t("common.skipToContent")}
                </a>

                {/* ========== MAIN HEADER ========== */}
                <div className={`w-full px-4 sm:px-6 lg:px-[6%] border-b border-slate-100/50 transition-all duration-150 ease-out ${isScrolled ? "py-2" : "py-3"}`}>
                    <div className="flex items-center justify-between gap-4 lg:gap-8">
                        {/* Logo — hidden on mobile when search is active */}
                        <Link href="/" className={`flex-shrink-0 ${mobileSearchActive ? 'hidden md:block' : ''}`}>
                            <motion.img
                                src="/logo.png?v=2"
                                alt="LIKEFOOD - Đặc sản Việt Nam tại Mỹ"
                                className={`w-auto object-contain transition-all duration-300 ${isScrolled ? "h-6 xs:h-7 sm:h-8" : "h-7 xs:h-9 sm:h-10"}`}
                                whileHover={{ scale: 1.03 }}
                            />
                        </Link>

                        {/* Mobile — inline real search input or search trigger */}
                        <div className="flex-1 md:hidden ml-1">
                            <AnimatePresence mode="wait">
                                {mobileSearchActive ? (
                                    <div className="relative">
                                        <MobileSearchInput
                                            key="search-input"
                                            value={searchQuery}
                                            onChange={setSearchQuery}
                                            onSubmit={handleSearch}
                                            onKeyDown={handleKeyDown}
                                            onClose={() => { setMobileSearchActive(false); setSearchQuery(""); }}
                                        />
                                        
                                        {/* Mobile Suggestions Dropdown */}
                                        <AnimatePresence>
                                            {searchQuery.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-[110]"
                                                >
                                                    <SearchSuggestions
                                                        query={searchQuery}
                                                        suggestions={suggestions}
                                                        isLoading={isLoadingHints}
                                                        selectedIndex={selectedIndex}
                                                        trendingKeywords={TRENDING_KEYWORDS}
                                                        translations={t}
                                                        searchHistory={searchHistory}
                                                        onClearHistory={clearSearchHistory}
                                                        onSuggestionClick={handleSuggestionClick}
                                                        onTrendingClick={handleTrendingClick}
                                                        onViewAllClick={() => setShowSuggestions(false)}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <motion.button
                                        key="search-trigger"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setMobileSearchActive(true)}
                                        aria-label={t("common.search")}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-100/80 border border-slate-200/50 rounded-2xl text-slate-400 shadow-inner"
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Search className="w-4 h-4 text-primary" />
                                        <span className="text-[12px] font-bold truncate">{t("common.searchPlaceholder")}</span>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Category Button - Desktop */}
                        <div className="hidden lg:block">
                            <motion.button
                                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                                aria-expanded={isMegaMenuOpen}
                                aria-label={t("navbar.categoryBtn")}
                                className={`flex items-center gap-2.5 px-5 py-2.5 text-[12px] font-black uppercase tracking-wider rounded-2xl transition-all border ${isMegaMenuOpen
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-slate-50 text-slate-700 border-slate-200/50 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                                    }`}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Menu className="w-4 h-4" />
                                <span>{t("navbar.categoryBtn")}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                            </motion.button>
                        </div>

                        {/* ========== SEARCH BAR ========== */}
                        <div className="hidden md:flex flex-1 max-w-2xl relative">
                            <form onSubmit={handleSearch} className="relative w-full">
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 flex items-center gap-2 text-slate-400">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        ref={desktopSearchRef}
                                        type="text"
                                        placeholder={t("common.search")}
                                        value={searchQuery}
                                        onFocus={() => setShowSuggestions(true)}
                                        onKeyDown={handleKeyDown}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-full text-[13px] font-medium focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400"
                                    />
                                    <div className="absolute right-2 flex items-center gap-1">
                                        <motion.button
                                            type="submit"
                                            className="px-5 py-2 bg-primary text-white rounded-full font-black text-[11px] uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Search className="w-3.5 h-3.5" />
                                            <span className="hidden xl:inline">{t("common.search")}</span>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Click outside overlay - PHẢI RENDER TRƯỚC dropdown để dropdown nằm trên */}
                                {showSuggestions && (
                                    <div 
                                        className="fixed inset-0 z-[55]" 
                                        onMouseDown={() => setShowSuggestions(false)}
                                    />
                                )}

                                {/* ========== SEARCH DROPDOWN ========== */}
                                <AnimatePresence>
                                       {showSuggestions && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                            className="absolute top-full left-0 right-0 mt-3 bg-white/98 backdrop-blur-2xl border border-slate-100 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.15)] overflow-hidden z-[60]"
                                        >
                                            <SearchSuggestions
                                                query={searchQuery}
                                                suggestions={suggestions}
                                                isLoading={isLoadingHints}
                                                selectedIndex={selectedIndex}
                                                trendingKeywords={TRENDING_KEYWORDS}
                                                translations={t}
                                                searchHistory={searchHistory}
                                                onClearHistory={clearSearchHistory}
                                                onSuggestionClick={handleSuggestionClick}
                                                onTrendingClick={handleTrendingClick}
                                                onViewAllClick={() => setShowSuggestions(false)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </div>

                        {/* ========== ACTION ICONS (Refined for Mobile) ========== */}
                        <div className={`flex items-center gap-1.5 xs:gap-2 ${mobileSearchActive ? 'hidden md:flex' : ''}`}>
                            {/* Language toggle — always visible, persistent after scroll */}
                            <div className="hidden sm:block">
                                <LanguageToggle />
                            </div>

                            {/* Auth links — persistent (desktop only) */}
                            {!session && (
                                <div className="hidden lg:flex items-center gap-2">
                                    <Link href="/login" className="text-[11px] font-black text-slate-600 hover:text-primary transition-colors uppercase tracking-wider px-2 py-1">{t("common.login")}</Link>
                                    <Link href="/register" className="text-[11px] font-black px-3 py-1.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all uppercase tracking-wider">{t("navbar.register")}</Link>
                                </div>
                            )}

                            {/* Wishlist - with count badge */}
                            <Link href="/profile/wishlist" aria-label={t("navbar.wishlist")} className="hidden sm:flex">
                                <motion.div
                                    whileHover={{
                                        y: -4,
                                        backgroundColor: "rgba(244, 63, 94, 0.05)",
                                        borderColor: "rgba(244, 63, 94, 0.2)"
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 bg-slate-50/50 hover:bg-white border border-transparent rounded-2xl transition-all group relative"
                                >
                                    <Heart className="w-5 h-5 text-slate-600 group-hover:text-rose-500 transition-colors" />
                                    {isMounted && wishlistCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                                        >
                                            {wishlistCount > 99 ? "99+" : wishlistCount}
                                        </motion.span>
                                    )}
                                </motion.div>
                            </Link>

                            {/* Cart */}
                            <div className="relative">
                                <motion.button
                                    onClick={() => setIsMiniCartOpen(!isMiniCartOpen)}
                                    aria-label={isMounted && totalItems > 0 ? `${t("common.cart")} (${totalItems > 99 ? '99+' : totalItems} ${t("cart.items")})` : t("common.cart")}
                                    animate={lastAddedId ? {
                                        x: [0, -4, 4, -4, 4, 0],
                                        scale: [1, 1.1, 1],
                                    } : {}}
                                    transition={{ duration: 0.4 }}
                                    whileHover={{
                                        y: -4,
                                        backgroundColor: "rgba(16, 185, 129, 0.05)",
                                        borderColor: "rgba(16, 185, 129, 0.2)"
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 bg-slate-50/50 hover:bg-white border border-transparent rounded-2xl transition-all group relative"
                                >
                                    <ShoppingCart className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                                    {isMounted && totalItems > 0 && (
                                        <motion.span
                                            className="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-xl"
                                            initial={{ scale: 0, y: 10 }}
                                            animate={{ scale: 1, y: 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                            key={totalItems} // Trigger re-animation on count change
                                        >
                                            {totalItems > 99 ? "99+" : totalItems}
                                        </motion.span>
                                    )}
                                </motion.button>
                                <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />
                            </div>

                            {/* User Avatar - Desktop only, Mobile uses Drawer */}
                            {session && (
                                <div className="hidden lg:block relative">
                                    <motion.button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        aria-label={t("navbar.accountSettings")}
                                        aria-expanded={isUserMenuOpen}
                                        className="relative w-10 h-10 bg-slate-50 hover:bg-white rounded-2xl flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all"
                                        whileHover={{ y: -2 }}
                                    >
                                        {session.user.image ? (
                                            <Image
                                                src={session.user.image}
                                                alt="Avatar"
                                                fill
                                                className="object-cover rounded-2xl"
                                                sizes="40px"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                    </motion.button>
                                    <UserDropdown
                                        isOpen={isUserMenuOpen}
                                        onClose={() => setIsUserMenuOpen(false)}
                                        user={session.user}
                                    />
                                </div>
                            )}

                            {/* Mobile Menu Toggle (Glassmorphism style) */}
                            <motion.button
                                className={`lg:hidden p-2.5 rounded-2xl transition-all shadow-lg ${isOpen
                                    ? "bg-primary text-white shadow-primary/20"
                                    : "bg-white/80 backdrop-blur-md text-slate-800 border border-slate-200/50 shadow-slate-900/5"}`}
                                onClick={() => setIsOpen(!isOpen)}
                                aria-label={isOpen ? t("common.close") : t("common.categories")}
                                aria-expanded={isOpen}
                                aria-controls="mobile-drawer"
                                whileTap={{ scale: 0.9 }}
                            >
                                <AnimatePresence mode="wait">
                                    {isOpen ? <X key="x" className="w-5 h-5" /> : <Menu key="m" className="w-5 h-5" />}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* ========== QUICK NAV ROW ========== */}
                <AnimatePresence>
                    {!isScrolled && (
                        <motion.div
                            initial={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="border-b border-slate-100 overflow-hidden hidden lg:block bg-white"
                        >
                            <div className="w-full px-4 sm:px-6 lg:px-[6%]">
                                {navLinks ? (
                                    /* Admin override — use custom links from DB */
                                    <div className="flex items-center justify-center gap-0 py-1">
                                        {navLinks.map((item) => (
                                            <Link key={item.href} href={item.href} className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${item.highlight ? "text-red-500 hover:text-red-600" : pathname === item.href ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                                {item.icon && <span>{item.icon}</span>}
                                                <span className="relative">{item.label}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname === item.href ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    /* Default nav — premium underline style with active state */
                                    <div className="flex items-center justify-center gap-0 py-1">

                                        <Link href="/" className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${pathname === "/" ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                            <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                                            <span className="relative">{t("common.home")}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname === "/" ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                        </Link>

                                        <Link href="/products" className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${pathname.startsWith("/products") ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                            <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                                            <span className="relative">{t("common.products")}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname.startsWith("/products") ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                        </Link>

                                        <Link href="/about" className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${pathname.startsWith("/about") ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                            <Info className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                                            <span className="relative">{t("common.about")}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname.startsWith("/about") ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                        </Link>

                                        <div className="w-px h-4 bg-slate-200/80 mx-2 flex-shrink-0" />

                                        <Link href="/flash-sale" className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${pathname.startsWith("/flash-sale") ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                            <Flame className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                                            <span className="relative">{t("common.flashSale")}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname.startsWith("/flash-sale") ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                        </Link>

                                        <Link href="/vouchers" className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${pathname.startsWith("/vouchers") ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                            <Gift className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                                            <span className="relative">{t("navbar.voucher")}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname.startsWith("/vouchers") ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                        </Link>

                                        <div className="w-px h-4 bg-slate-200/80 mx-2 flex-shrink-0" />

                                        <Link href="/posts" className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${pathname.startsWith("/posts") ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                            <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                                            <span className="relative">{t("navbar.posts")}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname.startsWith("/posts") ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                        </Link>

                                        <Link href="/faq" className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${pathname.startsWith("/faq") ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                            <HelpCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                                            <span className="relative">{t("common.faq")}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname.startsWith("/faq") ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                        </Link>

                                        <Link href="/contact" className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors group ${pathname.startsWith("/contact") ? "text-primary" : "text-slate-500 hover:text-primary"}`}>
                                            <Phone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                                            <span className="relative">{t("common.contact")}<span className={`absolute -bottom-0.5 left-0 h-[2px] bg-current rounded-full transition-all duration-300 ${pathname.startsWith("/contact") ? "w-full" : "w-0 group-hover:w-full"}`} /></span>
                                        </Link>

                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* MegaMenu — positioned relative to full nav bottom */}
                <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />

            </motion.nav >

            {/* ========== MOBILE MENU DRAWER (Moved outside for fixed positioning) ========== */}
            <AnimatePresence>
                {
                    isOpen && (
                        <>
                            {/* Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] lg:hidden"
                            />

                            {/* Drawer Content */}
                            <motion.div
                                id="mobile-drawer"
                                className="lg:hidden fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white z-[160] overflow-y-auto shadow-2xl"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                            >
                                {/* Mobile Menu Header */}
                                <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-5 py-4 flex items-center justify-between border-b border-slate-100 z-10">
                                    <Link href="/" onClick={() => setIsOpen(false)}>
                                        <motion.img
                                            src="/logo.png?v=2"
                                            alt="LIKEFOOD - Đặc sản Việt Nam tại Mỹ"
                                            className="h-7 xs:h-8 sm:h-9 w-auto"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        />
                                    </Link>
                                    <motion.button
                                        onClick={() => setIsOpen(false)}
                                        aria-label={t("common.close")}
                                        className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors"
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X className="w-5 h-5 text-slate-800" />
                                    </motion.button>
                                </div>

                                <div className="p-4 space-y-6 pb-28">
                                    {/* Mobile Search - Prominent in Drawer */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <form onSubmit={handleSearch} className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-primary">
                                                <Search className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder={t("common.searchProducts")}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold outline-none focus:border-primary/30 focus:bg-white transition-all shadow-sm"
                                            />
                                        </form>
                                    </motion.div>

                                    {/* Popular Categories Grid - Refined */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t("navbar.featuredCategories")}</h3>
                                            <Link href="/products" className="text-[10px] font-bold text-primary" onClick={() => setIsOpen(false)}>{t("common.viewAll")}</Link>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {featuredCategories.map((cat, idx) => (
                                                <motion.div
                                                    key={cat.name}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.2 + idx * 0.05 }}
                                                >
                                                    <Link
                                                        href={cat.href}
                                                        onClick={() => setIsOpen(false)}
                                                        className="flex flex-col items-center gap-2 group"
                                                    >
                                                        <div className={`w-full aspect-square flex items-center justify-center rounded-2xl ${cat.color} border border-transparent group-hover:border-primary/20 transition-all shadow-sm`}>
                                                            <span className="text-xl">{cat.icon}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-600 line-clamp-1">{cat.name}</span>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Primary navigation synced with desktop */}
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">{t("navbar.discover")}</h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {mobilePrimaryLinks.map((item, idx) => renderMobileNavLink(item, idx, 0.3))}
                                        </div>
                                    </div>

                                    {/* Account shortcuts */}
                                    {session && (
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">{t("navbar.member")}</h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {mobileAccountLinks.map((item, idx) => renderMobileNavLink(item, idx, 0.45))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin portal for admin accounts */}
                                    {session && isAdminUser && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.58 }}
                                        >
                                            <Link
                                                href="/admin/dashboard"
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm"
                                            >
                                                <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white shadow-sm flex items-center justify-center">
                                                    <Settings className="w-4.5 h-4.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] font-black uppercase tracking-wider text-emerald-700">{t("navbar.adminPortal")}</p>
                                                    <p className="text-[11px] font-semibold text-emerald-600/90">Dashboard</p>
                                                </div>
                                                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-emerald-500" />
                                            </Link>
                                        </motion.div>
                                    )}

                                    {/* Language toggle for mobile */}
                                    <div className="flex items-center justify-between py-3 px-1 border-t border-slate-100">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t("navbar.language") || "Ngôn ngữ / Language"}</span>
                                        <LanguageToggle />
                                    </div>

                                    {/* Auth Actions for Mobile */}
                                    {!session && (
                                        <motion.div
                                            className="pt-6 border-t border-slate-100 space-y-3"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                                <Button className="w-full h-11 rounded-2xl bg-gradient-to-r from-primary to-emerald-600 text-white font-black text-[12px] uppercase tracking-wider shadow-lg shadow-primary/20">
                                                    {t("navbar.loginNow")}
                                                </Button>
                                            </Link>
                                            <Link href="/register" onClick={() => setIsOpen(false)}>
                                                <Button variant="outline" className="w-full h-11 rounded-2xl border border-slate-200 text-slate-600 font-bold text-[12px] uppercase tracking-wider hover:bg-slate-50 transition-all">
                                                    {t("navbar.createAccount")}
                                                </Button>
                                            </Link>
                                        </motion.div>
                                    )}

                                    {/* Session Info if Logged In */}
                                    {session && (
                                        <motion.div
                                            className="p-4 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-4"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm overflow-hidden p-0.5 relative">
                                                <Image
                                                    src={session.user.image || "/images/default-avatar.png"}
                                                    className="object-cover rounded-[14px]"
                                                    alt="User"
                                                    fill
                                                    sizes="48px"
                                                    unoptimized
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t("navbar.member")}</p>
                                                <p className="text-[14px] font-bold text-slate-800 truncate max-w-[150px]">{session.user.name}</p>
                                            </div>
                                            <Link href="/profile" className="ml-auto" onClick={() => setIsOpen(false)}>
                                                <Button size="sm" variant="ghost" className="p-2 text-primary hover:bg-primary/10 rounded-2xl">
                                                    <Settings className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >
        </>
    );
}

export default function Navbar() {
    return (
        <Suspense fallback={
            <nav className="sticky top-0 z-[100] bg-white border-b border-slate-100 shadow-sm">
                <div className="w-full px-4 sm:px-6 lg:px-[8%]">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-8 bg-slate-200/50 animate-pulse rounded-lg" />
                            <div className="hidden md:block w-96 h-10 bg-slate-100 animate-pulse rounded-full" />
                        </div>
                        <div className="flex items-center gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 bg-slate-100 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </nav>
        }>
            <NavbarContent />
        </Suspense>
    );
}
