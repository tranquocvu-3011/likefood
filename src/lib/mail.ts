/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import nodemailer from "nodemailer";
import { logger } from "./logger";
import { getSystemSettingTrimmed } from "@/lib/system-settings";

import { escapeHtml } from "@/lib/text-utils";

async function getMailTransporter() {
    const host = (await getSystemSettingTrimmed("smtp_host")) || process.env.SMTP_HOST || "smtp.gmail.com";
    const portRaw = (await getSystemSettingTrimmed("smtp_port")) || process.env.SMTP_PORT || "587";
    const user = (await getSystemSettingTrimmed("smtp_user")) || process.env.SMTP_USER || "";
    const pass = (await getSystemSettingTrimmed("smtp_pass")) || process.env.SMTP_PASS || "";
    const port = Number.parseInt(portRaw, 10);
    const safePort = Number.isFinite(port) ? port : 587;

    return nodemailer.createTransport({
        host,
        port: safePort,
        secure: String(safePort) === "465",
        auth: user && pass ? { user, pass } : undefined,
    });
}

async function getMailFrom(): Promise<string | undefined> {
    const from = (await getSystemSettingTrimmed("smtp_from")) || process.env.SMTP_FROM;
    return from || undefined;
}

async function getContactInbox(): Promise<string | undefined> {
    const inbox = (await getSystemSettingTrimmed("contact_inbox")) || process.env.CONTACT_INBOX;
    return inbox || undefined;
}

export const sendVerificationEmail = async (
    email: string,
    otp: string,
    type: "VERIFY" | "PASSWORD_RESET" | "2FA" | "MAGIC_LINK" = "VERIFY",
    magicUrl?: string,
    verifyUrl?: string
) => {
    logger.info(`[MAIL SEND] Attempting to send ${type} to ${email}`);
    const transporter = await getMailTransporter();

    const isReset = type === "PASSWORD_RESET";
    const isMagicLink = type === "MAGIC_LINK";
    const is2FA = type === "2FA";
    const subject = isMagicLink
        ? "Link đăng nhập LIKEFOOD của bạn"
        : isReset
            ? "Khôi phục mật khẩu LIKEFOOD"
            : is2FA
                ? "Mã xác thực 2 bước LIKEFOOD"
                : "Xác thực tài khoản LIKEFOOD của bạn";
    const title = isMagicLink
        ? "Link đăng nhập không cần mật khẩu"
        : isReset
            ? "Yêu cầu khôi phục mật khẩu"
            : is2FA
                ? "Mã xác thực 2 bước"
                : "Mã xác thực của bạn";
    const desc = isMagicLink
        ? "Nhấn vào nút bên dưới để đăng nhập vào tài khoản LIKEFOOD của bạn. Link chỉ có hiệu lực 15 phút."
        : isReset
            ? "Bạn nhận được email này vì chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn."
            : is2FA
                ? "Sử dụng mã OTP 6 chữ số bên dưới để hoàn tất xác thực 2 bước. Mã có hiệu lực trong 10 phút."
                : "Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình đăng ký tài khoản.";

    const otpBlock = `<div style="background: white; border: 2px dashed #10b981; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; display: inline-block;">${otp}</div><p style="color: #9ca3af; font-size: 12px; margin-top: 25px;">Mã này sẽ hết hạn sau ${isReset ? "15 phút" : is2FA ? "10 phút" : "24 giờ"}. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.</p>`;
    const bodyContent = isMagicLink
        ? `<a href="${magicUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-decoration: none; margin: 16px 0;">Đăng nhập ngay</a><p style="color:#9ca3af;font-size:12px;margin-top:16px;">Hoặc copy link: ${magicUrl}</p>`
        : (!isReset && !is2FA && verifyUrl)
            ? `${otpBlock}<div style="margin-top:20px;"><a href="${verifyUrl}" style="display:inline-block;background:#10b981;color:white;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;text-decoration:none;">Xác thực tài khoản ngay</a></div><p style="color:#9ca3af;font-size:11px;margin-top:12px;">Hoặc dán đường dẫn vào trình duyệt: ${verifyUrl}</p>`
            : otpBlock;

    const mailOptions = {
        from: await getMailFrom(),
        to: email,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #10b981; margin: 0;">LIKEFOOD</h1>
                    <p style="color: #6b7280; font-size: 14px;">Tinh hoa đặc sản Việt Nam</p>
                </div>
                <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px; text-align: center;">
                    <h2 style="color: #111827; margin-bottom: 10px;">${title}</h2>
                    <p style="color: #4b5563; margin-bottom: 25px;">${desc}</p>
                    ${bodyContent}
                </div>
                <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                    &copy; 2026 LIKEFOOD Team. All rights reserved.
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`[MAIL SUCCESS] ID: ${info.messageId} - To: ${email}`);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown mail error";
        logger.error(`[MAIL ERROR] ${message}`, error as Error, { email, smtpHost: process.env.SMTP_HOST });
        return { success: false, error: message };
    }
};

