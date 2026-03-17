/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { z } from 'zod';
import { cuidSchema, phoneSchema, emailSchema, positiveNumberSchema } from './common';

/**
 * Order validation schemas
 * Used for creating orders, updating status, and filtering
 */

// Shipping address schema
export const shippingAddressSchema = z.object({
    recipientName: z
        .string()
        .min(2, 'Tên người nhận phải có ít nhất 2 ký tự')
        .max(100, 'Tên người nhận không được quá 100 ký tự')
        .trim(),

    recipientPhone: phoneSchema,

    recipientEmail: emailSchema.optional(),

    street: z
        .string()
        .min(5, 'Địa chỉ phải có ít nhất 5 ký tự')
        .max(200, 'Địa chỉ không được quá 200 ký tự')
        .trim(),

    ward: z
        .string()
        .min(1, 'Vui lòng chọn phường/xã')
        .max(100)
        .trim(),

    district: z
        .string()
        .min(1, 'Vui lòng chọn quận/huyện')
        .max(100)
        .trim(),

    city: z
        .string()
        .min(1, 'Vui lòng chọn tỉnh/thành phố')
        .max(100)
        .trim(),

    note: z
        .string()
        .max(500, 'Ghi chú không được quá 500 ký tự')
        .trim()
        .optional(),

    isDefault: z.boolean().default(false),
});

// Order item schema
export const orderItemSchema = z.object({
    productId: cuidSchema,
    variantId: cuidSchema.optional().nullable(),
    quantity: z.coerce
        .number()
        .int('Số lượng phải là số nguyên')
        .min(1, 'Số lượng tối thiểu là 1')
        .max(999, 'Số lượng không hợp lệ'),
    price: z.coerce
        .number()
        .positive('Giá phải là số dương'),
    note: z.string().max(500).trim().optional(),
});

// Payment method enum
export const paymentMethodEnum = z.enum([
    'COD',          // Cash on delivery
    'BANK',         // Bank transfer
    'MOMO',         // MoMo wallet
    'PAYPAL',       // PayPal
    'STRIPE',       // Stripe (credit card)
]);

// Create order schema
export const createOrderSchema = z.object({
    items: z
        .array(orderItemSchema)
        .min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm')
        .max(100, 'Đơn hàng không được quá 100 sản phẩm'),

    shippingAddress: shippingAddressSchema,

    paymentMethod: paymentMethodEnum,

    voucherCode: z
        .string()
        .max(50)
        .trim()
        .toUpperCase()
        .optional(),

    note: z
        .string()
        .max(1000, 'Ghi chú không được quá 1000 ký tự')
        .trim()
        .optional(),

    usePoints: z.boolean().default(false),
});

/**
 * Create order schema dành riêng cho body mà frontend hiện tại đang gửi
 * (được dùng ở API route /api/orders – sau đó server sẽ tự tính lại giá từ DB).
 *
 * productId: dùng z.string() thay vì cuidSchema vì cart items có thể dùng
 * composite ID (productId_variantId) hoặc CUID tùy cách add to cart.
 */
