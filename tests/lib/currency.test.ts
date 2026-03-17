/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Currency utility tests
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { describe, it, expect } from 'vitest';
import { formatPrice, formatPriceNumber, parsePrice, getCurrencySymbol, formatVndEquivalent } from '@/lib/currency';

describe('Currency Utils', () => {
  describe('formatPrice', () => {
    it('should format a number as USD currency', () => {
      expect(formatPrice(9.99)).toMatch(/9\.99/);
      expect(formatPrice(100)).toMatch(/100/);
      expect(formatPrice(0)).toMatch(/0/);
    });

    it('should include dollar sign', () => {
      expect(formatPrice(5.5)).toContain('$');
    });

    it('should handle negative amounts', () => {
      expect(formatPrice(-10)).toContain('10');
    });
  });

  describe('formatPriceNumber', () => {
    it('should format without currency symbol', () => {
      const result = formatPriceNumber(9.99);
      expect(result).toMatch(/9\.99/);
      expect(result).not.toContain('$');
    });

    it('should round to 2 decimal places', () => {
      expect(formatPriceNumber(5.5)).toMatch(/5\.5/);
    });
  });

  describe('parsePrice', () => {
    it('should parse formatted string back to number', () => {
      expect(parsePrice('$9.99')).toBe(9.99);
      expect(parsePrice('100.00')).toBe(100);
      expect(parsePrice('1,234.56')).toBe(1234.56);
    });

    it('should return 0 for invalid strings', () => {
      expect(parsePrice('')).toBe(0);
      expect(parsePrice('abc')).toBe(0);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return dollar sign for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol()).toBe('$');
    });
  });

  describe('formatVndEquivalent', () => {
    it('should return VND equivalent string', () => {
      const result = formatVndEquivalent(10);
      expect(result).toContain('VND');
      expect(result).toContain('260.000');
    });

    it('should handle 0', () => {
      expect(formatVndEquivalent(0)).toContain('0');
    });
  });
});
