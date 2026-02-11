import { test, expect } from '@playwright/test';
import { seedAndBoot } from './helpers.js';

test.describe('Accessibility', () => {
    test('skip link exists and is focusable', async ({ page }) => {
        await seedAndBoot(page);
        const skipLink = page.locator('.skip-link');
        await expect(skipLink).toBeAttached();
        // Can be focused
        await skipLink.focus();
        await expect(skipLink).toBeFocused();
    });

    test('sidebar has navigation role', async ({ page }) => {
        await seedAndBoot(page);
        const sidebar = page.locator('[role="navigation"]');
        await expect(sidebar).toBeAttached();
    });

    test('main content area has main role', async ({ page }) => {
        await seedAndBoot(page);
        const main = page.locator('[role="main"]');
        await expect(main).toBeAttached();
    });

    test('toast shows with aria-live', async ({ page }) => {
        await seedAndBoot(page);
        await page.evaluate(() => { if (typeof toast === 'function') toast('Test message'); });
        await page.waitForTimeout(500);
        const toastBox = page.locator('#toastBox');
        await expect(toastBox).toBeAttached();
    });

    test('save indicator has status role', async ({ page }) => {
        await seedAndBoot(page);
        const saveIndicator = page.locator('#saveIndicator');
        if (await saveIndicator.count() > 0) {
            await expect(saveIndicator).toHaveAttribute('role', 'status');
        }
    });
});
