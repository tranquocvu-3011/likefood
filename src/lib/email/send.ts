/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * LIKEFOOD - Gửi email qua Nodemailer (SMTP) hoặc Resend khi có cấu hình.
 * Cấu hình: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS hoặc RESEND_API_KEY.
 */
import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: "SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)" };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@likefood.com";
  try {
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text ?? options.html?.replace(/<[^>]*>/g, "") ?? "",
      html: options.html,
      replyTo: options.replyTo,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Send email error:", message);
    return { success: false, error: message };
  }
}
