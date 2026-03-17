/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { z } from 'zod';
import { positiveNumberSchema } from './common';

/**
 * Coupon validation schemas
 */

// Coupon query parameters
export const couponQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    isActive: z.coerce.boolean().optional(),
});

// Base coupon object schema (used for .partial() in update)
const couponBaseSchema = z.object({
    code: z.string()
        .min(3, 'Mã giảm giá phải có ít nhất 3 ký tự')
        .max(50, 'Mã giảm giá không được quá 50 ký tự')
        .toUpperCase(),
    description: z.string().max(500).optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.coerce.number()
        .min(0, 'Giá trị giảm không được âm'),
    minOrderValue: positiveNumberSchema.optional().nullable(),
    maxDiscount: positiveNumberSchema.optional().nullable(),
    usageLimit: z.coerce.number().int().min(1).optional().nullable(),
    usagePerUser: z.coerce.number().int().min(1).default(1),
    startDate: z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        { message: 'Ngày bắt đầu không hợp lệ' }
    ),
    endDate: z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        { message: 'Ngày kết thúc không hợp lệ' }
    ),
    isActive: z.coerce.boolean().default(true),
    category: z.string().default("all"),
});

// Create coupon schema with cross-field validation
export const createCouponSchema = couponBaseSchema.superRefine((data, ctx) => {
    // PERCENTAGE discountValue must be 0-100
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.too_big,
            maximum: 100,
            type: 'number',
            inclusive: true,
            origin: 'number',
            message: 'Giảm giá theo phần trăm không được vượt quá 100%',
            path: ['discountValue'],
        });
    }
    // endDate must be after startDate
    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Ngày kết thúc phải sau ngày bắt đầu',
            path: ['endDate'],
        });
    }
});

// Update coupon schema — uses base schema (without superRefine) so .partial() works
export const updateCouponSchema = couponBaseSchema.partial();

// Validate coupon code (user)
export const validateCouponSchema = z.object({
    code: z.string().min(3).max(50).toUpperCase(),
});

// Export types
export type CouponQueryInput = z.infer<typeof couponQuerySchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
