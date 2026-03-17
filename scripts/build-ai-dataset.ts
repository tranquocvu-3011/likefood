/**
 * LIKEFOOD AI Dataset Builder
 * Quét toàn bộ sản phẩm từ DB, tạo ~10,000 Q&A entries
 * Chạy: npx tsx scripts/build-ai-dataset.ts
 */

import { PrismaClient } from "../src/generated/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface DatasetEntry {
  question: string;
  answer: string;
  related_products: string[];
  category: string;
  intent: string;
  language: "vi" | "en";
  keywords: string[];
  priority: number;
}

// ─── Vietnamese specialty food domain knowledge ───
const BRAND_CONTEXT = {
  name: "LIKEFOOD",
  slogan: "Hương vị quê nhà – Tận tay bạn tại Mỹ",
  mission: "Mang đặc sản Việt Nam chính gốc đến cộng đồng người Việt tại Mỹ",
  market: "Hoa Kỳ – cộng đồng người Việt",
  channels: ["Website", "Facebook", "TikTok", "Offline"],
  values: ["Chất lượng", "Chính gốc", "Tận tâm", "Giao hàng nhanh"],
};

const FOOD_CATEGORIES: Record<string, {
  viName: string;
  enName: string;
  description: string;
  storage: string;
  audience: string[];
  dishes: string[];
  benefits: string[];
}> = {
  "hai-san-kho": {
    viName: "Hải sản khô",
    enName: "Dried Seafood",
    description: "Các loại cá, tôm, mực được phơi/sấy khô truyền thống, giữ nguyên hương vị biển Việt Nam",
    storage: "Bảo quản nơi khô ráo, thoáng mát. Sau khi mở bao bì, đựng trong hộp kín, có thể bỏ tủ lạnh dùng trong 2-3 tháng",
    audience: ["Gia đình Việt tại Mỹ", "Người thích nấu ăn Việt", "Người mua quà biếu"],
    dishes: ["Canh chua cá lóc", "Cá khô chiên", "Tôm khô xào rau", "Mực khô nướng", "Cơm tấm", "Bún riêu"],
    benefits: ["Giàu protein", "Giàu canxi", "Giàu omega-3", "Ít chất béo", "Bảo quản lâu"],
  },
  "tra-ca-phe": {
    viName: "Trà & Cà phê",
    enName: "Tea & Coffee",
    description: "Trà và cà phê đặc sản Việt Nam, từ trà sen Tây Hồ đến cà phê Buôn Ma Thuột",
    storage: "Đựng trong hộp kín, nơi khô ráo, tránh ánh nắng. Trà giữ được 12-24 tháng, cà phê rang xay nên dùng trong 1-2 tháng",
    audience: ["Người yêu trà đạo", "Người thích cà phê Việt", "Giới văn phòng", "Người cao tuổi"],
    dishes: ["Trà nóng", "Cà phê phin", "Cà phê sữa đá", "Trà đá", "Trà chanh"],
    benefits: ["Chống oxy hóa", "Tỉnh táo", "Giảm stress", "Tốt cho tim mạch"],
  },
  "gia-vi": {
    viName: "Gia vị",
    enName: "Spices & Sauces",
    description: "Nước mắm, tương ớt, gia vị truyền thống Việt Nam – linh hồn của ẩm thực Việt",
    storage: "Nơi khô ráo, thoáng mát. Nước mắm sau khi mở dùng trong 6-12 tháng. Gia vị bột giữ được 12-24 tháng",
    audience: ["Bà nội trợ", "Đầu bếp", "Nhà hàng Việt tại Mỹ"],
    dishes: ["Nước chấm", "Phở", "Bún bò Huế", "Canh chua", "Thịt kho", "Gỏi cuốn"],
    benefits: ["Tăng hương vị", "Thành phần tự nhiên", "Không phẩm màu"],
  },
  "banh-keo": {
    viName: "Bánh kẹo & Snacks",
    enName: "Cakes, Candies & Snacks",
    description: "Bánh pía, kẹo dừa, snacks truyền thống Việt – vị ngọt tuổi thơ",
    storage: "Nơi khô ráo, mát. Sau khi mở, dùng trong vài ngày đến 1 tuần. Một số loại bảo quản tủ lạnh",
    audience: ["Trẻ em", "Gia đình", "Người mua quà", "Khách du lịch"],
    dishes: ["Ăn trực tiếp", "Pha trà uống kèm", "Tráng miệng"],
    benefits: ["Tiện lợi", "Ngon miệng", "Quà tặng ý nghĩa"],
  },
  "trai-cay-say": {
    viName: "Trái cây sấy & Mứt",
    enName: "Dried Fruits & Preserves",
    description: "Xoài sấy, mít sấy, mứt gừng – vị ngọt tự nhiên từ trái cây Việt Nam",
    storage: "Đựng trong bao kín, nơi khô ráo. Giữ được 6-12 tháng. Tránh nơi ẩm ướt",
    audience: ["Người ăn kiêng", "Trẻ em", "Dân văn phòng", "Người tập gym"],
    dishes: ["Ăn vặt", "Trộn yogurt", "Topping bánh", "Pha nước", "Ngâm rượu"],
    benefits: ["Giàu vitamin", "Giàu chất xơ", "Không cholesterol", "Năng lượng tự nhiên"],
  },
  "thit-kho-che-bien": {
    viName: "Thịt khô & Đồ chế biến",
    enName: "Dried Meats & Processed Foods",
    description: "Khô bò, khô gà, chả lụa, nem chua – các sản phẩm chế biến sẵn tiện lợi",
    storage: "Bảo quản tủ lạnh sau khi mở. Sản phẩm đông lạnh giữ được 3-6 tháng. Khô giữ được 6-12 tháng",
    audience: ["Người thích ăn vặt", "Gia đình", "Sinh viên", "Dân văn phòng"],
    dishes: ["Ăn vặt", "Nhậu", "Cơm trưa", "Bánh mì", "Bún"],
    benefits: ["Tiện lợi", "Giàu protein", "Ăn ngay được", "Bảo quản lâu"],
  },
  "qua-bieu": {
    viName: "Quà biếu & Set quà",
    enName: "Gift Sets & Hampers",
    description: "Hộp quà đặc sản Việt Nam cao cấp – quà biếu ý nghĩa cho gia đình và bạn bè",
    storage: "Theo hướng dẫn từng sản phẩm trong set. Giữ nơi khô ráo, mát",
    audience: ["Người mua quà Tết", "Khách doanh nghiệp", "Người biếu gia đình"],
    dishes: [],
    benefits: ["Đóng gói sang trọng", "Ý nghĩa", "Đa dạng sản phẩm", "Tiện tặng"],
  },
};

