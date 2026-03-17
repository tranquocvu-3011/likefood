/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Dialog – Base dialog/modal component dùng chung cho toàn hệ thống
 * Cần cho: admin/homepage, admin/pages, admin/menu, và các modal khác
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// ── Context ──
const DialogContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

// ── Dialog Root ──
export function Dialog({
    open,
    onOpenChange,
    children,
}: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const handleChange = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

    return (
        <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleChange }}>
            {children}
        </DialogContext.Provider>
    );
}

// ── Dialog Trigger ──
export function DialogTrigger({
    children,
    asChild,
    className,
}: {
    children: React.ReactNode;
    asChild?: boolean;
    className?: string;
}) {
    const { onOpenChange } = React.useContext(DialogContext);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => onOpenChange(true),
        });
    }

    return (
        <button type="button" onClick={() => onOpenChange(true)} className={className}>
            {children}
        </button>
    );
}

// ── Dialog Content (Overlay + Panel) ──
export function DialogContent({
    children,
    className,
    onInteractOutside,
}: {
    children: React.ReactNode;
    className?: string;
    onInteractOutside?: () => void;
}) {
    const { open, onOpenChange } = React.useContext(DialogContext);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    React.useEffect(() => {
        if (!open) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
                onClick={() => {
                    if (onInteractOutside) onInteractOutside();
                    else onOpenChange(false);
                }}
            />
            {/* Panel */}
            <div
                className={cn(
                    "relative z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6",
                    "animate-in fade-in-0 zoom-in-95",
                    "max-h-[90vh] overflow-y-auto",
                    className
                )}
            >
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    aria-label="Close dialog"
                >
                    <X className="w-4 h-4" />
                </button>
                {children}
            </div>
        </div>
    );
}

// ── Dialog Header ──
export function DialogHeader({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("mb-4", className)}>
            {children}
        </div>
    );
}

// ── Dialog Title ──
export function DialogTitle({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <h2 className={cn("text-lg font-bold text-slate-900", className)}>
            {children}
        </h2>
    );
}

// ── Dialog Description ──
export function DialogDescription({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <p className={cn("text-sm text-slate-500 mt-1", className)}>
            {children}
        </p>
    );
}

// ── Dialog Footer ──
export function DialogFooter({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("mt-6 flex justify-end gap-3", className)}>
            {children}
        </div>
    );
}
