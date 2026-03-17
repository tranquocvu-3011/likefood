"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import PostForm from "@/components/admin/PostForm";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function EditPostPage({ params }: { params: { id: string } }) {
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/admin/posts/${params.id}`);
                const data = await res.json();
                setPost(data);
            } catch (error) {
                console.error("Fetch post error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="h-96 flex items-center justify-center text-zinc-400 font-bold">
                Không tìm thấy bài viết
            </div>
        );
    }

    return <PostForm initialData={post} />;
}
