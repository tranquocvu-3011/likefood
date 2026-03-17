/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Database Seed Script
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

const categories = [
    "Cá khô",
    "Tôm & Mực khô",
    "Trái cây sấy",
    "Trà & Bánh mứt",
    "Gia vị Việt",
];

const products = [
    // Cá khô
    {
        name: "Cá Lóc Khô Đồng Tháp",
        slug: "ca-loc-kho-dong-thap",
        description: "Cá lóc khô được chế biến từ cá lóc tươi sống vùng Đồng Tháp, phơi khô tự nhiên dưới nắng gió. Thịt cá ngọt, thơm, dai, giữ nguyên hương vị đặc trưng miền Tây sông nước.",
        price: 25.99,
        originalPrice: 29.99,
        category: "Cá khô",
        inventory: 50,
        weight: "500g",
        image: "/products/ca-loc-kho.jpg",
        featured: true,
        tags: "gift,traditional",
    },
    {
        name: "Khô Cá Sặc Bổi Cà Mau",
        slug: "kho-ca-sac-boi-ca-mau",
        description: "Khô cá sặc bổi đặc sản Cà Mau, được làm từ cá sặc tươi ướp muối và phơi khô tự nhiên. Vị mặn vừa, thơm ngon, thích hợp chiên giòn ăn kèm cơm trắng.",
        price: 19.99,
        originalPrice: 24.99,
        category: "Cá khô",
        inventory: 80,
        weight: "300g",
        image: "/products/ca-sac-boi.jpg",
        featured: false,
        tags: "traditional",
    },
    {
        name: "Khô Cá Tra Phồng",
        slug: "kho-ca-tra-phong",
        description: "Khô cá tra phồng giòn tan, được làm từ cá tra tươi, tẩm gia vị và chiên phồng. Ăn liền hoặc kho tiêu đều ngon.",
        price: 15.99,
        category: "Cá khô",
        inventory: 100,
        weight: "200g",
        image: "/products/ca-tra-phong.jpg",
        featured: false,
        tags: "",
    },

    // Tôm & Mực khô
    {
        name: "Tôm Khô Cà Mau Loại 1",
        slug: "tom-kho-ca-mau-loai-1",
        description: "Tôm khô Cà Mau loại 1, được chế biến từ tôm biển tươi sống, phơi khô tự nhiên. Thịt tôm ngọt, thơm, chắc, không tẩm hóa chất bảo quản.",
        price: 45.99,
        originalPrice: 55.99,
        category: "Tôm & Mực khô",
        inventory: 40,
        weight: "500g",
        image: "/products/tom-kho.jpg",
        featured: true,
        tags: "gift,spicy",
    },
    {
        name: "Mực Khô Câu Phú Quốc",
        slug: "muc-kho-cau-phu-quoc",
        description: "Mực khô câu Phú Quốc, được làm từ mực tươi câu trực tiếp từ biển. Thịt mực dày, ngọt, thơm, nướng hoặc xào đều ngon.",
        price: 55.99,
        originalPrice: 65.99,
        category: "Tôm & Mực khô",
        inventory: 30,
        weight: "500g",
        image: "/products/muc-kho.jpg",
        featured: true,
        tags: "gift",
    },
    {
        name: "Tôm Rim Me Sài Gòn",
        slug: "tom-rim-me-sai-gon",
        description: "Tôm rim me đặc sản Sài Gòn, vị chua ngọt đậm đà, ăn kèm cơm trắng cực ngon.",
        price: 35.99,
        category: "Tôm & Mực khô",
        inventory: 45,
        weight: "300g",
        image: "/products/tom-rim-me.jpg",
        featured: false,
        tags: "spicy",
    },

    // Trái cây sấy
    {
        name: "Xoài Sấy Dẻo Cam Ranh",
        slug: "xoai-say-deo-cam-ranh",
        description: "Xoài sấy dẻo Cam Ranh, được làm từ xoài cát Hòa Lộc chín mọng. Không đường, không phụ gia, giữ nguyên hương vị tự nhiên.",
        price: 12.99,
        originalPrice: 15.99,
        category: "Trái cây sấy",
        inventory: 120,
        weight: "200g",
        image: "/products/xoai-say.jpg",
        featured: true,
        tags: "diet,gift",
    },
    {
        name: "Chuối Sấy Giòn Tiền Giang",
        slug: "chuoi-say-gion-tien-giang",
        description: "Chuối sấy giòn Tiền Giang, được làm từ chuối già hương chín mọng. Giòn tan, ngọt tự nhiên, ăn vặt lý tưởng.",
        price: 8.99,
        category: "Trái cây sấy",
        inventory: 150,
        weight: "150g",
        image: "/products/chuoi-say.jpg",
        featured: false,
        tags: "diet",
    },
    {
        name: "Mít Sấy Giòn Đồng Nai",
        slug: "mit-say-gion-dong-nai",
        description: "Mít sấy giòn Đồng Nai, được làm từ mít nghệ chín, sấy chân không. Giòn rụm, thơm ngon, không dầu mỡ.",
        price: 10.99,
        category: "Trái cây sấy",
        inventory: 100,
        weight: "180g",
        image: "/products/mit-say.jpg",
        featured: false,
        tags: "diet",
    },

    // Trà & Bánh mứt
    {
        name: "Mứt Dừa Non Bến Tre",
        slug: "mut-dua-non-ben-tre",
        description: "Mứt dừa non Bến Tre, được làm từ dừa non tươi, sên với đường phèn. Dẻo ngọt, thơm béo, món ăn không thể thiếu ngày Tết.",
        price: 14.99,
        category: "Trà & Bánh mứt",
        inventory: 80,
        weight: "300g",
        image: "/products/mut-dua.jpg",
        featured: true,
        tags: "gift,traditional",
    },
    {
        name: "Trà Sen Tây Hồ",
        slug: "tra-sen-tay-ho",
        description: "Trà sen Tây Hồ, được ướp từ hoa sen tươi và trà móc câu thượng hạng. Hương thơm thanh tao, vị ngọt dịu, thư giãn tinh thần.",
        price: 28.99,
        originalPrice: 35.99,
        category: "Trà & Bánh mứt",
        inventory: 60,
        weight: "100g",
        image: "/products/tra-sen.jpg",
        featured: true,
        tags: "gift",
    },
    {
        name: "Bánh Tráng Mè Tây Ninh",
        slug: "banh-trang-me-tay-ninh",
        description: "Bánh tráng mè Tây Ninh, giòn tan, thơm mùi mè rang. Ăn liền hoặc cuốn thịt đều ngon.",
        price: 6.99,
        category: "Trà & Bánh mứt",
        inventory: 200,
        weight: "200g",
        image: "/products/banh-trang.jpg",
        featured: false,
        tags: "",
    },

    // Gia vị Việt
    {
        name: "Nước Mắm Phú Quốc 40 Độ Đạm",
        slug: "nuoc-mam-phu-quoc-40-do-dam",
        description: "Nước mắm Phú Quốc cốt đặc biệt 40 độ đạm, được ủ từ cá cơm tươi. Màu cánh gián đậm, vị ngọt hậu, thơm nồng đặc trưng.",
        price: 18.99,
        originalPrice: 22.99,
        category: "Gia vị Việt",
        inventory: 70,
        weight: "500ml",
        image: "/products/nuoc-mam.jpg",
        featured: true,
        tags: "traditional",
    },
    {
        name: "Muối Tôm Tây Ninh",
        slug: "muoi-tom-tay-ninh",
        description: "Muối tôm Tây Ninh chính hiệu, được làm từ tôm khô xay nhuyễn và ớt hiểm. Cay nồng, thơm ngon, chấm trái cây hoặc rắc cơm đều tuyệt vời.",
        price: 9.99,
        category: "Gia vị Việt",
        inventory: 90,
        weight: "150g",
        image: "/products/muoi-tom.jpg",
        featured: false,
        tags: "spicy",
    },
    {
        name: "Sa Tế Chay Đà Nẵng",
        slug: "sa-te-chay-da-nang",
        description: "Sa tế chay Đà Nẵng, được làm từ ớt, tỏi, sả và các gia vị tự nhiên. Cay thơm, không dầu cọ, phù hợp người ăn chay.",
        price: 7.99,
        category: "Gia vị Việt",
        inventory: 110,
        weight: "200g",
        image: "/products/sa-te.jpg",
        featured: false,
        tags: "spicy,diet",
    },
];

async function main() {
    console.log("🌱 Seeding database...");

    // Default system settings (safe for local/dev; admin can override in UI)
    await prisma.systemsetting.upsert({
        where: { key: "security_captcha_enabled" },
        update: {},
        create: { key: "security_captcha_enabled", value: "ON" },
    });

    // Create products
    for (const product of products) {
        const existing = await prisma.product.findUnique({
            where: { slug: product.slug },
        });

        if (existing) {
            console.log(`  ⏭️  Product "${product.name}" already exists, skipping...`);
            continue;
        }

        await prisma.product.create({
            data: {
                name: product.name,
                slug: product.slug,
                description: product.description,
                price: product.price,
                originalPrice: product.originalPrice ?? null,
                category: product.category,
                inventory: product.inventory,
                weight: product.weight,
                image: product.image,
                featured: product.featured,
                tags: product.tags,
                ratingAvg: 4.5 + Math.random() * 0.5,
                ratingCount: Math.floor(Math.random() * 50) + 10,
                soldCount: Math.floor(Math.random() * 100) + 20,
            },
        });
        console.log(`  ✅ Created product: ${product.name}`);
    }

    console.log("\n🎉 Seed completed successfully!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Seed failed:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
