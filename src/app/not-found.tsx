/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { cookies } from "next/headers";

export default async function NotFound() {
    const cookieStore = await cookies();
    const lang = cookieStore.get("language")?.value === "en" ? "en" : "vi";

    const copy = {
        vi: {
            title: "Trang không tồn tại!",
            description: "Rất tiếc, đường dẫn bạn đang truy cập không tồn tại hoặc đã bị di dời. Hãy quay lại trang chủ để tiếp tục mua sắm nhé.",
            backHome: "Quay lại Trang chủ",
        },
        en: {
            title: "Page Not Found!",
            description: "Sorry, the page you are looking for does not exist or has been moved. Go back to the homepage to continue shopping.",
            backHome: "Back to Homepage",
        },
    }[lang];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
            <div className="relative mb-8">
                <h1 className="text-[12rem] font-black text-slate-200 leading-none">404</h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 bg-primary/10 rounded-full animate-ping"></div>
                </div>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-black">{copy.title}</h2>
            <p className="text-slate-500 mb-12 max-w-md mx-auto text-lg">
                {copy.description}
            </p>
            <Link
                href="/"
                className="flex items-center gap-3 px-10 py-5 bg-black text-white font-bold rounded-full hover:bg-primary transition-all shadow-xl shadow-black/10 group"
            >
                <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                {copy.backHome}
            </Link>
        </div>
    )
}
