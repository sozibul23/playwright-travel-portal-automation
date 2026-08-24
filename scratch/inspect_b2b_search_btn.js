import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Logging in...');
  await page.goto('https://b2b.innovatedemo.com/login');
  const loginPage = new LoginPage(page);
  await loginPage.login(process.env.TEST_USERNAME_1 || 'sadhin123', process.env.TEST_PASSWORD_1 || 'Innovate@2026');
  await page.waitForTimeout(3000);

  // Check all form inputs on the flight tab
  console.log('Home page loaded. Inspecting inputs...');
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, button, select')).map(el => ({
      tag: el.tagName,
      type: el.type,
      name: el.name,
      class: el.className,
      value: el.value || el.innerText,
      placeholder: el.placeholder,
      visible: el.offsetParent !== null
    }));
  });
  console.log('Inputs found:', JSON.stringify(inputs.filter(i => i.visible), null, 2));

  // Find the search button
  const searchBtn = page.locator('button').filter({ hasText: /^Search$/i }).first();
  console.log('Search button visible:', await searchBtn.isVisible());
  console.log('Search button text:', await searchBtn.innerText());

  // Click Search directly on default fields
  console.log('Clicking Search button on default fields...');
  await searchBtn.click({ force: true });
  await page.waitForTimeout(3000);

  console.log('URL after search click:', page.url());

  // If there are validation errors or modals, print them
  const errors = await page.locator('.error, .text-error, .invalid, [class*="alert"], [class*="error"], [role="alert"]').allInnerTexts();
  console.log('Error alerts:', errors);

  await browser.close();
})();
