/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Helper to generate alternate URLs for hreflang in sitemap
  const generateAlternates = (url: string) => ({
    alternates: {
      languages: {
        'vi': url,
        'en': `${url}${url.includes('?') ? '&' : '?'}lang=en`,
        'x-default': url,
      },
    },
  });

  // Static pages with hreflang
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      ...generateAlternates(BASE_URL),
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      ...generateAlternates(`${BASE_URL}/products`),
    },
    {
      url: `${BASE_URL}/flash-sale`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
      ...generateAlternates(`${BASE_URL}/flash-sale`),
    },
  ];

  // Dynamic Product Pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { isVisible: true, isDeleted: false },
      select: { slug: true, id: true, updatedAt: true },
    });

    productPages = products.map((p) => {
      const productUrl = `${BASE_URL}/products/${p.slug || p.id}`;
      return {
        url: productUrl,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        ...generateAlternates(productUrl),
      };
    });
  } catch {
    // products fetch failed silently for sitemap
  }

  // Dynamic Blog Posts
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      select: { slug: true, id: true, updatedAt: true },
    });

    postPages = posts.map((p) => {
      const postUrl = `${BASE_URL}/posts/${p.slug || p.id}`;
      return {
        url: postUrl,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        ...generateAlternates(postUrl),
      };
    });
  } catch {
    // posts fetch failed silently for sitemap
  }

  // Legal, FAQ, Blog index + policies + about + contact
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/posts`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
      ...generateAlternates(`${BASE_URL}/posts`),
    },
    {
      url: `${BASE_URL}/likefood-la-gi`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      ...generateAlternates(`${BASE_URL}/likefood-la-gi`),
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      ...generateAlternates(`${BASE_URL}/about`),
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      ...generateAlternates(`${BASE_URL}/contact`),
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      ...generateAlternates(`${BASE_URL}/faq`),
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
      ...generateAlternates(`${BASE_URL}/compare`),
    },
    {
      url: `${BASE_URL}/vouchers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
      ...generateAlternates(`${BASE_URL}/vouchers`),
    },
    {
      url: `${BASE_URL}/policies/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
      ...generateAlternates(`${BASE_URL}/policies/terms`),
    },
    {
      url: `${BASE_URL}/policies/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
      ...generateAlternates(`${BASE_URL}/policies/privacy`),
    },
    {
      url: `${BASE_URL}/policies/shipping`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
      ...generateAlternates(`${BASE_URL}/policies/shipping`),
    },
    {
      url: `${BASE_URL}/policies/return`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
      ...generateAlternates(`${BASE_URL}/policies/return`),
    },
  ];

  // Dynamic Category Pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, isVisible: true },
      select: { slug: true, updatedAt: true },
    });
    categoryPages = categories.map((c) => {
      const categoryUrl = `${BASE_URL}/products?category=${c.slug}`;
      return {
        url: categoryUrl,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        ...generateAlternates(categoryUrl),
      };
    });
  } catch {
    // category pages fetch failed silently
  }

  // Dynamic CMS pages
  let cmsPages: MetadataRoute.Sitemap = [];
  try {
    const dynamicPages = await prisma.dynamicPage.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
    cmsPages = dynamicPages.map((p) => {
      const cmsUrl = `${BASE_URL}/${p.slug}`;
      return {
        url: cmsUrl,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
        ...generateAlternates(cmsUrl),
      };
    });
  } catch {
    // CMS pages fetch failed silently
  }

  return [...staticPages, ...productPages, ...categoryPages, ...postPages, ...legalPages, ...cmsPages];
}
