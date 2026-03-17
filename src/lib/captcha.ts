/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type CaptchaConfig = {
  enabled: boolean;
  source: "db" | "env" | "default";
  hasSiteKey: boolean;
  hasSecretKey: boolean;
};

export type CaptchaVerifyResult =
  | { ok: true; skipped: boolean }
  | { ok: false; code: "MISSING_TOKEN" | "VERIFY_FAILED" | "UNAVAILABLE"; message: string };

const CAPTCHA_SETTING_KEY = "security_captcha_enabled" as const;
const TURNSTILE_SITE_KEY = "turnstile_site_key" as const;
const TURNSTILE_SECRET_KEY = "turnstile_secret_key" as const;

function parseOnOff(value: unknown): boolean | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  if (v === "ON" || v === "TRUE" || v === "1" || v === "YES") return true;
  if (v === "OFF" || v === "FALSE" || v === "0" || v === "NO") return false;
  return null;
}

/** Get Turnstile secret: DB (admin) first, then env. Never expose to client. */
export async function getTurnstileSecret(): Promise<string> {
  try {
    const row = await prisma.systemsetting.findUnique({ where: { key: TURNSTILE_SECRET_KEY } });
    const v = row?.value?.trim();
    if (v) return v;
  } catch {
    // ignore
  }
  return (process.env.TURNSTILE_SECRET_KEY ?? "").trim();
}

export async function getCaptchaConfig(): Promise<CaptchaConfig> {
  let dbSiteKey = "";
  let dbSecretKey = "";
  try {
    const rows = await prisma.systemsetting.findMany({
      where: { key: { in: [TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY] } },
    });
    for (const r of rows) {
      if (r.key === TURNSTILE_SITE_KEY) dbSiteKey = (r.value ?? "").trim();
      if (r.key === TURNSTILE_SECRET_KEY) dbSecretKey = (r.value ?? "").trim();
    }
  } catch {
    // ignore
  }
  const envSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
  const envSecretKey = (process.env.TURNSTILE_SECRET_KEY ?? "").trim();
  const hasSiteKey = Boolean(dbSiteKey || envSiteKey);
  const hasSecretKey = Boolean(dbSecretKey || envSecretKey);

  // 1) DB overrides (preferred) — allows admin toggle without redeploy.
  try {
    const row = await prisma.systemsetting.findUnique({ where: { key: CAPTCHA_SETTING_KEY } });
    const parsed = parseOnOff(row?.value);
    if (parsed !== null) {
      return { enabled: parsed, source: "db", hasSiteKey, hasSecretKey };
    }
  } catch (error) {
    logger.warn("[CAPTCHA] Failed to read system setting", {
      context: "captcha-config",
      key: CAPTCHA_SETTING_KEY,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const envFlag = parseOnOff(process.env.CAPTCHA_ENABLED);
  if (envFlag !== null) {
    return { enabled: envFlag, source: "env", hasSiteKey, hasSecretKey };
  }

  // Default: luôn bật captcha (cả dev lẫn production) — đồng bộ với client CaptchaField
  const defaultEnabled = true;
  return { enabled: defaultEnabled, source: "default", hasSiteKey, hasSecretKey };
}

function getRemoteIp(req: Request): string | undefined {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return undefined;
}

function getRemoteIpFromHeaders(headers: Headers): string | undefined {
  const xf = headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim();
  const xr = headers.get("x-real-ip");
  if (xr) return xr.trim();
  return undefined;
}

export async function verifyTurnstileToken(params: {
  req: Request;
  token: string | undefined | null;
  action?: string;
}): Promise<CaptchaVerifyResult> {
  const config = await getCaptchaConfig();
  if (!config.enabled) return { ok: true, skipped: true };

  // If keys are missing, do not hard-fail user flows — warn loudly instead.
  if (!config.hasSiteKey || !config.hasSecretKey) {
    logger.warn("[CAPTCHA] Turnstile enabled but keys missing — bypassing", {
      context: "turnstile-verify",
      enabledSource: config.source,
      hasSiteKey: config.hasSiteKey,
      hasSecretKey: config.hasSecretKey,
    });
    return { ok: true, skipped: true };
  }

  const secret = await getTurnstileSecret();
  const response = (params.token ?? "").trim();
  if (!response) {
    const isTestKey = secret === "1x0000000000000000000000000000000AA" || secret === "2x0000000000000000000000000000000AA" || secret === "3x0000000000000000000000000000000AA";
    if (isTestKey) {
      logger.info("[CAPTCHA] Test key detected with empty token — bypassing", {
        context: "turnstile-verify",
        action: params.action,
      });
      return { ok: true, skipped: true };
    }
    return { ok: false, code: "MISSING_TOKEN", message: "Vui lòng hoàn thành xác thực CAPTCHA." };
  }

  try {
    const ip = getRemoteIp(params.req);
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response,
        ...(ip ? { remoteip: ip } : {}),
      }).toString(),
    });

    const data = (await verifyRes.json().catch(() => null)) as
      | { success?: boolean; "error-codes"?: string[] }
      | null;

    if (!data?.success) {
      logger.info("[CAPTCHA] Turnstile verification failed", {
        context: "turnstile-verify",
        action: params.action,
        ip: ip ?? "unknown",
        errorCodes: data?.["error-codes"] ?? [],
      });
      return { ok: false, code: "VERIFY_FAILED", message: "Xác thực CAPTCHA thất bại. Vui lòng thử lại." };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    logger.warn("[CAPTCHA] Turnstile verification unavailable", {
      context: "turnstile-verify",
      action: params.action,
      error: error instanceof Error ? error.message : String(error),
    });
    // Fail-safe: do not block the user if Cloudflare is temporarily unreachable.
    return { ok: true, skipped: true };
  }
}

