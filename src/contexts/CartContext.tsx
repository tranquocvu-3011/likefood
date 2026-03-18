"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { tracking } from "@/lib/tracking";
import { analytics } from "@/lib/analytics/sdk";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Helper: đọc language từ localStorage (tương thích với i18n context)
function getLanguage(): string {
    if (typeof window === "undefined") return "vi";
    try {
        return localStorage.getItem("language") || "vi";
    } catch {
        return "vi";
    }
}

interface CartItem {
    id: string | number; // Can be productId (number) or "productId_variantId" (string)
    productId: number;
    variantId?: number;
    slug?: string;
    name: string;
    price: number;
    originalPrice?: number;
    salePrice?: number;
    isOnSale?: boolean;
    quantity: number;
    image?: string;
    inventory?: number; // For stock checking
    category?: string;
}

export type AddableProduct = Omit<CartItem, "id" | "quantity"> & {
    id?: string | number;
    quantity?: number;
};

interface CartStateContextType {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    lastAddedId: string | number | null;
    isCartOpen: boolean;
}

interface CartActionsContextType {
    addItem: (product: AddableProduct) => boolean;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    clearLastAddedId: () => void;
    setCartOpen: (isOpen: boolean) => void;
}

const CartStateContext = createContext<CartStateContextType | undefined>(undefined);
const CartActionsContext = createContext<CartActionsContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [items, setItems] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") return [];
        const savedCart = window.localStorage.getItem("likefood-cart");
        if (!savedCart) return [];
        try {
            const parsed = JSON.parse(savedCart) as CartItem[];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Failed to parse cart", e);
            return [];
        }
    });

    const [lastAddedId, setLastAddedId] = useState<string | number | null>(null);
    const [isCartOpen, setCartOpen] = useState(false);

    // Save cart to localStorage on change
    useEffect(() => {
        localStorage.setItem("likefood-cart", JSON.stringify(items));
    }, [items]);

    const clearLastAddedId = React.useCallback(() => setLastAddedId(null), []);

    const addItem = React.useCallback((product: AddableProduct): boolean => {
        // Yêu cầu đăng nhập để thêm vào giỏ hàng
        if (!session?.user?.id) {
            const lang = getLanguage();
            const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
            toast.error(
                lang === "vi" ? "Vui lòng đăng nhập để thêm vào giỏ hàng" : "Please login to add items to cart",
                {
                    description: lang === "vi" ? "Bạn cần đăng nhập trước khi mua hàng" : "You need to login before shopping",
                    action: {
                        label: lang === "vi" ? "Đăng nhập ngay" : "Login now",
                        onClick: () => router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`),
                    },
                    duration: 4000,
                }
            );
            return false;
        }

    const productQuantity = product.quantity || 1;
        const cartItemId = product.variantId
            ? `${product.productId}_${product.variantId}`
            : product.productId;

        // Kiểm tra tồn kho trước khi thêm vào giỏ
        if (product.inventory !== undefined && product.inventory >= 0) {
            const currentItem = items.find((item) => String(item.id) === String(cartItemId));
            const currentQty = currentItem?.quantity ?? 0;
            const newQty = currentQty + productQuantity;
            if (newQty > product.inventory) {
                const lang = getLanguage();
                const available = product.inventory - currentQty;
                if (available <= 0) {
                    toast.error(
                        lang === "vi"
                            ? `${product.name} đã hết hàng`
                            : `${product.name} is out of stock`,
                        { id: `cart-stock-${cartItemId}` }
                    );
                } else {
                    toast.error(
                        lang === "vi"
                            ? `Chỉ còn ${product.inventory} "${product.name}" trong kho (bạn đã có ${currentQty} trong giỏ)`
                            : `Only ${product.inventory} "${product.name}" in stock (${currentQty} already in cart)`,
                        { id: `cart-stock-${cartItemId}` }
                    );
                }
                return false;
            }
        }

        setLastAddedId(cartItemId);
        // Reset lastAddedId after animation duration
        setTimeout(() => setLastAddedId(null), 1000);

        setItems((current) => {
            const existing = current.find((item) => String(item.id) === String(cartItemId));
            if (existing) {
                const newQuantity = existing.quantity + productQuantity;
                const lang = getLanguage();
                toast.success(
                    lang === "vi"
                        ? `Đã cập nhật ${product.name} (${newQuantity} sản phẩm)`
                        : `Updated ${product.name} (${newQuantity} items)`,
                    {
                        description: lang === "vi" ? "Sản phẩm đã có trong giỏ hàng" : "Product already in cart",
                        id: `cart-${cartItemId}`,
                    }
                );
                return current.map((item) =>
                    String(item.id) === String(cartItemId)
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }
            const newItem = {
                ...product,
                id: cartItemId,
                quantity: productQuantity
            } as CartItem;

            const newItems = [...current, newItem];

            // Track add to cart (GA4)
            tracking.addToCart(product.productId, product.name, product.price, productQuantity);
            // Track add to cart (Analytics DB)
            analytics.trackAddToCart(
                product.productId,
                product.name,
                product.price,
                product.category || "unknown",
                productQuantity,
                product.variantId ? String(product.variantId) : undefined
            );

            // Automatically open MiniCart when user adds an item
            if (typeof window !== "undefined" && !window.location.pathname.includes("/checkout")) {
                setCartOpen(true);
            }

            const lang = getLanguage();
            toast.success(
                lang === "vi" ? `Đã thêm ${product.name} vào giỏ hàng` : `Added ${product.name} to cart`,
                {
                    description: lang === "vi" ? "Sản phẩm đã được thêm thành công" : "Product added successfully",
                    id: `cart-${cartItemId}`,
                    action: {
                        label: lang === "vi" ? "Hoàn tác" : "Undo",
                        onClick: () => {
                            setItems(current);
                            toast.info(
                                lang === "vi"
                                    ? `Đã hoàn tác: ${product.name} đã được gỡ khỏi giỏ hàng`
                                    : `Undone: ${product.name} removed from cart`
                            );
                        },
                    },
                }
            );

            return newItems;
        });
        return true;
    }, [session, router, items]);

    const removeItem = React.useCallback((id: string) => {
        setItems((current) => {
            const item = current.find((item) => String(item.id) === String(id));
            if (item) {
                const lang = getLanguage();
                toast.success(
                    lang === "vi" ? `Đã xóa ${item.name} khỏi giỏ hàng` : `Removed ${item.name} from cart`,
                    {
                        description: lang === "vi" ? "Sản phẩm đã được gỡ bỏ" : "Product removed",
                        id: `cart-${item.id}`,
                    }
                );
                // Track remove from cart (GA4)
                tracking.removeFromCart(Number(item.productId || item.id), item.name, item.price, item.quantity);
                // Track remove from cart (Analytics DB)
                analytics.trackRemoveFromCart(
                    Number(item.productId || item.id),
                    item.name,
                    item.price,
                    item.category || "unknown",
                    item.quantity
                );
            }
            return current.filter((item) => String(item.id) !== String(id));
        });
    }, []);

    const updateQuantity = React.useCallback((id: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(id);
            return;
        }
        setItems((current) => {
            const item = current.find((item) => String(item.id) === String(id));
            if (item && item.quantity !== quantity) {
                const lang = getLanguage();
                toast.success(
                    lang === "vi"
                        ? `Đã cập nhật số lượng ${item.name} thành ${quantity}`
                        : `Updated ${item.name} quantity to ${quantity}`,
                    {
                        description: lang === "vi" ? "Số lượng đã được cập nhật" : "Quantity updated",
                        id: `cart-qty-${item.id}`,
                    }
                );
            }
            return current.map((item) => (String(item.id) === String(id) ? { ...item, quantity } : item));
        });
    }, [removeItem]);

    const clearCart = React.useCallback(() => setItems([]), []);

    const totalItems = React.useMemo(() =>
        items.reduce((sum, item) => sum + item.quantity, 0),
        [items]);

    const totalPrice = React.useMemo(() =>
        items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [items]);

    const stateValue = React.useMemo(() => ({
        items,
        totalItems,
        totalPrice,
        lastAddedId,
        isCartOpen,
    }), [items, totalItems, totalPrice, lastAddedId, isCartOpen]);

    const actionsValue = React.useMemo(() => ({
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        clearLastAddedId,
        setCartOpen,
    }), [addItem, removeItem, updateQuantity, clearCart, clearLastAddedId]);

    return (
        <CartStateContext.Provider value={stateValue}>
            <CartActionsContext.Provider value={actionsValue}>
                {children}
            </CartActionsContext.Provider>
        </CartStateContext.Provider>
    );
}

export function useCart() {
    const state = useContext(CartStateContext);
    const actions = useContext(CartActionsContext);
    if (state === undefined || actions === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return { ...state, ...actions };
}

export function useCartActions() {
    const context = useContext(CartActionsContext);
    if (context === undefined) {
        throw new Error("useCartActions must be used within a CartProvider");
    }
    return context;
}

export function useCartState() {
    const context = useContext(CartStateContext);
    if (context === undefined) {
        throw new Error("useCartState must be used within a CartProvider");
    }
    return context;
}