export const createOrderRequestSchema = z.object({
    items: z
        .array(z.object({
            productId: z.string().min(1, 'Product ID is required'),
            variantId: z.string().optional().nullable(),
            quantity: z.coerce
                .number()
                .int('Số lượng phải là số nguyên')
                .min(1, 'Số lượng tối thiểu là 1')
                .max(999, 'Số lượng không hợp lệ'),
            // Các field name/sku/price từ client chỉ để hiển thị, không dùng cho tính tiền
            name: z.string().max(255).optional().nullable(),
            sku: z.string().max(255).optional().nullable(),
        }))
        .min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm')
        .max(100, 'Đơn hàng không được quá 100 sản phẩm'),

    shippingAddress: z
        .string()
        .min(5, 'Địa chỉ phải có ít nhất 5 ký tự')
        .max(200, 'Địa chỉ không được quá 200 ký tự')
        .trim(),

    shippingCity: z
        .string()
        .max(100, 'Thành phố không được quá 100 ký tự')
        .trim()
        .optional()
        .nullable(),

    shippingZipCode: z
        .string()
        .max(20, 'Mã bưu điện không được quá 20 ký tự')
        .trim()
        .optional()
        .nullable(),

    shippingPhone: phoneSchema,

    shippingMethod: z
        .enum(['standard', 'express', 'overnight'])
        .default('standard')
        .optional(),

    paymentMethod: paymentMethodEnum.optional(),

    couponCode: z
        .string()
        .max(50)
        .trim()
        .optional()
        .nullable(),

    discount: z.coerce.number().min(0, 'Giảm giá không hợp lệ').optional().default(0),

    shippingFee: z.coerce.number().min(0, 'Phí vận chuyển không hợp lệ').optional().default(0),

    notes: z
        .string()
        .max(1000, 'Ghi chú không được quá 1000 ký tự')
        .trim()
        .optional()
        .nullable(),

    idempotencyKey: z
        .string()
        .max(200, 'Idempotency key không được quá 200 ký tự')
        .optional()
        .nullable(),

    pointsToUse: z.coerce
        .number()
        .int()
        .min(0, 'Số điểm không hợp lệ')
        .optional()
        .default(0),
});

// Update order status schema
export const updateOrderStatusSchema = z.object({
    orderId: cuidSchema,
    status: z.enum([
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPING',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED',
    ]),
    note: z.string().max(500).trim().optional(),
});

// Guest order schema (for users not logged in)
export const guestOrderSchema = z.object({
    items: z
        .array(z.object({
            productId: z.string().min(1, 'Product ID is required'),
            variantId: z.string().optional().nullable(),
            quantity: z.coerce
                .number()
                .int('Số lượng phải là số nguyên')
                .min(1, 'Số lượng tối thiểu là 1')
                .max(999, 'Số lượng không hợp lệ'),
        }))
        .min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm')
        .max(100, 'Đơn hàng không được quá 100 sản phẩm'),

    guestEmail: emailSchema,

    guestName: z
        .string()
        .min(2, 'Tên phải có ít nhất 2 ký tự')
        .max(100, 'Tên không được quá 100 ký tự')
        .trim()
        .optional()
        .nullable(),

    shippingAddress: z
        .string()
        .min(5, 'Địa chỉ phải có ít nhất 5 ký tự')
        .max(200, 'Địa chỉ không được quá 200 ký tự')
        .trim(),

    shippingCity: z
        .string()
        .max(100, 'Thành phố không được quá 100 ký tự')
        .trim()
        .optional()
        .nullable(),

    shippingZipCode: z
        .string()
        .max(20, 'Mã bưu điện không được quá 20 ký tự')
        .trim()
        .optional()
        .nullable(),

    shippingPhone: phoneSchema,

    shippingMethod: z
        .enum(['standard', 'express', 'overnight'])
        .default('standard')
        .optional(),

    paymentMethod: paymentMethodEnum.optional(),

    couponCode: z
        .string()
        .max(50)
        .trim()
        .optional()
        .nullable(),

    notes: z
        .string()
        .max(1000, 'Ghi chú không được quá 1000 ký tự')
        .trim()
        .optional()
        .nullable(),
});

// Cancel order schema
export const cancelOrderSchema = z.object({
    orderId: cuidSchema,
    reason: z
        .string()
        .min(5, 'Lý do hủy phải có ít nhất 5 ký tự')
        .max(500, 'Lý do hủy không được quá 500 ký tự')
        .trim(),
});

// Order filter schema
export const orderFilterSchema = z.object({
    userId: cuidSchema.optional(),
    status: z
        .enum([
            'PENDING',
            'CONFIRMED',
            'PROCESSING',
            'SHIPPING',
            'DELIVERED',
            'CANCELLED',
            'REFUNDED',
        ])
        .optional(),
    paymentMethod: paymentMethodEnum.optional(),
    minTotal: z.coerce.number().positive().optional(),
    maxTotal: z.coerce.number().positive().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(['createdAt', 'total', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return data.endDate >= data.startDate;
        }
        return true;
    },
    {
        message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
        path: ['endDate'],
    }
);

// Export types
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateOrderRequestInput = z.infer<typeof createOrderRequestSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
