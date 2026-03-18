/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";
import VouchersClient from "./VouchersClient";

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

export default function VouchersPage() {
    return <VouchersClient />;
}
