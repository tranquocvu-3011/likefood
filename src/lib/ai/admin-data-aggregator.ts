"use server";

/**
 * LIKEFOOD - Admin Data Aggregator
 * ─────────────────────────────────────────────────────────────
 * Tổng hợp DỮ LIỆU THẬT từ database cho Admin AI Chat.
 * Thay thế 4 context fields đơn giản cũ bằng full intelligence context.
 *
 * Domains covered:
 *  1. Business Intelligence    (revenue, orders, AOV, growth)
 *  2. Product Intelligence     (bestsellers, slow movers, inventory alerts)
 *  3. Customer Intelligence    (segments, churn risk, prospects)
 *  4. Behavior Intelligence    (funnel, search intents, abandoned sessions)
 *  5. SEO Intelligence         (page scores, metadata quality, keyword analysis)
 *  6. Website Health           (content, routes, structured data)
 *
 * Copyright (c) 2026 LIKEFOOD Team
 */

import prisma from "@/lib/prisma";

// ─── TTL Cache ────────────────────────────────────────────────
const CACHE_TTL = 3 * 60 * 1000; // 3 min
interface CacheEntry<T> { data: T; exp: number; }
const _cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fn: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
  const c = _cache.get(key) as CacheEntry<T> | undefined;
  if (c && Date.now() < c.exp) return c.data;
  const data = await fn();
  _cache.set(key, { data, exp: Date.now() + ttl });
  if (_cache.size > 50) _cache.delete(_cache.keys().next().value!);
  return data;
}

function fmt(n: number): string { return `$${n.toFixed(2)}`; }

// ─── 1. BUSINESS INTELLIGENCE ─────────────────────────────────

async function getBusinessIntelligence(): Promise<string> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);

  const [
    todayOrders, weekOrders, monthOrders,
    prevMonthOrders, totalOrders, totalCustomers,
    newCustomers7d, pendingOrders, cancelledOrders,
  ] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: todayStart }, status: { in: ["COMPLETED","DELIVERED","CONFIRMED","PENDING","SHIPPED"] } }, select: { total: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: sevenDaysAgo }, status: { in: ["COMPLETED","DELIVERED"] } }, select: { total: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: thirtyDaysAgo }, status: { in: ["COMPLETED","DELIVERED"] } }, select: { total: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, status: { in: ["COMPLETED","DELIVERED"] } }, select: { total: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", createdAt: { gte: sevenDaysAgo } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CANCELLED", createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  const todayRev = todayOrders.reduce((s, o) => s + o.total, 0);
  const weekRev = weekOrders.reduce((s, o) => s + o.total, 0);
  const monthRev = monthOrders.reduce((s, o) => s + o.total, 0);
  const prevMonthRev = prevMonthOrders.reduce((s, o) => s + o.total, 0);
  const monthGrowth = prevMonthRev > 0 ? ((monthRev - prevMonthRev) / prevMonthRev * 100).toFixed(1) : "N/A";
  const weekAOV = weekOrders.length > 0 ? weekRev / weekOrders.length : 0;
  const monthAOV = monthOrders.length > 0 ? monthRev / monthOrders.length : 0;

  return `
📊 DOANH THU & KINH DOANH (DỮ LIỆU THẬT TỪ DATABASE):
• Hôm nay: ${fmt(todayRev)} (${todayOrders.length} đơn)
• 7 ngày: ${fmt(weekRev)} (${weekOrders.length} đơn) — AOV: ${fmt(weekAOV)}
• 30 ngày: ${fmt(monthRev)} (${monthOrders.length} đơn) — AOV: ${fmt(monthAOV)}
• 30 ngày trước đó: ${fmt(prevMonthRev)} (${prevMonthOrders.length} đơn)
• Tăng trưởng MoM: ${monthGrowth}%
• Tổng đơn all-time: ${totalOrders}
• Tổng khách hàng: ${totalCustomers} (mới 7d: ${newCustomers7d})
• Đơn chờ xử lý: ${pendingOrders}
• Đơn hủy 30d: ${cancelledOrders}
`.trim();
}

// ─── 2. PRODUCT INTELLIGENCE ──────────────────────────────────

