/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

type NotificationType = "order" | "promo" | "system";

interface CreateNotificationParams {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, link } = params;

    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
                isRead: false,
            },
        });
        return notification;
    } catch (error) {
        logger.error("Error creating notification", error as Error, { context: "notifications" });
        return null;
    }
}

export async function createOrderNotification(
    userId: number,
    orderId: number,
    status: string,
    total?: number
) {
    const statusMessages: Record<string, { title: string; message: string }> = {
        PENDING: {
            title: "Đơn hàng đã được đặt",
            message: `Đơn hàng #${String(orderId).slice(-8).toUpperCase()} của bạn đã được đặt thành công${total ? `. Tổng tiền: $${total.toFixed(2)}` : ""}.`,
        },
        CONFIRMED: {
            title: "Đơn hàng đã xác nhận",
            message: `Đơn hàng #${String(orderId).slice(-8).toUpperCase()} đã được xác nhận và đang chuẩn bị.`,
        },
        PROCESSING: {
            title: "Đơn hàng đang chuẩn bị",
            message: `Đơn hàng #${String(orderId).slice(-8).toUpperCase()} đang được đóng gói để giao cho bạn.`,
        },
        SHIPPING: {
            title: "Đơn hàng đang giao",
            message: `Đơn hàng #${String(orderId).slice(-8).toUpperCase()} đang trên đường giao đến bạn.`,
        },
        DELIVERED: {
            title: "Đơn hàng đã giao",
            message: `Đơn hàng #${String(orderId).slice(-8).toUpperCase()} đã được giao thành công.`,
        },
        COMPLETED: {
            title: "Đơn hàng hoàn thành",
            message: `Đơn hàng #${String(orderId).slice(-8).toUpperCase()} đã hoàn tất. Cảm ơn bạn!`,
        },
        CANCELLED: {
            title: "Đơn hàng đã hủy",
            message: `Đơn hàng #${String(orderId).slice(-8).toUpperCase()} đã bị hủy.`,
        },
        REFUNDED: {
            title: "Đơn hàng đã hoàn tiền",
            message: `Khoản hoàn tiền cho đơn hàng #${String(orderId).slice(-8).toUpperCase()} đã được xử lý.`,
        },
    };

    const statusInfo = statusMessages[status] || {
        title: "Cập nhật đơn hàng",
        message: `Đơn hàng #${String(orderId).slice(-8).toUpperCase()} đã được cập nhật trạng thái.`,
    };

    return createNotification({
        userId,
        type: "order",
        title: statusInfo.title,
        message: statusInfo.message,
        link: "/profile/orders",
    });
}

export async function createPromoNotification(
    userId: number,
    couponCode: string,
    discount: string,
    expiryDate?: string
) {
    return createNotification({
        userId,
        type: "promo",
        title: `Mã giảm giá mới: ${couponCode}`,
        message: `Chúc mừng! Bạn nhận được mã giảm giá ${discount}${expiryDate ? `. Hạn sử dụng: ${expiryDate}` : ""}.`,
        link: "/vouchers",
    });
}

export async function createWelcomeNotification(userId: number) {
    return createNotification({
        userId,
        type: "system",
        title: "Chào mừng đến LIKEFOOD!",
        message: "Cảm ơn bạn đã đăng ký tài khoản. Nhận ngay voucher LIKEFOOD10 giảm 10% cho đơn đầu tiên!",
        link: "/vouchers",
    });
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        await prisma.notification.update({
            where: { id: Number(notificationId) },
            data: { isRead: true },
        });
        return true;
    } catch (error) {
        logger.error("Error marking notification as read", error as Error, { context: "notifications" });
        return false;
    }
}

export async function markAllNotificationsAsRead(userId: number) {
    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return true;
    } catch (error) {
        logger.error("Error marking all notifications as read", error as Error, { context: "notifications" });
        return false;
    }
}

export async function getUnreadCount(userId: number): Promise<number> {
    try {
        return await prisma.notification.count({
            where: { userId, isRead: false },
        });
    } catch (error) {
        logger.error("Error getting unread count", error as Error, { context: "notifications" });
        return 0;
    }
}
