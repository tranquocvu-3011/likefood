/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/coupons/seed - One-time seed coupons (ADMIN only)
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const coupons = [
            {
                                code: 'LIKEFOOD10',
                discountType: 'PERCENTAGE',
                discountValue: 10,
                minOrderValue: 0,
                maxDiscount: 50,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                isActive: true,
                usageLimit: 1000,
                usedCount: 0,
            },
            {
                                code: 'FREESHIP50',
                discountType: 'FIXED',
                discountValue: 5,
                minOrderValue: 50,
                maxDiscount: null,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                isActive: true,
                usageLimit: 500,
                usedCount: 0,
            },
            {
                                code: 'FLASH25',
                discountType: 'PERCENTAGE',
                discountValue: 25,
                minOrderValue: 30,
                maxDiscount: 30,
                startDate: new Date('2026-02-01'),
                endDate: new Date('2026-02-28'),
                isActive: true,
                usageLimit: 100,
                usedCount: 0,
            },
            {
                                code: 'DACSAN15',
                discountType: 'PERCENTAGE',
                discountValue: 15,
                minOrderValue: 25,
                maxDiscount: 20,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-06-30'),
                isActive: true,
                usageLimit: 300,
                usedCount: 0,
            },
            {
                                code: 'TETMOI20',
                discountType: 'PERCENTAGE',
                discountValue: 20,
                minOrderValue: 60,
                maxDiscount: 40,
                startDate: new Date('2026-02-01'),
                endDate: new Date('2026-02-28'),
                isActive: true,
                usageLimit: 200,
                usedCount: 0,
            },
        ];

        const results: { code: string; status: string; error?: string }[] = [];

        for (const coupon of coupons) {
            try {
                const existing = await prisma.coupon.findUnique({
                    where: { code: coupon.code }
                });

                if (existing) {
                    results.push({ code: coupon.code, status: 'exists' });
                    continue;
                }

                await prisma.coupon.create({ data: coupon });
                results.push({ code: coupon.code, status: 'created' });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                results.push({ code: coupon.code, status: 'error', error: message });
            }
        }

        return NextResponse.json({
            success: true,
            results,
            message: 'Coupons seeded successfully!'
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

// GET /api/coupons/seed - List all coupons (ADMIN only — contains sensitive usage data)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(coupons);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
