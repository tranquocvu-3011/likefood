/**
 * LIKEFOOD - Enhanced AI Data Reader
 * Đọc dữ liệu CHI TIẾT từ SQL để cung cấp context cho AI chatbot
 * Cải thiện: thêm reviews, specifications, related products, stock info
 * Copyright (c) 2026 LIKEFOOD Team
 */

"use server";

import prisma from "@/lib/prisma";
import { searchKnowledge } from "@/lib/ai/knowledge-base";

// ─── TTL Cache ────────────────────────────────────────────────
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const QUICK_CACHE_TTL_MS = 60 * 1000; // 1 minute

interface CacheEntry<T> { data: T; expiresAt: number; }
const _dataCache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fetcher: () => Promise<T>, ttl = CACHE_TTL_MS): Promise<T> {
  const existing = _dataCache.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() < existing.expiresAt) return existing.data;
  
  const data = await fetcher();
  _dataCache.set(key, { data, expiresAt: Date.now() + ttl });
  
  if (_dataCache.size > 100) {
    const oldestKey = _dataCache.keys().next().value;
    if (oldestKey) _dataCache.delete(oldestKey);
  }
  return data;
}

// ─── Types ───────────────────────────────────────────────────

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  category: string;
  brand?: string;
  description: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  inventory: number;
  isOnSale: boolean;
  origin?: string;
  weight?: string;
  specifications?: Record<string, string>;
  reviews?: ProductReview[];
  relatedProducts?: ProductDetail[];
}

export interface ProductReview {
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

export interface CategoryInfo {
  name: string;
  productCount: number;
  products: ProductDetail[];
}

// ─── Helpers ─────────────────────────────────────────────────

function mapProductDetail(p: any): ProductDetail {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug ?? String(p.id),
    price: p.price,
    salePrice: p.salePrice,
    category: p.category,
    brand: p.brand?.name ?? undefined,
    description: p.description?.slice(0, 500) ?? "",
    rating: p.ratingAvg ?? 0,
    reviewCount: p.ratingCount ?? 0,
    soldCount: p.soldCount ?? 0,
    inventory: p.inventory ?? 0,
    isOnSale: !!p.isOnSale,
    origin: p.origin ?? undefined,
    weight: p.weight ?? undefined,
  };
}

// ─── 1. Get Product by Name (với reviews & related) ─────────

export async function getProductDetailsByName(productName: string): Promise<ProductDetail | null> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { name: { contains: productName } },
          { slug: { contains: productName.toLowerCase().replace(/ /g, "-") } },
        ],
      },
      include: {
        brand: { select: { name: true } },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { user: { select: { name: true } } },
        },
        specifications: true,
      },
    });

    if (!product) return null;

    // Get related products (same category)
    const related = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id },
        isDeleted: false,
        inventory: { gt: 0 },
      },
      include: { brand: { select: { name: true } } },
      orderBy: { soldCount: "desc" },
      take: 4,
    });

    const detail = mapProductDetail(product);
    const productWithRelations = product as any;
    detail.reviews = (productWithRelations.reviews ?? []).map((r: any) => ({
      rating: r.rating,
      comment: r.comment?.slice(0, 200) ?? "",
      author: r.user?.name ?? "Khách hàng",
      createdAt: r.createdAt.toISOString(),
    }));
    detail.relatedProducts = related.map(mapProductDetail);
    detail.specifications = (productWithRelations.specifications as Record<string, string> | null) ?? {};

    return detail;
  } catch (error) {
    console.error("[AI_DATA_ENHANCED] getProductDetailsByName error:", error);
    return null;
  }
}

// ─── 2. Get Products by Category ─────────────────────────────

export async function getProductsByCategory(categoryName: string, limit = 10): Promise<ProductDetail[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: { contains: categoryName },
        isDeleted: false,
        inventory: { gt: 0 },
      },
      include: { brand: { select: { name: true } } },
      orderBy: { soldCount: "desc" },
      take: limit,
    });

    return products.map(mapProductDetail);
  } catch (error) {
    console.error("[AI_DATA_ENHANCED] getProductsByCategory error:", error);
    return [];
  }
}

