/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * EmptyState — Reusable empty state pattern
 * Sử dụng khi danh sách trống, giỏ hàng trống, không có kết quả
 */

import { cn } from "@/lib/utils";
import { LucideIcon, PackageOpen } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export default function EmptyState({
    icon: Icon = PackageOpen,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center py-16 px-8", className)}>
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-slate-500 font-medium max-w-sm mb-6">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
