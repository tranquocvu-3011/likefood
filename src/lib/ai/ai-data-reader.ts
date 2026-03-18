"use server";

/**
 * LIKEFOOD - AI Data Reader Service
 * Đọc dữ liệu thật từ SQL để cung cấp context cho AI chatbot
 * AI sẽ tư vấn dựa trên data thật: products, orders, reviews, flash sales
 * Copyright (c) 2026 LIKEFOOD Team
 */

import prisma from "@/lib/prisma";
import { searchKnowledge } from "@/lib/ai/knowledge-base";

// ─── TTL Cache (reduces DB load for slow-changing data) ─────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const USER_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for user data
interface CacheEntry<T> { data: T; expiresAt: number; }
const _dataCache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fetcher: () => Promise<T>, ttl = CACHE_TTL_MS): Promise<T> {
  const existing = _dataCache.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() < existing.expiresAt) return existing.data;
  const data = await fetcher();
  _dataCache.set(key, { data, expiresAt: Date.now() + ttl });
  // Evict old entries (keep max 20)
  if (_dataCache.size > 50) {
    const oldestKey = _dataCache.keys().next().value;
    if (oldestKey) _dataCache.delete(oldestKey);
  }
  return data;
}

export async function clearDataCache() { _dataCache.clear(); }

// ─── Types ───────────────────────────────────────────────────

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  category: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  inventory: number;
  description: string;
  isOnSale: boolean;
}

export interface UserPurchaseProfile {
  totalOrders: number;
  totalSpent: number;
  favoriteCategories: string[];
  recentProducts: string[];
  averageOrderValue: number;
  lastOrderDate: string | null;
  segments: string[];
}

export interface StoreSnapshot {
  totalProducts: number;
  totalCategories: number;
  trending: ProductSummary[];
  bestSellers: ProductSummary[];
  newArrivals: ProductSummary[];
  onSale: ProductSummary[];
  flashSaleActive: boolean;
  flashSaleProducts: ProductSummary[];
}

export interface ProductInsight {
  product: ProductSummary;
  avgRating: number;
  topReviews: { rating: number; comment: string; author: string }[];
  relatedProducts: ProductSummary[];
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
}

// ─── Helpers ─────────────────────────────────────────────────

function mapProduct(p: {
  id: number;
  name: string;
  slug: string | null;
  price: number;
  salePrice: number | null;
  category: string;
  brand?: { name: string } | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  soldCount: number;
  inventory: number;
  description: string;
  isOnSale: boolean | null;
}): ProductSummary {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug ?? String(p.id),
    price: p.price,
    salePrice: p.salePrice,
    category: p.category,
    brand: p.brand?.name ?? undefined,
    rating: p.ratingAvg ?? 0,
    reviewCount: p.ratingCount ?? 0,
    soldCount: p.soldCount,
    inventory: p.inventory,
    description: p.description?.slice(0, 400) ?? "",
    isOnSale: !!p.isOnSale,
  };
}

// ─── 1. User Purchase History ────────────────────────────────

export async function getUserPurchaseProfile(userId: number): Promise<UserPurchaseProfile> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId, status: { in: ["DELIVERED", "COMPLETED", "SHIPPED", "CONFIRMED"] } },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((s, o) => s + (o.total ?? 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    const categoryCounts: Record<string, number> = {};
    const recentProducts: string[] = [];

    for (const order of orders.slice(0, 10)) {
      for (const item of order.orderItems) {
        const cat = item.product?.category ?? "unknown";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
        if (recentProducts.length < 10 && item.product?.name) {
          recentProducts.push(item.product.name);
        }
      }
    }

    const favoriteCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    const segments: string[] = [];
    if (totalOrders >= 5) segments.push("repeat_customer");
    else if (totalOrders >= 1) segments.push("new_customer");
    if (averageOrderValue > 100) segments.push("high_value");
    if (totalOrders === 0) segments.push("browser_only");

    return {
      totalOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      favoriteCategories,
      recentProducts,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      lastOrderDate: orders[0]?.createdAt?.toISOString() ?? null,
      segments,
    };
  } catch (error) {
    console.error("[AI_DATA_READER] getUserPurchaseProfile error:", error);
    return {
      totalOrders: 0, totalSpent: 0, favoriteCategories: [],
      recentProducts: [], averageOrderValue: 0, lastOrderDate: null, segments: ["unknown"],
    };
  }
}

