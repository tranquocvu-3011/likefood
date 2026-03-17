/**
 * LIKEFOOD — Shared Text Utilities
 * Hàm tiện ích dùng chung: detect language, escape HTML, etc.
 * Copyright (c) 2026 LIKEFOOD Team
 */

// ─── Language Detection ──────────────────────────────────────

/**
 * Detect if text is Vietnamese or English.
 * Checks: (1) Vietnamese diacritics, (2) common Vietnamese words without diacritics.
 */
export function detectLanguage(text: string): "vi" | "en" {
  const lower = text.toLowerCase().trim();
  if (!lower) return "vi";

  // Check Vietnamese diacritical marks first
  if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/u.test(lower)) return "vi";

  // Check common Vietnamese words (with AND without diacritics)
  const normalized = ` ${lower.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d")} `;
  const vietnameseMarkers = [
    " ban ", " minh ", " toi ", " muon ", " mua ", " tim ", " cho ", " voi ", " cua ",
    " giao hang", " khuyen mai", " don hang", " san pham", " gia vi", " dat hang",
    " bao nhieu", " the nao", " o dau", " khi nao", " co khong", " duoc khong",
    " nhe ", " nha ", " a ", " nhi ", " qua ", " rat ", " lam ",
    " tra ", " che ", " banh ", " mut ", " qua bieu", " an vat", " do uong",
    " cua hang", " website", " shop", " mua sam", " gio hang", " thanh toan",
    " loi ich", " tot cho", " tot khong", " nen mua", " goi y cho",
    " cach", " nhu the nao", " lam the nao", " lam sao", " ra sao",
    " trang web", " co gi", " ca gi", " ca kho", " tom ", " muc ", " keo ",
    " gia bao", " goi y", " tu van", " xin chao", " cam on",
    " co nhung", " mon gi", " nhan vien", " ho tro", " giup ", " xem ",
    " ship ", " giao ", " hang ", " loai nao",
  ];
  return vietnameseMarkers.some((marker) => normalized.includes(marker)) ? "vi" : "en";
}

// ─── HTML Escaping ───────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS.
 * Used in Telegram messages, emails, and notifications.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