async function getProductIntelligence(): Promise<string> {
  const [products, lowStockProducts, outOfStockProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, category: true, price: true, salePrice: true, inventory: true, soldCount: true, ratingAvg: true, ratingCount: true, isOnSale: true, isVisible: true },
      orderBy: { soldCount: "desc" },
      take: 100,
    }),
    prisma.product.count({ where: { isDeleted: false, inventory: { gt: 0, lte: 10 } } }),
    prisma.product.count({ where: { isDeleted: false, inventory: { lte: 0 } } }),
  ]);

  const totalProducts = products.length;
  const top5 = products.slice(0, 5);
  const bottom5 = products.filter(p => p.soldCount === 0 || p.inventory <= 0).slice(0, 5);
  const onSale = products.filter(p => p.isOnSale).length;
  const avgRating = products.filter(p => p.ratingAvg > 0).reduce((s, p) => s + p.ratingAvg, 0) / Math.max(products.filter(p => p.ratingAvg > 0).length, 1);

  // Category breakdown
  const catMap = new Map<string, { count: number; totalSold: number; totalRev: number }>();
  for (const p of products) {
    const cat = p.category || "Khác";
    const e = catMap.get(cat) ?? { count: 0, totalSold: 0, totalRev: 0 };
    e.count++;
    e.totalSold += p.soldCount;
    e.totalRev += p.price * p.soldCount;
    catMap.set(cat, e);
  }

  const lines = [
    `\n📦 SẢN PHẨM (DỮ LIỆU THẬT):`,
    `• Tổng: ${totalProducts} SP | Đang sale: ${onSale} | Hết hàng: ${outOfStockProducts} | Sắp hết (<10): ${lowStockProducts}`,
    `• Đánh giá TB: ⭐${avgRating.toFixed(1)}`,
    `\n🏆 TOP 5 BÁN CHẠY:`,
    ...top5.map((p, i) => `  ${i+1}. ${p.name} — đã bán ${p.soldCount}, tồn ${p.inventory}, ${fmt(p.price)}${p.salePrice ? ` (sale ${fmt(p.salePrice)})` : ''}`),
  ];

  if (bottom5.length > 0) {
    lines.push(`\n⚠️ SẢN PHẨM CẦN CHÚ Ý:`);
    for (const p of bottom5) {
      const issue = p.inventory <= 0 ? "HẾT HÀNG" : `bán ${p.soldCount}`;
      lines.push(`  • ${p.name} — ${issue}, tồn ${p.inventory}`);
    }
  }

  lines.push(`\n📂 DOANH THU THEO DANH MỤC:`);
  for (const [cat, data] of [...catMap.entries()].sort((a, b) => b[1].totalRev - a[1].totalRev)) {
    lines.push(`  • ${cat}: ${data.count} SP, ${data.totalSold} đã bán, ~${fmt(data.totalRev)} doanh thu`);
  }

  return lines.join("\n");
}

// ─── 3. CUSTOMER INTELLIGENCE ─────────────────────────────────