// ─── 2. Smart Recommendations ────────────────────────────────

export async function getSmartRecommendations(
  query: string,
  userId?: number,
  limit = 6
): Promise<{ products: ProductSummary[]; reason: string }> {
  try {
    // Extract keywords from query
    const keywords = query
      .toLowerCase()
      .replace(/[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 1);

    let userProfile: UserPurchaseProfile | null = null;
    if (userId) {
      userProfile = await getUserPurchaseProfile(userId);
    }

    // ★ Build search conditions with word permutations
    // "cá khô" → search for "cá", "khô", AND "khô cá" (reversed)
    const searchTerms = [...keywords];
    
    // Add reversed pairs (cá khô → khô cá)
    if (keywords.length >= 2) {
      for (let i = 0; i < keywords.length - 1; i++) {
        searchTerms.push(`${keywords[i + 1]} ${keywords[i]}`); // reversed pair
        searchTerms.push(`${keywords[i]} ${keywords[i + 1]}`); // original pair
      }
    }

    const searchConditions = searchTerms.length > 0
      ? { OR: searchTerms.map(term => ({
          OR: [
            { name: { contains: term } },
            { description: { contains: term } },
            { category: { contains: term } },
          ]
        })) }
      : {};

    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        inventory: { gt: 0 },
        ...searchConditions,
      },
      include: { brand: { select: { name: true } } },
      orderBy: [{ soldCount: "desc" }, { ratingAvg: "desc" }],
      take: limit * 2,
    });

    let results = products.map(mapProduct);

    // Boost products from user's favorite categories
    if (userProfile && userProfile.favoriteCategories.length > 0) {
      const favCats = new Set(userProfile.favoriteCategories);
      results.sort((a, b) => {
        const aBoost = favCats.has(a.category) ? 1 : 0;
        const bBoost = favCats.has(b.category) ? 1 : 0;
        return bBoost - aBoost || b.soldCount - a.soldCount;
      });
    }

    results = results.slice(0, limit);

    const reason = userProfile && userProfile.totalOrders > 0
      ? `Gợi ý dựa trên ${userProfile.totalOrders} đơn hàng trước và danh mục yêu thích: ${userProfile.favoriteCategories.join(", ")}`
      : keywords.length > 0
        ? `Kết quả tìm kiếm cho: "${keywords.join(" ")}"`
        : "Sản phẩm phổ biến nhất";

    return { products: results, reason };
  } catch (error) {
    console.error("[AI_DATA_READER] getSmartRecommendations error:", error);
    return { products: [], reason: "Không thể tải dữ liệu sản phẩm" };
  }
}

// ─── 3. Product Insights ─────────────────────────────────────

export async function getProductInsights(productId: number): Promise<ProductInsight | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: { select: { name: true } },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!product) return null;

    const related = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: productId },
        isDeleted: false,
        inventory: { gt: 0 },
      },
      include: { brand: { select: { name: true } } },
      orderBy: { soldCount: "desc" },
      take: 4,
    });

    const stockStatus = product.inventory <= 0
      ? "out_of_stock"
      : product.inventory < 10
        ? "low_stock"
        : "in_stock";

    return {
      product: mapProduct(product),
      avgRating: product.ratingAvg ?? 0,
      topReviews: product.reviews.map(r => ({
        rating: r.rating,
        comment: r.comment?.slice(0, 150) ?? "",
        author: r.user?.name ?? "Khách",
      })),
      relatedProducts: related.map(mapProduct),
      stockStatus,
    };
  } catch (error) {
    console.error("[AI_DATA_READER] getProductInsights error:", error);
    return null;
  }
}

