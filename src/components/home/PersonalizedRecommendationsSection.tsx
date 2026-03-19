"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/product-skeleton";
import { useLanguage } from "@/lib/i18n/context";

interface RecommendedProduct {
  id?: number;
  productId?: number;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  isOnSale?: boolean;
  image: string | null;
  category: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  inventory?: number;
  score: number;
  reason: string;
}

export default function PersonalizedRecommendationsSection() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);

        // Read browse history from localStorage (recentlyViewed products)
        let browseHistory: string[] = [];
        try {
          const stored = localStorage.getItem("recentlyViewed");
          if (stored) {
            const parsed = JSON.parse(stored);
            browseHistory = Array.isArray(parsed)
              ? parsed.map((p: { id?: number; productId?: number }) => String(p.id || p.productId)).filter(Boolean).slice(0, 20)
              : [];
          }
        } catch { /* ignore */ }

        if (session?.user?.id) {
          // Personalized for logged-in users — pass browseHistory for dynamic results
          const res = await fetch("/api/recommendations/personalized", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: Number(session.user.id),
              browseHistory,
              limit: 6,
              _t: Date.now(), // cache-bust for fresh results
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.products?.length > 0) {
              setProducts(data.products.slice(0, 6));
              setTitle(t("home.suggestionsForYou"));
              setSubtitle(t("home.basedOnHistory"));
              return;
            }
          }
        }

        // Fallback: trending products with time-seed for rotation
        const res = await fetch(`/api/recommendations/products?type=trending&limit=6&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts((data.products ?? []).slice(0, 6));
          setTitle(t("home.trendingProducts"));
          setSubtitle(t("home.mostLovedWeek"));
        }
      } catch {
        // Silently fall through — section simply won't render
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();

    // Auto-refresh every 5 minutes for dynamic rotation
    const interval = setInterval(fetchRecommendations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session?.user?.id, t]);

  if (!isLoading && products.length === 0) return null;

  const isPersonalized = !!session?.user;
  const displayTitle = title || t("home.suggestionsForYou");
  const displaySubtitle = subtitle;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">{displayTitle}</h2>
          {displaySubtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{displaySubtitle}</p>
          )}
        </div>
        <Link
          href="/products"
          className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors shrink-0"
        >
          {t("common.viewAll")}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Product Grid — exactly 6 products, fixed 3-col × 2-row */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.slice(0, 6).map((p, i) => {
              const productId = p.id || p.productId || p.slug || `rec-${i}`;
              const hasSalePrice = p.salePrice != null && p.salePrice < p.price;
              const currentPrice = (hasSalePrice ? p.salePrice : p.price) ?? p.price;
              const comparePrice =
                p.originalPrice != null && p.originalPrice > currentPrice
                  ? p.originalPrice
                  : hasSalePrice
                    ? p.price
                    : null;
              const onSale = !!p.isOnSale || !!comparePrice;

              return (
                <ProductCard
                  key={productId}
                  product={{
                    id: p.id || p.productId || 0,
                    slug: p.slug,
                    name: p.name,
                    price: currentPrice,
                    originalPrice: comparePrice,
                    category: p.category,
                    image: p.image || null,
                    inventory: p.stock ?? p.inventory ?? 99,
                    ratingAvg: p.rating,
                    ratingCount: p.reviewCount,
                    isOnSale: onSale,
                    salePrice: onSale ? currentPrice : null,
                  }}
                />
              );
            })}
      </div>
    </section>
  );
}
