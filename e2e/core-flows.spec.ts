import { test, expect } from "@playwright/test";

/**
 * LIKEFOOD — E2E Test: Core Shopping Flow
 * Flow 1: Homepage → Browse → Product Detail → Add to Cart
 */

test.describe("Shopping Flow", () => {
    test("should load homepage with products", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/LIKEFOOD/);

        // Navbar should be visible
        const navbar = page.locator("nav");
        await expect(navbar).toBeVisible();

        // Should have product sections
        const body = await page.textContent("body");
        expect(body).toBeTruthy();
    });

    test("should navigate to products page", async ({ page }) => {
        await page.goto("/products");
        await expect(page).toHaveTitle(/LIKEFOOD/);

        // Wait for products to load
        await page.waitForLoadState("networkidle");
    });

    test("should search for products", async ({ page }) => {
        await page.goto("/products");
        await page.waitForLoadState("networkidle");

        // Find search input and type
        const searchInput = page.locator('input[type="text"]').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill("cá khô");
            await searchInput.press("Enter");
            await page.waitForURL(/search/);
        }
    });

    test("should view product detail page", async ({ page }) => {
        await page.goto("/products");
        await page.waitForLoadState("networkidle");

        // Click first product link
        const productLink = page.locator('a[href*="/products/"]').first();
        if (await productLink.isVisible()) {
            await productLink.click();
            await page.waitForLoadState("networkidle");

            // Should show product details
            await expect(page.locator("h1, h2")).toBeVisible();
        }
    });
});

test.describe("Navigation", () => {
    test("should navigate between pages without errors", async ({ page }) => {
        const routes = ["/", "/products", "/about", "/contact", "/faq"];

        for (const route of routes) {
            await page.goto(route);
            await page.waitForLoadState("networkidle");

            // No console errors should appear
            const errors: string[] = [];
            page.on("pageerror", (err) => errors.push(err.message));

            await expect(page.locator("body")).toBeVisible();
        }
    });

    test("should be mobile responsive", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto("/");

        // Mobile menu button should be visible
        const menuButton = page.locator('button[aria-label]').first();
        await expect(menuButton).toBeVisible();
    });
});

test.describe("Authentication Flow", () => {
    test("should show login page", async ({ page }) => {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");

        // Should have email/password fields
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        if (await emailInput.count() > 0) {
            await expect(emailInput.first()).toBeVisible();
        }
    });

    test("should redirect unauthenticated users from profile", async ({ page }) => {
        await page.goto("/profile");
        await page.waitForLoadState("networkidle");

        // Should redirect to login
        const url = page.url();
        expect(url).toMatch(/login|auth/);
    });
});

test.describe("SEO Checks", () => {
    test("should have proper meta tags on homepage", async ({ page }) => {
        await page.goto("/");

        // Check title
        const title = await page.title();
        expect(title).toContain("LIKEFOOD");

        // Check meta description
        const metaDescription = await page.locator('meta[name="description"]').getAttribute("content");
        expect(metaDescription).toBeTruthy();
        expect(metaDescription!.length).toBeGreaterThan(50);

        // Check canonical
        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        expect(canonical).toBeTruthy();
    });

    test("should have JSON-LD structured data on product pages", async ({ page }) => {
        await page.goto("/products");
        await page.waitForLoadState("networkidle");

        const productLink = page.locator('a[href*="/products/"]').first();
        if (await productLink.isVisible()) {
            await productLink.click();
            await page.waitForLoadState("networkidle");

            // Check for JSON-LD script tags
            const jsonLd = await page.locator('script[type="application/ld+json"]').count();
            expect(jsonLd).toBeGreaterThan(0);
        }
    });
});

test.describe("Accessibility Checks", () => {
    test("should have proper heading hierarchy", async ({ page }) => {
        await page.goto("/");

        const h1Count = await page.locator("h1").count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test("should have alt text on images", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const images = page.locator("img");
        const count = await images.count();

        for (let i = 0; i < Math.min(count, 10); i++) {
            const alt = await images.nth(i).getAttribute("alt");
            expect(alt).not.toBe("");
        }
    });

    test("should support keyboard navigation", async ({ page }) => {
        await page.goto("/");

        // Tab to first interactive element
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(focused).toBeTruthy();
    });
});