// ─── 4. Store Snapshot ───────────────────────────────────────

export async function getStoreSnapshot(): Promise<StoreSnapshot> {
  try {
    const [totalProducts, categories, trending, newArrivals, onSale, flashSales] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.findMany({ where: { isDeleted: false }, select: { category: true }, distinct: ["category"] }),
      prisma.product.findMany({
        where: { isDeleted: false, inventory: { gt: 0 } },
        include: { brand: { select: { name: true } } },
        orderBy: { soldCount: "desc" },
        take: 6,
      }),
      prisma.product.findMany({
        where: { isDeleted: false, inventory: { gt: 0 } },
        include: { brand: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.product.findMany({
        where: { isDeleted: false, isOnSale: true, inventory: { gt: 0 } },
        include: { brand: { select: { name: true } } },
        orderBy: { soldCount: "desc" },
        take: 6,
      }),
      prisma.flashsalecampaign.findMany({
        where: { isActive: true, startAt: { lte: new Date() }, endAt: { gte: new Date() } },
        include: {
          products: {
            include: {
              product: { include: { brand: { select: { name: true } } } },
            },
            take: 6,
          },
        },
        take: 1,
      }),
    ]);

    const activeSale = flashSales[0];
    const flashSaleProducts = activeSale
      ? activeSale.products.map(item => mapProduct(item.product))
      : [];

    return {
      totalProducts,
      totalCategories: categories.length,
      trending: trending.map(mapProduct),
      bestSellers: trending.map(mapProduct),
      newArrivals: newArrivals.map(mapProduct),
      onSale: onSale.map(mapProduct),
      flashSaleActive: !!activeSale,
      flashSaleProducts,
    };
  } catch (error) {
    console.error("[AI_DATA_READER] getStoreSnapshot error:", error);
    return {
      totalProducts: 0, totalCategories: 0, trending: [],
      bestSellers: [], newArrivals: [], onSale: [],
      flashSaleActive: false, flashSaleProducts: [],
    };
  }
}

// ─── 5. Compact Product Catalog (cho AI biết TOÀN BỘ sản phẩm) ─

export async function getFullProductCatalog(): Promise<string> {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false, inventory: { gt: 0 } },
      select: { name: true, category: true, price: true, salePrice: true },
      orderBy: [{ category: "asc" }, { soldCount: "desc" }],
    });

    // Group by category — compact format
    const categories: Record<string, string[]> = {};
    for (const p of products) {
      if (!categories[p.category]) categories[p.category] = [];
      const sale = p.salePrice ? ` (sale $${p.salePrice})` : "";
      categories[p.category].push(`${p.name} $${p.price}${sale}`);
    }

    const lines: string[] = [];
    lines.push(`📦 DANH MỤC SẢN PHẨM LIKEFOOD (${products.length} SP, ${Object.keys(categories).length} danh mục):`);

    for (const [category, items] of Object.entries(categories)) {
      lines.push(`\n── ${category} (${items.length} SP) ──`);
      lines.push(items.join(" | "));
    }

    return lines.join("\n");
  } catch (error) {
    console.error("[AI_DATA_READER] getFullProductCatalog error:", error);
    return "";
  }
}

// ─── 6. Brands Info ──────────────────────────────────────────

export async function getBrandsInfo(): Promise<string> {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      select: {
        name: true,
        nameEn: true,
        slug: true,
        _count: { select: { products: { where: { isDeleted: false } } } },
      },
      orderBy: { products: { _count: "desc" } },
    });

    if (brands.length === 0) return "";

    return `🏷️ THƯƠNG HIỆU ĐANG BÁN (${brands.length} thương hiệu):
${brands.map(b => `- ${b.name}${b.nameEn ? ` (${b.nameEn})` : ""}: ${b._count.products} sản phẩm`).join("\n")}`;
  } catch {
    return "";
  }
}

