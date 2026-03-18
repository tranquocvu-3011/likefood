"use client";

import PostForm from "@/components/admin/PostForm";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditPostPage() {
    const params = useParams();
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!params?.id) return;

        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/admin/posts/${params.id}`);
                const data = await res.json();
                
                if (!res.ok) {
                    setError(data.error || "Không thể tải dữ liệu bài viết");
                    setPost(null);
                } else {
                    setPost(data);
                }
            } catch (err) {
                console.error("Fetch post error:", err);
                setError("Lỗi kết nối máy chủ");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [params?.id]);

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="h-96 flex items-center justify-center text-zinc-400 font-bold bg-zinc-900 rounded-3xl mt-4 border border-zinc-800">
                {error || "Không tìm thấy bài viết"}
            </div>
        );
    }

    return <PostForm initialData={post} />;
}
