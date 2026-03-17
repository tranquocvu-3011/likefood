/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 *
 * Re-exports from WishlistContext for backward compatibility.
 * The actual wishlist logic now lives in WishlistContext
 * to prevent N+1 API calls across product cards.
 */

export { useWishlistContext as useWishlist } from "@/contexts/WishlistContext";
