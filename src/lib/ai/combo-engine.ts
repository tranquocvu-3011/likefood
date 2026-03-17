"use server";

/**
 * LIKEFOOD — AI Combo Recommendation Engine
 * Tự động gợi ý combo sản phẩm dựa trên dữ liệu thật.
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { callGPT, callGPTJSON } from "@/lib/ai/ai-provider";
import { logRecommendation } from "@/lib/ai/ai-logger";
import prisma from "@/lib/prisma";
import type { ComboType, ComboResult, ComboProduct, ComboRequest } from "./ai-types";

// ─── Constants ───────────────────────────────────────────────

const COMBO_CONFIGS: Record<ComboType, {
  minItems: number;
  maxItems: number;
  defaultDiscount: number;
  label: string;
  labelEn: string;
}> = {
  snack: { minItems: 3, maxItems: 5, defaultDiscount: 10, label: "Combo Ăn Vặt", labelEn: "Snack Combo" },
  cooking: { minItems: 3, maxItems: 6, defaultDiscount: 8, label: "Combo Nấu Ăn", labelEn: "Cooking Combo" },
  gift: { minItems: 3, maxItems: 5, defaultDiscount: 12, label: "Combo Quà Biếu", labelEn: "Gift Combo" },
  savings: { minItems: 4, maxItems: 6, defaultDiscount: 15, label: "Combo Tiết Kiệm", labelEn: "Savings Combo" },
  bestseller: { minItems: 3, maxItems: 5, defaultDiscount: 10, label: "Combo Bán Chạy", labelEn: "Bestseller Combo" },
  behavioral: { minItems: 3, maxItems: 4, defaultDiscount: 8, label: "Combo Dành Cho Bạn", labelEn: "Combo For You" },
  flashsale: { minItems: 2, maxItems: 4, defaultDiscount: 20, label: "Combo Flash Sale", labelEn: "Flash Sale Combo" },
  frequently_bought: { minItems: 2, maxItems: 4, defaultDiscount: 5, label: "Thường Mua Cùng", labelEn: "Frequently Bought Together" },
};

// ─── Product Loader ──────────────────────────────────────────

interface ProductForCombo {
  id: number;
  name: string;
  slug: string | null;
  price: number;
  salePrice: number | null;
  isOnSale: boolean;
  image: string | null;
  category: string;
  inventory: number;
  soldCount: number;
  ratingAvg: number;
  tagSlugs: string[];
}

async function getAvailableProducts(category?: string, limit = 50): Promise<ProductForCombo[]> {
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      inventory: { gt: 0 },
      ...(category ? { category: { contains: category } } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      salePrice: true,
      isOnSale: true,
      image: true,
      category: true,
      inventory: true,
      soldCount: true,
      ratingAvg: true,
      productTags: { select: { tag: { select: { slug: true } } } },
    },
    orderBy: [{ soldCount: "desc" }, { ratingAvg: "desc" }],
    take: limit * 2, // Fetch more for daily rotation
  });

  // Map to ProductForCombo with tagSlugs
  const mapped: ProductForCombo[] = products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    salePrice: p.salePrice,
    isOnSale: p.isOnSale,
    image: p.image,
    category: p.category,
    inventory: p.inventory,
    soldCount: p.soldCount,
    ratingAvg: p.ratingAvg,
    tagSlugs: p.productTags.map(pt => pt.tag.slug),
  }));

  // ★ Daily rotation: shuffle product order using date-based seed
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  const rng = seededRandom(daySeed);

  // Shuffle within popularity tiers to maintain quality while adding variety
  const tierSize = Math.ceil(mapped.length / 3);
  const shuffled: ProductForCombo[] = [];
  for (let tier = 0; tier < 3; tier++) {
    const tierProducts = mapped.slice(tier * tierSize, (tier + 1) * tierSize);
    for (let i = tierProducts.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [tierProducts[i], tierProducts[j]] = [tierProducts[j], tierProducts[i]];
    }
    shuffled.push(...tierProducts);
  }

  return shuffled.slice(0, limit);
}

/** Filter sản phẩm theo tag slugs hoặc category names */
function filterByTagsOrCategories(
  products: ProductForCombo[],
  tagSlugs: string[],
  categoryKeywords: string[]
): ProductForCombo[] {
  return products.filter(p =>
    tagSlugs.some(slug => p.tagSlugs.includes(slug)) ||
    categoryKeywords.some(c => p.category.toLowerCase().includes(c.toLowerCase()))
  );
}

