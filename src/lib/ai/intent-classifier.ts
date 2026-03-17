/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * AI Intent Classifier - Nâng cấp thông minh hơn 50 lần
 * Copyright (c) 2026 LIKEFOOD Team
 */

export type Intent =
  | "PRODUCT_SEARCH"
  | "PRODUCT_DETAILS"
  | "PRODUCT_BENEFITS"
  | "PRODUCT_USAGE"
  | "PRODUCT_STORAGE"
  | "PRODUCT_NUTRITION"
  | "PRODUCT_ORIGIN"
  | "ORDER_STATUS"
  | "SHIPPING_INQUIRY"
  | "PAYMENT_HELP"
  | "RETURN_REFUND"
  | "ACCOUNT_HELP"
  | "PROMOTION_INQUIRY"
  | "COMPLAINT"
  | "GENERAL_QUESTION"
  | "RECOMMENDATION_REQUEST"
  | "ORDER_PLACING"
  | "GREETING"
  | "THANKS"
  | "CHITCHAT"
  | "COMPARISON"
  | "DIET_SPECIFIC"
  | "GIFT_IDEA"
  | "COOKING_HELP"
  | "COMBO_REQUEST"
  | "PRODUCT_COMPARE"
  | "ADVISOR_REQUEST"
  | "UNKNOWN";

