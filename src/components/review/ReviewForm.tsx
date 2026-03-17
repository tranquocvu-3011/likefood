"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useCallback } from "react";
import Image from "next/image";
import { Star, Upload, X, Loader2, Image as ImageIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/context";
import { useSession } from "next-auth/react";

interface ReviewFormProps {
    productId: number;
    orderItemId: string;
    productName: string;
    productImage?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface MediaItem {
    id: number | string;
    url: string;
    type: "image" | "video";
    isUploading?: boolean;
}

export function ReviewForm({
    productId,
    orderItemId,
    productName,
    productImage,
    onSuccess,
    onCancel
}: ReviewFormProps) {
    const { language } = useLanguage();
    const { data: session, status } = useSession();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Handle file selection
    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const MAX_FILES = 5;
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB

        const remainingSlots = MAX_FILES - media.length;
        if (remainingSlots <= 0) {
            toast.error(language === "vi" ? "Chỉ được upload tối đa 5 ảnh/video" : "Maximum 5 images/videos allowed");
            return;
        }

        const filesToUpload = Array.from(files).slice(0, remainingSlots);

        // Validate files
        for (const file of filesToUpload) {
            if (file.size > MAX_SIZE) {
                toast.error(language === "vi" ? `File ${file.name} quá lớn (tối đa 10MB)` : `File ${file.name} is too large (max 10MB)`);
                return;
            }
        }

        setIsUploading(true);

        // Upload files
        for (const file of filesToUpload) {
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const isVideo = file.type.startsWith("video/");

            // Add placeholder
            setMedia(prev => [...prev, {
                id: tempId,
                url: URL.createObjectURL(file),
                type: isVideo ? "video" : "image",
                isUploading: true
            }]);

            try {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });

                if (!res.ok) {
                    throw new Error("Upload failed");
                }

                const data = await res.json();

                // Update with real URL
                setMedia(prev => prev.map(item =>
                    String(item.id) === String(tempId)
                        ? { ...item, url: data.url, isUploading: false }
                        : item
                ));
            } catch (_error) {
                // Remove failed upload
                setMedia(prev => prev.filter(item => String(item.id) !== String(tempId)));
                toast.error(language === "vi" ? `Upload ${file.name} thất bại` : `Failed to upload ${file.name}`);
            }
        }

        setIsUploading(false);
    }, [media, language]);

    // Remove media
    const removeMedia = (id: string) => {
        setMedia(prev => {
            const item = prev.find(m => String(m.id) === String(id));
            if (item && !String(item.id).startsWith("temp-")) {
                URL.revokeObjectURL(item.url);
            }
            return prev.filter(m => String(m.id) !== String(id));
        });
    };

    // Submit review
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error(language === "vi" ? "Vui lòng chọn số sao đánh giá" : "Please select a rating");
            return;
        }

        if (comment.trim().length < 10) {
            toast.error(language === "vi" ? "Vui lòng nhập đánh giá ít nhất 10 ký tự" : "Please enter at least 10 characters");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    orderItemId,
                    rating,
                    comment: comment.trim(),
                    mediaUrls: media.map(m => m.url)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit review");
            }

            toast.success(language === "vi" ? "Cảm ơn bạn đã đánh giá!" : "Thank you for your review!");
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : (language === "vi" ? "Có lỗi xảy ra" : "An error occurred"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center p-8 bg-slate-50 rounded-3xl">
                <p className="text-slate-600 font-medium mb-4">
                    {language === "vi" ? "Vui lòng đăng nhập để đánh giá" : "Please login to write a review"}
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                {productImage ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                        <Image
                            src={productImage}
                            alt={productName}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                )}
                <div className="flex-1">
                    <p className="font-bold text-slate-900 line-clamp-2">{productName}</p>
                    <p className="text-sm text-slate-500">
                        {language === "vi" ? "Đánh giá sản phẩm này" : "Review this product"}
                    </p>
                </div>
            </div>

            {/* Rating */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    {language === "vi" ? "Đánh giá của bạn *" : "Your rating *"}
                </label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                        >
                            <Star
                                className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-200"
                                    }`}
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm font-medium text-slate-500">
                        {rating > 0 && (
                            rating === 5 ? (language === "vi" ? "Tuyệt vời!" : "Excellent!") :
                                rating === 4 ? (language === "vi" ? "Rất tốt!" : "Very good!") :
                                    rating === 3 ? (language === "vi" ? "Tốt" : "Good") :
                                        rating === 2 ? (language === "vi" ? "Trung bình" : "Average") :
                                            (language === "vi" ? "Không hài lòng" : "Not satisfied")
                        )}
                    </span>
                </div>
            </div>

            {/* Comment */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    {language === "vi" ? "Nhận xét của bạn *" : "Your review *"}
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={language === "vi"
                        ? "Chia sẻ trải nghiệm của bạn với sản phẩm này..."
                        : "Share your experience with this product..."
                    }
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    maxLength={1000}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">
                    {comment.length}/1000
                </p>
            </div>

            {/* Media Upload */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    {language === "vi" ? "Thêm ảnh/video (tùy chọn)" : "Add photos/videos (optional)"}
                </label>
                <div className="grid grid-cols-5 gap-3">
                    {media.map((item) => (
                        <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                            {item.type === "video" ? (
                                <video src={item.url} className="w-full h-full object-cover" />
                            ) : (
                                <Image
                                    src={item.url}
                                    alt="Review media"
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                />
                            )}
                            {item.isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removeMedia(String(item.id))}
                                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {media.length < 5 && (
                        <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                            <Upload className="w-6 h-6 text-slate-400" />
                            <span className="text-xs text-slate-400 font-medium">
                                {language === "vi" ? "Upload" : "Upload"}
                            </span>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                disabled={isUploading}
                            />
                        </label>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    {language === "vi"
                        ? "Tối đa 5 ảnh/video, mỗi file tối đa 10MB"
                        : "Max 5 images/videos, each up to 10MB"
                    }
                </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 px-6 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-colors"
                    >
                        {language === "vi" ? "Hủy" : "Cancel"}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
                    className="flex-1 py-4 px-6 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {language === "vi" ? "Đang gửi..." : "Submitting..."}
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            {language === "vi" ? "Gửi đánh giá" : "Submit Review"}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

// Modal wrapper for review form
interface ReviewModalProps extends ReviewFormProps {
    isOpen: boolean;
}

export function ReviewModal({ isOpen, ...props }: ReviewModalProps) {
    const { language } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">
                    {language === "vi" ? "Viết đánh giá" : "Write a Review"}
                </h3>
                <ReviewForm {...props} />
            </div>
        </div>
    );
}
