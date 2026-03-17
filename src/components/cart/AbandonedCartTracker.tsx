"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { logger } from "@/lib/logger";

const ABANDONED_CART_KEY = "abandoned_cart";
const ABANDONED_CART_DELAY = 30 * 60 * 1000; // 30 minutes

interface AbandonedCartData {
    items: any[];
    abandonedAt: string;
    recoveryEmailSent: boolean;
}

export function AbandonedCartTracker() {
    const { items } = useCart();
    const { data: session } = useSession();

    useEffect(() => {
        if (items.length === 0) return;

        // Save to localStorage for guest users
        const timer = setTimeout(() => {
            const abandonedCart: AbandonedCartData = {
                items,
                abandonedAt: new Date().toISOString(),
                recoveryEmailSent: false,
            };
            localStorage.setItem(ABANDONED_CART_KEY, JSON.stringify(abandonedCart));
            logger.info("Abandoned cart saved to localStorage", { 
                context: "abandoned-cart", 
                itemCount: items.length 
            });
        }, ABANDONED_CART_DELAY);

        return () => clearTimeout(timer);
    }, [items]);

    // Try to send to API if user is logged in
    useEffect(() => {
        if (!session?.user?.id) return;
        
        const stored = localStorage.getItem(ABANDONED_CART_KEY);
        if (!stored) return;

        try {
            const abandonedCart = JSON.parse(stored);
            
            // Optionally send to API for logged-in users
            fetch("/api/user/cart/abandoned", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cartItems: abandonedCart.items,
                    abandonedAt: abandonedCart.abandonedAt,
                }),
            }).catch(() => {
                // Silent fail - localStorage is sufficient
            });
        } catch {
            // Ignore parse errors
        }
    }, [session]);

    return null;
}

export function getAbandonedCart(): AbandonedCartData | null {
    if (typeof window === "undefined") return null;
    
    const stored = localStorage.getItem(ABANDONED_CART_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function clearAbandonedCart(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ABANDONED_CART_KEY);
}
