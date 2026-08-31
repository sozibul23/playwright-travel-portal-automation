import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { getSupplierConfig } from '../data/supplierTestData.js';
import fs from 'fs';
import path from 'path';

/**
 * Perform a fresh UI login, clear stale session files, and save new storage state.
 * @param {Page} page - Playwright page instance
 * @param {string} username - Portal login username (must be provided — no hardcoded fallback)
 * @param {string} password - Portal login password (must be provided — no hardcoded fallback)
 * @param {string|null} authPath - Optional custom path for saving auth state JSON
 */
export async function forceFreshLogin(page, username, password, authPath = null) {
  if (!authPath) {
    const authDir = path.resolve(process.cwd(), '.auth');
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    authPath = path.join(authDir, `user_${safeUsername}.json`);
  }

  try {
    if (fs.existsSync(authPath)) {
      fs.unlinkSync(authPath);
    }
  } catch (e) {}

  console.log(`[Auth] Performing fresh login for user: ${username}...`);
  await page.context().clearCookies().catch(() => {});
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);

  // Save fresh storage state to disk
  await page.context().storageState({ path: authPath }).catch(() => {});
  console.log(`[Auth] Saved fresh session state to ${authPath}`);
}

/**
 * authFixture — Session Storage State Reuse Optimization
 *
 * প্রথম টেস্টে UI দিয়ে একবার Login করে Session Save করে নেয় (.auth/user_*.json)।
 * পরের টেস্টগুলোতে সেভ থাকা সেশন লোড করে নিমিষেই টেস্টে চলে যায় (বারবার লগইন করতে হয় না)।
 * সেশন মেয়াদোত্তীর্ণ বা মিসিং হলে অটোমেটিক ফ্রেশ লগইন করে রিকভার করে।
 */
export const test = base.extend({
  supplierConfig: async ({}, use, testInfo) => {
    const key = testInfo.project.use.supplierKey || 'atlas';
    const name = testInfo.project.use.supplierName || 'Atlas SandBox - TripGic';
    const config = getSupplierConfig(key, name);
    await use(config);
  },

  page: async ({ page }, use, testInfo) => {
    const totalWorkers = testInfo.config.workers || 1;
    const workerIndex = totalWorkers === 1 ? 0 : (testInfo.workerIndex || 0);
    // Resolve per-worker credentials from environment variables.
    // Throws immediately if credentials are not configured, rather than silently using
    // hardcoded values that could inadvertently expose production credentials in CI logs.
    const userEnvKey = `TEST_USERNAME_${workerIndex + 1}`;
    const passEnvKey = `TEST_PASSWORD_${workerIndex + 1}`;

    const username = process.env[userEnvKey]
      || process.env.TEST_USERNAME
      || (() => { throw new Error(`[Auth] No credentials found. Set ${userEnvKey} or TEST_USERNAME in your .env file.`); })();
    const password = process.env[passEnvKey]
      || process.env.TEST_PASSWORD
      || (() => { throw new Error(`[Auth] No credentials found. Set ${passEnvKey} or TEST_PASSWORD in your .env file.`); })();

    const authDir = path.resolve(process.cwd(), '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const authPath = path.join(authDir, `user_${safeUsername}.json`);

    // 1. Try to restore existing session state if file exists and is fresh (< 5 mins)
    if (fs.existsSync(authPath)) {
      const stats = fs.statSync(authPath);
      const fileAgeMs = Date.now() - stats.mtimeMs;
      if (fileAgeMs > 60 * 60 * 1000) {
        console.log(`[Worker ${workerIndex}] Auth state file is older than 60 mins. Clearing for fresh login...`);
        try { fs.unlinkSync(authPath); } catch (e) {}
      } else {
        try {
          const state = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
          if (state.cookies && state.cookies.length > 0) {
            await page.context().addCookies(state.cookies);
          }
        } catch (e) {
          // Fallback to fresh login if session file is corrupt
        }
      }
    }

    // 2. Navigate to base URL to check session validity
    const baseURL = process.env.BASE_URL || 'https://b2b.innovatedemo.com';
    if (page.url() === 'about:blank') {
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' }).catch(() => {});
    }

    const searchBtn = page.getByRole('button', { name: 'Search' })
      .or(page.locator('button:has-text("Search")'))
      .filter({ visible: true })
      .first();

    let isSearchVisible = await searchBtn.waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    // Check if session token cookie is actually present
    const cookies = await page.context().cookies().catch(() => []);
    const hasSessionCookie = cookies.some(c => c.name.includes('session-token') || c.name.includes('token') || c.name.includes('auth'));

    // 3. If session is missing or expired, perform UI login and save state
    if (!isSearchVisible || !hasSessionCookie) {
      await forceFreshLogin(page, username, password, authPath);
    }

    // Ensure search page is ready
    await searchBtn.waitFor({ state: 'visible', timeout: 30000 });

    // Login এর পর কোনো promo/announcement modal পপআপ আসলে তা বন্ধ করা
    const openModals = page.locator('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open');
    
    // We check for up to 3 seconds if an open modal is active
    let modalClosed = false;
    for (let i = 0; i < 6; i++) {
      const count = await openModals.count();
      let modalHandled = false;
      
      for (let j = 0; j < count; j++) {
        const modal = openModals.nth(j);
        
        // Verify if the modal is visible and taking pointer events
        const isVisible = await modal.isVisible();
        const isDisplayed = await modal.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && style.pointerEvents !== 'none';
        }).catch(() => false);
        
        if (isVisible && isDisplayed) {
          modalHandled = true;
          
          // Target close button inside this specific modal
          const closeBtn = modal.locator('button.btn-circle, button:has-text("✕"), button:has-text("Close")').first();
          
          if (await closeBtn.count() > 0 && await closeBtn.isVisible()) {
            try {
              // Try native click first
              await closeBtn.click({ force: true, timeout: 2000 });
              console.log('Clicked close button using native click.');
              await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
            } catch (err) {
              // Fallback to evaluate click
              await closeBtn.evaluate(el => el.click()).catch(() => {});
              await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
            }
          }
          
          // If still displayed, try Escape key
          const stillDisplayed = await modal.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && style.pointerEvents !== 'none';
          }).catch(() => false);
          
          if (stillDisplayed) {
            console.log('Modal still open. Pressing Escape key...');
            await page.keyboard.press('Escape');
            await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
          }
          
          // Fail-safe: Hide it via CSS
          const finalCheck = await modal.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && style.pointerEvents !== 'none';
          }).catch(() => false);
          
          if (finalCheck) {
            console.log('Fail-safe activated: Forcefully hiding the modal via CSS...');
            await modal.evaluate(el => {
              el.style.setProperty('display', 'none', 'important');
              el.style.setProperty('pointer-events', 'none', 'important');
              el.style.setProperty('opacity', '0', 'important');
              el.removeAttribute('open');
            }).catch(() => {});
            await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
          }
        }
      }
      
      if (!modalHandled) {
        await page.waitForFunction(() => !document.querySelector('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open'), { timeout: 500 }).catch(() => {});
      } else {
        modalClosed = true;
        break;
      }
    }

    await use(page);
  },
});

export { expect };