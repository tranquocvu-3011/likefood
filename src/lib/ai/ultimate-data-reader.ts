/**
 * LIKEFOOD - Ultimate AI Data Reader
 * Đọc TẤT CẢ dữ liệu từ website để AI có thể tư vấn HOÀN TOÀN
 * 
 * Bao gồm:
 * - Products (đầy đủ thông tin)
 * - Categories
 * - Brands
 * - Reviews
 * - Orders (nếu user login)
 * - Blog/Posts
 * - Coupons
 * - Flash Sales
 * - Store Info
 * - Shipping/Payment Info
 * - FAQ
 * 
 * Copyright (c) 2026 LIKEFOOD Team
 */

"use server";

import prisma from "@/lib/prisma";
import { searchKnowledge } from "@/lib/ai/knowledge-base";

// ─── TTL Cache ────────────────────────────────────────────────
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for faster updates

interface CacheEntry<T> { data: T; expiresAt: number; }
const _cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fetcher: () => Promise<T>, ttl = CACHE_TTL_MS): Promise<T> {
  const existing = _cache.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() < existing.expiresAt) return existing.data;
  
  const data = await fetcher();
  _cache.set(key, { data, expiresAt: Date.now() + ttl });
  
  if (_cache.size > 150) {
    const oldestKey = _cache.keys().next().value;
    if (oldestKey) _cache.delete(oldestKey);
  }
  return data;
}

// ─── Types ───────────────────────────────────────────────────

interface ProductInfo {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  category: string;
  brand?: { name: string } | null;
  description: string;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  inventory: number;
  isOnSale: boolean;
  weight?: string;
}

interface ReviewInfo {
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

// ─── 1. Get ALL Products with Full Details ───────────────────

async function getAllProductsDetailed(): Promise<string> {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      select: {
        id: true, name: true, slug: true, price: true, salePrice: true,
        category: true, brand: true, description: true, ratingAvg: true,
        ratingCount: true, soldCount: true, inventory: true, isOnSale: true,
        weight: true,
      },
      orderBy: [{ soldCount: "desc" }, { name: "asc" }],
      take: 200,
    });

    if (products.length === 0) return "❌ Không có sản phẩm nào";

    const lines = [`📦 TẤT CẢ SẢN PHẨM (${products.length} sản phẩm):`];
    
    // Group by category
    const byCategory: Record<string, ProductInfo[]> = {};
    for (const p of products) {
      const cat = p.category || "Khác";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p as ProductInfo);
    }

    for (const [cat, items] of Object.entries(byCategory)) {
      lines.push(`\n📂 ${cat.toUpperCase()} (${items.length} sản phẩm):`);
      
      for (const p of items.slice(0, 20)) { // Max 20 per category
        const sale = p.salePrice ? ` ⚡SALE $${p.salePrice}` : "";
        const discount = p.salePrice ? ` (-${Math.round((1 - p.salePrice / p.price) * 100)}%)` : "";
        const stock = p.inventory <= 0 ? " ❌HẾT HÀNG" : p.inventory < 10 ? ` ⚠️Còn ${p.inventory} SP` : "";
        const rating = p.ratingAvg ? ` ⭐${p.ratingAvg.toFixed(1)}` : "";
        const brand = p.brand?.name ? ` 🏭${p.brand.name}` : "";
        
        lines.push(`• ${p.name}${brand} — **$${p.price}**${discount}${sale}${stock}${rating}`);
        
        // Add description if available
        if (p.description && p.description.length > 20) {
          lines.push(`  └─ ${p.description.slice(0, 100)}...`);
        }
      }
      
      if (items.length > 20) {
        lines.push(`  └─ ...và ${items.length - 20} sản phẩm khác`);
      }
    }

    return lines.join("\n");
  } catch (error) {
    console.error("[ULTIMATE_DATA] getAllProductsDetailed error:", error);
    return "❌ Không thể tải danh sách sản phẩm";
  }
}

// ─── 2. Get Categories ───────────────────────────────────────

async function getCategoriesInfo(): Promise<string> {
  try {
    const categories = await prisma.product.groupBy({
      by: ["category"],
      where: { isDeleted: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    if (categories.length === 0) return "";

    return `\n🏷️ DANH MỤC SẢN PHẨM:\n` +
      categories.map(c => `• ${c.category}: ${c._count.id} sản phẩm`).join("\n");
  } catch {
    return "";
  }
}

// ─── 3. Get Brands ───────────────────────────────────────────

async function getBrandsInfo(): Promise<string> {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      select: { name: true, nameEn: true, slug: true },
      orderBy: { name: "asc" },
      take: 30,
    });

    if (brands.length === 0) return "";

    return `\n🏭 THƯƠNG HIỆU:\n` +
      brands.map(b => `• ${b.name}${b.nameEn ? ` (${b.nameEn})` : ""}`).join("\n");
  } catch {
    return "";
  }
}