// ─── 7. User Recent Orders (for order tracking) ─────────────

export async function getUserRecentOrders(userId: number): Promise<string> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: { product: { select: { name: true } } },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (orders.length === 0) return "";

    const statusMap: Record<string, string> = {
      PENDING: "⏳ Chờ xác nhận",
      CONFIRMED: "✅ Đã xác nhận",
      SHIPPED: "🚚 Đang giao",
      DELIVERED: "📦 Đã giao",
      COMPLETED: "✔️ Hoàn tất",
      CANCELLED: "❌ Đã hủy",
    };

    return `📦 ĐƠN HÀNG GẦN ĐÂY CỦA KHÁCH (${orders.length} đơn gần nhất):
${orders.map(o => {
  const items = o.orderItems.map(i => i.product?.name ?? "SP").join(", ");
  const status = statusMap[o.status] || o.status;
  const date = o.createdAt.toLocaleDateString("vi-VN");
  const tracking = o.trackingCode ? ` | Tracking: ${o.trackingCode}` : "";
  return `- Đơn #${o.id} (${date}): $${o.total} — ${status}${tracking}
  SP: ${items.slice(0, 100)}`;
}).join("\n")}
→ Dùng thông tin này để trả lời khi KH hỏi "đơn hàng của tôi" hoặc "theo dõi đơn hàng"`;
  } catch {
    return "";
  }
}

// ─── 8. Blog Highlights (tips, recipes, news) ───────────────

export async function getBlogHighlights(query: string): Promise<string> {
  try {
    const normalizedQuery = query.toLowerCase();
    const keywords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

    // Check if query is about recipes, tips, cooking, or blog content
    const blogRelatedTerms = [
      "nấu", "chế biến", "công thức", "cách làm", "recipe", "cook", "tip",
      "bài viết", "blog", "tin tức", "news", "hướng dẫn", "guide",
      "bảo quản", "cách dùng", "sử dụng", "pha", "how to",
    ];

    const isBlogRelevant = blogRelatedTerms.some(t => normalizedQuery.includes(t));
    if (!isBlogRelevant && keywords.length === 0) return "";

    const whereConditions = keywords.length > 0
      ? {
          isPublished: true,
          OR: keywords.map(kw => ({
            OR: [
              { title: { contains: kw } },
              { summary: { contains: kw } },
              { content: { contains: kw } },
            ],
          })),
        }
      : { isPublished: true };

    const posts = await prisma.post.findMany({
      where: whereConditions,
      select: {
        title: true,
        slug: true,
        summary: true,
        category: true,
        content: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });

    if (posts.length === 0) return "";

    return `📝 BÀI VIẾT LIÊN QUAN (từ Blog LIKEFOOD):
${posts.map(p => {
  // Extract first 300 chars of content, strip HTML
  const cleanContent = (p.content || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .slice(0, 300);
  return `- **${p.title}** [${p.category || "Blog"}] — /blog/${p.slug}
  ${p.summary?.slice(0, 150) || cleanContent.slice(0, 150)}...`;
}).join("\n")}
→ Gợi ý bài viết liên quan khi KH hỏi về cách nấu, công thức, hoặc tips sử dụng SP`;
  } catch {
    return "";
  }
}

// ─── 9. Store Config (address, contact from DB) ─────────────

export async function getStoreConfig(): Promise<string> {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        isPublic: true,
        key: {
          in: [
            "store_address", "store_phone", "store_email",
            "store_name", "free_shipping_threshold",
            "shipping_standard_days", "shipping_express_days",
            "return_policy_days", "points_per_dollar",
          ],
        },
      },
    });

    if (configs.length === 0) return "";

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    const lines: string[] = ["🏪 CẤU HÌNH CỬA HÀNG (từ Database):"];
    if (configMap.store_name) lines.push(`- Tên: ${configMap.store_name}`);
    if (configMap.store_address) lines.push(`- Địa chỉ: ${configMap.store_address}`);
    if (configMap.store_phone) lines.push(`- Hotline: ${configMap.store_phone}`);
    if (configMap.store_email) lines.push(`- Email: ${configMap.store_email}`);
    if (configMap.free_shipping_threshold) lines.push(`- Free ship từ: $${configMap.free_shipping_threshold}`);
    if (configMap.shipping_standard_days) lines.push(`- Standard shipping: ${configMap.shipping_standard_days} ngày`);
    if (configMap.shipping_express_days) lines.push(`- Express shipping: ${configMap.shipping_express_days} ngày`);
    if (configMap.return_policy_days) lines.push(`- Đổi trả: ${configMap.return_policy_days} ngày`);
    if (configMap.points_per_dollar) lines.push(`- Tích điểm: ${configMap.points_per_dollar} xu / $1`);

    return lines.length > 1 ? lines.join("\n") : "";
  } catch {
    return "";
  }
}