// ─── 3. Search Products ─────────────────────────────────────

export async function searchProductsDetailed(query: string, limit = 8): Promise<ProductDetail[]> {
  try {
    const keywords = query
      .toLowerCase()
      .replace(/[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 1);

    if (keywords.length === 0) return [];

    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        inventory: { gt: 0 },
        OR: keywords.flatMap(term => [
          { name: { contains: term } },
          { description: { contains: term } },
          { category: { contains: term } },
        ]),
      },
      include: { brand: { select: { name: true } } },
      orderBy: { soldCount: "desc" },
      take: limit,
    });

    return products.map(mapProductDetail);
  } catch (error) {
    console.error("[AI_DATA_ENHANCED] searchProductsDetailed error:", error);
    return [];
  }
}

// ─── 4. Get All Categories with Products ─────────────────────

export async function getCategoriesWithProducts(): Promise<CategoryInfo[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false, inventory: { gt: 0 } },
      select: { 
        id: true, name: true, category: true, price: true, salePrice: true,
        ratingAvg: true, soldCount: true, inventory: true, isOnSale: true,
        slug: true, brand: { select: { name: true } },
      },
      orderBy: [{ category: "asc" }, { soldCount: "desc" }],
    });

    const categoryMap = new Map<string, ProductDetail[]>();
    for (const p of products) {
      const cat = p.category || "Khác";
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(mapProductDetail(p));
    }

    return Array.from(categoryMap.entries()).map(([name, products]) => ({
      name,
      productCount: products.length,
      products: products.slice(0, 15), // Limit to 15 per category
    }));
  } catch (error) {
    console.error("[AI_DATA_ENHANCED] getCategoriesWithProducts error:", error);
    return [];
  }
}

// ─── 5. Get Active Coupons ───────────────────────────────────

export async function getActiveCoupons(): Promise<string> {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
        startDate: { lte: new Date() },
      },
      orderBy: { discountValue: "desc" },
      take: 5,
    });

    if (coupons.length === 0) return "";

    return `\n🎟 MÃ GIẢM GIÁ HIỆN CÓ:\n` +
      coupons.map(c => {
        const discount = c.discountType === "PERCENT" 
          ? `${c.discountValue}%` 
          : `$${c.discountValue}`;
        const minOrder = c.minOrderValue ? ` (đơn tối thiểu $${c.minOrderValue})` : "";
        return `- **${c.code}**: Giảm ${discount}${minOrder}`;
      }).join("\n");
  } catch {
    return "";
  }
}

// ─── 6. Get Flash Sale ─────────────────────────────────────

export async function getFlashSaleInfo(): Promise<string> {
  try {
    const now = new Date();
    const sale = await prisma.flashsalecampaign.findFirst({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                name: true, price: true, salePrice: true, slug: true,
              },
            },
          },
          take: 6,
        },
      },
    });

    if (!sale) return "";

    const products = sale.products.map(item => {
      const p = item.product;
      const discount = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
      return `- **${p.name}**: $${p.price} → $${p.salePrice} (-${discount}%)`;
    }).join("\n");

    return `\n🔥 FLASH SALE ĐANG DIỄN RA: "${sale.name}"\n${products}`;
  } catch {
    return "";
  }
}

// ─── 7. Get User Profile (if logged in) ─────────────────────

