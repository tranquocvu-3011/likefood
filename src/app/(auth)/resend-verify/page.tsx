"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Mail, Loader2, ArrowRight, CheckCircle2, AlertCircle,
    ChefHat, ShieldCheck, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { isValidEmailFormat } from "@/lib/validation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

function ResendVerifyContent() {
    const { t, isVietnamese } = useLanguage();
    const tr = (viText: string, enKey: string) => (isVietnamese ? viText : t(enKey));
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialEmail = searchParams.get("email") || "";
    const initialStep = (searchParams.get("step") === "otp" && initialEmail) ? "otp" : "email";
    const [step, setStep] = useState<"email" | "otp">(initialStep as "email" | "otp");
    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!isValidEmailFormat(email)) {
            setError(t("auth.invalidEmail"));
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/resend-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.alreadyVerified) {
                    // Account is already verified — redirect to login
                    router.push("/login?message=" + encodeURIComponent(tr("Tài khoản đã xác thực. Hãy đăng nhập.", "auth.accountVerifiedLogin")));
                    return;
                }
                setStep("otp");
            } else {
                setError(tr("Không thể gửi yêu cầu. Vui lòng thử lại.", "auth.sendFailedTryAgain"));
            }
        } catch {
            setError(t("auth.connError"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const otpValue = otp.join("").toUpperCase();
        if (otpValue.length < 6) return;

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: otpValue }),
            });

            if (res.ok) {
                setIsSuccess(true);
            } else {
                await res.json();
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
                                <Mail className="w-3 h-3 fill-emerald-500" /> {t("auth.resendVerifyTitle")}
                            </div>
                            <h2 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter uppercase">
                                {step === "email" ? t("auth.receiveCode") : t("auth.enterCode")} <br />
                                <span className="text-emerald-500">{t("auth.confirmEmail")}</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">{t("auth.resendVerifyDesc")}</p>
                        </motion.div>

                        <div className="mt-16 grid grid-cols-2 gap-8">
                            {[
                                { icon: ShieldCheck, title: t("auth.absoluteSafety"), desc: t("auth.verifyOwner") },
                                { icon: Zap, title: t("auth.superiorSpeed"), desc: t("auth.sendCodeInstant") }
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
                            {t("auth.autoActivateSys")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white p-8 sm:p-12 lg:p-20 relative shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10">
                <div className="w-full max-w-[440px]">
                    <AnimatePresence mode="wait">
                        {!isSuccess ? (
                            step === "email" ? (
                                <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="text-center lg:text-left">
                                        <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                                                <ChefHat className="w-6 h-6" />
                                            </div>
                                            <span className="text-xl font-bold tracking-tighter">LIKE<span className="text-emerald-500">FOOD</span></span>
                                        </Link>
                                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">{t("auth.resendVerifyFormTitle")}</h1>
                                        <p className="text-slate-400 font-medium text-sm">{t("auth.resendVerifyFormDesc")}</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-bold flex items-center gap-3">
                                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                            </motion.div>
                                        )}

                                        <div className="relative group">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="email" required value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                                placeholder={t("auth.yourEmail")}
                                            />
                                        </div>

                                        <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold uppercase tracking-widest transition-all shadow-lg shadow-slate-200">
                                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="flex items-center gap-2">{t("auth.sendCodeNow")} <ArrowRight className="w-4 h-4" /></span>}
                                        </Button>

                                        <div className="text-center">
                                            <Link href="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors">
                                                {t("auth.alreadyGotEmailLogin")}
                                            </Link>
                                        </div>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                                    <div className="text-center lg:text-left">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto lg:mx-0 mb-6 border border-emerald-100">
                                            <Mail className="w-8 h-8" />
                                        </div>
                                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">{t("auth.verifyEmailOTP")}</h1>
                                        <p className="text-slate-400 font-medium">{t("auth.sentNewCodeTo")} <br /><span className="text-slate-900 font-bold">{email}</span></p>
                                    </div>

                                    <div className="space-y-6">
                                        {error && (
                                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-bold flex items-center gap-3">
                                                <AlertCircle className="w-4 h-4" /> {error}
                                            </div>
                                        )}

                                        <div className="flex justify-between gap-1.5 sm:gap-2">
                                            {otp.map((char, idx) => (
                                                <input
                                                    key={idx}
                                                    ref={(el) => { otpRefs.current[idx] = el; }}
                                                    type="text"
                                                    maxLength={1}
                                                    value={char}
                                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                                    className="w-full h-14 sm:h-16 text-center text-xl sm:text-2xl font-black bg-slate-50 border-slate-100 border rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all uppercase"
                                                />
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => handleVerifyOTP()}
                                            disabled={isLoading || otp.some(c => !c)}
                                            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest shadow-xl shadow-emerald-100"
                                        >
                                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : t("auth.verifyAccountBtn")}
                                        </Button>

                                        <div className="text-center">
                                            <button onClick={() => setStep("email")} className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 underline underline-offset-4 decoration-slate-200">{t("auth.resendAnotherCode")}</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        ) : (
                            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-8 py-10">
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-50">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">{t("auth.successTitle")}</h1>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed">{t("auth.verifySuccessMsg")}</p>
                                </div>
                                <Link href="/login" className="block">
                                    <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg">{t("auth.loginNowBtn")}</Button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

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

export default function ResendVerifyPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
            <ResendVerifyContent />
        </Suspense>
    );
}
