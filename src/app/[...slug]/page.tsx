/**
 * LIKEFOOD - Dynamic Page Route
 * Catch-all route for dynamic pages (About, FAQ, Policies, etc.)
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { cookies } from "next/headers";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  try {
    const pages = await prisma.dynamicPage.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });

    return pages.map((page) => ({
      slug: page.slug.split("/"),
    }));
  } catch {
    // Fallback to runtime rendering when DB is unavailable during image build.
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const page = await prisma.dynamicPage.findUnique({
    where: { slug: slugPath, isPublished: true },
  });

  if (!page) {
    const cookieStore = await cookies();
    const locale = cookieStore.get("language")?.value || "vi";
    return {
      title: locale === "en" ? "Page not found" : "Không tìm thấy trang",
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
  };
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const page = await prisma.dynamicPage.findUnique({
    where: { slug: slugPath, isPublished: true },
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary via-emerald-500 to-cyan-500 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative page-container-wide text-center">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white mb-4">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {page.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="page-container-wide">
          <div 
            className="prose max-w-4xl mx-auto bg-white rounded-3xl p-8 lg:p-12 shadow-lg"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
          />
        </div>
      </section>
    </div>
  );
}
