"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Camera, Trash2, Loader2, Edit, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

import type { Session } from "next-auth";

interface ProfileHeaderProps {
    session: Session | null;
    profileData: {
        name: string;
        phone: string;
        image: string;
    };
    isEditing: boolean;
    isLoading: boolean;
    isUploadingAvatar: boolean;
    onProfileDataChange: (data: { name: string; phone: string; image: string }) => void;
    onSetEditing: (editing: boolean) => void;
    onSave: () => void;
    onFetchProfile: () => void;
}

export function ProfileHeader({
    session,
    profileData,
    isEditing,
    isLoading,
    isUploadingAvatar,
    onProfileDataChange,
    onSetEditing,
    onSave,
    onFetchProfile,
}: ProfileHeaderProps) {
    const { language } = useLanguage();
    const { update: updateSession } = useSession();

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/user/avatar", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                onProfileDataChange({ ...profileData, image: data.image });
                if (session?.user) {
                    await updateSession({
                        user: {
                            ...session.user,
                            image: data.image,
                        },
                    });
                }
                toast.success(language === "vi" ? "Cập nhật ảnh đại diện thành công!" : "Avatar updated successfully!");
                onFetchProfile();
            } else {
                const error = await res.json();
                toast.error(error.error || (language === "vi" ? "Không thể tải ảnh lên" : "Failed to upload avatar"));
            }
        } catch (error) {
            logger.error("Failed to upload avatar", error as Error, { context: "profile-avatar-upload" });
            toast.error(language === "vi" ? "Tải ảnh lên thất bại. Vui lòng thử lại." : "Failed to upload avatar. Please try again.");
        }
    };

    const handleAvatarDelete = async () => {
        if (!confirm(language === "vi" ? "Bạn có chắc muốn xóa avatar?" : "Are you sure you want to delete your avatar?")) return;

        try {
            const res = await fetch("/api/user/avatar", {
                method: "DELETE",
            });

            if (res.ok) {
                onProfileDataChange({ ...profileData, image: "" });
                if (session?.user) {
                    await updateSession({
                        user: {
                            ...session.user,
                            image: null,
                        },
                    });
                }
                onFetchProfile();
            }
        } catch (error) {
            logger.error("Failed to delete avatar", error as Error, { context: "profile-page" });
        }
    };

    return (
        <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.5rem]">
            <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="w-36 h-36 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-xl overflow-hidden">
                            {profileData.image ? (
                                <Image
                                    src={profileData.image}
                                    alt={session?.user?.name || "Avatar"}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                    onError={() => {
                                        onProfileDataChange({ ...profileData, image: "" });
                                    }}
                                />
                            ) : (
                                <User className="w-16 h-16" />
                            )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={isUploadingAvatar}
                            />
                            {isUploadingAvatar ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <Camera className="w-6 h-6 text-white" />
                            )}
                        </label>
                        {profileData.image && (
                            <button
                                onClick={handleAvatarDelete}
                                className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        {isEditing ? (
                            <div className="space-y-4 w-full">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                        {language === "vi" ? "Họ và tên" : "Full name"}
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => onProfileDataChange({ ...profileData, name: e.target.value })}
                                        className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                        {language === "vi" ? "Số điện thoại" : "Phone number"}
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => onProfileDataChange({ ...profileData, phone: e.target.value })}
                                        className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={onSave}
                                        disabled={isLoading}
                                        className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Edit className="w-4 h-4 mr-2" />{language === "vi" ? "Lưu" : "Save"}</>}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            onSetEditing(false);
                                            onFetchProfile();
                                        }}
                                        variant="outline"
                                        className="flex-1 h-12 rounded-full"
                                    >
                                        {language === "vi" ? "Hủy" : "Cancel"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-slate-900 mb-3">
                                    {session?.user?.name || (language === "vi" ? "Khách hàng" : "Customer")}
                                </h1>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-medium mb-2">
                                    <Mail className="w-4 h-4" />
                                    {session?.user?.email || "Email"}
                                </div>
                                {profileData.phone && (
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-medium">
                                        <Phone className="w-4 h-4" />
                                        {profileData.phone}
                                    </div>
                                )}
                                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                    <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
                                        {session?.user?.role === "ADMIN" ? (language === "vi" ? "Quản trị viên" : "Admin") : (language === "vi" ? "Thành viên" : "Member")}
                                    </span>
                                </div>
                                <Button
                                    onClick={() => onSetEditing(true)}
                                    variant="outline"
                                    className="mt-6 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 font-bold"
                                >
                                    <Edit className="w-4 h-4" />
                                    {language === "vi" ? "Chỉnh sửa thông tin" : "Edit Profile"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
