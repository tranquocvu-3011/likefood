"use server";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * AI Product Analysis Service — ChatGPT
 * Phân tích chi tiết từng sản phẩm
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { callGPTJSON } from "@/lib/ai/ai-provider";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface ProductAnalysis {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: number;
  salePrice?: number | null;
  analysis: {
    benefits: string[];
    usage: string[];
    storage: string[];
    nutrition: string[];
    origin: string[];
    comparisons: string[];
    pairings: string[];
    occasions: string[];
    targetAudience: string[];
    keywords: string[];
  };
  marketing: {
    shortDescription: string;
    highlights: string[];
    seoTitle: string;
    seoDescription: string;
    tags: string[];
  };
  recommendations: {
    relatedProducts: string[];
    complementaryProducts: string[];
    similarProducts: string[];
  };
}

export interface ProductWithDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number | null;
  saleStartAt?: Date | null;
  saleEndAt?: Date | null;
  category: string;
  categoryId?: string | null;
  brandId?: string | null;
  tags?: string | null;
  image?: string | null;
  inventory: number;
  soldCount: number;
  ratingAvg?: number;
  ratingCount?: number;
  weight?: string | null;
  code?: string | null;
  badgeText?: string | null;
  isOnSale?: boolean;
  featured?: boolean;
  isVisible?: boolean;
  originalPrice?: number | null;
}

