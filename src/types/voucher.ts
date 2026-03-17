/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Voucher-related TypeScript types and interfaces
 */

export interface Voucher {
    id: number;
    code: string;
    type: "PERCENTAGE" | "FIXED" | "SHIPPING";
    value: number;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    canUse: boolean;
    reason?: string;
    expiresAt?: Date | null;
    usageLimit?: number | null;
    usedCount?: number;
}
