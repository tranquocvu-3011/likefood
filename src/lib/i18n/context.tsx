"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import React, { createContext, useContext, useState } from "react";
import { vi } from "./dictionaries/vi";
import { en } from "./dictionaries/en";

type Language = "vi" | "en";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dictionary = any;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
    dict: Dictionary;
    isVietnamese: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: React.ReactNode;
    initialLanguage?: Language;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    // Try to get initial language from cookie on client side
    const getInitialLanguage = (): Language => {
        if (typeof window !== "undefined") {
            // 1. Check localStorage preference first
            const stored = localStorage.getItem("language");
            if (stored === "vi" || stored === "en") return stored;
            // 2. Check cookie preference
            const cookies = document.cookie.split(";").find(c => c.trim().startsWith("language="));
            if (cookies) {
                const lang = cookies.split("=")[1]?.trim();
                if (lang === "vi" || lang === "en") return lang;
            }
            // 3. Auto-detect browser language
            const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || "";
            if (browserLang.startsWith("en")) return "en";
        }
        return "vi";
    };

    const [language, setLanguageState] = useState<Language>(getInitialLanguage());

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== "undefined") {
            localStorage.setItem("language", lang);
            // Persist in cookie for SSR hydration consistency
            document.cookie = `language=${lang};path=/;max-age=31536000;SameSite=Lax`;
        }
    };

    const dict = language === "vi" ? vi : en;
    const isVietnamese = language === "vi";

    const t = (path: string) => {
        const keys = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any = dict;
        for (const key of keys) {
            result = result?.[key];
        }
        return typeof result === "string" ? result : path;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dict, isVietnamese }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
