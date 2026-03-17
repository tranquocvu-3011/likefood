/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { z } from 'zod';
import { cuidSchema } from './common';

/**
 * Review validation schemas
 * Used for creating, updating, and filtering product reviews
 */

// Create review schema
export const createReviewSchema = z.object({
    productId: cuidSchema,

    rating: z.coerce
        .number()
        .int('Rating phải là số nguyên')
        .min(1, 'Rating tối thiểu là 1')
        .max(5, 'Rating tối đa là 5'),

    comment: z
        .string()
        .min(10, 'Nhận xét phải có ít nhất 10 ký tự')
        .max(2000, 'Nhận xét không được quá 2000 ký tự')
        .trim(),

    images: z
        .array(z.string().url('URL ảnh không hợp lệ'))
        .max(5, 'Tối đa 5 ảnh')
        .optional()
        .default([]),

    orderId: cuidSchema.optional(), // For verified purchase badge
});

// Update review schema (only comment and images can be updated)
export const updateReviewSchema = z.object({
    reviewId: cuidSchema,

    comment: z
        .string()
        .min(10, 'Nhận xét phải có ít nhất 10 ký tự')
        .max(2000, 'Nhận xét không được quá 2000 ký tự')
        .trim()
        .optional(),

    images: z
        .array(z.string().url('URL ảnh không hợp lệ'))
        .max(5, 'Tối đa 5 ảnh')
        .optional(),
});

// Delete review schema
export const deleteReviewSchema = z.object({
    reviewId: cuidSchema,
});

// Review filter schema
export const reviewFilterSchema = z.object({
    productId: cuidSchema.optional(),
    userId: cuidSchema.optional(),
    rating: z.coerce
        .number()
        .int()
        .min(1)
        .max(5)
        .optional(),
    hasImages: z.boolean().optional(),
    isVerifiedPurchase: z.boolean().optional(),
    sortBy: z.enum(['createdAt', 'rating', 'helpful']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Reply to review schema (for shop owner)
export const replyToReviewSchema = z.object({
    reviewId: cuidSchema,
    reply: z
        .string()
        .min(5, 'Phản hồi phải có ít nhất 5 ký tự')
        .max(1000, 'Phản hồi không được quá 1000 ký tự')
        .trim(),
});

// Mark review as helpful schema
export const markReviewHelpfulSchema = z.object({
    reviewId: cuidSchema,
});

// Report review schema
export const reportReviewSchema = z.object({
    reviewId: cuidSchema,
    reason: z.enum([
        'SPAM',
        'INAPPROPRIATE',
        'FAKE',
        'OFFENSIVE',
        'OTHER',
    ]),
    details: z
        .string()
        .max(500, 'Chi tiết không được quá 500 ký tự')
        .trim()
        .optional(),
});

// Export types
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;
export type ReviewFilterInput = z.infer<typeof reviewFilterSchema>;
export type ReplyToReviewInput = z.infer<typeof replyToReviewSchema>;
export type MarkReviewHelpfulInput = z.infer<typeof markReviewHelpfulSchema>;
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