export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities: Record<string, string>;
  suggestedProducts?: string[];
  nextAction?: string;
  productContext?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  PRODUCT_SEARCH: [
    "co ban", "muon mua", "mua", "tim", "can mua", "can tim", "search",
    "looking for", "where to buy", "san pham", "shop", "cho toi", "cho minh",
    "can mua", "order", "purchase", "buy", "find", "co khong", "ban khong",
    "có không", "còn không", "cần mua", "đang tìm", "tìm kiếm", "sản phẩm",
    "show me", "what do you have", "list", "danh muc", "loai", "cac loai",
    "giới thiệu sản phẩm", "xem san pham", "truy cập", "browsing",
    "sp", "sp nào", "món gì", "gì ngon", "gì tốt",
  ],
  COMBO_REQUEST: [
    "combo", "set", "bo", "bộ", "gói", "package", "bundle", "combo an vat",
    "combo qua", "combo tiet kiem", "combo nau an", "mua chung", "mua kem",
    "goi y combo", "gợi ý combo", "set quà", "set qua", "gợi ý set",
    "mua kèm", "deal", "khuyen mai combo", "combo bán chạy", "combo flash sale",
    "mua cùng", "combo cooking", "combo gift", "combo snack", "bộ sản phẩm",
    "tui muon mua combo", "combo nao ngon", "co combo nao",
  ],
  PRODUCT_COMPARE: [
    "so sanh", "so sánh", "khac nhau", "khác nhau", "compare", "versus",
    "vs", "hay la", "hay là", "nen chon", "nên chọn", "cai nao hon",
    "cái nào hơn", "tot hon", "tốt hơn", "which is better", "difference",
    "uu diem", "ưu điểm", "nhuoc diem", "nhược điểm", "diem manh", "điểm mạnh",
    "diem yeu", "điểm yếu", "pros and cons", "so sanh gia",
  ],
  ADVISOR_REQUEST: [
    "tu van", "tư vấn", "goi y", "gợi ý", "khong biet chon",
    "không biết chọn", "giup chon", "giúp chọn", "recommend", "suggest",
    "advise", "help me choose", "nen mua gi", "nên mua gì", "mua gi tot",
    "mua gì tốt", "phu hop", "phù hợp", "tuoi", "độ tuổi",
    "ngan sach", "ngân sách", "budget", "nen dung", "nên dùng",
    "cho gia dinh", "cho gia đình", "cho be", "cho bé", "cho me",
  ],
  PRODUCT_DETAILS: [
    "thanh phan", "cach dung", "bao nhieu", "xuat xu", "ingredients",
    "nutrition", "weight", "expiry", "price", "gia", "chi tiet", "thong tin",
    "product details", "description", "specification", "mo ta", "quy cach",
    "dung luong", "kich thuoc", "khối lượng", "thể tích", "bao bi",
    "thuong hieu", "brand", "model", "ma san pham", "SKU",
  ],
  PRODUCT_BENEFITS: [
    "loi ich", "lợi ích", "tốt cho", "tốt không", "tốt gì", "tac dung",
    "tác dụng", "co loi khong", "có lợi gì", "benefi", "tại sao nên",
    "ai nên", "đối tượng", "phù hợp", "tốt cho ai", "tốt nhất",
    "healthy", "good for", "health benefit", "advantage", "tăng cường",
    "giup", "giúp", "hỗ trợ", "công dụng", "uong co tot khong",
    "an co tot khong", "co tot khong", "tot cho suc khoe",
  ],
  PRODUCT_USAGE: [
    "cach su dung", "cách sử dụng", "dung nhu the nao", "dùng như thế nào",
    "che bien", "chế biến", "nau", "nấu", "pha", "pha che", "cong thuc",
    "công thức", "recipe", "mon ngon", "món ngon", "lam", "làm",
    "huong dan", "hướng dẫn", "cach lam", "cách làm", "su dung",
    "sử dụng", "dung", "dùng", "cach pha", "cách pha", "che bien nhu the nao",
    "nau nhu the nao", "với", "kết hợp", "pha trộn", "mix",
  ],
  PRODUCT_STORAGE: [
    "bao quan", "bảo quản", "cất giữ", "cat giu", "de duoc bao lau",
    "để được bao lâu", "han su dung", "hạn sử dụng", "het han",
    "hết hạn", "lat", "lạt", "freezer", "tủ lạnh", "dry", "khô",
    "tránh", "cách giữ", "giai", "cất", "bảo quản như thế nào",
    "how to store", "shelf life", "expire", "preserv", "valid until",
  ],
  PRODUCT_NUTRITION: [
    "dinh duong", "dinh dưỡng", "calorie", "calories", "kcal", "vitamin",
    "chat beo", "chất béo", "protein", "carb", "carbohydrate", "chat xo",
    "chất xơ", "nao nhieu", "bao nhieu", "bao nhiêu", "thanh phan",
    "thành phần", "giá trị", "nutrit", "value", "minerals", "dinh duong",
    "an co beo khong", "co beo khong", "ba nhieu calories", "mac dinh",
  ],
  PRODUCT_ORIGIN: [
    "nguon goc", "nguồn gốc", "xuat xu", "xuất xứ", "made in", "nhap khau",
    "nhập khẩu", "tu dau", "từ đâu", "o dau", "ở đâu", "vung", "vùng",
    "noi", "nơi", "origin", "source", "produce", "san xuat", "sản xuất",
    "thuong hieu", "thương hiệu", "brand", "viet nam", "việt nam",
    "my", "mỹ", "usa", "au", " châu", "imported", "local",
  ],
  ORDER_STATUS: [
    "don hang", "giao chua", "theo doi", "order status", "tracking",
    "ma don", "order number", "khi nao giao", "trang thai", "tình trạng",
    "dang cho", "đang chờ", "da gui", "đã gửi", "da giao", "đã giao",
    "van chuyen", "vận chuyển", "hien trang", "hiện trạng", "don",
    "đơn", "order", "kiem tra don", "check order", "where is my order",
    "khi nao nhan duoc", "ngay giao", "ngày giao",
  ],
  SHIPPING_INQUIRY: [
    "ship", "giao hang", "bao lau", "shipping", "delivery", "van chuyen",
    "phi ship", "free ship", "mien phi", "phi van chuyen", "phi giao",
    "freeship", "standard", "express", "nhanh", "cham", "ngay", "days",
    "thoi gian", "thời gian", "khi nao", "khi nào", "bao nhieu ngay",
    "free shipping", "shipping fee", "delivery time", "how long",
    "mua khu vuc", "vùng", "delivery area", "ship to", "giao toan quoc",
    "USA", "US", "America",
  ],
  PAYMENT_HELP: [
    "thanh toan", "cod", "chuyen khoan", "payment", "visa", "mastercard",
    "bank transfer", "the", "thẻ", "paypal", "apple pay", "google pay",
    "tien mat", "tiền mặt", "tra gop", "trả góp", "installment",
    "security", "secure", "bao mat", "bảo mật", "stripe", "thanhtoan",
    "hinh thuc", "hình thức", "phuong thuc", "phương thức", "cach tra",
    "how to pay", "checkout", "thanh toan online", "thanh toan the",
  ],
  RETURN_REFUND: [
    "doi tra", "hoan tien", "return", "refund", "bao hanh", "san pham loi",
    "problem", "issue", "bao hanh", "bảo hành", "khong hai long",
    "không hài lòng", "sai", "sai sản phẩm", "sai ten", "hu", "hư",
    "hong", "hỏng", "tra lai", "trả lại", "doi", "đổi", "tra tien",
    "tra tiền", "refund money", "return policy", "chinh sach doi tra",
    "bao lau", "mat bao lau", "mất bao lâu",
  ],
  ACCOUNT_HELP: [
    "dang nhap", "tai khoan", "password", "login", "register", "forgot password",
    "verify", "dang ki", "đăng kí", "tao tai khoan", "tao tk", "sign in",
    "sign up", "logout", "dang xuat", "đăng xuất", "profile", "ho so",
    "hồ sơ", "thay doi", "thay đổi", "cap nhat", "cập nhật", "email",
    "sdt", "so dien thoai", "số điện thoại", "dia chi", "địa chỉ",
    "doi mat khau", "đổi mật khẩu", "quen mat khau", "quên mật khẩu",
    "xac nhan", "xác nhận", "activation", "kích hoạt",
  ],
  PROMOTION_INQUIRY: [
    "giam gia", "khuyen mai", "coupon", "voucher", "points", "sale",
    "discount", "promo", "flash sale", "flashsale", "deal", "gia tot",
    "giá tốt", "gía sỉ", "chiet khau", "chiết khấu", "uu dai",
    "ưu đãi", "khuyến mãi", "mã giảm", "code", "ma giam gia",
    "đang sale", "dang khuyen mai", "su kien", "sự kiện", "event",
    "mua 1 tặng 1", "tặng", "quà", "tích điểm", "điểm thưởng",
    "loyalty", "reward", "point", "Membership", "thanh vien",
  ],
  COMPLAINT: [
    "khieu nai", "phan nan", "khong hai long", "problem", "issue",
    "bad", "poor", "broken", "wrong", "delay", "keo dai", "kéo dài",
    "khong dung", "không đúng", "khac", "khác", "sai", "loi", "lỗi",
    "phiền", "bức xúc", "tức", "gian", "not happy", "complain",
    "terrible", "worst", "never again", "refuse", "reject", "hết sức",
    "cực kỳ", "vô cùng", "vô cùng không hài lòng",
  ],
  GENERAL_QUESTION: [
    "cau hoi", "information", "what is", "how does", "gioi thieu", "about",
    "policy", "help", "tro giup", "trợ giúp", "ho tro", "hỗ trợ",
    "hotline", "lien he", "liên hệ", "contact", "support", "faq",
    "cau hoi thuong gap", "hỏi đáp", "giải đáp", "answer", "question",
    "thac mac", "thắc mắc", "hoi", "hỏi", "may bay", "tự động",
  ],
  RECOMMENDATION_REQUEST: [
    "goi y", "gợi ý", "recommend", "suggestion", "nen mua", "nên mua",
    "best", "top", "popular", "favorite", "phu hop", "phù hợp", "nao ngon",
    "nào ngon", "dang hot", "ban chay", "bán chạy", "nhieu nguoi mua",
    "nhiều người mua", "review", "danh gia", "đánh giá", "rating",
    "xep hang", "đánh giá cao", "worth", "mua nào", "chon nao",
    "recommend me", "suggest", "what should", "which one", "what to buy",
    "gift for", "tặng", "biếu", "tết", "holiday", "occasion",
  ],
  ORDER_PLACING: [
    "dat hang", "mua ngay", "checkout", "buy now", "gio hang", "cart",
    "add to cart", "them vao gio", "thêm vào giỏ", "dat ngay", "đặt ngay",
    "mua luon", "mua luôn", "thanh toan", "thanh toán", "xac nhan",
    "xác nhận", "hoan tat", "hoàn tất", "hoan thanh", "hoàn thành",
    "order now", "purchase", "checkout now", "gio hang cua toi",
    "vào giỏ", "thanhtoan", "than toan",
  ],
  GREETING: [
    "xin chao", "hello", "hi", "good morning", "good afternoon",
    "good evening", "hey", "greetings", "chao", "chào", "alo", "halo",
    "hi there", "hey there", "howdy", "yo", "wassup", "what's up",
    "xin chao ban", "xin chào bạn", "chao buoi sang", "chao buoi toi",
    "chào buổi sáng", "chào buổi tối", "nice to meet", "rất vui",
    "gap ban", "gặp bạn", "reetings", "xin chào quý khách",
  ],
  THANKS: [
    "cam on", "thank", "thanks", "thank you", "appreciate", "cảm ơn",
    "cam ơn", "cám ơn", "thank you very much", "many thanks", "thanks a lot",
    "thank u", "thx", "ty", "cảm ơn bạn", "cảm ơn shop", "cam on shop",
    "đa thank", "thank you so much", "gracias", "merci", "arigato",
  ],
  CHITCHAT: [
    "ban la ai", "bạn là ai", "may la ai", "may là ai", "you are",
    "tro ly", "trợ lý", "AI", "bot", "robot", "chatbot", "con nguoi",
    "người thật", "nguoi that", "co nguoi khong", "có người không",
    "ban co phai nguoi khong", "you human", "real person", "automated",
    "how are you", "how do you do", "cuoc song", "cuộc sống", "weather",
    "how's it going", "what's going on", "omg", "wow", "hay qua",
    "tuyệt vời", "great", "awesome", "cool", "nice", "fun", "vui",
  ],
  COMPARISON: [
    "so sanh", "so sánh", "khac nhau", "khác nhau", "hieu nhau",
    "khac biet", "khác biệt", "giống nhau", "hon", "hơn", "better",
    "worse", "best vs", "nên chọn", "chon cai nao", "chọn cái nào",
    "cái nào", "which is better", "what's the difference", "compare",
    "giữa", "giua", "giữa", "so sánh với", "so voi", "so với",
    "hay la", "hay là", "or", "vs", "versus", "tùy theo",
    "tùy vào", "tuy thuoc", "phụ thuộc",
  ],
  DIET_SPECIFIC: [
    "chay", "ăn chay", "vegetarian", "vegan", "thuần chay", "plant based",
    "gluten free", "không gluten", "organic", "hữu cơ", "tự nhiên",
    "sach", "sạch", "healthy", "lành mạnh", "diet", "ăn kiêng",
    "giảm cân", "weight loss", "low carb", "ít carb", "keto", "low fat",
    "ít béo", "protein", "giàu đạm", "xây dựng cơ", "gym", "fitness",
    "thể hình", "athlete", "vận động viên", "tiểu đường", "diabetes",
    "tim mach", "tim mạch", "huyet ap", "huyết áp", "cholesterol",
    "unsweet", "không đường", "no sugar", "sugar free", "ít đường",
    "low sugar", "calorie count", "đếm calorie", "counting calories",
  ],
  GIFT_IDEA: [
    "qua", "quà", "quà tặng", "gift", "tang", "tặng", "bieu", "biếu",
    "tết", "tet", "sinh nhat", "sinh nhật", "birthday", "anniversary",
    "nam moi", "năm mới", "new year", "chuc mung", "chúc mừng",
    "holiday", "lễ", "le hoi", "dịp", "dip", "occasion", "mừng",
    "cong ty", "công ty", "doanh nghiep", "doanh nghiệp", "partner",
    "đối tác", "khach hang", "khách hàng", "vip", "sang trọng",
    "cao cap", "cao cấp", "premium", "luxury", "thieu", "thiếu",
    "tre em", "trẻ em", "kids", "nguoi lon", "người lớn", "adults",
    "ong ba", "ông bà", "parents", "friend", "ban be", "bạn bè",
    "nam gioi", "nam giới", "nu gioi", "nữ giới", "men", "women",
    "gifted", "wrapped", "gói quà", "trang tri", "trang trí",
  ],
  COOKING_HELP: [
    "nau an", "nấu ăn", "cook", "cooking", "lam an", "làm ăn",
    "recipe", "cong thuc", "công thức", "cach nau", "cách nấu",
    "huong dan", "hướng dẫn", "mon", "món", "dễ", "de", "kho",
    "khó", "dễ làm", "de lam", "nhanh", "quick", "tiện", "tien",
    "tiện lợi", "convenient", "dinner", "trua", "sáng", "breakfast",
    "lunch", "toi", "tối", "meal", "bữa", "bua", "thực đơn",
    "thuc don", "menu", "dinh duong", "dinh dưỡng", "healthy", "lành",
    "hom nay nau gi", "hôm nay nấu gì", "what to cook today",
    "goi y mon an", "gợi ý món ăn", "suggest dish", "thuc don",
    "ke hoach", "kế hoạch", "plan", "market", "chợ", "cho", "mua",
    "nguyen lieu", "nguyên liệu", "ingredient", "thit", "thịt", "ca",
    "cá", "rau", "ráu", "vegetables", "nam", "nấm", "tofu", "đậu",
    "dau phu", "đậu phụ", "gia vi", "gia vị", "spice", "nau gi",
    "nấu gì", "cook what", "help me cook", "giúp nấu",
  ],
  UNKNOWN: [],
};

