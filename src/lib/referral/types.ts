/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Referral & Rewards System — Types, Enums, Zod Schemas
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const ReferralSource = {
  LINK: "LINK",
  MANUAL: "MANUAL",
  PHONE: "PHONE",
  AUTO: "AUTO",
} as const;
export type ReferralSource = (typeof ReferralSource)[keyof typeof ReferralSource];

export const ReferralStatus = {
  CLICKED: "CLICKED",
  SIGNED_UP: "SIGNED_UP",
  LOCKED: "LOCKED",
  QUALIFIED: "QUALIFIED",
  REJECTED: "REJECTED",
  FRAUD_REVIEW: "FRAUD_REVIEW",
} as const;
export type ReferralStatus = (typeof ReferralStatus)[keyof typeof ReferralStatus];

export const CommissionStatus = {
  PENDING: "PENDING",
  AVAILABLE: "AVAILABLE",
  PAID: "PAID",
  VOID: "VOID",
  CONVERTED: "CONVERTED",
} as const;
export type CommissionStatus = (typeof CommissionStatus)[keyof typeof CommissionStatus];

export const MilestoneRewardType = {
  VOUCHER: "VOUCHER",
  STORE_CREDIT: "STORE_CREDIT",
  CASH: "CASH",
  BADGE: "BADGE",
  FREE_SHIPPING: "FREE_SHIPPING",
  FREE_GIFT: "FREE_GIFT",
} as const;
export type MilestoneRewardType = (typeof MilestoneRewardType)[keyof typeof MilestoneRewardType];

export const MilestoneRewardStatus = {
  PENDING: "PENDING",
  GRANTED: "GRANTED",
  CONVERTED: "CONVERTED",
  VOID: "VOID",
} as const;
export type MilestoneRewardStatus = (typeof MilestoneRewardStatus)[keyof typeof MilestoneRewardStatus];

export const CashoutMethod = {
  PAYPAL: "PAYPAL",
  VENMO: "VENMO",
  BANK: "BANK",
  STORE_CREDIT: "STORE_CREDIT",
  VOUCHER: "VOUCHER",
} as const;
export type CashoutMethod = (typeof CashoutMethod)[keyof typeof CashoutMethod];

export const CashoutStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type CashoutStatus = (typeof CashoutStatus)[keyof typeof CashoutStatus];

export const WalletTxType = {
  COMMISSION: "COMMISSION",
  MILESTONE: "MILESTONE",
  CASHOUT: "CASHOUT",
  CONVERT_VOUCHER: "CONVERT_VOUCHER",
  CONVERT_CREDIT: "CONVERT_CREDIT",
  MANUAL_ADJUST: "MANUAL_ADJUST",
} as const;
export type WalletTxType = (typeof WalletTxType)[keyof typeof WalletTxType];

export const WalletDirection = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
} as const;
export type WalletDirection = (typeof WalletDirection)[keyof typeof WalletDirection];

export const FraudSignalType = {
  SELF_REFERRAL: "SELF_REFERRAL",
  SAME_IP: "SAME_IP",
  SAME_DEVICE: "SAME_DEVICE",
  SAME_ADDRESS: "SAME_ADDRESS",
  RAPID_SIGNUP: "RAPID_SIGNUP",
  SUSPICIOUS_ORDER: "SUSPICIOUS_ORDER",
} as const;
export type FraudSignalType = (typeof FraudSignalType)[keyof typeof FraudSignalType];

export const ReferralTier = {
  MEMBER: "MEMBER",
  BRONZE: "BRONZE",
  SILVER: "SILVER",
  GOLD: "GOLD",
  AMBASSADOR: "AMBASSADOR",
} as const;
export type ReferralTier = (typeof ReferralTier)[keyof typeof ReferralTier];

export const CommissionBaseAmount = {
  SUBTOTAL: "SUBTOTAL",
  TOTAL_BEFORE_SHIPPING: "TOTAL_BEFORE_SHIPPING",
  TOTAL_PAID: "TOTAL_PAID",
} as const;
export type CommissionBaseAmount = (typeof CommissionBaseAmount)[keyof typeof CommissionBaseAmount];

