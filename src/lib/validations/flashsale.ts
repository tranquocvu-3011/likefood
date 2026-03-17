/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

// Flash Sale Validation Schemas
import { z } from 'zod';
import { positiveNumberSchema, positiveIntSchema } from './common';

/**
 * Flash sale validation schemas
 * For creating and managing flash sale campaigns
 */

// Create flash sale schema
export const createFlashSaleSchema = z.object({
    name: z
        .string()
        .min(3, 'Tên chương trình phải có ít nhất 3 ký tự')
        .max(200, 'Tên chương trình không được quá 200 ký tự')
        .trim(),

    description: z
        .string()
        .max(1000, 'Mô tả không được quá 1000 ký tự')
        .trim()
        .optional(),

    startAt: z.coerce.date(),

    endAt: z.coerce.date(),

    isActive: z.boolean().default(true),
}).refine(
    (data) => data.endAt > data.startAt,
    {
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
        path: ['endAt'],
    }
);

// Update flash sale schema
export const updateFlashSaleSchema = createFlashSaleSchema.partial();

// Add product to flash sale schema
export const addProductToFlashSaleSchema = z.object({
    productId: positiveIntSchema,

    flashSalePrice: positiveNumberSchema,

    stockLimit: positiveIntSchema
        .max(100000, 'Giới hạn stock không được quá 100,000')
        .optional()
        .nullable(),

    maxPerCustomer: positiveIntSchema
        .max(99, 'Tối đa 99 sản phẩm mỗi khách')
        .optional()
        .nullable(),
}).refine(
    () => {
        // Note: This validation requires async product fetch
        // In API route, you should manually check:
        // flashSalePrice must be < product.price
        return true;
    }
);

// Remove product from flash sale schema
export const removeProductFromFlashSaleSchema = z.object({
    flashSaleId: positiveIntSchema,
    productId: positiveIntSchema,
});

// Flash sale filter schema
export const flashSaleFilterSchema = z.object({
    status: z.enum(['upcoming', 'active', 'ended', 'all']).default('all'),
    search: z.string().trim().optional(),
    sortBy: z.enum(['startAt', 'endAt', 'name']).default('startAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Export types
export type CreateFlashSaleInput = z.infer<typeof createFlashSaleSchema>;
export type UpdateFlashSaleInput = z.infer<typeof updateFlashSaleSchema>;
export type AddProductToFlashSaleInput = z.infer<typeof addProductToFlashSaleSchema>;
export type RemoveProductFromFlashSaleInput = z.infer<typeof removeProductFromFlashSaleSchema>;
export type FlashSaleFilterInput = z.infer<typeof flashSaleFilterSchema>;