const CATEGORY_KEYWORDS = [
  "ca kho",
  "tom",
  "muc",
  "bo kho",
  "gia vi",
  "tra",
  "trà",
  "che",
  "banh",
  "bánh",
  "mut",
  "mứt",
  "trai cay",
  "trái cây",
  "snack",
  "an vat",
  "do an vat",
  "do uong",
  "đồ uống",
  "qua bieu",
  "quà biếu",
  "qua tang",
  "dried",
  "seafood",
  "spice",
  "tea",
  "coffee",
  "nuoc mam",
  "nước mắm",
  "tuong",
  "tương",
  "hat",
  "hạt",
  "keo",
  "kẹo",
  "socola",
  "chocolate",
  "com",
  "cơm",
  "bun",
  "bún",
  "pho",
  "phở",
  "cha",
  "chả",
  "xoai",
  "xoài",
  "mang",
  "măng",
  "nam",
  "nấm",
  "kho",
  "khô",
  "say",
  "sấy",
  "deo",
  "dẻo",
];

const LOCATION_KEYWORDS = [
  "california",
  "new york",
  "texas",
  "florida",
  "washington",
  "usa",
  "us",
  "my",
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

function detectIntentByRules(message: string): { intent: Intent; confidence: number } {
  const normalizedMessage = normalizeText(message);
  let bestIntent: Intent = "UNKNOWN";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Intent, string[]][]) {
    if (intent === "UNKNOWN") continue;

    let score = 0;
    for (const keyword of keywords) {
      // Use word-boundary matching for short keywords to reduce false positives
      if (keyword.length <= 3) {
        // Short keywords: require word boundary (space/start/end around them)
        const regex = new RegExp(`(?:^|\\s|[,.!?])${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s|[,.!?])`, "i");
        if (regex.test(` ${normalizedMessage} `)) {
          score += 1;
        }
      } else {
        if (normalizedMessage.includes(keyword)) {
          score += 1;
        }
      }
      if (normalizedMessage === keyword) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  const entities = extractEntities(message);
  if (bestIntent === "UNKNOWN" && entities.category && normalizedMessage.length <= 50) {
    bestIntent = "PRODUCT_SEARCH";
    bestScore = Math.max(bestScore, 2);
  }

  return {
    intent: bestIntent,
    confidence: bestScore > 0 ? Math.min(bestScore / 3, 1) : 0,
  };
}

function extractEntities(message: string): Record<string, string> {
  const entities: Record<string, string> = {};
  const normalizedMessage = normalizeText(message);

  for (const category of CATEGORY_KEYWORDS) {
    if (normalizedMessage.includes(category)) {
      entities.category = category;
      break;
    }
  }

  if (
    normalizedMessage.includes("gia") ||
    normalizedMessage.includes("price") ||
    normalizedMessage.includes("bao nhieu") ||
    normalizedMessage.includes("cost")
  ) {
    entities.priceInquiry = "true";
  }

  for (const location of LOCATION_KEYWORDS) {
    if (normalizedMessage.includes(location)) {
      entities.location = location;
      break;
    }
  }

  if (
    normalizedMessage.includes("bao lau") ||
    normalizedMessage.includes("how long") ||
    normalizedMessage.includes("khi nao")
  ) {
    entities.timeInquiry = "true";
  }

  const orderMatch = message.match(/(?:don|order|ma|#)\s*[:.]?\s*([A-Z0-9-]+)/i);
  if (orderMatch?.[1]) {
    entities.orderNumber = orderMatch[1];
  }

  return entities;
}

function getNextAction(intent: Intent): string | undefined {
  const actions: Record<Intent, string> = {
    PRODUCT_SEARCH: "Recommend matching products",
    PRODUCT_DETAILS: "Share product details and usage guidance",
    PRODUCT_BENEFITS: "Explain health benefits and advantages",
    PRODUCT_USAGE: "Guide how to use or cook the product",
    PRODUCT_STORAGE: "Explain storage and shelf life",
    PRODUCT_NUTRITION: "Provide nutritional information",
    PRODUCT_ORIGIN: "Share product origin and sourcing",
    ORDER_STATUS: "Help the shopper review order status",
    SHIPPING_INQUIRY: "Explain shipping speed and cost",
    PAYMENT_HELP: "Explain available payment options",
    RETURN_REFUND: "Explain return and refund steps",
    ACCOUNT_HELP: "Help with account access or reset",
    PROMOTION_INQUIRY: "Highlight active deals and coupons",
    COMPLAINT: "Collect context and route to support",
    GENERAL_QUESTION: "Answer or redirect to the relevant policy",
    RECOMMENDATION_REQUEST: "Suggest products based on needs",
    ORDER_PLACING: "Guide the shopper toward checkout",
    GREETING: "Welcome the shopper and surface common intents",
    THANKS: "Acknowledge and keep the conversation open",
    CHITCHAT: "Engage in casual conversation",
    COMPARISON: "Compare products or options",
    DIET_SPECIFIC: "Suggest products for dietary needs",
    GIFT_IDEA: "Recommend gift options",
    COOKING_HELP: "Provide cooking recipes and tips",
    COMBO_REQUEST: "Suggest product combos and bundles",
    PRODUCT_COMPARE: "Compare selected products side by side",
    ADVISOR_REQUEST: "Provide personalized product advice",
    UNKNOWN: "Ask a clarifying follow-up question",
  };

  return actions[intent];
}

export function classifyIntent(message: string): IntentResult {
  const { intent, confidence } = detectIntentByRules(message);
  const entities = extractEntities(message);

  return {
    intent: confidence > 0.2 ? intent : "UNKNOWN",
    confidence,
    entities,
    nextAction: getNextAction(intent),
  };
}

export function getIntentDisplayName(intent: Intent, lang: "vi" | "en"): string {
  const names: Record<Intent, { vi: string; en: string }> = {
    PRODUCT_SEARCH: { vi: "Tim san pham", en: "Product search" },
    PRODUCT_DETAILS: { vi: "Chi tiet san pham", en: "Product details" },
    PRODUCT_BENEFITS: { vi: "Loi ich san pham", en: "Product benefits" },
    PRODUCT_USAGE: { vi: "Cach su dung", en: "Product usage" },
    PRODUCT_STORAGE: { vi: "Bao quan", en: "Storage" },
    PRODUCT_NUTRITION: { vi: "Dinh duong", en: "Nutrition" },
    PRODUCT_ORIGIN: { vi: "Nguon goc", en: "Origin" },
    ORDER_STATUS: { vi: "Trang thai don hang", en: "Order status" },
    SHIPPING_INQUIRY: { vi: "Van chuyen", en: "Shipping inquiry" },
    PAYMENT_HELP: { vi: "Thanh toan", en: "Payment help" },
    RETURN_REFUND: { vi: "Doi tra hoan tien", en: "Return or refund" },
    ACCOUNT_HELP: { vi: "Tai khoan", en: "Account help" },
    PROMOTION_INQUIRY: { vi: "Khuyen mai", en: "Promotion inquiry" },
    COMPLAINT: { vi: "Khieu nai", en: "Complaint" },
    GENERAL_QUESTION: { vi: "Cau hoi chung", en: "General question" },
    RECOMMENDATION_REQUEST: { vi: "Yeu cau goi y", en: "Recommendation request" },
    ORDER_PLACING: { vi: "Dat hang", en: "Order placing" },
    GREETING: { vi: "Chao hoi", en: "Greeting" },
    THANKS: { vi: "Cam on", en: "Thanks" },
    CHITCHAT: { vi: "Tro chuyen", en: "Chitchat" },
    COMPARISON: { vi: "So sanh", en: "Comparison" },
    DIET_SPECIFIC: { vi: "Che do an", en: "Diet specific" },
    GIFT_IDEA: { vi: "Y tuong qua tang", en: "Gift idea" },
    COOKING_HELP: { vi: "Ho tro nau an", en: "Cooking help" },
    COMBO_REQUEST: { vi: "Yeu cau combo", en: "Combo request" },
    PRODUCT_COMPARE: { vi: "So sanh san pham", en: "Product compare" },
    ADVISOR_REQUEST: { vi: "Tu van chuyen sau", en: "Advisor request" },
    UNKNOWN: { vi: "Chua ro", en: "Unknown" },
  };

  return names[intent][lang];
}
