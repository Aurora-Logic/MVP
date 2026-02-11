/**
 * Seed localStorage with config and proposals, then boot the app.
 * Bypasses Supabase auth and dismisses What's New modal.
 */
export async function seedAndBoot(page, proposals = []) {
    await page.goto('/');
    await page.evaluate((props) => {
        localStorage.setItem('pk_config', JSON.stringify({
            name: 'Test User', company: 'Test Co', email: 'test@test.com', country: 'US'
        }));
        localStorage.setItem('pk_db', JSON.stringify(props));
        localStorage.setItem('pk_clients', '[]');
        // Dismiss What's New so it doesn't block interactions
        localStorage.setItem('pk_whatsnew_ver', '99.0');
    }, proposals);
    await page.reload();
    await page.evaluate(() => {
        document.getElementById('onboard')?.classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        if (typeof bootApp === 'function') bootApp();
    });
    await page.waitForTimeout(1500);
    // Dismiss any modal that might have appeared
    await page.evaluate(() => {
        document.getElementById('whatsNewModal')?.remove();
    });
}
