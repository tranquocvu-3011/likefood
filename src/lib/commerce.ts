/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

export const SITE_CURRENCY = "USD" as const;

export const DEFAULT_SHIPPING_FEE_USD = 5.99;
export const EXPRESS_SHIPPING_FEE_USD = 12.99;
export const OVERNIGHT_SHIPPING_FEE_USD = 24.99;
export const FREE_SHIPPING_THRESHOLD_USD = 500;

// Store Pickup — default address, overridable via admin settings (contact_address)
export const STORE_ADDRESS = "Omaha, NE 68136, United States";
export const STORE_GOOGLE_MAPS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STORE_ADDRESS)}`;

/**
 * Get store address from system settings (contact_address), with fallback to default.
 * Server-side only.
 */
export async function getStoreAddressFromDB(): Promise<{ address: string; mapsUrl: string }> {
    try {
        const { getSystemSettingTrimmed } = await import("@/lib/system-settings");
        const dbAddress = await getSystemSettingTrimmed("contact_address");
        const address = dbAddress || STORE_ADDRESS;
        return {
            address,
            mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
        };
    } catch {
        return { address: STORE_ADDRESS, mapsUrl: STORE_GOOGLE_MAPS_URL };
    }
}

// Loyalty Points: earn 2 points per $1 spent
export const POINTS_PER_DOLLAR = 2;
export const POINTS_TO_DOLLAR_RATIO = 100; // 100 points = $1 discount

export const ORDER_STATUS = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    PROCESSING: "PROCESSING",
    SHIPPING: "SHIPPING",
    DELIVERED: "DELIVERED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

const ORDER_STATUS_ALIASES: Record<string, OrderStatus> = {
    SHIPPED: ORDER_STATUS.SHIPPING,
};

export function normalizeOrderStatus(status: string | null | undefined): OrderStatus {
    const raw = `${status || ORDER_STATUS.PENDING}`.trim().toUpperCase();
    return ORDER_STATUS_ALIASES[raw] || (raw as OrderStatus);
}

export function getOrderStatusFilter(status: string | null | undefined): string[] {
    const normalized = normalizeOrderStatus(status);

    if (normalized === ORDER_STATUS.SHIPPING) {
        return [ORDER_STATUS.SHIPPING, "SHIPPED"];
    }

    return [normalized];
}

export function getShippingFeeUsd(
    subtotal: number,
    shippingMethod: string | null | undefined
): number {
    if (subtotal >= FREE_SHIPPING_THRESHOLD_USD) {
        return 0;
    }

    switch (shippingMethod) {
        case "pickup":
            return 0;
        case "express":
            return EXPRESS_SHIPPING_FEE_USD;
        case "overnight":
            return OVERNIGHT_SHIPPING_FEE_USD;
        case "standard":
        default:
            return DEFAULT_SHIPPING_FEE_USD;
    }
}
