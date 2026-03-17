"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Bell, Package, Tag, Megaphone, CheckCheck, Trash2, Loader2, ChevronRight, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

interface Notification {
    id: number;
    type: "order" | "promo" | "system";
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

import { LucideIcon } from "lucide-react";

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
    order: { icon: Package, color: "bg-blue-500" },
    promo: { icon: Tag, color: "bg-red-500" },
    system: { icon: Megaphone, color: "bg-primary" },
};

export default function NotificationsPage() {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [unreadCount, setUnreadCount] = useState(0);
    const { t, language } = useLanguage();

    const filterOptions = [
        { id: "all", label: t("notifications.filterAll") },
        { id: "unread", label: t("notifications.filterUnread") },
        { id: "order", label: t("notifications.filterOrder") },
        { id: "promo", label: t("notifications.filterPromo") },
        { id: "system", label: t("notifications.filterSystem") },
    ];

    // Format relative time
    function formatRelativeTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return t("notifications.justNow");
        if (diffMins < 60) return `${diffMins} ${t("notifications.minutesAgo")}`;
        if (diffHours < 24) return `${diffHours} ${t("notifications.hoursAgo")}`;
        if (diffDays === 1) return t("notifications.yesterday");
        if (diffDays < 7) return `${diffDays} ${t("notifications.daysAgo")}`;
        return date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US");
    }

    // Group by date
    function groupByDate(notifs: Notification[]): Record<string, Notification[]> {
        const groups: Record<string, Notification[]> = {};
        const locale = language === "vi" ? "vi-VN" : "en-US";

        notifs.forEach(notif => {
            const date = new Date(notif.createdAt);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let dateLabel: string;
            if (date.toDateString() === today.toDateString()) {
                dateLabel = t("notifications.today");
            } else if (date.toDateString() === yesterday.toDateString()) {
                dateLabel = t("notifications.yesterday");
            } else {
                dateLabel = date.toLocaleDateString(locale);
            }

            if (!groups[dateLabel]) groups[dateLabel] = [];
            groups[dateLabel].push(notif);
        });

        return groups;
    }

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!session?.user) return;

        try {
            const res = await fetch(`/api/user/notifications?filter=${activeFilter}`);
            const data = await res.json();

            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            logger.error('Failed to fetch notifications', error as Error, { context: 'notifications-page' });
            toast.error(t("notifications.loadError"));
        } finally {
            setLoading(false);
        }
    }, [session?.user, activeFilter, t]);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login?callbackUrl=/notifications");
            return;
        }

        if (sessionStatus === "authenticated") {
            fetchNotifications();
        }
    }, [sessionStatus, router, fetchNotifications]);

    // Re-fetch when filter changes
    useEffect(() => {
        if (sessionStatus === "authenticated") {
            setLoading(true);
            fetchNotifications();
        }
    }, [activeFilter, sessionStatus, fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/user/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });

            setNotifications(prev =>
                prev.map(n => String(n.id) === String(id) ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            logger.error('Failed to mark as read', error as Error, { context: 'notifications-page' });
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/user/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true })
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success(t("notifications.markedAllRead"));
        } catch (error) {
            logger.error('Failed to mark all as read', error as Error, { context: 'notifications-page' });
            toast.error(t("notifications.errorOccurred"));
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            await fetch('/api/user/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });

            const notif = notifications.find(n => String(n.id) === String(id));
            setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
            if (!notif?.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success(t("notifications.deleted"));
        } catch (error) {
            logger.error('Failed to delete notification', error as Error, { context: 'notifications-page' });
            toast.error(t("notifications.errorOccurred"));
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.isRead) {
            markAsRead(String(notif.id));
        }
        if (notif.link) {
            router.push(notif.link);
        }
    };

    const groupedNotifications = groupByDate(notifications);

    if (sessionStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
                <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-300/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-[150px]" />

                <div className="relative page-container-wide py-12 lg:py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-6">
                            <Bell className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">{t("notifications.latestUpdates")}</span>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full">{unreadCount}</span>
                            )}
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-4">
                            {t("notifications.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">{t("notifications.titleHighlight")}</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            {t("notifications.subtitle")}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="page-container-wide pb-24 -mt-4">
                <div className="w-full">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-8 bg-white rounded-2xl p-4 shadow-lg shadow-slate-100">
                        {/* Filters */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            {filterOptions.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`h-10 px-5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${activeFilter === filter.id
                                        ? "bg-primary text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {filter.label}
                                    {filter.id === "unread" && unreadCount > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-[9px]">{unreadCount}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchNotifications}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-2xl transition-all"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-2 h-10 px-5 text-xs font-bold text-primary hover:bg-primary/10 rounded-2xl transition-all"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t("notifications.markAllRead")}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">{t("notifications.loading")}</p>
                        </div>
                    )}

                    {/* Notifications */}
                    {!loading && Object.keys(groupedNotifications).length > 0 ? (
                        <div className="space-y-8">
                            {Object.entries(groupedNotifications).map(([date, notifs]) => (
                                <div key={date}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-400">{date}</span>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>

                                    <div className="space-y-3">
                                        {notifs.map((notif, index) => {
                                            const config = typeConfig[notif.type] || typeConfig.system;
                                            const IconComponent = config.icon;

                                            return (
                                                <motion.div
                                                    key={notif.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`group relative flex items-start gap-4 p-5 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer ${!notif.isRead ? "ring-2 ring-primary/20" : ""
                                                        }`}
                                                >
                                                    {/* Icon */}
                                                    <div className={`w-12 h-12 rounded-2xl ${config.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                        <IconComponent className="w-6 h-6 text-white" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className={`text-sm font-bold ${!notif.isRead ? "text-slate-900" : "text-slate-600"}`}>
                                                                        {notif.title}
                                                                    </h4>
                                                                    {!notif.isRead && (
                                                                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-500 line-clamp-2">{notif.message}</p>
                                                                <span className="text-[11px] font-medium text-slate-400 mt-2 block">
                                                                    {formatRelativeTime(notif.createdAt)}
                                                                </span>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={(e) => deleteNotification(String(notif.id), e)}
                                                                    className="w-10 h-10 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                                {notif.link && (
                                                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2rem] shadow-xl p-16 text-center"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                                {t("notifications.noNotifications")}
                            </h3>
                            <p className="text-slate-400 font-medium mb-8">
                                {activeFilter === "unread"
                                    ? t("notifications.allRead")
                                    : t("notifications.noInCategory")}
                            </p>
                            {activeFilter === "all" && (
                                <Link href="/products">
                                    <button className="px-8 py-4 bg-primary text-white rounded-full font-black uppercase tracking-widest hover:bg-primary/90 transition-all">
                                        {t("notifications.exploreProducts")}
                                    </button>
                                </Link>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
