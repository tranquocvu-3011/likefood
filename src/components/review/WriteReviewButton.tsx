"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/context";
import { ReviewModal } from "./ReviewForm";

interface WriteReviewButtonProps {
    productId: number;
    productName: string;
    productImage?: string;
}

interface OrderItem {
    id: number;
    productId: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        image?: string | null;
    };
    order: {
        id: number;
        status: string;
        createdAt: string;
    };
    review?: {
        id: number;
        rating: number;
        comment?: string | null;
    } | null;
}

export function WriteReviewButton({ productId, productName, productImage }: WriteReviewButtonProps) {
    const { language } = useLanguage();
    const { status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [purchasableItems, setPurchasableItems] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);

    // Fetch purchasable order items
    const fetchPurchasableItems = useCallback(async () => {
        if (status !== "authenticated") return;
        
        setIsLoading(true);
        try {
            const res = await fetch(`/api/reviews/check?productId=${productId}`);
            if (res.ok) {
                const data = await res.json();
                // Filter only COMPLETED orders without reviews
                const available = (data.purchasableItems || []).filter(
                    (item: OrderItem) => item.order.status === "COMPLETED" && !item.review
                );
                setPurchasableItems(available);
                
                // Auto-select first item if only one
                if (available.length === 1) {
                    setSelectedOrderItem(available[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch purchasable items:", error);
        } finally {
            setIsLoading(false);
        }
    }, [productId, status]);

    useEffect(() => {
        fetchPurchasableItems();
    }, [fetchPurchasableItems]);

    // Don't show anything if not logged in
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null; // Don't show button for non-logged in users
    }

    // No purchasable items = can't review
    if (!isLoading && purchasableItems.length === 0) {
        return null;
    }

    // Already reviewed all purchased items
    if (!isLoading && purchasableItems.length === 0 && selectedOrderItem) {
        return (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-sm font-bold">
                    {language === "vi" ? "Bạn đã đánh giá sản phẩm này" : "You reviewed this product"}
                </span>
            </div>
        );
    }

    // Multiple items - show dropdown
    if (!isLoading && purchasableItems.length > 1) {
        return (
            <>
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors"
                >
                    <MessageSquare className="w-5 h-5" />
                    {language === "vi" ? "Viết đánh giá" : "Write a review"}
                </button>

                <ReviewModal
                    isOpen={isOpen}
                    productId={productId}
                    orderItemId={String(selectedOrderItem?.id || purchasableItems[0]?.id)}
                    productName={productName}
                    productImage={productImage}
                    onSuccess={() => {
                        setIsOpen(false);
                        fetchPurchasableItems();
                    }}
                    onCancel={() => setIsOpen(false)}
                />
            </>
        );
    }

    // Single item - show button directly
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors"
            >
                <MessageSquare className="w-5 h-5" />
                {language === "vi" ? "Viết đánh giá" : "Write a review"}
            </button>

            <ReviewModal
                isOpen={isOpen}
                productId={productId}
                orderItemId={String(selectedOrderItem?.id || purchasableItems[0]?.id)}
                productName={productName}
                productImage={productImage}
                onSuccess={() => {
                    setIsOpen(false);
                    fetchPurchasableItems();
                }}
                onCancel={() => setIsOpen(false)}
            />
        </>
    );
}

// Standalone review form for order detail page
interface OrderReviewButtonProps {
    orderItem: OrderItem;
    onReviewSubmitted?: () => void;
}

export function OrderReviewButton({ orderItem, onReviewSubmitted }: OrderReviewButtonProps) {
    const { language } = useLanguage();
    const { status } = useSession();
    const [isOpen, setIsOpen] = useState(false);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center p-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

    // Already has review
    if (orderItem.review) {
        return (
            <div className="flex items-center gap-1 text-green-600">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-xs font-medium">
                    {language === "vi" ? "Đã đánh giá" : "Reviewed"}
                </span>
            </div>
        );
    }

    // Only allow review for COMPLETED orders
    if (orderItem.order.status !== "COMPLETED") {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-full transition-colors"
            >
                <MessageSquare className="w-3 h-3" />
                {language === "vi" ? "Đánh giá" : "Review"}
            </button>

            <ReviewModal
                isOpen={isOpen}
                productId={orderItem.productId}
                orderItemId={String(orderItem.id)}
                productName={orderItem.product.name}
                productImage={orderItem.product.image || undefined}
                onSuccess={() => {
                    setIsOpen(false);
                    onReviewSubmitted?.();
                }}
                onCancel={() => setIsOpen(false)}
            />
        </>
    );
}