function toComboProduct(p: ProductForCombo, qty = 1): ComboProduct {
  const effectivePrice = p.isOnSale && p.salePrice ? p.salePrice : p.price;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug ?? String(p.id),
    price: effectivePrice,
    salePrice: p.salePrice,
    image: p.image,
    category: p.category,
    quantity: qty,
  };
}

function calculateCombo(
  products: ComboProduct[],
  discountPct: number
): { totalPrice: number; finalPrice: number; savings: number } {
  const totalPrice = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const finalPrice = Math.round(totalPrice * (1 - discountPct / 100) * 100) / 100;
  return { totalPrice: Math.round(totalPrice * 100) / 100, finalPrice, savings: Math.round((totalPrice - finalPrice) * 100) / 100 };
}

// ─── Combo Generators ────────────────────────────────────────

async function generateSnackCombo(limit = 3): Promise<ComboResult[]> {
  const products = await getAvailableProducts(undefined, 60);
  const snacks = filterByTagsOrCategories(products, ["an-vat"], ["Trà", "Bánh", "Trái cây sấy", "mứt", "Kẹo"]);

  if (snacks.length < 3) return [];

  const combos: ComboResult[] = [];
  const config = COMBO_CONFIGS.snack;

  // Create combos by selecting diverse categories
  for (let i = 0; i < limit && snacks.length >= config.minItems; i++) {
    const usedCategories = new Set<string>();
    const selected: ComboProduct[] = [];

    for (const s of snacks) {
      if (selected.length >= config.maxItems) break;
      if (usedCategories.has(s.category) && selected.length < 3) continue;
      if (combos.some(c => c.products.some(cp => cp.id === s.id) && selected.some(sp => sp.id === s.id))) continue;
      selected.push(toComboProduct(s));
      usedCategories.add(s.category);
    }

    if (selected.length >= config.minItems) {
      const { totalPrice, finalPrice, savings } = calculateCombo(selected, config.defaultDiscount);
      combos.push({
        name: `${config.label} #${i + 1}`,
        nameEn: `${config.labelEn} #${i + 1}`,
        type: "snack",
        description: `Combo ăn vặt đa dạng với ${selected.length} loại đặc sản Việt Nam, phù hợp để nhâm nhi và chia sẻ.`,
        products: selected,
        totalPrice,
        discountPct: config.defaultDiscount,
        finalPrice,
        reason: "Được chọn từ các sản phẩm bán chạy nhất trong danh mục ăn vặt",
        savings,
      });
    }

    // Shift snacks for variety in next combo
    snacks.push(snacks.shift()!);
  }

  return combos;
}