const CATEGORY_ANALYSIS: Record<string, {
  benefits: string[];
  usage: string[];
  storage: string[];
  origin: string[];
  pairings: string[];
  occasions: string[];
  targetAudience: string[];
}> = {
  "Trà": {
    benefits: ["Thanh nhiệt", "An thần", "Giảm stress", "Chống oxy hóa", "Tốt cho tiêu hóa", "Làm đẹp da", "Hỗ trợ giảm cân"],
    usage: ["Pha với nước 80-90°C", "Ngâm 3-5 phút", "Pha với đá (trà đá)", "Pha với sữa (trà sữa)", "Hãm với hoa cúc", "Pha với gừng"],
    storage: ["Nơi khô ráo", "Tránh ánh nắng", "Đậy kín sau khi mở", "Không bảo quản tủ lạnh", "Hộp kín", "Tránh mùi lạ"],
    origin: ["Việt Nam", "Trà sen Tây Hồ", "Trà lài Hà Nội", "Trà xanh Thanh Hóa", "Trà olong Đà Lạt", "Trà atiso Đà Lạt"],
    pairings: ["Bánh gai", "Bánh pía", "Kẹo lạc", "Hoa quả sấy", "Bánh gối", "Snack"],
    occasions: ["Sáng sớm", "Chiều mưa", "Tiếp khách", "Quà biếu", "Tết", "Lễ hội"],
    targetAudience: ["Người cao tuổi", "Dân văn phòng", "Người yêu trà đạo", "Người ăn chay", "Du khách"]
  },
  "Cà phê": {
    benefits: ["Tỉnh táo", "Tăng năng lượng", "Chống oxy hóa", "Tăng cường trí nhớ", "Đốt cháy mỡ", "Tốt cho tim", "Giảm nguy cơ tiểu đường"],
    usage: ["Pha phin", "Pha máy espresso", "Pha cold brew", "Pha sữa đá", "Pha cà phê đen", "Pha với bột"],
    storage: ["Hộp kín", "Tránh ánh sáng", "Tránh không khí", "Nơi mát", "Dùng trong 2-4 tuần", "Không để tủ lạnh"],
    origin: ["Việt Nam", "Cà phê Buôn Ma Thuột", "Cà phê Đà Lạt", "Cà phê Cầu Đất", "Robusta Việt Nam", "Arabica Đà Lạt"],
    pairings: ["Bánh mì", "Bánh gai", "Trứng muối", "Kẹo lạc", "Bánh gối", "Chè"],
    occasions: ["Sáng sớm", "Buổi chiều", "Làm việc", "Gặp gỡ bạn bè", "Quà biếu", "Tết"],
    targetAudience: ["Dân văn phòng", "Người yêu cà phê", "Người cao tuổi", "Doanh nhân", "Du khách"]
  },
  "Cá khô": {
    benefits: ["Giàu protein", "Giàu canxi", "Giàu omega-3", "Ít chất béo", "Bảo quản lâu", "Tiện lợi", "Nguồn khoáng chất"],
    usage: ["Chiên giòn", "Nấu canh chua", "Nướng", "Xào rau", "Kho tiêu", "Nấu lẩu", "Làm gỏi"],
    storage: ["Nơi khô ráo", "Hộp kín", "Tránh ẩm", "Có thể đông lạnh", "Tránh côn trùng", "12 tháng"],
    origin: ["Việt Nam", "Cá lóc Nam Bộ", "Cá sặc Miền Tây", "Cá thu Phú Quốc", "Cá nục Nha Trang", "Cá ngừ Phú Yên"],
    pairings: ["Cơm trắng", "Rau muống", "Canh chua", "Bún", "Miến", "Cháo"],
    occasions: ["Bữa cơm gia đình", "Tiếp khách", "Món nhậu", "Lễ hội", "Quà biếu"],
    targetAudience: ["Người nội trợ", "Đầu bếp", "Người thích nấu ăn", "Gia đình Việt", "Người mua quà"]
  },
  "Tôm khô": {
    benefits: ["Giàu protein", "Giàu canxi", "Giàu vitamin B12", "Tăng cường miễn dịch", "Tốt cho xương", "Năng lượng cao", "Hương vị đậm đà"],
    usage: ["Nấu canh", "Xào rau", "Chiên", "Nướng", "Làm gỏi", "Kho thịt", "Pha nước dùng"],
    storage: ["Nơi khô ráo", "Hộp kín", "Tránh ẩm", "Có thể đông lạnh", "Tránh côn trùng", "12 tháng"],
    origin: ["Việt Nam", "Tôm khô Phú Quốc", "Tôm sú Khánh Hòa", "Tôm đất Miền Tây", "Tôm hùm Bình Định"],
    pairings: ["Canh chua", "Cơm trắng", "Mì xào", "Bún", "Rau muống", "Miến"],
    occasions: ["Bữa cơm", "Tiếp khách", "Món nhậu", "Nấu canh", "Quà biếu"],
    targetAudience: ["Người nội trợ", "Đầu bếp", "Người thích hải sản", "Gia đình Việt"]
  },
  "Mực khô": {
    benefits: ["Giàu protein", "Ít chất béo", "Giàu khoáng", "Vitamin B6", "Tốt cho não", "Hương vị ngọt", "Dễ bảo quản"],
    usage: ["Nướng", "Chiên giòn", "Xào", "Làm gỏi", "Nấu canh", "Ăn vặt", "Làm mồi"],
    storage: ["Nơi khô ráo", "Hộp kín", "Tránh ẩm", "Có thể đông lạnh", "Tránh ánh nắng", "12 tháng"],
    origin: ["Việt Nam", "Mực khô Phú Quốc", "Mực ống Nha Trang", "Mực lá Quảng Ngãi", "Mực Hàng"],
    pairings: ["Bia", "Rượu", "Cơm", "Cháo", "Bánh mì", "Đồ nhậu"],
    occasions: ["Bữa nhậu", "Tiếp khách", "Ăn vặt", "Quà biếu", "Lễ hội"],
    targetAudience: ["Người uống bia/rượu", "Đầu bếp", "Người thích hải sản", "Nam giới"]
  },
  "Nước mắm": {
    benefits: ["Đạm tự nhiên", "Khoáng chất", "Amino acids", "Tăng hương vị", "Không chất bảo quản", "Nguyên liệu tự nhiên"],
    usage: ["Nước chấm", "Pha nước mắm", "Nấu canh", "Kho thịt", "Ướp thịt", "Làm gỏi"],
    storage: ["Nơi mát", "Đậy nắp", "Không cần tủ lạnh", "Tránh ánh nắng", "Sau mở dùng trong 6 tháng"],
    origin: ["Việt Nam", "Nước mắm Phú Quốc", "Nước mắm Nha Trang", "Nước mắm Phan Thiết", "Nước mắm Cà Mau"],
    pairings: ["Phở", "Bún", "Gỏi cuốn", "Thịt luộc", "Rau sống", "Canh chua"],
    occasions: ["Nấu ăn hàng ngày", "Tiếp khách", "Lễ hội", "Quà biếu"],
    targetAudience: ["Người nội trợ", "Đầu bếp", "Người yêu ẩm thực Việt", "Hộ gia đình"]
  },
  "Bánh": {
    benefits: ["Năng lượng", "Tiện lợi", "Đa dạng hương vị", "Phù hợp mọi lứa tuổi", "Quà tặng ý nghĩa", "Văn hóa Việt"],
    usage: ["Ăn trực tiếp", "Pha trà", "Tráng miệng", "Quà biếu", "Tiếp khách", "Lễ hội"],
    storage: ["Nơi khô ráo", "Tránh ẩm", "Một số cần tủ lạnh", "Đọc hạn sử dụng", "Hộp kín"],
    origin: ["Việt Nam", "Bánh pía Sóc Trăng", "Bánh gai Nghệ An", "Bánh đúc Hà Nội", "Bánh mì Bánh mì", "Bánh bao"],
    pairings: ["Trà", "Cà phê", "Sữa", "Chè", "Đồ uống nóng"],
    occasions: ["Tết", "Lễ hội", "Sinh nhật", "Tiếp khách", "Quà biếu", "Phục vụ khách"],
    targetAudience: ["Mọi lứa tuổi", "Người mua quà", "Du khách", "Gia đình Việt"]
  },
  "Kẹo": {
    benefits: ["Năng lượng nhanh", "Vị ngọt tự nhiên", "Tiện lợi", "Đa dạng hương vị", "Phù hợp trẻ em", "Quà tặng"],
    usage: ["Ăn vặt", "Tráng miệng", "Pha trà", "Làm đồ handmade", "Tiếp khách", "Trang trí"],
    storage: ["Nơi khô ráo", "Tránh nóng", "Đậy kín", "Tránh tủ lạnh (một số loại)", "Xem hạn sử dụng"],
    origin: ["Việt Nam", "Kẹo dừa Bến Tre", "Kẹo lạc Quảng Nam", "Kẹo gừng", "Kẹo Cu Đơ", "Kẹo cà phê"],
    pairings: ["Trà", "Cà phê", "Đồ uống", "Bánh", "Snack"],
    occasions: ["Tết", "Lễ hội", "Sinh nhật", "Tiếp khách", "Quà cho trẻ"],
    targetAudience: ["Trẻ em", "Người thích ngọt", "Du khách", "Người mua quà"]
  },
  "Mứt": {
    benefits: ["Vitamin tự nhiên", "Chất xơ", "Chất chống oxy hóa", "Năng lượng", "Tốt cho tiêu hóa", "Không cholesterol"],
    usage: ["Ăn trực tiếp", "Tráng miệng", "Pha trà", "Làm bánh", "Topping", "Quà biếu"],
    storage: ["Tủ lạnh", "Đậy kín", "Sau mở dùng trong 2-4 tuần", "Tránh ánh nắng"],
    origin: ["Việt Nam", "Mứt bí Đà Lạt", "Mứt gừng", "Mứt cà rốt", "Mứt dâu", "Mứt đu đủ"],
    pairings: ["Trà", "Bánh mì", "Sữa chua", "Bánh", "Đồ ăn sáng"],
    occasions: ["Tết", "Lễ hội", "Tiếp khách", "Quà biếu", "Mùa đông"],
    targetAudience: ["Người cao tuổi", "Người ăn kiêng", "Du khách", "Người mua quà"]
  },
  "Hoa quả sấy": {
    benefits: ["Vitamin tự nhiên", "Chất xơ", "Chống oxy hóa", "Năng lượng", "Không chất bảo quản", "Tiện lợi"],
    usage: ["Ăn vặt", "Pha nước", "Làm bánh", "Topping", "Tráng miệng", "Quà biếu"],
    storage: ["Nơi khô ráo", "Hộp kín", "Tránh ẩm", "Tránh ánh nắng", "6-12 tháng"],
    origin: ["Việt Nam", "Xoài sấy", "Mít sấy", "Chuối sấy", "Dứa sấy", "Vải sấy", "Nho khô"],
    pairings: ["Yogurt", "Bánh", "Trà", "Cà phê", "Snack"],
    occasions: ["Ăn vặt", "Tết", "Tiếp khách", "Quà biếu", "Dân văn phòng"],
    targetAudience: ["Người ăn kiêng", "Dân văn phòng", "Trẻ em", "Du khách", "Người tập gym"]
  },
  "Khô bò": {
    benefits: ["Giàu protein", "Tiện lợi", "Hương vị đậm đà", "Bảo quản lâu", "Năng lượng cao", "Không cholesterol"],
    usage: ["Ăn vặt", "Nhậu", "Pha cơm", "Làm mồi nhậu", "Trang trí"],
    storage: ["Nơi khô ráo", "Hộp kín", "Tránh ẩm", "Tránh nắng", "6-12 tháng"],
    origin: ["Việt Nam", "Khô bò Bình Định", "Khô bò Nha Trang", "Khô bò Phú Yên", "Khô bò Gia Lai"],
    pairings: ["Bia", "Rượu", "Cơm", "Cháo", "Bánh mì"],
    occasions: ["Bữa nhậu", "Ăn vặt", "Tiếp khách", "Quà biếu", "Đi phượt"],
    targetAudience: ["Nam giới", "Người uống bia", "Du khách", "Dân phượt"]
  },
  "Khô gà": {
    benefits: ["Giàu protein", "Ít mỡ hơn khô bò", "Tiện lợi", "Hương vị thơm", "Bảo quản lâu", "Dễ ăn"],
    usage: ["Ăn vặt", "Nhậu", "Pha cơm", "Trang trí", "Món nhậu"],
    storage: ["Nơi khô ráo", "Hộp kín", "Tránh ẩm", "Tránh nắng", "6-12 tháng"],
    origin: ["Việt Nam", "Khô gà Cần Thơ", "Khô gà Bình Phước", "Khô gà Sóc Trăng"],
    pairings: ["Bia", "Rượu", "Cơm", "Cháo", "Bánh mì"],
    occasions: ["Bữa nhậu", "Ăn vặt", "Tiếp khách", "Quà biếu", "Đi phượt"],
    targetAudience: ["Nam giới", "Nữ giới", "Trẻ em (loại ít cay)", "Du khách"]
  },
  "default": {
    benefits: ["Chất lượng cao", "Nguyên liệu tự nhiên", "Đặc sản Việt Nam", "Kiểm tra chất lượng"],
    usage: ["Tùy theo từng sản phẩm", "Xem hướng dẫn trên bao bì", "Liên hệ support để được tư vấn"],
    storage: ["Nơi khô ráo", "Tránh ánh nắng", "Đậy kín sau khi mở", "Xem hạn sử dụng"],
    origin: ["Việt Nam"],
    pairings: ["Tùy sản phẩm"],
    occasions: ["Quà biếu", "Sử dụng cá nhân", "Tiếp khách", "Lễ hội"],
    targetAudience: ["Người yêu đặc sản Việt", "Gia đình Việt tại Mỹ", "Du khách"]
  }
};

