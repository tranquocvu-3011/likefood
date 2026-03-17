"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Shield, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/context";

interface IdleWarningModalProps {
    isOpen: boolean;
    onStayLoggedIn: () => void;
    countdown: number;
}

export default function IdleWarningModal({ isOpen, onStayLoggedIn, countdown }: IdleWarningModalProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { t } = useLanguage();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await signOut({ callbackUrl: `/login?message=${encodeURIComponent(t("idleWarning.loggedOutMsg"))}` });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl text-center"
                    >
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-amber-500" />
                        </div>

                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">
                            {t("idleWarning.title")}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-2">
                            {t("idleWarning.description")}
                        </p>
                        <p className="text-amber-600 font-black text-base mb-8">
                            {t("idleWarning.autoLogout")} <span className="text-2xl">{countdown}</span> {t("idleWarning.seconds")}
                        </p>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: `${(countdown / 300) * 100}%` }}
                                className="h-full bg-amber-400 rounded-full"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onStayLoggedIn}
                                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Shield className="w-4 h-4" /> {t("idleWarning.stayLoggedIn")}
                            </button>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full py-3 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:border-red-200 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> {t("idleWarning.logoutNow")}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
