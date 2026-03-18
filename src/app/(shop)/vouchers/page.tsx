/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const isEn = cookieStore.get("language")?.value === "en";
  const title = isEn ? "Vouchers | LIKEFOOD" : "Voucher | LIKEFOOD";
  const description = isEn
    ? "Discount codes and exclusive offers for you"
    : "Mã giảm giá và ưu đãi dành riêng cho bạn";

  return {
    title,
    description,
    alternates: {
      canonical: "/vouchers",
      languages: {
        'vi': '/vouchers?lang=vi',
        'en': '/vouchers?lang=en',
        'x-default': '/vouchers',
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isEn ? "en_US" : "vi_VN",
      alternateLocale: isEn ? "vi_VN" : "en_US",
      url: `${BASE_URL}/vouchers`,
    },
  };
}

import PublicVoucherList from "@/components/product/PublicVoucherList";
import { Ticket } from "lucide-react";

export default function VouchersPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-20 pt-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 mb-12 shadow-2xl shadow-slate-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                            <Ticket className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                            Voucher Center
                        </h1>
                        <p className="max-w-xl text-slate-400 font-medium leading-relaxed">
                            Khám phá các mã giảm giá và ưu đãi độc quyền dành riêng cho bạn. 
                            Tiết kiệm hơn khi mua sắm đặc sản Việt Nam tại LIKEFOOD.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <PublicVoucherList />
            </div>
        </div>
    );
}
