"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowRight, Home, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminVerifyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const hasSentInitialRef = useRef(false);

    // Auto-redirect when switching tabs if already verified in another tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && status === "authenticated" && session?.user?.role === "ADMIN") {
                fetch("/api/auth/admin-verify", { method: "GET", credentials: "include" })
                    .then(res => res.ok ? res.json() : null)
                    .then(data => {
                        if (data?.verified) {
                            router.replace("/admin/dashboard");
                        }
                    })
                    .catch(() => {});
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [status, session, router]);

    const sendOTP = async () => {
        if (!session?.user?.email || cooldown > 0) return;

        setIsSending(true);
        setError("");

        try {
            const res = await fetch("/api/auth/2fa/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: session.user.email }),
            });

            if (res.ok) {
                toast.success("Mã bảo vệ đã được gửi đến email của bạn.");
                setCooldown(60);
                const timer = setInterval(() => {
                    setCooldown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error("Không thể gửi mã. Vui lòng thử lại sau.");
            }
        } catch {
            toast.error("Lỗi kết nối.");
        } finally {
            setIsSending(false);
        }
    };

    // Auth check + verify check + auto-send OTP (sequential)
    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/admin/login");
        } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
            router.replace("/");
        } else if (status === "authenticated" && session?.user?.role === "ADMIN") {
            // Check if already verified FIRST → redirect to dashboard
            // Only send OTP if NOT already verified
            if (hasSentInitialRef.current) return;
            hasSentInitialRef.current = true;

            fetch("/api/auth/admin-verify", { method: "GET", credentials: "include" })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.verified) {
                        router.replace("/admin/dashboard");
                    } else {
                        // Not verified yet → send OTP
                        sendOTP();
                    }
                })
                .catch(() => {
                    sendOTP();
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, session, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length < 6) {
            setError("Mã xác thực phải gồm 6 ký tự.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/admin-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Đã xác thực danh tính Quản trị viên.");
                // Hard-reload thay vì router.push để Next.js lấy Session Cookie mới nhất
                window.location.href = "/admin/dashboard";
            } else {
                setError(data.error || "Mã xác thực không đúng.");
            }
        } catch (err) {
            setError("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-900">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
        );
    }

    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "ADMIN")) {
        return null; // Will be redirected by useEffect
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-zinc-900 overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-emerald-500 opacity-20 blur-[100px]"></div>
            </div>

            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
                <Link href="/">
                    <Button variant="ghost" className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/20 px-5 h-12 gap-2 backdrop-blur-md transition-all group">
                        <Home className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-wide pr-1">Quay lại trang chủ</span>
                    </Button>
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Neon Glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[2.5rem] blur opacity-20 animate-pulse"></div>

                <div className="relative bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden text-white w-full">
                    {/* Header Top Section */}
                    <div className="relative flex flex-col items-center justify-center py-10 px-8 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent"></div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] mb-6 shadow-2xl shadow-emerald-500/30"
                        >
                            <div className="w-full h-full rounded-[1.4rem] bg-zinc-900 flex items-center justify-center">
                                <ShieldAlert className="w-10 h-10 text-emerald-400" />
                            </div>
                        </motion.div>
                        <h1 className="relative text-3xl font-black tracking-tight text-white mb-3 drop-shadow-sm">
                            Bảo Vệ Phiên Quản Trị
                        </h1>
                        <p className="relative text-emerald-100/70 text-sm font-medium leading-relaxed px-4">
                            Khu vực nhạy cảm cấp S. Vui lòng cung cấp mã xác thực danh tính để tiếp tục tiến trình.
                        </p>
                    </div>

                    <div className="p-8 pb-10 pt-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex gap-4 items-start backdrop-blur-md"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Mail className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-[13px] text-zinc-300 leading-relaxed font-medium">
                                    Mã bảo vệ gồm <strong className="text-white">6 ký tự</strong> đã được điều phối tới email <span className="text-emerald-400 font-bold break-all">{session.user.email}</span>
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3 relative">
                                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400/80 ml-1">
                                    Mã PIN Truy Cập
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.toUpperCase())}
                                        className="w-full h-16 text-center text-[28px] font-black tracking-[0.6em] bg-black/20 border-2 border-white/5 rounded-2xl focus:border-emerald-500 focus:bg-black/40 focus:ring-4 focus:ring-emerald-500/20 transition-all uppercase text-white placeholder:text-white/10 outline-none shadow-inner"
                                        placeholder="••••••"
                                        disabled={isLoading}
                                        required
                                    />
                                    {error && (
                                        <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute -bottom-8 left-0 right-0 text-[13px] font-bold text-red-500 text-center drop-shadow-md">
                                            {error}
                                        </motion.p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 mt-4 text-[15px] font-black tracking-wide rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-500/20 transition-all border-none"
                                disabled={isLoading || otp.length < 6}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                ) : (
                                    <span className="flex items-center">
                                        Ủy Quyền Truy Cập <ArrowRight className="w-5 h-5 ml-2" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 text-center pt-6 border-t border-white/10">
                            <p className="text-[11px] font-black text-zinc-500 mb-4 uppercase tracking-[0.2em]">Chưa Nhận Được Mã?</p>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full h-12 rounded-xl border border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white font-bold transition-all text-sm"
                                onClick={sendOTP}
                                disabled={isSending || cooldown > 0}
                            >
                                {isSending ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : cooldown > 0 ? (
                                    `Khóa Tín Hiệu (${cooldown}s)`
                                ) : (
                                    "Yêu Cầu Cấp Mã Mới"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
