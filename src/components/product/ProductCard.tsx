/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * ProductCard — Orchestrator component
 * Sub-components: ProductCardImage, ProductCardInfo, ProductCardPrice
 */

"use client";

import { Star, Eye, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useState, useCallback, memo } from "react";
import QuickViewModal from "./QuickViewModal";
import QuickAddButton from "./QuickAddButton";
import WishlistButton from "./WishlistButton";
import { useRouter } from "next/navigation";
import { useCartState, useCartActions } from "@/contexts/CartContext";
import { useLanguage } from "@/lib/i18n/context";

// Sub-components
import ProductCardImage from "./ProductCardImage";
import ProductCardInfo from "./ProductCardInfo";
import ProductCardPrice from "./ProductCardPrice";
import PriceDisplay from "@/components/ui/price-display";

// ───────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────
export interface ProductCardProduct {
    id: number;
    slug?: string | null;
    name: string;
    nameEn?: string | null;
    price: number;
    category: string;
    categoryEn?: string | null;
    weight?: string | null;
    weightEn?: string | null;
    rating?: number;
    ratingAvg?: number;
    ratingCount?: number;
    image?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
    inventory: number;
    soldCount?: number;
    originalPrice?: number | null;
    isNew?: boolean;
    isHot?: boolean;
    onSale?: boolean;
    isOnSale?: boolean;
    salePrice?: number | null;
    badgeText?: string | null;
    badgeTextEn?: string | null;
    hasVoucher?: boolean;
    hasFreeship?: boolean;
    isFlashSale?: boolean;
    saleStartAt?: Date | string | null;
    saleEndAt?: Date | string | null;
}

interface ProductCardProps {
    product: ProductCardProduct;
    viewMode?: "grid" | "list";
}

