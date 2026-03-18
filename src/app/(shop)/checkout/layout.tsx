import { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const isEn = cookieStore.get("language")?.value === "en";

  return {
    title: isEn ? "Checkout | LIKEFOOD" : "Thanh toán | LIKEFOOD",
    description: isEn ? "Complete your order at LIKEFOOD" : "Hoàn tất đơn hàng tại LIKEFOOD",
    alternates: {
      canonical: "/checkout",
      languages: {
        'vi': '/checkout?lang=vi',
        'en': '/checkout?lang=en',
        'x-default': '/checkout',
      },
    },
    robots: {
      index: false,
    },
    openGraph: {
      title: isEn ? "Checkout | LIKEFOOD" : "Thanh toán | LIKEFOOD",
      description: isEn ? "Complete your order at LIKEFOOD" : "Hoàn tất đơn hàng tại LIKEFOOD",
      type: "website",
      locale: isEn ? "en_US" : "vi_VN",
      alternateLocale: isEn ? "vi_VN" : "en_US",
      url: `${BASE_URL}/checkout`,
    },
  };
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
