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
import { motion, AnimatePresence } from "framer-motion";
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
        <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 font-outfit">Quản lý bài viết</h1>
                    <p className="text-slate-500 font-medium">Quản lý nội dung tin tức và Blog trên hệ thống.</p>
                </div>
                <Link href="/admin/posts/new">
                    <Button className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30 gap-2">
                        <Plus className="w-5 h-5" /> Thêm bài viết
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tiêu đề, nội dung bài viết..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Posts Table */}
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400 font-outfit">Bài viết</th>
                                <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-slate-400 font-outfit">Danh mục</th>
                                <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-slate-400 font-outfit">Trạng thái</th>
                                <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-slate-400 font-outfit">Ngày đăng</th>
                                <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-slate-400 font-outfit">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-10"><div className="h-4 bg-slate-100 rounded-full w-3/4" /></td>
                                    </tr>
                                ))
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20">
                                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-400 font-bold">Không tìm thấy bài viết nào</p>
                                    </td>
                                </tr>
                            ) : posts.map((post) => (
                                <tr key={post.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden relative flex-shrink-0">
                                                {post.image && (
                                                    <ImageWithFallback
                                                        src={post.image}
                                                        fallbackSrc="/images/placeholder.jpg"
                                                        alt={post.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="56px"
                                                    />
                                                )}
                                            </div>
                                            <div className="max-w-md">
                                                <p className="font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{post.title}</p>
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">
                                                    Slug: {post.slug}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                            {post.category || "Tin tức"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {post.isPublished ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase border border-green-100">
                                                Công khai
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase border border-slate-100">
                                                Nháp
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-slate-500">
                                        {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1">
                                            <Link href={`/posts/${post.slug}`} target="_blank">
                                                <button className="p-2 rounded-xl hover:bg-white hover:shadow-lg transition-all text-slate-400 hover:text-emerald-500" title="Xem bài viết">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <Link href={`/admin/posts/${post.id}/edit`}>
                                                <button className="p-2 rounded-xl hover:bg-white hover:shadow-lg transition-all text-slate-400 hover:text-primary" title="Sửa">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(post.id)}
                                                className="p-2 rounded-xl hover:bg-white hover:shadow-lg transition-all text-slate-400 hover:text-red-500"
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
                    <div className="flex items-center justify-between px-8 py-6 border-t border-slate-50">
                        <p className="text-sm text-slate-400 font-bold">
                            Hiển thị {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} / {total} bài viết
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${page === i + 1
                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                        : "hover:bg-slate-100 text-slate-500"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page >= totalPages}
                                className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
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
                            className="relative bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full z-10 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Xóa bài viết?</h3>
                            <p className="text-slate-500 mb-8">Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 h-14 rounded-full bg-slate-100 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-200"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 h-14 rounded-full bg-red-500 text-white font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-500/30"
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
