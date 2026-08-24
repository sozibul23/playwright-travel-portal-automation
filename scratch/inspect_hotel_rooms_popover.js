import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('sadhin123', '123456sS@');
  await page.waitForTimeout(2000);

  // Switch to Hotel tab
  const hotelTab = page.getByRole('listitem').filter({ hasText: /^Hotels$/i }).first();
  await hotelTab.click();
  await page.waitForTimeout(1000);

  // Click Travelers / Guest popover
  const trigger = page.getByText(/Guest\(s\) in/i).or(page.getByText('Travelers')).or(page.locator('input[value*="Guest"]')).first();
  await trigger.click();
  await page.waitForTimeout(1000);

  // Dump popover content
  const popover = page.locator('.modal-box, div.absolute, div.popover, div[class*="shadow"]').filter({ hasText: /Room|Adult|Children|Apply/i }).first();
  const html = await popover.innerHTML().catch(() => 'NOT FOUND');
  console.log('--- POPOVER HTML ---');
  console.log(html);

  await browser.close();
})();
