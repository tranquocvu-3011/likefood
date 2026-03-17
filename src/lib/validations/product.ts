/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { z } from 'zod';
import { cuidSchema, positiveNumberSchema, slugSchema, urlSchema } from './common';

/**
 * Product validation schemas
 */

// Product query parameters
export const productQuerySchema = z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: positiveNumberSchema.optional(),
    maxPrice: positiveNumberSchema.optional(),
    search: z.string().optional(),
    featured: z.coerce.boolean().optional(),
    inStock: z.coerce.boolean().optional(),
    ratingGte: positiveNumberSchema.optional(),
    tags: z.string().optional(),
    freeShipping: z.coerce.boolean().optional(),
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'popular', 'name', 'best-selling', 'top-rated']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    isOnSale: z.coerce.boolean().optional(),
});

// Product slug parameter
export const productSlugSchema = z.object({
    slug: slugSchema,
});

// Product variant ID parameter
export const productVariantIdSchema = z.object({
    productId: cuidSchema,
    variantId: cuidSchema,
});

// Create product schema (admin)
export const createProductSchema = z.object({
    name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự').max(200),
    slug: slugSchema,
    description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
    price: positiveNumberSchema.min(0.01, 'Giá phải lớn hơn 0'),
    salePrice: positiveNumberSchema.optional(),
    categoryId: cuidSchema.optional().nullable(),
    brandId: cuidSchema.optional().nullable(),
    inventory: z.coerce.number().int().min(0, 'Tồn kho không được âm').default(0),
    isActive: z.boolean().default(true),
    isOnSale: z.boolean().default(false),
    saleStartAt: z.string().datetime().optional().nullable(),
    saleEndAt: z.string().datetime().optional().nullable(),
    sku: z.string().max(100).optional().nullable(),
    weight: positiveNumberSchema.optional().nullable(),
    dimensions: z.object({
        length: positiveNumberSchema.optional(),
        width: positiveNumberSchema.optional(),
        height: positiveNumberSchema.optional(),
    }).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).default([]),
    specifications: z.record(z.string(), z.string()).optional(),
});

// Update product schema (admin)
export const updateProductSchema = createProductSchema.partial().extend({
    // At least one field must be provided is handled at route level
});

// Product image schema
export const productImageSchema = z.object({
    url: urlSchema,
    alt: z.string().max(200).optional().nullable(),
    isPrimary: z.boolean().default(false),
});

// Product variant schema
export const productVariantSchema = z.object({
    sku: z.string().max(100).optional().nullable(),
    priceAdjustment: z.coerce.number().int().default(0),
    stock: z.coerce.number().int().min(0, 'Tồn kho không được âm').default(0),
    weight: positiveNumberSchema.optional().nullable(),
    flavor: z.string().max(50).optional().nullable(),
    color: z.string().max(50).optional().nullable(),
    size: z.string().max(50).optional().nullable(),
});

// Export types
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type ProductSlugInput = z.infer<typeof productSlugSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
