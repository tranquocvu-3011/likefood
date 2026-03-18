"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Enhanced Image Upload with Drag-Drop, Reorder, Preview
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Crown, Maximize2, GripVertical, ArrowUp } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    onRemove: (url: string) => void;
    disabled?: boolean;
    multiple?: boolean;
}

export default function ImageUpload({
    value = [],
    onChange,
    onRemove,
    disabled,
    multiple = false,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragCounterRef = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validUrls = value.filter((url) => typeof url === "string" && url.trim() !== "");

    const isFileDrag = useCallback((e: React.DragEvent) => {
        return e.dataTransfer.types.includes("Files");
    }, []);

    // Upload handler
    const uploadFiles = useCallback(
        async (files: FileList | File[]) => {
            const fileArr = Array.from(files);
            if (fileArr.length === 0) return;

            for (const file of fileArr) {
                if (!file.type.startsWith("image/")) {
                    toast.error(`File ${file.name} không phải là ảnh`);
                    return;
                }
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`File ${file.name} quá lớn (tối đa 10MB)`);
                    return;
                }
            }

            setIsUploading(true);
            const formData = new FormData();
            for (const file of fileArr) {
                formData.append("file", file);
            }

            try {
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                if (res.ok) {
                    const data = await res.json();
                    onChange([...value, ...data.urls]);
                    toast.success(`Upload thành công ${data.urls.length} ảnh`);
                } else {
                    const error = await res.json();
                    logger.error("Image upload failed", new Error(error.error || "Upload failed"), {
                        context: "image-upload-component",
                    });
                    toast.error(error.error || "Upload thất bại");
                }
            } catch (error) {
                logger.error("Image upload error", error as Error, { context: "image-upload-component" });
                toast.error("Đã có lỗi xảy ra khi upload");
            } finally {
                setIsUploading(false);
            }
        },
        [onChange, value]
    );

    const onFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                await uploadFiles(e.target.files);
                e.target.value = "";
            }
        },
        [uploadFiles]
    );

    // Drag-drop zone handlers
    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            if (disabled) return;

            // Only set drag over for file drops, not reordering
            if (isFileDrag(e)) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "copy";
                setIsDragOver(true);
            }
        },
        [disabled, isFileDrag]
    );

    const handleDragEnter = useCallback(
        (e: React.DragEvent) => {
            if (disabled || !isFileDrag(e)) return;
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current += 1;
            setIsDragOver(true);
        },
        [disabled, isFileDrag]
    );

    const handleDragLeave = useCallback(
        (e: React.DragEvent) => {
            if (!isFileDrag(e)) return;
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
            if (dragCounterRef.current === 0) {
                setIsDragOver(false);
            }
        },
        [isFileDrag]
    );

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = 0;
            setIsDragOver(false);
            if (disabled) return;

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                await uploadFiles(files);
            }
        },
        [disabled, uploadFiles]
    );

    // Reorder drag handlers
    const handleItemDragStart = (index: number) => {
        setDragIndex(index);
    };

    const handleItemDragOver = (e: React.DragEvent, index: number) => {
        if (isFileDrag(e)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (dragIndex !== null && dragIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleItemDrop = async (e: React.DragEvent, toIndex: number) => {
        if (isFileDrag(e)) {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer.files;
            if (files && files.length > 0 && !disabled) {
                dragCounterRef.current = 0;
                setIsDragOver(false);
                await uploadFiles(files);
            }
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        if (dragIndex === null || dragIndex === toIndex) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newList = [...validUrls];
        const [moved] = newList.splice(dragIndex, 1);
        newList.splice(toIndex, 0, moved);
        onChange(newList);

        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleItemDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    // Move to first (set as cover)
    const moveToFirst = (index: number) => {
        if (index === 0) return;
        const newList = [...validUrls];
        const [moved] = newList.splice(index, 1);
        newList.unshift(moved);
        onChange(newList);
        toast.success("Đã đặt làm ảnh đại diện");
    };

    return (
        <div className="space-y-4 w-full">
            {/* Drop zone area */}
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative rounded-2xl border-2 border-dashed transition-all duration-300
                    ${isDragOver
                        ? "border-teal-500 bg-teal-500/10 scale-[1.01]"
                        : "border-zinc-700 hover:border-zinc-600"
                    }
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
            >
                {/* Drag overlay */}
                {isDragOver && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-teal-500/15 backdrop-blur-sm">
                        <div className="text-center">
                            <Upload className="w-10 h-10 text-teal-400 mx-auto mb-2 animate-bounce" />
                            <p className="text-sm font-black uppercase tracking-widest text-teal-300">
                                Thả ảnh vào đây
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-4">
                    {/* Images grid */}
                    {validUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                            {validUrls.map((url, index) => (
                                <div
                                    key={url}
                                    draggable
                                    onDragStart={() => handleItemDragStart(index)}
                                    onDragOver={(e) => handleItemDragOver(e, index)}
                                    onDrop={(e) => handleItemDrop(e, index)}
                                    onDragEnd={handleItemDragEnd}
                                    className={`
                                        group relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200
                                        ${index === 0 ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-[#111113]" : "ring-1 ring-zinc-700"}
                                        ${dragIndex === index ? "opacity-40 scale-95" : ""}
                                        ${dragOverIndex === index ? "ring-2 ring-teal-400 scale-[1.03]" : ""}
                                    `}
                                >
                                    <Image
                                        fill
                                        className="object-cover"
                                        alt={`Ảnh sản phẩm ${index + 1}`}
                                        src={url}
                                        sizes="200px"
                                        unoptimized
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/images/placeholder.png";
                                        }}
                                    />

                                    {/* Cover badge */}
                                    {index === 0 && (
                                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-teal-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-lg">
                                            <Crown className="w-3 h-3" />
                                            Ảnh đại diện
                                        </div>
                                    )}

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="flex items-center gap-2">
                                            {/* Preview button */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewUrl(url);
                                                }}
                                                className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/30 flex items-center justify-center transition-colors"
                                                title="Xem ảnh lớn"
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                            </button>
                                            {/* Move to first */}
                                            {index !== 0 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveToFirst(index);
                                                    }}
                                                    className="w-9 h-9 rounded-lg bg-teal-500/80 backdrop-blur-md text-white hover:bg-teal-500 flex items-center justify-center transition-colors"
                                                    title="Đặt làm ảnh đại diện"
                                                >
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                            )}
                                            {/* Remove */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemove(url);
                                                }}
                                                className="w-9 h-9 rounded-lg bg-red-500/80 backdrop-blur-md text-white hover:bg-red-500 flex items-center justify-center transition-colors"
                                                title="Xóa ảnh"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Drag indicator */}
                                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-80 transition-opacity">
                                        <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                                    </div>

                                    {/* Number badge */}
                                    <div className="absolute bottom-2 right-2 z-10 w-6 h-6 rounded-md bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-[10px] font-bold">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload button */}
                    {!disabled && (multiple || validUrls.length === 0) && (
                        <label
                            className={`
                                flex flex-col items-center justify-center gap-3 py-6 cursor-pointer
                                rounded-xl border border-dashed border-zinc-700
                                hover:border-teal-500/50 hover:bg-teal-500/5 transition-all
                                ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                        >
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                                        <Upload className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                            Kéo thả ảnh hoặc nhấn để chọn
                                        </p>
                                        <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG, WebP · Tối đa 10MB</p>
                                    </div>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={onFileChange}
                                accept="image/*"
                                multiple={multiple}
                                disabled={disabled || isUploading}
                            />
                        </label>
                    )}

                    {validUrls.length === 0 && !isUploading && (
                        <div className="flex items-center gap-2 p-3 mt-2 bg-zinc-900/50 rounded-xl border border-zinc-700/50 text-zinc-500 text-xs font-medium">
                            <ImageIcon className="h-4 w-4 flex-shrink-0" />
                            <span>Chưa có ảnh. Kéo thả hoặc nhấn nút ở trên để thêm ảnh cho sản phẩm.</span>
                        </div>
                    )}

                    {validUrls.length > 0 && (
                        <p className="text-[10px] text-zinc-500 mt-2 text-center">
                            💡 Kéo thả để sắp xếp · Ảnh đầu tiên = Ảnh đại diện sản phẩm
                        </p>
                    )}
                </div>
            </div>

            {/* Preview Lightbox */}
            {previewUrl && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center cursor-pointer"
                    onClick={() => setPreviewUrl(null)}
                >
                    <button
                        type="button"
                        onClick={() => setPreviewUrl(null)}
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div
                        className="relative max-w-[90vw] max-h-[90vh] w-[800px] h-[600px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-contain"
                            sizes="90vw"
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
