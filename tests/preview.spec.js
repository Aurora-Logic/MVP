import { test, expect } from '@playwright/test';
import { seedAndBoot } from './helpers.js';

test.describe('Preview', () => {
    const testProp = {
        id: 'prev1', title: 'Preview Test', number: 'PROP-003', status: 'sent',
        date: new Date().toISOString().split('T')[0], validUntil: '',
        currency: '$', sender: { company: 'Test Co', email: 'test@test.com', address: '123 Main St' },
        client: { name: 'Client Name', contact: 'John', email: 'client@test.com', phone: '' },
        lineItems: [{ desc: 'Web Design', qty: 1, rate: 5000 }],
        sections: [{ title: 'Scope', content: '<p>Full website redesign</p>' }],
        discount: 0, taxRate: 10, createdAt: Date.now(), updatedAt: Date.now()
    };

    test('preview opens and shows proposal content', async ({ page }) => {
        await seedAndBoot(page, [testProp]);

        await page.evaluate(() => { if (typeof loadEditor === 'function') loadEditor('prev1'); });
        await page.waitForTimeout(1000);

        // Click the Preview button (it's in topRight area)
        const previewBtn = page.locator('button:has-text("Preview")');
        await previewBtn.click();
        await page.waitForTimeout(1000);

        const prevPanel = page.locator('#prevPanel');
        await expect(prevPanel).toHaveClass(/show/);

        const prevDoc = page.locator('#prevDoc');
        await expect(prevDoc).toContainText('Preview Test');
    });

    test('preview shows line items', async ({ page }) => {
        await seedAndBoot(page, [testProp]);

        await page.evaluate(() => { if (typeof loadEditor === 'function') loadEditor('prev1'); });
        await page.waitForTimeout(1000);

        await page.locator('button:has-text("Preview")').click();
        await page.waitForTimeout(1000);

        const prevDoc = page.locator('#prevDoc');
        await expect(prevDoc).toContainText('Web Design');
    });
});