async function generateGiftCombo(limit = 3): Promise<ComboResult[]> {
  const products = await getAvailableProducts(undefined, 50);
  // Ưu tiên SP có tag "quà tặng" + SP cao cấp
  const giftTagged = filterByTagsOrCategories(products, ["qua-tang", "bo-duong"], []);
  const premiumProducts = (giftTagged.length >= 6 ? giftTagged : products)
    .filter(p => p.price >= 10)
    .sort((a, b) => b.price - a.price || b.soldCount - a.soldCount);

  if (premiumProducts.length < 3) return [];

  const config = COMBO_CONFIGS.gift;
  const combos: ComboResult[] = [];

  for (let i = 0; i < limit && i * config.maxItems < premiumProducts.length; i++) {
    const slice = premiumProducts.slice(i * config.minItems, i * config.minItems + config.maxItems);
    if (slice.length < config.minItems) break;

    const selected = slice.map(p => toComboProduct(p));
    const { totalPrice, finalPrice, savings } = calculateCombo(selected, config.defaultDiscount);

    combos.push({
      name: `${config.label} ${i === 0 ? "Sang Trọng" : i === 1 ? "Tinh Tế" : "Đặc Sắc"}`,
      nameEn: `${config.labelEn} ${i === 0 ? "Premium" : i === 1 ? "Elegant" : "Special"}`,
      type: "gift",
      description: `Set quà biếu cao cấp gồm ${selected.length} đặc sản được đánh giá cao, lý tưởng cho dịp tặng quà.`,
      products: selected,
      totalPrice,
      discountPct: config.defaultDiscount,
      finalPrice,
      reason: "Sản phẩm đánh giá cao nhất, phù hợp làm quà",
      savings,
    });
  }

  return combos;
}

async function generateBestsellerCombo(limit = 3): Promise<ComboResult[]> {
  const products = await getAvailableProducts(undefined, 30);
  const top = products.sort((a, b) => b.soldCount - a.soldCount).slice(0, 15);
  
  if (top.length < 3) return [];

  const config = COMBO_CONFIGS.bestseller;
  const combos: ComboResult[] = [];

  for (let i = 0; i < limit; i++) {
    const slice = top.slice(i * config.minItems, i * config.minItems + config.maxItems);
    if (slice.length < config.minItems) break;

    const selected = slice.map(p => toComboProduct(p));
    const { totalPrice, finalPrice, savings } = calculateCombo(selected, config.defaultDiscount);

    combos.push({
      name: `${config.label} #${i + 1}`,
      nameEn: `${config.labelEn} #${i + 1}`,
      type: "bestseller",
      description: `Combo các sản phẩm bán chạy nhất cửa hàng, được hàng trăm khách hàng tin tưởng.`,
      products: selected,
      totalPrice,
      discountPct: config.defaultDiscount,
      finalPrice,
      reason: `Top ${selected.length} sản phẩm bán chạy nhất`,
      savings,
    });
  }

  return combos;
}

async function generateSavingsCombo(limit = 3): Promise<ComboResult[]> {
  const products = await getAvailableProducts(undefined, 50);
  const affordable = products
    .filter(p => p.price <= 25)
    .sort((a, b) => a.price - b.price || b.soldCount - a.soldCount);

  if (affordable.length < 4) return [];

  const config = COMBO_CONFIGS.savings;
  const combos: ComboResult[] = [];

  for (let i = 0; i < limit; i++) {
    const slice = affordable.slice(i * config.minItems, i * config.minItems + config.maxItems);
    if (slice.length < config.minItems) break;

    const selected = slice.map(p => toComboProduct(p));
    const { totalPrice, finalPrice, savings } = calculateCombo(selected, config.defaultDiscount);

    combos.push({
      name: `${config.label} #${i + 1}`,
      nameEn: `${config.labelEn} #${i + 1}`,
      type: "savings",
      description: `Combo tiết kiệm với giảm ${config.defaultDiscount}%, phù hợp cho gia đình.`,
      products: selected,
      totalPrice,
      discountPct: config.defaultDiscount,
      finalPrice,
      reason: "Sản phẩm giá tốt nhất kết hợp giảm giá combo",
      savings,
    });
  }

  return combos;
}

