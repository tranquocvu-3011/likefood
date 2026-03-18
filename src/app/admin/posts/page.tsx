"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Search, Edit, Trash2, X, Loader2,
    ChevronLeft, ChevronRight, FileText, Eye,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import ImageWithFallback from "@/components/shared/ImageWithFallback";

interface Post {
    id: number;
    title: string;
    slug: string;
    summary?: string;
    category?: string;
    image?: string;
    isPublished: boolean;
    publishedAt: string;
    createdAt: string;
}

const PAGE_SIZE = 10;

export default function AdminPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const debouncedSearch = useDebounce(search, 300);

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", PAGE_SIZE.toString());
            if (debouncedSearch) params.set("search", debouncedSearch);

            const res = await fetch(`/api/admin/posts?${params.toString()}`);
            const data = await res.json();
            setPosts(data.posts || []);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            console.error("Fetch posts error:", err);
            toast.error("Không thể tải danh sách bài viết");
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/posts/${deleteId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Xóa bài viết thành công");
                fetchPosts();
            } else {
                toast.error("Không thể xóa bài viết");
            }
        } catch {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100">Quản lý bài viết</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Quản lý nội dung tin tức và Blog trên hệ thống.</p>
                </div>
                <Link href="/admin/posts/new">
                    <Button className="px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-400 text-white font-semibold shadow-lg shadow-teal-500/20 gap-2">
                        <Plus className="w-4 h-4" /> Thêm bài viết
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-3">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tiêu đề, nội dung bài viết..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 pl-9 pr-8 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Posts Table */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-zinc-700/50 bg-zinc-900/50">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Bài viết</th>
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Danh mục</th>
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Trạng thái</th>
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Ngày đăng</th>
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-zinc-800 rounded-full w-3/4" /></td>
                                    </tr>
                                ))
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20">
                                        <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                        <p className="text-zinc-400 font-medium">Không tìm thấy bài viết nào</p>
                                    </td>
                                </tr>
                            ) : posts.map((post) => (
                                <tr key={post.id} className="group hover:bg-zinc-800/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden relative flex-shrink-0">
                                                {post.image && (
                                                    <ImageWithFallback
                                                        src={post.image}
                                                        fallbackSrc="/images/placeholder.jpg"
                                                        alt={post.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="48px"
                                                    />
                                                )}
                                            </div>
                                            <div className="max-w-md">
                                                <p className="font-semibold text-zinc-100 group-hover:text-teal-400 transition-colors line-clamp-1">{post.title}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    Slug: {post.slug}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md">
                                            {post.category || "Tin tức"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {post.isPublished ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase">
                                                Công khai
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-500 text-[10px] font-semibold uppercase">
                                                Nháp
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-zinc-400">
                                        {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1">
                                            <Link href={`/posts/${post.slug}`} target="_blank">
                                                <button className="p-2 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-emerald-400 transition-colors" title="Xem bài viết">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <Link href={`/admin/posts/${post.id}/edit`}>
                                                <button className="p-2 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-teal-400 transition-colors" title="Sửa">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(post.id)}
                                                className="p-2 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-700/50">
                        <p className="text-xs text-zinc-500">
                            Hiển thị {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} / {total} bài viết
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="h-8 w-8 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 mx-auto" />
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${page === i + 1
                                        ? "bg-teal-600 text-white"
                                        : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page >= totalPages}
                                className="h-8 w-8 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 mx-auto" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteId(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-[#18181B] rounded-xl border border-zinc-700 p-6 shadow-2xl max-w-md w-full z-10 text-center"
                        >
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                                <Trash2 className="w-7 h-7 text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Xóa bài viết?</h3>
                            <p className="text-zinc-500 text-sm mb-6">Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 h-10 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 font-medium"
                                    variant="outline"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 h-10 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold shadow-lg shadow-red-500/20"
                                >
                                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xóa ngay"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
