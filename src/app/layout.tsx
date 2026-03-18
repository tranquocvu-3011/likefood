/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { ChatOpenProvider } from "@/contexts/ChatOpenContext";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { LanguageProvider } from "@/lib/i18n/context";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import LiveSalesPopup from "@/components/shared/LiveSalesPopup";
import DynamicFavicon from "@/components/shared/DynamicFavicon";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: {
    default: "LIKEFOOD - Đặc Sản Việt Nam Chính Gốc Tại Mỹ | Like Food Vietnamese Specialty Store USA",
    template: "%s | LIKEFOOD"
  },
  description: "LIKEFOOD (Like Food) - Cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. 100+ sản phẩm chính gốc: cá khô miền Tây, tôm khô Cà Mau, mực khô, khô bò, trái cây sấy, mắm truyền thống, gia vị Việt. Giao hàng nhanh 2-3 ngày toàn nước Mỹ. Miễn phí ship đơn từ $500. Chất lượng FDA. Like Food - Vietnamese food you love!",
  keywords: [
    // ★ THƯƠNG HIỆU — "like food" variations (QUAN TRỌNG NHẤT)
    "LIKEFOOD", "like food", "likefood app", "likefood.app", "like food store",
    "like food vietnamese", "like food USA", "like food online", "like food shop",
    "like food delivery", "like food market", "likefood là gì",
    "likefood đặc sản", "likefood cá khô", "likefood tôm khô",
    "like food near me", "like food restaurant", "like food order",
    "likefood review", "like food vietnamese store",

    // ★ ĐẶC SẢN VIỆT NAM — Từ khóa chính (VI)
    "đặc sản Việt Nam", "đặc sản Việt Nam tại Mỹ", "mua đặc sản Việt Nam online",
    "ship đặc sản Việt Nam sang Mỹ", "đặc sản miền Tây", "đặc sản Cà Mau",
    "đặc sản miền Trung", "đặc sản miền Bắc", "đặc sản Việt giao tận nhà Mỹ",
    "cửa hàng đặc sản Việt Nam", "đặc sản quê hương",

    // ★ CÁ KHÔ — Sản phẩm chủ lực
    "cá khô miền Tây", "cá khô miền Tây mua ở đâu", "khô cá lóc",
    "khô cá sặc", "khô cá tra", "khô cá chạch", "khô cá kèo",
    "khô cá thiểu", "khô cá dứa", "khô cá sặc bổi", "khô cá lóc Cà Mau",
    "cá khô ngon", "cá khô Việt Nam", "dried fish Vietnamese",
    "mua cá khô ở Mỹ", "cá khô ship Mỹ", "cá khô giá rẻ",

    // ★ TÔM KHÔ & HẢI SẢN KHÔ
    "tôm khô Cà Mau", "tôm khô nguyên con", "tôm khô loại 1",
    "mực khô nguyên con", "mực khô Việt Nam", "khô mực",
    "cá cơm khô", "tép khô", "dried shrimp Vietnamese", "dried squid",
    "tôm khô ship sang Mỹ", "hải sản khô Việt Nam",

    // ★ KHÔ BÒ & ĐỒ KHÔ KHÁC
    "khô bò", "khô bò miếng", "khô bò sợi", "khô gà", "khô heo",
    "đồ khô Việt Nam", "đồ khô Việt Nam tại Mỹ", "thực phẩm khô",

    // ★ MẮM & GIA VỊ
    "nước mắm Phú Quốc", "mắm cá linh", "mắm tôm", "mắm tép",
    "mắm ruốc", "nước mắm Việt Nam", "tương ớt", "sa tế",
    "gia vị Việt Nam", "bột ngọt", "bột nêm", "hạt nêm Việt",
    "gia vị phở", "gia vị bún bò", "muối tôm", "muối ớt",

    // ★ TRÁI CÂY SẤY & BÁNH KẸO
    "trái cây sấy Việt Nam", "xoài sấy", "mít sấy", "chuối sấy",
    "khoai lang sấy", "trái cây sấy dẻo", "snack Việt Nam",
    "bánh tráng", "bánh phồng tôm", "bánh tráng trộn", "bánh pía",
    "kẹo dừa Bến Tre", "mứt Tết", "hạt điều", "đậu phộng",

    // ★ TRÀ & ĐỒ UỐNG
    "trà Việt Nam", "trà ổi", "trà atiso", "cà phê Việt Nam",
    "trà sen", "trà hoa", "nước sâm", "đồ uống Việt Nam",

    // ★ ENGLISH — Vietnamese Food Keywords (QUAN TRỌNG cho Mỹ)
    "Vietnamese specialty food", "Vietnamese food in USA", "Vietnamese grocery online",
    "buy Vietnamese food in America", "Vietnamese dried fish", "Vietnamese dried shrimp",
    "Vietnamese snacks USA", "Asian food delivery USA", "dried seafood Vietnamese",
    "Vietnamese food store online", "authentic Vietnamese food USA",
    "Vietnamese food near me", "order Vietnamese food online",
    "Vietnamese pantry staples", "Vietnamese cooking ingredients",
    "Vietnamese fish sauce", "Vietnamese condiments",
    "Asian grocery store online", "Southeast Asian food USA",
    "Vietnamese food delivery", "best Vietnamese food online",
    "Vietnamese food gift", "Vietnamese food box",
    "Vietnamese food subscription", "authentic Asian food online",

    // ★ ENGLISH — Product Keywords
    "dried fish from Vietnam", "Ca Mau shrimp", "Phu Quoc fish sauce",
    "Vietnamese beef jerky", "dried mango Vietnam", "dried jackfruit",
    "rice paper Vietnamese", "shrimp chips", "Vietnamese spices",
    "Vietnamese seasoning", "Asian dried seafood", "Vietnamese snack box",

    // ★ ĐỊA ĐIỂM MỸ — Local SEO
    "Vietnamese food Omaha", "Vietnamese store Nebraska",
    "Vietnamese food California", "Vietnamese food Texas",
    "Vietnamese food New York", "Vietnamese food Florida",
    "Vietnamese grocery California", "Asian food store USA",
    "Vietnamese food Houston", "Vietnamese food San Jose",
    "Vietnamese food Orange County", "đặc sản Việt California",

    // ★ LONG-TAIL — Dễ lên top
    "mua cá khô ở đâu tại Mỹ", "tôm khô ship đi Mỹ giá bao nhiêu",
    "đặc sản Việt Nam ship nhanh ở Mỹ", "quà biếu đặc sản Việt Nam tại Mỹ",
    "cửa hàng Việt Nam online uy tín", "thực phẩm Việt tại Hoa Kỳ",
    "mua đồ Việt Nam ở Mỹ", "ship hàng Việt Nam sang Mỹ",
    "quà Tết Việt Nam tại Mỹ", "đồ ăn vặt Việt Nam ship Mỹ",
    "nước mắm Việt Nam mua ở đâu tại Mỹ", "gia vị nấu phở mua ở Mỹ",
  ],
  authors: [{ name: "Trần Quốc Vũ", url: "https://www.facebook.com/profile.php?id=100076170558548" }],
  creator: "Trần Quốc Vũ",
  publisher: "LIKEFOOD",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app"),
  alternates: {
    canonical: "/",
    languages: {
      'vi': '/?lang=vi',
      'en': '/?lang=en',
      'x-default': '/?lang=vi',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    }),
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app",
    siteName: "LIKEFOOD (Like Food) - Đặc Sản Việt Nam Tại Mỹ",
    title: "LIKEFOOD (Like Food) - Đặc Sản Việt Nam Chính Gốc Tại Mỹ | 100+ Sản Phẩm | Ship Toàn Mỹ",
    description: "LIKEFOOD (Like Food) - Cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. 100+ sản phẩm chính gốc miền Tây: cá khô, tôm khô, mực khô, trái cây sấy, mắm truyền thống. Giao hàng 2-3 ngày. Miễn phí ship từ $500. Like Food — Vietnamese food you love!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LIKEFOOD (Like Food) - Đặc sản Việt Nam chính gốc tại Mỹ | Like Food Vietnamese Specialty Store USA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LIKEFOOD (Like Food) - Đặc Sản Việt Nam Chính Gốc Tại Mỹ | Like Food Store",
    description: "LIKEFOOD (Like Food) - Cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. Cá khô, tôm khô, mực khô, trái cây sấy, gia vị Việt. Giao 2-3 ngày. Like Food — Vietnamese food you love!",
    images: ["/og-image.png"],
    creator: "@likefood",
  },
  other: {
    "fb:app_id": process.env.NEXT_PUBLIC_FB_APP_ID || "",
  },
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-512.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LIKEFOOD",
  },
};