// ─── 4. Get Reviews ───────────────────────────────────────────

async function getRecentReviews(): Promise<string> {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED" },
      include: {
        product: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (reviews.length === 0) return "";

    return `\n⭐ ĐÁNH GIÁ MỚI NHẤT:\n` +
      reviews.map(r => {
        const stars = "⭐".repeat(r.rating);
        const product = r.product?.name || "Sản phẩm";
        const author = r.user?.name || "Khách";
        const comment = r.comment ? `: "${r.comment.slice(0, 80)}"` : "";
        return `• ${stars} ${product} - ${author}${comment}`;
      }).join("\n");
  } catch {
    return "";
  }
}

// ─── 5. Get Active Coupons ───────────────────────────────────

async function getCouponsInfo(): Promise<string> {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
        startDate: { lte: new Date() },
      },
      orderBy: { discountValue: "desc" },
      take: 10,
    });

    if (coupons.length === 0) return "";

    return `\n🎟️ MÃ GIẢM GIÁ HIỆN CÓ:\n` +
      coupons.map(c => {
        const discount = c.discountType === "PERCENT" 
          ? `${c.discountValue}%` 
          : `$${c.discountValue}`;
        const minOrder = c.minOrderValue ? ` (đơn tối thiểu $${c.minOrderValue})` : "";
        const expires = c.endDate ? ` (hết hạn ${c.endDate.toLocaleDateString("vi-VN")})` : "";
        return `• **${c.code}**: Giảm ${discount}${minOrder}${expires}`;
      }).join("\n");
  } catch {
    return "";
  }
}

// ─── 6. Get Flash Sales ─────────────────────────────────────

async function getFlashSalesInfo(): Promise<string> {
  try {
    const now = new Date();
    const sales = await prisma.flashsalecampaign.findMany({
      where: { isActive: true },
      include: {
        products: {
          include: { product: true },
          take: 10,
        },
      },
      orderBy: { startAt: "desc" },
      take: 3,
    });

    if (sales.length === 0) return "";

    const lines: string[] = [];
    for (const sale of sales) {
      if (sale.startAt > now) continue; // Not started yet
      
      const isActive = sale.startAt <= now && sale.endAt >= now;
      const status = isActive ? "🔥 ĐANG DIỄN RA" : "⏰ SẮP DIỄN RA";
      
      lines.push(`\n${status}: ${sale.name}`);
      
      if (sale.products.length > 0) {
        for (const item of sale.products) {
          const p = item.product;
          const discount = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
          lines.push(`• ${p.name}: $${p.price} → $${p.salePrice} (-${discount}%)`);
        }
      }
    }

    return lines.join("\n");
  } catch {
    return "";
  }
}

// ─── 7. Get User Orders (if logged in) ─────────────────────

async function getUserOrdersInfo(userId: number): Promise<string> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: { product: true },
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

    return `\n📦 ĐƠN HÀNG CỦA BẠN:\n` +
      orders.map(o => {
        const items = o.orderItems.map(i => i.product?.name || "SP").join(", ");
        const status = statusMap[o.status] || o.status;
        const date = new Date(o.createdAt).toLocaleDateString("vi-VN");
        return `• #${o.id} (${date}): $${o.total} — ${status}\n  └─ ${items.slice(0, 80)}`;
      }).join("\n");
  } catch {
    return "";
  }
}

// ─── 8. Get Blog Posts ───────────────────────────────────────

async function getBlogPosts(): Promise<string> {
  try {
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      select: { title: true, slug: true, category: true, summary: true },
      orderBy: { publishedAt: "desc" },
      take: 10,
    });

    if (posts.length === 0) return "";

    return `\n📝 BÀI VIẾT BLOG:\n` +
      posts.map(p => `• ${p.title} [${p.category || "Bài viết"}]`).join("\n");
  } catch {
    return "";
  }
}

// ─── 9. Get Store Config ─────────────────────────────────────