// ─── 10. User Points Balance ─────────────────────────────────

export async function getUserPointsBalance(userId: number): Promise<string> {
  try {
    const result = await prisma.pointtransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const balance = result._sum.amount ?? 0;
    if (balance <= 0) return "";

    return `💰 LIKEFOOD XU: Khách hàng hiện có **${balance} xu** (quy đổi ~$${(balance * 0.01).toFixed(2)})
→ Nhắc KH sử dụng xu khi thanh toán để tiết kiệm!`;
  } catch {
    return "";
  }
}

// ─── 11. Build AI Context String (ENHANCED) ──────────────────

export async function buildAIContext(
  query: string,
  userId?: number
): Promise<string> {
  const parts: string[] = [];

  // ★ LIKEFOOD IDENTITY (no DB query — instant)
  parts.push(`🏢 LIKEFOOD — Cửa hàng đặc sản Việt Nam online tại Mỹ
📌 E-commerce chuyên đặc sản VN chính hãng. Sứ mệnh: kết nối hương vị quê nhà với kiều bào & người yêu ẩm thực Việt tại Hoa Kỳ.
📍 Omaha, NE 68136 | ☎ 402-315-8105 | ✉ tranquocvu3011@gmail.com | Telegram: t.me/tranquocvu3011 | FB: fb.com/vudev05
🌟 100% nhập khẩu VN | Kiểm tra chất lượng | Giao toàn Mỹ (50 bang) | Đóng gói giữ hương vị | Hỗ trợ 24/7 Việt-Anh | Đổi trả 7 ngày
🛒 Danh mục: 🐟Hải sản khô | 🧂Gia vị | 🍵Trà & Cà phê | 🍬Bánh kẹo & Snacks | 🥩Thịt chế biến | 🎁Quà biếu
🌐 Tính năng: Giỏ hàng, Checkout (Visa/MC/Amex/PayPal/Apple Pay/Google Pay/COD), Tracking, Review, Blog, Flash Sale, Coupon, Chat AI + Live Chat
💰 Xu: $1=1xu | Check-in +5xu/ngày | Mốc 200/300/500/1000xu→voucher | Pickup: $1=2xu
🚚 Ship: Standard 5-7d FREE từ $99 | Express 2-3d FREE từ $199 | Pickup FREE
💳 Thanh toán: Visa/MC/Amex (Stripe), PayPal, Apple Pay, Google Pay, COD
🔄 Đổi trả 7 ngày | Hoàn tiền 5-7 ngày | Hỗ trợ: AI 24/7, Live Chat, Hotline 402-315-8105`);

  // ★ FAST data fetch with 8s timeout
  try {
    const contextPromise = (async () => {
      // Layer 1: Product catalog (cached 5min, single lightweight query)
      const catalog = await cached("catalog", async () => {
        const products = await prisma.product.findMany({
          where: { isDeleted: false },
          select: {
            name: true, price: true, salePrice: true, category: true,
            inventory: true, isOnSale: true, soldCount: true, ratingAvg: true,
          },
          orderBy: { soldCount: "desc" },
        });
        if (products.length === 0) return "";
        // Group by category
        const byCategory: Record<string, typeof products> = {};
        for (const p of products) {
          if (!byCategory[p.category]) byCategory[p.category] = [];
          byCategory[p.category].push(p);
        }
        return `📦 TOÀN BỘ SẢN PHẨM (${products.length} SP):\n` +
          Object.entries(byCategory).map(([cat, items]) =>
            `\n📂 ${cat} (${items.length} SP):\n` +
            items.map(p => {
              const sale = p.salePrice ? ` ⚡SALE $${p.salePrice}` : "";
              const stock = p.inventory < 10 ? " ⚠️SẮP HẾT" : "";
              return `- ${p.name} — $${p.price}${sale} | Kho: ${p.inventory}${stock}`;
            }).join("\n")
          ).join("\n");
      });
      if (catalog) parts.push(catalog);

      // Layer 2: Knowledge search (cached per query)  
      try {
        const knowledge = await cached(`kb:${query.slice(0, 40)}`, () => searchKnowledge(query, "vi", 3));
        if (knowledge.length > 0) {
          parts.push(`\n📚 KIẾN THỨC:\n${knowledge.map(k => `❓ ${k.question}\n✅ ${k.answer}`).join("\n")}`);
        }
      } catch { /* skip if fails */ }

      // Layer 3: Active coupons (cached 5min)
      try {
        const coupons = await cached("coupons", async () => {
          const c = await prisma.coupon.findMany({
            where: { isActive: true, endDate: { gte: new Date() }, startDate: { lte: new Date() } },
            take: 5,
            orderBy: { discountValue: "desc" },
          });
          return c.length > 0 ? `\n🎟 MÃ GIẢM GIÁ:\n${c.map(x => `- **${x.code}**: Giảm ${x.discountType === "PERCENT" ? `${x.discountValue}%` : `$${x.discountValue}`}${x.minOrderValue ? ` (min $${x.minOrderValue})` : ""}`).join("\n")}` : "";
        });
        if (coupons) parts.push(coupons);
      } catch { /* skip if fails */ }

      // Layer 4: User data (only if logged in, cached 2min)
      if (userId) {
        try {
          const [profile, points] = await Promise.all([
            cached(`user:profile:${userId}`, () => getUserPurchaseProfile(userId), USER_CACHE_TTL_MS),
            cached(`user:points:${userId}`, () => getUserPointsBalance(userId), USER_CACHE_TTL_MS),
          ]);
          if (profile.totalOrders > 0) {
            parts.push(`\n👤 KH: ${profile.totalOrders} đơn | $${profile.totalSpent} | Yêu thích: ${profile.favoriteCategories.join(", ")} | Gần đây: ${profile.recentProducts.slice(0, 4).join(", ")}`);
          }
          if (points) parts.push(points);
        } catch { /* skip if fails */ }
      }
    })();

    // Timeout 8 seconds — don't let context building block forever
    await Promise.race([
      contextPromise,
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Context timeout")), 8000)),
    ]);
  } catch (err) {
    // If timeout or error → still return what we have (identity is always included)
    if ((err as Error)?.message !== "Context timeout") {
      console.error("[AI] Context build error:", err);
    }
  }

  // AI instructions (compact)
  parts.push(`\n📋 TƯ VẤN: Dùng data THẬT, **bold** tên SP/giá. Gợi ý combo, mã giảm giá, freeship. Cross-sell SP liên quan.`);

  return parts.join("\n");
}

