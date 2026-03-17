"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Heart, ShoppingCart, Eye, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/context";
import PriceDisplay from "@/components/ui/price-display";

interface Product {
    id: number;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    salePrice?: number | null;
    description?: string | null;
    image?: string | null;
    inventory?: number;
    avgRating?: number;
    reviewCount?: number;
}

interface QuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
}

export function QuickViewModal({ isOpen, onClose, productId }: QuickViewModalProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { addItem } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { t, isVietnamese } = useLanguage();

    useEffect(() => {
        if (isOpen && productId) {
            fetchProduct();
        }
    }, [isOpen, productId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchProduct = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/products/${productId}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data);
                setSelectedImage(data.image || data.images?.[0]?.imageUrl || null);
            }
        } catch (error) {
            console.error("Failed to fetch product:", error);
        } finally {
            setIsLoading(false);
        }
    };
    const handleAddToCart = () => {
        if (!product) return;

        const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
        const currentPrice = (hasSalePrice ? product.salePrice : product.price) ?? product.price;
        const comparePrice = product.originalPrice != null && product.originalPrice > currentPrice
            ? product.originalPrice
            : hasSalePrice
                ? product.price
                : undefined;

        const added = addItem({
            productId: product.id,
            name: product.name,
            price: currentPrice,
            originalPrice: comparePrice,
            salePrice: comparePrice ? currentPrice : undefined,
            isOnSale: Boolean(comparePrice),
            image: product.image || undefined,
            quantity,
            slug: product.slug,
            inventory: product.inventory || 0,
        });

        // Only close modal if item was successfully added (auth passed)
        if (added) onClose();
    };

    const handleWishlistToggle = async () => {
        if (!product) return;

        const isNowInWishlist = await toggleWishlist(product.id);
        if (isNowInWishlist) {
            toast.success(t('shop.addedToWishlist'));
        } else {
            toast.info(t('shop.removedFromWishlist'));
        }
    };

    if (!isOpen) return null;

    const hasSalePrice = product ? (product.salePrice != null && product.salePrice < product.price) : false;
    const displayPrice = product ? (hasSalePrice ? product.salePrice! : product.price) : 0;
    const comparePrice = product
        ? (product.originalPrice != null && product.originalPrice > displayPrice
            ? product.originalPrice
            : hasSalePrice
                ? product.price
                : undefined)
        : undefined;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-3xl shadow-2xl m-4 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {isLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : product ? (
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Section */}
                        <div className="relative aspect-square bg-slate-100">
                            {selectedImage ? (
                                <Image
                                    src={selectedImage}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 90vw, 50vw"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <span className="text-4xl font-black">{product.name[0]}</span>
                                </div>
                            )}

                        </div>

                        {/* Content Section */}
                        <div className="p-6 md:p-8 flex flex-col">
                            <div className="flex-1">
                                <Link
                                    href={`/products/${product.slug}`}
                                    onClick={onClose}
                                    className="text-sm text-primary hover:underline mb-2 block"
                                >
                                    {t('shopPage.viewDetails')}
                                </Link>

                                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
                                    {product.name}
                                </h2>

                                {/* Rating */}
                                {product.avgRating && product.avgRating > 0 && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= Math.round(product.avgRating || 0)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-slate-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-slate-500">
                                            ({product.reviewCount} {t('shop.reviews')})
                                        </span>
                                    </div>
                                )}

                                {/* Price */}
                                <div className="mb-4">
                                    <PriceDisplay
                                        currentPrice={displayPrice}
                                        originalPrice={comparePrice}
                                        salePrice={comparePrice ? displayPrice : undefined}
                                        isOnSale={!!comparePrice}
                                        size="lg"
                                        showDiscountBadge={false}
                                    />
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                                        {product.description}
                                    </p>
                                )}

                                {/* Stock Status */}
                                <div className="mb-6">
                                    {product.inventory !== undefined && (
                                        <p className={`text-sm font-bold ${product.inventory > 10
                                            ? "text-green-600"
                                            : product.inventory > 0
                                                ? "text-orange-600"
                                                : "text-red-600"
                                            }`}>
                                            {product.inventory > 0
                                                 ? t('shop.inStock')
                                                : t('shop.outOfStock')}
                                        </p>
                                    )}
                                </div>

                                {/* Quantity Selector */}
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="text-sm font-bold text-slate-500">{t('shop.quantity')}:</span>
                                    <div className="flex items-center border border-slate-200 rounded-full">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-l-full transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="w-12 text-center font-bold">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(Math.min(product.inventory || 99, quantity + 1))}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-r-full transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!product.inventory || product.inventory <= 0}
                                    className="flex-1 h-14 rounded-full bg-primary hover:bg-primary/90 font-black uppercase tracking-widest gap-2"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {t('shop.addToCart')}
                                </Button>

                                <button
                                    onClick={handleWishlistToggle}
                                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${isInWishlist(product.id)
                                        ? "bg-red-50 border-red-200 text-red-500"
                                        : "border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-500"
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                                </button>

                                <Link href={`/products/${product.slug}`} onClick={onClose}>
                                    <button className="w-14 h-14 rounded-full border-2 border-slate-200 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all">
                                        <Eye className="w-5 h-5 text-slate-400 hover:text-primary" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-slate-500">{t('shop.productNotFound')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
