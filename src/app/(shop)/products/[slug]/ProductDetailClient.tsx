"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
    Star, Heart, Share2, ShoppingCart, Truck, ArrowLeft,
    Loader2, Flame, Zap, ChevronRight, Package, ShoppingBag,
    ChevronDown, Shield, RefreshCw, CreditCard, Info
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
import ProductSpecifications from "@/components/product/ProductSpecifications";
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
    loading: () => <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />,
    ssr: false,
});
const FrequentlyBoughtTogether = dynamic(() => import("@/components/product/FrequentlyBoughtTogether"), {
    loading: () => <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />,
    ssr: false,
});

import { FREE_SHIPPING_THRESHOLD_USD } from "@/lib/commerce";
import { SizeGuide, SizeGuideButton } from "@/components/product-size-guide/SizeGuide";
import StickyBuyBar from "@/components/product/StickyBuyBar";
import TrustBadgesRow from "@/components/product/TrustBadgesRow";
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
    // Extended fields from API
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
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const { t, language } = useLanguage();

    // Auto-format description: split by emoji markers into neat sections
    const descriptionSections = useMemo(() => {
        if (!product?.description) return [];
        const text = product.description;
        // Split by common emoji section markers (🌿 GIỚI THIỆU:, 🍃 HƯƠNG VỊ:, etc.)
        const sectionRegex = /(?:^|\s)([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}✅☑️🔥⭐️🎁💪🍃🌿🧂🌶️📦🎯🏷️💰🔒🚚👨‍🍳🧑‍🍳👩‍🍳🍴🥢🥄🍽️])\s*([A-ZÀ-Ỹ\s&]+):\s*/gu;
        const parts: { title: string; content: string; emoji: string }[] = [];
        let lastIndex = 0;
        let match;
        const matches: { index: number; emoji: string; title: string; length: number }[] = [];

        while ((match = sectionRegex.exec(text)) !== null) {
            matches.push({
                index: match.index,
                emoji: match[1],
                title: match[2].trim(),
                length: match[0].length,
            });
        }

        if (matches.length === 0) {
            // No emoji sections found - just split by newlines or periods for readability
            return [{ title: "", content: text, emoji: "" }];
        }

        // Text before first section
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

    useEffect(() => {
        // Skip fetch if initial data was provided by server component
        if (initialProduct) {
            // Still track recently viewed on client
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
                        const newViewed = [
                            data.id,
                            ...viewedIds.filter((id: string) => id !== data.id)
                        ].slice(0, 10);
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
        if (selectedVariant) {
            return selectedVariant.stock;
        }
        return product?.inventory || 0;
    };

    const getOriginalPrice = () => {
        if (!product) return 0;
        const current = getCurrentPrice();
        if (product.originalPrice != null && product.originalPrice > current) {
            return product.originalPrice;
        }
        const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
        return hasSalePrice ? product.price : current;
    };

    const hasDiscount = () => {
        const original = getOriginalPrice();
        const current = getCurrentPrice();
        return original > current;
    };

    const getDiscountPercent = () => {
        if (!hasDiscount()) return 0;
        const original = getOriginalPrice();
        const current = getCurrentPrice();
        return Math.round(((original - current) / original) * 100);
    };

    /** Builds the cart item payload — shared between add-to-cart and buy-now */
    const buildCartItem = () => {
        if (!product) return null;
        const currentPrice = getCurrentPrice();
        const currentInventory = getCurrentInventory();

        if (currentInventory === 0) {
            toast.error(t("shop.productOutOfStock"));
            return null;
        }

        const onSale = hasDiscount();
        const originalForCart = onSale ? getOriginalPrice() : undefined;

        return {
            productId: Number(product.id),
            slug: product.slug || undefined,
            name: product.name + (selectedVariant ? ` - ${selectedVariant.weight || selectedVariant.flavor || ''}` : ''),
            price: currentPrice,
            originalPrice: originalForCart,
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
                await navigator.share({
                    title: product?.name,
                    text: product?.description,
                    url: url,
                });
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

    if (isLoading) {
        return <LoadingState fullPage text={t("shop.loadingProduct")} />;
    }

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
            <div className="pt-6 pb-16">
                <div className="page-container-wide">
                    {/* JSON-LD for SEO */}
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

                    {/* Breadcrumbs */}
                    <motion.nav
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex items-center gap-2 text-sm"
                    >
                        <Link href="/" prefetch={true} className="text-slate-400 hover:text-emerald-600 font-medium transition-colors">{t("common.home")}</Link>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <Link href="/products" prefetch={true} className="text-slate-400 hover:text-emerald-600 font-medium transition-colors">{t("common.products")}</Link>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-slate-500 font-semibold truncate max-w-[180px]">{product.name}</span>
                    </motion.nav>

                    {/* Main Product Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-20">
                        {/* Image Gallery - Left Side */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="sticky top-28 max-w-[480px] mx-auto lg:mx-0">
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xl shadow-slate-200/50 mb-3">
                                    {(product.images && product.images.filter(img => img.imageUrl).length > 0) || product.image ? (
                                        <ImageGallery
                                            images={(() => {
                                                // Filter out images with empty/invalid URLs
                                                const gallery = [...(product.images || [])].filter(img => img.imageUrl && img.imageUrl.trim() !== '');
                                                if (product.image) {
                                                    const mainImageInGallery = gallery.find(img => img.imageUrl === product.image);
                                                    if (!mainImageInGallery) {
                                                        gallery.unshift({
                                                            id: -1,
                                                            imageUrl: product.image,
                                                            altText: product.name,
                                                            order: -1,
                                                            isPrimary: true,
                                                        });
                                                    } else {
                                                        gallery.sort((a) => (a.imageUrl === product.image ? -1 : 1));
                                                    }
                                                }
                                                return gallery;
                                            })()}
                                            productName={product.name}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                            <ShoppingBag className="w-32 h-32 text-slate-200" />
                                        </div>
                                    )}

                                    {/* Sale Badge */}
                                    {hasDiscount() && (
                                        <div className="absolute top-6 left-6 z-10">
                                            <Badge variant="sale" className="px-5 py-2.5 rounded-2xl">
                                                <Flame className="w-5 h-5 text-white fill-white mr-2" />
                                                Sale {getDiscountPercent()}%
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Flash Sale Badge */}
                                    {product.isFlashSale && (
                                        <div className="absolute top-6 right-6 z-10">
                                            <Badge variant="flash" className="px-5 py-2.5 rounded-2xl">
                                                <Zap className="w-5 h-5 text-white fill-white mr-2" />
                                                {t("common.flashSale")}
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Out of Stock Overlay */}
                                    {getCurrentInventory() === 0 && (
                                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-20">
                                            <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20">
                                                <span className="text-2xl font-black text-white uppercase tracking-widest">{t("shop.outOfStock")}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Product Info - Right Side */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="space-y-6"
                        >
                            {/* Category & Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                    href={`/products?category=${encodeURIComponent(product.category)}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                                >
                                    {product.category}
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                                {product.isFlashSale && (
                                    <Badge variant="flash" className="text-[10px] py-1">
                                        <Flame className="w-3 h-3 mr-1" />
                                        {t("common.flashSale")}
                                    </Badge>
                                )}
                                {product.isNew && (
                                    <Badge variant="new" className="text-[10px] py-1">
                                        <Zap className="w-3 h-3 mr-1" />
                                        {t("common.new")}
                                    </Badge>
                                )}
                            </div>

                            {/* Product Title & Weight */}
                            <div className="space-y-4">
                                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                                    {product.name}
                                </h1>
                                {product.weight && (
                                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white text-slate-600 px-4 py-2 rounded-xl text-sm font-bold border border-slate-100 shadow-sm">
                                        <Package className="w-4 h-4 text-emerald-500" />
                                        <span className="text-slate-500">{t("shop.packaging")}:</span>
                                        <span className="text-slate-900">{product.weight}</span>
                                    </div>
                                )}
                            </div>

                            {/* Rating & Stats */}
                            <div className="flex items-center gap-6 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < Math.round(product.avgRating)
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-slate-200"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-base font-bold text-slate-700">
                                        {product.avgRating.toFixed(1)}
                                        <span className="text-slate-400 font-medium ml-1">({product.reviewCount} {t("shop.rating").toLowerCase()})</span>
                                    </span>
                                </div>
                                {product.soldCount != null && product.soldCount > 0 && (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <ShoppingBag className="w-4 h-4" />
                                        <span className="text-sm font-semibold">
                                            {t("shop.sold")} <span className="text-slate-900 font-black">{product.soldCount.toLocaleString()}</span>
                                        </span>
                                    </div>
                                )}
                            </div>


                            {/* Variant Selector */}
                            {product.variants && product.variants.length > 0 && (
                                <VariantSelector
                                    variants={product.variants}
                                    basePrice={product.price}
                                    selectedVariant={selectedVariant}
                                    onVariantChange={(variant) => {
                                        setSelectedVariant(variant);
                                        setQuantity(1);
                                    }}
                                />
                            )}

                            {/* Purchase Card: Price + Stock + Quantity + Buttons */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/50 overflow-hidden">
                                {/* Price */}
                                <div className="p-5 bg-gradient-to-r from-slate-50 to-white">
                                    <PriceDisplay
                                        currentPrice={getCurrentPrice()}
                                        originalPrice={hasDiscount() ? getOriginalPrice() : undefined}
                                        salePrice={hasDiscount() ? getCurrentPrice() : undefined}
                                        isOnSale={hasDiscount()}
                                        size="xl"
                                        showDiscountBadge={false}
                                    />
                                    <p className="mt-1 text-xs font-medium text-slate-400">{formatVndEquivalent(getCurrentPrice())}</p>
                                    {selectedVariant && selectedVariant.priceAdjustment !== 0 && (
                                        <p className="mt-1 text-xs font-bold text-emerald-600">
                                            + {formatPrice(selectedVariant.priceAdjustment)} ({language === "vi" ? "Tuỳ chọn" : "Option"} {selectedVariant.weight || selectedVariant.flavor})
                                        </p>
                                    )}
                                    {/* Sold Progress */}
                                    {hasDiscount() && product.soldCount != null && product.soldCount > 0 && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-slate-500 font-medium">{t("shop.sold")} {product.soldCount.toLocaleString()}</span>
                                                <span className="text-slate-400">{t("shop.inStock")}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${soldPercentage}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Freeship mini bar */}
                                <div className={`mx-5 -mb-2 px-4 py-2.5 flex items-center gap-3 rounded-b-xl ${getCurrentPrice() >= FREE_SHIPPING_THRESHOLD_USD ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'} border-x border-t-0`}>
                                    <Truck className={`w-4 h-4 shrink-0 ${getCurrentPrice() >= FREE_SHIPPING_THRESHOLD_USD ? 'text-green-500' : 'text-blue-500'}`} />
                                    {getCurrentPrice() >= FREE_SHIPPING_THRESHOLD_USD ? (
                                        <span className="text-xs font-bold text-green-700">{t("cart.freeShipping")}! ✓</span>
                                    ) : (
                                        <div className="flex-1">
                                            <span className="text-xs font-medium text-blue-600">
                                                {t("cart.addMoreForFreeShip").replace("{amount}", formatPrice(FREE_SHIPPING_THRESHOLD_USD - getCurrentPrice()))}
                                            </span>
                                            <div className="h-1 bg-blue-100 rounded-full overflow-hidden mt-1">
                                                <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${Math.min((getCurrentPrice() / FREE_SHIPPING_THRESHOLD_USD) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quantity + Actions */}
                                <div className="p-5 space-y-4">
                                    {/* Stock status inline */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("common.quantity")}:</span>
                                            <QuantitySelector
                                                value={quantity}
                                                min={1}
                                                max={getCurrentInventory()}
                                                onChange={(val) => setQuantity(val)}
                                                size="lg"
                                            />
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${getCurrentInventory() > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            <div className={`w-2 h-2 rounded-full ${getCurrentInventory() > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                            {getCurrentInventory() > 0 ? t("shop.inStock") : t("shop.outOfStock")}
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            onClick={handleAddToCart}
                                            disabled={getCurrentInventory() === 0 || isAddingToCart}
                                            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
                                        >
                                            {isAddingToCart ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                                    {t("shop.addToCart")}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={handleBuyNow}
                                            disabled={getCurrentInventory() === 0}
                                            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-bold text-sm shadow-lg shadow-slate-500/20"
                                        >
                                            {t("shop.buyNow")}
                                        </Button>
                                    </div>

                                    {/* Secondary actions + Size guide */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleWishlist(product.id)}
                                                className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${isInWishlist(product.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                            >
                                                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                                                {isInWishlist(product.id) ? t("shop.wishlistLiked") : t("shop.wishlistLike")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleShare}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-500 transition-all"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                {t("shop.share")}
                                            </button>
                                        </div>
                                        <SizeGuideButton onClick={() => setShowSizeGuide(true)} />
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badges - Compact Inline */}
                            <div className="flex items-center justify-between gap-2 py-4 px-5 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl border border-slate-100/80">
                                {[
                                    { icon: Truck, label: t("shop.fastDelivery"), color: "text-orange-500", bg: "bg-orange-50" },
                                    { icon: Shield, label: t("shop.qualityGuarantee"), color: "text-emerald-500", bg: "bg-emerald-50" },
                                    { icon: RefreshCw, label: t("shop.easyReturn"), color: "text-blue-500", bg: "bg-blue-50" },
                                    { icon: CreditCard, label: t("shop.securePayment"), color: "text-violet-500", bg: "bg-violet-50" },
                                ].map((badge) => (
                                    <div key={badge.label} className="flex items-center gap-2 px-2">
                                        <div className={`w-8 h-8 rounded-lg ${badge.bg} flex items-center justify-center`}>
                                            <badge.icon className={`w-4 h-4 ${badge.color}`} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{badge.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                    {/* ────────── Description Section ────────── */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Info className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">
                                {language === "vi" ? "Mô tả sản phẩm" : "Product Description"}
                            </h2>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className={`relative ${!descExpanded && descriptionSections.length > 2 ? 'max-h-[320px] overflow-hidden' : ''}`}>
                                <div className="p-6 lg:p-8 space-y-6">
                                    {descriptionSections.map((section, idx) => (
                                        <div key={idx}>
                                            {section.title && (
                                                <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-3">
                                                    <span className="text-lg">{section.emoji}</span>
                                                    {section.title}
                                                </h3>
                                            )}
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                                {section.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Gradient overlay when collapsed */}
                                {!descExpanded && descriptionSections.length > 2 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
                                )}
                            </div>

                            {/* Expand/Collapse button */}
                            {descriptionSections.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => setDescExpanded(!descExpanded)}
                                    className="w-full py-4 flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors border-t border-slate-100"
                                >
                                    {descExpanded
                                        ? (language === "vi" ? "Thu gọn" : "Show less")
                                        : (language === "vi" ? "Xem thêm" : "Show more")
                                    }
                                    <ChevronDown className={`w-4 h-4 transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>
                    </motion.section>


                    {/* Specifications */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <ProductSpecifications slug={slug} />
                    </motion.div>


                    {/* Frequently Bought Together */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">
                                {language === "vi" ? "Thường mua cùng nhau" : "Frequently Bought Together"}
                            </h2>
                        </div>
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
                    </motion.div>

                    {/* Customer Reviews Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {t("shop.customerReviews")}
                                </h2>
                                <p className="text-slate-500 text-sm font-medium mt-0.5">
                                    {t("shop.beFirstReview")}
                                </p>
                            </div>
                            <WriteReviewButton
                                productId={product.id}
                                productName={product.name}
                                productImage={product.image || undefined}
                            />
                        </div>
                        <ReviewSummaryAI
                            productId={product.id}
                        />
                    </motion.div>

                    {/* Size Guide Modal */}
                    <SizeGuide
                        isOpen={showSizeGuide}
                        onClose={() => setShowSizeGuide(false)}
                        productName={product.name}
                    />

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="pb-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">
                                    {t("shop.relatedProducts")}
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                                {relatedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </motion.section>
                    )}
                </div>
            </div>
            {/* Sticky Buy Bar - Mobile Only */}
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
