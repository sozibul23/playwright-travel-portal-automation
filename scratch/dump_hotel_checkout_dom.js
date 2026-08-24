import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.BASE_URL || 'https://b2b.innovatedemo.com';
  console.log('1. Navigating to login...');
  await page.goto(baseURL + '/login');
  await page.locator('input[type="text"], input[name="username"], input[placeholder*="username" i]').first().fill(process.env.TEST_USERNAME || 'sadhin123');
  await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first().fill(process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com');
  await page.locator('button:has-text("Log In"), button:has-text("Login")').first().click();

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
  await page.keyboard.press('Escape');

  console.log('2. Switching to Hotels tab...');
  const hotelTab = page.locator('li:has-text("Hotels"), div:has-text("Hotels")').first();
  await hotelTab.click({ force: true });
  await page.waitForTimeout(1000);

  console.log('3. Selecting Destination...');
  const destInput = page.getByRole('textbox', { name: 'Select Destination' }).or(page.locator('input[placeholder*="Destination"]')).first();
  await destInput.click();
  const searchBox = page.getByRole('searchbox').or(page.locator('input[type="search"]')).first();
  await searchBox.fill('dubai');
  await page.waitForTimeout(1000);
  const suggestion = page.locator('h6, h5, li, .cursor-pointer').filter({ hasText: /dubai/i }).nth(1);
  await suggestion.click();

  console.log('4. Clicking Search...');
  const searchBtn = page.getByRole('button', { name: 'Search' }).first();
  await searchBtn.click({ force: true });

  console.log('5. Waiting for results & clicking View All Rooms...');
  const viewRoomsBtn = page.locator('button:has-text("View All Rooms"), a:has-text("View All Rooms"), button:has-text("View Rooms")').first();
  await viewRoomsBtn.waitFor({ state: 'visible', timeout: 35000 });
  
  const popupPromise = page.waitForEvent('popup');
  await viewRoomsBtn.click();
  const detailPage = await popupPromise;
  await detailPage.waitForLoadState('domcontentloaded');
  await detailPage.waitForTimeout(3000);

  console.log(`Detail page URL: ${detailPage.url()}`);
  
  console.log('6. Clicking Choose on room...');
  const chooseBtn = detailPage.locator('button:has-text("Choose")').first();
  await chooseBtn.waitFor({ state: 'visible', timeout: 20000 });
  await chooseBtn.click({ force: true });
  await detailPage.waitForTimeout(4000);

  console.log(`Post-choose URL: ${detailPage.url()}`);
  const html = await detailPage.content();
  fs.writeFileSync('./scratch/hotel-checkout-dom.html', html);
  console.log('Dumped HTML to ./scratch/hotel-checkout-dom.html');

  // Log visible textboxes
  const textboxes = await detailPage.locator('input').all();
  console.log(`Total inputs on post-choose page: ${textboxes.length}`);
  for (let i = 0; i < textboxes.length; i++) {
    const placeholder = await textboxes[i].getAttribute('placeholder').catch(() => '');
    const name = await textboxes[i].getAttribute('name').catch(() => '');
    const type = await textboxes[i].getAttribute('type').catch(() => '');
    const visible = await textboxes[i].isVisible().catch(() => false);
    if (visible) {
      console.log(`Input ${i}: visible=${visible}, type="${type}", placeholder="${placeholder}", name="${name}"`);
    }
  }

  await browser.close();
})();
