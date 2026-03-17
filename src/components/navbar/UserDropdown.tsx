"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Package, Heart, Ticket, Settings, LogOut, Crown, ChevronRight, Loader2, Sparkles, UserPlus } from "lucide-react";
import { signOut } from "next-auth/react";
import { logger } from "@/lib/logger";
import Image from "next/image";
import DailyCheckIn from "@/components/shared/DailyCheckIn";
import { useLanguage } from "@/lib/i18n/context";

interface UserDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}

interface UserStats {
    orders: number;
    wishlist: number;
    vouchers: number;
}

export default function UserDropdown({ isOpen, onClose, user }: UserDropdownProps) {
    const { t } = useLanguage();
    const isAdminUser = user.role === "ADMIN" || user.role === "ADMIN";
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    // Fetch real user stats when dropdown opens
    const fetchStats = useCallback(async () => {
        try {
            setIsLoadingStats(true);
            const res = await fetch("/api/user/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            logger.warn("Failed to fetch user stats", { context: 'user-dropdown', error: error as Error });
            // Fallback to default values
            setStats({ orders: 0, wishlist: 0, vouchers: 0 });
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && !stats) {
            fetchStats();
        }
    }, [fetchStats, isOpen, stats]);

    useEffect(() => {
        setAvatarError(false);
    }, [user.image]);

    const menuItems = [
        { icon: Package, label: t("navbar.myOrders"), href: "/profile/orders", badge: null },
        { icon: Heart, label: t("navbar.myWishlist"), href: "/profile/wishlist", badge: stats?.wishlist ? String(stats.wishlist) : null },
        { icon: UserPlus, label: t("navbar.referral"), href: "/profile/referrals", badge: null },
        { icon: Sparkles, label: t("navbar.dailyCheckIn"), onClick: () => setIsCheckInOpen(true), badge: null },
        { icon: Ticket, label: t("navbar.myVouchers"), href: "/profile/vouchers", badge: stats?.vouchers ? String(stats.vouchers) : null },
        { icon: Settings, label: t("navbar.accountSettings"), href: "/profile", badge: null },
    ];

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60]"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-[calc(100%+12px)] right-0 xl:-right-12 w-[340px] bg-white/95 backdrop-blur-3xl border border-slate-100 rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.15)] z-[999] overflow-hidden"
                    >
                        {/* User Header */}
                        <div className="p-5 bg-gradient-to-r from-emerald-50 to-cyan-50 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                                    {user.image && !avatarError ? (
                                        <Image
                                            src={user.image}
                                            alt="Avatar"
                                            fill
                                            className="object-cover"
                                            sizes="56px"
                                            unoptimized
                                            onError={() => setAvatarError(true)}
                                        />
                                    ) : (
                                        <Image src="/images/default-avatar.png" alt="Avatar" fill className="object-cover" sizes="56px" unoptimized />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-[14px] font-black text-slate-900 truncate">{user.name || t("navbar.customer")}</h4>
                                        {isAdminUser && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black rounded-full flex items-center gap-1">
                                                <Crown className="w-2.5 h-2.5" />
                                                ADMIN
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 truncate">{user.email}</p>
                                </div>
                            </div>

                            {/* Quick Stats - Real data */}
                            <div className="flex items-center gap-3 mt-4">
                                {isLoadingStats ? (
                                    <div className="flex-1 flex items-center justify-center py-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 p-2.5 bg-white rounded-2xl text-center border border-slate-100/50">
                                            <div className="text-[14px] font-black text-primary">{stats?.orders ?? 0}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">{t("navbar.statsOrders")}</div>
                                        </div>
                                        <div className="flex-1 p-2.5 bg-white rounded-2xl text-center border border-slate-100/50">
                                            <div className="text-[14px] font-black text-primary">{stats?.wishlist ?? 0}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">{t("navbar.statsWishlist")}</div>
                                        </div>
                                        <div className="flex-1 p-2.5 bg-white rounded-2xl text-center border border-slate-100/50">
                                            <div className="text-[14px] font-black text-primary">{stats?.vouchers ?? 0}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">{t("navbar.statsVouchers")}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-3">
                            {isAdminUser && (
                                <Link
                                    href="/admin/dashboard"
                                    prefetch={false}
                                    onClick={onClose}
                                    className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-all mb-2 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-sm">
                                            <Crown className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-[12px] font-black text-emerald-700 uppercase tracking-wider">{t("navbar.adminPortal")}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}

                            {menuItems.map((item, idx) => {
                                const Content = (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-2xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                <item.icon className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-[12px] font-bold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.badge && (
                                                <span className={`px-2 py-0.5 ${item.label.includes('Điểm danh') ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'} text-[9px] font-black rounded-full`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </>
                                );

                                if (item.onClick) {
                                    return (
                                        <button
                                            key={idx}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                item.onClick?.();
                                            }}
                                            className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                                        >
                                            {Content}
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href!}
                                        onClick={onClose}
                                        className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-all group"
                                    >
                                        {Content}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Logout */}
                        <div className="p-3 pt-0">
                            <button
                                onClick={() => {
                                    onClose();
                                    signOut();
                                }}
                                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-wider">{t("navbar.logout")}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Daily Check-in Modal — Portal to body to escape stacking context */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isCheckInOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                                onClick={() => setIsCheckInOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="relative w-full max-w-md z-[10000]"
                            >
                                <DailyCheckIn onClose={() => setIsCheckInOpen(false)} />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
