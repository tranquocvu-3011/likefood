/**
 * LIKEFOOD - Sanitize Utility Tests
 */

import { describe, it, expect } from "vitest";
import { sanitizeHtml, stripHtml, containsDangerousHtml } from "@/lib/sanitize";

describe("Sanitize Utilities", () => {
  describe("sanitizeHtml", () => {
    it("should allow safe HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const result = sanitizeHtml(input);
      expect(result).toContain("<p>");
      expect(result).toContain("<strong>");
    });

    it("should remove script tags", () => {
      const input = "<p>Hello</p><script>alert('xss')</script>";
      const result = sanitizeHtml(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("should remove event handlers", () => {
      const input = '<button onclick="alert(1)">Click</button>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("onclick");
    });

    it("should remove javascript: URLs", () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("javascript:");
    });

    it("should handle empty string", () => {
      expect(sanitizeHtml("")).toBe("");
    });

    it("should handle null/undefined", () => {
      expect(sanitizeHtml(null as any)).toBe("");
      expect(sanitizeHtml(undefined as any)).toBe("");
    });

    it("should allow safe attributes like href and src", () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="https://example.com"');
    });

    it("should remove dangerous attributes", () => {
      const input = '<img src="x" onerror="alert(1)" />';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("onerror");
    });
  });

  describe("stripHtml", () => {
    it("should remove all HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const result = stripHtml(input);
      expect(result).toBe("Hello World");
    });

    it("should decode HTML entities", () => {
      const input = "&lt;p&gt;Hello&lt;/p&gt;";
      const result = stripHtml(input);
      expect(result).toBe("<p>Hello</p>");
    });

    it("should handle empty string", () => {
      expect(stripHtml("")).toBe("");
    });

    it("should sanitize before stripping", () => {
      const input = "<script>alert(1)</script><p>Hello</p>";
      const result = stripHtml(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
      expect(result).toBe("Hello");
    });
  });

  describe("containsDangerousHtml", () => {
    it("should detect script tags", () => {
      expect(containsDangerousHtml("<script>alert(1)</script>")).toBe(true);
    });

    it("should detect javascript: URLs", () => {
      expect(containsDangerousHtml('<a href="javascript:alert(1)">')).toBe(true);
    });

    it("should detect event handlers", () => {
      expect(containsDangerousHtml('<img onerror="alert(1)" />')).toBe(true);
    });

    it("should detect iframe tags", () => {
      expect(containsDangerousHtml("<iframe src='evil'></iframe>")).toBe(true);
    });

    it("should detect object/embed tags", () => {
      expect(containsDangerousHtml("<object data='evil'></object>")).toBe(true);
      expect(containsDangerousHtml("<embed src='evil'></embed>")).toBe(true);
    });

    it("should detect form tags", () => {
      expect(containsDangerousHtml("<form action='evil'></form>")).toBe(true);
    });

    it("should return false for safe HTML", () => {
      expect(containsDangerousHtml("<p>Hello</p>")).toBe(false);
      expect(containsDangerousHtml("<a href='https://example.com'>Link</a>")).toBe(false);
    });

    it("should handle empty string", () => {
      expect(containsDangerousHtml("")).toBe(false);
    });
  });
});
