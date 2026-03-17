"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, RefreshCw, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/context";

function VerifyPendingContent() {
    const { t, isVietnamese } = useLanguage();
    const tr = (viText: string, enKey: string) => (isVietnamese ? viText : t(enKey));
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email") || "";

    const [countdown, setCountdown] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!email) {
            router.push("/register");
        }
    }, [email, router]);

    useEffect(() => {
        if (countdown <= 0) {
            setCanResend(true);
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResend = useCallback(async () => {
        if (!canResend || isResending) return;
        setIsResending(true);
        try {
            const res = await fetch("/api/auth/resend-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setResendSuccess(true);
                setCountdown(60);
                setCanResend(false);
                toast.success(tr("Mã xác thực mới đã được gửi!", "auth.verificationCodeResent"));
            } else {
                toast.error(t("auth.resend2FAFailed"));
            }
        } catch {
            toast.error(t("auth.connErrorTryAgain"));
        } finally {
            setIsResending(false);
        }
    }, [canResend, isResending, email]); // eslint-disable-line react-hooks/exhaustive-deps

    const emailDomain = email.split("@")[1]?.toLowerCase() || "";
    const gmailUrl = "https://mail.google.com";
    const outlookUrl = "https://outlook.live.com";

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-slate-100 p-10 text-center"
                >
                    {/* Animated envelope */}
                    <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="relative mx-auto w-28 h-28 mb-8"
                    >
                        <div className="w-28 h-28 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                            <Mail className="w-14 h-14 text-white" />
                        </div>
                        {resendSuccess && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-white"
                            >
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Floating dots animation */}
                    <div className="flex justify-center gap-2 mb-8">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                            />
                        ))}
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-3">
                        {t("auth.checkInbox")}
                    </h1>
                    <p className="text-slate-500 text-base font-medium leading-relaxed mb-2">
                        {t("auth.sentCodeTo")}
                    </p>
                    <p className="text-emerald-600 font-black text-lg mb-6 break-all">
                        {email}
                    </p>
                    <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                        {t("auth.checkInboxDesc")}
                    </p>

                    {/* Quick email links */}
                    <div className="flex gap-3 mb-8">
                        {(emailDomain.includes("gmail") || !emailDomain) && (
                            <a
                                href={gmailUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-sm font-bold text-slate-600 hover:text-emerald-700"
                            >
                                <ExternalLink className="w-4 h-4" /> {t("auth.openGmail")}
                            </a>
                        )}
                        {(emailDomain.includes("outlook") || emailDomain.includes("hotmail") || !emailDomain) && (
                            <a
                                href={outlookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-sm font-bold text-slate-600 hover:text-blue-700"
                            >
                                <ExternalLink className="w-4 h-4" /> {t("auth.openOutlook")}
                            </a>
                        )}
                    </div>

                    {/* Resend button */}
                    <button
                        onClick={handleResend}
                        disabled={!canResend || isResending}
                        className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isResending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> {t("auth.sending")}</>
                        ) : canResend ? (
                            <><RefreshCw className="w-4 h-4" /> {t("auth.resendEmail")}</>
                        ) : (
                            <><RefreshCw className="w-4 h-4" /> {t("auth.resendIn")} {countdown}s</>
                        )}
                    </button>

                    {/* OTP entry shortcut */}
                    <Link
                        href={`/resend-verify?email=${encodeURIComponent(email)}&step=otp`}
                        className="mt-4 w-full py-3 rounded-2xl border-2 border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> {tr("Đã có mã OTP? Nhập mã tại đây", "auth.alreadyHaveOtp")}
                    </Link>

                    <p className="mt-6 text-xs text-slate-400 font-medium">
                        {t("auth.wrongEmail")}{" "}
                        <Link href="/register" className="text-emerald-600 font-bold hover:underline">
                            {t("auth.registerAgain")}
                        </Link>
                        {" "} / {" "}
                        <Link href="/login" className="text-emerald-600 font-bold hover:underline">
                            {t("auth.login")}
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

export default function VerifyPendingPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
            <VerifyPendingContent />
        </Suspense>
    );
}
