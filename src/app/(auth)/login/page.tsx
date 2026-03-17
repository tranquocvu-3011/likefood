"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License   
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, Suspense, useEffect, useRef } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Lock, Mail, Loader2, CheckCircle2, AlertCircle,
    ChefHat, ShieldCheck, Zap, Star, Eye, EyeOff
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isValidEmailFormat } from "@/lib/validation";
import { CaptchaField } from "@/components/auth/CaptchaField";
import { useLanguage } from "@/lib/i18n/context";

function LoginContent() {
    const { t, isVietnamese } = useLanguage();
    const tr = (viText: string, enKey: string) => (isVietnamese ? viText : t(enKey));
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState(false);
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");
    // 2FA state for admin
    const [show2FA, setShow2FA] = useState(false);
    const [otp, setOtp] = useState("");
    const [isVerifying2FA, setIsVerifying2FA] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const router = useRouter();
    const searchParams = useSearchParams();
    const raw = searchParams.get("callbackUrl") || "/";
    // Security: prevent open redirect — only allow relative same-origin paths
    const callbackUrl = (raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) ? raw : "/";
    const message = searchParams.get("message");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setUnverifiedEmail(false);

        if (!isValidEmailFormat(email)) {
            setError(t('auth.invalidEmail'));
            setIsLoading(false);
            return;
        }

        if (!isCaptchaValid) {
            setError(tr("Vui lòng hoàn thành xác thực bảo mật.", "auth.completeSecurityCheck"));
            setIsLoading(false);
            return;
        }

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
                rememberMe: rememberMe ? "true" : "false",
                captchaToken: turnstileToken,
            });

            if (result?.error) {
                const err = result.error;
                if (err === "EMAIL_NOT_VERIFIED") {
                    setUnverifiedEmail(true);
                    setError(t('auth.emailNotVerified'));
                } else if (err === "2FA_REQUIRED") {
                    await fetch("/api/auth/2fa/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                    });
                    setShow2FA(true);
                    setResendCooldown(60);
                    // Clear any existing timer first
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = setInterval(() => {
                        setResendCooldown((prev) => {
                            if (prev <= 1) {
                                if (timerRef.current) clearInterval(timerRef.current);
                                timerRef.current = null;
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                    setIsLoading(false);
                    return;
                } else if (err.startsWith("CAPTCHA_FAILED:")) {
                    setError(err.replace("CAPTCHA_FAILED:", ""));
                } else if (err === "CredentialsSignin" || err === "INVALID_CREDENTIALS") {
                    setError(t('auth.wrongCredentials'));
                } else {
                    // Show full error for unknown errors (helps debugging)
                    setError(err);
                }
            } else {
                setIsSuccess(true);
                setTimeout(() => {
                    router.push(callbackUrl);
                    router.refresh();
                }, 2000);
            }
        } catch {
            setError(t('auth.connError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying2FA(true);
        setOtpError("");

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
                otp,
                rememberMe: rememberMe ? "true" : "false",
                captchaToken: turnstileToken,
            });

            if (result?.error) {
                setOtpError(result.error === "2FA_REQUIRED" ? t("auth.enter6Digits2FA") : t("auth.invalidOTP2FA"));
            } else {
                setIsSuccess(true);
                setTimeout(() => {
                    router.push(callbackUrl);
                    router.refresh();
                }, 2000);
            }
        } catch {
            setOtpError(t('auth.connErrorTryAgain'));
        } finally {
            setIsVerifying2FA(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        try {
            await fetch("/api/auth/2fa/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            setResendCooldown(60);
            // Clear any existing timer first
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        timerRef.current = null;
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch {
            // Silently fail
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
                                <ShieldCheck className="w-3 h-3 fill-emerald-500" /> {tr("Cộng đồng ẩm thực sạch", "auth.cleanFoodCommunity")}
                            </div>
                            <h2 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter uppercase">
                                {t("auth.enjoy")} <br />
                                <span className="text-emerald-500">{t("auth.originalValue")}</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">{t('auth.loginWelcomeDesc')}</p>
                        </motion.div>

                        <div className="mt-16 grid grid-cols-2 gap-8">
                            {[
                                { icon: ShieldCheck, title: t("auth.clearOrigin"), desc: t("auth.traditionalArtisans") },
                                { icon: Zap, title: t("auth.expressDelivery"), desc: t("auth.doorToDoor") },
                                { icon: Star, title: t("auth.fiveStarStandard"), desc: t("auth.authenticReview") },
                                { icon: ChefHat, title: t("auth.elegantGift"), desc: t("auth.luxuriousPackaging") }
                            ].map((item, index) => (
                                <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }} className="space-y-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-emerald-100">
                                        <item.icon className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <h4 className="text-slate-900 font-extrabold text-[10px] uppercase tracking-widest">{item.title}</h4>
                                    <p className="text-slate-400 text-[10px] leading-relaxed font-medium">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
                            &copy; 2026 LIKEFOOD &bull; by Tran Quoc Vu
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white px-6 py-8 sm:p-12 lg:p-20 relative shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10">
                <div className="w-full max-w-[420px]">
                    {isSuccess ? (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-8 py-10">
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-50">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{t("auth.loginGreeting")}</h1>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed">{t('auth.loginSuccessDesc')}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className="text-center lg:text-left mb-8 sm:mb-10">
                                <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                                        <ChefHat className="w-6 h-6" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tighter">LIKE<span className="text-emerald-500">FOOD</span></span>
                                </Link>
                                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">{t('auth.login')}</h1>
                                <p className="text-slate-400 font-medium text-sm">{t('auth.loginPrompt')}</p>
                            </div>

                            <div className="space-y-6">
                                {show2FA ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                        <div className="text-center space-y-2">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <h2 className="text-xl font-black text-slate-900 uppercase">{t("auth.twoFactorAuthTitle")}</h2>
                                            <p className="text-sm text-slate-500 font-medium">
                                                {tr("Nhập mã xác thực đã được gửi đến email", "auth.twoFactorCodeSentToEmail")}<br />
                                                <span className="font-bold text-slate-700">{email}</span>
                                            </p>
                                        </div>

                                        {otpError && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold flex items-center gap-3">
                                                <AlertCircle className="w-4 h-4 shrink-0" /> {otpError}
                                            </motion.div>
                                        )}

                                        <form onSubmit={handleVerify2FA} className="space-y-4">
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                                    className="w-full px-6 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold text-center text-2xl tracking-[0.5em]"
                                                    placeholder="------"
                                                    autoComplete="one-time-code"
                                                />
                                            </div>

                                            <Button disabled={isVerifying2FA || otp.length !== 6} type="submit" className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                                                {isVerifying2FA ? <Loader2 className="w-6 h-6 animate-spin" /> : t('auth.confirm2FA')}
                                            </Button>

                                            <div className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={handleResendOTP}
                                                    disabled={resendCooldown > 0}
                                                    className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors disabled:cursor-not-allowed"
                                                >
                                                    {resendCooldown > 0 ? `${t('auth.resend2FAIn')} ${resendCooldown}s` : t('auth.resend2FA')}
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => { setShow2FA(false); setOtp(""); setOtpError(""); signOut({ callbackUrl: "/login" }); }}
                                                className="w-full py-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {"<- "}{t("auth.backToLogin3")}
                                            </button>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {(error || message) && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={cn("p-4 rounded-2xl text-[11px] font-bold flex items-center gap-3 border",
                                                error ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-700")}>
                                                <AlertCircle className="w-4 h-4 shrink-0" /> {error || message}
                                            </motion.div>
                                        )}

                                        {unverifiedEmail && (
                                            <button
                                                type="button" onClick={() => router.push(`/resend-verify?email=${encodeURIComponent(email)}`)}
                                                className="w-full py-4 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200"
                                            >
                                                {t('auth.resendVerifyEmail')}
                                            </button>
                                        )}

                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                                <input
                                                    type="email" required value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    autoComplete="email"
                                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                                    placeholder={t('auth.emailPlaceholder')}
                                                />
                                            </div>
                                            <div className="relative group">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                                <input
                                                    type={showPassword ? "text" : "password"} required value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    autoComplete="current-password"
                                                    className="w-full pl-14 pr-12 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                                    placeholder={t('auth.password')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors p-1"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2 cursor-pointer select-none group">
                                                <input
                                                    type="checkbox" id="remember" checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                                                />
                                                <label htmlFor="remember" className="text-xs text-slate-500 font-medium group-hover:text-slate-900 cursor-pointer">{t('auth.rememberMe')}</label>
                                            </div>
                                            <Link href="/forgot-password" title={t('auth.forgotPassword')} className="text-xs font-bold text-emerald-600 hover:underline">{t('auth.forgotPassword')}</Link>
                                        </div>

                                        <div className="py-2">
                                            <CaptchaField onToken={setTurnstileToken} onValidChange={setIsCaptchaValid} />
                                        </div>

                                        <Button disabled={isLoading || !isCaptchaValid} type="submit" className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="flex items-center gap-2">{t('auth.login')}</span>}
                                        </Button>

                                        <div className="relative my-8">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-slate-100" />
                                            </div>
                                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                                                <span className="px-4 text-slate-400 bg-white">{tr("Hoặc", "auth.or")}</span>
                                            </div>
                                        </div>

                                            <button
                                            type="button"
                                            onClick={() => signIn("google", { callbackUrl: "/" })}
                                            className="w-full h-14 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all outline-none focus:ring-4 focus:ring-slate-100 shadow-sm"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            {tr("Tiếp tục với Google", "auth.continueWithGoogle")}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => router.push("/magic-link")}
                                            className="w-full h-14 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all outline-none focus:ring-4 focus:ring-slate-100 shadow-sm mt-3"
                                        >
                                            <Mail className="w-5 h-5 text-emerald-500" />
                                            {t('auth.loginWithMagicLink')}
                                        </button>

                                        <p className="text-center text-sm text-slate-500 font-medium">
                                            {tr("Bạn mới tham gia?", "auth.newHere")} <Link href="/register" className="text-emerald-600 font-bold hover:underline">{t('auth.registerNow')}</Link>
                                        </p>
                                    </form>
                                )}
                            </div>
                        </>
                    )}

                    <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        <span>&copy; 2026 LIKEFOOD by Tran Quoc Vu</span>
                        <div className="flex gap-4">
                            <Link href="/policies/terms" className="hover:text-emerald-500 transition-colors">{t('auth.footerTerms')}</Link>
                            <Link href="/policies/privacy" className="hover:text-emerald-500 transition-colors">{t('auth.footerPrivacy')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex h-32 w-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
