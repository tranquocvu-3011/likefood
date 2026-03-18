import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

const updates = [
  {
    id: 1,
    category: "Cẩm nang",
    image: "https://images.unsplash.com/photo-1548946522-4a313e8972a4?w=800&q=80"
  },
  {
    id: 3,
    category: "Tin tức",
    image: "https://images.unsplash.com/photo-1626804475297-41609ea154eb?w=800&q=80"
  },
  {
    id: 4,
    category: "Cẩm nang",
    image: "https://images.unsplash.com/photo-1555126634-ae39b8167da5?w=800&q=80"
  },
  {
    id: 5,
    category: "Cẩm nang",
    image: "https://images.unsplash.com/photo-1588168333986-5b7fb56f34e3?w=800&q=80"
  },
  {
    id: 6,
    category: "Cẩm nang",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80"
  },
  {
    id: 7,
    category: "Ưu đãi",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
  },
  {
    id: 8,
    category: "Tin tức",
    image: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80"
  },
  {
    id: 9,
    category: "Tuyển dụng", // Use recruitment just so the tab is arguably populated, since "Thương hiệu LIKEFOOD" is about the company
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80"
  },
  {
    id: 10,
    category: "Cẩm nang",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80"
  },
  {
    id: 11,
    category: "Cẩm nang",
    image: "https://images.unsplash.com/photo-1481070555726-e2fe8347b565?w=800&q=80"
  },
  {
    id: 12,
    category: "Ưu đãi",
    image: "https://images.unsplash.com/photo-1476224203421-9ce84f65965a?w=800&q=80"
  }
];

async function main() {
  console.log("Updating 11 posts...");
  for (const update of updates) {
    await prisma.post.update({
      where: { id: update.id },
      data: {
        category: update.category,
        image: update.image
      }
    });
    console.log(`Updated post ID ${update.id}`);
  }
  console.log("Finished updating posts!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