// ─── Question templates ───

function generateProductQuestions(product: {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
}, catInfo: typeof FOOD_CATEGORIES[string]): DatasetEntry[] {
  const entries: DatasetEntry[] = [];
  const p = product;
  const priceStr = `$${p.price.toFixed(2)}`;

  // --- Vietnamese Q&A ---

  // 1. Sản phẩm là gì?
  entries.push({
    question: `${p.name} là gì?`,
    answer: `${p.name} là sản phẩm ${catInfo.viName.toLowerCase()} đặc sản Việt Nam. ${p.description ? p.description.substring(0, 200) : `Đây là sản phẩm chất lượng cao, được nhập trực tiếp từ Việt Nam. Giá: ${priceStr}.`}`,
    related_products: [p.slug],
    category: "product",
    intent: "PRODUCT_DETAILS",
    language: "vi",
    keywords: [p.name.toLowerCase(), p.slug],
    priority: 10,
  });

  // 2. Giá bao nhiêu?
  entries.push({
    question: `${p.name} giá bao nhiêu?`,
    answer: `${p.name} có giá ${priceStr}. Bạn có thể xem chi tiết và đặt mua trên trang sản phẩm. Đơn từ $99 được freeship standard nhé!`,
    related_products: [p.slug],
    category: "product",
    intent: "PRODUCT_DETAILS",
    language: "vi",
    keywords: [p.name.toLowerCase(), "gia", "price", p.slug],
    priority: 10,
  });

  // 3. Cách bảo quản
  entries.push({
    question: `Cách bảo quản ${p.name}?`,
    answer: `${catInfo.storage}. ${p.name} nên được bảo quản theo hướng dẫn trên bao bì để giữ được hương vị tốt nhất.`,
    related_products: [p.slug],
    category: "storage",
    intent: "PRODUCT_STORAGE",
    language: "vi",
    keywords: [p.name.toLowerCase(), "bao quan", "storage", p.slug],
    priority: 9,
  });

  // 4. Dùng để nấu gì?
  if (catInfo.dishes.length > 0) {
    entries.push({
      question: `${p.name} dùng để nấu gì?`,
      answer: `${p.name} có thể dùng để chế biến nhiều món: ${catInfo.dishes.join(", ")}. Bạn có thể sáng tạo thêm theo khẩu vị gia đình nhé!`,
      related_products: [p.slug],
      category: "usage",
      intent: "PRODUCT_USAGE",
      language: "vi",
      keywords: [p.name.toLowerCase(), "nau", "che bien", "cook", p.slug],
      priority: 9,
    });
  }

  // 5. Phù hợp với ai?
  entries.push({
    question: `${p.name} phù hợp với ai?`,
    answer: `${p.name} phù hợp với ${catInfo.audience.join(", ")}. Đây là sản phẩm ${catInfo.viName.toLowerCase()} chất lượng, thích hợp làm quà biếu hoặc sử dụng hàng ngày.`,
    related_products: [p.slug],
    category: "product",
    intent: "RECOMMENDATION_REQUEST",
    language: "vi",
    keywords: [p.name.toLowerCase(), "phu hop", "doi tuong", p.slug],
    priority: 8,
  });

  // 6. Lợi ích sức khỏe
  if (catInfo.benefits.length > 0) {
    entries.push({
      question: `${p.name} có lợi ích gì?`,
      answer: `${p.name} thuộc nhóm ${catInfo.viName.toLowerCase()}, có nhiều lợi ích: ${catInfo.benefits.join(", ")}. Sản phẩm được nhập trực tiếp từ Việt Nam, đảm bảo chất lượng.`,
      related_products: [p.slug],
      category: "nutrition",
      intent: "PRODUCT_BENEFITS",
      language: "vi",
      keywords: [p.name.toLowerCase(), "loi ich", "benefit", p.slug],
      priority: 8,
    });
  }

  // 7. Có ngon không?
  entries.push({
    question: `${p.name} có ngon không?`,
    answer: `${p.name} là sản phẩm ${catInfo.viName.toLowerCase()} cực kỳ được yêu thích! Nhiều khách hàng của LIKEFOOD đánh giá rất cao. Bạn có thể xem đánh giá thực tế trên trang sản phẩm nhé.`,
    related_products: [p.slug],
    category: "product",
    intent: "PRODUCT_DETAILS",
    language: "vi",
    keywords: [p.name.toLowerCase(), "ngon", "danh gia", p.slug],
    priority: 8,
  });

  // 8. Làm quà tặng được không?
  entries.push({
    question: `${p.name} làm quà tặng được không?`,
    answer: `Được chứ! ${p.name} là món quà đặc sản Việt rất ý nghĩa. LIKEFOOD có dịch vụ gói quà sang trọng, giao trực tiếp đến người nhận. Rất phù hợp biếu gia đình, bạn bè!`,
    related_products: [p.slug],
    category: "gift",
    intent: "GIFT_IDEA",
    language: "vi",
    keywords: [p.name.toLowerCase(), "qua tang", "bieu", "gift", p.slug],
    priority: 8,
  });

  // 9. Xuất xứ
  entries.push({
    question: `${p.name} xuất xứ từ đâu?`,
    answer: `${p.name} được nhập trực tiếp từ Việt Nam, qua kiểm tra chất lượng nghiêm ngặt. LIKEFOOD chỉ bán sản phẩm chính gốc, đảm bảo hương vị đúng chuẩn Việt Nam.`,
    related_products: [p.slug],
    category: "origin",
    intent: "PRODUCT_ORIGIN",
    language: "vi",
    keywords: [p.name.toLowerCase(), "xuat xu", "nguon goc", "origin", p.slug],
    priority: 8,
  });

  // --- English Q&A ---

  entries.push({
    question: `What is ${p.name}?`,
    answer: `${p.name} is a premium Vietnamese ${catInfo.enName.toLowerCase()} product. ${p.description ? p.description.substring(0, 200) : `High-quality, imported directly from Vietnam. Price: ${priceStr}.`}`,
    related_products: [p.slug],
    category: "product",
    intent: "PRODUCT_DETAILS",
    language: "en",
    keywords: [p.name.toLowerCase(), p.slug],
    priority: 10,
  });

  entries.push({
    question: `How much is ${p.name}?`,
    answer: `${p.name} is priced at ${priceStr}. Free standard shipping on orders $99+!`,
    related_products: [p.slug],
    category: "product",
    intent: "PRODUCT_DETAILS",
    language: "en",
    keywords: [p.name.toLowerCase(), "price", "cost", p.slug],
    priority: 10,
  });

  entries.push({
    question: `How to store ${p.name}?`,
    answer: `${catInfo.storage}. Always follow the storage instructions on the packaging for best results.`,
    related_products: [p.slug],
    category: "storage",
    intent: "PRODUCT_STORAGE",
    language: "en",
    keywords: [p.name.toLowerCase(), "store", "storage", p.slug],
    priority: 9,
  });

  return entries;
}

