/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import dynamic from "next/dynamic";
import HeroCarousel from "@/components/shared/HeroCarousel";
import CategoryShowcase from "@/components/shared/CategoryShowcase";
import FlashSaleBanner from "@/components/shared/FlashSaleBanner";
import HomeSearchBar from "@/components/shared/HomeSearchBar";
import StructuredData from "@/components/seo/StructuredData";
import InternalLinks from "@/components/seo/InternalLinks";
import { RecentlyViewedClient } from "@/components/shared/ClientWrappers";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/ui/product-skeleton";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import PersonalizedRecommendationsSection from "@/components/home/PersonalizedRecommendationsSection";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// Lazy-load các section dưới fold để giảm JS ban đầu & cải thiện INP
const WhyChooseUs = dynamic(
  () => import("@/components/shared/WhyChooseUs"),
  { ssr: true }
);

const StatsSection = dynamic(
  () => import("@/components/shared/StatsSection"),
  { ssr: true }
);

const VietnamStory = dynamic(
  () => import("@/components/shared/VietnamStory"),
  { ssr: true }
);

const CustomerReviews = dynamic(
  () => import("@/components/shared/CustomerReviews"),
  { ssr: true }
);

const RecentPosts = dynamic(
  () => import("@/components/shared/RecentPosts"),
  { ssr: true }
);



// SEO Metadata
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const isEn = cookieStore.get("language")?.value === "en";

  const title = isEn
    ? "LIKEFOOD - Authentic Vietnamese Specialty Food in USA | Shop 100+ Products"
    : "LIKEFOOD - Đặc Sản Việt Nam Chính Gốc Tại Mỹ | 100+ Sản Phẩm | Giao Nhanh 2-3 Ngày";
  const description = isEn
    ? "Shop 100+ authentic Vietnamese dried seafood, fruits, and regional specialties at LIKEFOOD. Premium quality, FDA approved. Fast 2-3 day delivery across USA. Free shipping from $500."
    : "LIKEFOOD - Cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. 100+ sản phẩm chính gốc: cá khô miền Tây, tôm khô Cà Mau, mực khô, trái cây sấy, mắm truyền thống. Giao 2-3 ngày. Miễn phí ship từ $500.";

  return {
    title: { absolute: title },
    description,
    keywords: [
      "likefood", "likefood là gì", "LIKEFOOD", "like food",
      "đặc sản Việt Nam", "đặc sản Việt Nam tại Mỹ", "mua đặc sản Việt Nam online",
      "ca kho", "cá khô miền tây", "tom kho", "tôm khô cà mau",
      "muc kho", "mực khô", "khô bò", "khô gà",
      "Vietnamese dried seafood", "Vietnamese food USA", "Vietnamese specialty store",
      "trái cây sấy", "mứt Tết", "gia vị Việt Nam",
      "ship đặc sản Việt Nam sang Mỹ", "thực phẩm Việt tại Hoa Kỳ",
      "dried fish USA", "dried shrimp USA", "Vietnamese grocery online",
      "đặc sản quê hương", "đồ khô Việt Nam",
    ],
    authors: [{ name: "LIKEFOOD Team" }],
    creator: "LIKEFOOD",
    publisher: "LIKEFOOD",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: "/",
      languages: {
        'vi': '/?lang=vi',
        'en': '/?lang=en',
        'x-default': '/?lang=vi',
      },
    },
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "vi_VN",
      alternateLocale: isEn ? "vi_VN" : "en_US",
      url: process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app",
      siteName: "LIKEFOOD",
      title,
      description,
      images: [{
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LIKEFOOD - Vietnamese Specialty Food Store"
      }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image.png"],
      creator: "@likefood"
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    // Google verification is handled in root layout.tsx via NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION env var
  };
}

// ISR: Revalidate home page every 5 minutes
export const revalidate = 300;

export default async function Home() {
  // Fetch homepage section visibility config from admin
  let sectionConfig: Record<string, { isActive: boolean; position: number }> = {};
  try {
    const sections = await prisma.homepageSection.findMany({
      select: { key: true, isActive: true, position: true },
    });
    sectionConfig = Object.fromEntries(
      sections.map((s) => [s.key, { isActive: s.isActive, position: s.position }])
    );
  } catch {
    // DB unavailable — show everything by default
  }

  // Returns true if section is active (defaults to true if not configured in admin)
  const show = (key: string) => sectionConfig[key]?.isActive ?? true;

  return (
    <>
      <StructuredData />
      <div className="flex flex-col gap-0">
        {/* Section 1: Hero Banner với Overlay */}
        {show("hero") && <section aria-label="Banner chính"><HeroCarousel /></section>}
        {show("flash-sale") && <section aria-label="Flash Sale"><FlashSaleBanner /></section>}

        {/* Section 1.5: Homepage Search Bar */}
        {show("search") && <section aria-label="Tìm kiếm"><HomeSearchBar /></section>}

        {/* Section 2: Category Showcase */}
        {show("categories") && <section aria-label="Danh mục sản phẩm"><CategoryShowcase /></section>}

        {/* Section 3: Product Suggestions - Streaming with Skeleton */}
        {show("featured-products") && (
        <section aria-label="Gợi ý sản phẩm">
        <Suspense fallback={
          <div className="w-full px-4 sm:px-6 lg:px-[6%] py-20">
            <div className="mb-12 text-center">
              <div className="h-4 w-32 bg-slate-200 rounded-full mx-auto mb-4 animate-pulse" />
              <div className="h-10 w-64 bg-slate-200 rounded-2xl mx-auto animate-pulse" />
            </div>
            <ProductGridSkeleton count={4} />
          </div>
        }>
          <FeaturedProductsSection />
        </Suspense>
        </section>
        )}

        {/* Section 4: Why Choose Us */}
        {show("why-us") && <section aria-label="Tại sao chọn LIKEFOOD"><WhyChooseUs /></section>}

        {/* Section 4.2: Personalized / Trending Recommendations */}
        {show("recommendations") && <section aria-label="Gợi ý cho bạn"><PersonalizedRecommendationsSection /></section>}

        {/* Section 4.5: Stats Section */}
        {show("stats") && <section aria-label="Thống kê"><StatsSection /></section>}

        {/* Section 5: Vietnam Story */}
        {show("vietnam-story") && <section aria-label="Câu chuyện Việt Nam"><VietnamStory /></section>}

        {/* Section 7: Customer Reviews */}
        {show("testimonials") && <section aria-label="Đánh giá khách hàng"><CustomerReviews /></section>}

        {/* Section 8: Recent Posts */}
        {show("posts") && <section aria-label="Bài viết mới nhất"><RecentPosts /></section>}

        {/* Section 7.5: Recently Viewed Products */}
        {show("recently-viewed") && <section aria-label="Sản phẩm đã xem gần đây"><RecentlyViewedClient /></section>}

        {/* Section 9: SEO Internal Links */}
        <section aria-label="Liên kết nội bộ" style={{ padding: '0 1rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <InternalLinks />
        </section>

      </div>
    </>
  );
}
