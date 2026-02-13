import { test, expect } from '@playwright/test';
import { seedAndBoot } from './helpers.js';

const testProp = {
    id: 'route1', title: 'Routing Test', number: 'PROP-100', status: 'sent',
    date: new Date().toISOString().split('T')[0], validUntil: '',
    currency: '$', sender: { company: 'Test Co', email: '', address: '' },
    client: { name: 'Client A', contact: 'John', email: '', phone: '' },
    lineItems: [{ desc: 'Service', qty: 1, rate: 1000 }],
    sections: [], discount: 0, taxRate: 0,
    createdAt: Date.now(), updatedAt: Date.now()
};

/**
 * Seed localStorage at a deep link URL and boot the app.
 * Seeds at /, changes URL via pushState, then reloads so the URL is active
 * when bootApp() → handleRoute() runs during normal init.
 */
async function seedAndDeepLink(page, url, proposals = []) {
    await page.goto('/');
    await page.evaluate(({ props, targetUrl }) => {
        localStorage.setItem('pk_config', JSON.stringify({
            name: 'Test User', company: 'Test Co', email: 'test@test.com', country: 'US'
        }));
        localStorage.setItem('pk_db', JSON.stringify(props));
        localStorage.setItem('pk_clients', '[]');
        localStorage.setItem('pk_whatsnew_ver', '99.0');
        // Set URL so reload opens at the deep link
        history.replaceState(null, '', targetUrl);
    }, { props: proposals, targetUrl: url });
    // Reload at the deep link URL — localStorage is seeded
    await page.reload();
    // Wait for all scripts to load (bootApp is defined in boot.js, the last script)
    await page.waitForFunction(() => typeof bootApp === 'function', { timeout: 10000 });
    await page.evaluate(() => {
        document.getElementById('onboard')?.classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        bootApp();
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
        document.getElementById('whatsNewModal')?.remove();
    });
}

test.describe('Routing — Clean URLs', () => {
    test('dashboard loads at root URL', async ({ page }) => {
        await seedAndBoot(page);
        await expect(page).toHaveURL('/');
        await expect(page).toHaveTitle(/Dashboard/);
    });

    test('sidebar navigation updates URL to /proposals', async ({ page }) => {
        await seedAndBoot(page);
        await page.locator('[data-nav="editor"]').click();
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/proposals');
        await expect(page).toHaveTitle(/Proposals/);
    });

    test('sidebar navigation updates URL to /clients', async ({ page }) => {
        await seedAndBoot(page);
        await page.locator('[data-nav="clients"]').click();
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/clients');
        await expect(page).toHaveTitle(/Customer/);
    });

    test('clicking proposal opens /proposals/:id', async ({ page }) => {
        await seedAndBoot(page, [testProp]);
        await page.locator('[data-nav="editor"]').click();
        await page.waitForTimeout(500);

        await page.evaluate(() => { if (typeof loadEditor === 'function') loadEditor('route1'); });
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/proposals/route1');
        await expect(page).toHaveTitle(/Routing Test/);
    });

    test('browser back returns to previous URL', async ({ page }) => {
        await seedAndBoot(page, [testProp]);

        await page.locator('[data-nav="editor"]').click();
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/proposals');

        await page.locator('[data-nav="clients"]').click();
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/clients');

        await page.goBack();
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/proposals');
    });

    test('browser forward works after back', async ({ page }) => {
        await seedAndBoot(page);

        await page.locator('[data-nav="editor"]').click();
        await page.waitForTimeout(500);
        await page.locator('[data-nav="clients"]').click();
        await page.waitForTimeout(500);

        await page.goBack();
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/proposals');

        await page.goForward();
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/clients');
    });

    test('direct URL /proposals loads proposals list', async ({ page }) => {
        await seedAndDeepLink(page, '/proposals');
        await expect(page).toHaveTitle(/Proposals/);
        await expect(page).toHaveURL('/proposals');
    });

    test('direct URL /proposals/:id opens editor', async ({ page }) => {
        await seedAndDeepLink(page, '/proposals/route1', [testProp]);
        await expect(page).toHaveTitle(/Routing Test/);
        const titleInput = page.locator('#fTitle');
        await expect(titleInput).toBeVisible();
    });

    test('direct URL /clients loads clients page', async ({ page }) => {
        await seedAndDeepLink(page, '/clients');
        await expect(page).toHaveTitle(/Customer/);
    });

    test('invalid URL shows 404 page', async ({ page }) => {
        await seedAndDeepLink(page, '/nonexistent/path');
        await expect(page).toHaveTitle(/Page not found/);
        await expect(page.locator('text=404')).toBeVisible();
    });

    test('404 page Go to Dashboard button works', async ({ page }) => {
        await seedAndDeepLink(page, '/bad-route');
        await expect(page.locator('text=404')).toBeVisible();
        await page.locator('button:has-text("Go to Dashboard")').click();
        await page.waitForTimeout(500);
        await expect(page).toHaveURL('/dashboard');
        await expect(page).toHaveTitle(/Dashboard/);
    });

    test('nonexistent proposal ID shows 404', async ({ page }) => {
        await seedAndDeepLink(page, '/proposals/doesnotexist');
        await expect(page).toHaveTitle(/Page not found/);
        await expect(page.locator('text=404')).toBeVisible();
    });

    test('filter state persists in URL', async ({ page }) => {
        await seedAndBoot(page, [testProp]);
        await page.locator('[data-nav="editor"]').click();
        await page.waitForTimeout(500);

        await page.evaluate(() => { if (typeof setFilter === 'function') setFilter('sent'); });
        await page.waitForTimeout(300);
        expect(page.url()).toContain('filter=sent');
    });

    test('no JS errors during navigation', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await seedAndBoot(page, [testProp]);

        await page.locator('[data-nav="editor"]').click();
        await page.waitForTimeout(500);
        await page.evaluate(() => { if (typeof loadEditor === 'function') loadEditor('route1'); });
        await page.waitForTimeout(500);
        await page.locator('[data-nav="clients"]').click();
        await page.waitForTimeout(500);
        await page.locator('[data-nav="dashboard"]').click();
        await page.waitForTimeout(500);

        await page.goBack();
        await page.waitForTimeout(500);
        await page.goBack();
        await page.waitForTimeout(500);

        const realErrors = errors.filter(e =>
            !e.includes('supabase') && !e.includes('fetch') &&
            !e.includes('NetworkError') && !e.includes('Failed to fetch')
        );
        expect(realErrors).toEqual([]);
    });
});
