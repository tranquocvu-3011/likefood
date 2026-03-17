import { Metadata } from "next";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const isEn = cookieStore.get("language")?.value === "en";

  return {
    title: isEn ? "My Account | LIKEFOOD" : "Tài khoản của tôi | LIKEFOOD",
    description: isEn ? "Manage your LIKEFOOD account" : "Quản lý tài khoản LIKEFOOD của bạn",
    alternates: {
      canonical: "/profile",
      languages: {
        'vi': '/profile?lang=vi',
        'en': '/profile?lang=en',
        'x-default': '/profile',
      },
    },
    robots: {
      index: false,
    },
    openGraph: {
      title: isEn ? "My Account | LIKEFOOD" : "Tài khoản của tôi | LIKEFOOD",
      description: isEn ? "Manage your LIKEFOOD account" : "Quản lý tài khoản LIKEFOOD của bạn",
      type: "website",
      locale: isEn ? "en_US" : "vi_VN",
      alternateLocale: isEn ? "vi_VN" : "en_US",
      url: `${BASE_URL}/profile`,
    },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