export const viewport: Viewport = {
  themeColor: "#ed712e",
};

// Xóa ChatWidgetClient vì đã có ChatbotAI trong ShopLayout

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const shouldRegisterSw = process.env.NODE_ENV === "production";

  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script id="lang-sync" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `
          try {
            var lang = localStorage.getItem('language') || 
              document.cookie.split(';').find(function(c){return c.trim().startsWith('language=')})?.split('=')[1]?.trim();
            if (lang === 'en') document.documentElement.lang = 'en';
          } catch(e) {}
        `}} />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', { send_page_view: true });
                `
              }}
            />
          </>
        )}
        {gtmId && (
          <Script id="gtm-head" strategy="afterInteractive" dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');`
          }} />
        )}
        {fbPixelId && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');`
            }} />
          </>
        )}
        {shouldRegisterSw && (
          <Script id="register-sw" strategy="afterInteractive" dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      registrations.forEach(function(reg) { reg.unregister(); });
                    });
                    if (window.caches && caches.keys) {
                      caches.keys().then(function(keys) {
                        keys.forEach(function(key) { caches.delete(key); });
                      });
                    }
                    return;
                  }
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    registration.update?.();
                  }).catch(function(err) {
                    // SW registration failed silently
                  });
                });
              }
            `
          }} />
        )}
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-slate-900 bg-[#fdfdff]`}>
        {/* Google Tag Manager (noscript) — must be immediately after <body> per GTM spec */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {/* Skip Navigation Link for Accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md">
          Chuyển đến nội dung chính
        </a>
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider>
              <CartProvider>
                <ChatOpenProvider>
                  {children}
                  <DynamicFavicon />
                  <LiveSalesPopup />
                </ChatOpenProvider>
                {/* Đã xóa BottomNav và ChatWidgetClient ở đây vì gây trùng lặp với ShopLayout */}
                <Toaster position="top-center" richColors />
              </CartProvider>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
