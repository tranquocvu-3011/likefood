"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Product Detail Page — Compact Premium Layout
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { analytics } from "@/lib/analytics/sdk";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
    Star, Heart, Share2, ShoppingCart, Truck, 
    Loader2, Flame, Zap, ChevronRight, Package, ShoppingBag,
    ChevronDown, Shield, RefreshCw, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import ProductCard from "@/components/product/ProductCard";
import ImageGallery from "@/components/product/ImageGallery";
import VariantSelector from "@/components/product/VariantSelector";
import Link from "next/link";
import { toast } from "sonner";
import { RelatedProduct } from "@/types/product";
import { logger } from "@/lib/logger";

import ProductStructuredData from "@/components/seo/ProductStructuredData";
import { useLanguage } from "@/lib/i18n/context";
import { formatPrice, formatVndEquivalent } from "@/lib/currency";
import LoadingState from "@/components/ui/loading-state";
import ErrorState from "@/components/ui/error-state";
import QuantitySelector from "@/components/ui/quantity-selector";
import { Badge } from "@/components/ui/badge";
import PriceDisplay from "@/components/ui/price-display";
import { WriteReviewButton } from "@/components/review/WriteReviewButton";

const ReviewSummaryAI = dynamic(() => import("@/components/product/ReviewSummaryAI"), {
    loading: () => <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />,
    ssr: false,
});
const FrequentlyBoughtTogether = dynamic(() => import("@/components/product/FrequentlyBoughtTogether"), {
    loading: () => <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />,
    ssr: false,
});

import { FREE_SHIPPING_THRESHOLD_USD } from "@/lib/commerce";

import StickyBuyBar from "@/components/product/StickyBuyBar";
import { motion } from "framer-motion";

interface ProductVariant {
    id: number;
    weight?: string | null;
    flavor?: string | null;
    priceAdjustment: number;
    stock: number;
    isActive: boolean;
}

interface ProductImage {
    id: number;
    imageUrl: string;
    altText?: string | null;
    order: number;
    isPrimary: boolean;
}

interface Product {
    id: number;
    slug?: string | null;
    name: string;
    description: string;
    price: number;
    image?: string | null;
    category: string;
    weight?: string | null;
    inventory: number;
    avgRating: number;
    reviewCount: number;
    ratingAvg?: number | null;
    ratingCount?: number;
    reviews?: Review[];
    variants?: ProductVariant[];
    images?: ProductImage[];
    soldCount?: number;
    isFlashSale?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    salePrice?: number | null;
    originalPrice?: number | null;
}

interface Review {
    id: number;
    rating: number;
    comment?: string | null;
    createdAt: string;
    user: {
        id?: number;
        name: string | null;
        image?: string | null;
    };
}

export interface ProductDetailClientProps {
    initialProduct?: Product | null;
    initialRelated?: RelatedProduct[];
}



