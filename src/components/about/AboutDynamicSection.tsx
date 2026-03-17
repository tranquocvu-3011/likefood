"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useState } from "react";

interface PublicSettings {
    ABOUT_STORY_TEXT?: string;
}

export function AboutDynamicSection() {
    const [story, setStory] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/public/settings");
                if (!res.ok) return;
                const data: PublicSettings = await res.json();
                if (data.ABOUT_STORY_TEXT) {
                    setStory(data.ABOUT_STORY_TEXT);
                }
            } catch {
                // ignore
            }
        };
        load();
    }, []);

    if (!story) return null;

    return (
        <section className="py-8 bg-white">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-[6%] max-w-4xl">
                <div className="bg-teal-50/60 rounded-2xl p-6 lg:p-8 border border-teal-100/60">
                    <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight mb-3 text-slate-800">
                        Câu chuyện LIKEFOOD
                    </h2>
                    <p className="text-slate-500 leading-relaxed whitespace-pre-line text-sm lg:text-base">
                        {story}
                    </p>
                </div>
            </div>
        </section>
    );
}
