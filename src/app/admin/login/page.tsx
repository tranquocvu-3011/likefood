"use client";

/**
 * LIKEFOOD - Admin Login Page
 * Trang đăng nhập admin - nhập email/password tại /admin/login
 */

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ArrowRight, Eye, EyeOff, Home } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    // If already logged in as admin, redirect to verify or dashboard
    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "ADMIN") {
            // Check if already verified
            fetch("/api/auth/admin-verify", { method: "GET", credentials: "include" })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.verified) {
                        router.replace("/admin/dashboard");
                    } else {
                        router.replace("/admin/verify");
                    }
                })
                .catch(() => router.replace("/admin/verify"));
        }
    }, [status, session, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Vui lòng nhập đầy đủ email và mật khẩu.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                isAdminLogin: "true",
                redirect: false,
            });

            if (result?.error) {
                
                if (result.error.includes("CAPTCHA")) {
                    setError("Lỗi xác thực CAPTCHA. Vui lòng thử lại.");
                } else if (result.error.includes("EMAIL_NOT_VERIFIED")) {
                    setError("Email chưa được xác thực.");
                } else if (result.error.includes("2FA_REQUIRED")) {
                    setError("Yêu cầu mã OTP 2FA.");
                } else {
                    setError("Email hoặc mật khẩu không chính xác.");
                }
                toast.error("Đăng nhập thất bại.");
            } else if (result?.ok) {
                // Check if user is admin via session
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();
                
                if (session?.user?.role !== "ADMIN") {
                    setError("Tài khoản không có quyền quản trị viên.");
                    toast.error("Không phải tài khoản Admin.");
                    // Sign out non-admin user
                    await signOut({ redirect: false });
                    return;
                }

                toast.success("Đăng nhập thành công! Chuyển tới xác thực OTP...");
                router.push("/admin/verify");
            }
        } catch {
            setError("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-zinc-900 overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -z-10 h-[400px] w-[400px] rounded-full bg-teal-500 opacity-15 blur-[120px]"></div>
                <div className="absolute right-1/4 bottom-1/4 -z-10 h-[250px] w-[250px] rounded-full bg-emerald-500 opacity-10 blur-[100px]"></div>
            </div>

            {/* Back to Home */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
                <Link href="/">
                    <Button variant="ghost" className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/20 px-5 h-12 gap-2 backdrop-blur-md transition-all group">
                        <Home className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-wide pr-1">Trang chủ</span>
                    </Button>
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Neon Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-[2.5rem] blur opacity-20 animate-pulse"></div>

                <div className="relative bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden text-white w-full">
                    {/* Header */}
                    <div className="relative flex flex-col items-center justify-center py-10 px-8 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 to-transparent"></div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[2px] mb-6 shadow-2xl shadow-teal-500/30"
                        >
                            <div className="w-full h-full rounded-[1.4rem] bg-zinc-900 flex items-center justify-center">
                                <ShieldCheck className="w-10 h-10 text-teal-400" />
                            </div>
                        </motion.div>
                        <h1 className="relative text-3xl font-black tracking-tight text-white mb-3 drop-shadow-sm">
                            Admin LIKEFOOD
                        </h1>
                        <p className="relative text-teal-100/70 text-sm font-medium leading-relaxed px-4">
                            Đăng nhập với tài khoản quản trị viên để truy cập bảng điều khiển.
                        </p>
                    </div>

                    <div className="p-8 pb-10 pt-0">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-teal-400/80 ml-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-14 px-5 text-[15px] font-medium bg-black/20 border-2 border-white/5 rounded-2xl focus:border-teal-500 focus:bg-black/40 focus:ring-4 focus:ring-teal-500/20 transition-all text-white placeholder:text-white/20 outline-none"
                                    placeholder="admin@likefood.com"
                                    disabled={isLoading}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-teal-400/80 ml-1">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-14 px-5 pr-14 text-[15px] font-medium bg-black/20 border-2 border-white/5 rounded-2xl focus:border-teal-500 focus:bg-black/40 focus:ring-4 focus:ring-teal-500/20 transition-all text-white placeholder:text-white/20 outline-none"
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[13px] font-bold text-red-400 text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full h-14 text-[15px] font-black tracking-wide rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-xl shadow-teal-500/20 transition-all border-none"
                                disabled={isLoading || !email || !password}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                ) : (
                                    <span className="flex items-center">
                                        Đăng Nhập Quản Trị <ArrowRight className="w-5 h-5 ml-2" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center pt-4 border-t border-white/5">
                            <p className="text-[11px] text-zinc-500 font-medium">
                                Chỉ dành cho quản trị viên. Sau khi đăng nhập sẽ cần xác thực OTP qua email.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
