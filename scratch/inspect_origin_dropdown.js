import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL || 'https://b2b.innovatedemo.com'
  });
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env.TEST_USERNAME || 'sadhin123',
    process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com'
  );

  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click Origin Input
  const originInput = page.locator('input.sb-input[placeholder="Select"]').or(page.getByRole('textbox', { name: 'Select' })).first();
  await originInput.click();
  await page.waitForTimeout(1000);

  console.log('--- ORIGIN DROPDOWN OPENED ---');
  const searchBox = page.getByRole('searchbox', { name: /Airport code, city, name or|Search/i })
    .or(page.locator('input[type="search"], input[placeholder*="Airport" i], input[placeholder*="Search" i]'))
    .first();
  console.log('Searchbox visible:', await searchBox.isVisible());

  await searchBox.fill('DAC');
  await page.waitForTimeout(1000);

  const dropdownOptions = await page.locator('div[role="option"], li[role="option"], [class*="option"], div.cursor-pointer, .select-option, ul li, div[class*="select"]').allInnerTexts();
  console.log('--- ALL DROPDOWN OPTION TEXTS AFTER TYPING DAC ---');
  console.log(dropdownOptions.map(t => t.replace(/\s+/g, ' ').trim()).filter(t => t.length > 0).slice(0, 15));

  await browser.close();
})().catch(console.error);
