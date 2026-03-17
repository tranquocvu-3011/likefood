"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    CheckCircle2, XCircle, Loader2, ArrowRight,
    ChefHat, ShieldCheck, Zap, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useLanguage } from "@/lib/i18n/context";

function VerifyEmailContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const hasToken = Boolean(token);
    const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">(hasToken ? "loading" : "error");
    const [message, setMessage] = useState(hasToken ? "" : t("auth.invalidTokenOrMissing"));

    useEffect(() => {
        if (status === "success") {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#10b981", "#34d399", "#6ee7b7", "#059669"]
            });
        }
    }, [status]);

    useEffect(() => {
        if (!token) return;

        const verifyEmail = async () => {
            try {
                const res = await fetch(`/api/auth/verify-email?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setMessage(t("auth.verifyEmailSuccess"));
                } else {
                    let errStr = t("auth.verifyEmailError");
                    if (data.code === "TOKEN_EXPIRED") {
                        errStr = t("auth.invalidTokenOrExpired");
                        setStatus("expired");
                    } else if (data.code === "INVALID_TOKEN" || data.code === "TOKEN_NOT_FOUND") {
                        errStr = t("auth.invalidTokenOrMissing");
                        setStatus("error");
                    } else {
                        setStatus("error");
                    }
                    setMessage(errStr);
                }
            } catch {
                setStatus("error");
                setMessage(t("auth.connError"));
            }
        };

        verifyEmail();
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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
                                <Star className="w-3 h-3 fill-emerald-500" /> {t("auth.verifyTitle")}
                            </div>
                            <h2 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter uppercase">
                                {t("auth.verifyAlmostDone")} <br />
                                <span className="text-emerald-500">{t("auth.verifyDone")}</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">{t("auth.verifyDesc")}</p>
                        </motion.div>

                        <div className="mt-16 grid grid-cols-2 gap-8">
                            {[
                                { icon: ShieldCheck, title: t("auth.realIdentity"), desc: t("auth.trustComm") },
                                { icon: Zap, title: t("auth.activateGift"), desc: t("auth.newbieOffer") },
                                { icon: Star, title: t("auth.prioritySupport"), desc: t("auth.bestService") },
                                { icon: ChefHat, title: t("auth.fullExperience"), desc: t("auth.unlockApp") }
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
                            {t("auth.safeVerify")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: content */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white p-8 sm:p-12 lg:p-20 relative shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10">
                <div className="w-full max-w-[440px]">
                    <div className="text-center py-4 space-y-8">
                        {status === "loading" && (
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t("auth.verifying")}</h2>
                                <p className="text-slate-500 font-medium">{t("auth.verifyingWait")}</p>
                            </div>
                        )}

                        {status === "success" && (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8">
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-50">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{t("auth.great")}</h2>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed">{message}</p>
                                </div>
                                <Link href="/login" className="block pt-2">
                                    <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-extrabold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200">
                                        {t("auth.loginNowBtn")} <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                            </motion.div>
                        )}

                        {(status === "error" || status === "expired") && (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8">
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm shadow-red-50">
                                        <XCircle className="w-12 h-12 text-red-500" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                                        {status === "expired" ? t("auth.expiredLink") : t("auth.failed")}
                                    </h2>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed">{message}</p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl border-slate-200 font-extrabold uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                                        onClick={() => router.push("/resend-verify")}
                                    >
                                        {t("auth.resendVerifyEmail")}
                                    </Button>
                                    <Link href="/login" className="block text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors">
                                        {t("auth.backToLogin3")}
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </div>

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

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex h-32 w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