async function getStoreConfigInfo(): Promise<string> {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { isPublic: true },
      take: 20,
    });

    const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]));

    return `
🏪 THÔNG TIN CỬA HÀNG:
• Địa chỉ: ${configMap.store_address || "Chưa cập nhật"}
• Hotline: ${configMap.store_phone || "402-315-8105"}
• Email: ${configMap.store_email || "tranquocvu3011@gmail.com"}
• Free ship Standard: từ $${configMap.free_shipping_threshold || 500}
• Thời gian Standard: ${configMap.shipping_standard_days || "3-5"} ngày
• Thời gian Express: ${configMap.shipping_express_days || "1-2"} ngày
• Đổi trả: ${configMap.return_policy_days || 7} ngày
• Thanh toán: Visa, Mastercard, AmEx, PayPal, Apple Pay, Google Pay, COD`;
  } catch {
    return `
🏪 THÔNG TIN CỬA HÀNG:
• Địa chỉ: Omaha, NE 68136, USA
• Hotline: 402-315-8105
• Email: tranquocvu3011@gmail.com
• Free ship: Standard từ $500
• Đổi trả: 7 ngày
• Thanh toán: Visa, Mastercard, AmEx, PayPal, Apple Pay, Google Pay, COD`;
  }
}

// ─── 10. Get Shipping Info ───────────────────────────────────

async function getShippingInfo(): Promise<string> {
  return `
🚚 CHÍNH SÁCH GIAO HÀNG:
• Store Pickup (Đến lấy tại cửa hàng): Miễn phí
• Standard (3-5 ngày): Phí $5.99, FREE từ $500
• Express (1-2 ngày): Phí $12.99
• Same Day (Giao trong ngày): Phí $24.99
• Giao hàng toàn 50 bang nước Mỹ
• Đóng gói cẩn thận giữ nguyên hương vị`;
}

// ─── 11. Get Payment Info ───────────────────────────────────

async function getPaymentInfo(): Promise<string> {
  return `
💳 PHƯƠNG THỨC THANH TOÁN:
• Visa, Mastercard, American Express
• PayPal
• Apple Pay, Google Pay
• Thanh toán khi nhận hàng (COD)
• Secure payment qua Stripe`;
}

// ─── 12. Get Return Policy ───────────────────────────────────

async function getReturnPolicy(): Promise<string> {
  return `
🔄 CHÍNH SÁCH ĐỔI TRẢ:
• Đổi trả miễn phí trong 7 ngày
• Sản phẩm lỗi được đổi mới hoàn toàn
• Hoàn tiền trong 5-7 ngày làm việc
• Liên hệ hotline để được hỗ trợ`;
}

// ─── 13. Get FAQ ───────────────────────────────────────────

async function getFAQ(): Promise<string> {
  return `
❓ CÂU HỎI THƯỜNG GẶP:

Q: Làm sao đặt hàng?
A: Chọn sản phẩm → Thêm vào giỏ → Checkout → Thanh toán

Q: Có cần đăng ký không?
A: Không cần! Có thể đặt hàng không cần tài khoản

Q: Khi nào nhận được hàng?
A: Standard 5-7 ngày, Express 2-3 ngày sau khi đặt

Q: Làm sao theo dõi đơn?
A: Đăng nhập → Tài khoản → Đơn hàng

Q: Có thể đổi trả không?
A: Có, trong vòng 7 ngày với sản phẩm lỗi`;
}

// ─── 14. Knowledge Base ─────────────────────────────────────

async function getKnowledgeBase(query: string): Promise<string> {
  try {
    const results = await searchKnowledge(query, "vi", 5);
    if (results.length === 0) return "";

    return `\n📚 KIẾN THỨC BỔ ÍCH:\n` +
      results.map(k => `❓ ${k.question}\n✅ ${k.answer}`).join("\n\n");
  } catch {
    return "";
  }
}

// ─── 15. Search Products by Query ───────────────────────────

async function searchProductsContext(query: string): Promise<string> {
  try {
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    if (keywords.length === 0) return "";

    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        OR: keywords.flatMap(term => [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { category: { contains: term, mode: "insensitive" } },
        ]),
      },
      include: {
        brand: true,
        reviews: { where: { status: "APPROVED" }, take: 3 },
      },
      orderBy: { soldCount: "desc" },
      take: 15,
    });

    if (products.length === 0) return "";

    const lines = [`\n🔍 KẾT QUẢ TÌM KIẾM CHO "${query}":`];
    
    for (const p of products) {
      const sale = p.salePrice ? ` → $${p.salePrice} (-${Math.round((1 - p.salePrice / p.price) * 100)}%)` : "";
      const stock = p.inventory <= 0 ? " ❌HẾT HÀNG" : p.inventory < 10 ? ` ⚠️Còn ${p.inventory}` : ` ✅Còn ${p.inventory}`;
      const rating = p.ratingAvg ? ` ⭐${p.ratingAvg.toFixed(1)} (${p.ratingCount} đánh giá)` : "";
      const brand = p.brand?.name ? ` 🏭${p.brand.name}` : "";
      
      lines.push(`\n📦 ${p.name}${brand}`);
      lines.push(`   💰 Giá: **$${p.price}**${sale}`);
      lines.push(`   📦 Kho: ${stock}`);
      lines.push(`   ⭐ ${rating}`);
      lines.push(`   🏷️ Danh mục: ${p.category}`);
      
      if (p.description) {
        lines.push(`   📝 ${p.description.slice(0, 100)}...`);
      }
      
      // Show reviews
      if (p.reviews.length > 0) {
        lines.push(`   💬 Đánh giá:`);
        for (const r of p.reviews.slice(0, 2)) {
          const stars = "⭐".repeat(r.rating);
          const comment = r.comment ? `: "${r.comment.slice(0, 60)}..."` : "";
          lines.push(`      - ${stars} ${comment}`);
        }
      }
    }

    return lines.join("\n");
  } catch {
    return "";
  }
}