async function generateCookingCombo(limit = 3): Promise<ComboResult[]> {
  const products = await getAvailableProducts(undefined, 60);
  const cookingItems = filterByTagsOrCategories(products, ["nau-an", "truyen-thong"], ["Cá khô", "Tôm", "Mực khô", "Gia vị", "Nước mắm"]);

  if (cookingItems.length < 3) return [];

  const config = COMBO_CONFIGS.cooking;
  const combos: ComboResult[] = [];

  for (let i = 0; i < limit; i++) {
    const usedCategories = new Set<string>();
    const selected: ComboProduct[] = [];

    for (const item of cookingItems) {
      if (selected.length >= config.maxItems) break;
      if (usedCategories.has(item.category) && selected.length < 2) continue;
      selected.push(toComboProduct(item));
      usedCategories.add(item.category);
    }

    if (selected.length < config.minItems) break;

    const { totalPrice, finalPrice, savings } = calculateCombo(selected, config.defaultDiscount);

    combos.push({
      name: `${config.label} ${i === 0 ? "Bếp Việt" : i === 1 ? "Hải Sản" : "Gia Vị"}`,
      nameEn: `${config.labelEn} ${i === 0 ? "Vietnamese Kitchen" : i === 1 ? "Seafood" : "Seasoning"}`,
      type: "cooking",
      description: `Combo nguyên liệu nấu ăn đặc sản Việt, mang hương vị quê nhà vào bếp Mỹ.`,
      products: selected,
      totalPrice,
      discountPct: config.defaultDiscount,
      finalPrice,
      reason: "Nguyên liệu nấu ăn phổ biến trong ẩm thực Việt Nam",
      savings,
    });

    cookingItems.push(cookingItems.shift()!);
  }

  return combos;
}

async function generateFrequentlyBoughtCombo(productId: number, limit = 3): Promise<ComboResult[]> {
  // Find products frequently bought together
  const orderItems = await prisma.orderitem.findMany({
    where: { productId },
    select: { orderId: true },
    take: 100,
  });

  if (orderItems.length === 0) return [];

  const orderIds = orderItems.map(i => i.orderId);
  const relatedItems = await prisma.orderitem.findMany({
    where: {
      orderId: { in: orderIds },
      productId: { not: productId },
    },
    select: { productId: true },
  });

  const counts = relatedItems.reduce<Map<number, number>>((acc, item) => {
    acc.set(item.productId, (acc.get(item.productId) ?? 0) + 1);
    return acc;
  }, new Map());

  const topRelated = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  if (topRelated.length === 0) return [];

  const sourceProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, slug: true, price: true, salePrice: true, isOnSale: true, image: true, category: true, inventory: true, soldCount: true, ratingAvg: true },
  });

  if (!sourceProduct || sourceProduct.inventory <= 0) return [];

  const relatedProducts = await prisma.product.findMany({
    where: { id: { in: topRelated }, isDeleted: false, inventory: { gt: 0 } },
    select: { id: true, name: true, slug: true, price: true, salePrice: true, isOnSale: true, image: true, category: true, inventory: true, soldCount: true, ratingAvg: true },
  });

  if (relatedProducts.length === 0) return [];

  const config = COMBO_CONFIGS.frequently_bought;
  const combos: ComboResult[] = [];

  for (let i = 0; i < limit && i * 2 < relatedProducts.length; i++) {
    const companions = relatedProducts.slice(i * 2, i * 2 + config.maxItems - 1);
    if (companions.length === 0) break;

    const selected = [toComboProduct(sourceProduct as ProductForCombo), ...companions.map(p => toComboProduct({ ...p, tagSlugs: [] } as ProductForCombo))];
    const { totalPrice, finalPrice, savings } = calculateCombo(selected, config.defaultDiscount);

    combos.push({
      name: `${config.label}`,
      nameEn: config.labelEn,
      type: "frequently_bought",
      description: `Combo dựa trên lịch sử đơn hàng: khách mua ${sourceProduct.name} thường mua kèm các sản phẩm này.`,
      products: selected,
      totalPrice,
      discountPct: config.defaultDiscount,
      finalPrice,
      reason: `${orderItems.length} đơn hàng đã mua cùng nhau`,
      savings,
    });
  }

  return combos;
}

