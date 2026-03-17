/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Commerce utility tests
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { describe, it, expect } from 'vitest';
import {
  getShippingFeeUsd,
  normalizeOrderStatus,
  getOrderStatusFilter,
  ORDER_STATUS,
  FREE_SHIPPING_THRESHOLD_USD,
  DEFAULT_SHIPPING_FEE_USD,
  EXPRESS_SHIPPING_FEE_USD,
  OVERNIGHT_SHIPPING_FEE_USD,
} from '@/lib/commerce';

describe('Commerce Utils', () => {
  describe('getShippingFeeUsd', () => {
    it('should return free shipping when subtotal >= threshold', () => {
      expect(getShippingFeeUsd(FREE_SHIPPING_THRESHOLD_USD, 'standard')).toBe(0);
      expect(getShippingFeeUsd(FREE_SHIPPING_THRESHOLD_USD + 1, 'standard')).toBe(0);
      expect(getShippingFeeUsd(999, null)).toBe(0);
    });

    it('should return standard fee for standard shipping', () => {
      expect(getShippingFeeUsd(10, 'standard')).toBe(DEFAULT_SHIPPING_FEE_USD);
      expect(getShippingFeeUsd(0, null)).toBe(DEFAULT_SHIPPING_FEE_USD);
      expect(getShippingFeeUsd(10, undefined)).toBe(DEFAULT_SHIPPING_FEE_USD);
    });

    it('should return express fee for express shipping', () => {
      expect(getShippingFeeUsd(10, 'express')).toBe(EXPRESS_SHIPPING_FEE_USD);
    });

    it('should return overnight fee for overnight shipping', () => {
      expect(getShippingFeeUsd(10, 'overnight')).toBe(OVERNIGHT_SHIPPING_FEE_USD);
    });
  });

  describe('normalizeOrderStatus', () => {
    it('should normalize valid statuses', () => {
      expect(normalizeOrderStatus('PENDING')).toBe(ORDER_STATUS.PENDING);
      expect(normalizeOrderStatus('CONFIRMED')).toBe(ORDER_STATUS.CONFIRMED);
      expect(normalizeOrderStatus('DELIVERED')).toBe(ORDER_STATUS.DELIVERED);
      expect(normalizeOrderStatus('CANCELLED')).toBe(ORDER_STATUS.CANCELLED);
    });

    it('should handle alias SHIPPED -> SHIPPING', () => {
      expect(normalizeOrderStatus('SHIPPED')).toBe(ORDER_STATUS.SHIPPING);
    });

    it('should handle null/undefined gracefully', () => {
      expect(normalizeOrderStatus(null)).toBe(ORDER_STATUS.PENDING);
      expect(normalizeOrderStatus(undefined)).toBe(ORDER_STATUS.PENDING);
      expect(normalizeOrderStatus('')).toBe(ORDER_STATUS.PENDING);
    });

    it('should be case-insensitive', () => {
      expect(normalizeOrderStatus('pending')).toBe(ORDER_STATUS.PENDING);
      expect(normalizeOrderStatus('Confirmed')).toBe(ORDER_STATUS.CONFIRMED);
    });
  });

  describe('getOrderStatusFilter', () => {
    it('should return SHIPPING and SHIPPED for SHIPPING status', () => {
      const filter = getOrderStatusFilter('SHIPPING');
      expect(filter).toContain(ORDER_STATUS.SHIPPING);
      expect(filter).toContain('SHIPPED');
    });

    it('should return single-item array for other statuses', () => {
      expect(getOrderStatusFilter('PENDING')).toEqual([ORDER_STATUS.PENDING]);
      expect(getOrderStatusFilter('DELIVERED')).toEqual([ORDER_STATUS.DELIVERED]);
    });
  });
});