export async function getUserProfileContext(userId: number): Promise<string> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId, status: { in: ["DELIVERED", "COMPLETED", "SHIPPED", "CONFIRMED"] } },
      include: {
        orderItems: {
          include: { product: { select: { name: true, category: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (orders.length === 0) return "";

    const categoryCounts: Record<string, number> = {};
    const recentProducts: string[] = [];

    for (const order of orders.slice(0, 3)) {
      for (const item of order.orderItems) {
        const cat = item.product?.category ?? "unknown";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
        if (recentProducts.length < 5 && item.product?.name) {
          recentProducts.push(item.product.name);
        }
      }
    }

    const favoriteCats = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const totalSpent = orders.reduce((s, o) => s + (o.total ?? 0), 0);

    return `\n👤 THÔNG TIN KHÁCH HÀNG:\n` +
      `- Đã mua: ${orders.length} đơn hàng\n` +
      `- Tổng chi: $${totalSpent.toFixed(2)}\n` +
      `- Danh mục yêu thích: ${favoriteCats.join(", ")}\n` +
      `- Sản phẩm gần mua: ${recentProducts.join(", ")}`;
  } catch {
    return "";
  }
}

// ─── 8. Get Trending Products ─────────────────────────────────

export async function getTrendingProducts(limit = 6): Promise<string> {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false, inventory: { gt: 0 } },
      include: { brand: { select: { name: true } } },
      orderBy: { soldCount: "desc" },
      take: limit,
    });

    if (products.length === 0) return "";

    return `\n🔥 SẢN PHẨM BÁN CHẠY NHẤT:\n` +
      products.map(p => {
        const sale = p.salePrice ? ` → $${p.salePrice}` : "";
        return `- **${p.name}** (${p.brand?.name ?? "LIKEFOOD"}) — $${p.price}${sale} | ⭐${(p.ratingAvg ?? 0).toFixed(1)} (${p.soldCount} đã bán)`;
      }).join("\n");
  } catch {
    return "";
  }
}

// ─── 9. Get Store Info ───────────────────────────────────────

export async function getStoreInfoContext(): Promise<string> {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        isPublic: true,
        key: { in: ["store_address", "store_phone", "free_shipping_threshold"] },
      },
    });

    const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]));

    return `
🏪 THÔNG TIN CỬA HÀNG LIKEFOOD:
- 📍 Địa chỉ: ${configMap.store_address ?? "Omaha, NE 68136, USA"}
- ☎️ Hotline: ${configMap.store_phone ?? "402-315-8105"}
- 🚚 Giao hàng: Toàn nước Mỹ
- 🆓 Miễn phí ship: Standard từ $${configMap.free_shipping_threshold ?? "99"}
- 💳 Thanh toán: Visa, Mastercard, AmEx, PayPal, Apple Pay, Google Pay, COD
- 🔄 Đổi trả: 7 ngày nếu sản phẩm lỗi
- ⭐ 100% hàng chính hãng nhập khẩu từ Việt Nam`;
  } catch {
    return `
🏪 THÔNG TIN CỬA HÀNG LIKEFOOD:
- 📍 Địa chỉ: Omaha, NE 68136, USA
- ☎️ Hotline: 402-315-8105
- 🚚 Giao hàng: Toàn nước Mỹ
- 🆓 Miễn phí ship: Standard từ $99
- 💳 Thanh toán: Visa, Mastercard, AmEx, PayPal, Apple Pay, Google Pay, COD
- 🔄 Đổi trả: 7 ngày nếu sản phẩm lỗi
- ⭐ 100% hàng chính hãng nhập khẩu từ Việt Nam`;
  }
}

// ─── MAIN: Build Enhanced Context ────────────────────────────

