"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import { CheckCircle2, Sparkles, X, Trophy, Star, Gift, Flame, Truck, Percent, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/context";

interface CheckInStatus {
    points: number;
    lastCheckIn: string | null;
    canCheckIn: boolean;
    checkedDaysThisWeek: number[]; // 0=Mon...6=Sun
    milestones?: {
        points: number;
        code: string;
        discountType: string;
        discountValue: number;
        maxDiscount: number;
        category: string;
        description: string;
        descriptionEn: string;
        reached: boolean;
        claimed: boolean;
    }[];
}

const DAYS = [
    { label: "T2", points: 10 },
    { label: "T3", points: 10 },
    { label: "T4", points: 10 },
    { label: "T5", points: 10 },
    { label: "T6", points: 10 },
    { label: "T7", points: 20, bonus: true },
    { label: "CN", points: 50, bonus: true },
];

function getWeekDates(): Date[] {
    const now = new Date();
    const dow = now.getDay();
    const daysToMon = dow === 0 ? 6 : dow - 1;
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - daysToMon + i);
        dates.push(d);
    }
    return dates;
}

function getTodayIdx(): number {
    const dow = new Date().getDay();
    return dow === 0 ? 6 : dow - 1;
}

export default function DailyCheckIn({ onClose }: { onClose?: () => void }) {
    const { isVietnamese } = useLanguage();
    const [status, setStatus] = useState<CheckInStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [justCheckedIn, setJustCheckedIn] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/user/checkin");
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch check-in status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setIsCheckingIn(true);
        try {
            const res = await fetch("/api/user/checkin", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                setJustCheckedIn(true);
                toast.success(data.message, {
                    description: isVietnamese
                        ? `Bạn vừa nhận được ${data.earned} LIKEFOOD Xu!`
                        : `You have earned ${data.earned} LIKEFOOD points!`,
                    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
                });
                if (Array.isArray(data.unlockedVouchers) && data.unlockedVouchers.length > 0) {
                    const codes = data.unlockedVouchers.map((item: { code: string }) => item.code).join(", ");
                    toast.success(
                        isVietnamese ? "Đã mở khóa voucher mới" : "New voucher unlocked",
                        {
                            description: isVietnamese
                                ? `Mã nhận được: ${codes}`
                                : `Unlocked codes: ${codes}`,
                        }
                    );
                }
                const todayIdx = getTodayIdx();
                setStatus((prev) => ({
                    points: data.totalPoints,
                    lastCheckIn: data.lastCheckIn,
                    canCheckIn: false,
                    checkedDaysThisWeek: [
                        ...((prev?.checkedDaysThisWeek ?? []).filter((d) => d !== todayIdx)),
                        todayIdx,
                    ],
                    milestones: data.milestones || prev?.milestones || [],
                }));
                // Reset animation after 3s
                setTimeout(() => setJustCheckedIn(false), 3000);
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error(isVietnamese ? "Không thể kết nối máy chủ" : "Unable to connect to server");
        } finally {
            setIsCheckingIn(false);
        }
    };

    const todayIdx = getTodayIdx();
    const weekDates = getWeekDates();
    const checkedSet = new Set(status?.checkedDaysThisWeek ?? []);
    const streakDays = checkedSet.size;

    if (isLoading) return (
        <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100 w-full">
            <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 relative overflow-hidden">
            {/* Confetti particles khi vừa check-in */}
            <AnimatePresence>
                {justCheckedIn && (
                    <>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    opacity: 1,
                                    x: "50%",
                                    y: "40%",
                                    scale: 0,
                                }}
                                animate={{
                                    opacity: [1, 1, 0],
                                    x: `${50 + (Math.random() - 0.5) * 120}%`,
                                    y: `${-20 + Math.random() * 60}%`,
                                    scale: [0, 1.5, 0.5],
                                    rotate: Math.random() * 720,
                                }}
                                transition={{
                                    duration: 1.5 + Math.random(),
                                    ease: "easeOut",
                                    delay: Math.random() * 0.3,
                                }}
                                className="absolute pointer-events-none z-10"
                                style={{
                                    width: 8 + Math.random() * 8,
                                    height: 8 + Math.random() * 8,
                                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                                    background: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][Math.floor(Math.random() * 6)],
                                }}
                            />
                        ))}
                    </>
                )}
            </AnimatePresence>

            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-primary/90 to-emerald-500/90 p-5 pb-6">
                {/* Close */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-white/80" />
                    </button>
                )}

                <div className="flex items-center gap-3 mb-4">
                    <motion.div
                        animate={justCheckedIn ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.6 }}
                        className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                    >
                        <Gift className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                        <h3 className="text-lg font-black text-white leading-tight">
                            {isVietnamese ? "Điểm danh nhận quà" : "Daily check-in rewards"}
                        </h3>
                        <p className="text-[11px] text-white/70 font-medium">
                            {isVietnamese ? "Nhận LIKEFOOD Xu mỗi ngày" : "Collect LIKEFOOD points every day"}
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-300" />
                            <span className="text-lg font-black text-white">{status?.points ?? 0}</span>
                        </div>
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">
                            {isVietnamese ? "Xu hiện có" : "Current points"}
                        </span>
                    </div>
                    <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <Flame className="w-3.5 h-3.5 text-orange-300" />
                            <span className="text-lg font-black text-white">
                                {streakDays > 0 ? streakDays : 0}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">
                            {isVietnamese ? "Ngày liên tiếp" : "Streak days"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 pt-5">
                {/* Week Grid */}
                <div className="grid grid-cols-7 gap-2 mb-5">
                    {DAYS.map((day, idx) => {
                        const isChecked = checkedSet.has(idx);
                        const isToday = idx === todayIdx;
                        const isFuture = idx > todayIdx;
                        const dateNum = weekDates[idx].getDate();

                        return (
                            <motion.div
                                key={idx}
                                initial={false}
                                animate={isChecked && isToday && justCheckedIn ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col items-center gap-1"
                            >
                                {/* Day circle */}
                                <div className={`
                                    w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 border relative
                                    ${isChecked
                                        ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                                        : isToday && status?.canCheckIn
                                            ? "bg-gradient-to-br from-primary to-emerald-500 border-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/20 animate-pulse"
                                            : isToday && !status?.canCheckIn
                                                ? "bg-primary/10 border-primary/30 text-primary"
                                                : day.bonus && isFuture
                                                    ? "bg-amber-50 border-amber-200 text-amber-500"
                                                    : isFuture
                                                        ? "bg-slate-50 border-slate-100 text-slate-300"
                                                        : "bg-slate-50 border-slate-200 text-slate-300"
                                    }
                                `}>
                                    {/* TODAY badge */}
                                    {isToday && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap bg-primary text-white shadow-sm">
                                            {isVietnamese ? "NAY" : "TODAY"}
                                        </span>
                                    )}
                                    {isChecked ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : isToday && status?.canCheckIn ? (
                                        <Star className="w-4 h-4 text-white" fill="white" />
                                    ) : (
                                        <span className="text-[9px] font-black leading-none">
                                            +{day.points}
                                        </span>
                                    )}
                                </div>
                                {/* Day label */}
                                <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                                    {day.label}
                                </span>
                                {/* Date */}
                                <span className={`text-[8px] font-medium ${isToday ? 'text-primary font-bold' : 'text-slate-300'}`}>
                                    {dateNum}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mb-4 text-[9px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/30 inline-block" /> {isVietnamese ? "Đã điểm danh" : "Checked in"}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300 inline-block" /> {isVietnamese ? "Thưởng cuối tuần" : "Weekend bonus"}</span>
                </div>

                {/* Milestone voucher rewards */}
                {(() => {
                    const msList = status?.milestones || [];
                    if (msList.length === 0) return null;
                    const maxPts = msList[msList.length - 1].points;
                    const pctDone = Math.min(((status?.points ?? 0) / maxPts) * 100, 100);
                    const getIcon = (m: typeof msList[0]) => {
                        if (m.category === "shipping") return Truck;
                        if (m.points >= 1000) return Crown;
                        return Percent;
                    };
                    return (
                        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                    {isVietnamese ? "Mốc thưởng voucher" : "Voucher milestones"}
                                </p>
                                <span className="text-[10px] font-bold text-emerald-600">
                                    {isVietnamese ? `${status?.points ?? 0} Xu` : `${status?.points ?? 0} pts`}
                                </span>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="relative h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pctDone}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                                {msList.map((m) => (
                                    <div
                                        key={m.code}
                                        className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border ${
                                            m.reached ? "bg-primary border-white" : "bg-white border-slate-300"
                                        }`}
                                        style={{ left: `${(m.points / maxPts) * 100}%`, transform: "translate(-50%, -50%)" }}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {msList.map((milestone) => {
                                    const reached = milestone.reached;
                                    const claimed = milestone.claimed;
                                    const Icon = getIcon(milestone);
                                    return (
                                        <div
                                            key={milestone.code}
                                            className={`rounded-xl border px-2.5 py-2 flex items-start gap-2 ${
                                                reached ? "border-emerald-300 bg-white" : "border-slate-200 bg-slate-50"
                                            }`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                reached ? "bg-gradient-to-br from-primary/20 to-emerald-100" : "bg-slate-100"
                                            }`}>
                                                <Icon className={`w-3.5 h-3.5 ${reached ? "text-primary" : "text-slate-400"}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-[11px] font-black ${reached ? "text-emerald-700" : "text-slate-500"}`}>
                                                    {milestone.points} {isVietnamese ? "Xu" : "Pts"}
                                                </p>
                                                <p className={`text-[9px] font-bold leading-snug ${reached ? "text-slate-600" : "text-slate-400"}`}>
                                                    {isVietnamese ? milestone.description : milestone.descriptionEn}
                                                </p>
                                                <p className={`mt-0.5 text-[8px] font-bold ${reached ? "text-emerald-600" : "text-slate-400"}`}>
                                                    {claimed
                                                        ? (isVietnamese ? "✓ Đã nhận" : "✓ Claimed")
                                                        : (isVietnamese ? "Chưa mở" : "Locked")}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* CTA Button */}
                <motion.div
                    whileHover={status?.canCheckIn ? { scale: 1.02 } : {}}
                    whileTap={status?.canCheckIn ? { scale: 0.98 } : {}}
                >
                    <Button
                        onClick={handleCheckIn}
                        disabled={!status?.canCheckIn || isCheckingIn}
                        className={`
                            w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg transition-all
                            ${status?.canCheckIn
                                ? "bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-400 shadow-primary/25 text-white"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            }
                        `}
                    >
                        {isCheckingIn ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : status?.canCheckIn ? (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                {isVietnamese
                                    ? `Điểm danh - nhận ${DAYS[todayIdx]?.points ?? 10} Xu`
                                    : `Check in - earn ${DAYS[todayIdx]?.points ?? 10} points`}
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                {isVietnamese ? "Đã hoàn thành hôm nay" : "Completed today"}
                            </span>
                        )}
                    </Button>
                </motion.div>

                <p className="text-center text-[9px] text-slate-400 mt-3 font-medium">
                    {isVietnamese
                        ? <>Mốc voucher: <strong className="text-amber-500">200 / 300 / 500 / 1000 Xu</strong></>
                        : <>Voucher milestones: <strong className="text-amber-500">200 / 300 / 500 / 1000 points</strong></>}
                </p>
            </div>
        </div>
    );
}