async function getCustomerIntelligence(): Promise<string> {
  const [users, recentBehavior] = await Promise.all([
    prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true, name: true, email: true, phone: true, points: true, createdAt: true,
        orders: {
          where: { status: { in: ["COMPLETED", "DELIVERED"] } },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.behaviorEvent.groupBy({
      by: ["userId"],
      where: { userId: { not: null }, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      _count: { id: true },
    }),
  ]);

  const behaviorMap = new Map(recentBehavior.map(e => [e.userId!, e._count.id]));
  
  // Segments
  const segments = { VIP: 0, Premium: 0, Regular: 0, New: 0, Inactive: 0 };
  const vipList: string[] = [];
  const churnRisk: string[] = [];

  for (const u of users) {
    const totalSpent = u.orders.reduce((s, o) => s + o.total, 0);
    const lastOrderDaysAgo = u.orders.length > 0 ? Math.floor((Date.now() - u.orders[0].createdAt.getTime()) / 86400000) : 999;
    const activity7d = behaviorMap.get(u.id) ?? 0;

    if (totalSpent >= 500) { segments.VIP++; vipList.push(`${u.name || u.email}: ${fmt(totalSpent)}, ${u._count.orders} đơn`); }
    else if (totalSpent >= 200) segments.Premium++;
    else if (totalSpent >= 50) segments.Regular++;
    else segments.New++;

    if (lastOrderDaysAgo > 45 && totalSpent >= 100) {
      segments.Inactive++;
      churnRisk.push(`${u.name || u.email}: ${lastOrderDaysAgo} ngày, ${fmt(totalSpent)} tổng chi`);
    }

    // Active but not buying
    if (activity7d >= 10 && u._count.orders === 0) {
      // Prospect — mentioned in signals
    }
  }

  const lines = [
    `\n👥 KHÁCH HÀNG (DỮ LIỆU THẬT):`,
    `• VIP (>$500): ${segments.VIP} | Premium (>$200): ${segments.Premium} | Regular: ${segments.Regular} | Mới: ${segments.New}`,
    `• Nguy cơ rời bỏ: ${churnRisk.length}`,
  ];

  if (vipList.length > 0) {
    lines.push(`\n💎 KHÁCH VIP:`);
    vipList.slice(0, 5).forEach(v => lines.push(`  • ${v}`));
  }

  if (churnRisk.length > 0) {
    lines.push(`\n🚨 NGUY CƠ CHURN (>45 ngày không mua):`);
    churnRisk.slice(0, 5).forEach(c => lines.push(`  • ${c}`));
  }

  return lines.join("\n");
}

// ─── 4. BEHAVIOR INTELLIGENCE (summary) ──────────────────────

async function getBehaviorSummary(): Promise<string> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [eventCounts, searchEvents, recentEvents] = await Promise.all([
    prisma.behaviorEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
    }),
    prisma.behaviorEvent.findMany({
      where: { eventType: "search_query", createdAt: { gte: sevenDaysAgo } },
      select: { eventData: true },
      take: 500,
    }),
    prisma.behaviorEvent.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { eventType: true, url: true },
      take: 3000,
    }),
  ]);

  const evMap: Record<string, number> = {};
  for (const e of eventCounts) evMap[e.eventType] = e._count.id;

  // Top search queries
  const queryCount = new Map<string, number>();
  for (const e of searchEvents) {
    try {
      const data = typeof e.eventData === "string" ? JSON.parse(e.eventData) : e.eventData;
      const q = (data?.query as string)?.toLowerCase()?.trim();
      if (q) queryCount.set(q, (queryCount.get(q) ?? 0) + 1);
    } catch { /* skip */ }
  }
  const topSearches = [...queryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Top pages
  const pageCount = new Map<string, number>();
  for (const e of recentEvents) {
    if (e.url) pageCount.set(e.url, (pageCount.get(e.url) ?? 0) + 1);
  }
  const topPages = [...pageCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Funnel calculation
  const pageViews = evMap["page_view"] ?? 0;
  const productViews = evMap["product_view"] ?? 0;
  const addToCart = evMap["add_to_cart"] ?? 0;
  const checkout = evMap["begin_checkout"] ?? 0;
  const purchase = evMap["purchase"] ?? 0;
  const convRate = pageViews > 0 ? ((purchase / pageViews) * 100).toFixed(2) : "0";

  const lines = [
    `\n📈 HÀNH VI NGƯỜI DÙNG (7 NGÀY GẦN NHẤT):`,
    `• Xem trang: ${pageViews} | Xem SP: ${productViews} | Thêm giỏ: ${addToCart} | Checkout: ${checkout} | Mua: ${purchase}`,
    `• Tỷ lệ chuyển đổi tổng: ${convRate}%`,
    `• Drop-off lớn nhất: ${productViews > 0 && addToCart > 0 ? `SP→Giỏ hàng (mất ${Math.round((1 - addToCart/productViews)*100)}%)` : "Chưa đủ dữ liệu"}`,
  ];

  if (topSearches.length > 0) {
    lines.push(`\n🔍 TÌM KIẾM NHIỀU NHẤT (7d):`);
    topSearches.forEach(([q, c]) => lines.push(`  • "${q}" — ${c} lần`));
  }

  if (topPages.length > 0) {
    lines.push(`\n📄 TRANG ĐƯỢC XEM NHIỀU NHẤT (7d):`);
    topPages.forEach(([p, c]) => lines.push(`  • ${p} — ${c} lượt`));
  }

  return lines.join("\n");
}

// ─── 5. SEO INTELLIGENCE ──────────────────────────────────────

async function getSEOIntelligence(): Promise<string> {
  const [products, posts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isDeleted: false, isVisible: true },
      select: { name: true, slug: true, description: true, category: true, searchKeywords: true },
      take: 100,
    }),
    prisma.post.findMany({
      where: { isPublished: true },
      select: { title: true, slug: true, summary: true, content: true, category: true },
      take: 50,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { name: true, slug: true, description: true },
    }),
  ]);

  // Analyze product SEO
  let productsWithMeta = 0;
  let productsNoDesc = 0;
  let productsShortDesc = 0;
  const slugIssues: string[] = [];

  for (const p of products) {
    if (p.searchKeywords) productsWithMeta++;
    if (!p.description || p.description.length < 20) productsNoDesc++;
    else if (p.description.length < 100) productsShortDesc++;
    if (p.slug && (p.slug.includes(" ") || /[A-Z]/.test(p.slug))) {
      slugIssues.push(p.name);
    }
  }

  // Analyze blog SEO
  let postsNoSummary = 0;
  let postsThinContent = 0;
  for (const p of posts) {
    if (!p.summary || p.summary.length < 20) postsNoSummary++;
    if (!p.content || p.content.length < 300) postsThinContent++;
  }

  // Keyword analysis from product names and categories
  const keywordMap = new Map<string, number>();
  for (const p of products) {
    const words = `${p.name} ${p.category} ${p.description || ""}`.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 3) keywordMap.set(w, (keywordMap.get(w) ?? 0) + 1);
    }
  }
  const topKeywords = [...keywordMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

  const lines = [
    `\n🔎 SEO INTELLIGENCE (PHÂN TÍCH TỪ CODE + DATABASE):`,
    `\n📊 Tổng quan:`,
    `• ${products.length} trang sản phẩm | ${posts.length} bài viết | ${categories.length} danh mục`,
    `• Sản phẩm có meta title/desc: ${productsWithMeta}/${products.length}`,
    `• Sản phẩm thiếu mô tả: ${productsNoDesc} | Mô tả mỏng (<100 ký tự): ${productsShortDesc}`,
    `• Bài viết thiếu summary: ${postsNoSummary} | Nội dung mỏng: ${postsThinContent}`,
    `• Slug có vấn đề: ${slugIssues.length > 0 ? slugIssues.slice(0,3).join(", ") : "Không" }`,
    ``,
    `✅ SEO ĐÃ CÓ (từ code):`,
    `• JSON-LD: Organization + WebSite + SearchAction + BreadcrumbList + WebPage + FAQPage`,
    `• AggregateRating 4.9★ (156 ratings)`,
    `• Dynamic sitemap.xml (products, posts, categories, CMS pages)`,
    `• robots.txt: cho phép crawl, block /api/ /admin/`,
    `• Open Graph + Twitter Card trên mọi trang`,
    `• Canonical URLs + hreflang vi/en/x-default`,
    `• H1 hidden SEO tag trên homepage`,
    `• Internal links component ở footer`,
    `• Trang /likefood-la-gi (landing page SEO)`,
    ``,
    `⚠️ CẦN CẢI THIỆN:`,
  ];

  if (productsNoDesc > 0) lines.push(`  • ${productsNoDesc} sản phẩm thiếu mô tả → Google không index tốt`);
  if (productsShortDesc > 0) lines.push(`  • ${productsShortDesc} sản phẩm mô tả quá ngắn → thin content risk`);
  if (postsNoSummary > 0) lines.push(`  • ${postsNoSummary} bài viết thiếu summary → meta description trống`);
  if (postsThinContent > 0) lines.push(`  • ${postsThinContent} bài viết nội dung mỏng (<300 ký tự)`);
  if (products.length - productsWithMeta > 0) lines.push(`  • ${products.length - productsWithMeta} sản phẩm chưa có custom meta → dùng auto-generated`);

  lines.push(`\n🔑 TOP KEYWORDS (từ tên SP + danh mục):`);
  topKeywords.forEach(([k, c]) => lines.push(`  • "${k}" — xuất hiện ${c} lần`));

  lines.push(`\n📝 LƯU Ý QUAN TRỌNG:`);
  lines.push(`  ⚠️ Không có dữ liệu Google Search Console → không biết ranking thực tế`);
  lines.push(`  ⚠️ Phân tích trên dựa vào CẤU TRÚC CODE + DATABASE, KHÔNG phải ranking thực`);
  lines.push(`  ⚠️ Cần GSC data để biết: impressions, clicks, CTR, average position`);

  return lines.join("\n");
}

