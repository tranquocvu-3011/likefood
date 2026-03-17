"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Loader2, ArrowRight, AlertCircle, ChefHat, ShieldCheck, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { isValidEmailFormat } from "@/lib/validation";
import { useLanguage } from "@/lib/i18n/context";
import { CaptchaField } from "@/components/auth/CaptchaField";

export default function ForgotPasswordPage() {
    const { t, isVietnamese } = useLanguage();
    const tr = (viText: string, enKey: string) => (isVietnamese ? viText : t(enKey));
    const router = useRouter();
    const [step, setStep] = useState<"email" | "otp">("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!isValidEmailFormat(email)) {
            setError(t("auth.invalidEmail"));
            setIsLoading(false);
            return;
        }

        if (!isCaptchaValid) {
            setError(tr("Vui lòng hoàn thành xác thực bảo mật.", "auth.completeSecurityCheck"));
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, turnstileToken }),
            });

            if (res.ok) {
                setStep("otp");
                setCountdown(60);
            } else {
                const data = await res.json().catch(() => null);
                setError(data?.error || tr("Không thể gửi yêu cầu. Vui lòng thử lại.", "auth.sendFailedTryAgain"));
            }
        } catch {
            setError(t("auth.connError"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length < 6) return;

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: otpValue }),
            });

            const data = await res.json();
            if (res.ok) {
                router.push(`/reset-password?token=${data.resetToken}`);
            } else {
                setError(t("auth.wrongOTP"));
            }
        } catch {
            setError(t("auth.connError"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        const char = value.slice(-1).toUpperCase();
        if (!/^[A-Z0-9]*$/.test(char)) return;

        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);

        if (char && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side: Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-emerald-50 text-emerald-900">
                {/* Visual elements similar to login */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-emerald-100 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 w-full flex flex-col justify-between p-16">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <ChefHat className="w-7 h-7" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase">LIKE<span className="text-emerald-500 not-italic">FOOD</span></span>
                    </Link>

                    <div className="max-w-md">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3" /> {t("auth.protectAccount")}
                            </div>
                            <h2 className="text-5xl font-black leading-tight uppercase tracking-tighter">
                                {step === "email" ? t("auth.recoverIdentity") : t("auth.verifyIdentity")} <br />
                                <span className="text-emerald-500">{t("auth.yourIdentity")}</span>
                            </h2>
                            <p className="text-slate-500 font-medium">{t("auth.useEmailOTP")}</p>
                        </motion.div>
                    </div>

                    <div className="flex gap-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-xl font-black">{tr("6 ký tự", "auth.otpLengthValue")}</span>
                            <span className="text-[10px] font-bold uppercase text-slate-400">{t("auth.otpLength")}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xl font-black text-emerald-600">{tr("30 giây", "auth.avgTimeValue")}</span>
                            <span className="text-[10px] font-bold uppercase text-slate-400">{t("auth.avgTime")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.01)]">
                <div className="w-full max-w-[420px]">
                    <AnimatePresence mode="wait">
                        {step === "email" ? (
                            <motion.div
                                key="email-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center lg:text-left">
                                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">{t("auth.forgotPassword")}</h1>
                                    <p className="text-slate-400 font-medium">{t("auth.rescueEmailInfo")}</p>
                                </div>

                                <form onSubmit={handleSendOTP} className="space-y-6">
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-bold flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="email" required value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                            placeholder={t("auth.enterRescueEmail")}
                                        />
                                    </div>

                                    <div className="py-2">
                                        <CaptchaField onToken={setTurnstileToken} onValidChange={setIsCaptchaValid} />
                                    </div>

                                    <Button disabled={isLoading || !isCaptchaValid} type="submit" className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest shadow-xl shadow-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="flex items-center gap-2">{t("auth.getVerifyCode")} <ArrowRight className="w-4 h-4" /></span>}
                                    </Button>

                                    <div className="text-center">
                                        <Link href="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500">{t("auth.backToLogin2")}</Link>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="otp-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-8"
                            >
                                <div className="text-center lg:text-left">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto lg:mx-0 mb-6 border border-emerald-100">
                                        <Keyboard className="w-8 h-8" />
                                    </div>
                                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">{t("auth.verifyOTPTitle")}</h1>
                                    <p className="text-slate-400 font-medium">{t("auth.enter6Chars1")} <br /><span className="text-slate-900 font-bold">{email}</span></p>
                                </div>

                                <div className="space-y-6">
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-bold flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </div>
                                    )}

                                    <div className="flex justify-between gap-2">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={(el) => { otpRefs.current[idx] = el; }}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                                className="w-full h-16 text-center text-2xl font-black bg-slate-50 border-slate-100 border rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                                            />
                                        ))}
                                    </div>

                                    <Button
                                        onClick={() => handleVerifyOTP()}
                                        disabled={isLoading || otp.some(d => !d)}
                                        className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest shadow-xl shadow-emerald-100"
                                    >
                                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : t("auth.verifyBtn")}
                                    </Button>

                                    <div className="text-center space-y-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {countdown > 0 ? (
                                                <span>{t("auth.resendInOTP")} <span className="text-emerald-500">{countdown}s</span></span>
                                            ) : (
                                                <button onClick={handleSendOTP} className="text-emerald-600 hover:underline">{t("auth.resendNow")}</button>
                                            )}
                                        </p>
                                        <button onClick={() => setStep("email")} className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-slate-500">{t("auth.changeEmail")}</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
