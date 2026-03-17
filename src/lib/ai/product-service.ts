"use server";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { brand, product, productvariant } from "@/generated/client";
import { DEFAULT_SHIPPING_FEE_USD, EXPRESS_SHIPPING_FEE_USD, FREE_SHIPPING_THRESHOLD_USD } from "@/lib/commerce";
import prisma from "@/lib/prisma";

export interface ProductInfo {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: {
    id: number;
    name: string;
    slug: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  variants?: {
    id: number;
    name: string;
    price: number;
    inventory: number;
  }[];
  inventory: number;
  rating?: number;
  reviewCount?: number;
  tags: string[];
}

export interface FlashSaleInfo {
  id: number;
  name: string;
  startTime: Date;
  endTime: Date;
  discount: number;
  products: {
    id: number;
    name: string;
    salePrice: number;
    originalPrice: number;
    inventory: number;
  }[];
}

export interface ShippingInfo {
  zone: string;
  standardDays: number;
  expressDays: number;
  standardFee: number;
  expressFee: number;
  freeShippingThreshold: number;
}

type ProductWithRelations = product & {
  brand: brand | null;
  productVariants: productvariant[];
};

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

function formatVariantName(variant: productvariant): string {
  return [variant.flavor, variant.weight].filter(Boolean).join(" - ") || variant.sku || String(variant.id);
}

function formatProduct(productRecord: ProductWithRelations): ProductInfo {
  return {
    id: productRecord.id,
    name: productRecord.name,
    slug: productRecord.slug ?? String(productRecord.id),
    description: productRecord.description,
    price: productRecord.price,
    compareAtPrice: productRecord.originalPrice ?? undefined,
    images: productRecord.image ? [productRecord.image] : [],
    category: {
      id: Number(productRecord.category),
      name: productRecord.category,
      slug: slugify(productRecord.category),
    },
    brand: productRecord.brand
      ? {
          id: productRecord.brand.id,
          name: productRecord.brand.name,
        }
      : undefined,
    variants: productRecord.productVariants.map((variant) => ({
      id: variant.id,
      name: formatVariantName(variant),
      price: productRecord.price + (variant.priceAdjustment ?? 0),
      inventory: variant.stock ?? 0,
    })),
    inventory: productRecord.inventory ?? 0,
    rating: productRecord.ratingAvg ?? 0,
    reviewCount: productRecord.ratingCount ?? 0,
    tags: productRecord.tags ? productRecord.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
  };
}

export async function searchProducts(query: string, limit = 5): Promise<ProductInfo[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { tags: { contains: query } },
        ],
        isDeleted: false,
      },
      include: {
        brand: true,
        productVariants: { where: { isActive: true } },
      },
      take: limit,
    });

    return products.map((productRecord) => formatProduct(productRecord as ProductWithRelations));
  } catch (error) {
    console.error("searchProducts error:", error);
    return [];
  }
}

export async function getProduct(identifier: string): Promise<ProductInfo | null> {
  try {
    let productRecord = await prisma.product.findUnique({
      where: { id: Number(identifier) },
      include: {
        brand: true,
        productVariants: { where: { isActive: true } },
      },
    });

    if (!productRecord) {
      productRecord = await prisma.product.findUnique({
        where: { slug: identifier },
        include: {
          brand: true,
          productVariants: { where: { isActive: true } },
        },
      });
    }

    return productRecord ? formatProduct(productRecord as ProductWithRelations) : null;
  } catch (error) {
    console.error("getProduct error:", error);
    return null;
  }
}

