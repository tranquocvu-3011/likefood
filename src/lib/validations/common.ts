/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { z } from 'zod';

/**
 * Common validation schemas used across the application
 * Provides reusable validators for email, phone, URL, and slug formats
 */

// Email validation - supports standard email format
export const emailSchema = z
    .string()
    .email('Email không hợp lệ')
    .min(5, 'Email phải có ít nhất 5 ký tự')
    .max(255, 'Email không được quá 255 ký tự')
    .toLowerCase()
    .trim();

// Phone number validation
// Supports Vietnamese (0xxx, +84xxx, 84xxx) and international formats (+1xxx, etc.)
export const phoneSchema = z
    .string()
    .min(7, 'Số điện thoại phải có ít nhất 7 ký tự')
    .max(20, 'Số điện thoại không được quá 20 ký tự')
    .regex(
        /^\+?[\d\s\-().]{7,20}$/,
        'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)'
    )
    .trim();

// URL validation - supports http, https
export const urlSchema = z
    .string()
    .url('URL không hợp lệ')
    .max(2048, 'URL không được quá 2048 ký tự')
    .trim();

// Slug validation - lowercase, numbers, hyphens only
export const slugSchema = z
    .string()
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug chỉ được chứa chữ thường, số và dấu gạch ngang'
    )
    .min(1, 'Slug không được để trống')
    .max(200, 'Slug không được quá 200 ký tự')
    .trim();

// Optional email (for forms where email is not required)
export const optionalEmailSchema = emailSchema.optional().or(z.literal(''));

// Optional phone (for forms where phone is not required)
export const optionalPhoneSchema = phoneSchema.optional().or(z.literal(''));

// CUID validation (for Prisma IDs)
export const cuidSchema = z
    .string()
    .cuid('ID không hợp lệ')
    .trim();

// Positive integer validation
export const positiveIntSchema = z.coerce
    .number()
    .int('Phải là số nguyên')
    .positive('Phải là số dương');

// Positive number validation (includes decimals)
export const positiveNumberSchema = z.coerce
    .number()
    .positive('Phải là số dương');

// Pagination schema
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
});

// Date range schema
export const dateRangeSchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
}).refine(
    (data) => data.endDate > data.startDate,
    {
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
        path: ['endDate'],
    }
);
