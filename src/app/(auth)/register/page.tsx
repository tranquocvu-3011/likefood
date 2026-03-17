"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Lock, Mail, User, Phone, ChevronDown,
    Loader2, ChefHat, ShieldCheck, Zap, AlertCircle,
    Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { signIn } from "next-auth/react";
import { isValidEmailFormat, isDisposableEmail, isStrongPassword } from "@/lib/validation";
import { useLanguage } from "@/lib/i18n/context";
import { CaptchaField } from "@/components/auth/CaptchaField";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const countries = [
    { code: "+84", name: "Vietnam", nameVi: "Việt Nam", flag: "🇻🇳", length: 10 },
    { code: "+1", name: "USA", nameVi: "Hoa Kỳ", flag: "🇺🇸", length: 10 },
];

export default function RegisterPage() {
    const { t, isVietnamese } = useLanguage();
    const tr = (viText: string, enKey: string) => (isVietnamese ? viText : t(enKey));
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [country, setCountry] = useState(countries[0]);
    const [showCountrySelector, setShowCountrySelector] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ràng buộc số điện thoại theo quốc gia
        if (formData.phone.length !== country.length) {
            setError(isVietnamese ? `Số điện thoại ${country.nameVi} phải có đúng ${country.length} chữ số.` : `Phone number for ${country.name} must be exactly ${country.length} digits.`);
            return;
        }

        if (!acceptTerms) {
            setError(t('auth.agreeToTerms'));
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }
        if (!isStrongPassword(formData.password)) {
            setError(t('auth.passwordWeak'));
            return;
        }

        // Frontend Email Validation
        if (!isValidEmailFormat(formData.email)) {
            setError(t("auth.invalidEmail"));
            return;
        }

        if (isDisposableEmail(formData.email)) {
            setError(tr("Chúng tôi không chấp nhận dịch vụ email rác. Vui lòng dùng email thật.", "auth.disposableEmailError"));
            return;
        }

        if (!isCaptchaValid) {
            setError(tr("Vui lòng hoàn thành xác thực bảo mật.", "auth.completeSecurityCheck"));
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const fullPhone = `${country.code}${formData.phone.replace(/^0+/, '')}`;
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: fullPhone,
                    password: formData.password,
                    turnstileToken
                }),
            });
            const data = await res.json();

            if (res.ok && !data.error && (data.ok || data.status === "PENDING_EMAIL_VERIFY")) {
                router.push(`/verify-pending?email=${encodeURIComponent(formData.email)}`);
            } else if (res.ok && data.error) {
                setError(tr("Tài khoản đã tồn tại. Vui lòng đăng nhập hoặc khôi phục mật khẩu.", "auth.accountExistsOrRecover"));
            } else {
                setError(tr("Không thể gửi yêu cầu. Vui lòng thử lại.", "auth.sendFailedTryAgain"));
            }
        } catch {
            setError(t('auth.connError'));
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
                                <Zap className="w-3 h-3 fill-emerald-500" /> {tr("Đặc sản tinh hoa", "auth.premiumSpecialties")}
                            </div>
                            <h2 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter uppercase">
                                {t("auth.startJourney")} <br />
                                <span className="text-emerald-500">{t("auth.greenLiving")}</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">{t("auth.registerDescMarketing")}</p>
                        </motion.div>

                        <div className="mt-16 grid grid-cols-2 gap-8">
                            {[
                                { icon: ShieldCheck, title: t("auth.absoluteSafety"), desc: t("auth.foodSafetyCert") },
                                { icon: Zap, title: t("auth.greenDelivery"), desc: t("auth.fastAndPreserved") }
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
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-emerald-50 bg-slate-200 overflow-hidden" />
                            ))}
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-slate-900">50,000+</span> {t("auth.trustedNationwide")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white p-8 sm:p-12 lg:p-20 relative shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10">
                <div className="w-full max-w-[440px]">
                    <AnimatePresence mode="wait">
                        <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="text-center lg:text-left mb-10">
                                <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                                        <ChefHat className="w-6 h-6" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tighter">LIKE<span className="text-emerald-500">FOOD</span></span>
                                </Link>
                                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">{t("auth.createAccountTitle")}</h1>
                                <p className="text-slate-400 font-medium text-sm">{t("auth.createAccountDesc")}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-bold flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                    </motion.div>
                                )}

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text" required value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            autoComplete="name"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                            placeholder={t("auth.namePlaceholder")}
                                        />
                                    </div>

                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="email" required value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            autoComplete="email"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                            placeholder={t("auth.email")}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative min-w-[80px] sm:min-w-[100px]">
                                            <button
                                                type="button"
                                                onClick={() => setShowCountrySelector(!showCountrySelector)}
                                                className="w-full px-4 py-4 bg-slate-50 border-slate-100 border rounded-2xl flex items-center justify-between hover:bg-slate-100 transition-all text-sm font-bold"
                                            >
                                                <span className="text-slate-700">{country.flag} {country.code}</span>
                                                <ChevronDown className={cn("w-3 h-3 transition-transform text-slate-400", showCountrySelector && "rotate-180 text-emerald-500")} />
                                            </button>
                                            <AnimatePresence>
                                                {showCountrySelector && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-2 left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-20">
                                                        {countries.map((c) => (
                                                            <button
                                                                key={c.code} type="button"
                                                                onClick={() => { setCountry(c); setShowCountrySelector(false); }}
                                                                className="w-full px-4 py-3 text-left hover:bg-emerald-50 text-xs font-bold transition-colors border-b border-slate-50 last:border-0"
                                                            >
                                                                {c.flag} {c.name} ({c.code})
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="relative flex-1 group">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="tel" required value={formData.phone}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setFormData({ ...formData, phone: val });
                                                }}
                                                autoComplete="tel"
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                                placeholder={isVietnamese ? "987 654 321" : "987 654 321"}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="relative group">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type={showPassword ? "text" : "password"} required value={formData.password}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData({ ...formData, password: val });
                                                    let score = 0;
                                                    if (val.length >= 8) score++;
                                                    if (/[A-Z]/.test(val)) score++;
                                                    if (/[0-9]/.test(val)) score++;
                                                    if (/[^A-Za-z0-9]/.test(val)) score++;
                                                    setPasswordStrength(score);
                                                }}
                                                autoComplete="new-password"
                                                className="w-full pl-14 pr-12 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                                placeholder={t("auth.password")}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors p-1">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type={showPassword ? "text" : "password"} required value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                autoComplete="new-password"
                                                className="w-full pl-14 pr-12 py-4 bg-slate-50 border-slate-100 border rounded-2xl outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                                placeholder={t("auth.confirmPasswordLabel")}
                                            />
                                        </div>
                                    </div>

                                    {formData.password && (
                                        <div className="px-1 space-y-2">
                                            <div className="flex gap-1 h-1">
                                                {[1, 2, 3, 4].map((s) => (
                                                    <div key={s} className={cn("flex-1 rounded-full transition-all duration-500", s <= passwordStrength ? (passwordStrength <= 1 ? "bg-red-400" : passwordStrength <= 3 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-100")} />
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                                                <span>{t("auth.strength")} <span className={cn(passwordStrength <= 1 ? "text-red-500" : passwordStrength <= 3 ? "text-amber-500" : "text-emerald-500")}>{passwordStrength <= 1 ? t("auth.weak") : passwordStrength <= 2 ? t("auth.medium") : passwordStrength <= 3 ? t("auth.fair") : t("auth.veryStrong")}</span></span>
                                                <span>{t("auth.min8Chars")}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-3 px-1">
                                    <input type="checkbox" required id="tos" className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer mt-0.5" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                                    <label htmlFor="tos" className="text-[11px] text-slate-500 leading-relaxed font-medium cursor-pointer flex-wrap gap-1 leading-snug">
                                        {t("auth.agreeToTerms")} <Link href="/policies/terms" className="text-emerald-600 font-bold hover:underline mx-1">{t("auth.terms")}</Link> {t("auth.and")} <Link href="/policies/privacy" className="text-emerald-600 font-bold hover:underline mx-1">{t("auth.privacyPolicy")}</Link> {t("auth.ofLikefood")}
                                    </label>
                                </div>

                                <div className="flex justify-center py-2">
                                    <CaptchaField onToken={setTurnstileToken} onValidChange={setIsCaptchaValid} />
                                </div>

                                <Button disabled={isLoading || !isCaptchaValid} type="submit" className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="flex items-center gap-2">{t("auth.registerNow")}</span>}
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
                                    {tr("Đăng ký bằng Magic Link", "auth.registerWithMagicLink")}
                                </button>

                                <p className="text-center text-sm text-slate-500 font-medium pt-2">
                                    {t("auth.alreadyHaveAccount")} <Link href="/login" className="text-emerald-600 font-bold hover:underline">{t("auth.loginNow")}</Link>
                                </p>
                            </form>
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-16 pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        <span dangerouslySetInnerHTML={{ __html: t("auth.footerCopyright") }} />
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
