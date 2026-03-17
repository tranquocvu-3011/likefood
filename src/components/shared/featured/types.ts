/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

export interface FeaturedProduct {
    id: number;
    slug?: string;
    name: string;
    price: number;
    basePrice?: number;
    image?: string | null;
    category?: string;
    description?: string | null;
    colorLabel?: string;
}

