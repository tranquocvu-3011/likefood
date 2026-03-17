/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Badge – Component badge cho product labels (Sale, Flash Sale, New, Out of Stock)
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "sale" | "flash" | "new" | "out" | "info";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    sale: "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30",
    flash: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30",
    new: "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30",
    out: "bg-slate-200 text-slate-500",
    info: "bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-lg shadow-blue-500/30",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = "default", ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                    variantClasses[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = "Badge";

export { Badge };
