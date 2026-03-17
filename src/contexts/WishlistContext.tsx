"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * WishlistProvider: Global context for wishlist state
 * Prevents N+1 API calls by sharing wishlist data across all components
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface WishlistContextType {
    wishlistIds: Set<number>;
    isInWishlist: (productId: number) => boolean;
    toggleWishlist: (productId: number) => Promise<boolean>;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
    wishlistIds: new Set(),
    isInWishlist: () => false,
    toggleWishlist: async () => false,
    isLoading: false,
    refresh: async () => {},
});

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const fetchedForUserRef = useRef<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Single fetch for all components
    const fetchWishlistIds = useCallback(async () => {
        if (!userId) {
            setWishlistIds(new Set());
            return;
        }

        // Skip if already fetched for this user
        if (String(fetchedForUserRef.current) === String(userId) && wishlistIds.size > 0) {
            return;
        }

        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            setIsLoading(true);
            const res = await fetch("/api/user/wishlist", {
                signal: controller.signal,
            });
            if (res.ok) {
                const products = await res.json();
                const ids: number[] = Array.isArray(products)
                    ? products
                        .filter((p: Record<string, unknown>) => p && typeof p === "object" && p.id != null)
                        .map((p: Record<string, unknown>) => Number(p.id))
                        .filter((id: number) => !isNaN(id))
                    : [];
                setWishlistIds(new Set(ids));
                fetchedForUserRef.current = String(userId);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            logger.error("Failed to fetch wishlist", error as Error, { context: "WishlistProvider" });
        } finally {
            setIsLoading(false);
            abortRef.current = null;
        }
    }, [userId, wishlistIds.size]);

    // Fetch once when user ID changes
    useEffect(() => {
        if (status === "loading") return;
        if (!userId) {
            setWishlistIds(new Set());
            fetchedForUserRef.current = null;
            return;
        }
        if (String(fetchedForUserRef.current) === String(userId)) return;
        fetchWishlistIds();
    }, [userId, status, fetchWishlistIds]);

    // Cleanup
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    // Toggle with optimistic update
    const toggleWishlist = useCallback(async (productId: number) => {
        if (!userId) {
            toast.error("Vui lòng đăng nhập để sử dụng tính năng yêu thích");
            return false;
        }

        const isInWishlist = wishlistIds.has(productId);

        // Optimistic update
        setWishlistIds(prev => {
            const newSet = new Set(prev);
            if (isInWishlist) newSet.delete(productId);
            else newSet.add(productId);
            return newSet;
        });

        try {
            const res = isInWishlist
                ? await fetch(`/api/user/wishlist?productId=${productId}`, { method: "DELETE" })
                : await fetch("/api/user/wishlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: Number(productId) }),
                });

            if (!res.ok) throw new Error("Toggle failed");
            return true;
        } catch (error) {
            // Revert
            setWishlistIds(prev => {
                const newSet = new Set(prev);
                if (isInWishlist) newSet.add(productId);
                else newSet.delete(productId);
                return newSet;
            });
            logger.error("Failed to toggle wishlist", error as Error, { context: "WishlistProvider" });
            return false;
        }
    }, [userId, wishlistIds]);

    return (
        <WishlistContext.Provider value={{
            wishlistIds,
            isInWishlist: (productId: number) => wishlistIds.has(Number(productId)),
            toggleWishlist,
            isLoading,
            refresh: fetchWishlistIds,
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlistContext() {
    return useContext(WishlistContext);
}
