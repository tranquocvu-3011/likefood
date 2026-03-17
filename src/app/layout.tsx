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
    default: "LIKEFOOD | Đặc sản Việt Nam tại Mỹ",
    template: "%s | LIKEFOOD"
  },
  description: "Nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chất lượng cao tại Hoa Kỳ. Giao hàng nhanh, đảm bảo vệ sinh ATTP, hỗ trợ tư vấn 24/7.",
  keywords: ["đặc sản Việt Nam", "Vietnamese specialty food", "LIKEFOOD", "likefood là gì", "like food", "cá khô miền tây", "tôm khô cà mau", "mực khô", "khô bò", "thực phẩm Việt tại Mỹ", "Vietnamese food in USA", "dried fish", "dried shrimp", "đặc sản Việt Nam tại Mỹ", "mua đặc sản Việt Nam online", "ship đặc sản Việt Nam sang Mỹ", "Vietnamese grocery online", "đồ khô Việt Nam", "trái cây sấy Việt Nam", "gia vị Việt"],
  authors: [{ name: "Trần Quốc Vũ", url: "https://www.facebook.com/profile.php?id=100076170558548" }],
  creator: "Trần Quốc Vũ",
  publisher: "LIKEFOOD",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn"),
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
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn",
    siteName: "LIKEFOOD",
    title: "LIKEFOOD | Đặc sản Việt Nam tại Mỹ",
    description: "Nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chất lượng cao tại Hoa Kỳ. Giao hàng nhanh, đảm bảo vệ sinh ATTP.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LIKEFOOD - Đặc sản Việt Nam",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LIKEFOOD | Đặc sản Việt Nam tại Mỹ",
    description: "Nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chất lượng cao tại Hoa Kỳ.",
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
