"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Product Table with Bulk Actions, Quick Edit, Filters
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
    Search, Edit, Trash2, Eye, EyeOff, 
    Star, Package, AlertTriangle, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, RefreshCw, Check, Square, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Product {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    price: number;
    originalPrice?: number | null;
    salePrice?: number | null;
    inventory: number;
    isVisible: boolean;
    featured: boolean;
    isOnSale: boolean;
    category?: { name: string };
    soldCount?: number;
    rating?: number;
    reviewCount?: number;
    createdAt: string;
}

interface ProductTableProps {
    products: Product[];
    isLoading?: boolean;
    onDelete?: (ids: string[]) => Promise<void>;
    onToggleVisibility?: (ids: string[]) => Promise<void>;
    onToggleFeatured?: (ids: string[]) => Promise<void>;
    onBulkUpdate?: (ids: string[], data: Partial<Product>) => Promise<void>;
    onExport?: () => void;
    onImport?: () => void;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export default function ProductTable({
    products,
    isLoading,
    onDelete,
    onToggleVisibility,
    onToggleFeatured,
    onPageChange,
    currentPage = 1,
    totalPages = 1,
}: ProductTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "visible" | "hidden" | "low-stock" | "out-of-stock">("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-asc" | "price-desc" | "name" | "stock">("newest");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        switch (filterStatus) {
            case "visible":
                return matchesSearch && product.isVisible;
            case "hidden":
                return matchesSearch && !product.isVisible;
            case "low-stock":
                return matchesSearch && product.inventory > 0 && product.inventory <= 10;
            case "out-of-stock":
                return matchesSearch && product.inventory === 0;
            default:
                return matchesSearch;
        }
    }).sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "price-asc":
                return a.price - b.price;
            case "price-desc":
                return b.price - a.price;
            case "name":
                return a.name.localeCompare(b.name);
            case "stock":
                return b.inventory - a.inventory;
            default:
                return 0;
        }
    });

    // Selection
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(Number(id))) {
                newSet.delete(Number(id));
            } else {
                newSet.add(Number(id));
            }
            return newSet;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    }, [filteredProducts, selectedIds]);

    // Bulk actions
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} products? This cannot be undone.`)) return;
        
        setActionLoading("delete");
        try {
            await onDelete?.(Array.from(selectedIds).map(String));
            setSelectedIds(new Set());
            toast.success(`Deleted ${selectedIds.size} products`);
        } catch (error) {
            toast.error("Failed to delete products");
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkVisibility = async () => {
        if (selectedIds.size === 0) return;
        
        setActionLoading("visibility");
        try {
            await onToggleVisibility?.(Array.from(selectedIds).map(String));
            setSelectedIds(new Set());
            toast.success(`Updated visibility for ${selectedIds.size} products`);
        } catch (error) {
            toast.error("Failed to update visibility");
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkFeatured = async () => {
        if (selectedIds.size === 0) return;
        
        setActionLoading("featured");
        try {
            await onToggleFeatured?.(Array.from(selectedIds).map(String));
            setSelectedIds(new Set());
            toast.success(`Updated featured status for ${selectedIds.size} products`);
        } catch (error) {
            toast.error("Failed to update featured status");
        } finally {
            setActionLoading(null);
        }
    };

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    // Get stock status
    const getStockStatus = (product: Product) => {
        if (product.inventory === 0) {
            return { label: "Out of Stock", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle };
        }
        if (product.inventory <= 10) {
            return { label: "Low Stock", color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle };
        }
        return { label: "In Stock", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle };
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="h-10 px-3 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:outline-none focus:border-teal-500/50"
                    >
                        <option value="all">All Status</option>
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                        <option value="low-stock">Low Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                    </select>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="h-10 px-3 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:outline-none focus:border-teal-500/50"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name">Name A-Z</option>
                        <option value="stock">Stock Level</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
                    <span className="text-sm font-medium text-teal-400">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex-1" />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkVisibility}
                        disabled={!!actionLoading}
                        className="border-teal-500/50 text-teal-400 hover:bg-teal-500/20"
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Toggle Visibility
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkFeatured}
                        disabled={!!actionLoading}
                        className="border-teal-500/50 text-teal-400 hover:bg-teal-500/20"
                    >
                        <Star className="h-4 w-4 mr-2" />
                        Toggle Featured
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkDelete}
                        disabled={!!actionLoading}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedIds(new Set())}
                        className="text-zinc-400 hover:text-zinc-100"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-zinc-700/40 bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700/40">
                                <th className="p-4 text-left">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="p-1 hover:bg-zinc-800 rounded"
                                    >
                                        {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                                            <Check className="h-4 w-4 text-teal-500" />
                                        ) : (
                                            <Square className="h-4 w-4 text-zinc-500" />
                                        )}
                                    </button>
                                </th>
                                <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product</th>
                                <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                                <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Price</th>
                                <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Stock</th>
                                <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                                <th className="p-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                                        <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const stockStatus = getStockStatus(product);
                                    const StatusIcon = stockStatus.icon;
                                    
                                    return (
                                        <tr 
                                            key={product.id} 
                                            className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleSelect(String(product.id))}
                                                    className="p-1 hover:bg-zinc-800 rounded"
                                                >
                                                    {selectedIds.has(product.id) ? (
                                                        <Check className="h-4 w-4 text-teal-500" />
                                                    ) : (
                                                        <Square className="h-4 w-4 text-zinc-600" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                                        {product.image ? (
                                                            <Image
                                                                fill
                                                                className="object-cover"
                                                                alt={product.name}
                                                                src={product.image}
                                                                sizes="48px"
                                                            />
                                                        ) : (
                                                            <Package className="h-6 w-6 text-zinc-600 m-auto" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-zinc-100 truncate max-w-[200px]">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                                                            {product.slug}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {product.isOnSale && (
                                                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
                                                                    SALE
                                                                </span>
                                                            )}
                                                            {product.featured && (
                                                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded">
                                                                    FEATURED
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-zinc-400 hidden md:table-cell">
                                                {product.category?.name || "-"}
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {product.isOnSale && product.salePrice ? (
                                                        <>
                                                            <p className="font-semibold text-teal-400">
                                                                {formatPrice(product.salePrice)}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 line-through">
                                                                {formatPrice(product.price)}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="font-semibold text-zinc-100">
                                                            {formatPrice(product.price)}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-zinc-400 hidden sm:table-cell">
                                                <span className={stockStatus.color}>
                                                    {product.inventory} units
                                                </span>
                                            </td>
                                            <td className="p-4 hidden lg:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {stockStatus.label}
                                                    </span>
                                                    {!product.isVisible && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-zinc-700 text-zinc-400">
                                                            <EyeOff className="h-3 w-3" />
                                                            Hidden
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/admin/products/${product.id}/edit`}
                                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4 text-zinc-400 hover:text-teal-400" />
                                                    </Link>
                                                    <Link
                                                        href={`/products/${product.slug}`}
                                                        target="_blank"
                                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4 text-zinc-400 hover:text-teal-400" />
                                                    </Link>
                                                    <button
                                                        onClick={() => onToggleVisibility?.([String(product.id)])}
                                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                                        title={product.isVisible ? "Hide" : "Show"}
                                                    >
                                                        {product.isVisible ? (
                                                            <EyeOff className="h-4 w-4 text-zinc-400 hover:text-amber-400" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-zinc-400 hover:text-emerald-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPageChange?.(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPageChange?.(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
