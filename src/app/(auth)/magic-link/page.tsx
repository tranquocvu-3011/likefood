"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Zap, Mail, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/context";
import { CaptchaField } from "@/components/auth/CaptchaField";

function MagicLinkContent() {
    const { t, isVietnamese } = useLanguage();
    const tr = (viText: string, enKey: string) => (isVietnamese ? viText : t(enKey));
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isCaptchaValid) {
            toast.error(tr("Vui lòng hoàn thành xác thực bảo mật.", "auth.completeSecurityCheck"));
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/magic-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, turnstileToken }),
            });
            try {
                const text = await res.text();
                // Server trả về HTML (vd: 500 error page) thay vì JSON
                if (!res.ok && text) {
                    try {
                        const parsed = JSON.parse(text);
                        toast.error(parsed.error || tr("Lỗi máy chủ. Hãy kiểm tra cấu hình email và thử lại.", "auth.serverConfigError"));
                        return;
                    } catch {
                        // Not JSON, ignore
                    }
                }
            } catch {
                // Ignore parsing errors
            }
            if (res.ok) {
                setIsSent(true);
                toast.success(t("auth.magicLinkSent"));
            } else {
                toast.error(tr("Không thể gửi yêu cầu. Vui lòng thử lại.", "auth.sendFailedTryAgain"));
            }
        } catch {
            toast.error(tr("Lỗi kết nối.", "auth.connectionErrorShort"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md text-center"
            >
                {isSent ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                        <div className="w-24 h-24 rounded-3xl bg-green-500 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">{t("auth.verifyEmailTitle")}</h2>
                            <p className="text-slate-500 font-medium">{t("auth.verifyEmailDesc")} <strong className="text-violet-600">{email}</strong></p>
                            <p className="text-xs text-slate-400 mt-2 font-medium">{t("auth.verifyEmailCheckSpam")}</p>
                        </div>
                        <button
                            onClick={() => { setIsSent(false); setEmail(""); }}
                            className="w-full py-3 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all"
                        >
                            {t("auth.resendLink")}
                        </button>
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-600/30"
                        >
                            <Zap className="w-10 h-10 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">{t("auth.magicLinkTab")}</h1>
                        <p className="text-slate-500 font-medium mb-8">{t("auth.loginWithMagicLink")}</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="email" required value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-sm"
                                    placeholder={t("auth.emailPlaceholder")}
                                />
                            </div>

                            <div className="py-2">
                                <CaptchaField onToken={setTurnstileToken} onValidChange={setIsCaptchaValid} />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !isCaptchaValid}
                                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("auth.sendingLink")}</> : <><Zap className="w-4 h-4" /> {t("auth.sendLinkBtn")}</>}
                            </button>
                        </form>
                        <div className="mt-8 pt-6 border-t border-slate-50 space-y-2">
                            <Link href="/login" className="block text-xs text-slate-400 font-medium hover:text-violet-600">
                                {"<- "}{t("auth.backToLogin")}
                            </Link>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function MagicLinkPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>}>
            <MagicLinkContent />
        </Suspense>
    );
}