function generateGeneralQuestions(): DatasetEntry[] {
  const entries: DatasetEntry[] = [];

  // ─── Brand awareness ───
  const brandQA: Array<{ q: string; a: string; intent: string; cat: string; lang: "vi" | "en"; kw: string[] }> = [
    // Vietnamese
    { q: "LIKEFOOD là gì?", a: `${BRAND_CONTEXT.name} là nền tảng thương mại điện tử chuyên đặc sản Việt Nam tại Mỹ. Sứ mệnh: "${BRAND_CONTEXT.mission}". Khẩu hiệu: "${BRAND_CONTEXT.slogan}". Chúng tôi mang đến hải sản khô, trà, cà phê, gia vị, bánh kẹo, quà biếu chất lượng cao cho cộng đồng người Việt tại Mỹ.`, intent: "GENERAL_QUESTION", cat: "general", lang: "vi", kw: ["likefood", "gioi thieu", "la gi"] },
    { q: "Tại sao nên mua ở LIKEFOOD?", a: "LIKEFOOD cam kết: 1) Sản phẩm 100% nhập từ Việt Nam, 2) Kiểm tra chất lượng nghiêm ngặt, 3) Giao hàng nhanh toàn Mỹ, 4) Freeship từ $99, 5) Đổi trả dễ dàng trong 7 ngày, 6) Hỗ trợ tiếng Việt 24/7.", intent: "GENERAL_QUESTION", cat: "general", lang: "vi", kw: ["tai sao", "ly do", "uu diem"] },
    { q: "LIKEFOOD bán những gì?", a: "LIKEFOOD bán đặc sản Việt Nam: hải sản khô (cá, tôm, mực), trà & cà phê, gia vị (nước mắm, tương ớt), bánh kẹo & snacks, trái cây sấy & mứt, thịt khô, và set quà biếu cao cấp. Tổng hơn 100 sản phẩm!", intent: "GENERAL_QUESTION", cat: "general", lang: "vi", kw: ["ban gi", "san pham", "danh muc"] },
    { q: "LIKEFOOD có giao hàng ở đâu?", a: "LIKEFOOD giao hàng toàn bộ 50 bang của Mỹ. Standard 5-7 ngày, Express 2-3 ngày. Freeship standard cho đơn từ $99, freeship express cho đơn từ $199.", intent: "SHIPPING_INQUIRY", cat: "shipping", lang: "vi", kw: ["giao hang", "ship", "khu vuc"] },
    { q: "Câu chuyện LIKEFOOD?", a: `LIKEFOOD được thành lập từ nỗi nhớ hương vị quê nhà của cộng đồng người Việt tại Mỹ. Chúng tôi hiểu rằng xa quê, điều khiến bạn nhớ nhiều nhất chính là bữa cơm gia đình, ly cà phê phin buổi sáng, hay miếng khô bò thương thuở nhỏ. LIKEFOOD ra đời để mang những hương vị đó đến tận tay bạn, dù bạn ở bất kỳ đâu trên nước Mỹ. "${BRAND_CONTEXT.slogan}"`, intent: "GENERAL_QUESTION", cat: "general", lang: "vi", kw: ["cau chuyen", "about", "lich su", "thuong hieu"] },
    { q: "LIKEFOOD phục vụ ai?", a: "LIKEFOOD phục vụ cộng đồng người Việt tại Mỹ, bao gồm: gia đình Việt muốn nấu ăn Việt, du học sinh nhớ nhà, người mua quà biếu gia đình, nhà hàng Việt cần nguyên liệu, và tất cả những ai yêu ẩm thực Việt Nam.", intent: "GENERAL_QUESTION", cat: "general", lang: "vi", kw: ["doi tuong", "khach hang", "phuc vu"] },
    { q: "LIKEFOOD có uy tín không?", a: "LIKEFOOD cam kết uy tín: sản phẩm chính gốc 100% Việt Nam, có giấy kiểm tra chất lượng, đổi trả trong 7 ngày, bảo hiểm vận chuyển, thanh toán an toàn qua Stripe. Hàng ngàn khách hàng tin tưởng!", intent: "GENERAL_QUESTION", cat: "general", lang: "vi", kw: ["uy tin", "trust", "dam bao"] },

    // English
    { q: "What is LIKEFOOD?", a: `${BRAND_CONTEXT.name} is a leading Vietnamese specialty food marketplace in the USA. Our mission: "${BRAND_CONTEXT.mission}". We bring authentic dried seafood, tea, coffee, spices, snacks, and premium gift sets to the Vietnamese community across America.`, intent: "GENERAL_QUESTION", cat: "general", lang: "en", kw: ["likefood", "about", "what is"] },
    { q: "Why buy from LIKEFOOD?", a: "LIKEFOOD offers: 1) 100% authentic Vietnamese products, 2) Strict quality control, 3) Fast USA-wide shipping, 4) Free shipping at $99+, 5) Easy 7-day returns, 6) Vietnamese & English support 24/7.", intent: "GENERAL_QUESTION", cat: "general", lang: "en", kw: ["why", "reason", "advantage"] },
    { q: "What does LIKEFOOD sell?", a: "LIKEFOOD sells Vietnamese specialties: dried seafood (fish, shrimp, squid), tea & coffee, spices (fish sauce, chili sauce), cakes & snacks, dried fruits, dried meats, and premium gift sets. Over 100 products!", intent: "GENERAL_QUESTION", cat: "general", lang: "en", kw: ["sell", "products", "categories"] },
  ];

  for (const item of brandQA) {
    entries.push({
      question: item.q,
      answer: item.a,
      related_products: [],
      category: item.cat,
      intent: item.intent,
      language: item.lang,
      keywords: item.kw,
      priority: 10,
    });
  }

  // ─── Scenario-based Q&A ───
  const scenarios: Array<{ q: string; a: string; intent: string; cat: string; kw: string[] }> = [
    // Gift suggestions
    { q: "Nên mua đặc sản gì làm quà?", a: "Nếu bạn muốn tặng quà đặc sản Việt, mình gợi ý: 1) Set trà + bánh – thanh lịch, phù hợp mọi lứa tuổi. 2) Hải sản khô cao cấp (tôm khô, mực khô) – thực tế, gia đình ai cũng dùng được. 3) Hộp quà tổng hợp – đa dạng sản phẩm, gây ấn tượng. 4) Cà phê phin + đường phèn – nếu người nhận thích cà phê Việt. Bạn tặng cho ai, mình tư vấn cụ thể hơn nhé!", intent: "GIFT_IDEA", cat: "gift", kw: ["qua", "tang", "bieu", "gift"] },
    { q: "Quà Tết nên chọn gì?", a: "Quà Tết LIKEFOOD gợi ý: 1) Hộp quà Tết truyền thống (bánh + mứt + trà) – từ $29. 2) Set hải sản khô cao cấp – từ $49. 3) Hộp quà premium mix đặc sản 3 miền – từ $89. Đặt sớm để LIKEFOOD kịp giao trước Tết nhé!", intent: "GIFT_IDEA", cat: "gift", kw: ["qua tet", "tet", "nam moi", "spring"] },
    { q: "Mua quà cho bố mẹ ở Việt Nam đang sống ở Mỹ", a: "Bố mẹ xa quê chắc nhớ hương vị Việt lắm! Mình gợi ý: trà sen hoặc trà lài (cho mẹ), cà phê phin (cho bố), nước mắm Phú Quốc + tương ớt (nấu ăn hàng ngày), và thêm ít khô bò/khô gà ăn vặt. LIKEFOOD giao tận nhà, bạn chỉ cần nhập địa chỉ nhé!", intent: "GIFT_IDEA", cat: "gift", kw: ["bo me", "gia dinh", "family"] },

    // Product recommendations by situation
    { q: "Tôi muốn mua đồ ăn vặt", a: "Đồ ăn vặt LIKEFOOD có rất nhiều: 1) Khô bò, khô gà – ăn vặt thơm giòn. 2) Trái cây sấy (xoài, mít, chuối) – healthy snack. 3) Bánh tráng – giòn tan. 4) Kẹo dừa, kẹo lạc – ngọt ngào tuổi thơ. 5) Hạt điều, hạt dưa – bùi béo. Bạn thích loại nào mình tư vấn thêm!", intent: "PRODUCT_SEARCH", cat: "product", kw: ["an vat", "snack", "do an"] },
    { q: "Có gì nấu canh chua không?", a: "Nấu canh chua chuẩn Việt, bạn cần: 1) Cá lóc khô hoặc tôm khô – cho nước ngọt. 2) Nước mắm – nêm nếm. 3) Me chua – tại LIKEFOOD không có me tươi nhưng có gia vị canh chua sẵn. Mua kèm cá khô + nước mắm là có nồi canh chua xịn rồi!", intent: "COOKING_HELP", cat: "usage", kw: ["canh chua", "nau an", "cooking"] },
    { q: "Nên mua gì cho nhà hàng Việt?", a: "Nhà hàng Việt tại Mỹ thường cần: nước mắm, tương ớt, gia vị nấu phở/bún bò, cá khô (canh chua), tôm khô (bún riêu), mực khô. LIKEFOOD hỗ trợ mua sỉ giá ưu đãi và giao hàng định kỳ cho nhà hàng. Liên hệ sales@likefood.com!", intent: "RECOMMENDATION_REQUEST", cat: "bulk", kw: ["nha hang", "restaurant", "si"] },
    { q: "Cá khô nào ngon nhất?", a: "Mỗi loại cá khô có vị riêng: 1) Cá lóc khô – thịt dày, ngọt, nấu canh chua tuyệt. 2) Cá sặc khô – vị đậm đà, chiên giòn ăn cơm. 3) Cá thu khô – béo ngậy, nướng than hoa ngon. 4) Cá trích khô – nhỏ, giòn, ăn vặt. Tùy khẩu vị, nhưng cá lóc và cá sặc bán chạy nhất ở LIKEFOOD!", intent: "COMPARISON", cat: "product", kw: ["ca kho", "ngon nhat", "so sanh"] },
    { q: "Mực khô chế biến thế nào?", a: "Mực khô có nhiều cách chế biến: 1) Nướng than/lò – thơm phức, xé ăn vặt tuyệt. 2) Xào rau – mực xào hành tây, ớt chuông. 3) Chiên giòn – tẩm bột chiên, chấm tương ớt. 4) Nấu canh – mực khô nấu canh bí đao rất ngon. Trước khi chế biến, ngâm mực trong nước 15-20 phút cho mềm nhé!", intent: "PRODUCT_USAGE", cat: "usage", kw: ["muc kho", "che bien", "nau"] },
    { q: "Tôm khô dùng nấu món gì?", a: "Tôm khô siêu đa năng: 1) Bún riêu – nước dùng ngọt thanh. 2) Nấu canh – canh cải, canh bầu. 3) Xào – tôm khô xào rau. 4) Bánh khọt, bánh xèo – nhân tôm. 5) Ăn trực tiếp – tôm khô rang muối ớt. 6) Nấu cháo – cháo tôm khô. Tôm LIKEFOOD thịt chắc, ngọt tự nhiên!", intent: "PRODUCT_USAGE", cat: "usage", kw: ["tom kho", "nau", "mon an"] },
    { q: "Trà Việt Nam nào dễ uống?", a: "Nếu mới thử trà Việt, mình gợi ý theo thứ tự dễ uống: 1) Trà lài – nhẹ nhàng, thơm hoa. 2) Trà sen – thanh mát, dịu nhẹ. 3) Trà gừng – ấm bụng, tốt cho sức khỏe. 4) Trà olong – đậm vị hơn. 5) Trà xanh – tươi mát. Trà lài là lựa chọn an toàn nhất cho người mới!", intent: "RECOMMENDATION_REQUEST", cat: "product", kw: ["tra", "de uong", "goi y"] },
    { q: "Có đặc sản miền Tây không?", a: "Có chứ! Miền Tây là vựa đặc sản: cá lóc khô, tôm khô Cà Mau, mực khô, nước mắm Phú Quốc, bánh pía Sóc Trăng, kẹo dừa Bến Tre, khô bò, mít sấy. LIKEFOOD có nhiều đặc sản miền Tây chính gốc! Bạn muốn xem danh mục nào?", intent: "PRODUCT_SEARCH", cat: "product", kw: ["mien tay", "dac san", "southern"] },
    { q: "Sản phẩm nào bán chạy nhất?", a: "Top sản phẩm bán chạy tại LIKEFOOD: 1) Nước mắm Phú Quốc – gia vị không thể thiếu. 2) Cà phê phin – cà phê Việt chuẩn vị. 3) Tôm khô – nấu ăn đa năng. 4) Trà sen – thanh mát, sang trọng. 5) Khô bò – snack yêu thích. Bạn muốn mình tư vấn sản phẩm nào cụ thể không?", intent: "RECOMMENDATION_REQUEST", cat: "product", kw: ["ban chay", "best seller", "pho bien"] },
    { q: "Muốn thử ẩm thực Việt nên bắt đầu từ đâu?", a: "Chào mừng bạn đến với ẩm thực Việt! Mình gợi ý bắt đầu với: 1) Nước mắm + chanh + ớt = nước chấm. 2) Cà phê phin + sữa đặc = cà phê sữa. 3) Trà lài – nhẹ nhàng, dễ uống. 4) Bánh tráng – cuốn rau. 5) Tôm khô – snack kiểu Việt. Từ từ khám phá, bạn sẽ mê!", intent: "RECOMMENDATION_REQUEST", cat: "product", kw: ["bat dau", "thu", "moi", "beginner"] },

    // Comparison
    { q: "So sánh cà phê rang xay và cà phê hòa tan", a: "Cà phê rang xay: hương vị đậm đà, cần phin hoặc máy pha, thời gian pha lâu hơn nhưng ngon hơn nhiều. Cà phê hòa tan: tiện lợi, chỉ cần nước nóng, phù hợp người bận rộn. Tại LIKEFOOD cả hai loại đều có. Nếu bạn muốn trải nghiệm chuẩn Việt, mình khuyên dùng rang xay pha phin!", intent: "COMPARISON", cat: "product", kw: ["so sanh", "ca phe", "rang xay", "hoa tan"] },
    { q: "Nước mắm Phú Quốc khác nước mắm thường thế nào?", a: "Nước mắm Phú Quốc: 1) Độ đạm cao (30-40°N). 2) Vị ngọt tự nhiên, không gắt. 3) Làm từ cá cơm Phú Quốc chính gốc. 4) Có chỉ dẫn địa lý bảo hộ. Nước mắm thường: đạm thấp hơn, có thể pha thêm. Tại LIKEFOOD có nước mắm Phú Quốc chính gốc nhé!", intent: "COMPARISON", cat: "product", kw: ["nuoc mam", "phu quoc", "so sanh"] },

    // Cooking help
    { q: "Hướng dẫn nấu phở tại nhà", a: "Nấu phở cần: 1) Xương bò hầm 3-4 tiếng. 2) Gia vị: quế, hồi, đinh hương, gừng nướng (LIKEFOOD có bộ gia vị phở). 3) Nước mắm nêm vừa. 4) Bánh phở. 5) Rau giá, ngò gai, chanh, ớt. Bí quyết: nướng gừng + hành trước khi cho vào nồi, ninh lửa nhỏ cho nước trong!", intent: "COOKING_HELP", cat: "usage", kw: ["pho", "nau pho", "huong dan"] },
    { q: "Cách làm bún riêu cua", a: "Bún riêu chua thanh: 1) Tôm khô (có ở LIKEFOOD) – giã nhuyễn hoặc xay, cho vào nồi nước. 2) Cà chua bằm nhuyễn. 3) Me chua. 4) Nước mắm nêm vừa. 5) Đậu hũ chiên. 6) Rau sống, bún. Tôm khô LIKEFOOD thịt chắc, nước dùng ngọt tự nhiên, không cần bột nêm!", intent: "COOKING_HELP", cat: "usage", kw: ["bun rieu", "cooking", "tom kho"] },

    // Seasonal
    { q: "Tết Nguyên Đán có khuyến mãi gì?", a: "LIKEFOOD có chương trình Tết hàng năm: giảm 15-30% toàn bộ sản phẩm, freeship tất cả đơn hàng, set quà Tết đặc biệt, coupon ưu đãi, flash sale. Đặt sớm để LIKEFOOD kịp giao trước Tết! Theo dõi email và fanpage để không bỏ lỡ nhé!", intent: "PROMOTION_INQUIRY", cat: "promotion", kw: ["tet", "khuyen mai", "giam gia", "holiday"] },

    // Dietary
    { q: "Sản phẩm nào phù hợp người ăn chay?", a: "LIKEFOOD có nhiều sản phẩm chay: trà (các loại), cà phê, gia vị (tương chao, tương đậu), trái cây sấy toàn bộ, mứt, hạt (điều, dưa, hướng dương), bún khô, bánh tráng. Tìm theo filter 'Chay' trên website nhé!", intent: "DIET_SPECIFIC", cat: "product", kw: ["chay", "vegan", "vegetarian"] },
    { q: "Có sản phẩm nào ít đường?", a: "Sản phẩm ít/không đường: trà (hầu hết không đường), cà phê đen, cá khô, tôm khô, mực khô, gia vị (nước mắm, tương ớt). Tránh kẹo, mứt, trái cây sấy có đường. Xem nutrition label trên mỗi sản phẩm!", intent: "DIET_SPECIFIC", cat: "product", kw: ["it duong", "khong duong", "sugar free", "diet"] },
  ];

  for (const s of scenarios) {
    entries.push({
      question: s.q,
      answer: s.a,
      related_products: [],
      category: s.cat,
      intent: s.intent,
      language: "vi",
      keywords: s.kw,
      priority: 9,
    });
  }

  return entries;
}

