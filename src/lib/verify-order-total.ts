/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * PAY-002: Order Total Server-side Verification
 *
 * Verifies that the Stripe checkout amount matches the computed order total.
 * Use this before creating Stripe session and after webhook payment.
 */

import prisma from "@/lib/prisma";
import { getShippingFeeUsd } from "./commerce";

interface VerificationResult {
    valid: boolean;
    computed: number;
    stored: number;
    difference: number;
    details?: string;
}

/**
 * Verify order total matches computed value from items + shipping - discount
 */
export async function verifyOrderTotal(orderId: number): Promise<VerificationResult> {
    const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: {
            orderItems: {
                include: {
                    product: { select: { price: true, salePrice: true } },
                },
            },
        },
    });

    if (!order) {
        return { valid: false, computed: 0, stored: 0, difference: 0, details: "Order not found" };
    }

    // Compute subtotal from items
    let computedSubtotal = 0;
    for (const item of order.orderItems) {
        const unitPrice = item.product?.salePrice ?? item.product?.price ?? item.price;
        computedSubtotal += unitPrice * item.quantity;
    }

    // Compute shipping
    const shippingFee = order.shippingFee ?? getShippingFeeUsd(computedSubtotal, order.shippingMethod);

    // Compute discount
    const discount = order.discount ?? 0;

    // Compute total
    const computedTotal = Math.round((computedSubtotal + shippingFee - discount) * 100) / 100;
    const storedTotal = order.total;

    // Allow $0.01 tolerance for rounding
    const difference = Math.abs(computedTotal - storedTotal);
    const valid = difference <= 0.01;

    return {
        valid,
        computed: computedTotal,
        stored: storedTotal,
        difference,
        ...(!valid && {
            details: `Computed $${computedTotal} ≠ Stored $${storedTotal} (diff: $${difference.toFixed(2)})`,
        }),
    };
}
