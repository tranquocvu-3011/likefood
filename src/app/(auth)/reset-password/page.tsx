"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Lock, Loader2, ArrowRight, CheckCircle2, AlertCircle,
    ChefHat, ShieldCheck, Zap, Star, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { isStrongPassword } from "@/lib/validation";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/lib/i18n/context";

function ResetPasswordContent() {
    const { t, isVietnamese } = useLanguage();
    const tr = (viText: string, enKey: string) => (isVietnamese ? viText : t(enKey));
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError(t("auth.invalidTokenOTP"));
            return;
        }

        if (password !== confirmPassword) {
            setError(t("auth.passwordMismatch"));
            return;
        }

        if (!isStrongPassword(password)) {
            setError(t("auth.passwordWeak"));
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            if (res.ok) {
                setIsSuccess(true);
            } else {
                await res.json();
                setError(res.status === 400 ? t("auth.invalidTokenOrExpired") : tr("Không thể gửi yêu cầu. Vui lòng thử lại.", "auth.sendFailedTryAgain"));
            }
        } catch {
            setError(t("auth.connError"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side: Branding & Marketing */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-emerald-50">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-emerald-100 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 w-full flex flex-col justify-between p-16 xl:p-24">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                                <ChefHat className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-black text-emerald-900 tracking-tighter uppercase font-display">LIKE<span className="text-emerald-500 not-italic">FOOD</span></span>
                        </Link>
                    </motion.div>

                    <div className="max-w-xl">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3 fill-emerald-500" /> {t("auth.maxSecurity")}
                            </div>
                            <h2 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter uppercase">
                                {t("auth.setupNew")} <br />
                                <span className="text-emerald-500">{t("auth.newPassword")}</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">{t("auth.setupNewDesc")}</p>
                        </motion.div>

                        <div className="mt-16 grid grid-cols-2 gap-8">
                            {[
                                { icon: Lock, title: t("auth.security256"), desc: t("auth.dataSecure") },
                                { icon: Zap, title: t("auth.instantUpdate"), desc: t("auth.loginAfterChange") },
                                { icon: Star, title: t("auth.recommended"), desc: t("auth.useSpecialChars") },
                                { icon: ChefHat, title: t("auth.continueNow"), desc: t("auth.backToShopFast") }
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="space-y-3"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-emerald-100">
                                        <item.icon className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <h4 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest">{item.title}</h4>
                                    <p className="text-slate-400 text-[11px] leading-relaxed font-medium">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            {tr("Chuẩn bảo mật LIKEFOOD Security", "auth.likefoodSecurity")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white p-8 sm:p-12 lg:p-20 relative shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10">
                <div className="w-full max-w-[440px]">
                    {!isSuccess ? (
                        <>
                            <div className="text-center lg:text-left mb-10">
                                <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                                        <ChefHat className="w-6 h-6" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tighter">LIKE<span className="text-emerald-500">FOOD</span></span>
                                </Link>
                                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">{t("auth.setPasswordTitle")}</h1>
                                <p className="text-slate-400 font-medium text-sm">{t("auth.enterNewPassDesc")}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-bold flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                    </motion.div>
                                )}

                                {!token && (
                                    <div className="p-4 bg-orange-50 border border-orange-100 text-orange-600 rounded-2xl text-[11px] font-bold flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {t("auth.missingTokenMsg")}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"} required disabled={!token} value={password}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPassword(val);
                                                let score = 0;
                                                if (val.length > 8) score++;
                                                if (/[A-Z]/.test(val)) score++;
                                                if (/[0-9]/.test(val)) score++;
                                                if (/[^A-Za-z0-9]/.test(val)) score++;
                                                setPasswordStrength(score);
                                            }}
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                            placeholder={t("auth.newPasswordPlaceholder")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors p-1"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className="relative group">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"} required disabled={!token} value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                            placeholder={t("auth.confirmNewPasswordPlaceholder")}
                                        />
                                    </div>

                                    {/* Password Strength Meter */}
                                    {password && (
                                        <div className="px-1 space-y-2">
                                            <div className="flex gap-1 h-1">
                                                {[1, 2, 3, 4].map((s) => (
                                                    <div
                                                        key={s}
                                                        className={twMerge(
                                                            "flex-1 rounded-full transition-all duration-500",
                                                            s <= passwordStrength
                                                                ? passwordStrength <= 1
                                                                    ? "bg-red-400"
                                                                    : passwordStrength <= 3
                                                                        ? "bg-amber-400"
                                                                        : "bg-emerald-500"
                                                                : "bg-slate-100"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                <span className={twMerge(
                                                    passwordStrength <= 1 ? "text-red-500" : passwordStrength <= 3 ? "text-amber-500" : "text-emerald-600"
                                                )}>
                                                    {t("auth.strength")} {passwordStrength <= 1 ? t("auth.weak") : passwordStrength <= 2 ? t("auth.medium") : passwordStrength <= 3 ? t("auth.fair") : t("auth.veryStrong")}
                                                </span>
                                                <span className="text-slate-300">{t("auth.min8Chars")}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button disabled={isLoading || !token} type="submit" className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold uppercase tracking-widest transition-all mt-2 shadow-lg shadow-slate-200">
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="flex items-center gap-2">{t("auth.updatePasswordBtn")} <ArrowRight className="w-4 h-4" /></span>}
                                </Button>

                                <div className="text-center">
                                    <Link href="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors">
                                        {t("auth.cancelAndBack")}
                                    </Link>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-8 py-10">
                            <div className="flex justify-center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-50">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </motion.div>
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">{t("auth.successTitle")}</h1>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed">{t("auth.passwordUpdatedDesc")}</p>
                            </div>
                            <Link href="/login" className="block">
                                <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-extrabold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200">{t("auth.loginNowBtn")}</Button>
                            </Link>
                        </div>
                    )}

                    <div className="mt-16 pt-8 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        <span>&copy; 2026 LIKEFOOD</span>
                        <div className="flex gap-4">
                            <Link href="/policies/terms" className="hover:text-emerald-500 transition-colors">{t("auth.footerTerms")}</Link>
                            <Link href="/policies/privacy" className="hover:text-emerald-500 transition-colors">{t("auth.footerPrivacy")}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex h-32 w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
