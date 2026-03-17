"use client";

/**
 * LIKEFOOD - Admin Topbar
 * Sticky top bar: breadcrumbs, user info, shortcut hint
 */

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Command, Bell, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PATH_LABELS: Record<string, string> = {
    admin: "Admin",
    dashboard: "Bảng điều khiển",
    products: "Sản phẩm",
    new: "Mới",
    edit: "Chỉnh sửa",
    orders: "Đơn hàng",
    customers: "Khách hàng",
    users: "Người dùng",
    coupons: "Mã giảm giá",
    analytics: "Phân tích",
    settings: "Cài đặt",
    ai: "Gợi ý AI",
    inventory: "Kho hàng",
    categories: "Danh mục",
    brands: "Thương hiệu",
    "flash-sales": "Flash Sale",
    posts: "Bài viết",
    pages: "Trang tĩnh",
    cms: "CMS",
    menu: "Menu",
    homepage: "Trang chủ",
    verify: "Xác thực",
};

interface AdminTopbarProps {
    onOpenCommandPalette: () => void;
}

export default function AdminTopbar({ onOpenCommandPalette }: AdminTopbarProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const breadcrumbs = segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const label = PATH_LABELS[seg] ?? (seg.length > 16 ? seg.slice(0, 10) + "…" : seg);
        const isLast = idx === segments.length - 1;
        return { href, label, isLast };
    });

    const initials = (session?.user?.name ?? session?.user?.email ?? "AD")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const currentLabel = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Bảng điều khiển";

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-zinc-700/50 bg-[#131316]/95 px-4 lg:px-6 backdrop-blur-xl">
            <div className="min-w-0">
                <nav className="flex items-center gap-1 overflow-hidden text-xs min-w-0">
                    <Link
                        href="/admin/dashboard"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700/40 bg-zinc-900/80 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
                    >
                        <Home className="h-3.5 w-3.5" />
                    </Link>
                    {breadcrumbs.slice(1).map(({ href, label, isLast }) => (
                        <span key={href} className="flex items-center gap-1 min-w-0">
                            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-700" />
                            <Link
                                href={href}
                                className={cn(
                                    "truncate rounded px-1.5 py-0.5 transition",
                                    isLast
                                        ? "text-zinc-200 font-medium"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {label}
                            </Link>
                        </span>
                    ))}
                </nav>
                <p className="mt-1 truncate text-sm font-semibold text-zinc-100">{currentLabel}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:gap-3">
                <button
                    type="button"
                    onClick={onOpenCommandPalette}
                    className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-700/40 bg-zinc-900/80 px-3 py-2 text-[12px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
                    title="Open command palette"
                >
                    <Command className="h-3 w-3" />
                    <span>Tìm nhanh</span>
                    <span className="rounded border border-zinc-700 px-1.5 py-0 text-[10px] text-zinc-500">K</span>
                </button>

                <button
                    type="button"
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/40 bg-zinc-900/80 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
                    title="Notifications"
                >
                    <Bell className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-[11px] font-bold text-white shadow-[0_0_24px_rgba(20,184,166,0.28)] select-none">
                        {initials}
                    </div>
                    <div className="hidden lg:block leading-tight">
                        <p className="text-[12px] font-medium text-zinc-200 truncate max-w-[140px]">
                            {session?.user?.name ?? "Admin"}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 truncate max-w-[140px]">
                            {session?.user?.role ?? "ADMIN"}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