// ─── 6. RECENT ORDERS DETAIL ─────────────────────────────────

async function getRecentOrdersDetail(): Promise<string> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true, total: true, status: true, createdAt: true, paymentMethod: true,
      user: { select: { name: true, email: true } },
      orderItems: { select: { quantity: true, product: { select: { name: true } } }, take: 3 },
    },
  });

  if (orders.length === 0) return "\n📋 ĐƠN HÀNG: Chưa có đơn hàng nào.";

  const statusVi: Record<string, string> = {
    PENDING: "⏳Chờ", CONFIRMED: "✅Xác nhận", SHIPPED: "🚚Giao", DELIVERED: "📦Đã giao", COMPLETED: "✔️Xong", CANCELLED: "❌Hủy",
  };

  const lines = [`\n📋 10 ĐƠN HÀNG GẦN NHẤT:`];
  for (const o of orders) {
    const items = o.orderItems.map(i => `${i.product?.name || "SP"} x${i.quantity}`).join(", ");
    const date = o.createdAt.toLocaleDateString("vi-VN");
    lines.push(`  • #${o.id} | ${date} | ${statusVi[o.status] || o.status} | ${fmt(o.total)} | ${o.user?.name || o.user?.email || "Khách"} | ${items.slice(0, 60)}`);
  }

  return lines.join("\n");
}

