/**
 * LIKEFOOD - SEO Utility Functions
 * Helpers for meta description, text processing, etc.
 */

/**
 * Cắt chuỗi tại ranh giới khoảng trắng gần nhất, không vượt quá maxLen.
 * Thêm "..." nếu chuỗi bị cắt.
 *
 * @param text  - Chuỗi gốc cần cắt
 * @param maxLen - Độ dài tối đa (mặc định 155 ký tự — chuẩn Google meta description)
 * @returns Chuỗi đã được cắt gọn hoặc nguyên bản nếu đủ ngắn
 */
export function truncateDescription(text: string, maxLen: number = 155): string {
    if (!text) return "";
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (cleaned.length <= maxLen) return cleaned;

    // Cắt tại ranh giới khoảng trắng gần nhất (không đứt giữa từ)
    const truncated = cleaned.slice(0, maxLen);
    const lastSpace = truncated.lastIndexOf(" ");

    // Nếu không tìm thấy khoảng trắng, cắt cứng (hiếm xảy ra)
    const result = lastSpace > maxLen * 0.5 ? truncated.slice(0, lastSpace) : truncated;
    return result + "...";
}
