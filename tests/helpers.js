/**
 * Seed localStorage with config and proposals, then boot the app.
 * Bypasses Supabase auth and dismisses What's New / NPS modals.
 */
export async function seedAndBoot(page, proposals = []) {
    await page.goto('/');
    await page.evaluate((props) => {
        localStorage.setItem('pk_config', JSON.stringify({
            name: 'Test User', company: 'Test Co', email: 'test@test.com', country: 'US'
        }));
        localStorage.setItem('pk_db', JSON.stringify(props));
        localStorage.setItem('pk_clients', '[]');
        // Suppress NPS prompt so it doesn't block interactions
        localStorage.setItem('pk_feedback_asked', JSON.stringify(Date.now()));
    }, proposals);
    await page.reload();
    await page.evaluate(() => {
        document.getElementById('onboard')?.classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        // Dismiss What's New BEFORE bootApp() so the 800ms timeout never fires
        if (typeof APP_VERSION !== 'undefined') localStorage.setItem('pk_whatsnew_ver', APP_VERSION);
        if (typeof bootApp === 'function') bootApp();
    });
    // Wait for app shell to be visible (more reliable than fixed timeout)
    await page.waitForSelector('#appShell[style*="flex"]', { state: 'visible', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    // Dismiss any modal that might have appeared
    await page.evaluate(() => {
        document.getElementById('whatsNewModal')?.remove();
        document.getElementById('npsModal')?.remove();
        document.getElementById('feedbackModal')?.remove();
    });
}
