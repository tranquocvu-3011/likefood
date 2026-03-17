/**
 * LIKEFOOD - Commerce & Business Logic Tests
 */

import { describe, it, expect } from "vitest";

// Test order status machine constants
const ORDER_STATUS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
} as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: ["refunded"],
    cancelled: [],
    refunded: [],
};

function canTransition(from: string, to: string): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

function calculateDiscount(
    subtotal: number,
    coupon: { type: "PERCENT" | "FIXED"; value: number; minOrder: number } | null
): number {
    if (!coupon) return 0;
    if (subtotal < coupon.minOrder) return 0;
    
    if (coupon.type === "PERCENT") {
        return Math.round((subtotal * coupon.value) / 100 * 100) / 100;
    }
    return Math.min(coupon.value, subtotal);
}

function calculateShipping(subtotal: number, freeShippingThreshold: number, baseFee: number): number {
    if (subtotal >= freeShippingThreshold) return 0;
    return baseFee;
}

function calculatePoints(amount: number, pointsPerDollar: number): number {
    return Math.floor(amount * pointsPerDollar);
}

describe("Commerce - Order Status Machine", () => {
    it("should allow pending → confirmed transition", () => {
        expect(canTransition("pending", "confirmed")).toBe(true);
    });

    it("should allow pending → cancelled transition", () => {
        expect(canTransition("pending", "cancelled")).toBe(true);
    });

    it("should NOT allow pending → delivered transition", () => {
        expect(canTransition("pending", "delivered")).toBe(false);
    });

    it("should NOT allow cancelled → any transition", () => {
        expect(canTransition("cancelled", "confirmed")).toBe(false);
        expect(canTransition("cancelled", "processing")).toBe(false);
    });

    it("should NOT allow refunded → any transition", () => {
        expect(canTransition("refunded", "pending")).toBe(false);
    });

    it("should follow full happy path", () => {
        expect(canTransition("pending", "confirmed")).toBe(true);
        expect(canTransition("confirmed", "processing")).toBe(true);
        expect(canTransition("processing", "shipped")).toBe(true);
        expect(canTransition("shipped", "delivered")).toBe(true);
    });

    it("should allow delivered → refunded", () => {
        expect(canTransition("delivered", "refunded")).toBe(true);
    });
});

describe("Commerce - Discount Calculation", () => {
    it("should return 0 when no coupon", () => {
        expect(calculateDiscount(100, null)).toBe(0);
    });

    it("should return 0 when subtotal below minOrder", () => {
        expect(calculateDiscount(50, { type: "PERCENT", value: 10, minOrder: 99 })).toBe(0);
    });

    it("should calculate percentage discount correctly", () => {
        expect(calculateDiscount(100, { type: "PERCENT", value: 10, minOrder: 50 })).toBe(10);
        expect(calculateDiscount(250, { type: "PERCENT", value: 15, minOrder: 100 })).toBe(37.5);
    });

    it("should calculate fixed discount correctly", () => {
        expect(calculateDiscount(100, { type: "FIXED", value: 20, minOrder: 50 })).toBe(20);
    });

    it("should cap fixed discount at subtotal", () => {
        expect(calculateDiscount(10, { type: "FIXED", value: 20, minOrder: 5 })).toBe(10);
    });
});

describe("Commerce - Shipping Calculation", () => {
    it("should return 0 for free shipping threshold", () => {
        expect(calculateShipping(100, 99, 10)).toBe(0);
    });

    it("should return base fee below threshold", () => {
        expect(calculateShipping(50, 99, 10)).toBe(10);
    });

    it("should return 0 at exact threshold", () => {
        expect(calculateShipping(99, 99, 10)).toBe(0);
    });
});

describe("Commerce - Points Calculation", () => {
    it("should calculate points correctly", () => {
        expect(calculatePoints(100, 1)).toBe(100);
        expect(calculatePoints(50.5, 2)).toBe(101);
    });

    it("should floor partial points", () => {
        expect(calculatePoints(33.33, 1)).toBe(33);
    });

    it("should return 0 for $0 order", () => {
        expect(calculatePoints(0, 1)).toBe(0);
    });
});

describe("Commerce - Input Validation", () => {
    function validateOrderInput(data: {
        items?: unknown[];
        shippingAddress?: string;
    }): string | null {
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            return "Cart items are required";
        }
        if (!data.shippingAddress || typeof data.shippingAddress !== "string") {
            return "Shipping address is required";
        }
        return null;
    }

    it("should reject empty items", () => {
        expect(validateOrderInput({ items: [], shippingAddress: "123 St" })).toBe("Cart items are required");
    });

    it("should reject missing address", () => {
        expect(validateOrderInput({ items: [{ id: 1 }], shippingAddress: "" })).toBe("Shipping address is required");
    });

    it("should accept valid input", () => {
        expect(validateOrderInput({ items: [{ id: 1 }], shippingAddress: "123 Main St" })).toBeNull();
    });
});
