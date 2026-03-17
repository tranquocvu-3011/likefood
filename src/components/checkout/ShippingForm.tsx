"use client";

import { useEffect, useState } from "react";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * ShippingForm – Contact & shipping information (SaaS-style redesign)
 */

import { Sparkles, ChevronRight, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CheckoutAddressSkeleton from "./CheckoutAddressSkeleton";
import VoucherAndPoints from "./VoucherAndPoints";
import type { CheckoutAddress, CheckoutFormData, CheckoutVoucher } from "@/hooks/useCheckout";
import {
    FREE_SHIPPING_THRESHOLD_USD,
    EXPRESS_SHIPPING_FEE_USD,
    OVERNIGHT_SHIPPING_FEE_USD,
    getShippingFeeUsd,
    STORE_ADDRESS as DEFAULT_STORE_ADDRESS,
    STORE_GOOGLE_MAPS_URL as DEFAULT_STORE_MAPS_URL,
} from "@/lib/commerce";

interface ShippingFormProps {
    language: string;
    t: (key: string) => string;
    formData: CheckoutFormData;
    updateField: (field: keyof CheckoutFormData, value: string) => void;
    saveInfo: boolean;
    setSaveInfo: (v: boolean) => void;
    isLoggedIn: boolean;
    addresses: CheckoutAddress[];
    isLoadingAddresses: boolean;
    selectedAddressId: number | null;
    selectAddress: (addr: CheckoutAddress) => void;
    selectedVoucher: CheckoutVoucher | null;
    setSelectedVoucher: (v: CheckoutVoucher | null) => void;
    showVoucherModal: boolean;
    setShowVoucherModal: (v: boolean) => void;
    userPoints: number;
    usePoints: boolean;
    pointsToUse: number;
    togglePoints: () => void;
    totalPrice: number;
    formErrors: Record<string, string>;
    onNext: () => void;
    isSubmitting?: boolean;
}

const inputBase =
    "w-full border rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white";

const US_STATES = [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida",
    "Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine",
    "Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska",
    "Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota",
    "Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
    "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

export default function ShippingForm({
    language,
    t,
    formData,
    updateField,
    saveInfo,
    setSaveInfo,
    isLoggedIn,
    addresses,
    isLoadingAddresses,
    selectedAddressId,
    selectAddress,
    selectedVoucher,
    setSelectedVoucher,
    showVoucherModal,
    setShowVoucherModal,
    userPoints,
    usePoints,
    pointsToUse,
    togglePoints,
    totalPrice,
    formErrors,
    onNext,
    isSubmitting = false,
}: ShippingFormProps) {
    const vi = language === "vi";

    // Fetch dynamic store address from admin settings
    const [storeAddress, setStoreAddress] = useState(DEFAULT_STORE_ADDRESS);
    const [storeMapsUrl, setStoreMapsUrl] = useState(DEFAULT_STORE_MAPS_URL);
    useEffect(() => {
        fetch("/api/public/store-address")
            .then(res => res.json())
            .then(data => {
                if (data.address) setStoreAddress(data.address);
                if (data.mapsUrl) setStoreMapsUrl(data.mapsUrl);
            })
            .catch(() => {});
    }, []);

    const shippingMethods = [
        {
            id: "pickup",
            name: vi ? "Đến cửa hàng nhận" : "Store Pickup",
            time: vi ? "Nhận ngay tại cửa hàng" : "Pick up at store",
            price: 0,
            free: true,
            estimatedDays: 0,
            isPickup: true,
        },
        {
            id: "standard",
            name: vi ? "Giao hàng tiêu chuẩn" : "Standard Shipping",
            time: vi ? "3-5 ngày làm việc" : "3-5 business days",
            price:
                totalPrice >= FREE_SHIPPING_THRESHOLD_USD
                    ? 0
                    : getShippingFeeUsd(totalPrice, "standard"),
            free: totalPrice >= FREE_SHIPPING_THRESHOLD_USD,
            estimatedDays: 4,
            isPickup: false,
        },
        {
            id: "express",
            name: vi ? "Giao hàng nhanh" : "Express Shipping",
            time: vi ? "1-2 ngày làm việc" : "1-2 business days",
            price: EXPRESS_SHIPPING_FEE_USD,
            free: false,
            estimatedDays: 2,
            isPickup: false,
        },
        {
            id: "overnight",
            name: vi ? "Giao trong ngày" : "Same-day Delivery",
            time: vi ? "Trong ngày (trước 12h)" : "Same day (order before 12pm)",
            price: OVERNIGHT_SHIPPING_FEE_USD,
            free: false,
            estimatedDays: 1,
            isPickup: false,
        },
    ];

    return (
        <div className="space-y-5">

            {/* Guest notice */}
            {!isLoggedIn && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-amber-800">
                            {vi ? "Đang mua hàng với tư cách khách" : "Checking out as guest"}
                        </p>
                        <p className="text-[11px] text-amber-600 mt-0.5">
                            {vi ? "Nhập email để nhận xác nhận đơn hàng. " : "Enter your email to receive order confirmation. "}
                            <Link href="/login" className="underline font-semibold hover:text-amber-700">
                                {vi ? "Đăng nhập" : "Sign in"}
                            </Link>
                        </p>
                    </div>
                </div>
            )}

            {/* Saved addresses */}
            {isLoggedIn && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {vi ? "Địa chỉ đã lưu" : "Saved addresses"}
                        </p>
                        <Link
                            href="/profile"
                            className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                            {vi ? "Quản lý" : "Manage"}
                        </Link>
                    </div>

                    {isLoadingAddresses ? (
                        <CheckoutAddressSkeleton />
                    ) : addresses.length === 0 ? (
                        <p className="text-xs text-slate-400">
                            {vi
                                ? "Chưa có địa chỉ. Thêm địa chỉ trong Profile để dùng nhanh."
                                : "No saved addresses. Add one in Profile for quick use here."}
                        </p>
                    ) : (
                        <div className="grid gap-1.5">
                            {addresses.map((addr) => (
                                <button
                                    key={addr.id}
                                    type="button"
                                    onClick={() => selectAddress(addr)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                                        selectedAddressId === addr.id
                                            ? "border-primary bg-primary/5"
                                            : "border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-slate-900 text-xs">
                                                {addr.fullName}
                                                {addr.isDefault && (
                                                    <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                                        {vi ? "Mặc định" : "Default"}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {addr.address}, {addr.city} {addr.state || ""} {addr.zipCode}
                                            </p>
                                            <p className="text-[10px] text-slate-500">{addr.phone}</p>
                                        </div>
                                        {selectedAddressId === addr.id && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Contact Information ── */}
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    {vi ? "Thông tin liên hệ" : "Contact Information"}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Full name */}
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            {vi ? "Họ và tên" : "Full name"}
                        </label>
                        <input
                            type="text"
                            autoComplete="name"
                            value={formData.fullName}
                            onChange={(e) => updateField("fullName", e.target.value)}
                            placeholder={vi ? "Nguyễn Văn A" : "Jane Smith"}
                            className={`${inputBase} ${formErrors.fullName ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400" : "border-slate-200"}`}
                        />
                        <FieldError msg={formErrors.fullName} />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            placeholder="you@example.com"
                            className={`${inputBase} ${formErrors.email ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400" : "border-slate-200"}`}
                        />
                        <FieldError msg={formErrors.email} />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            {vi ? "Số điện thoại" : "Phone number"}
                        </label>
                        <input
                            type="tel"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={(e) => updateField("phone", e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className={`${inputBase} ${formErrors.phone ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400" : "border-slate-200"}`}
                        />
                        <FieldError msg={formErrors.phone} />
                    </div>
                </div>
            </div>

            {/* ── Delivery Address (hidden when pickup) ── */}
            {formData.shippingMethod !== "pickup" && (
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    {vi ? "Địa chỉ nhận hàng (tại Mỹ)" : "Delivery address (US only)"}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    {/* Street address */}
                    <div className="sm:col-span-12">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            {vi ? "Địa chỉ" : "Street address"}
                        </label>
                        <input
                            type="text"
                            autoComplete="street-address"
                            value={formData.address}
                            onChange={(e) => updateField("address", e.target.value)}
                            placeholder={vi ? "123 Đường Hương Vị..." : "123 Flavor St, Apt 4B"}
                            className={`${inputBase} ${formErrors.address ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400" : "border-slate-200"}`}
                        />
                        <FieldError msg={formErrors.address} />
                    </div>

                    {/* City */}
                    <div className="sm:col-span-5">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            {vi ? "Thành phố" : "City"}
                        </label>
                        <input
                            type="text"
                            autoComplete="address-level2"
                            value={formData.city}
                            onChange={(e) => updateField("city", e.target.value)}
                            placeholder="Omaha"
                            className={`${inputBase} ${formErrors.city ? "border-red-400 bg-red-50/30 focus:ring-red-200 focus:border-red-400" : "border-slate-200"}`}
                        />
                        <FieldError msg={formErrors.city} />
                    </div>

                    
                    {/* State */}
                    <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            {vi ? "Bang" : "State"}
                        </label>
                        <select
                            autoComplete="address-level1"
                            value={formData.state || ""}
                            onChange={(e) => updateField("state", e.target.value)}
                            className={`${inputBase} ${formErrors.state ? "border-red-400 bg-red-50/30" : "border-slate-200"}`}
                        >
                            <option value="">{vi ? "Chon bang..." : "Select state..."}</option>
                            {US_STATES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <FieldError msg={formErrors.state} />
                    </div>
                    {/* Zip code */}
                    <div className="sm:col-span-4">
                        <label className="block text-xs font-medium text-slate-700 mb-1">ZIP Code</label>
                        <input
                            type="text"
                            autoComplete="postal-code"
                            value={formData.zipCode}
                            onChange={(e) => updateField("zipCode", e.target.value)}
                            placeholder="92840"
                            maxLength={10}
                            className={`${inputBase} border-slate-200`}
                        />
                    </div>

                    {/* Save info checkbox */}
                    <div className="sm:col-span-12 pt-1">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={saveInfo}
                                onChange={(e) => setSaveInfo(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
                            />
                            <span className="text-xs text-slate-600">
                                {vi ? "Lưu thông tin cho lần sau" : "Save this info for next time"}
                            </span>
                        </label>
                    </div>
                </div>
            </div>
            )}

            {/* ── Discounts & Points ── */}
            <div className="border-t border-slate-100 pt-4">
                <VoucherAndPoints
                    language={language}
                    t={t}
                    selectedVoucher={selectedVoucher}
                    setSelectedVoucher={setSelectedVoucher}
                    setShowVoucherModal={setShowVoucherModal}
                    userPoints={userPoints}
                    usePoints={usePoints}
                    pointsToUse={pointsToUse}
                    togglePoints={togglePoints}
                />
            </div>

            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    {vi ? "Phương thức nhận hàng" : "Delivery method"}
                </p>
                <div className="space-y-2">
                    {shippingMethods.map((method) => {
                        const estimatedDate = method.estimatedDays > 0 ? (() => {
                            const d = new Date();
                            d.setDate(d.getDate() + method.estimatedDays);
                            return d.toLocaleDateString(vi ? "vi-VN" : "en-US", {
                                day: "numeric",
                                month: "long",
                            });
                        })() : null;
                        const isSelected = formData.shippingMethod === method.id;
                        return (
                            <div key={method.id}>
                                <button
                                    type="button"
                                    onClick={() => updateField("shippingMethod", method.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-2 transition-all text-left ${
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        {/* Radio dot */}
                                        <div
                                            className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                isSelected ? "border-primary" : "border-slate-300"
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-900">
                                                {method.isPickup && <MapPin className="w-3 h-3 inline mr-1 text-primary" />}
                                                {method.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {method.time}
                                                {estimatedDate && (
                                                    <>
                                                        {" · "}
                                                        <span className="text-primary font-medium">
                                                            {vi ? "Dk:" : "Est:"} {estimatedDate}
                                                        </span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {method.free ? (
                                            <span className="text-xs font-bold text-emerald-600">
                                                {vi ? "Miễn phí" : "Free"}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-900">
                                                ${method.price.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </button>
                                {/* Store Pickup info + Google Maps button */}
                                {method.isPickup && isSelected && (
                                    <div className="ml-6 mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                        <p className="text-xs text-slate-700 font-medium">
                                            📍 {storeAddress}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {vi
                                                ? "Thanh toán online qua Stripe, sau đó đến cửa hàng nhận hàng."
                                                : "Pay online via Stripe, then visit the store to pick up your order."}
                                        </p>
                                        <a
                                            href={storeMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            {vi ? "Chỉ đường" : "Get Directions"}
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Button
                type="button"
                onClick={onNext}
                disabled={isSubmitting}
                className="w-full h-9 rounded-md bg-slate-900 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {vi ? "Đang chuyển đến Stripe..." : "Redirecting to Stripe..."}
                    </>
                ) : (
                    <>
                        {vi ? "Thanh toán qua Stripe" : "Pay with Stripe"}
                        <ChevronRight className="w-3.5 h-3.5" />
                    </>
                )}
            </Button>
        </div>
    );
}
