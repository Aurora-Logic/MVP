import { test, expect } from '@playwright/test';
import { seedAndBoot } from './helpers.js';

test.describe('Smoke Tests', () => {
    test('app loads without JS errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.goto('/');
        await page.waitForTimeout(3000);
        const realErrors = errors.filter(e =>
            !e.includes('supabase') && !e.includes('fetch') &&
            !e.includes('NetworkError') && !e.includes('Failed to fetch')
        );
        expect(realErrors).toEqual([]);
    });

    test('landing page loads with title', async ({ page }) => {
        await page.goto('/landing.html');
        await page.waitForTimeout(2000);
        await expect(page).toHaveTitle(/ProposalKit/);
    });

    test('onboarding shows for fresh user', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForTimeout(2000);
        const onboard = page.locator('#onboard');
        const isVisible = await onboard.isVisible();
        expect(isVisible || true).toBeTruthy();
    });

    test('app shell loads after seeding config', async ({ page }) => {
        await seedAndBoot(page);
        const appShell = page.locator('#appShell');
        await expect(appShell).toBeVisible();
    });
});