export const CommissionScope = {
  FIRST_ORDER: "FIRST_ORDER",
  FIRST_N_ORDERS: "FIRST_N_ORDERS",
  WITHIN_DAYS: "WITHIN_DAYS",
  FIRST_N_WITHIN_DAYS: "FIRST_N_WITHIN_DAYS",
} as const;
export type CommissionScope = (typeof CommissionScope)[keyof typeof CommissionScope];

// ============================================================================
// CONFIG INTERFACE
// ============================================================================

export interface ReferralProgramConfig {
  programEnabled: boolean;
  allowPhoneAsReferral: boolean;
  referralGracePeriodHours: number;
  minimumQualifiedOrderAmount: number;
  qualifyingOrderStatuses: string[];
  rewardHoldDays: number;
  commissionRate: number;              // 0.03 = 3%
  commissionScope: CommissionScope;
  commissionMaxOrders: number;
  commissionMaxDays: number;
  commissionBaseAmount: CommissionBaseAmount;
  minimumCashoutAmount: number;
  enabledCashoutMethods: CashoutMethod[];
  allowCustomCodeChange: boolean;
  maxCustomCodeChanges: number;
  welcomeRewardEnabled: boolean;
  welcomeRewardType: string;           // "VOUCHER" | "STORE_CREDIT" | "FREE_SHIPPING"
  welcomeRewardValue: number;
  welcomeRewardMinOrder: number;
  welcomeRewardValidDays: number;
  fraudAutoReview: boolean;
  fraudScoreThreshold: number;
  manualApprovalRequired: boolean;
}

export const DEFAULT_REFERRAL_CONFIG: ReferralProgramConfig = {
  programEnabled: true,
  allowPhoneAsReferral: true,
  referralGracePeriodHours: 24,
  minimumQualifiedOrderAmount: 50,
  qualifyingOrderStatuses: ["COMPLETED"],
  rewardHoldDays: 14,
  commissionRate: 0.03,
  commissionScope: "FIRST_N_WITHIN_DAYS",
  commissionMaxOrders: 3,
  commissionMaxDays: 60,
  commissionBaseAmount: "SUBTOTAL",
  minimumCashoutAmount: 20,
  enabledCashoutMethods: ["PAYPAL", "VENMO", "STORE_CREDIT", "VOUCHER"],
  allowCustomCodeChange: true,
  maxCustomCodeChanges: 3,
  welcomeRewardEnabled: true,
  welcomeRewardType: "VOUCHER",
  welcomeRewardValue: 10,
  welcomeRewardMinOrder: 50,
  welcomeRewardValidDays: 30,
  fraudAutoReview: true,
  fraudScoreThreshold: 50,
  manualApprovalRequired: true,
};

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/** Custom referral code: 4-10 chars, alphanumeric only */
export const customCodeSchema = z
  .string()
  .min(4, "Code must be 4-10 characters")
  .max(10, "Code must be 4-10 characters")
  .regex(/^[a-zA-Z0-9]+$/, "Only letters and numbers allowed")
  .transform((v) => v.toUpperCase());

/** Validate referral code input */
export const validateCodeSchema = z.object({
  code: z.string().min(1).max(20).trim(),
});

/** Attach referral request */
export const attachReferralSchema = z.object({
  code: z.string().min(1).max(20).trim(),
  source: z.enum(["LINK", "MANUAL", "PHONE", "AUTO"]).default("MANUAL"),
});

/** Cashout request */
export const cashoutRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["PAYPAL", "VENMO", "BANK", "STORE_CREDIT", "VOUCHER"]),
  destinationData: z.object({
    email: z.string().email().optional(),
    handle: z.string().min(1).optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    accountHolder: z.string().optional(),
  }).optional(),
});

/** Convert balance request */
export const convertBalanceSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

/** Update custom code */
export const updateCodeSchema = z.object({
  code: customCodeSchema,
});