interface ContactPayload {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

export const sendContactEmail = async (payload: ContactPayload) => {
    const { name, email, phone, subject, message } = payload;

    logger.info(`[MAIL SEND] Contact message from ${email}`);
    const transporter = await getMailTransporter();

    const mailOptions = {
        from: await getMailFrom(),
        to: (await getContactInbox()) || (await getMailFrom()) || email,
        replyTo: email,
        subject: `[LIKEFOOD Contact] ${escapeHtml(subject)}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e1e1e1; border-radius: 12px;">
                <h2 style="color: #111827; margin-top: 0; margin-bottom: 16px;">Tin nhắn liên hệ mới từ LIKEFOOD</h2>
                <p style="color: #4b5563; margin-bottom: 24px;">Bạn nhận được một tin nhắn mới từ form liên hệ trên website.</p>

                <div style="background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Họ và tên</p>
                    <p style="margin: 4px 0 0; color: #111827; font-weight: 600;">${escapeHtml(name)}</p>
                </div>

                <div style="background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Email</p>
                    <p style="margin: 4px 0 0; color: #111827; font-weight: 600;">${escapeHtml(email)}</p>
                </div>

                ${phone
                ? `<div style="background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Số điện thoại</p>
                    <p style="margin: 4px 0 0; color: #111827; font-weight: 600;">${escapeHtml(phone)}</p>
                </div>`
                : ""
            }

                <div style="background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Chủ đề</p>
                    <p style="margin: 4px 0 0; color: #111827; font-weight: 600;">${escapeHtml(subject)}</p>
                </div>

                <div style="background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Nội dung tin nhắn</p>
                    <p style="margin: 8px 0 0; color: #111827; white-space: pre-line;">${escapeHtml(message)}</p>
                </div>

                <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
                    Email này được gửi tự động từ LIKEFOOD Contact Form.
                </p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`[MAIL SUCCESS] Contact ID: ${info.messageId} - From: ${email}`);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown mail error";
        logger.info(`[MAIL ERROR][CONTACT] ${message}`);
        return { success: false, error: message };
    }
};

interface OrderSummaryPayload {
    orderId: number;
    toEmail: string;
    total: number;
    status: string;
    createdAt: Date;
}

export const sendOrderConfirmationEmail = async (payload: OrderSummaryPayload) => {
    const { orderId, toEmail, total, status, createdAt } = payload;

    logger.info(`[MAIL SEND] Order confirmation for ${orderId} -> ${toEmail}`);
    const transporter = await getMailTransporter();

    const subject = `Xác nhận đơn hàng LIKEFOOD #${String(orderId).slice(-8).toUpperCase()}`;

    const mailOptions = {
        from: await getMailFrom(),
        to: toEmail,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e1e1e1; border-radius: 12px;">
                <h2 style="color: #111827; margin-top: 0; margin-bottom: 8px;">Cảm ơn bạn đã đặt hàng tại LIKEFOOD!</h2>
                <p style="color: #4b5563; margin-top: 0; margin-bottom: 16px;">
                    Đơn hàng của bạn đã được tiếp nhận và đang ở trạng thái <strong>${status}</strong>.
                </p>

                <div style="background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Mã đơn hàng</p>
                    <p style="margin: 4px 0 0; color: #111827; font-weight: 700; font-size: 18px;">
                        #${String(orderId).slice(-8).toUpperCase()}
                    </p>
                </div>

                <div style="background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Ngày đặt</p>
                    <p style="margin: 4px 0 0; color: #111827; font-weight: 600;">
                        ${createdAt.toLocaleString("vi-VN")}
                    </p>
                </div>

                <div style="background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Tổng tiền</p>
                    <p style="margin: 4px 0 0; color: #111827; font-weight: 700; font-size: 20px;">
                        $${total.toFixed(2)}
                    </p>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
                    Bạn có thể xem chi tiết đơn hàng của mình trong mục <strong>Đơn hàng của tôi</strong> trên website LIKEFOOD.
                </p>

                <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                    Email này được gửi tự động từ hệ thống LIKEFOOD. Vui lòng không trả lời trực tiếp email này.
                </p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`[MAIL SUCCESS] Order confirmation ID: ${info.messageId} - To: ${toEmail}`);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown mail error";
        logger.info(`[MAIL ERROR][ORDER_CONFIRMATION] ${message}`);
        return { success: false, error: message };
    }
};

export const sendSuspiciousLoginEmail = async (email: string, ip: string, userAgent: string, time: string) => {
    logger.info(`[MAIL SEND] Suspicious login alert to ${email} (IP: ${ip})`);
    const transporter = await getMailTransporter();

    const mailOptions = {
        from: await getMailFrom(),
        to: email,
        subject: "🚨 CẢNH BÁO BẢO MẬT: Đăng nhập từ thiết bị lạ",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #ef4444; margin: 0;">CẢNH BÁO ĐĂNG NHẬP</h1>
                </div>
                <div style="background-color: #fef2f2; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #991b1b; margin-top: 0; font-size: 18px;">Chúng tôi phát hiện lượt truy cập bất thường vào tài khoản của bạn!</h2>
                    <p style="color: #7f1d1d; margin-bottom: 20px; font-size: 14px;">
                        Hệ thống bảo vệ của LIKEFOOD nhận thấy tài khoản của bạn vừa được đăng nhập thành công từ một <strong>Địa chỉ IP lạ</strong> chưa từng xuất hiện trước đây.
                    </p>
                    <div style="background: white; border: 1px solid #fca5a5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <ul style="list-style: none; padding: 0; margin: 0; color: #b91c1c; font-size: 14px;">
                            <li style="margin-bottom: 8px;"><strong>⏱ Thời gian:</strong> ${time}</li>
                            <li style="margin-bottom: 8px;"><strong>🌐 Địa chỉ IP:</strong> ${ip}</li>
                            <li><strong>💻 Thiết bị:</strong> ${userAgent || "Không xác định"}</li>
                        </ul>
                    </div>
                    <p style="color: #991b1b; font-weight: bold; font-size: 15px;">Nếu đây KHÔNG PHẢI là bạn:</p>
                    <p style="color: #7f1d1d; font-size: 14px;">Tài khoản của bạn có thể đã bị lộ mật khẩu. Vui lòng lập tức truy cập website đổi mật khẩu và bật Xác thực 2 bước (2FA).</p>
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/forgot-password" style="display: inline-block; background: #ef4444; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">ĐỔI MẬT KHẨU NGAY</a>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                    Bảo mật tự động 2026 &copy; LIKEFOOD Team.
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`[MAIL SUCCESS] Suspicious alert sent: ${info.messageId}`);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown mail error";
        logger.error(`[MAIL ERROR][SUSPICIOUS_LOGIN] ${message}`);
        return { success: false, error: message };
    }
};

