"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Package, Sparkles, Ticket,
    LayoutDashboard, ChevronRight, RefreshCw, MapPin,
    Bell, Lock, Heart, User, Camera, Trash2, Mail, Phone, Edit, UserPlus
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/context";
import { toast } from "sonner";
import {
    AddressList,
    AddressForm,
    NotificationSettings,
    PriceAlertList,
    SecuritySection
} from "@/components/profile";

interface Address {
    id: number;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state?: string | null;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

type Tab = "overview" | "addresses" | "notifications" | "security";

export default function ProfilePage() {
        const { language } = useLanguage();
    const { data: session, status: sessionStatus, update } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [orderCount, setOrderCount] = useState(0);
    const [voucherCount, setVoucherCount] = useState(0);

    const [profileData, setProfileData] = useState({
        name: "",
        phone: "",
        image: "",
    });
    const [notificationPrefs, setNotificationPrefs] = useState({
        email: true,
        inApp: true,
    });
    const [priceAlerts, setPriceAlerts] = useState<Array<{
        productId: number;
        productSlug?: string;
        productName: string;
        productImage?: string;
        originalPrice: number;
        currentPrice: number;
        dropPercent: number;
    }>>([]);
    const [userPoints, setUserPoints] = useState(0);

    const profileT = (_key: string, viText: string, enText: string) => {
        return language === "vi" ? viText : enText;
    };

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login?callbackUrl=/profile");
            return;
        }