function getCategoryAnalysis(category: string) {
  const catKey = Object.keys(CATEGORY_ANALYSIS).find(k => 
    category.toLowerCase().includes(k.toLowerCase())
  );
  return CATEGORY_ANALYSIS[catKey || "default"];
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("trà") || lower.includes("tea")) return "Trà";
  if (lower.includes("cà phê") || lower.includes("coffee")) return "Cà phê";
  if (lower.includes("cá") && lower.includes("khô")) return "Cá khô";
  if (lower.includes("tôm") && lower.includes("khô")) return "Tôm khô";
  if (lower.includes("mực") && lower.includes("khô")) return "Mực khô";
  if (lower.includes("nước mắm") || lower.includes("fish sauce")) return "Nước mắm";
  if (lower.includes("bánh")) return "Bánh";
  if (lower.includes("kẹo") || lower.includes("candy")) return "Kẹo";
  if (lower.includes("mứt")) return "Mứt";
  if (lower.includes("hoa quả") || lower.includes("trái cây") || lower.includes("fruit")) return "Hoa quả sấy";
  if (lower.includes("khô bò") || lower.includes("beef")) return "Khô bò";
  if (lower.includes("khô gà") || lower.includes("chicken")) return "Khô gà";
  return "default";
}

async function askAI(prompt: string): Promise<string> {
  const result = await callGPTJSON<Record<string, unknown>>(prompt, {
    task: "product-analysis",
    temperature: 0.4,
    maxTokens: 1200,
  });
  return result ? JSON.stringify(result) : "";
}

