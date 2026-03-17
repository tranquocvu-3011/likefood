"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Image as ImageIcon, Info, FileText } from "lucide-react";
import { toast } from "sonner";

interface BannerForm {
    imageUrl: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
}

export default function AdminCmsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<any>({});
    const [banner, setBanner] = useState<BannerForm>({
        imageUrl: "/banner.png",
        title: "",
        subtitle: "",
        ctaText: "",
        ctaLink: "/products",
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [settingsRes, bannersRes] = await Promise.all([
                fetch("/api/settings"),
                fetch("/api/banners?placement=home"),
            ]);

            const settingsJson = settingsRes.ok ? await settingsRes.json() : {};
            setSettings(settingsJson);

            if (bannersRes.ok) {
                const bannersJson = await bannersRes.json();
                const first = Array.isArray(bannersJson) && bannersJson.length > 0 ? bannersJson[0] : null;
                if (first) {
                    setBanner({
                        imageUrl: first.imageUrl || "/banner.png",
                        title: first.title || "",
                        subtitle: first.subtitle || "",
                        ctaText: first.ctaText || "",
                        ctaLink: first.ctaLink || "/products",
                    });
                } else {
                    setBanner((prev) => ({
                        ...prev,
                        title: settingsJson.HERO_TITLE || "",
                        subtitle: settingsJson.HERO_SUBTITLE || "",
                        ctaText: settingsJson.HERO_CTA_TEXT || "Mua ngay",
                        ctaLink: settingsJson.HERO_CTA_LINK || "/products",
                    }));
                }
            }
        } catch {
            toast.error("Không thể tải dữ liệu CMS");
        } finally {
            setIsLoading(false);
        }
    };

    const updateSetting = (key: string, value: string | number) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            const settingsPayload = {
                ...settings,
                HERO_TITLE: banner.title,
                HERO_SUBTITLE: banner.subtitle,
                HERO_CTA_TEXT: banner.ctaText,
                HERO_CTA_LINK: banner.ctaLink,
            };

            const settingsPromise = fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settingsPayload),
            });

            const bannerPromise = fetch("/api/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: banner.imageUrl,
                    title: banner.title || "Hương vị quê nhà ngay tầm tay bạn",
                    subtitle:
                        banner.subtitle ||
                        "LIKEFOOD mang đến hơn 100 loại đặc sản tinh túy nhất từ mọi miền Việt Nam đến tận nhà bạn tại Hoa Kỳ.",
                    ctaText: banner.ctaText || "Mua ngay",
                    ctaLink: banner.ctaLink || "/products",
                    placement: "home",
                    priority: 100,
                }),
            });

            const [settingsRes, bannerRes] = await Promise.all([settingsPromise, bannerPromise]);

            if (settingsRes.ok && bannerRes.ok) {
                toast.success("Đã lưu nội dung trang chủ & số liệu thành công");
            } else {
                toast.error("Lỗi khi lưu cấu hình CMS");
            }
        } catch {
            toast.error("Lỗi kết nối khi lưu CMS");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-zinc-500">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                <p className="text-xs font-black uppercase tracking-widest">Đang tải nội dung trang...</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-zinc-100 uppercase">
                        Trang & nội dung
                    </h1>
                    <p className="text-zinc-400 font-medium text-sm mt-1">
                        Quản lý hero banner trang chủ và các con số ấn tượng từ dữ liệu thực trong hệ thống.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wide shadow-lg shadow-teal-500/20 transition-all flex gap-2 shrink-0"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thay đổi
                </Button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Hero banner */}
                <div className="rounded-2xl border border-zinc-700/50 bg-[#111113] overflow-hidden">
                    <div className="bg-zinc-900/60 px-6 py-4 border-b border-zinc-700/50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-100">Hero banner trang chủ</p>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">Điều chỉnh nội dung hero giống với phần bạn đang thấy ngoài trang chủ.</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Ảnh banner (URL)</label>
                            <input
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                value={banner.imageUrl}
                                onChange={(e) => setBanner({ ...banner, imageUrl: e.target.value })}
                                placeholder="/banner.png hoặc URL đầy đủ"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tiêu đề lớn</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                    value={banner.title}
                                    onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                                    placeholder="Hương vị quê nhà ngay tầm tay bạn"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Nút kêu gọi hành động (CTA)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        className="col-span-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                        value={banner.ctaText}
                                        onChange={(e) => setBanner({ ...banner, ctaText: e.target.value })}
                                        placeholder="Mua ngay"
                                    />
                                    <input
                                        className="col-span-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                        value={banner.ctaLink}
                                        onChange={(e) => setBanner({ ...banner, ctaLink: e.target.value })}
                                        placeholder="/products"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Mô tả ngắn dưới tiêu đề</label>
                            <textarea
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all min-h-[90px] resize-none"
                                value={banner.subtitle}
                                onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })}
                                placeholder="LIKEFOOD mang đến hơn 100 loại đặc sản tinh túy nhất từ mọi miền Việt Nam..."
                            />
                        </div>
                    </div>
                </div>

                {/* Con số ấn tượng */}
                <div className="rounded-2xl border border-zinc-700/50 bg-[#111113] overflow-hidden">
                    <div className="bg-zinc-900/60 px-6 py-4 border-b border-zinc-700/50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <Info className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-100">Con số ấn tượng</p>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">Điều chỉnh các số liệu như 111+ sản phẩm, 5 danh mục, 24/7 hỗ trợ...</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Số sản phẩm hiển thị</label>
                                <input
                                    type="number"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                    value={settings.STAT_PRODUCTS_COUNT || 0}
                                    onChange={(e) => updateSetting("STAT_PRODUCTS_COUNT", Number(e.target.value || 0))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Số danh mục</label>
                                <input
                                    type="number"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                    value={settings.STAT_CATEGORIES_COUNT || 0}
                                    onChange={(e) => updateSetting("STAT_CATEGORIES_COUNT", Number(e.target.value || 0))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Số giờ hỗ trợ (vd: 24/7)</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                    value={settings.STAT_SUPPORT_TEXT || ""}
                                    onChange={(e) => updateSetting("STAT_SUPPORT_TEXT", e.target.value)}
                                    placeholder="24/7"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nội dung trang tĩnh */}
                <div className="rounded-2xl border border-zinc-700/50 bg-[#111113] overflow-hidden">
                    <div className="bg-zinc-900/60 px-6 py-4 border-b border-zinc-700/50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-100">Nội dung trang tĩnh</p>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">Chỉnh sửa nội dung các trang About, Chính sách vận chuyển, Bảo mật và Điều khoản.</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Câu chuyện About</label>
                                <textarea
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all min-h-[130px] resize-none"
                                    value={settings.ABOUT_STORY_TEXT || ""}
                                    onChange={(e) => updateSetting("ABOUT_STORY_TEXT", e.target.value)}
                                    placeholder="Nhập đoạn giới thiệu chính cho trang About..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Chính sách vận chuyển</label>
                                <textarea
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all min-h-[130px] resize-none"
                                    value={settings.SHIPPING_POLICY_CONTENT || ""}
                                    onChange={(e) => updateSetting("SHIPPING_POLICY_CONTENT", e.target.value)}
                                    placeholder="Nhập toàn bộ nội dung chính sách vận chuyển..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Chính sách bảo mật</label>
                                <textarea
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all min-h-[130px] resize-none"
                                    value={settings.PRIVACY_POLICY_CONTENT || ""}
                                    onChange={(e) => updateSetting("PRIVACY_POLICY_CONTENT", e.target.value)}
                                    placeholder="Nhập toàn bộ nội dung chính sách bảo mật..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Điều khoản dịch vụ</label>
                                <textarea
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all min-h-[130px] resize-none"
                                    value={settings.TERMS_OF_SERVICE_CONTENT || ""}
                                    onChange={(e) => updateSetting("TERMS_OF_SERVICE_CONTENT", e.target.value)}
                                    placeholder="Nhập toàn bộ nội dung điều khoản dịch vụ..."
                                />
                            </div>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                            Gợi ý: Copy nội dung hiện tại của các trang, chỉnh sửa rồi dán vào đây. Hệ thống sẽ tự hiển thị nội dung mới với định dạng đẹp.
                        </p>
                    </div>
                </div>

                {/* Menu & Footer Links */}
                <div className="rounded-2xl border border-zinc-700/50 bg-[#111113] overflow-hidden">
                    <div className="bg-zinc-900/60 px-6 py-4 border-b border-zinc-700/50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-100">Menu & footer links</p>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">Cấu hình menu chính (trên navbar) và các nhóm link ở footer bằng JSON.</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Menu chính trên navbar (NAV_PRIMARY_LINKS)</label>
                                <textarea
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all min-h-[160px] resize-none"
                                    value={settings.NAV_PRIMARY_LINKS || ""}
                                    onChange={(e) => updateSetting("NAV_PRIMARY_LINKS", e.target.value)}
                                    placeholder={`Ví dụ:\n[\n  { "label": "Trang chủ", "href": "/", "icon": "🏠", "highlight": false },\n  { "label": "Flash Sale", "href": "/products?sale=true", "icon": "🔥", "highlight": true }\n]`}
                                />
                                <p className="text-[11px] text-zinc-500">
                                    Danh sách JSON: <code className="text-teal-400">label</code>, <code className="text-teal-400">href</code>, <code className="text-teal-400">icon</code>, <code className="text-teal-400">highlight</code>.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Nhóm link dưới footer (FOOTER_LINK_GROUPS)</label>
                                <textarea
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all min-h-[160px] resize-none"
                                    value={settings.FOOTER_LINK_GROUPS || ""}
                                    onChange={(e) => updateSetting("FOOTER_LINK_GROUPS", e.target.value)}
                                    placeholder={`Ví dụ:\n[\n  {\n    "title": "Sản phẩm",\n    "links": [\n      { "label": "Tất cả đặc sản", "href": "/products" }\n    ]\n  }\n]`}
                                />
                                <p className="text-[11px] text-zinc-500">
                                    Để trống sẽ dùng các nhóm link mặc định trong footer.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

