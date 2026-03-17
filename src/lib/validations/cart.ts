/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { z } from 'zod';
import { cuidSchema } from './common';

/**
 * Cart validation schemas
 * Used for adding items to cart and updating quantities
 */

// Add to cart schema
export const addToCartSchema = z.object({
    productId: cuidSchema,
    variantId: cuidSchema.optional(),
    quantity: z.coerce
        .number()
        .int('Số lượng phải là số nguyên')
        .min(1, 'Số lượng tối thiểu là 1')
        .max(99, 'Số lượng tối đa là 99'),
    note: z
        .string()
        .max(500, 'Ghi chú không được quá 500 ký tự')
        .trim()
        .optional(),
});

// Update cart item schema
export const updateCartItemSchema = z.object({
    quantity: z.coerce
        .number()
        .int('Số lượng phải là số nguyên')
        .min(1, 'Số lượng tối thiểu là 1')
        .max(99, 'Số lượng tối đa là 99'),
    note: z
        .string()
        .max(500, 'Ghi chú không được quá 500 ký tự')
        .trim()
        .optional(),
});

// Remove cart item schema
export const removeCartItemSchema = z.object({
    itemId: cuidSchema,
});

// Clear cart schema (optional userId for admin)
export const clearCartSchema = z.object({
    userId: cuidSchema.optional(),
});

// Apply voucher to cart schema
export const applyVoucherSchema = z.object({
    code: z
        .string()
        .min(1, 'Mã voucher không được để trống')
        .max(50, 'Mã voucher không hợp lệ')
        .trim()
        .toUpperCase(),
});

// Batch add to cart schema (for bulk operations)
export const batchAddToCartSchema = z.object({
    items: z
        .array(
            z.object({
                productId: cuidSchema,
                variantId: cuidSchema.optional(),
                quantity: z.coerce
                    .number()
                    .int()
                    .min(1)
                    .max(99),
            })
        )
        .min(1, 'Phải có ít nhất 1 sản phẩm')
        .max(50, 'Không được thêm quá 50 sản phẩm cùng lúc'),
});

// Export types
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
export type ClearCartInput = z.infer<typeof clearCartSchema>;
export type ApplyVoucherInput = z.infer<typeof applyVoucherSchema>;
export type BatchAddToCartInput = z.infer<typeof batchAddToCartSchema>;