export async function analyzeProduct(product: ProductWithDetails): Promise<ProductAnalysis> {
  const categoryAnalysis = getCategoryAnalysis(product.category);
  const category = detectCategory(product.category);
  
  const isOnSale = product.isOnSale && product.salePrice !== undefined;
  const displayPrice = isOnSale ? product.salePrice! : product.price;
  
  const prompt = `
Bạn là chuyên gia phân tích sản phẩm đặc sản Việt Nam cho LIKEFOOD.

Sản phẩm cần phân tích:
- Tên: ${product.name}
- Danh mục: ${product.category}
- Giá: $${displayPrice.toFixed(2)}
- Mô tả: ${product.description?.substring(0, 300) || "Không có mô tả"}
- Tags: ${product.tags || "Không có"}

Thông tin danh mục ${category}:
- Lợi ích: ${categoryAnalysis.benefits.join(", ")}
- Cách sử dụng: ${categoryAnalysis.usage.join(", ")}
- Bảo quản: ${categoryAnalysis.storage.join(", ")}
- Xuất xứ: ${categoryAnalysis.origin.join(", ")}
- Kết hợp: ${categoryAnalysis.pairings.join(", ")}
- Dịp sử dụng: ${categoryAnalysis.occasions.join(", ")}
- Đối tượng: ${categoryAnalysis.targetAudience.join(", ")}

Hãy phân tích sản phẩm này và trả về JSON với format sau (chỉ trả về JSON, không giải thích gì thêm):

{
  "benefits": ["lợi ích 1", "lợi ích 2", ...],
  "usage": ["cách sử dụng 1", "cách sử dụng 2", ...],
  "storage": ["cách bảo quản 1", ...],
  "nutrition": ["thành phần dinh dưỡng chính"],
  "origin": ["xuất xứ/vùng miền"],
  "comparisons": ["so sánh với sản phẩm tương tự"],
  "pairings": ["sản phẩm kết hợp 1", "sản phẩm kết hợp 2", ...],
  "occasions": ["dịp sử dụng 1", ...],
  "targetAudience": ["đối tượng 1", ...],
  "keywords": ["từ khóa 1", "từ khóa 2", ...],
  "shortDescription": "mô tả ngắn 50-80 ký tự",
  "highlights": ["điểm nổi bật 1", "điểm nổi bật 2", ...],
  "seoTitle": "title cho SEO",
  "seoDescription": "description cho SEO",
  "tags": ["tag1", "tag2", ...]
}

Chỉ trả về JSON, không có markdown hay giải thích.
`;

  const aiResponse = await askAI(prompt);
  
  const analysis: ProductAnalysis["analysis"] = {
    benefits: categoryAnalysis.benefits,
    usage: categoryAnalysis.usage,
    storage: categoryAnalysis.storage,
    nutrition: ["Thông tin dinh dưỡng xem trên bao bì sản phẩm"],
    origin: categoryAnalysis.origin,
    comparisons: [],
    pairings: categoryAnalysis.pairings,
    occasions: categoryAnalysis.occasions,
    targetAudience: categoryAnalysis.targetAudience,
    keywords: [product.name.toLowerCase(), product.category.toLowerCase(), "likefood", "vietnamese", "specialty"]
  };
  
  const marketing: ProductAnalysis["marketing"] = {
    shortDescription: product.description?.substring(0, 80) || `Đặc sản ${product.category} chính gốc Việt Nam`,
    highlights: ["Chất lượng cao", "Nhập khẩu chính hãng", "Giao hàng toàn Mỹ"],
    seoTitle: `${product.name} | Đặc sản Việt Nam | LIKEFOOD`,
    seoDescription: `Mua ${product.name} chính hãng tại LIKEFOOD. ${categoryAnalysis.benefits.join(", ")}. Giao hàng nhanh chóng toàn Mỹ.`,
    tags: [product.category, "likefood", "vietnamese food", product.name.toLowerCase().replace(/\s+/g, "-")]
  };

  // Parse AI response
  if (aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      if (parsed.benefits) analysis.benefits = parsed.benefits;
      if (parsed.usage) analysis.usage = parsed.usage;
      if (parsed.storage) analysis.storage = parsed.storage;
      if (parsed.nutrition) analysis.nutrition = parsed.nutrition;
      if (parsed.origin) analysis.origin = parsed.origin;
      if (parsed.comparisons) analysis.comparisons = parsed.comparisons;
      if (parsed.pairings) analysis.pairings = parsed.pairings;
      if (parsed.occasions) analysis.occasions = parsed.occasions;
      if (parsed.targetAudience) analysis.targetAudience = parsed.targetAudience;
      if (parsed.keywords) analysis.keywords = parsed.keywords;
      
      if (parsed.shortDescription) marketing.shortDescription = parsed.shortDescription;
      if (parsed.highlights) marketing.highlights = parsed.highlights;
      if (parsed.seoTitle) marketing.seoTitle = parsed.seoTitle;
      if (parsed.seoDescription) marketing.seoDescription = parsed.seoDescription;
      if (parsed.tags) marketing.tags = parsed.tags;
    } catch (e) {
      logger.debug("[AI Product Analysis] Parse error, using defaults");
    }
  }

  // Find related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      category: product.category,
      id: { not: product.id },
      isDeleted: false,
      inventory: { gt: 0 }
    },
    take: 5,
    select: { id: true }
  });

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    price: product.price,
    salePrice: product.salePrice,
    analysis,
    marketing,
    recommendations: {
      relatedProducts: relatedProducts.map(p => String(p.id)),
      complementaryProducts: [],
      similarProducts: []
    }
  };
}

