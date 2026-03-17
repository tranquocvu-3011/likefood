/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Input – Chuẩn hóa base input component cho toàn bộ hệ thống
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, icon, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 py-4 outline-none",
                            "focus:ring-2 focus:ring-primary/20 transition-all",
                            "placeholder:text-slate-400 text-slate-900 font-medium",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            icon && "pl-12",
                            error && "ring-red-200 focus:ring-red-300",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
