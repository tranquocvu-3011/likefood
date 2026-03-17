/**
 * LIKEFOOD - Admin Auth Helper Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-auth
const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
    getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// Mock auth options
vi.mock("@/lib/auth", () => ({
    authOptions: { providers: [] },
}));

import { requireAuth, requireAdmin, requireSuperAdmin, isAdminRole, getUserRole } from "@/lib/admin-auth";

describe("Admin Auth Helper", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("requireAuth", () => {
        it("should return unauthorized when no session", async () => {
            mockGetServerSession.mockResolvedValue(null);

            const result = await requireAuth();

            expect(result.authorized).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error!.status).toBe(401);
        });

        it("should return unauthorized when session has no user", async () => {
            mockGetServerSession.mockResolvedValue({ user: null });

            const result = await requireAuth();

            expect(result.authorized).toBe(false);
        });

        it("should return authorized with valid session", async () => {
            mockGetServerSession.mockResolvedValue({
                user: { id: "1", name: "Test User", role: "USER" },
            });

            const result = await requireAuth();

            expect(result.authorized).toBe(true);
            expect(result.session).toBeDefined();
        });
    });

    describe("requireAdmin", () => {
        it("should return forbidden for non-admin users", async () => {
            mockGetServerSession.mockResolvedValue({
                user: { id: "1", name: "User", role: "USER" },
            });

            const result = await requireAdmin();

            expect(result.authorized).toBe(false);
            expect(result.error!.status).toBe(403);
        });

        it("should return authorized for ADMIN role", async () => {
            mockGetServerSession.mockResolvedValue({
                user: { id: "1", name: "Admin", role: "ADMIN" },
            });

            const result = await requireAdmin();

            expect(result.authorized).toBe(true);
        });

        it("should return authorized for SUPER_ADMIN role", async () => {
            mockGetServerSession.mockResolvedValue({
                user: { id: "1", name: "Super", role: "SUPER_ADMIN" },
            });

            const result = await requireAdmin();

            expect(result.authorized).toBe(true);
        });
    });

    describe("requireSuperAdmin", () => {
        it("should return forbidden for ADMIN role", async () => {
            mockGetServerSession.mockResolvedValue({
                user: { id: "1", name: "Admin", role: "ADMIN" },
            });

            const result = await requireSuperAdmin();

            expect(result.authorized).toBe(false);
            expect(result.error!.status).toBe(403);
        });

        it("should return authorized for SUPER_ADMIN only", async () => {
            mockGetServerSession.mockResolvedValue({
                user: { id: "1", name: "Super", role: "SUPER_ADMIN" },
            });

            const result = await requireSuperAdmin();

            expect(result.authorized).toBe(true);
        });
    });

    describe("isAdminRole", () => {
        it("should return true for ADMIN", () => {
            expect(isAdminRole("ADMIN")).toBe(true);
        });

        it("should return true for SUPER_ADMIN", () => {
            expect(isAdminRole("SUPER_ADMIN")).toBe(true);
        });

        it("should return false for USER", () => {
            expect(isAdminRole("USER")).toBe(false);
        });

        it("should return false for undefined", () => {
            expect(isAdminRole(undefined)).toBe(false);
        });

        it("should return false for empty string", () => {
            expect(isAdminRole("")).toBe(false);
        });
    });

    describe("getUserRole", () => {
        it("should return ADMIN role from session", () => {
            const role = getUserRole({ user: { role: "ADMIN" } });
            expect(role).toBe("ADMIN");
        });

        it("should default to USER when no role", () => {
            const role = getUserRole({ user: {} });
            expect(role).toBe("USER");
        });
    });
});
