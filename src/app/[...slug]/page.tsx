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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";
  const pageUrl = `${baseUrl}/${slugPath}`;
  const cookieStore = await cookies();
  const locale = cookieStore.get("language")?.value || "vi";
  const isEn = locale === "en";

  const page = await prisma.dynamicPage.findUnique({
    where: { slug: slugPath },
  });

  if (page && !page.isPublished) {
    return {
      title: locale === "en" ? "Page not found" : "Không tìm thấy trang",
      robots: { index: false, follow: false },
    };
  }

  if (!page) {
    return {
      title: locale === "en" ? "Page not found" : "Không tìm thấy trang",
      robots: { index: false, follow: false },
    };
  }

  const title = isEn ? (page.titleEn || page.metaTitle || page.title) : (page.metaTitle || page.title);
  const description = isEn ? (page.excerptEn || page.metaDescription || page.excerpt || undefined) : (page.metaDescription || page.excerpt || undefined);

  return {
    title,
    description,
    alternates: {
      canonical: `/${slugPath}`,
      languages: {
        vi: `/${slugPath}?lang=vi`,
        en: `/${slugPath}?lang=en`,
        "x-default": `/${slugPath}`,
      },
    },
    openGraph: {
      type: "article",
      locale: isEn ? "en_US" : "vi_VN",
      alternateLocale: isEn ? "vi_VN" : "en_US",
      url: pageUrl,
      title,
      description,
      images: page.image ? [{ url: page.image }] : undefined,
    },
  };
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const page = await prisma.dynamicPage.findUnique({
    where: { slug: slugPath },
  });

  if (!page || !page.isPublished) {
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
