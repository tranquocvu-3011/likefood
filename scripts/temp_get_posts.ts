import { PrismaClient } from '../src/generated/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, category: true, image: true }
  });
  fs.writeFileSync('scripts/posts_utf8.json', JSON.stringify(posts, null, 2), 'utf8');
  console.log('Saved to scripts/posts_utf8.json');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