export async function verifyTurnstileTokenFromHeaders(params: {
  headers: Headers;
  token: string | undefined | null;
  action?: string;
}): Promise<CaptchaVerifyResult> {
  const config = await getCaptchaConfig();
  if (!config.enabled) return { ok: true, skipped: true };

  if (!config.hasSiteKey || !config.hasSecretKey) {
    logger.warn("[CAPTCHA] Turnstile enabled but keys missing — bypassing", {
      context: "turnstile-verify",
      enabledSource: config.source,
      hasSiteKey: config.hasSiteKey,
      hasSecretKey: config.hasSecretKey,
    });
    return { ok: true, skipped: true };
  }

  const secret = await getTurnstileSecret();
  const response = (params.token ?? "").trim();
  if (!response) {
    // If using Cloudflare test keys (always-pass), bypass when token is empty
    // This handles localhost where Turnstile widget errors due to domain mismatch
    const isTestKey = secret === "1x0000000000000000000000000000000AA" || secret === "2x0000000000000000000000000000000AA" || secret === "3x0000000000000000000000000000000AA";
    if (isTestKey) {
      logger.info("[CAPTCHA] Test key detected with empty token — bypassing", {
        context: "turnstile-verify",
        action: params.action,
      });
      return { ok: true, skipped: true };
    }
    return { ok: false, code: "MISSING_TOKEN", message: "Vui lòng hoàn thành xác thực CAPTCHA." };
  }

  try {
    const ip = getRemoteIpFromHeaders(params.headers);
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response,
        ...(ip ? { remoteip: ip } : {}),
      }).toString(),
    });

    const data = (await verifyRes.json().catch(() => null)) as
      | { success?: boolean; "error-codes"?: string[] }
      | null;

    if (!data?.success) {
      logger.info("[CAPTCHA] Turnstile verification failed", {
        context: "turnstile-verify",
        action: params.action,
        ip: ip ?? "unknown",
        errorCodes: data?.["error-codes"] ?? [],
      });
      return { ok: false, code: "VERIFY_FAILED", message: "Xác thực CAPTCHA thất bại. Vui lòng thử lại." };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    logger.warn("[CAPTCHA] Turnstile verification unavailable", {
      context: "turnstile-verify",
      action: params.action,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: true, skipped: true };
  }
}

