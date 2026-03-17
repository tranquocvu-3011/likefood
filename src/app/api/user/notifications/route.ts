/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '../../../../lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma } from '../../../../generated/client';

// GET /api/user/notifications - Get user's notifications
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    try {
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const VALID_NOTIFICATION_FILTERS = new Set(['all', 'unread', 'order', 'promo', 'system']);
        const rawFilter = searchParams.get('filter') || 'all';
        const filter = VALID_NOTIFICATION_FILTERS.has(rawFilter) ? rawFilter : 'all';
        let page = parseInt(searchParams.get('page') || '1');
        if (isNaN(page) || page < 1) page = 1;
        let limit = parseInt(searchParams.get('limit') || '20');
        if (isNaN(limit) || limit < 1 || limit > 100) limit = 20;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.notificationWhereInput = { userId: Number(session.user.id) };

        if (filter === 'unread') {
            where.isRead = false;
        } else if (filter !== 'all') {
            where.type = filter; // order, promo, system
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { userId: Number(session.user.id), isRead: false }
            })
        ]);

        return NextResponse.json({
            notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            unreadCount
        });

    } catch (error) {
        logger.error('Get notifications error', error as Error, { context: 'user-notifications-api-get', userId: String(Number(session?.user?.id))});
        return NextResponse.json(
            { error: 'Có lỗi xảy ra khi lấy thông báo' },
            { status: 500 }
        );
    }
}

// PATCH /api/user/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);
    try {
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { notificationId, markAll } = await request.json();

        if (markAll) {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId: Number(session.user.id), isRead: false },
                data: { isRead: true }
            });
            return NextResponse.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
        }

        if (notificationId) {
            // Mark single notification as read
            await prisma.notification.updateMany({
                where: {
                    id: Number(notificationId),
                    userId: Number(session.user.id)
                },
                data: { isRead: true }
            });
            return NextResponse.json({ success: true, message: 'Đã đánh dấu là đã đọc' });
        }

        return NextResponse.json(
            { error: 'Thiếu notificationId hoặc markAll' },
            { status: 400 }
        );

    } catch (error) {
        logger.error('Mark notification error', error as Error, { context: 'user-notifications-api-patch', userId: String(Number(session?.user?.id))});
        return NextResponse.json(
            { error: 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}

// DELETE /api/user/notifications - Delete notification
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    try {
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { notificationId } = await request.json();

        if (!notificationId) {
            return NextResponse.json(
                { error: 'Thiếu notificationId' },
                { status: 400 }
            );
        }

        await prisma.notification.deleteMany({
            where: {
                id: Number(notificationId),
                userId: Number(session.user.id)
            }
        });

        return NextResponse.json({ success: true, message: 'Đã xóa thông báo' });

    } catch (error) {
        logger.error('Delete notification error', error as Error, { context: 'user-notifications-api-delete', userId: String(Number(session?.user?.id))});
        return NextResponse.json(
            { error: 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}
