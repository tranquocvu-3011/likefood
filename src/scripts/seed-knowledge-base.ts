/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Script chạy seed Knowledge Base nâng cấp
 * Run: npx ts-node src/scripts/seed-knowledge-base.ts
 */

import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

interface ProductBenefit {
  productName: string;
  category: string;
  benefits: string[];
  usage: string[];
  storage: string[];
  nutrition: string;
  origin: string;
}

const PRODUCT_BENEFITS: Record<string, ProductBenefit> = {
  "xoài sấy": {
    productName: "Xoài sấy",
    category: "Trái cây sấy",
    benefits: [
      "Giàu vitamin A, C và chất chống oxy hóa, tốt cho mắt và da",
      "Chất xơ cao hỗ trợ tiêu hóa, giảm táo bón",
      "Hương vị ngọt tự nhiên, thơm ngon như tươi",
      "Tiện lợi mang theo, bảo quản lâu (6-12 tháng)",
      "Không chất bảo quản, 100% tự nhiên",
      "Giàu kali giúp cân bằng điện giải, tốt cho tim mạch",
    ],
    usage: [
      "Ăn trực tiếp như snack",
      "Pha trà hoặc làm nước uống",
      "Làm topping cho salad, yogurt",
      "Nấu chè, làm bánh",
    ],
    storage: [
      "Nơi khô ráo, thoáng mát",
      "Tránh ánh nắng trực tiếp",
      "Có thể bảo quản trong tủ lạnh",
    ],
    nutrition: "100g xoài sấy cung cấp khoảng 320 kcal, 3g chất xơ, vitamin A (20% DV)",
    origin: "Việt Nam, vùng Đồng bằng sông Cửu Long",
  },
  "mít sấy": {
    productName: "Mít sấy",
    category: "Trái cây sấy",
    benefits: [
      "Giàu vitamin C, chất chống oxy hóa tăng sức đề kháng",
      "Chất xơ cao giúp hệ tiêu hóa khỏe mạnh",
      "Hương thơm đặc trưng, vị ngọt thanh",
      "Không cholesterol, tốt cho tim mạch",
    ],
    usage: [
      "Ăn trực tiếp làm snack",
      "Làm topping cho bánh, kem, yogurt",
      "Pha trà mít sấy thơm ngon",
    ],
    storage: ["Bảo quản nơi khô ráo", "Tránh ẩm mốc"],
    nutrition: "100g mít sấy chứa khoảng 300 kcal, 2g protein, 3g chất xơ",
    origin: "Việt Nam, vùng miền Tây Nam Bộ",
  },
  "nho khô": {
    productName: "Nho khô",
    category: "Trái cây sấy",
    benefits: [
      "Giàu chất chống oxy hóa, chống lão hóa",
      "Chất sắt cao, tốt cho người thiếu máu",
      "Chất xơ giúp tiêu hóa tốt",
      "Chứa kali và magiê tốt cho tim mạch",
    ],
    usage: [
      "Ăn trực tiếp",
      "Làm topping oatmeal, yogurt",
      "Nấu bánh, làm bánh mì",
    ],
    storage: ["Đựng trong hộp kín", "Nơi mát, tránh ánh sáng"],
    nutrition: "100g nho khô cung cấp 300 kcal, 3g protein, 3g chất xơ",
    origin: "Nhập khẩu từ California, Mỹ hoặc Thổ Nhĩ Kỳ",
  },
  "cá khô": {
    productName: "Cá khô",
    category: "Hải sản khô",
    benefits: [
      "Protein cao, tốt cho cơ bắp và sức khỏe",
      "Giàu omega-3, tốt cho não bộ và tim mạch",
      "Canxi cao từ xương, tốt cho xương răng",
      "Vitamin D giúp hấp thụ canxi tốt hơn",
      "Ít calories, phù hợp người ăn kiêng",
    ],
    usage: [
      "Nấu canh chua (đặc biệt canh cá)",
      "Xào rau muống, rau cần",
      "Nướng ăn với cơm",
    ],
    storage: ["Nơi khô ráo, thoáng mát", "Tránh ánh nắng và ẩm"],
    nutrition: "100g cá khô: 250 kcal, 40g protein, omega-3, canxi",
    origin: "Việt Nam, đánh bắt từ biển Việt Nam",
  },
  "cá lóc khô": {
    productName: "Cá lóc khô",
    category: "Hải sản khô",
    benefits: [
      "Protein tinh khiết, ít mỡ",
      "Giàu omega-3 tốt cho não",
      "Thịt dai ngon, đặc trưng",
      "Không cholesterol xấu",
    ],
    usage: [
      "Nấu canh chua cá lóc (món đặc trưng miền Tây)",
      "Nướng than hoa",
      "Xào với rau",
    ],
    storage: ["Khô ráo", "Tránh ẩm", "Có thể đông lạnh"],
    nutrition: "100g cá lóc khô: 200 kcal, 45g protein",
    origin: "Việt Nam, nuôi hoặc đánh bắt tự nhiên",
  },
  "tôm khô": {
    productName: "Tôm khô",
    category: "Hải sản khô",
    benefits: [
      "Protein cao, dễ hấp thụ",
      "Canxi và khoáng chất từ vỏ",
      "Giàu kẽm tăng sức đề kháng",
      "Vitamin B12 tốt cho máu",
    ],
    usage: [
      "Nấu canh tôm (canh bầu, canh bí)",
      "Xào mì, xào noodle",
      "Làm topping phở",
    ],
    storage: ["Khô ráo", "Đậy kín", "Có thể bảo quản 6 tháng"],
    nutrition: "100g tôm khô: 300 kcal, 60g protein, canxi, kẽm",
    origin: "Việt Nam, vùng biển miền Trung và miền Tây",
  },
  "mực khô": {
    productName: "Mực khô",
    category: "Hải sản khô",
    benefits: [
      "Protein cực cao, ít chất béo",
      "Vitamin B12 và khoáng chất",
      "Giàu selen chống ung thư",
      "Taurine tốt cho tim mạch",
    ],
    usage: [
      "Nướng than hoa (mực nướng)",
      "Chiên giòn",
      "Xào với hành lá",
      "Ăn vặt với bia",
    ],
    storage: ["Nơi khô ráo", "Có thể bảo quản trong tủ lạnh"],
    nutrition: "100g mực khô: 290 kcal, 60g protein, vitamin B12",
    origin: "Việt Nam, đánh bắt từ biển",
  },
  "nước mắm": {
    productName: "Nước mắm",
    category: "Gia vị",
    benefits: [
      "Nguồn protein tự nhiên từ cá",
      "Axit amin tăng hương vị món ăn",
      "Giàu iốt tốt cho tuyến giáp",
      "Không chất bảo quản (loại cao cấp)",
    ],
    usage: [
      "Nước chấm phở, bún, cơm",
      "Kho thịt, rim",
      "Pha nước mắm chua ngọt",
    ],
    storage: ["Nơi khô ráo, tránh ánh nắng", "Đậy nắp kín"],
    nutrition: "1 muỗng nước mắm: 5 kcal, 1g protein, natri",
    origin: "Việt Nam, Phú Quốc, Nha Trang, Phan Thiết",
  },
  "trà sen": {
    productName: "Trà sen",
    category: "Trà",
    benefits: [
      "Hương thơm thanh tao đặc trưng hoa sen",
      "Thanh nhiệt, giải độc cơ thể",
      "An thần, giúp thư giãn",
      "Tốt cho giấc ngủ",
      "Chống oxy hóa, làm chậm lão hóa",
    ],
    usage: [
      "Pha với nước 70-80°C",
      "Ngâm 3-5 phút",
      "Thưởng thức nóng hoặc nguội",
    ],
    storage: ["Hộp kín, nơi mát", "Tránh ánh nắng", "Bảo quản 1-2 năm"],
    nutrition: "Hoa sen chứa vitamin C, B, flavonoid, không caffeine",
    origin: "Việt Nam, vùng Đồng bằng Bắc Bộ",
  },
  "trà xanh": {
    productName: "Trà xanh",
    category: "Trà",
    benefits: [
      "Chất chống oxy hóa EGCG mạnh nhất",
      "Tăng cường trao đổi chất",
      "Tốt cho tim mạch",
      "Giúp tập trung, tỉnh táo",
      "Giảm cân hiệu quả",
    ],
    usage: [
      "Pha với nước 70-80°C",
      "Ngâm 2-4 phút",
      "Có thể pha lại 2-3 lần",
    ],
    storage: ["Hộp kín", "Tối mát", "Bảo quản 1 năm"],
    nutrition: "100ml trà xanh: 1 kcal, EGCG, caffeine 20-45mg",
    origin: "Việt Nam, Đà Lạt, Lâm Đồng",
  },
  "cà phê rang xay": {
    productName: "Cà phê rang xay",
    category: "Cà phê",
    benefits: [
      "Caffeine tăng năng lượng, tỉnh táo",
      "Chất chống oxy hóa",
      "Tăng cường trao đổi chất",
      "Tốt cho trí não",
      "Giảm nguy cơ tiểu đường type 2",
    ],
    usage: [
      "Pha phin truyền thống",
      "Pha máy espresso",
      "Pha French press",
    ],
    storage: ["Hộp kín, tránh ánh sáng", "Dùng trong 2-4 tuần"],
    nutrition: "1 tách cà phê đen: 2-5 kcal, caffeine 80-120mg",
    origin: "Việt Nam, Tây Nguyên",
  },
  "khô bò": {
    productName: "Khô bò",
    category: "Thịt khô",
    benefits: [
      "Protein cực cao (60-70%)",
      "Tiện mang đi, bảo quản lâu",
      "Thay thế snack unhealthy",
      "Tốt cho người tập gym",
    ],
    usage: [
      "Ăn vặt",
      "Kèm bia, rượu",
      "Làm topping cơm",
    ],
    storage: ["Nơi khô ráo", "Có thể bảo quản 3-6 tháng"],
    nutrition: "100g: 300 kcal, 60g protein",
    origin: "Việt Nam, miền Tây",
  },
  "bánh pía": {
    productName: "Bánh pía",
    category: "Bánh",
    benefits: [
      "Bánh truyền thống miền Tây",
      "Vỏ bánh mềm, nhân đậu xanh ngọt bùi",
      "Tiện lợi, ăn được ngay",
    ],
    usage: [
      "Ăn trực tiếp",
      "Uống trà kèm",
    ],
    storage: ["Tủ lạnh", "Hạn sử dụng ngắn"],
    nutrition: "1 cái bánh: 200 kcal",
    origin: "Việt Nam, Sóc Trăng",
  },
  "mứt bí": {
    productName: "Mứt bí",
    category: "Mứt",
    benefits: [
      "Bí giàu vitamin A, C",
      "Chất xơ cao",
      "Tự nhiên, không chất bảo quản",
      "Vị ngọt thanh",
    ],
    usage: [
      "Ăn trực tiếp",
      "Kèm trà",
    ],
    storage: ["Tủ lạnh"],
    nutrition: "100g: 200 kcal",
    origin: "Việt Nam",
  },
  "hạt sen": {
    productName: "Hạt sen",
    category: "Hạt",
    benefits: [
      "An thần, giúp ngủ ngon",
      "Bổ khí, bổ huyết",
      "Tốt cho tim mạch",
      "Giàu protein",
    ],
    usage: [
      "Nấu chè",
      "Pha trà",
    ],
    storage: ["Nơi khô ráo"],
    nutrition: "100g: 350 kcal, 20g protein",
    origin: "Việt Nam",
  },
};

