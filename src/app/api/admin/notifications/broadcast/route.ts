/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { getSystemSettingTrimmed } from "@/lib/system-settings";

const broadcastSchema = z.object({
    title: z.string().min(1, "Title bắt buộc").max(200, "Title tối đa 200 ký tự"),
    message: z.string().min(1, "Message bắt buộc").max(2000, "Message tối đa 2000 ký tự"),
    link: z.string().url().optional().nullable(),
    channelInApp: z.boolean().default(true),
    channelEmail: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized: Super Admin only" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = broadcastSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const { title, message, link, channelInApp, channelEmail } = parsed.data;

        // Lấy danh sách user đã verify email (để gửi email)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                emailVerified: true,
                name: true,
            },
        });

        const userIds = users.map((u) => u.id);

        // Create in-app notifications in batches of 500
        if (channelInApp && userIds.length > 0) {
            const CHUNK_SIZE = 500;
            for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
                const chunk = userIds.slice(i, i + CHUNK_SIZE);
                await prisma.notification.createMany({
                    data: chunk.map((userId) => ({
                        userId,
                        type: "system",
                        title,
                        message,
                        link: link || null,
                        isRead: false,
                        createdAt: new Date(),
                    })),
                });
            }
        }

        // Gửi email hàng loạt
        if (channelEmail) {
            const verifiedUsers = users.filter((u) => u.email && u.emailVerified);
            
            if (verifiedUsers.length === 0) {
                logger.warn("No verified users found for email broadcast", { context: "admin-broadcast-email" });
            } else {
                // Kiểm tra SMTP đã được cấu hình chưa
                const smtpHost = await getSystemSettingTrimmed("smtp_host") || process.env.SMTP_HOST;
                const smtpUser = await getSystemSettingTrimmed("smtp_user") || process.env.SMTP_USER;
                const smtpPass = await getSystemSettingTrimmed("smtp_pass") || process.env.SMTP_PASS;

                if (!smtpHost || !smtpUser || !smtpPass) {
                    logger.error("Email broadcast failed: SMTP not configured", undefined, { context: "admin-broadcast-email" });
                    return NextResponse.json(
                        { error: "SMTP chưa được cấu hình. Vui lòng cấu hình SMTP trong phần cài đặt." },
                        { status: 400 }
                    );
                }

                // Gửi email theo batch để tránh overload
                const EMAIL_BATCH_SIZE = 50;
                const EMAIL_DELAY_MS = 1000; // 1 giây delay giữa các batch

                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < verifiedUsers.length; i += EMAIL_BATCH_SIZE) {
                    const batch = verifiedUsers.slice(i, i + EMAIL_BATCH_SIZE);
                    
                    const emailResults = await Promise.allSettled(
                        batch.map((user) =>
                            sendEmail({
                                to: user.email!,
                                subject: `[LIKEFOOD] ${title}`,
                                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                                        <div style="text-align: center; margin-bottom: 20px;">
                                            <h1 style="color: #10b981; margin: 0;">LIKEFOOD</h1>
                                            <p style="color: #6b7280; font-size: 14px;">Tinh hoa đặc sản Việt Nam</p>
                                        </div>
                                        <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px;">
                                            <h2 style="color: #111827; margin-bottom: 10px;">${title}</h2>
                                            <p style="color: #4b5563; margin-bottom: 20px; line-height: 1.6;">${message.replace(/\n/g, "<br/>")}</p>
                                            ${link ? `<p style="text-align: center; margin-top: 20px;"><a href="${link}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Xem chi tiết</a></p>` : ""}
                                        </div>
                                        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                                            &copy; 2026 LIKEFOOD Team. All rights reserved.
                                        </div>
                                    </div>
                                `,
                            })
                        )
                    );

                    // Đếm kết quả
                    emailResults.forEach((result) => {
                        if (result.status === "fulfilled" && result.value.success) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    });

                    // Delay giữa các batch để tránh bị SMTP server block
                    if (i + EMAIL_BATCH_SIZE < verifiedUsers.length) {
                        await new Promise((resolve) => setTimeout(resolve, EMAIL_DELAY_MS));
                    }
                }

                logger.info(`Email broadcast completed: ${successCount} sent, ${failCount} failed`, {
                    context: "admin-broadcast-email",
                    total: verifiedUsers.length,
                    success: successCount,
                    failed: failCount,
                });

                return NextResponse.json({
                    success: true,
                    inApp: { total: userIds.length },
                    email: { total: verifiedUsers.length, success: successCount, failed: failCount },
                });
            }
        }

        return NextResponse.json({ success: true, inApp: { total: userIds.length } });
    } catch (error) {
        logger.error("Admin broadcast notification error", error as Error, {
            context: "admin-broadcast",
        });
        return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
    }
}

