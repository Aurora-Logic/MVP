import { test, expect } from '@playwright/test';
import { seedAndBoot } from './helpers.js';

test.describe('Create Proposal', () => {
    test('can open new proposal modal', async ({ page }) => {
        await seedAndBoot(page);

        const newBtn = page.locator('.side-new-full');
        await expect(newBtn).toBeVisible();
        await newBtn.click();
        await page.waitForTimeout(500);

        // Modal ID changed from #newModal to #createDrawer
        const drawer = page.locator('#createDrawer');
        await expect(drawer).toBeVisible();
    });

    test('autosave persists title change', async ({ page }) => {
        const prop = {
            id: 'test1', title: 'Test Proposal', number: 'PROP-001', status: 'draft',
            date: new Date().toISOString().split('T')[0], validUntil: '',
            currency: '$', sender: { company: 'Test', email: '', address: '' },
            client: { name: '', contact: '', email: '', phone: '' },
            lineItems: [], sections: [], discount: 0, taxRate: 0,
            createdAt: Date.now(), updatedAt: Date.now()
        };
        await seedAndBoot(page, [prop]);

        await page.evaluate(() => { if (typeof loadEditor === 'function') loadEditor('test1'); });
        await page.waitForTimeout(1000);

        const titleInput = page.locator('#fTitle');
        await expect(titleInput).toBeVisible();
        await titleInput.fill('Updated Title');
        await page.waitForTimeout(600);

        const saved = await page.evaluate(() => {
            const db = JSON.parse(localStorage.getItem('pk_db') || '[]');
            return db[0]?.title;
        });
        expect(saved).toBe('Updated Title');
    });

    test('can switch editor tabs', async ({ page }) => {
        const prop = {
            id: 'test2', title: 'Tab Test', number: 'PROP-002', status: 'draft',
            date: new Date().toISOString().split('T')[0], validUntil: '',
            currency: '$', sender: { company: 'Test', email: '', address: '' },
            client: { name: '', contact: '', email: '', phone: '' },
            lineItems: [], sections: [{ title: 'Scope', content: '<p>Test</p>' }],
            discount: 0, taxRate: 0, createdAt: Date.now(), updatedAt: Date.now()
        };
        await seedAndBoot(page, [prop]);

        await page.evaluate(() => { if (typeof loadEditor === 'function') loadEditor('test2'); });
        await page.waitForTimeout(1000);

        await page.locator('#edTabs .tab', { hasText: 'Sections' }).click();
        await expect(page.locator('#edSections')).toBeVisible();

        await page.locator('#edTabs .tab', { hasText: 'Pricing' }).click();
        await expect(page.locator('#edPricing')).toBeVisible();
    });
});