// ─── MAIN: Build Ultimate Context ────────────────────────────

export async function buildUltimateAIContext(
  query: string,
  userId?: number
): Promise<string> {
  const parts: string[] = [];

  // 1. Store identity
  parts.push(`
🏪 LIKEFOOD - CỬA HÀNG ĐẶC SẢN VIỆT NAM TẠI MỸ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 100% hàng chính hãng nhập khẩu từ Việt Nam
✅ Kiểm tra chất lượng trước khi giao
✅ Giao hàng toàn nước Mỹ (50 bang)
✅ Đóng gói cẩn thận giữ nguyên hương vị
✅ Hỗ trợ 24/7 (Tiếng Việt & Tiếng Anh)
✅ Đổi trả miễn phí 7 ngày
✅ Tích điểm LIKEFOOD Xu
`);

  // 2. Fetch all data in parallel for speed
  const [
    products,
    categories,
    brands,
    reviews,
    coupons,
    flashSales,
    blogPosts,
    storeConfig,
    shipping,
    payment,
    returns,
    faq,
    knowledge,
    searchResults,
  ] = await Promise.all([
    // Core data (cached)
    cached("all_products", () => getAllProductsDetailed(), CACHE_TTL_MS),
    cached("categories", () => getCategoriesInfo(), CACHE_TTL_MS),
    cached("brands", () => getBrandsInfo(), CACHE_TTL_MS),
    cached("reviews", () => getRecentReviews(), CACHE_TTL_MS),
    cached("coupons", () => getCouponsInfo(), CACHE_TTL_MS),
    cached("flash_sales", () => getFlashSalesInfo(), CACHE_TTL_MS),
    // Content
    cached("blog_posts", () => getBlogPosts(), CACHE_TTL_MS),
    getStoreConfigInfo(),
    getShippingInfo(),
    getPaymentInfo(),
    getReturnPolicy(),
    getFAQ(),
    // Dynamic based on query
    getKnowledgeBase(query),
    searchProductsContext(query),
  ]);

  // 3. Add all sections
  if (products) parts.push(products);
  if (searchResults) parts.push(searchResults);
  if (categories) parts.push(categories);
  if (brands) parts.push(brands);
  if (coupons) parts.push(coupons);
  if (flashSales) parts.push(flashSales);
  if (reviews) parts.push(reviews);
  if (blogPosts) parts.push(blogPosts);
  if (knowledge) parts.push(knowledge);
  if (storeConfig) parts.push(storeConfig);
  if (shipping) parts.push(shipping);
  if (payment) parts.push(payment);
  if (returns) parts.push(returns);
  if (faq) parts.push(faq);

  // 4. Add user orders if logged in
  if (userId) {
    const userOrders = await cached(
      `user_orders_${userId}`,
      () => getUserOrdersInfo(userId),
      60000 // 1 minute cache
    );
    if (userOrders) parts.push(userOrders);
  }

  // 5. Final instructions
  parts.push(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HƯỚNG DẪN TRẢ LỜI:
• LUÔN sử dụng dữ liệu THẬT từ trên
• Khi giới thiệu sản phẩm phải có đầy đủ: tên + giá + nguồn gốc + hương vị + cách dùng + đánh giá
• Gợi ý sản phẩm bổ sung để đạt freeship
• Nhắc mã giảm giá nếu có
• Tạo urgency cho sản phẩm sắp hết hàng
• Kết thúc bằng câu hỏi mở để tiếp tục trò chuyện
• TRẢ LỜI CHI TIẾT NHẤT CÓ THỂ - không được qua loa!
`);

  return parts.join("\n");
}