export async function buildAIContextEnhanced(
  query: string,
  userId?: number
): Promise<string> {
  const parts: string[] = [];

  // 1. Store info (always included)
  parts.push(await getStoreInfoContext());

  // 2. Quick caches
  const [
    categoriesWithProducts,
    coupons,
    flashSale,
    trending,
    knowledge,
  ] = await Promise.all([
    cached("categories_products", () => getCategoriesWithProducts(), QUICK_CACHE_TTL_MS),
    cached("coupons", () => getActiveCoupons(), QUICK_CACHE_TTL_MS),
    cached("flash_sale", () => getFlashSaleInfo(), QUICK_CACHE_TTL_MS),
    cached("trending", () => getTrendingProducts(6), QUICK_CACHE_TTL_MS),
    searchKnowledge(query, "vi", 3).catch(() => []),
  ]);

  // Add trending
  if (trending) parts.push(trending);

  // Add flash sale
  if (flashSale) parts.push(flashSale);

  // Add coupons
  if (coupons) parts.push(coupons);

  // Add knowledge base matches
  if (knowledge.length > 0) {
    const knowledgeSection = `\n📚 KIẾN THỨC & CÂU HỎI THƯỜNG GẶP:\n` +
      knowledge.map(k => `❓ **${k.question}**\n✅ ${k.answer}`).join("\n\n");
    parts.push(knowledgeSection);
  }

  // 3. Category-based context
  if (categoriesWithProducts.length > 0) {
    const categorySection = `\n📦 DANH MỤC SẢN PHẨM (${categoriesWithProducts.length} danh mục):\n` +
      categoriesWithProducts.map(cat => 
        `📂 **${cat.name}** (${cat.productCount} sản phẩm):\n` +
        cat.products.slice(0, 8).map(p => {
          const sale = p.salePrice ? ` ⚡$→$${p.salePrice}` : "";
          const stock = p.inventory < 10 ? " ⚠️Sắp hết" : "";
          return `- ${p.name} — $${p.price}${sale}${stock}`;
        }).join("\n")
      ).join("\n\n");
    parts.push(categorySection);
  }

  // 4. Product-specific context (if query mentions specific products)
  const queryLower = query.toLowerCase();
  const productKeywords = [
    "cá khô", "tôm khô", "mực khô", "trà", "cà phê", "gia vị", 
    "bánh", "kẹo", "mứt", "nước mắm", "tiêu", "ớt",
    "dried", "fish", "shrimp", "squid", "tea", "coffee", "spice"
  ];
  
  const shouldSearchProducts = productKeywords.some(kw => queryLower.includes(kw));
  
  if (shouldSearchProducts) {
    const searchResults = await cached(
      `search:${query.slice(0, 30)}`,
      () => searchProductsDetailed(query, 8),
      QUICK_CACHE_TTL_MS
    );

    if (searchResults.length > 0) {
      const searchSection = `\n🔍 KẾT QUẢ TÌM KIẾM CHO "${query}":\n` +
        searchResults.map(p => {
          const sale = p.salePrice ? ` → $${p.salePrice} (giảm ${Math.round((1 - p.salePrice / p.price) * 100)}%)` : "";
          const stock = p.inventory < 10 ? " ⚠️Sắp hết hàng!" : "";
          const reviews = p.reviewCount > 0 ? ` ⭐${p.rating.toFixed(1)} (${p.reviewCount} đánh giá)` : "";
          return `**${p.name}**\n` +
            `   💰 Giá: $${p.price}${sale}${stock}\n` +
            `   📦 Kho: ${p.inventory}${reviews}\n` +
            `   🏷️ Danh mục: ${p.category}\n` +
            `   ${p.brand ? `🏭 Thương hiệu: ${p.brand}\n` : ""}`;
        }).join("\n\n");
      parts.push(searchSection);
    }
  }

  // 5. User context (if logged in)
  if (userId) {
    const userContext = await cached(
      `user:${userId}`,
      () => getUserProfileContext(userId),
      QUICK_CACHE_TTL_MS
    );
    if (userContext) parts.push(userContext);
  }

  // 6. Final instructions
  parts.push(`
📋 HƯỚNG DẪN TRẢ LỜI:
- LUÔN sử dụng dữ liệu THẬT từ trên
- Khi giới thiệu sản phẩm: tên + giá + nguồn gốc + hương vị + cách dùng + đánh giá
- Gợi ý sản phẩm bổ sung để đạt freeship
- Nhắc mã giảm giá nếu có
- Tạo urgency cho sản phẩm sắp hết hàng
- Kết thúc bằng câu hỏi mở`);

  return parts.join("\n");
}
