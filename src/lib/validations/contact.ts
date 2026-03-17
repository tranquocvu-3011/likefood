/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { z } from "zod";

/**
 * Contact form validation schemas
 */

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không được quá 100 ký tự")
    .trim(),
  email: z
    .string()
    .email("Email không hợp lệ")
    .min(5)
    .max(255)
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(val.replace(/\D/g, "")),
      { message: "Số điện thoại không hợp lệ" }
    ),
  subject: z
    .string()
    .min(5, "Chủ đề phải có ít nhất 5 ký tự")
    .max(200, "Chủ đề không được quá 200 ký tự")
    .trim(),
  message: z
    .string()
    .min(10, "Nội dung phải có ít nhất 10 ký tự")
    .max(5000, "Nội dung không được quá 5000 ký tự")
    .trim(),
  turnstileToken: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * Newsletter subscription validation
 */
export const newsletterSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .min(5)
    .max(255)
    .toLowerCase()
    .trim(),
  turnstileToken: z.string().optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