function generateVariations(entries: DatasetEntry[]): DatasetEntry[] {
  const variations: DatasetEntry[] = [];

  // Create question variations for product entries
  for (const entry of entries) {
    if (entry.intent === "PRODUCT_DETAILS" && entry.language === "vi" && entry.related_products.length > 0) {
      const productName = entry.question.replace(/\s*(là gì|giá bao nhiêu)\?$/i, "").trim();
      if (!productName) continue;

      // "Cho tôi biết về X"
      variations.push({
        ...entry,
        question: `Cho tôi biết về ${productName}`,
        keywords: [...entry.keywords, "cho biet", "thong tin"],
      });

      // "X có đặc biệt gì?"
      variations.push({
        ...entry,
        question: `${productName} có đặc biệt gì?`,
        keywords: [...entry.keywords, "dac biet"],
        intent: "PRODUCT_BENEFITS",
      });

      // "Review X"
      variations.push({
        ...entry,
        question: `Review ${productName}`,
        keywords: [...entry.keywords, "review", "danh gia"],
      });

      // "Mua X ở đâu?"
      variations.push({
        ...entry,
        question: `Mua ${productName} ở đâu?`,
        answer: `Bạn có thể mua ${productName} trực tiếp tại website LIKEFOOD (likefood.com). Đặt hàng online, thanh toán an toàn, giao tận nhà. Freeship từ $99!`,
        keywords: [...entry.keywords, "mua o dau", "buy"],
        intent: "ORDER_PLACING",
      });
    }
  }

  return variations;
}

