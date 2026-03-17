"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

interface FlashSaleCountdownProps {
    endDate: Date | string;
    compact?: boolean;
}

interface TimeLeft {
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

export default function FlashSaleCountdown({ endDate, compact = false }: FlashSaleCountdownProps) {
    const { t } = useLanguage();

    const calculateTimeLeft = useCallback((): TimeLeft => {
        const end = new Date(endDate).getTime();
        const now = new Date().getTime();
        const difference = end - now;

        if (difference <= 0) {
            return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
        }

        return {
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            isExpired: false
        };
    }, [endDate]);

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft());

    useEffect(() => {
        const tick = () => setTimeLeft(calculateTimeLeft());

        const frame = requestAnimationFrame(tick);
        const timer = setInterval(tick, 1000);

        return () => {
            cancelAnimationFrame(frame);
            clearInterval(timer);
        };
    }, [calculateTimeLeft]);

    if (timeLeft.isExpired) {
        return (
            <div className={`text-xs font-bold text-gray-400 ${compact ? '' : 'text-center'}`}>
                {t("flashSaleCountdown.ended")}
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center gap-1 text-[10px] font-black text-white">
                <span className="bg-black/30 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span>:</span>
                <span className="bg-black/30 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span>:</span>
                <span className="bg-black/30 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-2">
            <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white font-black text-lg px-3 py-2 rounded-lg shadow-lg min-w-[50px] text-center">
                    {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 font-bold uppercase">{t("flashSaleCountdown.hours")}</span>
            </div>
            <span className="text-2xl font-black text-gray-400">:</span>
            <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white font-black text-lg px-3 py-2 rounded-lg shadow-lg min-w-[50px] text-center">
                    {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 font-bold uppercase">{t("flashSaleCountdown.minutes")}</span>
            </div>
            <span className="text-2xl font-black text-gray-400">:</span>
            <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white font-black text-lg px-3 py-2 rounded-lg shadow-lg min-w-[50px] text-center">
                    {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 font-bold uppercase">{t("flashSaleCountdown.seconds")}</span>
            </div>
        </div>
    );
}
