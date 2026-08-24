import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://b2b.innovatedemo.com/login');
  const loginPage = new LoginPage(page);
  await loginPage.login(process.env.TEST_USERNAME_1 || 'sadhin123', process.env.TEST_PASSWORD_1 || 'Innovate@2026');
  await page.waitForTimeout(3000);

  const testSuppliers = ['yuehang test', 'Sabre ITT Sandbox', 'Sabre Demo', 'Travelport-Sandbox', 'Air Arabia - Sandbox HB', 'Fly Adeal FTS'];

  for (const s of testSuppliers) {
    console.log(`Checking supplier: [${s}] for DAC -> CXB...`);
    await page.goto('https://b2b.innovatedemo.com');
    await page.waitForTimeout(1500);

    // Select Supplier
    const supInput = page.locator('input[placeholder*="Supplier"]').first();
    await supInput.click({ force: true });
    await page.waitForTimeout(300);
    const opt = page.locator('div, li, span, button').filter({ hasText: s }).first();
    if (await opt.isVisible()) {
      await opt.click({ force: true });
      await page.waitForTimeout(300);
    }

    // Search
    await page.locator('button').filter({ hasText: /^Search$/i }).first().click({ force: true });
    await page.waitForTimeout(6000);

    const count = await page.locator('button').filter({ hasText: /Select Flight|View Fare|Book/i }).count();
    console.log(`Supplier [${s}] results count:`, count);
    if (count > 0) {
      console.log(`>>> MATCH FOUND: Supplier [${s}] has active flights!`);
      break;
    }
  }

  await browser.close();
})();
