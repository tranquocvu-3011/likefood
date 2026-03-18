/**
 * LIKEFOOD - Related Posts Component (Server Component)
 * Internal linking strategy: shows related blog posts at bottom of pages
 * Helps SEO by creating strong internal link structure
 */

import prisma from "@/lib/prisma";
import Link from "next/link";

interface RelatedPostsProps {
  currentSlug?: string;
  category?: string;
  maxPosts?: number;
}

export default async function RelatedPosts({
  currentSlug,
  category,
  maxPosts = 4,
}: RelatedPostsProps) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        isPublished: true,
        ...(currentSlug ? { NOT: { slug: currentSlug } } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: maxPosts,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        category: true,
        image: true,
        publishedAt: true,
      },
    });

    if (posts.length === 0) return null;

    return (
      <section className="related-posts" aria-label="Bài viết liên quan">
        <h2 className="related-posts__title">📚 Bài Viết Liên Quan</h2>
        <div className="related-posts__grid">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="related-posts__card"
              title={post.title}
            >
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="related-posts__image"
                  loading="lazy"
                  width={300}
                  height={200}
                />
              )}
              <div className="related-posts__content">
                <span className="related-posts__category">{post.category}</span>
                <h3 className="related-posts__name">{post.title}</h3>
                {post.summary && (
                  <p className="related-posts__summary">
                    {post.summary.length > 100
                      ? post.summary.slice(0, 100) + "..."
                      : post.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
        <style>{`
          .related-posts {
            margin-top: 3rem;
            padding: 2rem 0;
            border-top: 1px solid #e5e7eb;
          }
          .related-posts__title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: #1f2937;
          }
          .related-posts__grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.5rem;
          }
          .related-posts__card {
            border-radius: 12px;
            overflow: hidden;
            text-decoration: none;
            color: inherit;
            transition: transform 0.2s, box-shadow 0.2s;
            background: #fff;
            border: 1px solid #e5e7eb;
          }
          .related-posts__card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          }
          .related-posts__image {
            width: 100%;
            height: 160px;
            object-fit: cover;
          }
          .related-posts__content {
            padding: 1rem;
          }
          .related-posts__category {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            color: #ed712e;
            background: #fff7ed;
            padding: 2px 8px;
            border-radius: 4px;
            margin-bottom: 0.5rem;
          }
          .related-posts__name {
            font-size: 1rem;
            font-weight: 600;
            line-height: 1.4;
            margin: 0 0 0.5rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .related-posts__summary {
            font-size: 0.85rem;
            color: #6b7280;
            margin: 0;
            line-height: 1.5;
          }
          @media (max-width: 640px) {
            .related-posts__grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    );
  } catch {
    return null;
  }
}
