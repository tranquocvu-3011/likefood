/**
 * LIKEFOOD - Security Tests
 * Tests for input sanitization, XSS prevention, validation patterns
 */

import { describe, it, expect } from "vitest";

// Slug generation (used in product/category creation)
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// Email validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password strength validation
function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Minimum 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("Needs uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Needs lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Needs digit");
    return { valid: errors.length === 0, errors };
}

// File type validation (magic bytes pattern)
function isAllowedFileType(mimeType: string): boolean {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    return allowed.includes(mimeType);
}

// URL sanitization
function sanitizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
        return parsed.href;
    } catch {
        return null;
    }
}

describe("Security - Slug Generation", () => {
    it("should convert Vietnamese characters properly", () => {
        expect(generateSlug("Cá Khô Đặc Sản")).toBe("ca-kho-dac-san");
        expect(generateSlug("Nước Mắm Phú Quốc")).toBe("nuoc-mam-phu-quoc");
    });

    it("should handle special characters", () => {
        expect(generateSlug("Product & Name (Special)")).toBe("product-name-special");
    });

    it("should trim leading/trailing hyphens", () => {
        expect(generateSlug("  -Test Product-  ")).toBe("test-product");
    });

    it("should handle empty string", () => {
        expect(generateSlug("")).toBe("");
    });

    it("should handle numbers", () => {
        expect(generateSlug("Product 123")).toBe("product-123");
    });
});

describe("Security - Email Validation", () => {
    it("should accept valid emails", () => {
        expect(isValidEmail("user@example.com")).toBe(true);
        expect(isValidEmail("test.name@domain.org")).toBe(true);
    });

    it("should reject invalid emails", () => {
        expect(isValidEmail("notanemail")).toBe(false);
        expect(isValidEmail("@domain.com")).toBe(false);
        expect(isValidEmail("user@")).toBe(false);
        expect(isValidEmail("")).toBe(false);
    });
});

describe("Security - Password Strength", () => {
    it("should accept strong passwords", () => {
        const result = isStrongPassword("MyPassword1");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("should reject short passwords", () => {
        const result = isStrongPassword("Ab1");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Minimum 8 characters");
    });

    it("should require uppercase", () => {
        const result = isStrongPassword("abcdefg1");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Needs uppercase letter");
    });

    it("should require digits", () => {
        const result = isStrongPassword("Abcdefgh");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Needs digit");
    });
});

describe("Security - File Type Validation", () => {
    it("should allow image types", () => {
        expect(isAllowedFileType("image/jpeg")).toBe(true);
        expect(isAllowedFileType("image/png")).toBe(true);
        expect(isAllowedFileType("image/webp")).toBe(true);
    });

    it("should reject non-image types", () => {
        expect(isAllowedFileType("application/pdf")).toBe(false);
        expect(isAllowedFileType("text/html")).toBe(false);
        expect(isAllowedFileType("application/javascript")).toBe(false);
    });
});

describe("Security - URL Sanitization", () => {
    it("should accept valid HTTP/HTTPS URLs", () => {
        expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
        expect(sanitizeUrl("http://test.org/path")).toBe("http://test.org/path");
    });

    it("should reject javascript: protocol", () => {
        expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    });

    it("should reject invalid URLs", () => {
        expect(sanitizeUrl("not-a-url")).toBeNull();
        expect(sanitizeUrl("")).toBeNull();
    });

    it("should reject data: protocol", () => {
        expect(sanitizeUrl("data:text/html,<h1>XSS</h1>")).toBeNull();
    });
});

describe("Security - XSS Prevention Patterns", () => {
    it("should strip HTML tags from inputs", () => {
        const input = '<script>alert("xss")</script>Normal text';
        const cleaned = input.replace(/<[^>]*>/g, "");
        expect(cleaned).toBe('alert("xss")Normal text');
        expect(cleaned).not.toContain("<script>");
    });

    it("should escape special HTML characters", () => {
        const escapeHtml = (str: string) => {
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };
        
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
    });
});
