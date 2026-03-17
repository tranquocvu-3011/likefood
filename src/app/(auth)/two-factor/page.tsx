"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

function TwoFactorContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email") || "";
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!email) { router.push("/login"); return; }
        inputRefs.current[0]?.focus();
    }, [email, router]);

    useEffect(() => {
        if (countdown <= 0) { setCanResend(true); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleOtpChange = (index: number, value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(-1);
        const newOtp = [...otp];
        newOtp[index] = cleaned;
        setOtp(newOtp);
        if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
        if (newOtp.every(v => v)) handleVerify(newOtp.join(""));
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split("");
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
            handleVerify(pasted);
        }
    };

    const handleVerify = async (code?: string) => {
        const finalOtp = code || otp.join("");
        if (finalOtp.length !== 6) return;
        setIsVerifying(true);
        try {
            const res = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: finalOtp }),
            });
            await res.json();
            if (res.ok) {
                toast.success(t("auth.verify2FASuccess"));
                router.push(callbackUrl);
            } else {
                toast.error(t("auth.invalidOTP2FA"));
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch {
            toast.error(t("auth.connErrorTryAgain"));
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setIsResending(true);
        try {
            const res = await fetch("/api/auth/2fa/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                toast.success(t("auth.newOTP2FASent"));
                setCountdown(60);
                setCanResend(false);
            } else {
                toast.error(t("auth.resend2FAFailed"));
            }
        } catch {
            toast.error(t("auth.connError"));
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30"
                >
                    <Shield className="w-10 h-10 text-white" />
                </motion.div>

                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">
                    {t("auth.twoFactorAuthTitle")}
                </h1>
                <p className="text-slate-500 font-medium mb-1">
                    {t("auth.enter6Digits2FA")}
                </p>
                <p className="text-emerald-600 font-black mb-8">{email}</p>

                {/* OTP Input */}
                <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                        <motion.input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 * i }}
                            className={`w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all ${digit
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={() => handleVerify()}
                    disabled={isVerifying || otp.join("").length !== 6}
                    className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
                >
                    {isVerifying ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("auth.verifying2FA")}</> : t("auth.confirm2FA")}
                </button>

                <button
                    onClick={handleResend}
                    disabled={!canResend || isResending}
                    className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors mx-auto disabled:opacity-40"
                >
                    <RefreshCw className="w-4 h-4" />
                    {canResend ? t("auth.resend2FA") : `${t("auth.resend2FAIn")} ${countdown}s`}
                </button>

                <div className="mt-8 pt-6 border-t border-slate-50">
                    <Link href="/login" className="text-xs text-slate-400 font-medium hover:text-emerald-600">
                        ← {t("auth.backToLogin3")}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function TwoFactorPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
            <TwoFactorContent />
        </Suspense>
    );
}
