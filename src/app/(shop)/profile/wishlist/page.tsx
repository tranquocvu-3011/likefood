"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import LoadingState from "@/components/ui/loading-state";
import EmptyState from "@/components/ui/empty-state";
import PriceDisplay from "@/components/ui/price-display";
import { useLanguage } from "@/lib/i18n/context";

interface WishlistProduct {
    id: number;
    slug?: string | null;
    name: string;
    price: number;
    category: string;
    image?: string | null;
    inventory: number;
    description?: string | null;
    originalPrice?: number | null;
    salePrice?: number | null;
    isFlashSale?: boolean;
    ratingAvg?: number | null;
}

export default function WishlistPage() {
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const { addItem } = useCart();
    const { t, isVietnamese } = useLanguage();
    const [products, setProducts] = useState<WishlistProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    const fetchWishlist = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/user/wishlist");
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            logger.error("Failed to fetch wishlist", error as Error, { context: 'wishlist-page' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login?callbackUrl=/profile/wishlist");
            return;
        }

        if (sessionStatus === "authenticated") {
            fetchWishlist();
        }
    }, [sessionStatus, router, fetchWishlist]);

    const handleRemoveFromWishlist = async (productId: number) => {
        try {
            setRemovingId(productId);
            const res = await fetch(`/api/user/wishlist?productId=${productId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== productId));
                toast.success(t('shop.removedFromWishlist'));
            }
        } catch (error) {
            logger.error("Failed to remove from wishlist", error as Error, { context: 'wishlist-page' });
            toast.error(t('common.error'));
        } finally {
            setRemovingId(null);
        }
    };

    const handleAddToCart = (product: WishlistProduct) => {
        const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
        const currentPrice = (hasSalePrice ? product.salePrice : product.price) ?? product.price;
        const originalPrice = product.originalPrice != null && product.originalPrice > currentPrice
            ? product.originalPrice
            : hasSalePrice
                ? product.price
                : undefined;
        addItem({
            productId: product.id,
            slug: product.slug || undefined,
            name: product.name,
            price: currentPrice,
            originalPrice,
            salePrice: originalPrice ? currentPrice : undefined,
            isOnSale: !!originalPrice,
            image: product.image || undefined,
            quantity: 1,
            inventory: product.inventory,
            category: product.category,
        });
    };

    if (sessionStatus === "loading" || isLoading) {
        return <LoadingState fullPage text={isVietnamese ? "Đang tải danh sách yêu thích..." : "Loading wishlist..."} />;
    }

    if (products.length === 0) {
        return (
            <div className="page-container-wide py-8">
                <EmptyState
                    icon={Heart}
                    title={isVietnamese ? "Chưa có sản phẩm yêu thích" : "No favorites yet"}
                    description={isVietnamese ? "Hãy thêm sản phẩm bạn thích vào danh sách yêu thích để dễ dàng tìm lại sau nhé!" : "Add products you love to your favorites to easily find them later!"}
                    action={
                        <Link href="/products" prefetch={true}>
                            <Button className="bg-primary text-white px-10 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all transform hover:scale-105 active:scale-95">
                                {isVietnamese ? "Khám phá sản phẩm" : "Explore Products"}
                            </Button>
                        </Link>
                    }
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-pink-500 to-red-500">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

                <div className="relative page-container-wide py-6 lg:py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-8">
                        <Link href="/" className="hover:text-white transition-colors">{isVietnamese ? "Trang chủ" : "Home"}</Link>
                        <span>/</span>
                        <Link href="/profile" className="hover:text-white transition-colors">{isVietnamese ? "Tài khoản" : "Account"}</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{isVietnamese ? "Yêu thích" : "Wishlist"}</span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                        <Link href="/products" prefetch={true} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            {isVietnamese ? "Tiếp tục mua sắm" : "Continue Shopping"}
                        </Link>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-2">
                        {isVietnamese ? "Danh sách yêu thích" : "Wishlist"} <span className="text-white/60">({products.length})</span>
                    </h1>
                    <p className="text-white/70 font-medium">
                        {isVietnamese ? "Những sản phẩm bạn đã lưu vào danh sách yêu thích" : "Products you've saved to your favorites"}
                    </p>
                </div>
            </div>

            <div className="page-container-wide mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                    (() => {
                        const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
                        const currentPrice = (hasSalePrice ? product.salePrice : product.price) ?? product.price;
                        const comparePrice = product.originalPrice != null && product.originalPrice > currentPrice
                            ? product.originalPrice
                            : hasSalePrice
                                ? product.price
                                : undefined;

                        return (
                    <div
                        key={product.id}
                        className="bg-white rounded-xl border border-slate-100 shadow-md shadow-slate-100/50 overflow-hidden group hover:shadow-xl transition-all duration-300"
                    >
                        <Link href={`/products/${product.slug || product.id}`} prefetch={true}>
                            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ShoppingBag className="w-16 h-16 text-slate-200" />
                                    </div>
                                )}
                                {product.isFlashSale && (
                                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-600 px-3 py-1 rounded-full text-xs font-black text-white uppercase tracking-widest shadow-lg">
                                        {isVietnamese ? "Giảm sốc" : "Flash Sale"}
                                    </div>
                                )}
                            </div>
                        </Link>

                        <div className="p-5">
                            <Link href={`/products/${product.slug || product.id}`} prefetch={true}>
                                <h3 className="font-black text-lg hover:text-primary transition-colors line-clamp-2 mb-2">
                                    {product.name}
                                </h3>
                            </Link>

                            <div className="mb-4">
                                <PriceDisplay
                                    currentPrice={currentPrice}
                                    originalPrice={comparePrice}
                                    salePrice={comparePrice ? currentPrice : undefined}
                                    isOnSale={!!comparePrice}
                                    size="md"
                                    showDiscountBadge={false}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => handleAddToCart(product)}
                                    disabled={product.inventory <= 0}
                                    className="flex-1 h-11 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    {product.inventory > 0 ? t('shop.addToCart') : t('shop.outOfStock')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveFromWishlist(product.id)}
                                    disabled={removingId === product.id}
                                    aria-label={t('shop.removeFromWishlist')}
                                    className="h-11 w-11 rounded-full border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    {removingId === product.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                        );
                    })()
                ))}
                </div>
            </div>
        </div>
    );
}