async function generateFlashsaleCombo(limit = 3): Promise<ComboResult[]> {
  const saleProducts = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isOnSale: true,
      salePrice: { not: null },
      inventory: { gt: 0 },
    },
    select: { id: true, name: true, slug: true, price: true, salePrice: true, isOnSale: true, image: true, category: true, inventory: true, soldCount: true, ratingAvg: true },
    orderBy: { soldCount: "desc" },
    take: 12,
  });

  if (saleProducts.length < 2) return [];

  const config = COMBO_CONFIGS.flashsale;
  const combos: ComboResult[] = [];

  for (let i = 0; i < limit; i++) {
    const slice = saleProducts.slice(i * config.minItems, i * config.minItems + config.maxItems);
    if (slice.length < config.minItems) break;

    const selected = slice.map(p => toComboProduct({ ...p, tagSlugs: [] } as ProductForCombo));
    const { totalPrice, finalPrice, savings } = calculateCombo(selected, config.defaultDiscount);

    combos.push({
      name: `${config.label} #${i + 1}`,
      nameEn: `${config.labelEn} #${i + 1}`,
      type: "flashsale",
      description: `Combo siêu giảm giá gồm ${selected.length} sản phẩm đang sale + giảm thêm ${config.defaultDiscount}%!`,
      products: selected,
      totalPrice,
      discountPct: config.defaultDiscount,
      finalPrice,
      reason: "Sản phẩm đang flash sale kết hợp giảm giá combo",
      savings,
    });
  }

  return combos;
}

// ─── Smart Combo from Query (AI-powered) ─────────────────────

async function generateSmartCombo(query: string, userId?: number): Promise<ComboResult[]> {
  const products = await getAvailableProducts(undefined, 40);
  if (products.length < 3) return [];

  const productList = products
    .map(p => `[${p.id}] ${p.name} — $${p.price} — ${p.category} — ${p.soldCount} sold`)
    .join("\n");

  const prompt = `Bạn là chuyên gia tư vấn combo cho LIKEFOOD — cửa hàng đặc sản Việt Nam tại Mỹ.

Yêu cầu khách hàng: "${query}"

Danh sách sản phẩm hiện có:
${productList}

Hãy tạo 1-2 combo phù hợp nhất với yêu cầu. Trả về JSON array:
[{
  "name": "tên combo tiếng Việt",
  "nameEn": "combo name in English",
  "type": "snack/cooking/gift/savings/bestseller",
  "description": "mô tả ngắn combo",
  "productIds": [id1, id2, id3],
  "discountPct": 10,
  "reason": "lý do gợi ý combo này"
}]

QUY TẮC:
- CHỈ dùng product IDs có trong danh sách trên
- Mỗi combo 3-5 sản phẩm
- discount 5-20%
- Chọn sản phẩm bổ trợ nhau, không trùng lặp
- Ưu tiên sản phẩm bán chạy và đánh giá cao`;

  const aiResult = await callGPTJSON<Array<{
    name: string;
    nameEn?: string;
    type: string;
    description: string;
    productIds: number[];
    discountPct: number;
    reason: string;
  }>>(prompt, { task: "combo", temperature: 0.6, maxTokens: 800 });

  if (!aiResult || !Array.isArray(aiResult)) return [];

  const productMap = new Map(products.map(p => [p.id, p]));
  const combos: ComboResult[] = [];

  for (const item of aiResult.slice(0, 3)) {
    const validProducts = (item.productIds || [])
      .filter(id => productMap.has(id))
      .map(id => toComboProduct(productMap.get(id)!));

    if (validProducts.length < 2) continue;

    const discount = Math.min(Math.max(item.discountPct || 10, 5), 20);
    const { totalPrice, finalPrice, savings } = calculateCombo(validProducts, discount);

    combos.push({
      name: item.name || "Combo Gợi Ý",
      nameEn: item.nameEn,
      type: (item.type as ComboType) || "savings",
      description: item.description || "Combo được AI gợi ý dựa trên yêu cầu của bạn",
      products: validProducts,
      totalPrice,
      discountPct: discount,
      finalPrice,
      reason: item.reason || "AI gợi ý dựa trên yêu cầu",
      savings,
    });
  }

  return combos;
}

