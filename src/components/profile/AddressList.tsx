"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Edit, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

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

interface AddressListProps {
    addresses: Address[];
    isLoading: boolean;
    showAddressForm: boolean;
    editingAddress: Address | null;
    onShowForm: (show: boolean) => void;
    onEditAddress: (address: Address | null) => void;
    onSave: (data: Partial<Address>) => void;
    onDelete: (id: string) => void;
}

export function AddressList({
    addresses,
    isLoading: _isLoading,
    showAddressForm: _showAddressForm,
    editingAddress: _editingAddress,
    onShowForm,
    onEditAddress,
    onSave: _onSave,
    onDelete,
}: AddressListProps) {
    const { language } = useLanguage();

    return (
        <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.5rem]">
            <CardContent className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-primary" />
                        {language === "vi" ? "Địa chỉ giao hàng" : "Shipping Addresses"}
                    </h2>
                    <Button
                        onClick={() => {
                            onEditAddress(null);
                            onShowForm(true);
                        }}
                        className="rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {language === "vi" ? "Thêm địa chỉ" : "Add address"}
                    </Button>
                </div>

                {addresses.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">{language === "vi" ? "Chưa có địa chỉ nào" : "No addresses yet"}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {addresses.map((address) => (
                            <div
                                key={address.id}
                                className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 hover:border-primary/30 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {address.isDefault && (
                                            <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                                                {language === "vi" ? "Mặc định" : "Default"}
                                            </span>
                                        )}
                                        <p className="font-black text-lg text-slate-900 mb-1">{address.fullName}</p>
                                        <p className="text-slate-600 font-medium">{address.address}</p>
                                        <p className="text-slate-600 font-medium">
                                            {address.city}{address.state ? `, ${address.state}` : ""} {address.zipCode}
                                        </p>
                                        <p className="text-slate-500 text-sm mt-1">{address.phone}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                onEditAddress(address);
                                                onShowForm(true);
                                            }}
                                            className="p-2 hover:bg-white rounded-2xl transition-colors text-slate-400 hover:text-primary"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(String(address.id))}
                                            className="p-2 hover:bg-white rounded-2xl transition-colors text-slate-400 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface AddressFormProps {
    address: Address | null;
    isLoading: boolean;
    onSave: (data: Partial<Address>) => void;
    onCancel: () => void;
}

export function AddressForm({ address, isLoading, onSave, onCancel }: AddressFormProps) {
    const { language } = useLanguage();
    const [formData, setFormData] = useState({
        fullName: address?.fullName || "",
        phone: address?.phone || "",
        address: address?.address || "",
        city: address?.city || "",
        state: address?.state || "",
        zipCode: address?.zipCode || "",
        country: address?.country || "USA",
        isDefault: address?.isDefault || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        {language === "vi" ? "Họ và tên *" : "Full name *"}
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        {language === "vi" ? "Số điện thoại *" : "Phone number *"}
                    </label>
                    <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>
            <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    {language === "vi" ? "Địa chỉ *" : "Address *"}
                </label>
                <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        {language === "vi" ? "Thành phố *" : "City *"}
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        {language === "vi" ? "Bang/Tiểu bang" : "State"}
                    </label>
                    <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        {language === "vi" ? "Mã ZIP *" : "Zip code *"}
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="w-full bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm font-bold text-slate-600">
                    {language === "vi" ? "Đặt làm địa chỉ mặc định" : "Set as default address"}
                </label>
            </div>
            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === "vi" ? "Lưu địa chỉ" : "Save address")}
                </Button>
                <Button
                    type="button"
                    onClick={onCancel}
                    variant="outline"
                    className="flex-1 h-12 rounded-full"
                >
                    {language === "vi" ? "Hủy" : "Cancel"}
                </Button>
            </div>
        </form>
    );
}
