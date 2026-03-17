/**
 * LIKEFOOD — Seed Product Tags & Search Keywords
 * Gán tags + search keywords cho toàn bộ sản phẩm
 * Run: npx tsx scripts/seed-product-tags.ts
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

// ─── Tag definitions ─────────────────────────────────────────
const TAG_DEFS = [
  { name: "Quà tặng", nameEn: "Gift", slug: "qua-tang" },
  { name: "Ăn kiêng", nameEn: "Diet-friendly", slug: "an-kieng" },
  { name: "Cay nòng", nameEn: "Spicy", slug: "cay-nong" },
  { name: "Truyền thống", nameEn: "Traditional", slug: "truyen-thong" },
  { name: "Ăn vặt", nameEn: "Snack", slug: "an-vat" },
  { name: "Nấu ăn", nameEn: "Cooking", slug: "nau-an" },
  { name: "Bổ dưỡng", nameEn: "Nutritious", slug: "bo-duong" },
  { name: "Bán chạy", nameEn: "Best seller", slug: "ban-chay" },
  { name: "Giảm giá", nameEn: "On sale", slug: "giam-gia" },
] as const;

// ─── Product → Tag mapping ──────────────────────────────────
// Key: product name (from DB), Value: array of tag slugs

function getTagsForProduct(name: string, category: string, price: number, isOnSale: boolean): string[] {
  // Normalize to NFC for consistent Unicode comparison (fix MẮM CÁ etc.)
  const n = name.normalize("NFC").toUpperCase();
  const tags: string[] = [];

  // ── Blacklist: Non-food items (dù giá cao cũng không phải quà tặng thực phẩm)
  const NON_FOOD = /CÂN ĐIỆN TỬ|GỐI NẰM|CAO SU NON/;
  const isNonFood = NON_FOOD.test(n);

  // ── Quà tặng: SP cao cấp thực phẩm, trà premium, hạt, mứt đặc biệt
  if (!isNonFood) {
    const isGift =
      price >= 20 ||
      /HẠT ĐIỀU|HẠT SEN|BÀO NGƯ|ĐÔNG TRÙNG|SAFFRON|TRÀ TÂM SEN|TRÀ ĐÔNG TRÙNG|KẸO DỪA SÁP|MỰC KHÔ|TÔM KHÔ|PHẤN HOA|NẤM LỘC NHUNG/.test(n) ||
      /MỨT GỪNG|MỨT HẠT SEN|MỨT XOÀI|MỨT CAU|TÁO ĐỎ$/.test(n);
    if (isGift) tags.push("qua-tang");
  }

  // ── Ăn kiêng: SP healthy, giảm cân, ngũ cốc, bột đậu
  const isDiet =
    /GIẢM CÂN|NGŨ CỐC|BỘT ĐẬU|BỘT RAU MÁ|THẢO MỘC|THANH NHIỆT|RONG BIỂN|RAU TIẾN VUA|NƯỚC MÁT|GẠO LỨT|TRÀ ỔI|COLLAGEN|HẠT SEN KHÔ|TÁO ĐỎ$/.test(n);
  if (isDiet) tags.push("an-kieng");

  // ── Cay nòng: SP có ớt, mắm, tỏi ớt
  const isSpicy =
    /ỚT|CHÁY TỎI|SỐT BƠ TỎI|TẨM|MUỐI ỚT|CHIÊN MẮM/.test(n) ||
    /MẮM CÁ|MẮM THÁI|MUỐI TÂY NINH/.test(n) ||
    n.includes("MẮM");
  if (isSpicy) tags.push("cay-nong");

  // ── Truyền thống: Đặc sản Việt Nam truyền thống
  const isTraditional =
    category === "Cá khô" ||
    category === "Tôm & Mực khô" ||
    /KHÔ CÁ|KHÔ GÀ|TÔM KHÔ|TÉP KHÔ|CHÀ BÔNG|CHẢ CÁ|BÁNH PHỒNG TÔM|BÁNH ƯỚT|HÀNH PHI|MUỐI TÂY NINH|MỰC KHÔ|MỰC CÁN|CÁ CƠM|CÁ ĐÙ|CÁ DỨA|CÁ ĐUỐI|CÁ THIỀU|TÀU HỦ KI|MĂNG KHÔ|NẤM ĐÔNG CÔ/.test(n) ||
    n.includes("MẮM");
  if (isTraditional) tags.push("truyen-thong");

  // ── Ăn vặt: SP ăn liền, snack, kẹo, hạt, cafe
  const isSnack =
    /HẠT DƯA|HẠT BÍ|HẠT HƯỚNG DƯƠNG|KẸO|BÁNH MOCHI|BÁNH THUYỀN|BÁNH GỪNG|BÁNH RONG BIỂN|BÁNH TAI HEO|RONG BIỂN GIA VỊ|CÓC SẤY|Ô MAI|ỔI SẤY|MÃNG CẦU SẤY|KHOAI LANG SẤY|KHOAI MÔN SẤY|KIM QUẤT|MƠ SẤY|BẮP SẤY|TÁO ĐỎ KẸO|ĐÁ ME/.test(n) ||
    /ĂN LIỀN|CAFE|CANH CHUA|CANH RIÊU/.test(n) ||
    /MỨT ĐU ĐỦ|MỨT THƠM|MỨT CHÙM RUỘT|MỨT CỦ NĂNG|MỨT CHÀ LÀ|MỨT CAU|HẠT ĐIỀU/.test(n);
  if (isSnack) tags.push("an-vat");

  // ── Nấu ăn: Nguyên liệu nấu bếp
  const isCooking =
    category === "Cá khô" ||
    category === "Gia vị Việt" ||
    /TÔM KHÔ|TÉP KHÔ|MỰC KHÔ|NẤM|RONG SỤN|CANH|CHẢ CÁ|HÀNH PHI|TÀU HỦ KI|MĂNG KHÔ|TINH DẦU|TỎI ĐEN|MUỐI TÂY NINH|CÁ CƠM/.test(n) ||
    n.includes("MẮM");
  if (isCooking) tags.push("nau-an");

  // ── Bổ dưỡng: SP có giá trị dinh dưỡng cao
  const isNutritious =
    /ĐÔNG TRÙNG|NẤM LỘC NHUNG|SAFFRON|PHẤN HOA|BÀO NGƯ|HẠT SEN|TỎI ĐEN|NGŨ CỐC|BỘT ĐẬU|TÁO ĐỎ$|COLLAGEN|GẠO LỨT|MỨT GỪNG|MỨT HẠT SEN|RAU TIẾN VUA|NƯỚC MÁT/.test(n);
  if (isNutritious) tags.push("bo-duong");

  // ── Giảm giá
  if (isOnSale) tags.push("giam-gia");

  return tags;
}

// ─── Search Keywords generator ──────────────────────────────
function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function generateSearchKeywords(name: string, category: string): string {
  const keywords: string[] = [];

  // 1. Tên không dấu lowercase
  keywords.push(removeDiacritics(name).toLowerCase());

  // 2. Tên gốc lowercase
  keywords.push(name.toLowerCase());

  // 3. Category không dấu
  keywords.push(removeDiacritics(category).toLowerCase());

  // 4. Từ khóa tiếng Anh và đồng nghĩa
  const n = name.toUpperCase();
  const englishMap: Record<string, string[]> = {
    "CÁ": ["fish", "dried fish", "kho ca"],
    "TÔM": ["shrimp", "dried shrimp", "tom kho"],
    "MỰC": ["squid", "dried squid", "muc kho"],
    "KHÔ": ["dried", "kho"],
    "SẤY": ["dried", "dehydrated", "say"],
    "TRÀ": ["tea", "tra"],
    "CAFE": ["coffee", "ca phe", "cafe"],
    "KẸO": ["candy", "sweet", "keo"],
    "BÁNH": ["cake", "pastry", "banh"],
    "HẠT": ["seed", "nut", "hat"],
    "MỨT": ["jam", "preserve", "candied", "mut"],
    "GIA VỊ": ["seasoning", "spice", "gia vi"],
    "MẮM": ["fish sauce", "mam"],
    "NẤM": ["mushroom", "nam"],
    "RONG BIỂN": ["seaweed", "rong bien"],
    "NGŨ CỐC": ["cereal", "grain", "ngu coc"],
    "BỘT": ["powder", "flour", "bot"],
    "MUỐI": ["salt", "muoi"],
    "ĐẬU": ["bean", "peanut", "dau"],
    "GỪNG": ["ginger", "gung"],
    "SEN": ["lotus", "sen"],
    "DỪA": ["coconut", "dua"],
    "XOÀI": ["mango", "xoai"],
    "CÓC": ["star apple", "coc"],
    "ỔI": ["guava", "oi"],
    "CHANH": ["lime", "lemon", "chanh"],
    "TỎI": ["garlic", "toi"],
    "ỚT": ["chili", "ot"],
    "ĐÔNG TRÙNG": ["cordyceps", "dong trung"],
    "SAFFRON": ["saffron", "nghe tay"],
    "TÁO ĐỎ": ["jujube", "red date", "tao do"],
    "ME": ["tamarind", "me"],
    "MƠ": ["apricot", "mo"],
    "ĐU ĐỦ": ["papaya", "du du"],
    "THƠM": ["pineapple", "thom"],
    "HƯỚNG DƯƠNG": ["sunflower", "huong duong"],
    "BÍ": ["pumpkin seed", "bi"],
    "ĐIỀU": ["cashew", "dieu", "hat dieu"],
    "KHOAI": ["sweet potato", "taro", "khoai"],
    "BẮP": ["corn", "bap"],
    "MĂNG": ["bamboo shoot", "mang"],
    "CÂN ĐIỆN TỬ": ["digital scale", "can dien tu"],
    "GỐI NẰM": ["pillow", "goi nam"],
    "PHẤN HOA": ["pollen", "phan hoa", "bee pollen"],
    "RAU TIẾN VUA": ["rau tien vua", "king vegetable"],
    "CHÀ BÔNG": ["pork floss", "cha bong", "ruoc"],
    "CHẢ CÁ": ["fish cake", "cha ca"],
    "BÀO NGƯ": ["abalone", "bao ngu"],
    "CANH": ["soup", "canh"],
    "TÀU HỦ KI": ["tofu skin", "bean curd", "tau hu ki"],
    "RONG SỤN": ["sea moss", "rong sun"],
  };

  for (const [key, values] of Object.entries(englishMap)) {
    if (n.includes(key)) {
      keywords.push(...values);
    }
  }

  // 5. Đặc sản Việt Nam chung
  keywords.push("dac san", "dac san viet nam", "vietnamese specialty", "likefood");

  // 6. Tên từng từ riêng không dấu (cho partial match)
  const words = removeDiacritics(name).toLowerCase().split(/\s+/).filter(w => w.length > 1);
  keywords.push(...words);

  // Dedupe và join
  const unique = [...new Set(keywords)];
  return unique.join(", ");
}

// ─── Main seed function ─────────────────────────────────────
async function main() {
  console.log("🏷️  Starting tag & keyword seeding...\n");

  // 1. Upsert all tags
  console.log("Step 1: Creating/updating tags...");
  const tagMap = new Map<string, number>();

  for (const def of TAG_DEFS) {
    const tag = await prisma.tag.upsert({
      where: { slug: def.slug },
      update: { name: def.name, nameEn: def.nameEn, isActive: true },
      create: { name: def.name, nameEn: def.nameEn, slug: def.slug, isActive: true },
    });
    tagMap.set(def.slug, tag.id);
    console.log(`  ✅ Tag "${def.name}" (${def.slug}) → id ${tag.id}`);
  }

  // 2. Get all products
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, category: true, price: true, isOnSale: true, soldCount: true },
    orderBy: { id: "asc" },
  });
  console.log(`\nStep 2: Processing ${products.length} products...\n`);

  // 3. Clear old tag assignments for our managed tags (keep user-created tags)
  const managedTagIds = [...tagMap.values()];
  await prisma.producttag.deleteMany({
    where: { tagId: { in: managedTagIds } },
  });
  console.log(`  Cleared old tag assignments for ${managedTagIds.length} managed tags.`);

  // 4. Determine "Bán chạy" (top 15 by soldCount)
  const topSellers = [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 15).map(p => p.id);

  // 4. Assign tags + search keywords for each product
  let tagAssignments = 0;
  let keywordUpdates = 0;

  for (const product of products) {
    // Get tags for this product
    const tagSlugs = getTagsForProduct(product.name, product.category, product.price, product.isOnSale);

    // Add "bán chạy" if in top sellers
    if (topSellers.includes(product.id)) {
      tagSlugs.push("ban-chay");
    }

    // Dedupe
    const uniqueSlugs = [...new Set(tagSlugs)];

    // Create producttag records
    for (const slug of uniqueSlugs) {
      const tagId = tagMap.get(slug);
      if (!tagId) continue;
      try {
        await prisma.producttag.upsert({
          where: { productId_tagId: { productId: product.id, tagId } },
          update: {},
          create: { productId: product.id, tagId },
        });
        tagAssignments++;
      } catch {
        // Skip duplicates
      }
    }

    // Generate and update search keywords
    const searchKeywords = generateSearchKeywords(product.name, product.category);
    await prisma.product.update({
      where: { id: product.id },
      data: { tags: uniqueSlugs.filter(s => s !== "giam-gia" && s !== "ban-chay").join(",") || null },
    });
    keywordUpdates++;

    const tagLabels = uniqueSlugs.map(s => TAG_DEFS.find(d => d.slug === s)?.name ?? s).join(", ");
    console.log(`  [${product.id}] ${product.name} → ${tagLabels || "(no tags)"}`);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Tags assigned: ${tagAssignments}`);
  console.log(`   Products updated: ${keywordUpdates}`);

  // 5. Summary
  console.log("\n📊 Tag summary:");
  for (const def of TAG_DEFS) {
    const count = await prisma.producttag.count({ where: { tagId: tagMap.get(def.slug) } });
    console.log(`   ${def.name}: ${count} products`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
