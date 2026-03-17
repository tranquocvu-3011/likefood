"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Quick Edit Modal - Fast product editing without leaving the page
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useCallback, useEffect } from "react";
import { X, Save, Loader2, Check, Package, DollarSign, Tag, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Product {
    id: number;
    name: string;
    price: number;
    originalPrice?: number | null;
    salePrice?: number | null;
    inventory: number;
    sku?: string | null;
    weight?: string | null;
    isVisible: boolean;
    featured: boolean;
    isOnSale: boolean;
    badgeText?: string | null;
    tags?: string | null;
}

interface ProductQuickEditProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: Partial<Product>) => Promise<void>;
}

export default function ProductQuickEdit({ product, isOpen, onClose, onSave }: ProductQuickEditProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize form data when product changes
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                salePrice: product.salePrice,
                inventory: product.inventory,
                sku: product.sku,
                weight: product.weight,
                isVisible: product.isVisible,
                featured: product.featured,
                isOnSale: product.isOnSale,
                badgeText: product.badgeText,
                tags: product.tags,
            });
            setHasChanges(false);
        }
    }, [product]);

    // Track changes
    useEffect(() => {
        const changed = 
            formData.name !== product.name ||
            formData.price !== product.price ||
            formData.originalPrice !== product.originalPrice ||
            formData.salePrice !== product.salePrice ||
            formData.inventory !== product.inventory ||
            formData.sku !== product.sku ||
            formData.weight !== product.weight ||
            formData.isVisible !== product.isVisible ||
            formData.featured !== product.featured ||
            formData.isOnSale !== product.isOnSale ||
            formData.badgeText !== product.badgeText ||
            formData.tags !== product.tags;
        setHasChanges(changed);
    }, [formData, product]);

    const handleSave = async () => {
        if (!hasChanges) return;
        
        setIsLoading(true);
        try {
            await onSave(String(product.id), formData);
            toast.success("Product updated successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to update product");
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field: keyof Product, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 rounded-2xl border border-zinc-700/40 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-700/40">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100">Quick Edit</h2>
                        <p className="text-sm text-zinc-500 mt-1">{product.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <X className="h-5 w-5 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Basic Information</h3>
                        
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name || ""}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        Price (USD)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price || 0}
                                        onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                                        className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Original Price
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.originalPrice || ""}
                                        onChange={(e) => updateField("originalPrice", e.target.value ? parseFloat(e.target.value) : null)}
                                        className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Sale Price
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.salePrice || ""}
                                        onChange={(e) => updateField("salePrice", e.target.value ? parseFloat(e.target.value) : null)}
                                        className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        <Archive className="w-4 h-4 inline mr-1" />
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.inventory || 0}
                                        onChange={(e) => updateField("inventory", parseInt(e.target.value) || 0)}
                                        className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SKU & Weight */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">SKU & Specifications</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    value={formData.sku || ""}
                                    onChange={(e) => updateField("sku", e.target.value || null)}
                                    className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                    placeholder="SKU-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    <Package className="w-4 h-4 inline mr-1" />
                                    Weight
                                </label>
                                <input
                                    type="text"
                                    value={formData.weight || ""}
                                    onChange={(e) => updateField("weight", e.target.value || null)}
                                    className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                    placeholder="500g"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Status</h3>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <label className={`
                                flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${formData.isVisible 
                                    ? "border-teal-500 bg-teal-500/10 text-teal-400" 
                                    : "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-600"
                                }
                            `}>
                                <input
                                    type="checkbox"
                                    checked={formData.isVisible}
                                    onChange={(e) => updateField("isVisible", e.target.checked)}
                                    className="sr-only"
                                />
                                {formData.isVisible ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                <span className="font-medium">{formData.isVisible ? "Visible" : "Hidden"}</span>
                            </label>

                            <label className={`
                                flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${formData.featured 
                                    ? "border-amber-500 bg-amber-500/10 text-amber-400" 
                                    : "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-600"
                                }
                            `}>
                                <input
                                    type="checkbox"
                                    checked={formData.featured}
                                    onChange={(e) => updateField("featured", e.target.checked)}
                                    className="sr-only"
                                />
                                {formData.featured ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                <span className="font-medium">Featured</span>
                            </label>

                            <label className={`
                                flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${formData.isOnSale 
                                    ? "border-red-500 bg-red-500/10 text-red-400" 
                                    : "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-600"
                                }
                            `}>
                                <input
                                    type="checkbox"
                                    checked={formData.isOnSale}
                                    onChange={(e) => updateField("isOnSale", e.target.checked)}
                                    className="sr-only"
                                />
                                {formData.isOnSale ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                <span className="font-medium">On Sale</span>
                            </label>
                        </div>
                    </div>

                    {/* Badge & Tags */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Labels</h3>
                        
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Badge Text
                                </label>
                                <input
                                    type="text"
                                    value={formData.badgeText || ""}
                                    onChange={(e) => updateField("badgeText", e.target.value || null)}
                                    className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                    placeholder="Best Seller, New, Limited..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags || ""}
                                    onChange={(e) => updateField("tags", e.target.value || null)}
                                    className="w-full h-12 px-4 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-teal-500/50"
                                    placeholder="giftable, premium, ready-to-serve"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-zinc-700/40">
                    <p className="text-sm text-zinc-500">
                        {hasChanges ? "You have unsaved changes" : "No changes"}
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || isLoading}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
