/**
 * Seed script: Create/Update check-in milestone vouchers in DB
 * Run: npx tsx prisma/seed-checkin-vouchers.ts
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

const CHECKIN_VOUCHERS = [
    {
        code: "CHECKIN-200",
        discountType: "FIXED",
        discountValue: 3,
        maxDiscount: 3,
        minOrderValue: 0,
        category: "shipping",
    },
    {
        code: "CHECKIN-300",
        discountType: "PERCENTAGE",
        discountValue: 10,
        maxDiscount: 5,
        minOrderValue: 0,
        category: "checkin",
    },
    {
        code: "CHECKIN-500",
        discountType: "PERCENTAGE",
        discountValue: 20,
        maxDiscount: 8,
        minOrderValue: 0,
        category: "checkin",
    },
    {
        code: "CHECKIN-1000",
        discountType: "PERCENTAGE",
        discountValue: 40,
        maxDiscount: 10,
        minOrderValue: 0,
        category: "checkin",
    },
];

async function main() {
    console.log("🔄 Seeding check-in milestone vouchers...\n");

    for (const voucher of CHECKIN_VOUCHERS) {
        const result = await prisma.coupon.upsert({
            where: { code: voucher.code },
            update: {
                discountType: voucher.discountType,
                discountValue: voucher.discountValue,
                maxDiscount: voucher.maxDiscount,
                minOrderValue: voucher.minOrderValue,
                category: voucher.category,
                isActive: true,
                endDate: new Date("2035-12-31T23:59:59.999Z"),
            },
            create: {
                code: voucher.code,
                discountType: voucher.discountType,
                discountValue: voucher.discountValue,
                maxDiscount: voucher.maxDiscount,
                minOrderValue: voucher.minOrderValue,
                startDate: new Date(),
                endDate: new Date("2035-12-31T23:59:59.999Z"),
                isActive: true,
                usageLimit: null,
                usedCount: 0,
                category: voucher.category,
            },
        });

        const desc =
            voucher.discountType === "FIXED"
                ? `Free shipping $${voucher.discountValue}`
                : `${voucher.discountValue}% off, max $${voucher.maxDiscount}`;

        console.log(`  ✅ ${result.code} → ${desc} (id: ${result.id})`);
    }

    console.log("\n✨ Done! All check-in vouchers are ready.\n");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
