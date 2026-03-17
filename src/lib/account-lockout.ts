/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * AUTH-002: Account Lockout After Failed Login Attempts
 *
 * Locks accounts for 30 minutes after 5 consecutive failed login attempts.
 * Uses Prisma to track failures per account (not per IP — that's handled by rate-limit).
 */

import prisma from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export interface LockoutCheck {
    locked: boolean;
    remainingMinutes?: number;
    attemptsLeft?: number;
}

/**
 * Check if an account is currently locked
 */
export async function checkAccountLock(email: string): Promise<LockoutCheck> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { failedLoginAttempts: true, lockedUntil: true },
    });

    if (!user) {
        // Don't reveal whether user exists
        return { locked: false };
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        return { locked: true, remainingMinutes: remaining };
    }

    // If lock expired, reset
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
        await prisma.user.update({
            where: { email },
            data: { failedLoginAttempts: 0, lockedUntil: null },
        });
        return { locked: false, attemptsLeft: MAX_ATTEMPTS };
    }

    return {
        locked: false,
        attemptsLeft: MAX_ATTEMPTS - (user.failedLoginAttempts || 0),
    };
}

/**
 * Record a failed login attempt. Locks account after MAX_ATTEMPTS.
 */
export async function recordFailedAttempt(email: string): Promise<LockoutCheck> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, failedLoginAttempts: true },
    });

    if (!user) return { locked: false };

    const newCount = (user.failedLoginAttempts || 0) + 1;
    const shouldLock = newCount >= MAX_ATTEMPTS;

    await prisma.user.update({
        where: { id: user.id },
        data: {
            failedLoginAttempts: newCount,
            ...(shouldLock && {
                lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
            }),
        },
    });

    if (shouldLock) {
        return { locked: true, remainingMinutes: 30 };
    }

    return { locked: false, attemptsLeft: MAX_ATTEMPTS - newCount };
}

/**
 * Reset failed attempts on successful login
 */
export async function resetFailedAttempts(email: string): Promise<void> {
    await prisma.user.updateMany({
        where: { email, failedLoginAttempts: { gt: 0 } },
        data: { failedLoginAttempts: 0, lockedUntil: null },
    });
}
