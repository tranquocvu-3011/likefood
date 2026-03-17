/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import QRCode from "qrcode";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, amount, orderId, bankAccount, bankName, momoPhone, zaloPayPhone } = body;

        if (!type || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let qrData = "";

        // Generate QR code based on payment type
        switch (type) {
            case "BANK":
                if (!bankAccount || !bankName) {
                    return NextResponse.json({ error: "Bank account details required" }, { status: 400 });
                }
                // Format: Banking transfer info
                qrData = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.jpg?amount=${amount}&addInfo=LIKEFOOD ${orderId || ""}`;
                break;

            case "MOMO":
                if (!momoPhone) {
                    return NextResponse.json({ error: "MoMo phone number required" }, { status: 400 });
                }
                // Format: MoMo payment
                qrData = `2|99|${momoPhone}||0|0|${amount}|LIKEFOOD ${orderId || ""}`;
                break;

            case "ZALOPAY":
                if (!zaloPayPhone) {
                    return NextResponse.json({ error: "ZaloPay phone number required" }, { status: 400 });
                }
                // Format: ZaloPay payment
                qrData = `https://zaloapp.com/pay/${zaloPayPhone}?amount=${amount}&desc=LIKEFOOD ${orderId || ""}`;
                break;

            default:
                return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
        }

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        });

        return NextResponse.json({
            qrCode: qrCodeDataUrl,
            type,
            amount,
            orderId
        }, { status: 200 });

    } catch (error) {
        logger.error("[QR_GENERATE_ERROR]", error as Error, { context: "payments-qr-api" });
        return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "BANK";
        const amount = searchParams.get("amount");
        const orderId = searchParams.get("orderId");

        if (!amount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        // Get payment settings from database
        const settings = await prisma.systemsetting.findMany({
            where: {
                key: {
                    in: [
                        "bank_name",
                        "bank_account_number",
                        "bank_account_name",
                        "payment_momo_enabled",
                        "zalo_pay_enabled"
                    ]
                }
            }
        });

        const settingsMap = settings.reduce((acc: Record<string, string>, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        let qrCodeDataUrl = "";
        const bankName = settingsMap.bank_name || "MB";
        const bankAccount = settingsMap.bank_account_number || "";

        if (type === "BANK" && bankAccount) {
            // Generate VietQR for bank transfer
            const qrData = `https://img.vietqr.io/image/${encodeURIComponent(bankName)}-${bankAccount}-compact2.jpg?amount=${amount}&addInfo=LIKEFOOD ${orderId || ""}`;
            qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2
            });
        } else if (type === "MOMO") {
            // For MoMo, we just generate a placeholder QR
            // In production, you'd integrate with MoMo's API
            qrCodeDataUrl = await QRCode.toDataURL(`MOMO|${amount}|${orderId || ""}`, {
                width: 300,
                margin: 2
            });
        } else if (type === "ZALOPAY") {
            // For ZaloPay, generate placeholder QR
            qrCodeDataUrl = await QRCode.toDataURL(`ZALOPAY|${amount}|${orderId || ""}`, {
                width: 300,
                margin: 2
            });
        }

        return NextResponse.json({
            qrCode: qrCodeDataUrl,
            type,
            amount,
            orderId,
            bankName,
            bankAccount
        }, { status: 200 });

    } catch (error) {
        logger.error("[QR_GET_ERROR]", error as Error, { context: "payments-qr-api" });
        return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
    }
}
