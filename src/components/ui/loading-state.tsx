/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * LoadingState — Reusable loading indicator
 * Sử dụng cho sections loading, page loading, lazy component loading
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
    text?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    fullPage?: boolean;
}

const sizeMap = {
    sm: { icon: "w-5 h-5", text: "text-xs" },
    md: { icon: "w-8 h-8", text: "text-sm" },
    lg: { icon: "w-12 h-12", text: "text-base" },
};

export default function LoadingState({
    text,
    size = "md",
    className,
    fullPage = false,
}: LoadingStateProps) {
    const s = sizeMap[size];

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3",
                fullPage ? "min-h-screen" : "py-16",
                className
            )}
        >
            <Loader2 className={cn("animate-spin text-primary", s.icon)} />
            {text && (
                <p className={cn("text-slate-500 font-medium", s.text)}>
                    {text}
                </p>
            )}
        </div>
    );
}
