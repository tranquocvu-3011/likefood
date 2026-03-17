"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChefHat,
  Loader2,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/admin/ImageUpload";
import { formatPrice } from "@/lib/currency";

interface AdminCategory {
  id: number;
  name: string;
  slug: string;
}

interface AiInsights {
  benefits: string[];
  origin: string;
  howToUse: string;
  seoTitle: string;
  seoDescription: string;
}

interface VariantRecord {
  id: number;
  weight: string | null;
  flavor: string | null;
  priceAdjustment: number;
  stock: number;
  sku: string | null;
  isActive: boolean;
}

interface ProductSubmitPayload {
  name: string;
  nameEn: string | null;
  description: string;
  descriptionEn: string | null;
  price: number;
  originalPrice: number | null;
  salePrice: number | null;
  category: string;
  categoryId: string | null;
  weight: string | null;
  weightEn: string | null;
  inventory: number;
  image: string | null;
  images: string[];
  featured: boolean;
  badgeText: string | null;
  badgeTextEn: string | null;
  tags: string | null;
  isOnSale: boolean;
  isVisible: boolean;
}

interface ProductEditorProps {
  mode: "create" | "edit";
  productId?: number;
  initialValues: {
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    price: string;
    originalPrice: string;
    salePrice: string;
    category: string;
    categoryId: number;
    weight: string;
    weightEn: string;
    inventory: string;
    inStock: boolean;
    image: string;
    images: string[];
    featured: boolean;
    badgeText: string;
    badgeTextEn: string;
    tags: string;
    isOnSale: boolean;
    isVisible: boolean;
  };
  initialVariants?: VariantRecord[];
  onSubmit: (payload: ProductSubmitPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const EMPTY_VARIANT = {
  weight: "",
  flavor: "",
  priceAdjustment: "0",
  stock: "0",
  sku: "",
  isActive: true,
};

export default function ProductEditor({
  mode,
  productId,
  initialValues,
  initialVariants = [],
  onSubmit,
  onDelete,
}: ProductEditorProps) {
  const [formData, setFormData] = useState(initialValues);
  const [variants, setVariants] = useState<VariantRecord[]>(initialVariants);
  const [variantDraft, setVariantDraft] = useState(EMPTY_VARIANT);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingVariant, setEditingVariant] = useState(EMPTY_VARIANT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  const [variantBusyId, setVariantBusyId] = useState<string | null>(null);
  const [adminCategories, setAdminCategories] = useState<AdminCategory[]>([]);

  // Fetch live categories from admin API
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: unknown) => {
        if (Array.isArray(data)) setAdminCategories(data as AdminCategory[]);
      })
      .catch(() => {
        // Silent fail — editor still works without live categories
      });
  }, []);

  const currentCategory = useMemo(
    () => adminCategories.find((c) => c.id === formData.categoryId),
    [adminCategories, formData.categoryId]
  );
  const basePrice = Number.parseFloat(formData.price) || 0;
  const tagCount = formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean).length;

  const updateField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): ProductSubmitPayload | null => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.categoryId) {
      toast.error("Tên, mô tả và danh mục là bắt buộc.");
      return null;
    }

    const parsedPrice = Number.parseFloat(formData.price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Vui lòng nhập giá cơ bản hợp lệ.");
      return null;
    }

    // Inventory: depends on inStock toggle
    // If inStock=false → 0, if inStock=true use numeric value (default to 9999 if 0)
    let inventory: number;
    if (!formData.inStock) {
      inventory = 0;
    } else {
      const parsed = Number.parseInt(formData.inventory, 10);
      inventory = Number.isNaN(parsed) || parsed < 0 ? 9999 : parsed === 0 ? 9999 : parsed;
    }

    const categoryName = currentCategory?.name || formData.category;

    return {
      name: formData.name.trim(),
      nameEn: formData.nameEn.trim() || null,
      description: formData.description.trim(),
      descriptionEn: formData.descriptionEn.trim() || null,
      price: parsedPrice,
      originalPrice: formData.originalPrice ? Number.parseFloat(formData.originalPrice) : null,
      salePrice: formData.salePrice ? Number.parseFloat(formData.salePrice) : null,
      category: categoryName,
      categoryId: formData.categoryId ? String(formData.categoryId) : null,
      weight: formData.weight.trim() || null,
      weightEn: formData.weightEn.trim() || null,
      inventory,
      image: formData.images.length > 0 ? formData.images[0].trim() : (formData.image.trim() || null),
      images: formData.images.filter((url) => url.trim() !== ""),
      featured: formData.featured,
      badgeText: formData.badgeText.trim() || null,
      badgeTextEn: formData.badgeTextEn.trim() || null,
      tags: formData.tags.trim() || null,
      isOnSale: formData.isOnSale,
      isVisible: formData.isVisible,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm("Xóa sản phẩm này? Hành động này không thể hoàn tác.")) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name.trim() || !formData.categoryId) {
      toast.error("Vui lòng nhập tên và danh mục trước khi dùng AI.");
      return;
    }

    setIsGenerating(true);
    setAiInsights(null);
    try {
      const response = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: currentCategory?.name || formData.category,
          features: aiBrief.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Không thể tạo nội dung AI lúc này.");

      setFormData((prev) => ({
        ...prev,
        description: data.description || prev.description,
        tags: !prev.tags && Array.isArray(data.tags) && data.tags.length > 0 ? data.tags.join(", ") : prev.tags,
      }));

      setAiInsights({
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
        origin: data.origin || "",
        howToUse: data.howToUse || "",
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
      });
      toast.success("AI đã tạo nội dung mới cho sản phẩm.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo nội dung AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addVariant = async () => {
    if (!productId) return;
    setVariantBusyId("new");
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: variantDraft.weight || null,
          flavor: variantDraft.flavor || null,
          priceAdjustment: Number.parseFloat(variantDraft.priceAdjustment) || 0,
          stock: Number.parseInt(variantDraft.stock, 10) || 0,
          sku: variantDraft.sku || null,
          isActive: variantDraft.isActive,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Không thể thêm biến thể.");
      setVariants((prev) => [data, ...prev]);
      setVariantDraft(EMPTY_VARIANT);
      toast.success("Đã tạo biến thể.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thêm biến thể.");
    } finally {
      setVariantBusyId(null);
    }
  };

  const saveVariant = async (variantId: string) => {
    if (!productId) return;
    setVariantBusyId(variantId);
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: editingVariant.weight || null,
          flavor: editingVariant.flavor || null,
          priceAdjustment: Number.parseFloat(editingVariant.priceAdjustment) || 0,
          stock: Number.parseInt(editingVariant.stock, 10) || 0,
          sku: editingVariant.sku || null,
          isActive: editingVariant.isActive,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Không thể cập nhật biến thể.");
      setVariants((prev) => prev.map((variant) => (String(variant.id) === String(variantId) ? data : variant)));
      setEditingVariantId(null);
      toast.success("Đã cập nhật biến thể.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật biến thể.");
    } finally {
      setVariantBusyId(null);
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!productId) return;
    if (!window.confirm("Xóa biến thể này?")) return;

    setVariantBusyId(variantId);
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Không thể xóa biến thể.");
      setVariants((prev) => prev.filter((variant) => String(variant.id) !== String(variantId)));
      toast.success(data?.message || "Đã xóa biến thể.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa biến thể.");
    } finally {
      setVariantBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-zinc-100">
            <ArrowLeft className="h-4 w-4" />
            Quay lại sản phẩm
          </Link>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-50">{mode === "create" ? "Tạo sản phẩm" : "Chỉnh sửa sản phẩm"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Tạo hồ sơ sản phẩm dễ trình bày, dễ định giá và dễ bảo trì.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onDelete ? (
            <Button type="button" variant="outline" size="lg" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Xóa
            </Button>
          ) : null}
          <Button type="submit" form="product-editor-form" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Tạo sản phẩm" : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <form id="product-editor-form" onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-8">
          <Card className="rounded-[2.25rem] border border-zinc-700/50 bg-[#111113]">
            <CardContent className="space-y-6 p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Thông tin cơ bản</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">Thông tin sản phẩm</h2>
                </div>
                {currentCategory ? <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">{currentCategory.name}</span> : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="🇻🇳 Tên sản phẩm" required className="md:col-span-2">
                  <input value={formData.name} onChange={(event) => updateField("name", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800" placeholder="Ví dụ: Khô cá lóc premium" />
                </Field>
                <Field label="🇺🇸 Product Name (EN)" className="md:col-span-2">
                  <input value={formData.nameEn} onChange={(event) => updateField("nameEn", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-blue-500/50 focus:bg-zinc-800" placeholder="Example: Premium dried snakehead fish" />
                </Field>
                <Field label="Danh mục" required>
                  <select
                    value={formData.categoryId}
                    onChange={(event) => {
                      const id = event.target.value;
                      const cat = adminCategories.find((c) => String(c.id) === String(id));
                      updateField("categoryId", Number(id));
                      updateField("category", cat?.name || "");
                    }}
                    className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800"
                  >
                    <option value="">
                      {adminCategories.length === 0 ? "Đang tải danh mục..." : "Chọn danh mục"}
                    </option>
                    {adminCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="space-y-3">
                  <Field label="🇻🇳 Quy cách / trọng lượng">
                    <input value={formData.weight} onChange={(event) => updateField("weight", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800" placeholder="500g, 1kg, hộp quà" />
                  </Field>
                  <Field label="🇺🇸 Weight / Size (EN)">
                    <input value={formData.weightEn} onChange={(event) => updateField("weightEn", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-blue-500/50 focus:bg-zinc-800" placeholder="500g, 1kg, gift box" />
                  </Field>
                </div>
                <Field label="🇻🇳 Mô tả" required className="md:col-span-2">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-medium text-zinc-500">Mô tả xuất xứ, hương vị, cách dùng, bảo quản và lý do nên mua.</p>
                      <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="h-3.5 w-3.5" />}
                        Nháp AI
                      </button>
                    </div>
                    <textarea rows={8} value={formData.description} onChange={(event) => updateField("description", event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4 font-medium text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800" placeholder="Mô tả điểm đặc biệt, đối tượng phù hợp và cách định vị sản phẩm." />
                    <textarea rows={3} value={aiBrief} onChange={(event) => setAiBrief(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4 font-medium text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800 text-sm" placeholder="Nháp AI tùy chọn: xuất xứ, đối tượng, ghi chú hương vị, quà tặng, cách dùng tốt nhất..." />
                  </div>
                </Field>
                <Field label="🇺🇸 Description (EN)" className="md:col-span-2">
                  <textarea rows={6} value={formData.descriptionEn} onChange={(event) => updateField("descriptionEn", event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4 font-medium text-zinc-100 outline-none transition-colors focus:border-blue-500/50 focus:bg-zinc-800" placeholder="Product description in English — origin, flavor profile, how to use, storage, why buy." />
                </Field>
              </div>

              {aiInsights ? (
                <div className="rounded-[1.75rem] border border-emerald-500/30 bg-emerald-500/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400"><Sparkles className="h-3.5 w-3.5" />Gợi ý từ AI</div>
                    <button type="button" onClick={() => setAiInsights(null)} className="text-zinc-500 transition hover:text-zinc-300"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <InsightBlock icon={MapPin} label="Xuất xứ" value={aiInsights.origin} />
                    <InsightBlock icon={ChefHat} label="Cách dùng" value={aiInsights.howToUse} />
                  </div>
                  {aiInsights.benefits.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{aiInsights.benefits.map((benefit) => <span key={benefit} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400">{benefit}</span>)}</div> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[2.25rem] border border-zinc-700/50 bg-[#111113]">
            <CardContent className="space-y-6 p-6 lg:p-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Giá & tồn kho</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">Quản lý thương mại</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Giá cơ bản (USD)" required><input type="number" min="0" step="0.01" value={formData.price} onChange={(event) => updateField("price", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800" placeholder="29.00" /></Field>
                <Field label="Số lượng tồn kho">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.inventory}
                    onChange={(event) => updateField("inventory", event.target.value)}
                    disabled={!formData.inStock}
                    className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="100"
                  />
                </Field>
                <Field label="Giá gốc (không bắt buộc)"><input type="number" min="0" step="0.01" value={formData.originalPrice} onChange={(event) => updateField("originalPrice", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800" placeholder="35.00" /></Field>
                <Field label="Giá khuyến mãi (không bắt buộc)"><input type="number" min="0" step="0.01" value={formData.salePrice} onChange={(event) => updateField("salePrice", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800" placeholder="25.00" /></Field>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <MetricTile label="Giá cơ bản" value={formatPrice(basePrice)} />
                <MetricTile label="Trạng thái KM" value={formData.isOnSale ? "Đang áp dụng" : "Tắt"} />
                <MetricTile label="Số tag" value={`${tagCount}`} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ToggleRow
                  title="Còn hàng"
                  description="Bật: sản phẩm có thể đặt mua. Tắt: hiển thị Hết hàng (tồn kho = 0)."
                  checked={formData.inStock}
                  onChange={(checked) => {
                    updateField("inStock", checked);
                    if (!checked) updateField("inventory", "0");
                    else if (parseInt(formData.inventory, 10) <= 0) updateField("inventory", "9999");
                  }}
                />
                <ToggleRow title="Hiển thị trên cửa hàng" description="Tắt để ẩn sản phẩm khỏi giao diện người mua." checked={formData.isVisible} onChange={(checked) => updateField("isVisible", checked)} />
                <ToggleRow title="Đánh dấu nổi bật" description="Hiển thị sản phẩm ở các vị trí nổi bật." checked={formData.featured} onChange={(checked) => updateField("featured", checked)} />
                <ToggleRow title="Hiển thị khuyến mãi" description="Nếu bật và có giá KM, sản phẩm sẽ hiển thị giá khuyến mãi." checked={formData.isOnSale} onChange={(checked) => updateField("isOnSale", checked)} />
              </div>
            </CardContent>
          </Card>

          {productId ? (
            <Card className="rounded-[2.25rem] border border-zinc-700/50 bg-[#111113]">
              <CardContent className="space-y-6 p-6 lg:p-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Biến thể</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">Quản lý biến thể</h2>
                  </div>
                  <div className="rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">{variants.length} biến thể</div>
                </div>

                <div className="grid gap-4 rounded-[1.75rem] border border-zinc-700/50 bg-zinc-900/50 p-4 md:grid-cols-2 xl:grid-cols-6">
                  <MiniInput label="Trọng lượng" value={variantDraft.weight} onChange={(value) => setVariantDraft((prev) => ({ ...prev, weight: value }))} placeholder="500g" />
                  <MiniInput label="Hương vị" value={variantDraft.flavor} onChange={(value) => setVariantDraft((prev) => ({ ...prev, flavor: value }))} placeholder="Original" />
                  <MiniInput label="Điều chỉnh giá" value={variantDraft.priceAdjustment} onChange={(value) => setVariantDraft((prev) => ({ ...prev, priceAdjustment: value }))} placeholder="0" type="number" />
                  <MiniInput label="Tồn kho" value={variantDraft.stock} onChange={(value) => setVariantDraft((prev) => ({ ...prev, stock: value }))} placeholder="0" type="number" />
                  <MiniInput label="SKU" value={variantDraft.sku} onChange={(value) => setVariantDraft((prev) => ({ ...prev, sku: value }))} placeholder="SKU-001" />
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Hành động</p>
                    <Button type="button" size="sm" onClick={addVariant} disabled={variantBusyId === "-1"} className="w-full justify-center">
                      {variantBusyId === "-1" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Thêm
                    </Button>
                  </div>
                </div>

                {variants.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-sm leading-6 text-zinc-500">Thêm biến thể khi sản phẩm có nhiều kích thước, hương vị hoặc mức giá khác nhau.</div>
                ) : (
                  <div className="space-y-3">
                    {variants.map((variant) => {
                      const isEditing = editingVariantId === variant.id;
                      const busy = variantBusyId === String(variant.id);
                      return (
                        <div key={variant.id} className="rounded-[1.5rem] border border-zinc-700/50 bg-[#111113] p-4">
                          {isEditing ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                              <MiniInput label="Trọng lượng" value={editingVariant.weight} onChange={(value) => setEditingVariant((prev) => ({ ...prev, weight: value }))} placeholder="500g" />
                              <MiniInput label="Hương vị" value={editingVariant.flavor} onChange={(value) => setEditingVariant((prev) => ({ ...prev, flavor: value }))} placeholder="Original" />
                              <MiniInput label="Điều chỉnh giá" value={editingVariant.priceAdjustment} onChange={(value) => setEditingVariant((prev) => ({ ...prev, priceAdjustment: value }))} placeholder="0" type="number" />
                              <MiniInput label="Tồn kho" value={editingVariant.stock} onChange={(value) => setEditingVariant((prev) => ({ ...prev, stock: value }))} placeholder="0" type="number" />
                              <MiniInput label="SKU" value={editingVariant.sku} onChange={(value) => setEditingVariant((prev) => ({ ...prev, sku: value }))} placeholder="SKU-001" />
                              <div className="flex items-end gap-2">
                                <Button type="button" size="sm" onClick={() => saveVariant(String(variant.id))} disabled={busy} className="flex-1">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Lưu</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setEditingVariantId(null)}>Hủy</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                <VariantStat label="Trọng lượng" value={variant.weight || "-"} />
                                <VariantStat label="Hương vị" value={variant.flavor || "-"} />
                                <VariantStat label="Điều chỉnh giá" value={formatPrice(variant.priceAdjustment)} />
                                <VariantStat label="Tồn kho" value={`${variant.stock}`} />
                                <VariantStat label="SKU" value={variant.sku || "-"} />
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${variant.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-400"}`}>{variant.isActive ? "Hoạt động" : "Ẩn"}</span>
                                <Button type="button" size="sm" variant="outline" onClick={() => { setEditingVariantId(variant.id); setEditingVariant({ weight: variant.weight || "", flavor: variant.flavor || "", priceAdjustment: String(variant.priceAdjustment ?? 0), stock: String(variant.stock ?? 0), sku: variant.sku || "", isActive: variant.isActive }); }}>Sửa</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => deleteVariant(String(variant.id))} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Xóa</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-8 xl:sticky xl:top-8 xl:self-start">
          <Card className="rounded-[2.25rem] border border-zinc-700/50 bg-[#111113]">
            <CardContent className="space-y-6 p-6 lg:p-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Trình bày sản phẩm</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">Nhãn & tìm kiếm</h2>
              </div>
              <Field label="🇻🇳 Nhãn hiệu"><input value={formData.badgeText} onChange={(event) => updateField("badgeText", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800" placeholder="Bán chạy, Mới, Giới hạn" /></Field>
              <Field label="🇺🇸 Badge (EN)"><input value={formData.badgeTextEn} onChange={(event) => updateField("badgeTextEn", event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-blue-500/50 focus:bg-zinc-800" placeholder="Best seller, New, Limited" /></Field>
              <Field label="Thẻ tag"><textarea rows={4} value={formData.tags} onChange={(event) => updateField("tags", event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4 font-medium text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800" placeholder="giftable, premium, ready-to-serve" /></Field>
              <div className="rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 p-4 text-sm leading-6 text-zinc-400">
                <p className="font-black text-zinc-100">Xem trước</p>
                <p className="mt-2">Danh mục: {currentCategory?.name || formData.category || "Chưa phân loại"}</p>
                <p>Tồn kho: {formData.inStock ? (formData.inventory || "9999") : "0 (Hết hàng)"}</p>
                <p>Hiển thị: {formData.isVisible ? "Công khai" : "Đã ẩn"}</p>
                <p>Nổi bật: {formData.featured ? "Có" : "Không"}</p>
                <p>Đang KM: {formData.isOnSale ? "Có" : "Không"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.25rem] border border-zinc-700/50 bg-[#111113]">
            <CardContent className="space-y-6 p-6 lg:p-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Hình ảnh</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">Quản lý hình ảnh</h2>
                <p className="mt-1 text-xs text-zinc-500">Kéo thả để sắp xếp · Ảnh đầu tiên sẽ là ảnh đại diện sản phẩm</p>
              </div>
              <ImageUpload
                value={formData.images}
                onChange={(imgs) => {
                  updateField("images", imgs);
                  updateField("image", imgs.length > 0 ? imgs[0] : "");
                }}
                onRemove={(url) => {
                  const filtered = formData.images.filter((item) => item !== url);
                  updateField("images", filtered);
                  updateField("image", filtered.length > 0 ? filtered[0] : "");
                }}
                multiple
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return <div className={className}><label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}{required ? " *" : ""}</label>{children}</div>;
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[1.5rem] border border-zinc-700 bg-zinc-800 p-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</p><p className="mt-2 text-lg font-black text-zinc-50">{value}</p></div>;
}

function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
      <div className="flex-1 min-w-0">
        <p className="font-black text-zinc-100">{title}</p>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${checked ? "bg-emerald-500" : "bg-zinc-700"}`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${checked ? "translate-x-7" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

function InsightBlock({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  if (!value) return null;
  return <div className="rounded-[1.35rem] border border-zinc-700/50 bg-zinc-900/50 p-4"><div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500"><Icon className="h-3.5 w-3.5 text-emerald-500" />{label}</div><p className="mt-2 text-sm leading-6 text-zinc-300">{value}</p></div>;
}

function MiniInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <div className="space-y-2"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</p><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:bg-zinc-800 h-11" placeholder={placeholder} /></div>;
}

function VariantStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[1.15rem] border border-zinc-700 bg-zinc-800 px-3 py-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{label}</p><p className="mt-1 text-sm font-black text-zinc-50">{value}</p></div>;
}