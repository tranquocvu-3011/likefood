"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const PATH_LABELS: Record<string, string> = {
  admin: "Quản trị",
  dashboard: "Bảng điều khiển",
  products: "Sản phẩm",
  new: "Tạo mới",
  edit: "Chỉnh sửa",
  orders: "Đơn hàng",
  customers: "Khách hàng",
  users: "Người dùng",
  coupons: "Mã giảm giá",
  analytics: "Phân tích",
  settings: "Cài đặt",
  ai: "Phòng AI",
  inventory: "Kho hàng",
  categories: "Danh mục",
  brands: "Thương hiệu",
  'flash-sales': "Flash Sale",
  posts: "Bài viết",
  cms: "Quản lý nội dung",
};

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (pathname === "/admin/dashboard") {
    return null;
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = PATH_LABELS[segment] || (segment.length > 18 ? `${segment.slice(0, 8)}...` : segment);
    return {
      href,
      label,
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs">
      <Link
        href="/admin/dashboard"
        className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-700/60 bg-slate-800 text-slate-500 transition hover:text-slate-300"
      >
        <Home className="h-3 w-3" />
      </Link>
      {breadcrumbs.map((crumb) => (
        <span key={crumb.href} className="inline-flex items-center gap-1">
          <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
          {crumb.isLast ? (
            <span className="rounded border border-slate-700/60 bg-slate-800 px-2 py-1 font-semibold text-slate-300">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="rounded px-2 py-1 font-medium text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
