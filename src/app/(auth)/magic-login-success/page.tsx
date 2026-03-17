"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, Zap, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

function MagicLoginSuccessContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email");
    const verified = searchParams.get("verified");
    const token = searchParams.get("token");

    useEffect(() => {
        if (!email || !verified || !token) {
            router.push("/login?error=invalid_link");
            return;
        }

        // Auto sign-in via magic link credentials securely using DB token
        const doSignIn = async () => {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password: "__MAGIC_LINK__", // placeholder
                isMagicLink: "true",
                token,
            });

            if (result?.ok) {
                // Publish success event to other tabs
                const channel = new BroadcastChannel("likefood_auth_sync");
                channel.postMessage({ type: "LOGIN_SUCCESS" });
                channel.close();

                setTimeout(() => router.push("/"), 1500);
            } else {
                // Magic link credentials auth not supported in standard flow
                // Redirect to login with pre-filled email
                setTimeout(() => {
                    router.push(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent(t("auth.linkVerifiedLoginNow"))}`);
                }, 1500);
            }
        };

        doSignIn();
    }, [email, verified, router]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md text-center"
            >
                <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/30">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center"
                    >
                        <Zap className="w-4 h-4 text-white" />
                    </motion.div>
                </div>

                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
                    {t("auth.magicLoginAuthTitle")}
                </h1>
                <p className="text-slate-500 font-medium mb-6">
                    {t("auth.signingInTo")} <strong className="text-violet-600">{email}</strong>...
                </p>
                <div className="flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
            </motion.div>
        </div>
    );
}

export default function MagicLoginSuccessPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>}>
            <MagicLoginSuccessContent />
        </Suspense>
    );
}
