"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

// Tracking Events Utility for eCommerce Analytics
// Following Google Analytics 4 eCommerce event structure

type TrackingEvent =
    | 'view_home'
    | 'view_item_list'
    | 'view_item'
    | 'search'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'view_cart'
    | 'begin_checkout'
    | 'add_shipping_info'
    | 'add_payment_info'
    | 'purchase'
    | 'select_item'
    | 'select_promotion'
    | 'filter_apply'
    | 'sort_apply';

type EventParams = Record<string, unknown>;

type TrackingItem = {
    item_id: string;
    item_name: string;
    price?: number;
    quantity?: number;
    item_category?: string;
};

export function trackEvent(eventName: TrackingEvent, params?: EventParams) {
    if (typeof window === 'undefined') return;

    try {
        // DEV: chỉ log ra console, KHÔNG ghi localStorage để tránh giật lag khi filter/sort nhiều lần
        if (process.env.NODE_ENV === 'development') {
            console.log(`[TRACKING] ${eventName}`, params || {});
            return;
        }

        // PROD: gửi sự kiện đến GA4/custom backend; không spam localStorage nữa
        if (typeof window.gtag !== 'undefined') {
            window.gtag('event', eventName, params);
        }
    } catch (error) {
        console.error('Tracking error:', error);
    }
}

// Helper functions for common events
export const tracking = {
    viewHome: () => trackEvent('view_home'),

    viewItemList: (category?: string, searchTerm?: string) => trackEvent('view_item_list', {
        item_list_name: category || 'All Products',
        search_term: searchTerm
    }),

    viewItem: (productId: number, productName: string, price: number, category: string) => trackEvent('view_item', {
        items: [{
            item_id: productId,
            item_name: productName,
            price,
            item_category: category
        }]
    }),

    search: (searchTerm: string, resultsCount: number) => trackEvent('search', {
        search_term: searchTerm,
        results_count: resultsCount
    }),

    addToCart: (productId: number, productName: string, price: number, quantity: number) => trackEvent('add_to_cart', {
        items: [{
            item_id: productId,
            item_name: productName,
            price,
            quantity
        }],
        value: price * quantity
    }),

    removeFromCart: (productId: number, productName: string, price: number, quantity: number) => trackEvent('remove_from_cart', {
        items: [{
            item_id: productId,
            item_name: productName,
            price,
            quantity
        }]
    }),

    viewCart: (totalValue: number, itemCount: number) => trackEvent('view_cart', {
        value: totalValue,
        item_count: itemCount
    }),

    beginCheckout: (totalValue: number, items: TrackingItem[]) => trackEvent('begin_checkout', {
        value: totalValue,
        items
    }),

    purchase: (orderId: number, totalValue: number, items: TrackingItem[]) => trackEvent('purchase', {
        transaction_id: orderId,
        value: totalValue,
        items
    }),

    selectItem: (productId: number, productName: string, listName: string) => trackEvent('select_item', {
        items: [{
            item_id: productId,
            item_name: productName
        }],
        item_list_name: listName
    }),

    selectPromotion: (promotionId: string, promotionName: string) => trackEvent('select_promotion', {
        promotion_id: promotionId,
        promotion_name: promotionName
    }),

    filterApply: (filterType: string, filterValue: string) => trackEvent('filter_apply', {
        filter_type: filterType,
        filter_value: filterValue
    }),

    sortApply: (sortType: string) => trackEvent('sort_apply', {
        sort_type: sortType
    })
};

// Type for window.gtag
declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}
