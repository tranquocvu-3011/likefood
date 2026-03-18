import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

// Map title keywords → appropriate Unsplash image
const updates = [
  {
    titleContains: "5 Combo",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    // Variety of food dishes - phù hợp với combo đặc sản
  },
  {
    titleContains: "So Sánh Các Loại Cá Khô",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
    // Dried fish / seafood - phù hợp so sánh cá khô
  },
  {
    titleContains: "Câu Chuyện Thương Hiệu",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    // Brand story / food brand - phù hợp câu chuyện thương hiệu
  },
  {
    titleContains: "Vietnamese Food Near Me",
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80",
    // Vietnamese cuisine spread - phù hợp đặc sản Việt Nam
  },
  {
    titleContains: "Quà Biếu",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238f8b1?w=800&q=80",
    // Gift boxes / food gifts - phù hợp quà biếu
  },
  {
    titleContains: "Tôm Khô Cà Mau",
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80",
    // Shrimp / seafood - phù hợp tôm khô
  },
  {
    titleContains: "Top 10 Đặc Sản",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
    // Top food collection - phù hợp Top 10 đặc sản
  },
];

async function main() {
  console.log("Finding and updating posts missing images...\n");
  
  for (const update of updates) {
    const post = await prisma.post.findFirst({
      where: { title: { contains: update.titleContains } },
      select: { id: true, title: true, image: true },
    });

    if (!post) {
      console.log(`❌ NOT FOUND: "${update.titleContains}"`);
      continue;
    }

    const currentImg = post.image || "";
    if (currentImg.startsWith("http") && currentImg.includes("unsplash")) {
      console.log(`⏭️  SKIP (already has Unsplash): ID ${post.id} - ${post.title?.substring(0, 50)}`);
      continue;
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { image: update.image },
    });
    console.log(`✅ UPDATED: ID ${post.id} - ${post.title?.substring(0, 50)}`);
  }

  console.log("\nDone! All posts should now have images.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect(); });
