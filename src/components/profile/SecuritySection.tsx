"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Shield, Clock, Monitor, AlertTriangle, Trash2, Eye, EyeOff, Save, Loader2, Link2, Unlink } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { toast } from "sonner";

interface SecuritySectionProps {
    session: {
        user: {
            id?: number;
            email?: string | null;
            name?: string | null;
            role?: string;
        };
    };
}

export function SecuritySection({ session }: SecuritySectionProps) {
    const { language, t, isVietnamese } = useLanguage();

    const profileT = (_key: string, fallback: string) => {
        return fallback;
    };

    // --- Change Password state ---
    const [pwData, setPwData] = useState({ current: "", newPw: "", confirm: "" });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState("");

    // --- Login History state ---
    const [loginHistory, setLoginHistory] = useState<Array<{
        id: number;
        ipAddress?: string | null;
        userAgent?: string | null;
        country?: string | null;
        isSuspicious: boolean;
        createdAt: string;
    }>>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    // --- Delete Account state ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);

    // --- 2FA state ---
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFALoaded, setTwoFALoaded] = useState(false);

    // --- Google Connection state ---
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleLoaded, setGoogleLoaded] = useState(false);

    // --- 2FA Modal state ---
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [otp2FA, setOtp2FA] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);

    const fetchTwoFAStatus = async () => {
        if (twoFALoaded) return;
        try {
            const res = await fetch("/api/auth/2fa/toggle");
            if (res.ok) {
                const d = await res.json();
                setTwoFAEnabled(d.twoFactorEnabled);
                setTwoFALoaded(true);
            }
        } catch { /* ignore */ }
    };

    const fetchGoogleStatus = async () => {
        if (googleLoaded) return;
        try {
            const res = await fetch("/api/auth/google/link");
            if (res.ok) {
                const d = await res.json();
                setGoogleConnected(d.isConnected);
                setGoogleLoaded(true);
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchTwoFAStatus();
        fetchGoogleStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggle2FA = async (enable: boolean) => {
        if (enable) {
            // Initiate 2FA Enable Process: Send Email
            setTwoFALoading(true);
            try {
                const res = await fetch("/api/auth/2fa/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: session.user.email }),
                });
                if (res.ok) {
                    setShow2FAModal(true);
                    setOtp2FA("");
                } else {
                    toast.error(profileT('profile.failedToSendCode', isVietnamese ? 'Không thể gửi mã xác nhận' : 'Failed to send confirmation code'));
                }
            } catch {
                toast.error(profileT('profile.connectionError', isVietnamese ? 'Lỗi kết nối' : 'Connection error'));
            } finally {
                setTwoFALoading(false);
            }
        } else {
            // Disable process
            setTwoFALoading(true);
            try {
                const res = await fetch("/api/auth/2fa/toggle", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ enabled: false }),
                });
                const data = await res.json();
                if (res.ok) {
                    setTwoFAEnabled(false);
                    toast.success(profileT('profile.twoFactorDisabled', isVietnamese ? 'Đã tắt xác thực 2 lớp' : 'Two-factor authentication disabled'));
                } else {
                    toast.error(data.error || profileT('profile.unableToDisable2FA', isVietnamese ? 'Không thể tắt 2FA' : 'Unable to disable 2FA'));
                }
            } catch {
                toast.error(profileT('profile.connectionError', isVietnamese ? 'Lỗi kết nối' : 'Connection error'));
            } finally {
                setTwoFALoading(false);
            }
        }
    };

    const handleConfirm2FA = async () => {
        if (otp2FA.length < 6) return;
        setOtpLoading(true);
        try {
            const res = await fetch("/api/auth/2fa/toggle", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: true, otp: otp2FA }),
            });
            const data = await res.json();
            if (res.ok) {
                setTwoFAEnabled(true);
                setShow2FAModal(false);
                toast.success(profileT('profile.twoFactorEnabledSuccess', isVietnamese ? 'Đã bật xác thực 2 lớp thành công' : 'Two-factor authentication enabled successfully'));
            } else {
                    toast.error(data.error || profileT('profile.invalidConfirmationCode', isVietnamese ? 'Mã xác nhận không hợp lệ' : 'Invalid confirmation code'));
            }
        } catch {
            toast.error(profileT('profile.connectionError', isVietnamese ? 'Lỗi kết nối' : 'Connection error'));
        } finally {
            setOtpLoading(false);
        }
    };

    const passwordStrength = (pw: string) => {
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score;
    };

    const strengthLabel = isVietnamese ? ["", "Yếu", "Trung bình", "Tốt", "Mạnh"] : ["", "Weak", "Medium", "Good", "Strong"];
    const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
    const pwStrength = passwordStrength(pwData.newPw);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwData.newPw !== pwData.confirm) {
            setPwError(profileT('profile.passwordMismatch', isVietnamese ? 'Mật khẩu xác nhận không khớp' : 'Password confirmation does not match'));
            return;
        }
        setPwLoading(true);
        setPwError("");
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: pwData.current, newPassword: pwData.newPw, confirmPassword: pwData.confirm }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(profileT('profile.passwordChangedSuccess', isVietnamese ? 'Đổi mật khẩu thành công' : 'Password changed successfully'));
                setPwData({ current: "", newPw: "", confirm: "" });
            } else {
                setPwError(data.error || profileT('profile.passwordChangeFailed', isVietnamese ? 'Đổi mật khẩu thất bại' : 'Failed to change password'));
            }
        } catch {
            setPwError(profileT('profile.connectionError', isVietnamese ? 'Lỗi kết nối' : 'Connection error'));
        } finally {
            setPwLoading(false);
        }
    };

    const fetchLoginHistory = async () => {
        if (historyLoaded) return;
        setHistoryLoading(true);
        try {
            const res = await fetch("/api/auth/login-history");
            if (res.ok) {
                const data = await res.json();
                setLoginHistory(data.history || []);
                setHistoryLoaded(true);
            }
        } catch { /* ignore */ }
        finally { setHistoryLoading(false); }
    };

    const handleConnectGoogle = async () => {
        // Redirect to login page with Google, user will be redirected back after connecting
        // For now, show a message to use the login page
        setGoogleLoading(true);
        try {
            const res = await fetch("/api/auth/google/link", { method: "POST" });
            if (res.ok) {
                toast.success(profileT('profile.googleLinkInitiated', isVietnamese ? 'Vui lòng đăng nhập bằng Google để kết nối tài khoản' : 'Please sign in with Google to link your account'));
                // In a real implementation, we would redirect to the OAuth provider
                // For now, we just refresh the status after a delay
                setTimeout(() => {
                    fetchGoogleStatus();
                    setGoogleLoading(false);
                }, 2000);
            } else {
                const d = await res.json();
                toast.error(d.error || profileT('profile.googleLinkFailed', isVietnamese ? 'Kết nối Google thất bại' : 'Failed to connect Google'));
                setGoogleLoading(false);
            }
        } catch {
            toast.error(profileT('profile.connectionError', isVietnamese ? 'Lỗi kết nối' : 'Connection error'));
            setGoogleLoading(false);
        }
    };

    const handleDisconnectGoogle = async () => {
        setGoogleLoading(true);
        try {
            const res = await fetch("/api/auth/google/link", { method: "DELETE" });
            if (res.ok) {
                setGoogleConnected(false);
                toast.success(profileT('profile.googleDisconnected', isVietnamese ? 'Đã ngắt kết nối Google' : 'Google disconnected'));
            } else {
                const d = await res.json();
                toast.error(d.error || profileT('profile.googleUnlinkFailed', isVietnamese ? 'Ngắt kết nối Google thất bại' : 'Failed to disconnect Google'));
            }
        } catch {
            toast.error(profileT('profile.connectionError', isVietnamese ? 'Lỗi kết nối' : 'Connection error'));
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deleteConfirmed || !deletePassword) return;
        setDeleteLoading(true);
        try {
            const res = await fetch("/api/user/account", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: deletePassword }),
            });
            if (res.ok) {
                toast.success(profileT('profile.deleteAccountSuccess', isVietnamese ? 'Xóa tài khoản thành công' : 'Account deleted successfully'));
                await signOut({ callbackUrl: "/" });
            } else {
                const d = await res.json();
                toast.error(d.error || profileT('profile.deleteAccountFailed', isVietnamese ? 'Xóa tài khoản thất bại' : 'Failed to delete account'));
            }
        } catch {
            toast.error(profileT('profile.connectionError', isVietnamese ? 'Lỗi kết nối' : 'Connection error'));
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDevice = (ua?: string | null) => {
        if (!ua) return profileT('profile.unknownDevice', isVietnamese ? 'Thiết bị không xác định' : 'Unknown device');
        if (ua.includes("Mobile")) return isVietnamese ? "Điện thoại" : "Mobile";
        if (ua.includes("Tablet")) return isVietnamese ? "Máy tính bảng" : "Tablet";
        return isVietnamese ? "Máy tính" : "Desktop";
    };

    return (
        <>
            {/* Change Password Card */}
            <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.5rem]">
                <CardContent className="p-8 md:p-10">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                        <Lock className="w-6 h-6 text-primary" />
                        {profileT('profile.changePassword', isVietnamese ? 'Đổi mật khẩu' : 'Change password')}
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        {pwError && (
                            <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> {pwError}
                            </div>
                        )}
                        {/* Current password */}
                        <div className="relative">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                {profileT('profile.currentPassword', isVietnamese ? 'Mật khẩu hiện tại' : 'Current password')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw.current ? "text" : "password"} required
                                    value={pwData.current}
                                    onChange={e => setPwData(p => ({ ...p, current: e.target.value }))}
                                    className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 pr-12 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder={profileT('profile.enterCurrentPassword', isVietnamese ? 'Nhập mật khẩu hiện tại' : 'Enter current password')}
                                />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                                    {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        {/* New password */}
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                {profileT('profile.newPasswordLabel', isVietnamese ? 'Mật khẩu mới' : 'New password')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw.new ? "text" : "password"} required
                                    value={pwData.newPw}
                                    onChange={e => setPwData(p => ({ ...p, newPw: e.target.value }))}
                                    className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 pr-12 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder={profileT('profile.atLeast8Chars', isVietnamese ? 'Ít nhất 8 ký tự' : 'At least 8 characters')}
                                />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                                    {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {pwData.newPw && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= pwStrength ? strengthColor[pwStrength] : "bg-slate-100"}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">{strengthLabel[pwStrength]}</p>
                                </div>
                            )}
                        </div>
                        {/* Confirm password */}
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                {profileT('profile.confirmPassword', isVietnamese ? 'Xác nhận mật khẩu' : 'Confirm password')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw.confirm ? "text" : "password"} required
                                    value={pwData.confirm}
                                    onChange={e => setPwData(p => ({ ...p, confirm: e.target.value }))}
                                    className={`w-full bg-slate-50 border-none ring-1 rounded-2xl px-6 pr-12 py-4 outline-none focus:ring-2 transition-all font-medium ${pwData.confirm && pwData.newPw !== pwData.confirm ? "ring-red-300 focus:ring-red-200" : "ring-slate-100 focus:ring-primary/20"}`}
                                    placeholder={profileT('profile.reEnterNewPassword', isVietnamese ? 'Nhập lại mật khẩu mới' : 'Re-enter new password')}
                                />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                                    {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" disabled={pwLoading} className="h-12 px-8 rounded-full bg-slate-900 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest transition-all">
                            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />{profileT('profile.changePassword', isVietnamese ? 'Đổi mật khẩu' : 'Change password')}</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* 2FA Toggle Card */}
            <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.5rem]">
                <CardContent className="p-8 md:p-10">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary" />
                        {profileT('profile.twoFactorAuth', isVietnamese ? 'Xác thực hai lớp (2FA)' : 'Two-factor authentication (2FA)')}
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mb-6">
                        {profileT('profile.twoFactorDescription', isVietnamese ? 'Tăng cường bảo mật bằng mã xác thực mỗi khi đăng nhập.' : 'Improve security with a verification code on login.')}
                    </p>
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border-2 border-slate-100">
                        <div>
                            <p className="font-black text-slate-900">
                                {twoFAEnabled
                                    ? profileT('profile.twoFactorEnabled', isVietnamese ? 'Đã bật 2FA' : '2FA enabled')
                                    : profileT('profile.twoFactorDisabled', isVietnamese ? 'Đã tắt 2FA' : '2FA disabled')}
                            </p>
                            <p className="text-sm text-slate-400 font-medium">
                                {twoFAEnabled
                                    ? profileT('profile.accountProtected', isVietnamese ? 'Tài khoản của bạn đang được bảo vệ tốt hơn.' : 'Your account is now better protected.')
                                    : profileT('profile.enableTwoFactor', isVietnamese ? 'Bật 2FA để bảo vệ tài khoản.' : 'Enable 2FA to protect your account.')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!twoFALoaded && (
                                <Button onClick={fetchTwoFAStatus} variant="outline" className="rounded-full text-sm font-bold">
                                    {profileT('profile.loadStatus', isVietnamese ? 'Tải trạng thái' : 'Load status')}
                                </Button>
                            )}
                            {twoFALoaded && (
                                <button
                                    onClick={() => handleToggle2FA(!twoFAEnabled)}
                                    disabled={twoFALoading}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${twoFAEnabled ? "bg-emerald-500" : "bg-slate-300"} disabled:opacity-50`}
                                >
                                    {twoFALoading
                                        ? <Loader2 className="w-4 h-4 animate-spin text-white mx-auto" />
                                        : <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${twoFAEnabled ? "translate-x-6" : "translate-x-0"}`} />
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Google Connection Card */}
            <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.5rem]">
                <CardContent className="p-8 md:p-10">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3">
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {profileT('profile.googleAccount', isVietnamese ? 'Kết nối Google' : 'Google Account')}
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mb-6">
                        {profileT('profile.googleDescription', isVietnamese ? 'Đăng nhập nhanh hơn bằng Google và đồng bộ dữ liệu.' : 'Sign in faster with Google and sync your data.')}
                    </p>
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border-2 border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            </div>
                            <div>
                                <p className="font-black text-slate-900">
                                    {googleConnected
                                        ? profileT('profile.googleConnected', isVietnamese ? 'Đã kết nối' : 'Connected')
                                        : profileT('profile.googleNotConnected', isVietnamese ? 'Chưa kết nối' : 'Not connected')}
                                </p>
                                <p className="text-sm text-slate-400 font-medium">
                                    {googleConnected
                                        ? profileT('profile.googleAccountLinked', isVietnamese ? 'Tài khoản Google của bạn đã được kết nối.' : 'Your Google account is linked.')
                                        : profileT('profile.connectGooglePrompt', isVietnamese ? 'Kết nối Google để đăng nhập nhanh hơn.' : 'Connect Google for faster login.')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!googleLoaded && (
                                <Button onClick={fetchGoogleStatus} variant="outline" className="rounded-full text-sm font-bold">
                                    {profileT('profile.loadStatus', isVietnamese ? 'Tải trạng thái' : 'Load status')}
                                </Button>
                            )}
                            {googleLoaded && (
                                googleConnected ? (
                                    <button
                                        onClick={handleDisconnectGoogle}
                                        disabled={googleLoading}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
                                    >
                                        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlink className="w-4 h-4" />{profileT('profile.disconnect', isVietnamese ? 'Ngắt kết nối' : 'Disconnect')}</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleConnectGoogle}
                                        disabled={googleLoading}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                                    >
                                        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4" />{profileT('profile.connect', isVietnamese ? 'Kết nối' : 'Connect')}</>}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Login History Card */}
            <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.5rem]">
                <CardContent className="p-8 md:p-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <Clock className="w-6 h-6 text-primary" />
                            {profileT('profile.loginHistory', isVietnamese ? 'Lịch sử đăng nhập' : 'Login history')}
                        </h2>
                        {!historyLoaded && (
                            <Button onClick={fetchLoginHistory} variant="outline" className="rounded-full border-slate-200 text-slate-600 font-bold text-sm gap-2">
                                {historyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Monitor className="w-4 h-4" />{profileT('profile.viewHistory', isVietnamese ? 'Xem lịch sử' : 'View history')}</>}
                            </Button>
                        )}
                    </div>
                    {!historyLoaded ? (
                        <p className="text-slate-400 font-medium text-sm">{profileT('profile.pressToLoadHistory', isVietnamese ? 'Nhấn để tải lịch sử đăng nhập' : 'Press to load login history')}</p>
                    ) : loginHistory.length === 0 ? (
                        <p className="text-slate-400 font-medium text-sm">{profileT('profile.noLoginHistory', isVietnamese ? 'Chưa có lịch sử đăng nhập' : 'No login history yet')}</p>
                    ) : (
                        <div className="space-y-3">
                            {loginHistory.map(h => (
                                <div key={h.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${h.isSuspicious ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${h.isSuspicious ? "bg-red-100" : "bg-slate-100"}`}>
                                        {h.isSuspicious ? "!" : (isVietnamese ? "Ổn" : "OK")}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-slate-900 text-sm">{formatDevice(h.userAgent)}</p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {isVietnamese ? "IP" : "IP"}: {h.ipAddress || (isVietnamese ? "Không rõ" : "N/A")} {h.country ? ` - ${h.country}` : ""}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium shrink-0">
                                        {new Date(h.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                                    </p>
                                    {h.isSuspicious && (
                                        <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full">
                                            {profileT('profile.suspicious', isVietnamese ? 'Đáng ngờ' : 'Suspicious')}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Danger Zone — Delete Account */}
            <Card className="border-2 border-red-100 shadow-lg bg-red-50/30 rounded-[2.5rem]">
                <CardContent className="p-8 md:p-10">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3 text-red-700">
                        <AlertTriangle className="w-6 h-6" />
                        {profileT('profile.dangerZone', isVietnamese ? 'Xóa tài khoản' : 'Delete account')}
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mb-6">
                        {profileT('profile.actionsCannotBeUndone', isVietnamese ? 'Các thao tác này không thể hoàn tác.' : 'These actions cannot be undone.')}
                    </p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                    >
                        <Trash2 className="w-4 h-4" /> {profileT('profile.deleteAccountPermanently', isVietnamese ? 'Xóa tài khoản vĩnh viễn' : 'Delete account permanently')}
                    </button>
                </CardContent>
            </Card>

            {/* Delete Account Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-center text-red-700 mb-2">
                                {profileT('profile.deleteAccount', isVietnamese ? 'Xóa tài khoản' : 'Delete account')}
                            </h3>
                            <p className="text-slate-500 text-sm text-center font-medium mb-6">
                                {profileT('profile.deleteAccountConfirm', isVietnamese ? 'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete your account? This action cannot be undone.')}
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                        {profileT('profile.enterPasswordToConfirm', isVietnamese ? 'Nhập mật khẩu để xác nhận' : 'Enter password to confirm')}
                                    </label>
                                    <input
                                        type="password" value={deletePassword}
                                        onChange={e => setDeletePassword(e.target.value)}
                                        className="w-full bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-200 font-medium text-sm"
                                        placeholder={profileT('profile.yourPassword', isVietnamese ? 'Mật khẩu của bạn' : 'Your password')}
                                    />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={deleteConfirmed} onChange={e => setDeleteConfirmed(e.target.checked)}
                                        className="w-4 h-4 rounded border-red-300 text-red-500 focus:ring-red-200" />
                                    <span className="text-sm text-slate-600 font-medium">
                                        {profileT('profile.iUnderstandAndAgree', isVietnamese ? 'Tôi hiểu và đồng ý tiếp tục' : 'I understand and agree to proceed')}
                                    </span>
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={!deleteConfirmed || !deletePassword || deleteLoading}
                                        className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-40"
                                    >
                                        {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : profileT('profile.deletePermanently', isVietnamese ? 'Xóa vĩnh viễn' : 'Delete permanently')}
                                    </button>
                                    <button onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteConfirmed(false); }}
                                        className="flex-1 py-3 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">
                                        {profileT('profile.cancel', isVietnamese ? 'Hủy' : 'Cancel')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enable 2FA Modal */}
            <AnimatePresence>
                {show2FAModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-center text-slate-800 mb-2">
                                {profileT('profile.confirmOTP', isVietnamese ? 'Xác nhận mã OTP' : 'Confirm OTP code')}
                            </h3>
                            <p className="text-slate-500 text-sm text-center font-medium mb-6">
                                {profileT('profile.enterOTPDescription', isVietnamese ? 'Nhập mã OTP đã gửi đến email của bạn.' : 'Enter the OTP sent to your email.')}
                            </p>
                            <div className="space-y-4">
                                <input
                                    type="text" maxLength={6}
                                    value={otp2FA}
                                    onChange={e => setOtp2FA(e.target.value.toUpperCase())}
                                    className="w-full text-center text-2xl font-black tracking-widest bg-slate-50 ring-1 ring-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                                    placeholder="••••••"
                                />
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleConfirm2FA}
                                        disabled={otp2FA.length < 6 || otpLoading}
                                        className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-40"
                                    >
                                        {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : profileT('profile.otpConfirm', isVietnamese ? 'Xác nhận OTP' : 'Confirm OTP')}
                                    </button>
                                    <button onClick={() => { setShow2FAModal(false); setOtp2FA(""); }}
                                        disabled={otpLoading}
                                        className="flex-1 py-3 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">
                                        {profileT('profile.cancel', isVietnamese ? 'Hủy' : 'Cancel')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
