/**
 * LIKEFOOD — Seed Search Keywords cho toàn bộ sản phẩm
 * Tạo searchKeywords (không dấu + tiếng Anh + từ đồng nghĩa)
 * Run: npx tsx scripts/seed-search-keywords.ts
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/Đ/g, "D");
}

const ENGLISH_MAP: Record<string, string[]> = {
  "CÁ": ["fish", "dried fish"],
  "TÔM": ["shrimp", "dried shrimp"],
  "MỰC": ["squid", "dried squid"],
  "KHÔ": ["dried", "kho"],
  "SẤY": ["dried", "dehydrated"],
  "TRÀ": ["tea"],
  "CAFE": ["coffee", "ca phe"],
  "KẸO": ["candy", "sweet"],
  "BÁNH": ["cake", "pastry"],
  "HẠT": ["seed", "nut"],
  "MỨT": ["jam", "preserve", "candied fruit"],
  "GIA VỊ": ["seasoning", "spice"],
  "MẮM": ["fish sauce", "fermented"],
  "NẤM": ["mushroom"],
  "RONG BIỂN": ["seaweed"],
  "NGŨ CỐC": ["cereal", "grain"],
  "BỘT": ["powder", "flour"],
  "MUỐI": ["salt"],
  "ĐẬU": ["bean", "peanut"],
  "GỪNG": ["ginger"],
  "SEN": ["lotus"],
  "DỪA": ["coconut"],
  "XOÀI": ["mango"],
  "ỔI": ["guava"],
  "CHANH": ["lime", "lemon"],
  "TỎI": ["garlic"],
  "ỚT": ["chili", "hot pepper"],
  "ĐÔNG TRÙNG": ["cordyceps", "dong trung ha thao"],
  "SAFFRON": ["saffron", "nhuy hoa nghe tay"],
  "TÁO ĐỎ": ["jujube", "red date"],
  "ME": ["tamarind"],
  "MƠ": ["apricot"],
  "ĐU ĐỦ": ["papaya"],
  "THƠM": ["pineapple"],
  "HƯỚNG DƯƠNG": ["sunflower seed"],
  "BÍ": ["pumpkin seed"],
  "ĐIỀU": ["cashew"],
  "KHOAI LANG": ["sweet potato"],
  "KHOAI MÔN": ["taro"],
  "BẮP": ["corn"],
  "MĂNG": ["bamboo shoot"],
  "CÂN ĐIỆN TỬ": ["digital scale"],
  "GỐI NẰM": ["pillow", "cushion"],
  "PHẤN HOA": ["bee pollen"],
  "RAU TIẾN VUA": ["king vegetable"],
  "CHÀ BÔNG": ["pork floss", "meat floss", "ruoc"],
  "CHẢ CÁ": ["fish cake"],
  "BÀO NGƯ": ["abalone"],
  "CANH": ["soup"],
  "TÀU HỦ KI": ["tofu skin", "bean curd sheet"],
  "RONG SỤN": ["sea moss", "carrageenan"],
  "CÓC": ["star fruit"],
  "KIM QUẤT": ["kumquat"],
  "MÃNG CẦU": ["soursop", "custard apple"],
  "HẠT DƯA": ["watermelon seed"],
  "Ô MAI": ["dried plum", "preserved fruit"],
  "CHÀ LÀ": ["date", "dried date"],
  "CỦ NĂNG": ["water chestnut"],
  "CHÙM RUỘT": ["star gooseberry"],
  "TINH DẦU": ["essential oil"],
  "TỎI ĐEN": ["black garlic"],
  "HÀNH PHI": ["fried shallot"],
  "CÁ BỐNG": ["goby fish"],
  "CÁ CHỈ VÀNG": ["yellow stripe fish"],
  "CÁ CƠM": ["anchovy"],
  "CÁ ĐÙ": ["croaker fish", "yellow croaker"],
  "CÁ DỨA": ["pangasius", "ca dua"],
  "CÁ KÈO": ["mudskipper"],
  "CÁ KHOAI": ["lizardfish"],
  "CÁ LÓC": ["snakehead fish"],
  "CÁ MỐI": ["moi fish", "ca moi"],
  "CÁ NGÁT": ["catfish", "ca ngat"],
  "CÁ SẶC": ["climbing perch", "ca sac"],
  "CÁ TRA": ["tra fish", "basa"],
  "CÁ THIỀU": ["threadfin bream"],
  "CÁ ĐUỐI": ["stingray", "ray fish"],
  "CÁ LINH": ["linh fish"],
  "MỰC CÁN": ["pressed squid", "rolled squid"],
  "COLLAGEN": ["collagen"],
  "GIẢM CÂN": ["weight loss", "diet"],
  "NẤM LỘC NHUNG": ["deer antler mushroom", "cordyceps mushroom"],
  "NẤM ĐÔNG CÔ": ["shiitake", "dong co mushroom"],
  "BÁNH PHỒNG TÔM": ["shrimp chips", "prawn crackers"],
  "BÁNH ƯỚT": ["steamed rice rolls", "banh uot"],
  "BÁNH MOCHI": ["mochi", "rice cake"],
  "BÁNH THUYỀN": ["boat cake", "banh thuyen"],
  "ME LÀO": ["laos tamarind"],
  "GẠO LỨT": ["brown rice"],
  "LIPTON": ["lipton tea"],
  "NESTEA": ["nestea", "instant tea"],
  "TÉP KHÔ": ["dried baby shrimp"],
  "NƯỚC MÁT": ["herbal drink", "cooling drink"],
  "BỘT ĐẬU NÀNH": ["soy powder", "soybean"],
  "BỘT ĐẬU XANH": ["mung bean powder"],
  "BỘT RAU MÁ": ["pennywort powder"],
  "CAFE SỮA DỪA": ["coconut milk coffee"],
  "CAFE MUỐI": ["salted coffee"],
  "MOCHI": ["mochi", "japanese rice cake"],
  "RONG BIỂN KẸP HẠT": ["seaweed with nuts"],
  "BÁNH TAI HEO": ["pig ear snack"],
  "BÁNH GỪNG TÁO ĐỎ": ["ginger jujube cake"],
  "KẸO MÈ ĐEN": ["black sesame candy"],
  "KẸO DỪA SÁP": ["wax coconut candy"],
  "KẸO THẠCH": ["jelly candy"],
  "DƯA GANG": ["cantaloupe", "melon"],
  "CAO SU NON": ["natural latex"],
  "TAI HEO": ["pig ear"],
  "KHÔ GÀ": ["dried chicken", "chicken jerky"],
  "MẮM THÁI": ["thai sauce"],
};

function generateSearchKeywords(name: string, category: string): string {
  const keywords: string[] = [];
  const n = name.toUpperCase();

  // 1. Tên không dấu lowercase
  keywords.push(removeDiacritics(name).toLowerCase());

  // 2. Tên gốc lowercase
  keywords.push(name.toLowerCase());

  // 3. Category không dấu
  keywords.push(removeDiacritics(category).toLowerCase());
  keywords.push(category.toLowerCase());

  // 4. Từ khóa tiếng Anh
  for (const [key, values] of Object.entries(ENGLISH_MAP)) {
    if (n.includes(key.toUpperCase())) {
      keywords.push(...values);
    }
  }

  // 5. Tên từng từ riêng không dấu
  const words = removeDiacritics(name)
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  keywords.push(...words);

  // 6. Common tags
  keywords.push("dac san", "dac san viet nam", "vietnamese specialty", "likefood", "vietnamese food");

  // Dedupe and join
  return [...new Set(keywords)].join(", ");
}

async function main() {
  console.log("🔍 Seeding search keywords...\n");

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, category: true },
    orderBy: { id: "asc" },
  });

  let count = 0;
  for (const p of products) {
    const kw = generateSearchKeywords(p.name, p.category);
    await prisma.product.update({
      where: { id: p.id },
      data: { searchKeywords: kw },
    });
    count++;
    console.log(`  [${p.id}] ${p.name} → ${kw.substring(0, 80)}...`);
  }

  console.log(`\n✅ Updated searchKeywords for ${count} products`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
