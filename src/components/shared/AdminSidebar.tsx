"use client";

/**
 * LIKEFOOD - Premium Admin Sidebar
 * Dark Gray Enterprise Dashboard Style - 2026 Edition
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderTree,
  Home,
  Inbox,
  Layout,
  LogOut,
  Menu,
  Newspaper,
  Package,
  Settings,
  Sparkles,
  Tag,
  ThumbsUp,
  Ticket,
  Users,
  X,
  Zap,

  Shield,
  Star,
  BarChart3,
  MessageSquare,
  Paintbrush,
  LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string | number;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number | null;
}

interface NavGroup {
  id: string | number;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [
      { id: "dashboard", label: "Bảng điều khiển", href: "/admin", icon: Home },
      { id: "analytics", label: "Phân tích", href: "/admin/analytics", icon: BarChart3 },
      { id: "ai", label: "AI Insights", href: "/admin/ai", icon: Sparkles },
    ],
  },
  {
    id: "operations",
    label: "Vận hành",
    items: [
      { id: "orders", label: "Đơn hàng", href: "/admin/orders", icon: ClipboardList },
      { id: "inventory", label: "Kho hàng", href: "/admin/inventory", icon: Package },
      { id: "live-chat", label: "Trò chuyện", href: "/admin/live-chat", icon: MessageSquare },
      { id: "contact-messages", label: "Tin nhắn liên hệ", href: "/admin/contact-messages", icon: Inbox },
    ],
  },
  {
    id: "catalog",
    label: "Danh mục",
    items: [
      { id: "products", label: "Sản phẩm", href: "/admin/products", icon: Package },
      { id: "categories", label: "Phân loại", href: "/admin/categories", icon: FolderTree },
      { id: "brands", label: "Thương hiệu", href: "/admin/brands", icon: Tag },
      { id: "reviews", label: "Đánh giá", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    id: "customers",
    label: "Khách hàng",
    items: [
      { id: "customers", label: "Khách hàng", href: "/admin/customers", icon: Users },
      { id: "users", label: "Tài khoản", href: "/admin/users", icon: Shield },
      { id: "feedback", label: "Phản hồi", href: "/admin/feedback", icon: ThumbsUp },
    ],
  },
  {
    id: "marketing",
    label: "Tiếp thị",
    items: [
      { id: "coupons", label: "Mã giảm giá", href: "/admin/coupons", icon: Ticket },
      { id: "flash-sales", label: "Flash Sale", href: "/admin/flash-sales", icon: Zap },
      { id: "newsletter", label: "Email đăng ký", href: "/admin/newsletter", icon: Newspaper },
    ],
  },
  {
    id: "content",
    label: "Nội dung",
    items: [
      { id: "cms", label: "Trang & Nội dung", href: "/admin/cms", icon: Paintbrush },
      { id: "posts", label: "Bài viết", href: "/admin/posts", icon: FileText },
      { id: "knowledge", label: "AI Knowledge", href: "/admin/knowledge", icon: BookOpen },
      { id: "homepage", label: "Trang chủ", href: "/admin/homepage", icon: Layout },
    ],
  },
  {
    id: "settings",
    label: "Cài đặt",
    items: [
      { id: "settings", label: "Cài đặt", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Check if current path matches or starts with href
  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="fixed left-3 top-3 z-[70] inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-900 text-zinc-400 lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-800 bg-[#0A0A0B] transition-all duration-200",
          collapsed ? "w-16" : "w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <Bot className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Quản trị</p>
                <h2 className="truncate text-sm font-semibold tracking-tight text-zinc-100">LIKEFOOD</h2>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden h-6 w-6 items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-900 text-zinc-500 transition-colors hover:text-zinc-300 lg:flex"
            aria-label={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>

        {/* Status Indicator */}
        {!collapsed && (
          <div className="mx-3 mt-3 flex items-center gap-2 rounded-md bg-zinc-900/50 px-2 py-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <p className="text-[10px] font-medium text-zinc-500">Hệ thống hoạt động</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto py-3 px-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="mb-4">
              {!collapsed ? (
                <p className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  {group.label}
                </p>
              ) : (
                <div className="mx-2 mb-3 h-px bg-zinc-800/50" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium transition-all duration-100",
                        active
                          ? "bg-zinc-800/80 text-white"
                          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center transition-colors",
                          active ? "text-teal-400" : "text-zinc-500 group-hover:text-zinc-400"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                typeof item.badge === "string"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-teal-500/10 text-teal-400"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-2 py-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-red-400"
            )}
            title={collapsed ? "Đăng xuất" : undefined}
          >
            <span className="flex h-5 w-5 items-center justify-center text-zinc-500">
              <LogOut className="h-4 w-4" />
            </span>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
