import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 30000,
    retries: 0,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npx serve . -l 3000 -s',
        port: 3000,
        reuseExistingServer: true,
        timeout: 10000,
    },
});
