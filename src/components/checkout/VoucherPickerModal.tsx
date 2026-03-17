"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * VoucherPickerModal – Lựa chọn voucher & Nhập mã thủ công
 */

import { useState, useEffect, useCallback } from "react";
import { X, Ticket, Check, AlertCircle, Search, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface Voucher {
    id: number;
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    discountAmount?: number;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    category?: string;
    canUse?: boolean;
    reason?: string;
    expiresAt?: Date | null;
}

interface VoucherPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderTotal: number;
    selectedVoucher: Voucher | null;
    onSelectVoucher: (voucher: Voucher | null) => void;
}

export default function VoucherPickerModal({
    isOpen,
    onClose,
    orderTotal,
    selectedVoucher,
    onSelectVoucher,
}: VoucherPickerModalProps) {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [manualCode, setManualCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [isValidating, setIsValidating] = useState(false);
    const { language, t } = useLanguage();
    const trapRef = useFocusTrap(isOpen);

    const fetchVouchers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/vouchers/checkout?orderTotal=${orderTotal}`);
            if (res.ok) {
                const data = await res.json();
                setVouchers(data.vouchers || []);
            }
        } catch (error) {
            logger.error("Failed to fetch vouchers", error as Error, { context: 'voucher-picker-modal' });
        } finally {
            setLoading(false);
        }
    }, [orderTotal]);

    useEffect(() => {
        if (isOpen) {
            fetchVouchers();
        }
    }, [isOpen, fetchVouchers]);

    const handleSelect = (voucher: Voucher) => {
        if (!voucher.canUse) {
            toast.error(voucher.reason || t('checkout.voucherNotApplicable'));
            return;
        }
        onSelectVoucher(voucher);
        toast.success(`${t('checkout.appliedCode')} ${voucher.code}`);
        onClose();
    };

    const handleApplyManual = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!manualCode.trim()) return;

        try {
            setIsValidating(true);
            const res = await fetch(`/api/vouchers/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: manualCode, orderTotal }),
            });
            const data = await res.json();

            if (res.ok && data.voucher) {
                onSelectVoucher(data.voucher);
                toast.success(`${t('checkout.appliedCode')} ${data.voucher.code}`);
                onClose();
            } else {
                toast.error(data.error || t('checkout.invalidVoucherCode'));
            }
        } catch (error) {
            toast.error(t('checkout.systemError'));
        } finally {
            setIsValidating(false);
        }
    };

    const formatDiscount = (voucher: Voucher) => {
        if (voucher.discountType === "PERCENTAGE") {
            return `${voucher.discountValue}%`;
        }
        return `$${voucher.discountValue.toFixed(2)}`;
    };

    const getCategoryColor = (category?: string) => {
        switch (category) {
            case "shipping": return "from-blue-500 to-indigo-500";
            case "flash": return "from-amber-500 to-orange-600";
            case "new": return "from-emerald-500 to-teal-600";
            default: return "from-primary to-slate-900";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl"
                    />
                    
                    <motion.div
                        ref={trapRef}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white rounded-[3.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur shadow-sm sticky top-0 z-20">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                                    {t('checkout.yourVouchers')}
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">
                                    {t('checkout.selectCodeToSave')}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-8">
                            {/* Manual Entry */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">
                                    {t('checkout.enterManualCode')}
                                </label>
                                <form onSubmit={handleApplyManual} className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                        <Ticket className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder={t('checkout.discountCode')}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-16 pr-24 py-5 font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-primary/20 transition-all outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!manualCode.trim() || isValidating}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 disabled:opacity-30"
                                    >
                                        {isValidating ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            t('checkout.apply')
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Applied Voucher Status */}
                            {selectedVoucher && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">
                                                {t('checkout.currentlyApplied')}
                                            </p>
                                            <p className="font-black text-lg text-emerald-900 leading-none">{selectedVoucher.code}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onSelectVoucher(null)}
                                        className="px-4 py-2 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        {t('checkout.remove')}
                                    </button>
                                </motion.div>
                            )}

                            {/* Available Vouchers List */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block flex items-center gap-2">
                                    <span className="w-4 h-[1px] bg-slate-200" />
                                    {t('checkout.availableForYou')}
                                </label>
                                
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-28 bg-slate-50 animate-pulse rounded-[2rem]" />
                                        ))}
                                    </div>
                                ) : vouchers.length === 0 ? (
                                    <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                        <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-400">
                                            {t('checkout.noOtherVouchers')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {vouchers.map((voucher) => (
                                            <motion.button
                                                key={voucher.id}
                                                layout
                                                onClick={() => handleSelect(voucher)}
                                                disabled={!voucher.canUse}
                                                className={`w-full group relative text-left transition-all ${
                                                    selectedVoucher?.id === voucher.id ? "scale-[0.98]" : "hover:scale-[1.01]"
                                                }`}
                                            >
                                                <div className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 ${
                                                    selectedVoucher?.id === voucher.id
                                                        ? "border-primary bg-primary/5 shadow-inner"
                                                        : voucher.canUse
                                                            ? "border-slate-100 hover:border-slate-300 bg-white shadow-sm"
                                                            : "border-slate-50 bg-slate-50/50 opacity-60 grayscale cursor-not-allowed"
                                                }`}>
                                                    <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${getCategoryColor(voucher.category)} flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform duration-500`}>
                                                        <Sparkles className="w-7 h-7" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-lg text-slate-900">{voucher.code}</p>
                                                            {selectedVoucher?.id === voucher.id && (
                                                                <span className="bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                                                    Selected
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xl font-black text-primary">{formatDiscount(voucher)} OFF</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                Min. ${voucher.minOrderValue?.toFixed(0) || "0"}
                                                            </span>
                                                        </div>
                                                        {!voucher.canUse && voucher.reason && (
                                                            <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1.5">
                                                                <AlertCircle className="w-3 h-3" /> {voucher.reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {voucher.canUse && (
                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedVoucher?.id === voucher.id ? "border-primary bg-primary text-white" : "border-slate-200 text-transparent"}`}>
                                                            <Check className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Left/Right Dot Design */}
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-4 h-4 rounded-full bg-white border-r-2 border-slate-100 z-20 group-hover:scale-125 transition-transform" />
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-4 h-4 rounded-full bg-white border-l-2 border-slate-100 z-20 group-hover:scale-125 transition-transform" />
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                            <button
                                onClick={onClose}
                                className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                {t('checkout.viewAllVouchers')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
