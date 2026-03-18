import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

// 5 bài viết có URL Unsplash bị 404 — thay bằng URL mới (đã verify 200 OK)
const fixes = [
  {
    // "5 Combo Đặc Sản Việt Nam Tiết Kiệm Nhất" → ảnh variety food dishes
    oldImageContains: "1476224203421",
    newImage: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80",
  },
  {
    // "Top 10 Đặc Sản Việt Nam" (hoặc tương tự) → ảnh bàn tiệc Asian food
    oldImageContains: "1626804475297",
    newImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  },
  {
    // Post chứa URL 1555126634 → ảnh đĩa thức ăn đẹp
    oldImageContains: "1555126634",
    newImage: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
  },
  {
    // Post chứa URL 1481070555726 → ảnh salad/healthy food
    oldImageContains: "1481070555726",
    newImage: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
  },
  {
    // Post chứa URL 1588168333986 → ảnh seafood/tôm
    oldImageContains: "1588168333986",
    newImage: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80",
  },
];

async function main() {
  console.log("Fixing 5 broken Unsplash URLs (404) with new working URLs...\n");

  for (const fix of fixes) {
    const post = await prisma.post.findFirst({
      where: { image: { contains: fix.oldImageContains } },
      select: { id: true, title: true, image: true },
    });

    if (!post) {
      console.log(`❌ NOT FOUND post with image containing: ${fix.oldImageContains}`);
      continue;
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { image: fix.newImage },
    });

    console.log(`✅ FIXED ID ${post.id}: ${post.title?.substring(0, 55)}`);
    console.log(`   Old: ...${fix.oldImageContains}...`);
    console.log(`   New: ${fix.newImage.substring(0, 60)}...\n`);
  }

  console.log("Done! All 5 broken URLs have been replaced.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect(); });
