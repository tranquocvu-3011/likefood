/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

// Re-export POST from the parent newsletter route so both
// /api/newsletter  and  /api/newsletter/subscribe  resolve correctly.
// Footer.tsx calls /api/newsletter/subscribe, this bridges the gap.
export { POST } from "../route";
