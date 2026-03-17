/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Currency formatting utilities for the storefront and admin UI.
 * The application is standardized on USD.
 */

export type Currency = "USD";

export interface CurrencyConfig {
    currency?: Currency;
    locale?: string;
}

const DEFAULT_CURRENCY: Currency = "USD";
const DEFAULT_LOCALE = "en-US";

/** Exchange rate: 1 USD ≈ 26,000 VND */
export const USD_TO_VND_RATE = 26000;

export function setDefaultCurrency(_currency: Currency) {
    // Currency is fixed to USD for this application.
}

export function getDefaultCurrency(): Currency {
    return DEFAULT_CURRENCY;
}

export function formatPrice(price: number, config?: CurrencyConfig): string {
    return new Intl.NumberFormat(config?.locale || DEFAULT_LOCALE, {
        style: "currency",
        currency: DEFAULT_CURRENCY,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price || 0);
}

export function formatPriceNumber(price: number, config?: CurrencyConfig): string {
    return new Intl.NumberFormat(config?.locale || DEFAULT_LOCALE, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price || 0);
}

export function getCurrencySymbol(_currency?: Currency): string {
    return "$";
}

/**
 * Format VND equivalent of a USD price.
 * Example: formatVndEquivalent(10) → "~260.000 VND"
 */
export function formatVndEquivalent(usdPrice: number): string {
    const vnd = Math.round((usdPrice || 0) * USD_TO_VND_RATE);
    return `~${new Intl.NumberFormat("vi-VN").format(vnd)} VND`;
}

export function parsePrice(priceString: string): number {
    const cleaned = priceString.replace(/[^\d.-]/g, "");
    return Number.parseFloat(cleaned) || 0;
}
