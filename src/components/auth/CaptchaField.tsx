"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useRef, useState } from "react";
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import { getPublicSettings } from "@/lib/public-settings";

/** Cloudflare Turnstile demo key — widget always passes. */
const TURNSTILE_DEMO_SITE_KEY = "1x00000000000000000000AA";

type CaptchaFieldProps = {
  onToken: (token: string) => void;
  onValidChange: (isValid: boolean) => void;
  className?: string;
};

function parseOnOff(value: unknown): boolean | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  if (v === "ON" || v === "TRUE" || v === "1" || v === "YES") return true;
  if (v === "OFF" || v === "FALSE" || v === "0" || v === "NO") return false;
  return null;
}

export function CaptchaField({ onToken, onValidChange, className }: CaptchaFieldProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [siteKey, setSiteKey] = useState("");

  // Use refs to avoid re-render loops: parent callbacks change identity on every render
  // which would cause useEffect to re-fire and reset captcha valid state
  const onTokenRef = useRef(onToken);
  const onValidChangeRef = useRef(onValidChange);
  onTokenRef.current = onToken;
  onValidChangeRef.current = onValidChange;

  // Track whether widget has already reported success/error to avoid effect overrides
  const widgetReportedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const settings = await getPublicSettings({ bypassCache: true });
      // API /api/public/settings trả về mapped keys: CAPTCHA_ENABLED, TURNSTILE_SITE_KEY
      const fromDb = parseOnOff(settings.CAPTCHA_ENABLED);
      const defaultEnabled = true;
      const hasSettings = Object.keys(settings).length > 0;
      const nextEnabled = hasSettings ? (fromDb ?? defaultEnabled) : true;
      const keyFromDb = (settings.TURNSTILE_SITE_KEY ?? "").trim();
      const keyFromEnv = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
      const nextSiteKey = keyFromDb || keyFromEnv || TURNSTILE_DEMO_SITE_KEY;
      if (cancelled) return;
      setEnabled(nextEnabled);
      setSiteKey(nextSiteKey);
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // Set initial captcha valid state based on enabled/siteKey — runs ONCE per state change
  useEffect(() => {
    if (enabled === false || (enabled === true && !siteKey)) {
      // Captcha disabled or no key → allow submit
      onTokenRef.current("");
      onValidChangeRef.current(true);
    } else if (enabled === true && siteKey && !widgetReportedRef.current) {
      // Captcha enabled with key, widget not yet reported → block submit, wait for widget
      onValidChangeRef.current(false);
    }
  }, [enabled, siteKey]);

  if (enabled === null) return null;
  if (!enabled || !siteKey) return null;

  return (
    <div className={className}>
      <TurnstileWidget
        siteKey={siteKey}
        onVerify={(token) => {
          widgetReportedRef.current = true;
          onTokenRef.current(token);
          onValidChangeRef.current(Boolean(token));
        }}
        onError={() => {
          widgetReportedRef.current = true;
          onTokenRef.current("");
          // Fail-safe: do not block user if widget errors (e.g. domain mismatch on localhost)
          onValidChangeRef.current(true);
        }}
        onExpire={() => {
          onTokenRef.current("");
          onValidChangeRef.current(false);
        }}
        theme="light"
      />
    </div>
  );
}
