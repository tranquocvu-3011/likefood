"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProductEditor from "@/components/admin/ProductEditor";

const EMPTY_PRODUCT = {
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  price: "",
  originalPrice: "",
  salePrice: "",
  category: "",
  categoryId: 0,
  weight: "",
  weightEn: "",
  inventory: "9999",
  inStock: true,
  image: "",
  images: [] as string[],
  featured: false,
  badgeText: "",
  badgeTextEn: "",
  tags: "",
  isOnSale: false,
  isVisible: true,
};

export default function NewProductPage() {
  const router = useRouter();

  return (
    <ProductEditor
      mode="create"
      initialValues={EMPTY_PRODUCT}
      onSubmit={async (payload) => {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(data?.error || "Không thể tạo sản phẩm.");
          return;
        }

        toast.success("Đã tạo sản phẩm.");
        router.push(`/admin/products/${data.id}/edit`);
      }}
    />
  );
}
