"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import ProductCard from "@/components/product/ProductCard";
import { RelatedProduct } from "@/types/product";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";
import { CartItemList, CartSummary, CouponSection, SavedItemsList } from "@/components/cart";
import { CartItem } from "@/components/cart/CartItemList";
import { SavedItem } from "@/components/cart/SavedItemsList";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function CartPage() {
    const { items, removeItem, updateQuantity, addItem } = useCart();
    const { t, isVietnamese } = useLanguage();
    const [couponCode, setCouponCode] = useState("");
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCouponCode, setAppliedCouponCode] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(items.map(i => String(i.id))));

    // Keep selectedIds in sync when items change (e.g. item removed externally)
    useEffect(() => {
        setSelectedIds(prev => new Set([...prev].filter(id => items.some(i => String(i.id) === id))));
    }, [items]);

    const [savedForLater, setSavedForLater] = useState<typeof items>([]);
    const [showSavedTab, setShowSavedTab] = useState(false);

    // Load savedForLater from localStorage after hydration (avoids SSR mismatch)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('savedForLater');
            if (saved) setSavedForLater(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Persist savedForLater to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('savedForLater', JSON.stringify(savedForLater));
    }, [savedForLater]);

    // Selected items calculation
    const allSelected = items.length > 0 && selectedIds.size === items.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

    const selectedTotal = useMemo(() => {
        return items
            .filter(item => selectedIds.has(String(item.id)))
            .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [items, selectedIds]);

    const selectedCount = useMemo(() => {
        return items.filter(item => selectedIds.has(String(item.id))).reduce((sum, item) => sum + item.quantity, 0);
    }, [items, selectedIds]);

    // Memoize to prevent RelatedProductsSection from refetching on every render
    const relatedCategories = useMemo(() =>
        [...new Set(items.map(i => i.category || 'all'))],
        [items]
    );

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            const strId = String(id);
            if (next.has(strId)) next.delete(strId);
            else next.add(strId);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(i => String(i.id))));
        }
    };

    const removeSelected = (ids: Set<string>) => {
        ids.forEach(id => removeItem(String(id)));
        setSelectedIds(new Set());
        toast.success(t('cart.removedItems').replace('{count}', String(ids.size)));
    };

    const saveForLater = (item: CartItem) => {
        setSavedForLater(prev => {
            if (prev.some(i => i.id === item.id)) return prev;
            return [...prev, { ...item, productId: item.productId }];
        });
        removeItem(String(item.id));
        toast.success(t('cart.savedForLater').replace('{name}', item.name));
    };

    const moveToCart = (item: SavedItem) => {
        if (!item.productId) return;
        addItem(item);
        setSavedForLater(prev => prev.filter(i => i.id !== item.id));
        toast.success(t('cart.addedToCart').replace('{name}', item.name));
    };

    const removeSaved = (id: string) => {
        setSavedForLater(prev => prev.filter(i => String(i.id) !== String(id)));
        toast.success(t('cart.removedFromSaved'));
    };

    // Check for out-of-stock items among selected items only
    const hasOutOfStockItems = items.filter(item => selectedIds.has(String(item.id))).some(item => (item.inventory ?? 0) <= 0);
    const canCheckout = selectedIds.size > 0 && !hasOutOfStockItems;

    if (items.length === 0) {
        const quickLinks = [
            { label: t('navbar.driedFish'), href: "/products?category=C%C3%A1+kh%C3%B4" },
            { label: t('navbar.shrimpSquid'), href: "/products?category=H%E1%BA%A3i+s%E1%BA%A3n" },
            { label: t('navbar.spices'), href: "/products?category=Gia+v%E1%BB%8B" },
            { label: t('shopPage.tagGift'), href: "/products?tag=gift" },
        ];
        return (
            <div className="page-container-wide py-8">
                <EmptyState
                    icon={ShoppingBag}
                    title={t("cart.emptyCart")}
                    description={t("cart.emptyCartDesc")}
                    action={
                        <div className="flex flex-col items-center gap-8">
                            <Link href="/products" prefetch={true}>
                                <Button size="lg" className="rounded-full px-10 py-7 font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                    {t("cart.shopNow")}
                                </Button>
                            </Link>

                            <div className="mt-2 flex flex-wrap justify-center gap-3">
                                {quickLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        prefetch={true}
                                        className="px-5 py-2.5 rounded-full border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors bg-white shadow-sm"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    }
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24 lg:pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-primary/90 via-primary to-teal-500">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

                <div className="relative page-container-wide py-4 lg:py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 mb-3 sm:mb-6">
                        <Link href="/" className="hover:text-white transition-colors">{isVietnamese ? "Trang chủ" : "Home"}</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{t("common.cart")}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter text-white">
                                    {t("cart.yourCart")} <span className="text-white/60">({items.length})</span>
                                </h1>
                                <Link href="/products" prefetch={true} className="inline-flex items-center text-xs font-bold text-white/50 hover:text-white transition-colors group">
                                    <ArrowLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform" /> {t("shop.continueShopping")}
                                </Link>
                            </div>
                        </div>

                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setShowSavedTab(false)}
                                className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${!showSavedTab
                                    ? "bg-white text-primary shadow-lg"
                                    : "bg-white/15 text-white/80 hover:bg-white/25"
                                    }`}
                            >
                                {t("common.cart")} ({items.length})
                            </button>
                            <button
                                onClick={() => setShowSavedTab(true)}
                                className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${showSavedTab
                                    ? "bg-white text-primary shadow-lg"
                                    : "bg-white/15 text-white/80 hover:bg-white/25"
                                    }`}
                            >
                                <Bookmark className="w-3.5 h-3.5 inline mr-1" />
                                {t('cart.savedItems')} ({savedForLater.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-container-wide mt-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-8">
                    {showSavedTab ? (
                        <SavedItemsList
                            items={savedForLater}
                            onMoveToCart={moveToCart}
                            onRemove={removeSaved}
                        />
                    ) : (
                        <CartItemList
                            items={items}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                            onToggleAll={toggleAll}
                            allSelected={allSelected}
                            someSelected={someSelected}
                            onRemoveItem={removeItem}
                            onUpdateQuantity={updateQuantity}
                            onRemoveSelected={removeSelected}
                            onSaveForLater={saveForLater}
                        />
                    )}
                </div>

                <div className="lg:col-span-4 mt-6 lg:mt-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
                    <CouponSection
                        couponCode={couponCode}
                        setCouponCode={setCouponCode}
                        couponApplied={couponApplied}
                        setCouponApplied={setCouponApplied}
                        couponDiscount={couponDiscount}
                        setCouponDiscount={setCouponDiscount}
                        appliedCouponCode={appliedCouponCode}
                        setAppliedCouponCode={setAppliedCouponCode}
                        selectedTotal={selectedTotal}
                    />
                    <CartSummary
                        selectedTotal={selectedTotal}
                        couponDiscount={couponDiscount}
                        selectedCount={selectedCount}
                        canCheckout={canCheckout}
                        hasOutOfStockItems={hasOutOfStockItems}
                    />
                </div>
            </div>
            </div>

            {/* Related Products Suggestions */}
            {items.length > 0 && (
                <div className="page-container-wide mt-10">
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-5">{t('cart.youMayAlsoLike')}</h2>
                    <RelatedProductsSection categories={relatedCategories} />
                </div>
            )}
        </div>
    );
}

function RelatedProductsSection({ categories }: { categories: string[] }) {
    const [products, setProducts] = useState<RelatedProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                const params = new URLSearchParams();
                if (categories.length > 0 && categories[0] !== 'all') {
                    params.set('category', categories[0]);
                }
                params.set('limit', '4');
                const res = await fetch(`/api/products?${params}`);
                const data = await res.json();
                setProducts(data.products?.slice(0, 4) || []);
            } catch {
                logger.warn('Failed to load related products', { context: 'cart-page' });
            } finally {
                setLoading(false);
            }
        };
        fetchRelated();
    }, [categories]);

    if (loading) return <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"><div className="h-48 sm:h-64 bg-slate-100 rounded-2xl animate-pulse" /><div className="h-48 sm:h-64 bg-slate-100 rounded-2xl animate-pulse" /></div>;

    if (products.length === 0) return null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