        if (sessionStatus === "authenticated" && session) {
            setProfileData({
                name: session.user.name || "",
                phone: "",
                image: session.user.image || "",
            });

            // Load all data in parallel with Promise.all
            Promise.all([
                fetchProfile(),
                fetchAddresses(),
                fetchPriceAlerts(),
                fetchPoints(),
                fetchOrderCount(),
                fetchVoucherCount(),
            ]);

            // Load notification preferences from localStorage
            const savedPrefs = localStorage.getItem("notification_preferences");
            if (savedPrefs) {
                try {
                    setNotificationPrefs(JSON.parse(savedPrefs));
                } catch {
                    // ignore parse error
                }
            }
        }
    }, [sessionStatus, session, router]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setProfileData({
                    name: data.name || "",
                    phone: data.phone || "",
                    image: data.image || "",
                });
            }
        } catch {
            // profile fetch failed silently - defaults remain
        }
    };

    const fetchAddresses = async () => {
        try {
            const res = await fetch("/api/user/addresses");
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
            }
        } catch {
            // addresses fetch failed silently
        }
    };

    const fetchPriceAlerts = async () => {
        try {
            const res = await fetch("/api/user/price-alerts");
            if (res.ok) {
                const data = await res.json();
                setPriceAlerts(data.alerts || []);
            }
        } catch {
            // price alerts fetch failed silently
        }
    };

    const fetchPoints = async () => {
        try {
            const res = await fetch("/api/user/points");
            if (res.ok) {
                const data = await res.json();
                setUserPoints(data.points || 0);
            }
        } catch {
            // points fetch failed silently
        }
    };

    const fetchOrderCount = async () => {
        try {
            const res = await fetch("/api/user/orders?limit=1");
            if (res.ok) {
                const data = await res.json();
                setOrderCount(data.total || data.orders?.length || 0);
            }
        } catch { /* ignore */ }
    };

    const fetchVoucherCount = async () => {
        try {
            const res = await fetch("/api/user/vouchers");
            if (res.ok) {
                const data = await res.json();
                setVoucherCount(Array.isArray(data) ? data.length : (data.vouchers?.length || 0));
            }
        } catch { /* ignore */ }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
            if (res.ok) {
                const data = await res.json();
                setProfileData(p => ({ ...p, image: data.image }));
                if (session?.user) {
                    await update({ user: { ...session.user, image: data.image } });
                }
                toast.success(profileT("avatarUpdated", "Cập nhật ảnh đại diện thành công", "Avatar updated successfully"));
                fetchProfile();
            } else {
                const err = await res.json();
                toast.error(err.error || profileT("uploadAvatarFailed", "Tải ảnh đại diện thất bại", "Failed to upload avatar"));
            }
        } catch { toast.error(profileT("uploadAvatarFailed", "Tải ảnh đại diện thất bại", "Failed to upload avatar")); }
        finally { setIsUploadingAvatar(false); }
    };

    const handleAvatarDelete = async () => {
        if (!confirm(profileT("deleteAvatarConfirm", "Bạn có chắc muốn xóa ảnh đại diện không?", "Are you sure you want to delete your avatar?"))) return;
        try {
            await fetch("/api/user/avatar", { method: "DELETE" });
            setProfileData(p => ({ ...p, image: "" }));
            if (session?.user) await update({ user: { ...session.user, image: null } });
            fetchProfile();
        } catch { /* ignore */ }
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData),
            });

            if (res.ok) {
                setIsEditing(false);
                await fetchProfile();
                toast.success(profileT("profileUpdated", "Cập nhật hồ sơ thành công", "Profile updated successfully"));
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || profileT("profileUpdateFailed", "Cập nhật hồ sơ thất bại", "Failed to update profile"));
            }
        } catch {
            toast.error(profileT("connectionError", "Lỗi kết nối", "Connection error"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationPrefChange = (key: "email" | "inApp", value: boolean) => {
        const newPrefs = { ...notificationPrefs, [key]: value };
        setNotificationPrefs(newPrefs);
        localStorage.setItem("notification_preferences", JSON.stringify(newPrefs));
    };

    const handleSaveAddress = async (addressData: Partial<Address>) => {
        setIsLoading(true);
        try {
            const url = editingAddress
                ? `/api/user/addresses/${editingAddress.id}`
                : "/api/user/addresses";
            const method = editingAddress ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addressData),
            });

            if (res.ok) {
                setShowAddressForm(false);
                setEditingAddress(null);
                await fetchAddresses();
            }
        } catch {
            toast.error(profileT("saveAddressFailed", "Lưu địa chỉ thất bại", "Failed to save address"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm(profileT("deleteAddressConfirm", "Bạn có chắc muốn xóa địa chỉ này không?", "Are you sure you want to delete this address?"))) return;

        try {
            const res = await fetch(`/api/user/addresses/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                await fetchAddresses();
            }
        } catch {
            toast.error(profileT("deleteAddressFailed", "Xóa địa chỉ thất bại", "Failed to delete address"));
        }
    };

    if (sessionStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const sidebarNav: { id: Tab; label: string; labelEn: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Tổng quan", labelEn: "Overview", icon: <User className="w-4 h-4" /> },
        { id: "addresses", label: "Địa chỉ", labelEn: "Addresses", icon: <MapPin className="w-4 h-4" /> },
        { id: "notifications", label: "Thông báo", labelEn: "Notifications", icon: <Bell className="w-4 h-4" /> },
        { id: "security", label: "Bảo mật", labelEn: "Security", icon: <Lock className="w-4 h-4" /> },
    ];

    const quickLinks = [
        {
            href: "/profile/orders",
            label: profileT("orders", "Đơn hàng", "Orders"),
            desc: profileT("orderHistory", "Lịch sử đơn hàng", "Order history"),
            icon: <Package className="w-6 h-6" />,
            color: "bg-orange-50 text-orange-500",
            badge: orderCount > 0 ? orderCount : null,
        },
        {
            href: "/profile/wishlist",
            label: profileT("wishlist", "Yêu thích", "Wishlist"),
            desc: profileT("savedProducts", "Sản phẩm đã lưu", "Saved products"),
            icon: <Heart className="w-6 h-6" />,
            color: "bg-red-50 text-red-500",
            badge: null,
        },
        {
            href: "/profile/referrals",
            label: profileT("referAndEarn", "Giới thiệu nhận thưởng", "Refer and earn"),
            desc: profileT("inviteFriends", "Mời bạn bè", "Invite friends"),
            icon: <UserPlus className="w-6 h-6" />,
            color: "bg-emerald-50 text-emerald-500",
            badge: null,
        },
        {
            href: "/profile/points",
            label: "LIKEFOOD Xu",
            desc: `${userPoints.toLocaleString()} ${profileT("points", "Điểm", "Points")}`,
            icon: <Sparkles className="w-6 h-6" />,
            color: "bg-amber-50 text-amber-500",
            badge: null,
        },
        {
            href: "/profile/vouchers",
            label: profileT("myVouchers", "Voucher của tôi", "My vouchers"),
            desc: `${voucherCount} ${profileT("vouchers", "Voucher", "Vouchers")}`,
            icon: <Ticket className="w-6 h-6" />,
            color: "bg-violet-50 text-violet-500",
            badge: voucherCount > 0 ? voucherCount : null,
        },
        {
            href: "/profile/refunds",
            label: profileT("refunds", "Hoàn tiền", "Refunds"),
            desc: profileT("refundRequests", "Yêu cầu hoàn tiền", "Refund requests"),
            icon: <RefreshCw className="w-6 h-6" />,
            color: "bg-cyan-50 text-cyan-500",
            badge: null,
        },
        ...(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN" ? [{
            href: "/admin/dashboard",
            label: profileT("admin", "Quản trị viên", "Admin"),
            desc: profileT("storeManagement", "Quản lý cửa hàng", "Store management"),
            icon: <LayoutDashboard className="w-6 h-6" />,
            color: "bg-emerald-50 text-emerald-500",
            badge: null,
        }] : []),
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 pb-20 lg:pb-16">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-primary/90 via-primary to-teal-500 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="w-full px-4 sm:px-6 lg:px-[8%] py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-white/20 ring-4 ring-white/40 overflow-hidden flex items-center justify-center text-white shadow-2xl">
                                {profileData.image ? (
                                    <Image
                                        src={profileData.image}
                                        alt={session.user.name || "Avatar"}
                                        width={112}
                                        height={112}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                        onError={() => setProfileData(p => ({ ...p, image: "" }))}
                                    />
                                ) : (
                                    <User className="w-10 h-10 sm:w-14 sm:h-14" />
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                {isUploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                            </label>
                            {profileData.image && (
                                <button onClick={handleAvatarDelete} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        {/* Name & info */}
                        <div className="flex-1 text-white text-center sm:text-left pb-1">
                            {isEditing ? (
                                <div className="flex flex-col sm:flex-row gap-3 items-start">
                                    <input
                                        type="text" value={profileData.name}
                                        onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                                        className="bg-white/20 text-white placeholder:text-white/60 border border-white/30 rounded-2xl px-5 py-2.5 outline-none focus:ring-2 focus:ring-white/40 font-bold text-lg w-full sm:w-64"
                                        placeholder={profileT("fullName", "Họ và tên", "Full name")}
                                    />
                                    <input
                                        type="tel" value={profileData.phone}
                                        onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))}
                                        className="bg-white/20 text-white placeholder:text-white/60 border border-white/30 rounded-2xl px-5 py-2.5 outline-none focus:ring-2 focus:ring-white/40 font-medium w-full sm:w-48"
                                        placeholder={profileT("phone", "Số điện thoại", "Phone")}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveProfile} disabled={isLoading} className="px-5 py-2.5 bg-white text-primary font-black rounded-2xl text-sm hover:bg-white/90 transition-all flex items-center gap-1.5">
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === "vi" ? "Lưu" : "Save")}
                                        </button>
                                        <button onClick={() => { setIsEditing(false); fetchProfile(); }} className="px-5 py-2.5 bg-white/20 text-white font-bold rounded-2xl text-sm hover:bg-white/30 transition-all">
                                            {language === "vi" ? "Hủy" : "Cancel"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight">{session.user.name || (language === "vi" ? "Khách hàng" : "Customer")}</h1>
                                        <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                            {session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
                                                ? profileT("admin", "Quản trị viên", "Admin")
                                                : profileT("member", "Thành viên", "Member")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-white/70 text-sm font-medium justify-center sm:justify-start flex-wrap">
                                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{session.user.email}</span>
                                        {profileData.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{profileData.phone}</span>}
                                    </div>
                                    <button onClick={() => setIsEditing(true)} className="mt-3 flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-bold transition-colors mx-auto sm:mx-0">
                                        <Edit className="w-3.5 h-3.5" /> {profileT("editProfile", "Chỉnh sửa hồ sơ", "Edit profile")}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                        {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 sm:mt-8">
                        {[
                            { label: profileT("orders", "Đơn hàng", "Orders"), value: orderCount, icon: "📦" },
                            { label: "LIKEFOOD Xu", value: userPoints.toLocaleString(), icon: "⭐" },
                            { label: profileT("myVouchers", "Voucher của tôi", "My vouchers"), value: voucherCount, icon: "🎟️" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-white text-center border border-white/10">
                                <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">{stat.icon}</div>
                                <div className="text-lg sm:text-2xl font-black">{stat.value}</div>
                                <div className="text-[9px] sm:text-xs text-white/60 font-medium mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full px-4 sm:px-6 lg:px-[8%] mt-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* ── Sidebar: horizontal scroll on mobile ── */}
                    <aside className="w-full lg:w-64 shrink-0">
                        <div className="lg:bg-white lg:rounded-3xl lg:shadow-lg lg:shadow-slate-200/50 overflow-hidden">
                            <nav className="flex lg:flex-col lg:p-3 gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                                {sidebarNav.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-2xl text-sm font-bold transition-all text-left whitespace-nowrap shrink-0 ${activeTab === item.id
                                            ? "bg-primary text-white shadow-md shadow-primary/30"
                                            : "bg-white lg:bg-transparent border border-slate-200 lg:border-0 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        {item.icon}
                                        {language === "vi" ? item.label : item.labelEn}
                                        {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>
                                ))}
                            </nav>
                            <div className="hidden lg:block border-t border-slate-100 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-2">
                                    {profileT("quickLinks", "Liên kết nhanh", "Quick links")}
                                </p>
                                {[
                                    { href: "/profile/orders", label: profileT("myOrders", "Đơn hàng của tôi", "My orders"), icon: <Package className="w-4 h-4" /> },
                                    { href: "/profile/wishlist", label: profileT("myWishlist", "Yêu thích của tôi", "My wishlist"), icon: <Heart className="w-4 h-4" /> },
                                    { href: "/profile/referrals", label: profileT("referAndEarn", "Giới thiệu nhận thưởng", "Refer and earn"), icon: <UserPlus className="w-4 h-4" /> },
                                    { href: "/notifications", label: profileT("notifications", "Thông báo", "Notifications"), icon: <Bell className="w-4 h-4" /> },
                                ].map((link) => (
                                    <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
                                        {link.icon} {link.label} <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* ── Content ── */}
                    <main className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {activeTab === "overview" && (
                                <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
                                    {/* Quick link grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {quickLinks.map((link) => (
                                            <Link key={link.href} href={link.href}>
                                                <div className="group bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-primary/10 relative overflow-hidden">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${link.color}`}>
                                                            {link.icon}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {link.badge !== null && (
                                                                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-black rounded-full">{link.badge}</span>
                                                            )}
                                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-slate-900 text-base mb-0.5">{link.label}</p>
                                                    <p className="text-sm text-slate-400 font-medium">{link.desc}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Price Drops Alert */}
                                    {priceAlerts.length > 0 && (
                                        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 p-6 border border-green-100">
                                            <h3 className="text-base font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                                                <span className="text-green-500">📉</span> {profileT("priceDrops", "Giảm giá", "Price drops")}
                                            </h3>
                                            <PriceAlertList priceAlerts={priceAlerts} />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "addresses" && (
                                <motion.div key="addresses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 overflow-hidden">
                                        <AddressList
                                            addresses={addresses}
                                            isLoading={isLoading}
                                            showAddressForm={showAddressForm}
                                            editingAddress={editingAddress}
                                            onShowForm={setShowAddressForm}
                                            onEditAddress={setEditingAddress}
                                            onSave={handleSaveAddress}
                                            onDelete={handleDeleteAddress}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "notifications" && (
                                <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
                                    <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 overflow-hidden">
                                        <NotificationSettings
                                            notificationPrefs={notificationPrefs}
                                            onPrefChange={handleNotificationPrefChange}
                                        />
                                    </div>
                                    {priceAlerts.length > 0 && (
                                        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 overflow-hidden">
                                            <PriceAlertList priceAlerts={priceAlerts} />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "security" && (
                                <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
                                    <SecuritySection session={session} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            {/* Address Form Modal */}
            <AnimatePresence>
                {showAddressForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">
                                {editingAddress
                                    ? profileT("editAddress", "Chỉnh sửa địa chỉ", "Edit address")
                                    : profileT("addNewAddress", "Thêm địa chỉ mới", "Add new address")}
                            </h3>
                            <AddressForm
                                address={editingAddress}
                                onSave={handleSaveAddress}
                                onCancel={() => {
                                    setShowAddressForm(false);
                                    setEditingAddress(null);
                                }}
                                isLoading={isLoading}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
