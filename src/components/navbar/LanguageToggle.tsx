"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useLanguage } from "@/lib/i18n/context";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import Image from "next/image";

const LANGUAGES = [
    { code: "vi" as const, flag: "/images/flags/vn.svg", name: "Việt Nam", short: "VI" },
    { code: "en" as const, flag: "/images/flags/us.svg", name: "United States", short: "EN" },
];

export default function LanguageToggle() {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={ref} className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={t("navbar.selectLanguage")}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-slate-700 select-none"
            >
                <Image src={current.flag} alt={current.name} width={20} height={14} className="rounded-sm object-cover flex-shrink-0" style={{ height: 'auto' }} />
                <span className="text-[10px] font-black tracking-wider">{current.short}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? "-rotate-180" : ""}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        role="listbox"
                        aria-label={t("navbar.language")}
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-full right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 overflow-hidden z-[300] py-1"
                    >
                        {LANGUAGES.map((lang) => (
                            <li key={lang.code} role="option" aria-selected={language === lang.code}>
                                <button
                                    onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${language === lang.code
                                        ? "bg-primary/5 text-primary"
                                        : "hover:bg-slate-50 text-slate-700"
                                        }`}
                                >
                                    <Image src={lang.flag} alt={lang.name} width={24} height={17} className="rounded-sm object-cover flex-shrink-0" style={{ height: 'auto' }} />
                                    <span className="flex-1 text-[13px] font-semibold">{lang.name}</span>
                                    {language === lang.code && (
                                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