/** Admin config update */
export const updateConfigSchema = z.object({
  programEnabled: z.boolean().optional(),
  allowPhoneAsReferral: z.boolean().optional(),
  referralGracePeriodHours: z.number().min(0).max(720).optional(),
  minimumQualifiedOrderAmount: z.number().min(0).optional(),
  qualifyingOrderStatuses: z.array(z.string()).optional(),
  rewardHoldDays: z.number().min(0).max(90).optional(),
  commissionRate: z.number().min(0).max(0.5).optional(),
  commissionScope: z.enum(["FIRST_ORDER", "FIRST_N_ORDERS", "WITHIN_DAYS", "FIRST_N_WITHIN_DAYS"]).optional(),
  commissionMaxOrders: z.number().min(1).max(100).optional(),
  commissionMaxDays: z.number().min(1).max(365).optional(),
  commissionBaseAmount: z.enum(["SUBTOTAL", "TOTAL_BEFORE_SHIPPING", "TOTAL_PAID"]).optional(),
  minimumCashoutAmount: z.number().min(0).optional(),
  enabledCashoutMethods: z.array(z.enum(["PAYPAL", "VENMO", "BANK", "STORE_CREDIT", "VOUCHER"])).optional(),
  allowCustomCodeChange: z.boolean().optional(),
  maxCustomCodeChanges: z.number().min(0).max(50).optional(),
  welcomeRewardEnabled: z.boolean().optional(),
  welcomeRewardType: z.string().optional(),
  welcomeRewardValue: z.number().min(0).optional(),
  welcomeRewardMinOrder: z.number().min(0).optional(),
  welcomeRewardValidDays: z.number().min(1).max(365).optional(),
  fraudAutoReview: z.boolean().optional(),
  fraudScoreThreshold: z.number().min(0).max(100).optional(),
  manualApprovalRequired: z.boolean().optional(),
});

/** Admin milestone CRUD */
export const milestoneSchema = z.object({
  milestone: z.number().int().positive(),
  rewardType: z.enum(["VOUCHER", "STORE_CREDIT", "CASH", "BADGE", "FREE_SHIPPING", "FREE_GIFT"]),
  rewardValue: z.number().min(0),
  label: z.string().max(100).optional(),
  labelEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  voucherConfig: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

/** Admin manual adjust */
export const manualAdjustSchema = z.object({
  userId: z.string().min(1),
  amount: z.number(),
  reason: z.string().min(1).max(500),
});

/** Admin cashout process */
export const processCashoutSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED", "PAID"]),
  adminNote: z.string().max(500).optional(),
});

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ReferralDashboard {
  profile: {
    customCode: string | null;
    systemCode: string;
    tier: string;
    isLocked: boolean;
  };
  stats: {
    totalInvites: number;
    qualifiedInvites: number;
    pendingBalance: number;
    availableBalance: number;
    withdrawnBalance: number;
    convertedBalance: number;
  };
  shareLink: string;
  nextMilestone: {
    milestone: number;
    rewardType: string;
    rewardValue: number;
    remaining: number;
  } | null;
  cashoutEligible: boolean;
  config: {
    commissionRate: number;
    minimumCashoutAmount: number;
    enabledCashoutMethods: string[];
  };
}

export interface ReferralHistoryItem {
  id: number;
  referredName: string | null;
  referredEmail: string;
  status: string;
  source: string;
  createdAt: string;
  qualifiedAt: string | null;
}

export interface CommissionItem {
  id: number;
  orderId: number;
  referredName: string | null;
  rate: number;
  baseAmount: number;
  commissionAmount: number;
  status: string;
  holdUntil: string | null;
  createdAt: string;
}

export interface MilestoneItem {
  id: number;
  milestone: number;
  rewardType: string;
  rewardValue: number;
  label: string | null;
  labelEn: string | null;
  isActive: boolean;
  achieved: boolean;
  reached: boolean;
  claimed: boolean;
  claimable: boolean;
  grantedAt: string | null;
  status: string | null;
  remaining: number;
}

export interface CashoutItem {
  id: number;
  amount: number;
  method: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}
