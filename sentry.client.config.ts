/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,

  // Trace a percentage of requests for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set the environment tag
  environment: process.env.NODE_ENV ?? "development",

  // Capture unhandled promise rejections
  integrations: [],

  // Only send errors in production unless explicitly enabled
  beforeSend(event) {
    if (process.env.NODE_ENV !== "production" && !process.env.SENTRY_DSN) {
      return null;
    }
    return event;
  },
});