function generateQA(): Array<{
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  language: string;
  priority: number;
}> {
  const qaList: Array<{
    category: string;
    question: string;
    answer: string;
    keywords: string[];
    language: string;
    priority: number;
  }> = [];

  const benefitTemplates = {
    vi: {
      benefit: [
        "Lợi ích sức khỏe của {product} là gì?",
        "{product} có tốt cho sức khỏe không?",
        "Tại sao nên ăn {product}?",
        "Những ai nên ăn {product}?",
      ],
      usage: [
        "Cách sử dụng {product}?",
        "{product} dùng như thế nào?",
        "Món ngon từ {product}?",
      ],
      storage: [
        "Cách bảo quản {product}?",
        "{product} để được bao lâu?",
      ],
      nutrition: [
        "Giá trị dinh dưỡng của {product}?",
        "{product} có bao nhiêu calorie?",
      ],
      origin: [
        "{product} từ đâu?",
        "Nguồn gốc {product}?",
      ],
    },
    en: {
      benefit: [
        "What are the health benefits of {product}?",
        "Is {product} good for health?",
      ],
      usage: [
        "How to use {product}?",
        "What can I make with {product}?",
      ],
      storage: [
        "How to store {product}?",
      ],
      nutrition: [
        "Nutritional value of {product}?",
      ],
      origin: [
        "Where is {product} from?",
      ],
    },
  };

  // Generate for each product
  for (const [key, benefit] of Object.entries(PRODUCT_BENEFITS)) {
    const productName = benefit.productName;
    const normalizedKey = key.toLowerCase();

    // Vietnamese
    for (const q of benefitTemplates.vi.benefit) {
      qaList.push({
        category: "product",
        question: q.replace("{product}", productName),
        answer: `Về lợi ích sức khỏe của ${productName}: ${benefit.benefits.join(". ")}. Đây là sản phẩm chất lượng từ ${benefit.origin}.`,
        keywords: [normalizedKey, productName.toLowerCase(), "lợi ích", "sức khỏe"],
        language: "vi",
        priority: 9,
      });
    }
    for (const q of benefitTemplates.vi.usage) {
      qaList.push({
        category: "usage",
        question: q.replace("{product}", productName),
        answer: `${productName} có nhiều cách sử dụng: ${benefit.usage.join(". ")}.`,
        keywords: [normalizedKey, "cách dùng", "sử dụng"],
        language: "vi",
        priority: 8,
      });
    }
    for (const q of benefitTemplates.vi.storage) {
      qaList.push({
        category: "storage",
        question: q.replace("{product}", productName),
        answer: `Cách bảo quản ${productName}: ${benefit.storage.join(". ")}.`,
        keywords: [normalizedKey, "bảo quản"],
        language: "vi",
        priority: 8,
      });
    }
    for (const q of benefitTemplates.vi.nutrition) {
      qaList.push({
        category: "nutrition",
        question: q.replace("{product}", productName),
        answer: `Thông tin dinh dưỡng của ${productName}: ${benefit.nutrition}.`,
        keywords: [normalizedKey, "dinh dưỡng", "calorie"],
        language: "vi",
        priority: 8,
      });
    }
    for (const q of benefitTemplates.vi.origin) {
      qaList.push({
        category: "origin",
        question: q.replace("{product}", productName),
        answer: `Nguồn gốc ${productName}: ${benefit.origin}. LIKEFOOD nhập khẩu trực tiếp đảm bảo chất lượng.`,
        keywords: [normalizedKey, "nguồn gốc", "xuất xứ"],
        language: "vi",
        priority: 7,
      });
    }

    // English
    for (const q of benefitTemplates.en.benefit) {
      qaList.push({
        category: "product",
        question: q.replace("{product}", productName),
        answer: `Health benefits of ${productName}: ${benefit.benefits.join(". ")}. Quality product from ${benefit.origin}.`,
        keywords: [normalizedKey, "health", "benefits"],
        language: "en",
        priority: 9,
      });
    }
    for (const q of benefitTemplates.en.usage) {
      qaList.push({
        category: "usage",
        question: q.replace("{product}", productName),
        answer: `${productName} can be used: ${benefit.usage.join(". ")}.`,
        keywords: [normalizedKey, "use", "cook"],
        language: "en",
        priority: 8,
      });
    }
    for (const q of benefitTemplates.en.storage) {
      qaList.push({
        category: "storage",
        question: q.replace("{product}", productName),
        answer: `Storage: ${benefit.storage.join(". ")}.`,
        keywords: [normalizedKey, "store", "storage"],
        language: "en",
        priority: 8,
      });
    }
    for (const q of benefitTemplates.en.nutrition) {
      qaList.push({
        category: "nutrition",
        question: q.replace("{product}", productName),
        answer: `Nutrition: ${benefit.nutrition}.`,
        keywords: [normalizedKey, "nutrition", "calories"],
        language: "en",
        priority: 8,
      });
    }
    for (const q of benefitTemplates.en.origin) {
      qaList.push({
        category: "origin",
        question: q.replace("{product}", productName),
        answer: `Origin: ${benefit.origin}.`,
        keywords: [normalizedKey, "origin", "from"],
        language: "en",
        priority: 7,
      });
    }
  }

  // Add category questions
  const categories = [
    { name: "Trái cây sấy", keywords: ["xoài sấy", "mít sấy", "nho khô"] },
    { name: "Hải sản khô", keywords: ["cá khô", "tôm khô", "mực khô"] },
    { name: "Gia vị", keywords: ["nước mắm", "tương", "gia vị"] },
    { name: "Trà", keywords: ["trà sen", "trà xanh", "trà"] },
    { name: "Cà phê", keywords: ["cà phê rang xay", "cà phê"] },
  ];

  for (const cat of categories) {
    qaList.push({
      category: "product",
      question: `Có những sản phẩm ${cat.name} nào?`,
      answer: `LIKEFOOD có đa dạng sản phẩm ${cat.name} với nhiều mức giá và chất lượng.`,
      keywords: [cat.name.toLowerCase(), ...cat.keywords, "sản phẩm"],
      language: "vi",
      priority: 9,
    });
    qaList.push({
      category: "product",
      question: `What ${cat.name} products do you have?`,
      answer: `LIKEFOOD offers a variety of ${cat.name} products at different prices and quality levels.`,
      keywords: [cat.name.toLowerCase(), ...cat.keywords, "product"],
      language: "en",
      priority: 9,
    });
  }

  // Add comparison questions
  qaList.push({
    category: "product",
    question: "Nên chọn trái cây sấy hay hải sản khô?",
    answer: "Tùy vào nhu cầu: Trái cây sấy ngọt tự nhiên, giàu vitamin. Hải sản khô giàu protein, tốt cho cơ bắp.",
    keywords: ["so sánh", "trái cây sấy", "hải sản khô"],
    language: "vi",
    priority: 8,
  });
  qaList.push({
    category: "product",
    question: "Trà hay cà phê tốt hơn cho sức khỏe?",
    answer: "Cả hai đều có lợi: Trà giàu chất chống oxy hóa, ít caffeine. Cà phê tăng năng lượng, tỉnh táo.",
    keywords: ["trà", "cà phê", "so sánh"],
    language: "vi",
    priority: 8,
  });

  // Add lifestyle questions
  const dietQuestions = [
    { q: "Có sản phẩm nào cho người ăn chay không?", a: "Có: trà, cà phê, gia vị, bánh, mứt, hoa quả sấy, hạt.", kw: ["chay", "vegetarian"] },
    { q: "Sản phẩm nào tốt cho người giảm cân?", a: "Trà xanh, trà atiso, cá khô, tôm khô, hoa quả sấy (không đường).", kw: ["giảm cân", "diet"] },
    { q: "What vegetarian products do you have?", a: "Tea, coffee, spices, candies, dried fruits, nuts.", kw: ["vegetarian", "vegan"] },
  ];
  for (const d of dietQuestions) {
    qaList.push({
      category: "nutrition",
      question: d.q,
      answer: d.a,
      keywords: d.kw,
      language: d.q.startsWith("What") ? "en" : "vi",
      priority: 9,
    });
  }

  // Add gifting questions
  qaList.push({
    category: "gift",
    question: "Quà biếu Tết nên chọn gì?",
    answer: "Combo quà Tết LIKEFOOD: set trà + bánh, hải sản + gia vị, hộp cao cấp. Giá $29-$199.",
    keywords: ["quà Tết", "tet", "biếu"],
    language: "vi",
    priority: 9,
  });
  qaList.push({
    category: "gift",
    question: "What gift for Vietnamese people?",
    answer: "Specialty items like lotus tea, Vietnamese coffee, premium fish sauce are great gifts.",
    keywords: ["gift", "vietnamese"],
    language: "en",
    priority: 9,
  });

  return qaList;
}

async function main() {
  console.log("🚀 Bắt đầu seed Knowledge Base...");

  const qaList = generateQA();
  console.log(`📝 Đã tạo ${qaList.length} câu hỏi-câu trả lời`);

  let successCount = 0;
  let errorCount = 0;

  for (const qa of qaList) {
    try {
      await prisma.aiKnowledge.create({
        data: {
          id: Number(crypto.randomUUID()),
          category: qa.category,
          question: qa.question,
          answer: qa.answer,
          keywords: qa.keywords.join(","),
          language: qa.language,
          priority: qa.priority,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }

  console.log(`\n🎉 Hoàn thành!`);
  console.log(`✅ Thành công: ${successCount} items`);
  console.log(`❌ Lỗi: ${errorCount} items`);

  const totalCount = await prisma.aiKnowledge.count();
  console.log(`📈 Tổng số records trong database: ${totalCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