export async function analyzeAllProducts(): Promise<ProductAnalysis[]> {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      salePrice: true,
      saleStartAt: true,
      saleEndAt: true,
      category: true,
      categoryId: true,
      brandId: true,
      tags: true,
      image: true,
      inventory: true,
      soldCount: true,
      ratingAvg: true,
      ratingCount: true,
      weight: true,
      code: true,
      badgeText: true,
      isOnSale: true,
      featured: true,
      isVisible: true,
      originalPrice: true
    },
    take: 111
  });

  const analyses: ProductAnalysis[] = [];
  
  for (const product of products) {
    const analysis = await analyzeProduct(product as ProductWithDetails);
    analyses.push(analysis);
  }

  return analyses;
}

export async function getProductAnalysis(productId: number): Promise<ProductAnalysis | null> {
  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      salePrice: true,
      saleStartAt: true,
      saleEndAt: true,
      category: true,
      categoryId: true,
      brandId: true,
      tags: true,
      image: true,
      inventory: true,
      soldCount: true,
      ratingAvg: true,
      ratingCount: true,
      weight: true,
      code: true,
      badgeText: true,
      isOnSale: true,
      featured: true,
      isVisible: true,
      originalPrice: true
    }
  });

  if (!product) return null;

  return analyzeProduct(product as ProductWithDetails);
}

