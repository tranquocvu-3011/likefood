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
interface CacheEntry<T> { data: T; expiresAt: number; }
const _dataCache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fetcher: () => Promise<T>, ttl = CACHE_TTL_MS): Promise<T> {
  const existing = _dataCache.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() < existing.expiresAt) return existing.data;
  const data = await fetcher();
  _dataCache.set(key, { data, expiresAt: Date.now() + ttl });
  // Evict old entries (keep max 20)
  if (_dataCache.size > 20) {
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
    description: p.description?.slice(0, 500) ?? "",
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

  // ★ Cached: catalog, snapshot, config, brands (TTL 5min)
  const [catalog, snapshot, storeConfig, brandsInfo] = await Promise.all([
    cached("catalog", getFullProductCatalog),
    cached("snapshot", getStoreSnapshot),
    cached("config", getStoreConfig),
    cached("brands", getBrandsInfo),
  ]);

  if (catalog) parts.push(catalog);

  parts.push(`📊 THÔNG TIN CỬA HÀNG THẬT:
- Tổng sản phẩm: ${snapshot.totalProducts} (${snapshot.totalCategories} danh mục)
- Flash Sale: ${snapshot.flashSaleActive ? "ĐANG DIỄN RA" : "Không có"}`);

  if (storeConfig) parts.push(`\n${storeConfig}`);
  if (brandsInfo) parts.push(`\n${brandsInfo}`);



  // Trending products
  if (snapshot.trending.length > 0) {
    parts.push(`\n🔥 SẢN PHẨM BÁN CHẠY NHẤT (từ database thật):
${snapshot.trending.slice(0, 5).map((p, i) => 
  `${i + 1}. ${p.name} — $${p.price}${p.salePrice ? ` (giảm còn $${p.salePrice})` : ""} | ⭐${p.rating.toFixed(1)} (${p.reviewCount} đánh giá) | Đã bán: ${p.soldCount} | Kho: ${p.inventory}
   Mô tả: ${p.description || "Đặc sản Việt Nam chất lượng cao"}`
).join("\n")}`);
  }

  // Flash sale products
  if (snapshot.flashSaleActive && snapshot.flashSaleProducts.length > 0) {
    parts.push(`\n⚡ FLASH SALE ĐANG DIỄN RA:
${snapshot.flashSaleProducts.slice(0, 4).map(p =>
  `- ${p.name} — $${p.salePrice ?? p.price} (gốc $${p.price}) | Tiết kiệm ${p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0}%`
).join("\n")}`);
  }

  // On-sale products
  if (snapshot.onSale.length > 0) {
    parts.push(`\n🏷️ SẢN PHẨM ĐANG GIẢM GIÁ:
${snapshot.onSale.slice(0, 4).map(p =>
  `- ${p.name} — $${p.salePrice ?? p.price} (gốc $${p.price})`
).join("\n")}`);
  }

  // New arrivals
  if (snapshot.newArrivals.length > 0) {
    parts.push(`\n🆕 SẢN PHẨM MỚI:
${snapshot.newArrivals.slice(0, 4).map(p =>
  `- ${p.name} — $${p.price} | ${p.category}
   Mô tả: ${p.description?.slice(0, 200) || "Sản phẩm mới nhập"}`
).join("\n")}`);
  }

  // User profile (personalized)
  if (userId) {
    const profile = await getUserPurchaseProfile(userId);
    if (profile.totalOrders > 0) {
      parts.push(`\n👤 THÔNG TIN KHÁCH HÀNG (đã đăng nhập):
- Tổng đơn: ${profile.totalOrders} | Chi tiêu: $${profile.totalSpent} | Trung bình: $${profile.averageOrderValue}/đơn
- Danh mục yêu thích: ${profile.favoriteCategories.join(", ") || "Chưa xác định"}
- Sản phẩm mua gần đây: ${profile.recentProducts.slice(0, 5).join(", ")}
- Phân loại: ${profile.segments.join(", ")}
→ Dùng thông tin này để GỢI Ý CÁ NHÂN HÓA cho khách hàng!`);
    }

    // ★ NEW: User order tracking
    const orderInfo = await getUserRecentOrders(userId);
    if (orderInfo) {
      parts.push(`\n${orderInfo}`);
    }

    // ★ NEW: User points balance
    const pointsInfo = await getUserPointsBalance(userId);
    if (pointsInfo) {
      parts.push(`\n${pointsInfo}`);
    }
  }

  // Search results matching query
  const recs = await getSmartRecommendations(query, userId, 6);
  if (recs.products.length > 0) {
    parts.push(`\n🎯 SẢN PHẨM PHÙ HỢP VỚI CÂU HỎI "${query}":
${recs.products.map((p, i) =>
  `${i + 1}. ${p.name} — $${p.price}${p.salePrice ? ` (sale $${p.salePrice})` : ""} | ⭐${p.rating.toFixed(1)} (${p.reviewCount} đánh giá) | Kho: ${p.inventory} | Đã bán: ${p.soldCount} | slug: ${p.slug}
   Thương hiệu: ${p.brand || "LIKEFOOD"} | Danh mục: ${p.category}
   Mô tả: ${(p.description || "Đặc sản Việt Nam").slice(0, 400)}`
).join("\n")}
Lý do: ${recs.reason}`);

    // Get reviews for top matched products
    try {
      const topProductIds = recs.products.slice(0, 3).map(p => p.id);
      const reviews = await prisma.review.findMany({
        where: {
          productId: { in: topProductIds },
          status: "APPROVED",
          comment: { not: null },
        },
        include: {
          user: { select: { name: true } },
          product: { select: { name: true } },
        },
        orderBy: { rating: "desc" },
        take: 5,
      });

      if (reviews.length > 0) {
        parts.push(`\n⭐ ĐÁNH GIÁ THẬT CỦA KHÁCH HÀNG:
${reviews.map(r =>
  `- [${r.product?.name}] ⭐${r.rating}/5 — "${r.comment?.slice(0, 120)}" — ${r.user?.name ?? "Khách"}`
).join("\n")}
→ Dùng reviews thật này để tư vấn cho khách hàng`);
      }
    } catch {
      // Silent fail for reviews
    }
  }

  // Active coupons
  try {
    const activeCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
        startDate: { lte: new Date() },
      },
      take: 5,
      orderBy: { discountValue: "desc" },
    });

    if (activeCoupons.length > 0) {
      parts.push(`\n🎫 MÃ GIẢM GIÁ ĐANG ACTIVE:
${activeCoupons.map(c =>
  `- ${c.code}: Giảm ${c.discountType === "PERCENT" ? `${c.discountValue}%` : `$${c.discountValue}`}${c.minOrderValue ? ` (đơn tối thiểu $${c.minOrderValue})` : ""} — HSD: ${c.endDate.toLocaleDateString("vi-VN")}`
).join("\n")}
→ Gợi ý mã giảm giá cho khách khi phù hợp!`);
    }
  } catch {
    // Silent fail for coupons
  }

  // ★ Knowledge Base — FAQ, Policies, Shipping, Payment
  try {
    const knowledgeResults = await searchKnowledge(query, "vi", 3);
    if (knowledgeResults.length > 0) {
      parts.push(`\n📚 KIẾN THỨC CỬA HÀNG (dùng để trả lời chính sách, vận chuyển, thanh toán...):
${knowledgeResults.map(k => `Q: ${k.question}\nA: ${k.answer}`).join("\n\n")}`);
    }
  } catch {
    // Silent fail for knowledge base
  }

  // ★ NEW: Blog highlights (recipes, tips, news)
  const blogContext = await getBlogHighlights(query);
  if (blogContext) {
    parts.push(`\n${blogContext}`);
  }

  // AI counseling instructions
  parts.push(`\n📋 HƯỚNG DẪN TƯ VẤN (hệ thống, không hiển thị cho KH):
- Khi KH hỏi về sản phẩm: SO SÁNH 2-3 sản phẩm, nêu ưu nhược điểm rõ ràng
- Khi KH chọn mua: gợi ý SẢN PHẨM KẾT HỢP (combo), mã giảm giá nếu có
- Nêu reviews thật để tạo niềm tin
- Nếu sắp hết hàng (kho < 10): nhấn mạnh để tạo urgency
- Luôn nêu giá cụ thể, tồn kho, và rating từ data
- Khi KH hỏi về chính sách: dùng phần 📚 KIẾN THỨC bên trên
- Khi KH hỏi về mô tả SP: dùng nội dung từ phần 🎯 SẢN PHẨM PHÙ HỢP
- Khi KH hỏi về đơn hàng: dùng phần 📦 ĐƠN HÀNG GẦN ĐÂY
- Khi KH hỏi cách nấu/chế biến: dùng phần 📝 BÀI VIẾT LIÊN QUAN
- Khi KH hỏi địa chỉ/liên hệ: dùng phần 🏪 CẤU HÌNH CỬA HÀNG`);

  return parts.join("\n");
}


