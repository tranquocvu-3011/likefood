import { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const isEn = cookieStore.get("language")?.value === "en";

  return {
    title: isEn ? "Cart | LIKEFOOD" : "Giỏ hàng | LIKEFOOD",
    description: isEn ? "Your shopping cart at LIKEFOOD" : "Giỏ hàng của bạn tại LIKEFOOD",
    alternates: {
      canonical: "/cart",
      languages: {
        'vi': '/cart?lang=vi',
        'en': '/cart?lang=en',
        'x-default': '/cart',
      },
    },
    robots: {
      index: false,
    },
    openGraph: {
      title: isEn ? "Cart | LIKEFOOD" : "Giỏ hàng | LIKEFOOD",
      description: isEn ? "Your shopping cart at LIKEFOOD" : "Giỏ hàng của bạn tại LIKEFOOD",
      type: "website",
      locale: isEn ? "en_US" : "vi_VN",
      alternateLocale: isEn ? "vi_VN" : "en_US",
      url: `${BASE_URL}/cart`,
    },
  };
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
