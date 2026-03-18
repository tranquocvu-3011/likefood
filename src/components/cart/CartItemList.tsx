"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Trash2, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/context";
import QuantitySelector from "@/components/ui/quantity-selector";
import PriceDisplay from "@/components/ui/price-display";

export interface CartItem {
    id: string | number;
    name: string;
    slug?: string;
    price: number;
    originalPrice?: number;
    salePrice?: number;
    isOnSale?: boolean;
    quantity: number;
    image?: string;
    inventory?: number;
    productId: number;
}

interface CartItemListProps {
    items: CartItem[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleAll: () => void;
    allSelected: boolean;
    someSelected: boolean;
    onRemoveItem: (id: string) => void;
    onUpdateQuantity: (id: string, quantity: number) => void;
    onRemoveSelected: (ids: Set<string>) => void;
    onSaveForLater: (item: CartItem) => void;
}

export function CartItemList({
    items,
    selectedIds,
    onToggleSelect,
    onToggleAll,
    allSelected,
    someSelected,
    onRemoveItem,
    onUpdateQuantity,
    onRemoveSelected,
    onSaveForLater,
}: CartItemListProps) {
  const { t } = useLanguage();
    const { language } = useLanguage();
    const session = useSession();

    return (
        <div className="space-y-6">
            {/* Select All Bar */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <button
                    onClick={onToggleAll}
                    className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
                >
                    {allSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                    ) : someSelected ? (
                        <div className="relative">
                            <Square className="w-5 h-5 text-primary" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2.5 h-0.5 bg-primary rounded" />
                            </div>
                        </div>
                    ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                    )}
                    {t('cart.selectAll')} ({items.length} {t('cart.items')})
                </button>
                {selectedIds.size > 0 && (
                    <button
                        onClick={() => onRemoveSelected(selectedIds)}
                        className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t('cart.removeItem')} ({selectedIds.size})
                    </button>
                )}
            </div>

            {/* Cart Items */}
            {items.map((item) => (
                <div
                    key={item.id}
                    className={`flex gap-4 md:gap-8 p-5 md:p-6 bg-white rounded-3xl border transition-all ${selectedIds.has(String(item.id)) ? 'border-primary/30 shadow-md shadow-primary/5' : 'border-slate-100 shadow-sm'
                        }`}
                >
                    {/* Checkbox */}
                    <button
                        onClick={() => onToggleSelect(String(item.id))}
                        className="flex-shrink-0 mt-1 md:mt-5 p-2 -ml-2"
                    >
                        {selectedIds.has(String(item.id)) ? (
                            <CheckSquare className="w-6 h-6 text-primary" />
                        ) : (
                            <Square className="w-6 h-6 text-slate-300 hover:text-slate-400 transition-colors" />
                        )}
                    </button>

                    {/* Image */}
                    <Link
                        href={`/products/${item.slug || item.id}`}
                        className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-3xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-100 flex items-center justify-center group/img relative"
                    >
                        <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover/img:scale-110"
                            sizes="128px"
                        />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <div className="flex justify-between items-start">
                                <Link href={`/products/${item.slug || item.id}`}>
                                    <h3 className="font-black text-lg md:text-xl hover:text-primary transition-colors tracking-tight line-clamp-1">{item.name}</h3>
                                </Link>
                                <button
                                    onClick={() => onRemoveItem(String(item.id))}
                                    className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <PriceDisplay
                                currentPrice={item.price}
                                originalPrice={item.originalPrice}
                                salePrice={item.salePrice}
                                isOnSale={item.isOnSale || (item.originalPrice != null && item.originalPrice > item.price)}
                                size="md"
                                className="mt-1"
                                showDiscountBadge={false}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                                <QuantitySelector
                                    value={item.quantity}
                                    min={1}
                                    max={item.inventory || 99}
                                    onChange={(newQty) => onUpdateQuantity(String(item.id), newQty)}
                                    size="md"
                                />
                                {session.data?.user ? (
                                    <button
                                        onClick={() => onSaveForLater(item)}
                                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
                                    >
                                        {t('cart.saveForLater')}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
