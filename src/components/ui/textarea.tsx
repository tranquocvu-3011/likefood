/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Textarea – Base textarea component chuẩn hóa cho forms
 * Cần cho: admin/homepage, admin/pages
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                        {label}
                    </label>
                )}
                <textarea
                    className={cn(
                        "w-full min-h-[80px] bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 py-4 outline-none",
                        "focus:ring-2 focus:ring-primary/20 transition-all resize-y",
                        "placeholder:text-slate-400 text-slate-900 font-medium",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        error && "ring-red-200 focus:ring-red-300",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
                )}
            </div>
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };
