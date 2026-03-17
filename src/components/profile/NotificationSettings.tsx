"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Card, CardContent } from "@/components/ui/card";
import { Bell, Mail } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface NotificationSettingsProps {
    notificationPrefs: {
        email: boolean;
        inApp: boolean;
    };
    onPrefChange: (key: "email" | "inApp", value: boolean) => void;
}

export function NotificationSettings({ notificationPrefs, onPrefChange }: NotificationSettingsProps) {
    const { language } = useLanguage();

    return (
        <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.5rem]">
            <CardContent className="p-8 md:p-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <Bell className="w-6 h-6 text-primary" />
                    {language === "vi" ? "Tùy chọn thông báo" : "Notification Preferences"}
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border-2 border-slate-100">
                        <div className="flex items-center gap-4">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="font-black text-slate-900">{language === "vi" ? "Thông báo qua Email" : "Email Notifications"}</p>
                                <p className="text-sm text-slate-500">{language === "vi" ? "Nhận thông báo về đơn hàng, khuyến mãi qua email" : "Receive order and promotion notifications via email"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onPrefChange("email", !notificationPrefs.email)}
                            className={`relative w-14 h-8 rounded-full transition-colors ${notificationPrefs.email ? "bg-primary" : "bg-slate-300"}`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${notificationPrefs.email ? "translate-x-6" : "translate-x-0"}`}
                            />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border-2 border-slate-100">
                        <div className="flex items-center gap-4">
                            <Bell className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="font-black text-slate-900">{language === "vi" ? "Thông báo trong ứng dụng" : "In-app Notifications"}</p>
                                <p className="text-sm text-slate-500">{language === "vi" ? "Hiển thị thông báo trong trang Notifications" : "Display notifications in the Notifications page"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onPrefChange("inApp", !notificationPrefs.inApp)}
                            className={`relative w-14 h-8 rounded-full transition-colors ${notificationPrefs.inApp ? "bg-primary" : "bg-slate-300"}`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${notificationPrefs.inApp ? "translate-x-6" : "translate-x-0"}`}
                            />
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