// ─── 7. MARKETING INTELLIGENCE ───────────────────────────────

async function getMarketingIntelligence(): Promise<string> {
  const now = new Date();
  const [
    activeCoupons, totalCoupons,
    activeFlashSales, newsletters,
    activeBanners, emailCampaigns,
  ] = await Promise.all([
    prisma.coupon.count({ where: { isActive: true, endDate: { gte: now } } }),
    prisma.coupon.count(),
    prisma.flashsalecampaign.findMany({
      where: { isActive: true, endAt: { gte: now } },
      select: { name: true, startAt: true, endAt: true, _count: { select: { products: true } } },
      take: 5,
    }),
    prisma.newslettersubscriber.count(),
    prisma.banner.count({ where: { isActive: true } }),
    prisma.emailcampaign.findMany({
      select: { name: true, isActive: true, sentCount: true, openCount: true, clickCount: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const lines = [
    `\n📣 MARKETING (DỮ LIỆU THẬT):`,
    `• Coupon: ${activeCoupons} đang hoạt động / ${totalCoupons} tổng`,
    `• Newsletter subscribers: ${newsletters}`,
    `• Banner đang hiển thị: ${activeBanners}`,
  ];

  if (activeFlashSales.length > 0) {
    lines.push(`\n⚡ FLASH SALE ĐANG CHẠY:`);
    for (const fs of activeFlashSales) {
      const end = fs.endAt.toLocaleDateString("vi-VN");
      lines.push(`  • ${fs.name} — ${fs._count.products} SP, kết thúc ${end}`);
    }
  } else {
    lines.push(`• Flash Sale: Không có chiến dịch đang chạy`);
  }

  if (emailCampaigns.length > 0) {
    lines.push(`\n📧 EMAIL CAMPAIGNS GẦN NHẤT:`);
    for (const ec of emailCampaigns) {
      const openRate = ec.sentCount > 0 ? ((ec.openCount / ec.sentCount) * 100).toFixed(1) : "0";
      const clickRate = ec.sentCount > 0 ? ((ec.clickCount / ec.sentCount) * 100).toFixed(1) : "0";
      lines.push(`  • ${ec.name} | ${ec.isActive ? "Đang chạy" : "Tạm dừng"} | Gửi: ${ec.sentCount} | Open: ${openRate}% | Click: ${clickRate}%`);
    }
  }

  return lines.join("\n");
}

// ─── 8. ENGAGEMENT INTELLIGENCE ──────────────────────────────

async function getEngagementIntelligence(): Promise<string> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [
    totalReviews, recentReviews, avgRating,
    totalWishlist, recentWishlist,
    contactMessages, unreadContacts,
    liveChats, unreadChats,
    unreadNotifications,
  ] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.wishlist.count(),
    prisma.wishlist.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.contactmessage.count(),
    prisma.contactmessage.count({ where: { status: "PENDING" } }),
    prisma.livechat.count(),
    prisma.livechat.count({ where: { status: "open" } }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  // Recent reviews detail
  const latestReviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      rating: true, comment: true, createdAt: true,
      user: { select: { name: true } },
      product: { select: { name: true } },
    },
  });

  const lines = [
    `\n💬 TƯƠNG TÁC & ENGAGEMENT (DỮ LIỆU THẬT):`,
    `• Reviews: ${totalReviews} tổng (7d: +${recentReviews}) — Đánh giá TB: ⭐${(avgRating._avg.rating ?? 0).toFixed(1)}`,
    `• Wishlist: ${totalWishlist} tổng (7d: +${recentWishlist})`,
    `• Liên hệ: ${contactMessages} tổng | Chưa đọc: ${unreadContacts}`,
    `• Live Chat: ${liveChats} cuộc | Đang mở: ${unreadChats}`,
    `• Thông báo chưa đọc: ${unreadNotifications}`,
  ];

  if (latestReviews.length > 0) {
    lines.push(`\n⭐ REVIEWS GẦN NHẤT:`);
    for (const r of latestReviews) {
      lines.push(`  • ${"⭐".repeat(r.rating)} ${r.user?.name || "Ẩn danh"} → ${r.product?.name || "SP"}: "${(r.comment || "").slice(0, 50)}"`);
    }
  }

  return lines.join("\n");
}

// ─── 9. WEBSITE CONTENT INTELLIGENCE ─────────────────────────

async function getWebsiteContentIntelligence(): Promise<string> {
  const [
    dynamicPages, brands, homeSections,
    aiKnowledgeCount,
    totalProductImages, totalProductMedia,
    totalQAs,
  ] = await Promise.all([
    prisma.dynamicPage.findMany({
      where: { isPublished: true },
      select: { title: true, slug: true, updatedAt: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { name: true, _count: { select: { products: true } } },
    }),
    prisma.homepageSection.findMany({
      where: { isActive: true },
      select: { title: true, type: true, position: true },
      orderBy: { position: "asc" },
    }),
    prisma.aiKnowledge.count(),
    prisma.productimage.count(),
    prisma.productmedia.count(),
    prisma.productqa.count(),
  ]);

  const lines = [
    `\n🌐 WEBSITE CONTENT (DỮ LIỆU THẬT):`,
    `• Trang CMS động: ${dynamicPages.length}`,
    `• Thương hiệu: ${brands.length}`,
    `• Homepage sections: ${homeSections.length}`,
    `• AI Knowledge base: ${aiKnowledgeCount} entries`,
    `• Ảnh sản phẩm: ${totalProductImages} | Media: ${totalProductMedia}`,
    `• Q&A sản phẩm: ${totalQAs}`,
  ];

  if (dynamicPages.length > 0) {
    lines.push(`\n📄 TRANG CMS:`);
    for (const p of dynamicPages) {
      lines.push(`  • /${p.slug} — "${p.title}" (cập nhật: ${p.updatedAt.toLocaleDateString("vi-VN")})`);
    }
  }

  if (brands.length > 0) {
    lines.push(`\n🏷️ THƯƠNG HIỆU:`);
    for (const b of brands) {
      lines.push(`  • ${b.name} — ${b._count.products} sản phẩm`);
    }
  }

  if (homeSections.length > 0) {
    lines.push(`\n🏠 HOMEPAGE SECTIONS:`);
    for (const s of homeSections) {
      lines.push(`  • #${s.position}: ${s.title} (${s.type})`);
    }
  }

  return lines.join("\n");
}

// ─── MAIN: Build Admin AI Context ────────────────────────────

export async function buildAdminAIContext(userMessage: string): Promise<string> {
  const msg = userMessage.toLowerCase();

  // Smart context selection: only load relevant data based on question
  const shouldLoadBusiness = /doanh thu|revenue|đơn hàng|order|bán|kinh doanh|tình hình|tóm tắt|tổng quan|hôm nay|tuần|tháng/.test(msg);
  const shouldLoadProducts = /sản phẩm|product|tồn kho|inventory|nhập hàng|bán chạy|danh mục|category|hết hàng/.test(msg);
  const shouldLoadCustomers = /khách|customer|vip|churn|prospect|tiềm năng|segment|phân khúc/.test(msg);
  const shouldLoadBehavior = /hành vi|behavior|funnel|tìm kiếm|search|trang|page|xem|view|chuyển đổi|conversion/.test(msg);
  const shouldLoadSEO = /seo|keyword|google|ranking|meta|title|content|nội dung|slug|sitemap|index/.test(msg);
  const shouldLoadOrders = /đơn hàng|order|gần nhất|recent|chi tiết|pending|chờ|tracking/.test(msg);
  const shouldLoadMarketing = /coupon|voucher|flash|sale|khuyến|mãi|newsletter|email|banner|campaign|marketing/.test(msg);
  const shouldLoadEngagement = /review|đánh giá|wishlist|yêu thích|liên hệ|contact|chat|thông báo|notification|tương tác/.test(msg);
  const shouldLoadContent = /website|trang|cms|brand|thương hiệu|homepage|section|knowledge|ảnh|media|q&a/.test(msg);

  // If nothing specific matches, load everything (general question)
  const anySpecific = shouldLoadBusiness || shouldLoadProducts || shouldLoadCustomers || shouldLoadBehavior || shouldLoadSEO || shouldLoadOrders || shouldLoadMarketing || shouldLoadEngagement || shouldLoadContent;
  const loadAll = !anySpecific;

  const parts: string[] = [];

  // Always add store identity
  parts.push(`🏪 LIKEFOOD — CỬA HÀNG ĐẶC SẢN VIỆT NAM TẠI MỸ (likefood.app)\n`);

  const promises: Promise<string>[] = [];

  if (loadAll || shouldLoadBusiness) promises.push(cached("biz", getBusinessIntelligence));
  if (loadAll || shouldLoadProducts) promises.push(cached("prod", getProductIntelligence));
  if (loadAll || shouldLoadCustomers) promises.push(cached("cust", getCustomerIntelligence));
  if (loadAll || shouldLoadBehavior) promises.push(cached("behavior", getBehaviorSummary));
  if (loadAll || shouldLoadSEO) promises.push(cached("seo", getSEOIntelligence));
  if (loadAll || shouldLoadMarketing) promises.push(cached("marketing", getMarketingIntelligence));
  if (loadAll || shouldLoadEngagement) promises.push(cached("engagement", getEngagementIntelligence));
  if (loadAll || shouldLoadContent) promises.push(cached("content", getWebsiteContentIntelligence));
  if (shouldLoadOrders) promises.push(getRecentOrdersDetail());

  const results = await Promise.all(promises);
  for (const r of results) {
    if (r) parts.push(r);
  }

  parts.push(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HƯỚNG DẪN TRẢ LỜI ADMIN:
• Sử dụng DỮ LIỆU THẬT từ trên (đã query trực tiếp từ MySQL database)
• Luôn ghi rõ nguồn: "Theo dữ liệu database" hoặc "Suy luận từ cấu trúc code"
• KHÔNG bịa số liệu. Nếu thiếu dữ liệu → nói rõ cần gì thêm
• Trả lời bằng Tiếng Việt, ngắn gọn, thực tế, có actionable insights
• Mỗi insight phải có: vấn đề → nguyên nhân → đề xuất → mức ưu tiên
• Kết thúc bằng 2-3 recommended next steps cụ thể
• Phân biệt rõ 3 loại kết luận:
  1️⃣ Xác thực bằng dữ liệu thật (database query)
  2️⃣ Suy luận hợp lý (từ code/structure)
  3️⃣ Cần nguồn ngoài (GSC, GA4, Ahrefs)
`);

  return parts.join("\n");
}