// ─── Main ───

async function main() {
  console.log("🚀 LIKEFOOD AI Dataset Builder");
  console.log("================================\n");

  // 1. Fetch all products from DB
  console.log("📦 Đang quét toàn bộ sản phẩm...");
  const products = await prisma.product.findMany({
    where: { isDeleted: false, isVisible: true },
    include: {
      categoryRel: true,
    },
    orderBy: { name: "asc" },
  });
  console.log(`   Tìm thấy: ${products.length} sản phẩm`);

  // 2. Fetch all categories
  console.log("📁 Đang quét danh mục...");
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  console.log(`   Tìm thấy: ${categories.length} danh mục`);

  // 3. Build dataset
  console.log("\n🔨 Building dataset...\n");
  const allEntries: DatasetEntry[] = [];

  // 3a. Product-specific entries
  for (const product of products) {
    const categorySlug = product.categoryRel?.slug || product.category || "general";
    const catInfo = FOOD_CATEGORIES[categorySlug] ||
      Object.values(FOOD_CATEGORIES).find(c =>
        c.viName.toLowerCase().includes((product.categoryRel?.name || product.category || "").toLowerCase())
      ) ||
      FOOD_CATEGORIES["banh-keo"]; // fallback

    const productEntries = generateProductQuestions(
      {
        name: product.name,
        slug: product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
        description: (product.description || "").replace(/<[^>]*>/g, "").substring(0, 300),
        price: product.price,
        category: product.categoryRel?.name || product.category || "Khác",
      },
      catInfo
    );
    allEntries.push(...productEntries);
  }
  console.log(`   Product entries: ${allEntries.length}`);

  // 3b. General Q&A (brand, scenarios, etc.)
  const generalEntries = generateGeneralQuestions();
  allEntries.push(...generalEntries);
  console.log(`   + General entries: ${generalEntries.length}`);

  // 3c. Variations
  const variations = generateVariations(allEntries);
  allEntries.push(...variations);
  console.log(`   + Variations: ${variations.length}`);

  // 3d. Category-specific Q&A
  for (const cat of categories) {
    const catInfo = FOOD_CATEGORIES[cat.slug] || null;
    if (!catInfo) continue;

    allEntries.push({
      question: `Danh mục ${catInfo.viName} có gì?`,
      answer: `LIKEFOOD có danh mục ${catInfo.viName} với nhiều sản phẩm: ${catInfo.description}. ${catInfo.benefits.length > 0 ? `Lợi ích: ${catInfo.benefits.join(", ")}.` : ""} Bạn có thể xem tất cả sản phẩm trong danh mục này trên website.`,
      related_products: [],
      category: "product",
      intent: "PRODUCT_SEARCH",
      language: "vi",
      keywords: [cat.slug, catInfo.viName.toLowerCase()],
      priority: 9,
    });

    allEntries.push({
      question: `What ${catInfo.enName} products do you have?`,
      answer: `LIKEFOOD has a wide range of ${catInfo.enName}: ${catInfo.description}. Browse the full category on our website!`,
      related_products: [],
      category: "product",
      intent: "PRODUCT_SEARCH",
      language: "en",
      keywords: [cat.slug, catInfo.enName.toLowerCase()],
      priority: 9,
    });
  }

  console.log(`\n📊 TỔNG ENTRIES: ${allEntries.length}`);

  // 4. Write files
  const outDir = path.join(__dirname, "..", "src", "data", "ai");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 4a. Main dataset JSON
  const datasetPath = path.join(outDir, "likefood_ai_dataset.json");
  fs.writeFileSync(datasetPath, JSON.stringify(allEntries, null, 2), "utf-8");
  console.log(`\n✅ Saved: ${datasetPath} (${allEntries.length} entries)`);

  // 4b. Intents JSON
  const intentCounts: Record<string, number> = {};
  for (const e of allEntries) {
    intentCounts[e.intent] = (intentCounts[e.intent] || 0) + 1;
  }
  const intentsPath = path.join(outDir, "likefood_ai_intents.json");
  fs.writeFileSync(intentsPath, JSON.stringify({
    total: allEntries.length,
    intents: intentCounts,
    categories: [...new Set(allEntries.map(e => e.category))],
    languages: { vi: allEntries.filter(e => e.language === "vi").length, en: allEntries.filter(e => e.language === "en").length },
  }, null, 2), "utf-8");
  console.log(`✅ Saved: ${intentsPath}`);

  // 4c. Training markdown
  const trainingMd = [
    "# LIKEFOOD AI Training Data",
    "",
    `> Generated: ${new Date().toISOString()}`,
    `> Total entries: ${allEntries.length}`,
    `> Products scanned: ${products.length}`,
    `> Categories: ${categories.length}`,
    "",
    "## Brand Context",
    "",
    `- **Name**: ${BRAND_CONTEXT.name}`,
    `- **Slogan**: ${BRAND_CONTEXT.slogan}`,
    `- **Mission**: ${BRAND_CONTEXT.mission}`,
    `- **Market**: ${BRAND_CONTEXT.market}`,
    `- **Channels**: ${BRAND_CONTEXT.channels.join(", ")}`,
    "",
    "## Intent Distribution",
    "",
    ...Object.entries(intentCounts).sort((a, b) => b[1] - a[1]).map(([int, cnt]) => `- **${int}**: ${cnt} entries`),
    "",
    "## Product Categories",
    "",
    ...Object.entries(FOOD_CATEGORIES).map(([slug, info]) => [
      `### ${info.viName} (${info.enName})`,
      info.description,
      `- **Storage**: ${info.storage}`,
      `- **Audience**: ${info.audience.join(", ")}`,
      `- **Dishes**: ${info.dishes.join(", ")}`,
      `- **Benefits**: ${info.benefits.join(", ")}`,
      "",
    ].join("\n")),
    "",
    "## Sample Q&A",
    "",
    ...allEntries.slice(0, 20).map((e, i) => [
      `### ${i + 1}. ${e.question}`,
      `**Answer**: ${e.answer.substring(0, 200)}...`,
      `**Intent**: ${e.intent} | **Category**: ${e.category} | **Language**: ${e.language}`,
      "",
    ].join("\n")),
  ].join("\n");

  const trainingPath = path.join(outDir, "likefood_ai_training.md");
  fs.writeFileSync(trainingPath, trainingMd, "utf-8");
  console.log(`✅ Saved: ${trainingPath}`);

  // 5. Seed to database
  console.log("\n🌱 Seeding to database...");
  let seeded = 0;
  const batchSize = 100;

  for (let i = 0; i < allEntries.length; i += batchSize) {
    const batch = allEntries.slice(i, i + batchSize);
    await prisma.aiKnowledge.createMany({
      data: batch.map(e => ({
        category: e.category,
        question: e.question,
        answer: e.answer,
        keywords: e.keywords.join(","),
        language: e.language,
        priority: e.priority,
        isActive: true,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });
    seeded += batch.length;
    process.stdout.write(`\r   Seeded: ${seeded}/${allEntries.length}`);
  }

  console.log(`\n✅ Database seeded: ${seeded} entries\n`);
  console.log("🎉 Done! AI Dataset built successfully.");

  await prisma.$disconnect();
}

main().catch(console.error);