export const sendNewsletterWelcomeEmail = async (email: string) => {
    logger.info(`[MAIL SEND] Newsletter welcome to ${email}`);
    const transporter = await getMailTransporter();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const mailOptions = {
        from: await getMailFrom(),
        to: email,
        subject: "🎉 Chào mừng bạn đến với LIKEFOOD – Ưu đãi độc quyền đang chờ!",
        html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#059669 0%,#10b981 50%,#34d399 100%);padding:40px 32px;text-align:center;">
    <h1 style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">LIKEFOOD</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;">Tinh hoa đặc sản Việt Nam</p>
  </div>

  <!-- Hero message -->
  <div style="padding:36px 32px 24px;text-align:center;">
    <div style="font-size:40px;margin-bottom:12px;">🎊</div>
    <h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#111827;">
      Cảm ơn bạn đã đăng ký nhận tin!
    </h2>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;max-width:420px;margin:0 auto;">
      Bạn vừa gia nhập cộng đồng <strong style="color:#059669;">LIKEFOOD</strong> —
      nơi hội tụ những tín đồ ẩm thực yêu thích đặc sản Việt Nam.
      Từ đây, bạn sẽ là người đầu tiên nhận được:
    </p>
  </div>

  <!-- Benefits -->
  <div style="padding:0 32px 28px;">
    <div style="display:grid;gap:12px;">
      ${[
        ["🏷️", "Mã giảm giá độc quyền", "Voucher ưu đãi chỉ dành riêng cho thành viên newsletter"],
        ["🔥", "Flash Sale sớm nhất", "Thông báo trước 24h khi có chương trình giảm giá lớn"],
        ["🍤", "Món ngon mỗi tuần", "Công thức chế biến và câu chuyện về đặc sản từng vùng miền"],
        ["🚚", "Ưu tiên miễn phí ship", "Đơn hàng đặc biệt từ cộng đồng newsletter sẽ được ưu tiên"],
      ].map(([icon, title, desc]) => `
        <div style="display:flex;align-items:flex-start;gap:14px;background:#f9fafb;border-radius:10px;padding:14px 16px;border:1px solid #f0fdf4;">
          <span style="font-size:20px;flex-shrink:0;margin-top:1px;">${icon}</span>
          <div>
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#111827;">${title}</p>
            <p style="margin:0;font-size:12px;color:#6b7280;">${desc}</p>
          </div>
        </div>
      `).join("")}
    </div>
  </div>

  <!-- CTA -->
  <div style="padding:0 32px 32px;text-align:center;">
    <a href="${appUrl}/products"
       style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:50px;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
      🛒 Khám phá đặc sản ngay
    </a>
    <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;">
      Hoặc xem các chương trình khuyến mãi tại
      <a href="${appUrl}/products?sale=true" style="color:#059669;text-decoration:underline;">trang Flash Sale</a>
    </p>
  </div>

  <!-- Divider -->
  <div style="height:1px;background:#f0f0f0;margin:0 32px;"></div>

  <!-- Footer -->
  <div style="padding:20px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.7;">
      Bạn nhận được email này vì đã đăng ký nhận bản tin tại <strong>likefood.shop</strong>.<br/>
      Để hủy đăng ký, vui lòng liên hệ qua trang <a href="${appUrl}/contact" style="color:#059669;">Liên hệ</a>.<br/>
      &copy; 2026 LIKEFOOD Team. All rights reserved.
    </p>
  </div>

</div>
</body>
</html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`[MAIL SUCCESS] Newsletter welcome ID: ${info.messageId} - To: ${email}`);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown mail error";
        logger.error(`[MAIL ERROR][NEWSLETTER_WELCOME] ${message}`, error as Error, { email });
        return { success: false, error: message };
    }
};
