"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";

type PostFormData = {
    id?: number;
    title: string;
    summary: string;
    content: string;
    image: string;
    galleryImages: string[];
    authorName: string;
    category: string;
    isPublished: boolean;
    publishedAt: string;
};

interface PostFormProps {
    initialData?: Partial<PostFormData> & {
        images?: Array<{ imageUrl: string; order: number }>;
    };
}

export default function PostForm({ initialData }: PostFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<PostFormData>({
        title: initialData?.title || "",
        summary: initialData?.summary || "",
        content: initialData?.content || "",
        image: initialData?.image || "",
        galleryImages: initialData?.images?.map((img) => img.imageUrl) || initialData?.galleryImages || [],
        authorName: initialData?.authorName || "LIKEFOOD",
        category: initialData?.category || "Tin tức",
        isPublished: initialData?.isPublished ?? true,
        publishedAt: initialData?.publishedAt ? new Date(initialData.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = initialData?.id ? `/api/admin/posts/${initialData.id}` : "/api/admin/posts";
            const method = initialData?.id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(initialData?.id ? "Cập nhật bài viết thành công" : "Tạo bài viết thành công");
                router.push("/admin/posts");
                router.refresh();
            } else {
                const error = await res.json();
                toast.error(error.error || "Có lỗi xảy ra");
            }
        } catch {
            toast.error("Không thể kết nối máy chủ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/posts"
                        className="inline-flex items-center gap-2 text-zinc-300 hover:text-emerald-400 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-bold">Quay lại danh sách</span>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-100">
                        {initialData?.id ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="border border-zinc-700 bg-zinc-900/95 shadow-2xl shadow-black/30">
                    <CardContent className="p-8 lg:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                    Tiêu đề bài viết *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                                    placeholder="Ví dụ: Bí quyết chọn khô cá lóc ngon"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                    Tóm tắt ngắn gọn
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.summary}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium resize-none"
                                    placeholder="Mô tả ngắn gọn về nội dung bài viết..."
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                    Nội dung chi tiết *
                                </label>
                                <textarea
                                    required
                                    rows={15}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium resize-none font-mono text-sm"
                                    placeholder="Nhập nội dung bài viết (hỗ trợ Markdown)..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                    Tác giả
                                </label>
                                <input
                                    type="text"
                                    value={formData.authorName}
                                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                    Danh mục
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                                >
                                    <option value="Tin tức">Tin tức</option>
                                    <option value="Khuyến mãi">Khuyến mãi</option>
                                    <option value="Cẩm nang">Cẩm nang</option>
                                    <option value="Sức khỏe">Sức khỏe</option>
                                    <option value="Hậu trường vận hành">Hậu trường vận hành</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                    Ngày đăng
                                </label>
                                <input
                                    type="date"
                                    value={formData.publishedAt}
                                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2 flex flex-col justify-center">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-300 mb-2">
                                    Trạng thái
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        checked={formData.isPublished}
                                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                        className="w-5 h-5 rounded border-zinc-600 bg-zinc-900 text-teal-500 focus:ring-teal-500 cursor-pointer"
                                    />
                                    <label htmlFor="isPublished" className="text-sm font-medium text-zinc-200 cursor-pointer">
                                        Công khai bài viết
                                    </label>
                                </div>
                            </div>

                            {/* Cover Image */}
                            <div className="md:col-span-2 space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                    Ảnh bìa bài viết *
                                </label>
                                <ImageUpload
                                    value={formData.image ? [formData.image] : []}
                                    onChange={(urls) => setFormData({ ...formData, image: urls[urls.length - 1] || "" })}
                                    onRemove={() => setFormData({ ...formData, image: "" })}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Gallery Images */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex items-center gap-3">
                                    <ImagePlus className="w-5 h-5 text-emerald-600" />
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                        Thư viện ảnh bài viết (nhiều ảnh)
                                    </label>
                                </div>
                                <p className="text-xs text-zinc-400 -mt-2">
                                    Thêm nhiều ảnh minh họa cho bài viết. Ảnh sẽ hiển thị dưới dạng gallery trong trang chi tiết.
                                </p>
                                <ImageUpload
                                    value={formData.galleryImages}
                                    onChange={(urls) => setFormData({ ...formData, galleryImages: urls })}
                                    onRemove={(url) => setFormData({ ...formData, galleryImages: formData.galleryImages.filter(u => u !== url) })}
                                    disabled={isSubmitting}
                                    multiple
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <Link href="/admin/posts" className="flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-16 rounded-full border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white"
                                >
                                    Hủy
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] h-16 rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-6 h-6 mr-2" />
                                        {initialData?.id ? "Lưu thay đổi" : "Đăng bài viết"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
