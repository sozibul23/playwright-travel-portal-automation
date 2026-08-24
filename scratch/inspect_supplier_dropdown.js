import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: process.env.BASE_URL || 'https://b2b.innovatedemo.com' });
  const page = await context.newPage();
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(process.env.TEST_USERNAME || 'sadhin123', process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com');
  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 30000 });

  const combobox = page.getByRole('combobox', { name: 'Select Supplier' });
  await combobox.click();
  await page.waitForTimeout(500);

  const searchInput = page.getByPlaceholder('Search...').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('yuehang test');
    await page.waitForTimeout(500);
  }

  // Dump all items inside dropdown
  const listItems = await page.locator('[role="option"], [role="listitem"], li, .dropdown-content div, div[class*="option"]').allInnerTexts();
  console.log('Supplier Dropdown Items:', listItems.slice(0, 10));

  console.log('Combobox text before click:', await combobox.innerText());

  const yuehangOption = page.locator('div, li, [role="option"]').filter({ hasText: /^yuehang test$/i }).first();
  console.log('Found yuehang option count:', await yuehangOption.count());
  if (await yuehangOption.count() > 0) {
    await yuehangOption.click({ force: true });
    await page.waitForTimeout(500);
    console.log('Combobox text after click:', await combobox.innerText());
  }

  await browser.close();
})();
