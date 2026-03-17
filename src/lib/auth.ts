/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 Trần Quốc Vũ
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import type { user as PrismaUser } from "../generated/client";
import { headers } from "next/headers";
import { sendSuspiciousLoginEmail } from "@/lib/mail";
import { verifyTurnstileTokenFromHeaders } from "@/lib/captcha";
import { notifyLogin } from "@/lib/telegram";

type AuthUser = {
    id?: number;
    role?: string;
    image?: string | null;
};

export const authOptions: NextAuthOptions = {
    providers: [
        // OAuth Google (requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            })]
            : []
        ),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                rememberMe: { label: "Remember Me", type: "text" },
                isMagicLink: { label: "Magic Link", type: "text" },
                token: { label: "Token", type: "text" },
                otp: { label: "OTP", type: "text" },
                captchaToken: { label: "Captcha Token", type: "text" },
                isAdminLogin: { label: "Admin Login", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    throw new Error("Vui lòng nhập đầy đủ thông tin.");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    throw new Error("INVALID_CREDENTIALS");
                }

                // Handle Magic Link Flow
                if (credentials.isMagicLink === "true" && credentials.token) {
                    const verificationToken = await prisma.verificationtoken.findFirst({
                        where: {
                            identifier: `magic:${user.id}`,
                            token: credentials.token,
                            expires: { gte: new Date() },
                        },
                    });

                    if (!verificationToken) {
                        throw new Error("Link đăng nhập không hợp lệ hoặc đã hết hạn.");
                    }

                    // Mark as verified if not already
                    if (!user.emailVerified) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { emailVerified: new Date() }
                        });
                        user.emailVerified = new Date();
                    }

                    // Delete the token so it can't be reused
                    await prisma.verificationtoken.delete({ where: { id: verificationToken.id } });
                } else {
                    // Normal Password Flow
                    if (!credentials.password) {
                        throw new Error("Vui lòng nhập mật khẩu.");
                    }
                    if (!user.password) {
                        throw new Error("Tài khoản chưa có mật khẩu, vui lòng đăng nhập bằng link (Magic Link) hoặc Google.");
                    }

                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isPasswordValid) {
                        throw new Error("INVALID_CREDENTIALS");
                    }

                    if (!user.emailVerified) {
                        throw new Error("EMAIL_NOT_VERIFIED");
                    }

                    // ADMIN users: skip captcha & 2FA in authorize
                    // Admin has separate OTP verification via /admin/verify page
                    if (user.role !== "ADMIN") {
                        // CAPTCHA (Turnstile) for regular user login
                        const headersList = await headers();
                        const captcha = await verifyTurnstileTokenFromHeaders({
                            headers: headersList,
                            token: credentials.captchaToken,
                            action: "auth_login",
                        });
                        if (!captcha.ok) {
                            throw new Error(`CAPTCHA_FAILED:${captcha.message}`);
                        }

                        // --- 2FA Authentication Flow (for regular users only) ---
                        if (user.twoFactorEnabled) {
                            if (!credentials.otp) {
                                throw new Error("2FA_REQUIRED");
                            }

                            const token = await prisma.twofactortoken.findFirst({
                                where: {
                                    userId: user.id,
                                    token: credentials.otp,
                                    expires: { gte: new Date() },
                                },
                            });

                            if (!token) {
                                throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn.");
                            }

                            await prisma.twofactortoken.delete({ where: { id: token.id } });
                        }
                    }
                }

                // Avoid putting huge base64 data URLs into the JWT/session cookie
                const imageForSession =
                    (user as PrismaUser).avatarUrl ??
                    (typeof user.image === "string" && !user.image.startsWith("data:") ? user.image : null);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: imageForSession,
                    rememberMe: credentials.rememberMe === "true",
                };
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Handle Google OAuth: find or create user in DB
            if (account?.provider === "google" && profile?.email) {
                try {
                    const googleId = account.providerAccountId || (profile as Record<string, unknown>).sub as string;
                    // Try to find existing user by googleId or email
                    let dbUser = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { googleId: googleId },
                                { email: profile.email },
                            ],
                        },
                    });

                    if (dbUser) {
                        // Link Google if not already linked
                        if (!dbUser.googleId) {
                            await prisma.user.update({
                                where: { id: dbUser.id },
                                data: {
                                    googleId,
                                    avatarUrl: dbUser.avatarUrl || (profile as Record<string, unknown>).picture as string || null,
                                    name: dbUser.name || profile.name || null,
                                    emailVerified: dbUser.emailVerified || new Date(),
                                },
                            });
                        }
                        // Set user.id for JWT callback
                        user.id = String(dbUser.id);
                        (user as AuthUser).role = dbUser.role;
                    } else {
                        // Create new user
                        dbUser = await prisma.user.create({
                            data: {
                                email: profile.email,
                                name: profile.name || null,
                                googleId,
                                avatarUrl: (profile as Record<string, unknown>).picture as string || null,
                                role: "USER",
                                emailVerified: new Date(),
                            },
                        });
                        user.id = String(dbUser.id);
                        (user as AuthUser).role = "USER";
                    }

                    // Avoid putting huge Google avatar data URLs into JWT
                    const pictureUrl = (profile as Record<string, unknown>).picture as string || null;
                    user.image = pictureUrl && !pictureUrl.startsWith("data:") ? pictureUrl : null;
                } catch (e) {
                    console.error("Google OAuth sign-in error:", e);
                    return false;
                }
            }

            // Log login history for all successful logins
            try {
                if (user?.email) {
                    const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
                    if (dbUser) {
                        // Get IP from request headers
                        const headersList = await headers();
                        const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
                            || headersList.get("x-real-ip")
                            || "unknown";
                        const userAgent = headersList.get("user-agent") || undefined;

                        // Check if this IP is new compared to recent logins
                        const recentLogins = await prisma.loginhistory.findMany({
                            where: { userId: dbUser.id },
                            orderBy: { createdAt: "desc" },
                            take: 5,
                            select: { ipAddress: true },
                        });

                        const knownIPs = recentLogins.map(l => l.ipAddress);
                        const isSuspicious = knownIPs.length > 0 && !knownIPs.includes(ip) && ip !== "unknown";

                        await prisma.loginhistory.create({
                            data: {
                                userId: dbUser.id,
                                ipAddress: ip,
                                userAgent,
                                isSuspicious,
                            },
                        });

                        // Gửi email thời gian thực nếu bắt được nghi vấn
                        if (isSuspicious) {
                            sendSuspiciousLoginEmail(
                                user.email,
                                ip,
                                userAgent || "Thiết bị không xác định",
                                new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
                            ).catch(e => console.error("Lỗi gửi email cảnh báo:", e));
                        }

                        // Gửi thông báo Telegram cho mọi lần đăng nhập
                        notifyLogin({
                            email: user.email!,
                            name: user.name || undefined,
                            ip,
                            userAgent,
                            isSuspicious,
                            method: "password",
                        }).catch(() => {});
                    }
                }
            } catch (e) {
                console.error("Login history error:", e);
            }
            return true;
        },

        async jwt({ token, user, trigger, session }) {
            if (user) {
                const authUser = user as AuthUser & { rememberMe?: boolean };
                token.id = authUser.id ?? token.id;
                token.role = authUser.role ?? token.role;
                token.image = authUser.image ?? null;
                // Store rememberMe in token to persist it
                if (authUser.rememberMe !== undefined) {
                    token.rememberMe = authUser.rememberMe;
                }
            }
            // When using JWT sessions, NextAuth usually sets token.sub = userId.
            // Ensure token.id is always available for API routes.
            if (!token.id && token.sub) {
                token.id = Number(token.sub);
            }

            // When client calls `useSession().update(...)` after uploading avatar
            if (trigger === "update" && session?.user) {
                const nextImage = session.user.image;
                token.image = typeof nextImage === "string" && !nextImage.startsWith("data:") ? nextImage : null;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = Number(token.id);
                session.user.role = token.role;
                session.user.image = (token.image as string | null | undefined) ?? session.user.image ?? null;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        // Reduced maxAge for security
        // Default: 7 days, extended to 30 days only if rememberMe is enabled
        maxAge: 7 * 24 * 60 * 60, // 7 days default
    },
    // SEC-007: Hardened cookie configuration
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax" as const,
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
