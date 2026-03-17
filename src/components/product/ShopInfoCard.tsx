/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Store, Star, MessageCircle, Clock, Package, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ShopInfoCardProps {
    shop: {
        name?: string;
        rating?: number;
        totalProducts?: number;
        responseRate?: number;
        joinedDate?: Date | string;
    };
}

export default function ShopInfoCard({ shop }: ShopInfoCardProps) {
    const {
        name = "LIKEFOOD Store",
        rating = 4.8,
        totalProducts = 250,
        responseRate = 95,
        joinedDate
    } = shop;

    const joinedYear = joinedDate ? new Date(joinedDate).getFullYear() : 2020;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl relative overflow-hidden group"
        >
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />

            <div className="relative flex items-center gap-6 mb-10">
                <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        <Store className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h3>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full inline-block">
                        Đối tác tin cậy
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Joined {joinedYear}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
                {/* Rating */}
                <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đánh giá</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{rating.toFixed(1)}</span>
                        <span className="text-xs font-bold text-slate-400">/5.0</span>
                    </div>
                </div>

                {/* Products */}
                <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sản phẩm</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{totalProducts}+</span>
                    </div>
                </div>

                {/* Response Rate */}
                <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phản hồi</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{responseRate}%</span>
                    </div>
                </div>

                {/* Response Time */}
                <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">1 giờ</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Link
                    href="/shop"
                    className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-[12px] uppercase tracking-widest rounded-2xl flex items-center justify-center transition-all"
                >
                    Xem Shop
                </Link>
                <button className="flex-1 h-14 bg-primary hover:bg-slate-900 text-white font-black text-[12px] uppercase tracking-widest rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-slate-900/20 transition-all">
                    Chat Ngay
                </button>
            </div>
        </motion.div>
    );
}