// ───────────────────────────────────────────────────────────
// Helpers (shared between grid & list)
// ───────────────────────────────────────────────────────────
function computeProductMeta(product: ProductCardProduct) {
    const ratingValue = product.ratingAvg ?? product.rating ?? 0;
    const ratingCount = product.ratingCount ?? 0;
    const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
    const currentPrice = (hasSalePrice ? product.salePrice : product.price) ?? product.price;
    const basePriceForDiscount = product.originalPrice && product.originalPrice > currentPrice
        ? product.originalPrice
        : hasSalePrice
            ? product.price
            : product.price;
    const hasDiscount = basePriceForDiscount > currentPrice;
    const isOnSale = Boolean(product.onSale || product.isOnSale || hasDiscount);
    const effectiveSalePrice = hasDiscount ? currentPrice : null;
    const discountPercent = hasDiscount
        ? Math.round(((basePriceForDiscount - currentPrice) / basePriceForDiscount) * 100)
        : 0;
    const soldCount = product.soldCount ?? 0;
    const soldPercentage = soldCount > 0 && product.inventory > 0
        ? Math.min((soldCount / (soldCount + product.inventory)) * 100, 100)
        : 0;
    const isLowStock = product.inventory > 0 && product.inventory <= 10;

    const now = new Date();
    const isCurrentlyFlashSale = !!(product.isFlashSale || (
        isOnSale &&
        product.saleStartAt &&
        product.saleEndAt &&
        new Date(product.saleStartAt) <= now &&
        new Date(product.saleEndAt) >= now
    ));

    const isNewProduct = product.isNew || (() => {
        const createdAt = (product as { createdAt?: string | Date }).createdAt;
        if (!createdAt) return false;
        const createdDate = new Date(createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return createdDate > sevenDaysAgo;
    })();

    const productUrl = `/products/${product.slug || product.id}`;

    return {
        ratingValue,
        ratingCount,
        isOnSale,
        effectiveSalePrice,
        currentPrice,
        basePriceForDiscount,
        hasDiscount,
        discountPercent,
        soldCount,
        soldPercentage,
        isLowStock,
        isCurrentlyFlashSale,
        isNewProduct,
        productUrl,
    };
}

function formatCompactNumber(num: number) {
    if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`;
    return `${num}`;
}

// ───────────────────────────────────────────────────────────
// List View (kept inline — simpler layout)
// ───────────────────────────────────────────────────────────
function ProductCardList({ product, meta }: { product: ProductCardProduct; meta: ReturnType<typeof computeProductMeta> }) {
    const { language, isVietnamese, t } = useLanguage();
    const router = useRouter();
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickViewOpen(true);
    };

    return (
        <div
            data-product-id={product.id}
            onClick={() => router.push(meta.productUrl)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(meta.productUrl); } }}
            tabIndex={0}
            role="article"
            aria-label={product.name}
            onMouseEnter={() => { router.prefetch(meta.productUrl); setIsHovered(true); }}
            onMouseLeave={() => setIsHovered(false)}
            className={`group flex gap-0 bg-white rounded-2xl overflow-hidden cursor-pointer border border-slate-100 transition-all duration-300 ${isHovered ? "shadow-[0_8px_32px_rgba(0,0,0,0.10)] -translate-y-0.5" : "shadow-[0_2px_8px_rgba(0,0,0,0.04)]"} ${product.inventory <= 0 ? "opacity-80 grayscale-[0.2]" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
        >
            {/* Image */}
            <div className="relative shrink-0 w-36 sm:w-44 h-36 sm:h-44 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-hidden">
                {!imageLoaded && !imgError && <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />}
                {product.image && !imgError ? (
                    <Image src={product.image} alt={product.name} fill
                        className={`object-cover transition-all duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"} ${isHovered ? "scale-105" : "scale-100"}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => { setImgError(true); setImageLoaded(true); }}
                        sizes="(max-width: 640px) 144px, 176px"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 gap-2">
                        <Package className="w-10 h-10 text-slate-300" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                <div className="space-y-1.5">
                    <Link href={`/products?category=${encodeURIComponent(product.category)}`} onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 uppercase tracking-[0.12em] px-2 py-1 rounded-full hover:bg-emerald-100 transition-colors">
                        {!isVietnamese && product.categoryEn ? product.categoryEn : product.category}
                    </Link>
                    <h3 className="font-bold text-sm sm:text-base leading-snug text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">{!isVietnamese && product.nameEn ? product.nameEn : product.name}</h3>
                    {(product.weight || product.weightEn) && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{!isVietnamese && product.weightEn ? product.weightEn : product.weight}</p>}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < Math.floor(meta.ratingValue) ? "fill-amber-400 text-amber-400" : i < meta.ratingValue ? "fill-amber-200 text-amber-300" : "fill-slate-100 text-slate-200"}`} />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{meta.ratingValue.toFixed(1)}</span>
                        {meta.ratingCount > 0 && <span className="text-[10px] text-slate-400">({formatCompactNumber(meta.ratingCount)})</span>}
                        <span className="text-[10px] text-slate-400 ml-1">{t('shop.sold')}: {formatCompactNumber(meta.soldCount)}</span>
                    </div>
                    {meta.isLowStock && (
                        <div className="flex items-center gap-1.5">
                            <div className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute h-full w-full rounded-full bg-orange-400 opacity-75" /><span className="relative rounded-full h-1.5 w-1.5 bg-orange-500" /></div>
                            <span className="text-[10px] font-bold text-orange-600">{t('shop.lowStock')}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex flex-col">
                        <PriceDisplay
                            currentPrice={meta.currentPrice}
                            originalPrice={meta.hasDiscount ? meta.basePriceForDiscount : undefined}
                            salePrice={meta.effectiveSalePrice}
                            isOnSale={meta.isOnSale}
                            size="md"
                            showDiscountBadge={false}
                        />
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={handleQuickView} aria-label={t('shop.quickView')} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
                            <Eye className="w-4 h-4" />
                        </button>
                        <WishlistButton productId={product.id} />
                        <QuickAddButton
                            product={{
                                id: product.id,
                                slug: product.slug || undefined,
                                name: product.name,
                                price: meta.currentPrice,
                                originalPrice: meta.hasDiscount ? meta.basePriceForDiscount : undefined,
                                salePrice: meta.hasDiscount ? meta.currentPrice : undefined,
                                isOnSale: meta.hasDiscount,
                                image: product.image,
                                inventory: product.inventory,
                            }}
                        />
                    </div>
                </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
                <QuickViewModal product={product} isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} />
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────────────────
// Grid View (uses sub-components)
// ───────────────────────────────────────────────────────────
function ProductCardGrid({ product, meta }: { product: ProductCardProduct; meta: ReturnType<typeof computeProductMeta> }) {
    const { language, isVietnamese, t } = useLanguage();
    const router = useRouter();
    const { lastAddedId } = useCartState();
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const handleQuickView = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickViewOpen(true);
    }, []);

    const handleMouseEnter = useCallback(() => {
        router.prefetch(meta.productUrl);
    }, [meta.productUrl, router]);

    const handleCardClick = useCallback(() => {
        router.push(meta.productUrl);
    }, [meta.productUrl, router]);

    return (
        <div
            data-product-id={product.id}
            onClick={handleCardClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(); } }}
            tabIndex={0}
            role="article"
            aria-label={product.name}
            onMouseEnter={handleMouseEnter}
            className="h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
        >
            <Card className="group bg-transparent shadow-none p-0 h-full cursor-pointer">
                <div className={`relative overflow-hidden rounded-xl bg-white border-0 shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.11)] transition-all duration-400 flex flex-col h-full ${product.inventory <= 0 ? "grayscale-[0.3] opacity-90" : ""}`}>
                    {/* Image Section */}
                    <ProductCardImage
                        productId={product.id}
                        name={product.name}
                        image={product.image}
                        inventory={product.inventory}
                        onQuickView={handleQuickView}
                        onNavigate={handleCardClick}
                        lastAddedId={lastAddedId ? String(lastAddedId) : null}
                    />

                    {/* Info + Price Section */}
                    <CardFooter className="flex flex-col items-start p-2 sm:p-2.5 gap-1.5 bg-white">
                        <ProductCardInfo
                            name={!isVietnamese && product.nameEn ? product.nameEn : product.name}
                            category={!isVietnamese && product.categoryEn ? product.categoryEn : product.category}
                            weight={!isVietnamese && product.weightEn ? product.weightEn : product.weight}
                            ratingValue={meta.ratingValue}
                            ratingCount={meta.ratingCount}
                            soldCount={meta.soldCount}
                            inventory={product.inventory}
                            isLowStock={meta.isLowStock}
                            language={language}
                            t={t}
                        />

                        <ProductCardPrice
                            currentPrice={meta.currentPrice}
                            originalPrice={product.originalPrice ?? meta.basePriceForDiscount}
                            salePrice={meta.effectiveSalePrice}
                            isOnSale={meta.isOnSale ?? false}
                            hasDiscount={meta.hasDiscount}
                            basePriceForDiscount={meta.basePriceForDiscount}
                            product={{
                                id: product.id,
                                slug: product.slug || undefined,
                                name: product.name,
                                price: meta.currentPrice,
                                originalPrice: meta.hasDiscount ? meta.basePriceForDiscount : undefined,
                                salePrice: meta.hasDiscount ? meta.currentPrice : undefined,
                                isOnSale: meta.hasDiscount,
                                image: product.image,
                                inventory: product.inventory,
                            }}
                        />
                    </CardFooter>
                </div>
            </Card>

            <div onClick={(e) => e.stopPropagation()}>
                <QuickViewModal product={product} isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} />
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────────────────
// Main ProductCard — thin orchestrator
// ───────────────────────────────────────────────────────────
function ProductCardComponent({ product, viewMode = "grid" }: ProductCardProps) {
    const meta = computeProductMeta(product);

    if (viewMode === "list") {
        return <ProductCardList product={product} meta={meta} />;
    }

    return <ProductCardGrid product={product} meta={meta} />;
}

export default memo(ProductCardComponent);
