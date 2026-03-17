"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * QuantitySelector — Reusable +/- quantity input với min/max bounds
 * Sử dụng ở Cart, ProductDetail, Checkout
 */

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, memo } from "react";
import { useLanguage } from "@/lib/i18n/context";

interface QuantitySelectorProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    className?: string;
    ariaLabel?: string;
}

const sizeConfig = {
    sm: {
        wrapper: "h-8 gap-0",
        button: "w-7 h-7 text-xs",
        input: "w-8 text-xs",
    },
    md: {
        wrapper: "h-10 gap-0",
        button: "w-9 h-9 text-sm",
        input: "w-10 text-sm",
    },
    lg: {
        wrapper: "h-12 gap-0",
        button: "w-11 h-11 text-base",
        input: "w-14 text-base",
    },
};

function QuantitySelectorComponent({
    value,
    min = 1,
    max = 99,
    onChange,
    size = "md",
    disabled = false,
    className,
    ariaLabel,
}: QuantitySelectorProps) {
    const { t } = useLanguage();
    const s = sizeConfig[size];

    const handleDecrement = useCallback(() => {
        if (value > min) onChange(value - 1);
    }, [value, min, onChange]);

    const handleIncrement = useCallback(() => {
        if (value < max) onChange(value + 1);
    }, [value, max, onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "");
        if (!raw) return;
        const num = Math.max(min, Math.min(max, parseInt(raw, 10)));
        onChange(num);
    }, [min, max, onChange]);

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm",
                disabled && "opacity-50 pointer-events-none",
                s.wrapper,
                className
            )}
            role="group"
            aria-label={ariaLabel || t("shop.quantity")}
        >
            <button
                type="button"
                onClick={handleDecrement}
                disabled={disabled || value <= min}
                className={cn(
                    "flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                    s.button
                )}
                aria-label={t("shop.decreaseQuantity")}
            >
                <Minus className="w-3.5 h-3.5" />
            </button>

            <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={handleInputChange}
                disabled={disabled}
                className={cn(
                    "text-center font-black text-slate-900 border-x border-slate-200 bg-transparent outline-none",
                    s.input
                )}
                aria-label={t("shop.quantityValue")}
            />

            <button
                type="button"
                onClick={handleIncrement}
                disabled={disabled || value >= max}
                className={cn(
                    "flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                    s.button
                )}
                aria-label={t("shop.increaseQuantity")}
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default memo(QuantitySelectorComponent);
