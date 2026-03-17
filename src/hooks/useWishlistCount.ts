/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * Lightweight hook for wishlist count.
 * Reads from the global WishlistContext — no additional API calls.
 */

"use client";

import { useWishlistContext } from "@/contexts/WishlistContext";

/**
 * Returns the wishlist item count from the global context.
 * Used in Navbar and MobileBottomNav to show badges.
 */
export function useWishlistCount(): number {
    const { wishlistIds } = useWishlistContext();
    return wishlistIds.size;
}
