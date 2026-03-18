import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();
async function main() {
    const posts = await prisma.post.findMany({ select: { id: true, title: true, image: true, category: true } });
    console.log(posts);
}
main().finally(() => prisma.$disconnect());
