"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
    Star, Heart, Share2, ShoppingCart, Truck, ArrowLeft,
    Loader2, Flame, Zap, ChevronRight, Package, ShoppingBag
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
    const { t, language } = useLanguage();

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
                        className="mb-8 flex items-center gap-2 text-sm"
                    >
                        <Link href="/" prefetch={true} className="text-slate-400 hover:text-emerald-600 font-medium transition-colors">{t("common.home")}</Link>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <Link href="/products" prefetch={true} className="text-slate-400 hover:text-emerald-600 font-medium transition-colors">{t("common.products")}</Link>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-600 font-semibold truncate max-w-[200px]">{product.name}</span>
                    </motion.nav>

                    {/* Back Button */}
                    <motion.button
                        type="button"
                        aria-label={t("common.back")}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                            if (typeof document !== 'undefined' && document.referrer && document.referrer.includes(window.location.origin)) {
                                router.back();
                            } else {
                                router.push('/products');
                            }
                        }}
                        className="mb-6 inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t("common.back")}
                    </motion.button>

                    {/* Main Product Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 mb-20">
                        {/* Image Gallery - Left Side (nhỏ gọn hơn) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="xl:col-span-5"
                        >
                            <div className="sticky top-24 max-w-[420px] mx-auto xl:mx-0">
                                <div className="relative">
                                    {/* Main Image - thu nhỏ */}
                                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xl shadow-slate-200/50 mb-3">
                                        {(product.images && product.images.length > 0) || product.image ? (
                                            <ImageGallery
                                                images={(() => {
                                                    const gallery = [...(product.images || [])];
                                                    if (product.image) {
                                                        const mainImageInGallery = gallery.find(img => img.imageUrl === product.image);
                                                        if (!mainImageInGallery) {
                                                            gallery.unshift({
                                                                id: Number('main'),
                                                                imageUrl: product.image,
                                                                altText: product.name,
                                                                order: -1,
                                                                isPrimary: true
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
                            </div>
                        </motion.div>

                        {/* Product Info - Right Side */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="xl:col-span-7 space-y-6"
                        >
                            {/* Category & Badges */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <Link
                                    href={`/products?category=${encodeURIComponent(product.category)}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors"
                                >
                                    {product.category}
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                                {product.isFlashSale && (
                                    <Badge variant="flash">
                                        <Flame className="w-4 h-4 mr-1.5" />
                                        {t("common.flashSale")}
                                    </Badge>
                                )}
                                {product.isNew && (
                                    <Badge variant="new">
                                        <Zap className="w-4 h-4 mr-1.5" />
                                        {t("common.new")}
                                    </Badge>
                                )}
                            </div>

                            {/* Product Title & Weight */}
                            <div className="space-y-3">
                                <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                                    {product.name}
                                </h1>
                                {product.weight && (
                                    <p className="inline-flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold border border-slate-100 uppercase tracking-widest shadow-sm">
                                        <Package className="w-4 h-4 text-emerald-500" />
                                        {t("shop.packaging")}: <span className="text-slate-900">{product.weight}</span>
                                    </p>
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



                            {/* Price Section - Enhanced */}
                            <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100/50">
                                <PriceDisplay
                                    currentPrice={getCurrentPrice()}
                                    originalPrice={hasDiscount() ? getOriginalPrice() : undefined}
                                    salePrice={hasDiscount() ? getCurrentPrice() : undefined}
                                    isOnSale={hasDiscount()}
                                    size="xl"
                                    showDiscountBadge={false}
                                />
                                {/* VND Equivalent */}
                                <p className="mt-2 text-sm font-semibold text-slate-400">
                                    {formatVndEquivalent(getCurrentPrice())}
                                </p>
                                {selectedVariant && selectedVariant.priceAdjustment !== 0 && (
                                    <p className="mt-2 text-xs font-bold text-emerald-600 uppercase tracking-widest">
                                        + {formatPrice(selectedVariant.priceAdjustment)} ({language === "vi" ? "Tuỳ chọn" : "Option"} {selectedVariant.weight || selectedVariant.flavor})
                                    </p>
                                )}

                                {/* Sold Progress */}
                                {hasDiscount() && product.soldCount != null && product.soldCount > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 font-medium flex items-center gap-1">
                                                <Package className="w-4 h-4" />
                                                {t("shop.sold")} {product.soldCount.toLocaleString()}
                                            </span>
                                            <span className="text-slate-400">{t("shop.inStock")}</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
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

                            {/* Freeship Progress */}
                            <div className={`p-5 rounded-2xl border-2 transition-all ${getCurrentPrice() >= FREE_SHIPPING_THRESHOLD_USD
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                    : 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200'
                                }`}>
                                {getCurrentPrice() >= FREE_SHIPPING_THRESHOLD_USD ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                                            <Truck className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-green-700 font-bold text-lg">{t("cart.freeShipping")}!</p>
                                            <p className="text-green-600 text-sm">{t("shop.savedShipping")}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Truck className="w-5 h-5 text-blue-500" />
                                            <span className="text-blue-700 font-bold">{t("cart.freeShipping")}</span>
                                        </div>
                                        <div className="h-2 bg-blue-100 rounded-full overflow-hidden mb-2">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(getCurrentPrice() / FREE_SHIPPING_THRESHOLD_USD) * 100}%` }}
                                                transition={{ duration: 0.8 }}
                                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                                            />
                                        </div>
                                        <p className="text-sm text-blue-600 font-medium">
                                        {t("cart.addMoreForFreeShip").replace("{amount}", formatPrice(FREE_SHIPPING_THRESHOLD_USD - getCurrentPrice()))}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="prose prose-slate max-w-none">
                                <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                    {product.description}
                                </p>
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

                            {/* Stock Status */}
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold ${getCurrentInventory() > 0
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {getCurrentInventory() > 0 ? (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                        <span>{t("shop.inStock")}</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span>{t("shop.outOfStock")}</span>
                                    </>
                                )}
                            </div>

                            {/* Size Guide */}
                            <SizeGuideButton onClick={() => setShowSizeGuide(true)} />

                            {/* Quantity & Actions */}
                            <div className="space-y-5 pt-6 border-t border-slate-200">
                                <div className="flex items-center gap-5">
                                    <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{t("common.quantity")}:</span>
                                    <QuantitySelector
                                        value={quantity}
                                        min={1}
                                        max={getCurrentInventory()}
                                        onChange={(val) => setQuantity(val)}
                                        size="lg"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        onClick={handleAddToCart}
                                        disabled={getCurrentInventory() === 0 || isAddingToCart}
                                        className="flex-1 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold uppercase tracking-wider shadow-2xl shadow-emerald-500/30"
                                    >
                                        {isAddingToCart ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-6 h-6 mr-2" />
                                                {t("shop.addToCart")} {quantity > 1 && `(${quantity})`}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleBuyNow}
                                        disabled={getCurrentInventory() === 0}
                                        className="flex-1 h-16 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-bold uppercase tracking-wider shadow-2xl shadow-slate-500/30"
                                    >
                                        {t("shop.buyNow")}
                                    </Button>
                                </div>

                                {/* Secondary Actions */}
                                <div className="flex items-center justify-center gap-6 pt-4">
                                    <button
                                        type="button"
                                        aria-label={isInWishlist(product.id) ? t("shop.wishlistLiked") : t("shop.wishlistLike")}
                                        onClick={() => toggleWishlist(product.id)}
                                        className={`flex items-center gap-2 transition-all ${isInWishlist(product.id)
                                                ? 'text-red-500 scale-110'
                                                : 'text-slate-400 hover:text-red-500 hover:scale-105'
                                            }`}
                                    >
                                        <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                                        <span className="text-sm font-semibold">
                                            {isInWishlist(product.id) ? t("shop.wishlistLiked") : t("shop.wishlistLike")}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={t("shop.share")}
                                        onClick={handleShare}
                                        className="flex items-center gap-2 text-slate-400 hover:text-emerald-500 transition-all hover:scale-105"
                                    >
                                        <Share2 className="w-6 h-6" />
                                        <span className="text-sm font-semibold">{t("shop.share")}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <TrustBadgesRow t={t} />
                        </motion.div>
                    </div>




                    {/* Specifications */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12"
                    >
                        <ProductSpecifications slug={slug} />
                    </motion.div>

                    {/* Reviews Section */}
                    {product.reviews && product.reviews.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-20"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <Star className="w-7 h-7 text-white fill-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                                        {t("shop.customerReviews")} ({product.reviewCount})
                                    </h2>
                                    <p className="text-base text-slate-500 font-medium">
                                        {product.avgRating.toFixed(1)} / 5.0 {t("shop.ratingAverage")}
                                    </p>
                                </div>
                            </div>

                            {/* Rating Distribution */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 mb-8 shadow-xl shadow-slate-100/50">
                                <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
                                    <div className="text-center lg:pr-8 lg:border-r border-slate-100">
                                        <div className="text-6xl font-black bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                                            {product.avgRating.toFixed(1)}
                                        </div>
                                        <div className="flex items-center justify-center gap-1 mt-3">
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
                                        <div className="text-sm text-slate-500 font-medium mt-2">{product.reviewCount} {t("shop.rating").toLowerCase()}</div>
                                    </div>
                                    <div className="space-y-3">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = product.reviews?.filter(r => Math.round(r.rating) === star).length || 0;
                                            const pct = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-slate-500 w-6">{star}</span>
                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, delay: 0.1 }}
                                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 w-8 text-right">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Review Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {product.reviews.slice(0, 6).map((review, idx) => (
                                    <motion.div
                                        key={review.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                                                {review.user.name?.[0]?.toUpperCase() || "U"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <p className="font-bold text-slate-900">{review.user.name || t("shop.customer")}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-3.5 h-3.5 ${i < review.rating
                                                                            ? "fill-amber-400 text-amber-400"
                                                                            : "text-slate-200"
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-400">
                                                        {new Date(review.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                                                    </span>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">{review.comment}</p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Frequently Bought Together */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
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
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Star className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                                    {t("shop.customerReviews")}
                                </h2>
                                <p className="text-slate-500 text-sm font-medium mt-1">
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
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                    <Package className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                                    {t("shop.relatedProducts")}
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