export async function generateProductInsights(): Promise<{
  totalProducts: number;
  categories: { name: string; count: number }[];
  priceRange: { min: number; max: number; avg: number };
  topProducts: { id: number; name: string; sold: number }[];
  lowStock: { id: number; name: string; stock: number }[];
  insights: string[];
}> {
  const [products, categoryGroups, lowStockProducts, topSold] = await Promise.all([
    prisma.product.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, price: true, category: true, soldCount: true }
    }),
    prisma.product.groupBy({
      by: ["category"],
      where: { isDeleted: false },
      _count: { id: true }
    }),
    prisma.product.findMany({
      where: { isDeleted: false, inventory: { lt: 10 } },
      select: { id: true, name: true, inventory: true },
      orderBy: { inventory: "asc" },
      take: 10
    }),
    prisma.product.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, soldCount: true },
      orderBy: { soldCount: "desc" },
      take: 10
    })
  ]);

  const prices = products.map(p => p.price);
  const priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: prices.reduce((a, b) => a + b, 0) / prices.length
  };

  const prompt = `
Dựa trên dữ liệu sản phẩm LIKEFOOD:
- Tổng sản phẩm: ${products.length}
- Danh mục: ${categoryGroups.map(c => `${c.category}: ${c._count.id}`).join(", ")}
- Khoảng giá: $${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)} (TB: $${priceRange.avg.toFixed(2)})
- Top bán chạy: ${topSold.map(p => p.name).slice(0, 5).join(", ")}
- Sản phẩm sắp hết hàng: ${lowStockProducts.map(p => p.name).join(", ")}

Hãy đưa ra 5 insights ngắn gọn về danh mục sản phẩm bằng tiếng Việt.
Chỉ trả về JSON array các string, không giải thích.
`;

  const insights: string[] = [
    `Có ${products.length} sản phẩm đang bán`,
    `${categoryGroups.length} danh mục sản phẩm`,
    `Giá trung bình: $${priceRange.avg.toFixed(2)}`,
    `${lowStockProducts.length} sản phẩm sắp hết hàng`,
    "Top sản phẩm bán chạy đang được cập nhật"
  ];

  const aiInsights = await askAI(prompt);
  if (aiInsights) {
    try {
      const parsed = JSON.parse(aiInsights);
      if (Array.isArray(parsed)) {
        insights.length = 0;
        insights.push(...parsed.slice(0, 5));
      }
    } catch (e) {}
  }

  return {
    totalProducts: products.length,
    categories: categoryGroups.map(c => ({ name: c.category, count: c._count.id })),
    priceRange,
    topProducts: topSold.map(p => ({ id: p.id, name: p.name, sold: p.soldCount })),
    lowStock: lowStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.inventory })),
    insights
  };
}