// ─── Save combo to DB ────────────────────────────────────────

async function saveComboToDB(combo: ComboResult): Promise<number> {
  const saved = await prisma.aiCombo.create({
    data: {
      name: combo.name,
      nameEn: combo.nameEn,
      type: combo.type,
      description: combo.description,
      totalPrice: combo.totalPrice,
      discountPct: combo.discountPct,
      finalPrice: combo.finalPrice,
      reason: combo.reason,
      items: {
        create: combo.products.map(p => ({
          productId: p.id,
          quantity: p.quantity,
        })),
      },
    },
  });
  return saved.id;
}

// ─── Public API ──────────────────────────────────────────────

export async function getComboSuggestions(request: ComboRequest): Promise<ComboResult[]> {
  const limit = request.limit ?? 3;

  let combos: ComboResult[] = [];

  // If query provided, use smart combo
  if (request.query) {
    combos = await generateSmartCombo(request.query, request.userId);
  }
  // If specific product, get frequently bought together
  else if (request.productIds?.length === 1) {
    combos = await generateFrequentlyBoughtCombo(request.productIds[0], limit);
  }
  // If type specified, generate that type
  else if (request.type) {
    switch (request.type) {
      case "snack": combos = await generateSnackCombo(limit); break;
      case "gift": combos = await generateGiftCombo(limit); break;
      case "bestseller": combos = await generateBestsellerCombo(limit); break;
      case "savings": combos = await generateSavingsCombo(limit); break;
      case "cooking": combos = await generateCookingCombo(limit); break;
      case "flashsale": combos = await generateFlashsaleCombo(limit); break;
      default: combos = await generateBestsellerCombo(limit); break;
    }
  }
  // Default: bestseller
  else {
    combos = await generateBestsellerCombo(limit);
  }

  // Save to DB and log (non-blocking)
  for (const combo of combos) {
    saveComboToDB(combo).then(id => {
      combo.id = id;
    }).catch(() => {});
  }

  // Log recommendation
  const allProductIds = combos.flatMap(c => c.products.map(p => p.id));
  logRecommendation(
    `combo_${request.type ?? "smart"}`,
    request.query,
    allProductIds,
    request.userId
  ).catch(() => {});

  return combos;
}

export async function getActiveCombo(type?: string): Promise<ComboResult[]> {
  const dbCombos = await prisma.aiCombo.findMany({
    where: {
      isActive: true,
      ...(type ? { type } : {}),
    },
    include: {
      items: true,
    },
    orderBy: { usageCount: "desc" },
    take: 6,
  });

  if (dbCombos.length === 0) return [];

  const allProductIds = dbCombos.flatMap(c => c.items.map(i => i.productId));
  const products = await prisma.product.findMany({
    where: { id: { in: allProductIds }, isDeleted: false },
    select: { id: true, name: true, slug: true, price: true, salePrice: true, isOnSale: true, image: true, category: true, inventory: true, soldCount: true, ratingAvg: true },
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  return dbCombos
    .map(combo => {
      const comboProducts = combo.items
        .filter(item => productMap.has(item.productId))
        .map(item => toComboProduct(productMap.get(item.productId)! as ProductForCombo, item.quantity));

      if (comboProducts.length < 2) return null;

      return {
        id: combo.id,
        name: combo.name,
        nameEn: combo.nameEn ?? undefined,
        type: combo.type as ComboType,
        description: combo.description ?? "",
        products: comboProducts,
        totalPrice: combo.totalPrice,
        discountPct: combo.discountPct,
        finalPrice: combo.finalPrice,
        reason: combo.reason ?? "",
        savings: Math.round((combo.totalPrice - combo.finalPrice) * 100) / 100,
      } satisfies ComboResult;
    })
    .filter(Boolean) as ComboResult[];
}
