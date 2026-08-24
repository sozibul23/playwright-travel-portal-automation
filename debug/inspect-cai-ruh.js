import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage.js';

dotenv.config();

async function inspectAirports() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.BASE_URL || 'https://b2b.innovatedemo.com';
  console.log('Navigating to login page at ' + baseURL + '/login');
  await page.goto(baseURL + '/login');

  const loginPage = new LoginPage(page);
  await loginPage.login(
    process.env.TEST_USERNAME || 'sadhin123',
    process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com'
  );

  console.log('Current URL after login attempt:', page.url());
  await page.waitForTimeout(3000);

  // Check if Search button is visible
  const searchBtnVisible = await page.getByRole('button', { name: 'Search' }).isVisible().catch(() => false);
  console.log('Search button visible:', searchBtnVisible);

  if (!searchBtnVisible) {
    console.log('Body text snippet:', (await page.innerText('body')).slice(0, 300));
  }

  // Close modals
  const openModals = page.locator('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open, div.modal');
  for (let i = 0; i < await openModals.count(); i++) {
    const modal = openModals.nth(i);
    const closeBtn = modal.locator('button.btn-circle, button:has-text("✕"), button:has-text("Close")').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => {});
    }
  }

  const queries = ['dac', 'del', 'cai', 'cairo', 'ruh', 'riyadh'];

  for (const q of queries) {
    console.log(`\n=== Query: "${q}" ===`);
    const originInput = page.locator('label:has-text("Leaving From") + input').first();
    if (await originInput.isVisible().catch(() => false)) {
      await originInput.click({ force: true });
      await page.waitForTimeout(300);

      const searchBox = page.getByPlaceholder('Airport code, city, name or country').filter({ visible: true }).first();
      await searchBox.fill('');
      await searchBox.fill(q);
      await page.waitForTimeout(1000);

      const optionLocators = page.locator('[role="option"], li.cursor-pointer, .select-option, [class*="option"], div.option');
      const count = await optionLocators.count();
      console.log(`Found ${count} matching elements for "${q}":`);
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const text = await optionLocators.nth(i).innerText().catch(() => '');
        console.log(`  [${i}] ${text.replace(/\n/g, ' ')}`);
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      console.log('originInput not visible on page!');
    }
  }

  await browser.close();
}

inspectAirports().catch(console.error);
