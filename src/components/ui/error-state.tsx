/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * ErrorState — Reusable error display with retry action
 * Sử dụng cho API errors, data load failures, network issues
 */

import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
    className?: string;
}

export default function ErrorState({
    title,
    message,
    onRetry,
    retryLabel = "↻",
    className,
}: ErrorStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center py-16 px-8", className)}>
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
                <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            {title && (
                <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
            )}
            <p className="text-sm text-red-600 font-medium max-w-sm mb-6">
                {message}
            </p>
            {onRetry && (
                <Button
                    variant="outline"
                    onClick={onRetry}
                    className="gap-2 rounded-2xl font-bold"
                >
                    <RefreshCw className="w-4 h-4" />
                    {retryLabel}
                </Button>
            )}
        </div>
    );
}
