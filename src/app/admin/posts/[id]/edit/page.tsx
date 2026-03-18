"use client";

import PostForm from "@/components/admin/PostForm";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditPostPage() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("Không tìm thấy ID bài viết trong URL");
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(`/api/admin/posts/${id}`, {
                    signal: controller.signal,
                    credentials: "same-origin",
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    setError(errData.error || `Lỗi ${res.status}: Không thể tải bài viết`);
                    return;
                }

                const data = await res.json();

                if (!data || !data.id) {
                    setError("Dữ liệu bài viết không hợp lệ (thiếu ID)");
                    return;
                }

                setPost(data);
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("Fetch post error:", err);
                    setError("Lỗi kết nối máy chủ");
                }
            } finally {
                setIsLoading(false);
            }
        })();

        return () => controller.abort();
    }, [id]);

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="space-y-4 mt-8">
                <div className="h-96 flex flex-col items-center justify-center text-zinc-400 font-bold bg-zinc-900 rounded-3xl border border-zinc-800 gap-4">
                    <p className="text-red-400 text-lg">{error || "Không tìm thấy bài viết"}</p>
                    <p className="text-zinc-500 text-sm">Post ID: {id}</p>
                    <a href="/admin/posts" className="mt-4 px-6 py-2 bg-zinc-700 rounded-xl text-zinc-200 hover:bg-zinc-600 transition-colors text-sm font-medium">
                        ← Quay lại danh sách
                    </a>
                </div>
            </div>
        );
    }

    return <PostForm key={`edit-post-${post.id}`} initialData={post} />;
}
