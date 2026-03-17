/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { resolveMx } from "dns/promises";
import { logger } from "./logger";

/**
 * Kiểm tra bản ghi DNS MX (Mail Exchange) để xác nhận Domain có Mail Server thật
 * (Chỉ chạy ở Server Side - API Routes)
 * Lưu ý: Trả về true nếu không resolve được DNS (graceful degradation)
 */
export const hasMXRecord = async (email: string): Promise<boolean> => {
    const domain = email.split("@")[1];
    if (!domain) return false;

    // Bỏ qua local/development domains
    if (domain === 'localhost' || domain === 'test.com' || domain.endsWith('.local')) {
        return true;
    }

    try {
        const records = await resolveMx(domain);
        return records && records.length > 0;
    } catch {
        // Graceful degradation: nếu không resolve được DNS, cho phép tiếp tục
        // (Tránh block user khi DNS server có vấn đề)
        logger.warn(`[DNS] Không tìm thấy bản ghi MX cho domain: ${domain}, cho phép tiếp tục`);
        return true;
    }
};
