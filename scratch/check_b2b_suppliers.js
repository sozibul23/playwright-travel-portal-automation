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

  // Click Supplier input
  const supInput = page.locator('input[placeholder*="Supplier"]').first();
  await supInput.click({ force: true });
  await page.waitForTimeout(1000);

  const suppliers = await page.locator('li, div[role="option"], .select-option, span').filter({ visible: true }).allInnerTexts();
  console.log('Available suppliers in B2B dropdown:', suppliers);

  await browser.close();
})();
