/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * PAY-004: Order Status State Machine
 * Validates order status transitions to prevent invalid state changes.
 * Synced with ORDER_STATUS in commerce.ts
 */

import { ORDER_STATUS, type OrderStatus } from "./commerce";

// ─── Allowed Order Transitions ───────────────────────────────
// Key = current status, Value = allowed next statuses
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPING", "CANCELLED"],
    SHIPPING: ["DELIVERED", "CANCELLED"],
    DELIVERED: ["COMPLETED", "REFUNDED"],
    COMPLETED: ["REFUNDED"],
    CANCELLED: [],  // Terminal
    REFUNDED: [],   // Terminal
};

// ─── Payment Status Transitions ──────────────────────────────
export const PAYMENT_STATUSES = [
    "UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    UNPAID: ["PENDING", "PAID", "FAILED"],
    PENDING: ["PAID", "FAILED"],
    PAID: ["REFUNDED", "PARTIALLY_REFUNDED"],
    FAILED: ["PENDING", "PAID"],
    REFUNDED: [],
    PARTIALLY_REFUNDED: ["REFUNDED"],
};

// ─── Validation Functions ────────────────────────────────────

/**
 * Check if an order status transition is valid
 */
export function isValidOrderTransition(
    from: string,
    to: string
): { valid: boolean; reason?: string } {
    const fromStatus = from as OrderStatus;
    const toStatus = to as OrderStatus;

    if (!ORDER_TRANSITIONS[fromStatus]) {
        return { valid: false, reason: `Trạng thái hiện tại không hợp lệ: "${from}"` };
    }
    if (!ORDER_TRANSITIONS[toStatus] && toStatus !== toStatus) {
        return { valid: false, reason: `Trạng thái mới không hợp lệ: "${to}"` };
    }
    if (from === to) {
        return { valid: false, reason: `Đơn hàng đã ở trạng thái "${from}"` };
    }

    const allowed = ORDER_TRANSITIONS[fromStatus];
    if (!allowed || !allowed.includes(toStatus)) {
        return {
            valid: false,
            reason: `Không thể chuyển từ "${from}" sang "${to}". Hợp lệ: ${(allowed || []).join(", ") || "(không có)"}`,
        };
    }
    return { valid: true };
}

/**
 * Check if a payment status transition is valid
 */
export function isValidPaymentTransition(
    from: string,
    to: string
): { valid: boolean; reason?: string } {
    if (from === to) return { valid: true }; // Idempotent for webhooks

    const allowed = PAYMENT_TRANSITIONS[from as PaymentStatus];
    if (!allowed) {
        return { valid: false, reason: `Trạng thái thanh toán không hợp lệ: "${from}"` };
    }
    if (!allowed.includes(to as PaymentStatus)) {
        return {
            valid: false,
            reason: `Không thể chuyển thanh toán từ "${from}" sang "${to}". Hợp lệ: ${allowed.join(", ") || "(không có)"}`,
        };
    }
    return { valid: true };
}

/**
 * Get available next statuses for an order
 */
export function getAvailableTransitions(status: string): OrderStatus[] {
    return [...(ORDER_TRANSITIONS[status as OrderStatus] || [])];
}

/**
 * Check if order is in a terminal state
 */
export function isTerminalStatus(status: string): boolean {
    const transitions = ORDER_TRANSITIONS[status as OrderStatus];
    return transitions !== undefined && transitions.length === 0;
}

export { ORDER_STATUS };
