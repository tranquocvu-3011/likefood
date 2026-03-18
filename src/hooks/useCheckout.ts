"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 *
 * useCheckout – Custom hook chứa toàn bộ state management & business logic
 * cho luồng Checkout. Tách hoàn toàn khỏi UI để dễ maintain và test.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
// Stripe Checkout Sessions: no client-side SDK needed (redirect flow)
import { tracking } from "@/lib/tracking";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { getShippingFeeUsd } from "@/lib/commerce";

// ─── Types ───────────────────────────────────────────────────────────────

export interface CheckoutAddress {
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

export type PaymentMethod = "STRIPE" | "PICKUP";

export interface CheckoutVoucher {
    id: number;
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    discountAmount: number;
    minOrderValue: number | null;
    maxDiscount: number | null;
    category: string;
    canUse: boolean;
    reason: string;
}

export interface CheckoutFormData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    shippingMethod: string;
}



// ─── Hook ────────────────────────────────────────────────────────────────

export function useCheckout(language: string) {
    const router = useRouter();
    const { data: session } = useSession();
    const { items, totalPrice, clearCart } = useCart();


    // ── Core State ──
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, _setOrderId] = useState<number | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // ── Form Data ──
    const [formData, setFormData] = useState<CheckoutFormData>({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        shippingMethod: "standard",
    });
    const [saveInfo, setSaveInfo] = useState(false);
    const [orderNotes, setOrderNotes] = useState("");

    // ── Address Book ──
    const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

    // ── Voucher & Points ──
    const [selectedVoucher, setSelectedVoucher] = useState<CheckoutVoucher | null>(null);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [userPoints, setUserPoints] = useState(0);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);

    // ── Payment — Stripe only ──
    const [paymentMethod] = useState<PaymentMethod>("STRIPE");

    // ── Computed Values ──
    const shippingFee = useMemo(
        () => getShippingFeeUsd(totalPrice, formData.shippingMethod),
        [formData.shippingMethod, totalPrice]
    );

    const isPickup = formData.shippingMethod === "pickup";

    const pointsDiscount = useMemo(
        () => (usePoints ? pointsToUse / 100 : 0),
        [usePoints, pointsToUse]
    );

    const finalTotal = useMemo(() => {
        const discount = selectedVoucher?.discountAmount || 0;
        return Math.max(0, totalPrice + shippingFee - discount - pointsDiscount);
    }, [totalPrice, shippingFee, selectedVoucher, pointsDiscount]);

    const isCartEmpty = items.length === 0 && step < 3;

    // ── Load saved checkout info from localStorage ──
    useEffect(() => {
        const savedInfo = localStorage.getItem("checkout_info");
        if (savedInfo && !session?.user) {
            try {
                const parsed = JSON.parse(savedInfo);
                setFormData(prev => ({
                    ...prev,
                    fullName: parsed.fullName || "",
                    email: parsed.email || "",
                    phone: parsed.phone || "",
                    address: parsed.address || "",
                    city: parsed.city || "",
                    zipCode: parsed.zipCode || "",
                }));
                setSaveInfo(true);
            } catch (e) {
                console.error("Failed to load saved checkout info", e);
            }
        }
    }, [session]);

    // ── Load user points ──
    useEffect(() => {
        if (!session?.user) return;
        const loadPoints = async () => {
            try {
                const res = await fetch("/api/user/points");
                if (res.ok) {
                    const data = await res.json();
                    setUserPoints(data.points || 0);
                }
            } catch (err) {
                console.error("Failed to load user points", err);
            }
        };
        loadPoints();
    }, [session]);



    // ── Load saved addresses ──
    useEffect(() => {
        if (!session?.user) return;
        const loadAddresses = async () => {
            try {
                setIsLoadingAddresses(true);
                const res = await fetch("/api/user/addresses");
                if (!res.ok) return;
                const data: CheckoutAddress[] = await res.json();
                setAddresses(data);
                if (data.length > 0) {
                    const defaultAddr = data.find(a => a.isDefault) || data[0];
                    setSelectedAddressId(defaultAddr.id);
                    setFormData(prev => ({
                        ...prev,
                        fullName: defaultAddr.fullName,
                        phone: defaultAddr.phone,
                        address: defaultAddr.address,
                        city: defaultAddr.city,
                        zipCode: defaultAddr.zipCode,
                    }));
                }
            } catch (err) {
                logger.error("Failed to load addresses for checkout", err as Error, { context: "checkout-page" });
            } finally {
                setIsLoadingAddresses(false);
            }
        };
        loadAddresses();
    }, [session]);

    // ── Auto-apply best voucher ──
    useEffect(() => {
        if (!session?.user || selectedVoucher || totalPrice === 0) return;
        const autoApplyVoucher = async () => {
            try {
                const res = await fetch(`/api/vouchers/checkout?orderTotal=${totalPrice}`);
                if (res.ok) {
                    const data = await res.json();
                    const vouchers = data.vouchers || [];
                    const bestVoucher = vouchers.find((v: CheckoutVoucher) => v.canUse);
                    if (bestVoucher) setSelectedVoucher(bestVoucher);
                }
            } catch (error) {
                logger.warn("Failed to auto-apply voucher", { context: "checkout-page", error: error as Error });
            }
        };
        autoApplyVoucher();
    }, [session, totalPrice, selectedVoucher]);

    // ── Validation ──
    const validateForm = useCallback((): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            errors.fullName = language === "vi" ? "Vui lòng nhập họ tên" : "Full name is required";
        }
        if (!formData.email.trim()) {
            errors.email = language === "vi" ? "Vui lòng nhập email" : "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = language === "vi" ? "Email không hợp lệ" : "Invalid email format";
        }
        if (!formData.phone.trim()) {
            errors.phone = language === "vi" ? "Vui lòng nhập số điện thoại" : "Phone number is required";
        }
        // Skip address validation for pickup
        if (formData.shippingMethod !== "pickup") {
            if (!formData.address.trim()) {
                errors.address = language === "vi" ? "Vui lòng nhập địa chỉ" : "Address is required";
            }
            if (!formData.city.trim()) {
                errors.city = language === "vi" ? "Vui lòng nhập thành phố" : "City is required";
            }
        }

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error(language === "vi" ? "Vui lòng điền đầy đủ thông tin" : "Please fill in all required information");
            return false;
        }
        return true;
    }, [formData, language]);

    // ── Navigation ──
    const nextStep = useCallback(() => {
        if (step === 1 && !validateForm()) return;
        setStep(s => s + 1);
    }, [step, validateForm]);
    const prevStep = useCallback(() => setStep(s => s - 1), []);

    // ── Select Address ──
    const selectAddress = useCallback((addr: CheckoutAddress) => {
        setSelectedAddressId(addr.id);
        setFormData(prev => ({
            ...prev,
            fullName: addr.fullName,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            zipCode: addr.zipCode,
        }));
    }, []);

    // ── Toggle Points ──
    const togglePoints = useCallback(() => {
        const newVal = !usePoints;
        setUsePoints(newVal);
        if (newVal) {
            setPointsToUse(
                Math.min(userPoints, Math.floor((totalPrice - (selectedVoucher?.discountAmount || 0)) * 100))
            );
        }
    }, [usePoints, userPoints, totalPrice, selectedVoucher]);

    // ── Update form field ──
    const updateField = useCallback((field: keyof CheckoutFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error khi user bắt đầu sửa field
        if (formErrors[field]) {
            setFormErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    }, [formErrors]);

    // ── Handle Checkout Submission ──
    const handleOrder = useCallback(async () => {
        if (isSubmitting) return;
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            // Stock check
            try {
                const stockRes = await fetch("/api/products/check-stock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: items.map(item => ({
                            productId: item.productId,
                            variantId: item.variantId || null,
                            quantity: item.quantity,
                        })),
                    }),
                });
                if (stockRes.ok) {
                    const stockData = await stockRes.json();
                    if (stockData.outOfStock && stockData.outOfStock.length > 0) {
                        const names = stockData.outOfStock.map((i: { name: string }) => i.name).join(", ");
                        toast.error(
                            language === "vi"
                                ? `Sản phẩm đã hết hàng: ${names}. Vui lòng cập nhật giỏ hàng.`
                                : `Out of stock: ${names}. Please update your cart.`
                        );
                        setIsSubmitting(false);
                        return;
                    }
                }
            } catch {
                logger.warn("Stock check API unavailable, proceeding without check", { context: "checkout-page" });
            }

            tracking.beginCheckout(totalPrice, items.map(item => ({
                item_id: String(item.id), item_name: item.name, price: item.price, quantity: item.quantity,
            })));

            if (saveInfo) {
                localStorage.setItem("checkout_info", JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    zipCode: formData.zipCode,
                }));
            }

            // ── ALL ORDERS GO THROUGH STRIPE (including pickup) ──
            const checkoutPayload = {
                items: items.map(item => ({
                    productId: item.productId || item.id,
                    variantId: item.variantId || null,
                    quantity: item.quantity,
                })),
                shippingAddress: formData.shippingMethod === "pickup"
                    ? "Store Pickup"
                    : formData.address,
                shippingCity: formData.shippingMethod === "pickup"
                    ? ""
                    : formData.city,
                shippingZipCode: formData.shippingMethod === "pickup"
                    ? ""
                    : formData.zipCode,
                shippingPhone: formData.phone,
                shippingMethod: formData.shippingMethod,
                fullName: formData.fullName,
                email: formData.email,
                couponCode: selectedVoucher?.canUse ? selectedVoucher.code : null,
                pointsToUse: usePoints ? pointsToUse : 0,
                notes: orderNotes.trim() || `Order for ${formData.fullName}`,
            };

            const sessionRes = await fetch("/api/checkout/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkoutPayload),
            });

            if (!sessionRes.ok) {
                const errorData = await sessionRes.json().catch(() => ({}));
                throw new Error(errorData.error || (language === "vi"
                    ? "Không thể tạo phiên thanh toán"
                    : "Failed to create checkout session"));
            }

            const sessionData = await sessionRes.json();

            if (sessionData.url) {
                // KHÔNG xóa cart ở đây - chỉ xóa khi thanh toán thành công
                // Lý do: nếu user hủy hoặc không thanh toán, giỏ hàng vẫn còn
                window.location.href = sessionData.url;
                return;
            } else {
                throw new Error(language === "vi"
                    ? "Không nhận được URL thanh toán"
                    : "No checkout URL received");
            }
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");
            logger.error("Checkout error", err, { context: "checkout-page" });
            toast.error(err.message || (language === "vi" ? "Đã có lỗi xảy ra. Vui lòng thử lại." : "An error occurred. Please try again."));
        } finally {
            setIsSubmitting(false);
        }
    }, [
        validateForm, totalPrice, items, formData,
        selectedVoucher, usePoints, pointsToUse, saveInfo, clearCart, language, orderNotes, router,
    ]);

    return {
        // State
        step, isSubmitting, orderId, formData, formErrors, saveInfo, addresses,
        isLoadingAddresses, selectedAddressId, selectedVoucher, showVoucherModal,
        userPoints, usePoints, pointsToUse, paymentMethod,
        items, totalPrice, isCartEmpty, session,

        // Computed
        shippingFee, pointsDiscount, finalTotal, isPickup,

        // Actions
        nextStep, prevStep, selectAddress, togglePoints, updateField, validateForm,
        setFormData, setSaveInfo, setSelectedVoucher, setShowVoucherModal,
        handleOrder, orderNotes, setOrderNotes,
    };
}