export async function getProductsByCategory(categorySlug: string, limit = 5): Promise<ProductInfo[]> {
  try {
    const categoryQuery = categorySlug.replace(/-/g, " ");
    const products = await prisma.product.findMany({
      where: {
        OR: [{ category: { contains: categorySlug } }, { category: { contains: categoryQuery } }],
        isDeleted: false,
      },
      include: {
        brand: true,
        productVariants: { where: { isActive: true } },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return products.map((productRecord) => formatProduct(productRecord as ProductWithRelations));
  } catch (error) {
    console.error("getProductsByCategory error:", error);
    return [];
  }
}

export async function getRelatedProducts(productId: number, limit = 4): Promise<ProductInfo[]> {
  try {
    const sourceProduct = await prisma.product.findUnique({
      where: { id: Number(productId) },
      select: { category: true },
    });

    if (!sourceProduct) return [];

    const relatedProducts = await prisma.product.findMany({
      where: {
        category: sourceProduct.category,
        id: { not: productId },
        isDeleted: false,
      },
      include: {
        brand: true,
        productVariants: { where: { isActive: true } },
      },
      take: limit,
      orderBy: { soldCount: "desc" },
    });

    return relatedProducts.map((productRecord) => formatProduct(productRecord as ProductWithRelations));
  } catch (error) {
    console.error("getRelatedProducts error:", error);
    return [];
  }
}

export async function getTrendingProducts(limit = 5): Promise<ProductInfo[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        brand: true,
        productVariants: { where: { isActive: true } },
      },
      take: limit,
      orderBy: { soldCount: "desc" },
    });

    return products.map((productRecord) => formatProduct(productRecord as ProductWithRelations));
  } catch (error) {
    console.error("getTrendingProducts error:", error);
    return [];
  }
}

export async function getFlashSaleProducts(limit = 5): Promise<FlashSaleInfo | null> {
  try {
    const now = new Date();

    const flashSale = await prisma.flashsalecampaign.findFirst({
      where: {
        startAt: { lte: now },
        endAt: { gte: now },
        isActive: true,
      },
      include: {
        products: {
          include: { product: true },
          take: limit,
        },
      },
    });

    if (!flashSale) return null;

    const products = flashSale.products.map((item) => {
      const originalPrice = item.product.originalPrice ?? item.product.price;
      const discount = originalPrice > 0 ? ((originalPrice - item.flashSalePrice) / originalPrice) * 100 : 0;

    return {
      id: item.product.id,
      name: item.product.name,
      salePrice: item.flashSalePrice,
      originalPrice,
      inventory: item.stockLimit ?? item.product.inventory,
      discount,
    };
  });

  const averageDiscount = products.length
    ? Math.round(products.reduce((sum, item) => sum + item.discount, 0) / products.length)
    : 0;

  return {
    id: flashSale.id,
    name: flashSale.name,
    startTime: flashSale.startAt,
    endTime: flashSale.endAt,
    discount: averageDiscount,
    products: products.map(({ discount: _discount, ...item }) => item),
  };
  } catch (error) {
    console.error("getFlashSaleProducts error:", error);
    return null;
  }
}

export async function getShippingInfo(location?: string): Promise<ShippingInfo> {
  return {
    zone: location || "domestic",
    standardDays: 5,
    expressDays: 2,
    standardFee: DEFAULT_SHIPPING_FEE_USD,
    expressFee: EXPRESS_SHIPPING_FEE_USD,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD_USD,
  };
}

export async function getActivePromotions() {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        endDate: { gte: now },
      },
      take: 5,
      orderBy: { endDate: "asc" },
    });

    const flashSale = await getFlashSaleProducts();

    return {
      coupons: coupons.map((coupon) => ({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        endDate: coupon.endDate,
      })),
      flashSale: flashSale
      ? {
          name: flashSale.name,
          discount: flashSale.discount,
          endsAt: flashSale.endTime,
        }
      : null,
  };
  } catch (error) {
    console.error("getActivePromotions error:", error);
    return { coupons: [], flashSale: null };
  }
}

export async function getCategories() {
  try {
    const groups = await prisma.product.groupBy({
      by: ["category"],
      where: { isDeleted: false },
      _count: { id: true },
      orderBy: { category: "asc" },
    });

    return groups.map((group) => ({
      id: group.category,
      name: group.category,
      slug: slugify(group.category),
      productCount: group._count.id,
    }));
  } catch (error) {
    console.error("getCategories error:", error);
    return [];
  }
}

export async function getBrands() {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    return brands.map((brandRecord) => ({
      id: brandRecord.id,
      name: brandRecord.name,
      logo: brandRecord.logo,
      productCount: brandRecord._count.products,
    }));
  } catch (error) {
    console.error("getBrands error:", error);
    return [];
  }
}

export async function getOrderStatus(orderId: number, userId?: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: Number(orderId),
        ...(userId ? { userId: Number(userId) } : {}),
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      items: order.orderItems.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      timeline: order.events.map((event) => ({
        status: event.status,
        createdAt: event.createdAt,
      })),
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
    };
  } catch (error) {
    console.error("getOrderStatus error:", error);
    return null;
  }
}