export default function ProductDetailClient({ initialProduct, initialRelated }: ProductDetailClientProps) {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const { addItem } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
    const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>(initialRelated ?? []);
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(!initialProduct);
    const [error, setError] = useState<string | null>(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    const [descExpanded, setDescExpanded] = useState(false);
    const { t, language } = useLanguage();

    // Auto-format description
    const descriptionSections = useMemo(() => {
        if (!product?.description) return [];
        const text = product.description;
        const sectionRegex = /(?:^|\s)([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}✅☑️🔥⭐️🎁💪🍃🌿🧂🌶️📦🎯🏷️💰🔒🚚👨‍🍳🧑‍🍳👩‍🍳🍴🥢🥄🍽️])\s*([A-ZÀ-Ỹ\s&]+):\s*/gu;
        const parts: { title: string; content: string; emoji: string }[] = [];
        const matches: { index: number; emoji: string; title: string; length: number }[] = [];
        let match;

        while ((match = sectionRegex.exec(text)) !== null) {
            matches.push({
                index: match.index,
                emoji: match[1],
                title: match[2].trim(),
                length: match[0].length,
            });
        }

        if (matches.length === 0) {
            return [{ title: "", content: text, emoji: "" }];
        }

        const preamble = text.slice(0, matches[0].index).trim();
        if (preamble) {
            parts.push({ title: "", content: preamble, emoji: "" });
        }

        for (let i = 0; i < matches.length; i++) {
            const start = matches[i].index + matches[i].length;
            const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
            const content = text.slice(start, end).trim();
            parts.push({ title: matches[i].title, content, emoji: matches[i].emoji });
        }

        return parts;
    }, [product?.description]);

    // ──── Analytics: track product view + time spent ────
    const viewStartRef = useRef<number>(0);

    useEffect(() => {
        if (!product) return;
        viewStartRef.current = Date.now();
        analytics.trackProductView(
            product.id,
            product.name,
            product.category,
            product.salePrice != null && product.salePrice < product.price
                ? product.salePrice
                : product.price,
            window.location.href
        );
        return () => {
            // Track time spent on product page when leaving
            if (viewStartRef.current > 0) {
                const durationMs = Date.now() - viewStartRef.current;
                const durationSec = Math.round(durationMs / 1000);
                if (durationSec >= 2) {
                    analytics.track("page_view", {
                        productId: product.id,
                        productName: product.name,
                        category: product.category,
                        durationSeconds: durationSec,
                        type: "product_detail_duration",
                    });
                }
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id]);

    useEffect(() => {
        if (initialProduct) {
            if (typeof window !== 'undefined' && initialProduct) {
                const viewed = localStorage.getItem("recentlyViewed");
                const viewedIds = viewed ? JSON.parse(viewed) : [];
                const newViewed = [
                    initialProduct.id,
                    ...viewedIds.filter((id: string) => String(id) !== String(initialProduct.id))
                ].slice(0, 10);
                localStorage.setItem("recentlyViewed", JSON.stringify(newViewed));
            }
            return;
        }

        const fetchProduct = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/products/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                    if (typeof window !== 'undefined') {
                        const viewed = localStorage.getItem("recentlyViewed");
                        const viewedIds = viewed ? JSON.parse(viewed) : [];
                        const newViewed = [data.id, ...viewedIds.filter((id: string) => id !== data.id)].slice(0, 10);
                        localStorage.setItem("recentlyViewed", JSON.stringify(newViewed));
                    }
                } else if (res.status === 404) {
                    setError("not_found");
                    setTimeout(() => router.push("/products"), 2000);
                } else {
                    setError("load_error");
                }
            } catch (error) {
                logger.error("Failed to fetch product", error as Error, { context: "product-detail", slug });
                setError("network_error");
            } finally {
                setIsLoading(false);
            }
        };

        const fetchRelated = async () => {
            try {
                const res = await fetch(`/api/products/${slug}/related`);
                if (res.ok) {
                    const data = await res.json();
                    setRelatedProducts(data);
                }
            } catch (error) {
                logger.warn("Failed to fetch related products", { context: 'product-detail-page', error: error as Error });
            }
        };

        if (slug) {
            fetchProduct();
            fetchRelated();
        }
    }, [slug, router, initialProduct]);

    const getCurrentPrice = () => {
        if (!product) return 0;
        const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
        const basePrice = (hasSalePrice ? product.salePrice : product.price) ?? product.price;
        const variantAdjustment = selectedVariant?.priceAdjustment || 0;
        return basePrice + variantAdjustment;
    };

    const getCurrentInventory = () => {
        if (selectedVariant) return selectedVariant.stock;
        return product?.inventory || 0;
    };

    const getOriginalPrice = () => {
        if (!product) return 0;
        const current = getCurrentPrice();
        if (product.originalPrice != null && product.originalPrice > current) return product.originalPrice;
        const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
        return hasSalePrice ? product.price : current;
    };

    const hasDiscount = () => getOriginalPrice() > getCurrentPrice();
    const getDiscountPercent = () => {
        if (!hasDiscount()) return 0;
        return Math.round(((getOriginalPrice() - getCurrentPrice()) / getOriginalPrice()) * 100);
    };

    const buildCartItem = () => {
        if (!product) return null;
        const currentPrice = getCurrentPrice();
        const currentInventory = getCurrentInventory();
        if (currentInventory === 0) { toast.error(t("shop.productOutOfStock")); return null; }
        const onSale = hasDiscount();
        return {
            productId: Number(product.id),
            slug: product.slug || undefined,
            name: product.name + (selectedVariant ? ` - ${selectedVariant.weight || selectedVariant.flavor || ''}` : ''),
            price: currentPrice,
            originalPrice: onSale ? getOriginalPrice() : undefined,
            salePrice: onSale ? currentPrice : undefined,
            isOnSale: onSale,
            image: product.image || undefined,
            quantity,
            inventory: currentInventory,
            category: product.category ?? undefined,
        };
    };

    const handleAddToCart = () => {
        const item = buildCartItem();
        if (!item) return;
        setIsAddingToCart(true);
        addItem(item);
        setTimeout(() => setIsAddingToCart(false), 500);
    };

    const handleBuyNow = () => {
        const item = buildCartItem();
        if (!item) return;
        addItem(item);
        router.push("/checkout");
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: product?.name, text: product?.description, url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success(t("shop.linkCopied"));
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                toast.error(t("shop.shareError"));
            }
        }
    };

    const soldPercentage = (product && product.soldCount && product.inventory > 0)
        ? Math.min((product.soldCount / (product.soldCount + product.inventory)) * 100, 100)
        : 0;

    if (isLoading) return <LoadingState fullPage text={t("shop.loadingProduct")} />;

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 px-6">
                <ErrorState
                    title="Oops!"
                    message={
                        error === "not_found" ? t("shop.productNotFound") :
                        error === "load_error" ? t("shop.errorLoadingProduct") :
                        error === "network_error" ? t("shop.errorTryAgain") :
                        error || t("shop.productNotFound")
                    }
                    onRetry={() => window.location.reload()}
                    retryLabel={t("common.back")}
                    className="max-w-md bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/10">
            <div className="pt-4 pb-10">
                <div className="page-container-wide">
                    {/* SEO */}
                    <ProductStructuredData
                        product={{
                            slug: product.slug,
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            salePrice: product.salePrice,
                            images: product.image ? [product.image] : [],
                            stock: product.inventory,
                            category: product.category ? { name: product.category, slug: product.category.toLowerCase().replace(/\s+/g, '-') } : null,
                            avgRating: product.ratingAvg ?? product.avgRating ?? null,
                            reviewCount: product.ratingCount ?? product.reviewCount ?? 0,
                        }}
                    />

                    {/* Breadcrumbs — compact */}
                    <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
                        <Link href="/" prefetch={true} className="hover:text-emerald-600 transition-colors">{t("common.home")}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/products" prefetch={true} className="hover:text-emerald-600 transition-colors">{t("common.products")}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-emerald-600 transition-colors">{product.category}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-600 font-medium truncate max-w-[160px]">{product.name}</span>
                    </nav>

                    {/* ══════════ MAIN: Image + Info ══════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        
                        {/* ─── Image Gallery — 5 cols ─── */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="lg:col-span-5"
                        >
                            <div className="sticky top-24">
                                <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg shadow-slate-200/40">
                                    {(product.images && product.images.filter(img => img.imageUrl).length > 0) || product.image ? (
                                        <ImageGallery
                                            images={(() => {
                                                const gallery = [...(product.images || [])].filter(img => img.imageUrl && img.imageUrl.trim() !== '');
                                                if (product.image) {
                                                    const mainImageInGallery = gallery.find(img => img.imageUrl === product.image);
                                                    if (!mainImageInGallery) {
                                                        gallery.unshift({ id: -1, imageUrl: product.image, altText: product.name, order: -1, isPrimary: true });
                                                    } else {
                                                        gallery.sort((a) => (a.imageUrl === product.image ? -1 : 1));
                                                    }
                                                }
                                                return gallery;
                                            })()}
                                            productName={product.name}
                                        />
                                    ) : (
                                        <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                            <ShoppingBag className="w-24 h-24 text-slate-200" />
                                        </div>
                                    )}

                                    {/* Badges — top left/right */}
                                    {hasDiscount() && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <Badge variant="sale" className="px-3 py-1.5 rounded-xl text-xs">
                                                <Flame className="w-3.5 h-3.5 text-white fill-white mr-1" />
                                                -{getDiscountPercent()}%
                                            </Badge>
                                        </div>
                                    )}
                                    {product.isFlashSale && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <Badge variant="flash" className="px-3 py-1.5 rounded-xl text-xs">
                                                <Zap className="w-3.5 h-3.5 text-white fill-white mr-1" />
                                                Flash
                                            </Badge>
                                        </div>
                                    )}
                                    {getCurrentInventory() === 0 && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20">
                                            <span className="text-lg font-black text-white uppercase tracking-widest bg-black/30 px-6 py-2 rounded-xl">{t("shop.outOfStock")}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* ─── Product Info — 7 cols ─── */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="lg:col-span-7 space-y-4"
                        >
                            {/* Category + Tags — single line */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                    href={`/products?category=${encodeURIComponent(product.category)}`}
                                    className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors"
                                >
                                    {product.category}
                                </Link>
                                {product.isNew && (
                                    <Badge variant="new" className="text-[10px] py-0.5 px-2">
                                        <Zap className="w-2.5 h-2.5 mr-0.5" />
                                        {t("common.new")}
                                    </Badge>
                                )}
                                {product.weight && (
                                    <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                                        <Package className="w-3 h-3 inline mr-1 text-slate-400" />
                                        {product.weight}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight">{product.name}</h1>

                            {/* Rating + Sold — single compact line */}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < Math.round(product.avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                        />
                                    ))}
                                    <span className="ml-1 font-bold text-slate-700">{product.avgRating.toFixed(1)}</span>
                                    <span className="text-slate-400 text-xs">({product.reviewCount})</span>
                                </div>
                                {product.soldCount != null && product.soldCount > 0 && (
                                    <span className="text-xs text-slate-400">
                                        <ShoppingBag className="w-3 h-3 inline mr-0.5" />
                                        {t("shop.sold")} {product.soldCount.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* Variant Selector */}
                            {product.variants && product.variants.length > 0 && (
                                <VariantSelector
                                    variants={product.variants}
                                    basePrice={product.price}
                                    selectedVariant={selectedVariant}
                                    onVariantChange={(variant) => { setSelectedVariant(variant); setQuantity(1); }}
                                />
                            )}

                            {/* ═══ Purchase Card ═══ */}
                            <div className="bg-white rounded-xl border border-slate-100 shadow-md overflow-hidden">
                                {/* Price row */}
                                <div className="px-4 py-3 bg-gradient-to-r from-slate-50/80 to-white">
                                    <div className="flex items-end gap-3">
                                        <PriceDisplay
                                            currentPrice={getCurrentPrice()}
                                            originalPrice={hasDiscount() ? getOriginalPrice() : undefined}
                                            salePrice={hasDiscount() ? getCurrentPrice() : undefined}
                                            isOnSale={hasDiscount()}
                                            size="xl"
                                            showDiscountBadge={false}
                                        />
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{formatVndEquivalent(getCurrentPrice())}</p>
                                    {selectedVariant && selectedVariant.priceAdjustment !== 0 && (
                                        <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                                            + {formatPrice(selectedVariant.priceAdjustment)} ({selectedVariant.weight || selectedVariant.flavor})
                                        </p>
                                    )}
                                    {/* Sold progress — only in sale mode */}
                                    {hasDiscount() && product.soldCount != null && product.soldCount > 0 && (
                                        <div className="mt-2">
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${soldPercentage}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{t("shop.sold")} {product.soldCount.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Free ship bar */}
                                <div className={`mx-4 px-3 py-2 flex items-center gap-2 rounded-lg text-xs ${getCurrentPrice() >= FREE_SHIPPING_THRESHOLD_USD ? 'bg-green-50 border border-green-100' : 'bg-blue-50 border border-blue-100'}`}>
                                    <Truck className={`w-3.5 h-3.5 shrink-0 ${getCurrentPrice() >= FREE_SHIPPING_THRESHOLD_USD ? 'text-green-500' : 'text-blue-500'}`} />
                                    {getCurrentPrice() >= FREE_SHIPPING_THRESHOLD_USD ? (
                                        <span className="font-bold text-green-700">{t("cart.freeShipping")} ✓</span>
                                    ) : (
                                        <div className="flex-1">
                                            <span className="font-medium text-blue-600">
                                                {t("cart.addMoreForFreeShip").replace("{amount}", formatPrice(FREE_SHIPPING_THRESHOLD_USD - getCurrentPrice()))}
                                            </span>
                                            <div className="h-1 bg-blue-100 rounded-full overflow-hidden mt-1">
                                                <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${Math.min((getCurrentPrice() / FREE_SHIPPING_THRESHOLD_USD) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quantity + Stock + Buttons */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("common.quantity")}:</span>
                                            <QuantitySelector value={quantity} min={1} max={getCurrentInventory()} onChange={setQuantity} size="lg" />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold ${getCurrentInventory() > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${getCurrentInventory() > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                            {getCurrentInventory() > 0 ? t("shop.inStock") : t("shop.outOfStock")}
                                        </div>
                                    </div>

                                    <div className="flex gap-2.5">
                                        <Button
                                            onClick={handleAddToCart}
                                            disabled={getCurrentInventory() === 0 || isAddingToCart}
                                            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
                                        >
                                            {isAddingToCart ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <><ShoppingCart className="w-4 h-4 mr-1.5" />{t("shop.addToCart")}</>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={handleBuyNow}
                                            disabled={getCurrentInventory() === 0}
                                            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-bold text-sm shadow-lg shadow-slate-500/20"
                                        >
                                            {t("shop.buyNow")}
                                        </Button>
                                    </div>

                                    {/* Secondary actions */}
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleWishlist(product.id)}
                                                className={`flex items-center gap-1 text-xs font-semibold transition-all ${isInWishlist(product.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                                                {isInWishlist(product.id) ? t("shop.wishlistLiked") : t("shop.wishlistLike")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleShare}
                                                className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-emerald-500 transition-all"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                                {t("shop.share")}
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Trust Badges — single row, ultra compact */}
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { icon: Truck, label: t("shop.fastDelivery"), color: "text-orange-500", bg: "bg-orange-50" },
                                    { icon: Shield, label: t("shop.qualityGuarantee"), color: "text-emerald-500", bg: "bg-emerald-50" },
                                    { icon: RefreshCw, label: t("shop.easyReturn"), color: "text-blue-500", bg: "bg-blue-50" },
                                    { icon: CreditCard, label: t("shop.securePayment"), color: "text-violet-500", bg: "bg-violet-50" },
                                ].map((badge) => (
                                    <div key={badge.label} className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl ${badge.bg} border border-slate-100/50`}>
                                        <badge.icon className={`w-4 h-4 ${badge.color}`} />
                                        <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">{badge.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ══════════ MÔ TẢ SẢN PHẨM ══════════ */}
                    <div className="mt-8">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className={`relative ${!descExpanded && descriptionSections.length > 2 ? 'max-h-[280px] overflow-hidden' : ''}`}>
                                <div className="p-5 space-y-4">
                                    {descriptionSections.map((section, idx) => (
                                        <div key={idx}>
                                            {section.title && (
                                                <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mb-1.5">
                                                    <span>{section.emoji}</span>
                                                    {section.title}
                                                </h3>
                                            )}
                                            <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</p>
                                        </div>
                                    ))}
                                </div>
                                {!descExpanded && descriptionSections.length > 2 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
                                )}
                            </div>
                            {descriptionSections.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => setDescExpanded(!descExpanded)}
                                    className="w-full py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50/50 transition-colors border-t border-slate-100"
                                >
                                    {descExpanded ? (language === "vi" ? "Thu gọn" : "Show less") : (language === "vi" ? "Xem thêm" : "Show more")}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ══════════ FREQUENTLY BOUGHT TOGETHER ══════════ */}
                    <section className="mt-8">
                        <FrequentlyBoughtTogether
                            currentProduct={{
                                id: product.id,
                                slug: product.slug || "",
                                name: product.name,
                                price: product.price,
                                originalPrice: product.originalPrice ?? undefined,
                                salePrice: product.salePrice ?? undefined,
                                isOnSale: product.isOnSale,
                                image: product.image || undefined,
                                inventory: product.inventory
                            }}
                        />
                    </section>

                    {/* ══════════ REVIEWS ══════════ */}
                    <section className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                                <Star className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-black text-slate-900">{t("shop.customerReviews")}</h2>
                            </div>
                            <WriteReviewButton
                                productId={product.id}
                                productName={product.name}
                                productImage={product.image || undefined}
                            />
                        </div>
                        <ReviewSummaryAI productId={product.id} />
                    </section>

                    {/* ══════════ RELATED PRODUCTS ══════════ */}
                    {relatedProducts.length > 0 && (
                        <section className="mt-8 pb-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                                    <Package className="w-4 h-4 text-white" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900">{t("shop.relatedProducts")}</h2>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {relatedProducts.map((rp) => (
                                    <ProductCard key={rp.id} product={rp} />
                                ))}
                            </div>
                        </section>
                    )}


                </div>
            </div>
            <StickyBuyBar
                productName={product.name}
                price={getCurrentPrice()}
                originalPrice={hasDiscount() ? getOriginalPrice() : undefined}
                inStock={getCurrentInventory() > 0}
                isAddingToCart={isAddingToCart}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                t={t}
            />
        </div>
    );
}
