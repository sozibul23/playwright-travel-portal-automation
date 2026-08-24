import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightResultsPage } from '../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Logging in...');
  await page.goto('https://b2b.innovatedemo.com/login');
  const loginPage = new LoginPage(page);
  await loginPage.login(process.env.TEST_USERNAME_1 || 'sadhin123', process.env.TEST_PASSWORD_1 || 'Innovate@2026');
  await page.waitForTimeout(3000);

  // 2. Select Origin (DAC)
  console.log('2. Selecting Origin (DAC)...');
  const originInput = page.locator('input.sb-input').first();
  await originInput.click({ force: true });
  await page.waitForTimeout(500);

  const searchBox1 = page.locator('input[placeholder*="Airport code"], input[type="search"]').filter({ visible: true }).first();
  await searchBox1.fill('DAC');
  await page.waitForTimeout(1000);
  const dacOpt = page.locator('div, li, button, span, [role="option"]').filter({ hasText: /DAC/i }).filter({ visible: true }).first();
  await dacOpt.click({ force: true });
  await page.waitForTimeout(1000);

  // 3. Select Destination (CXB)
  console.log('3. Selecting Destination (CXB)...');
  const destInput = page.locator('input.sb-input').nth(1);
  await destInput.click({ force: true });
  await page.waitForTimeout(500);

  const searchBox2 = page.locator('input[placeholder*="Airport code"], input[type="search"]').filter({ visible: true }).first();
  await searchBox2.fill('CXB');
  await page.waitForTimeout(1000);
  const cxbOpt = page.locator('div, li, button, span, [role="option"]').filter({ hasText: /CXB/i }).filter({ visible: true }).first();
  await cxbOpt.click({ force: true });
  await page.waitForTimeout(1000);

  // 4. Click Search
  console.log('4. Clicking Search button...');
  const searchBtn = page.locator('button').filter({ hasText: /^Search$/i }).first();
  await searchBtn.click({ force: true });
  await page.waitForTimeout(5000);

  console.log('5. Current URL on results page:', page.url());

  // 5. Select flight & book
  const resultsPage = new FlightResultsPage(page);
  console.log('6. Selecting and booking flight...');
  const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
  console.log('7. Booking Form URL:', formPage.url());

  const passengerPage = new PassengerDetailsPage(formPage);
  const initialPrice = await passengerPage.getTotalPayable();
  console.log('8. Initial Payable Price:', initialPrice);

  // 6. Apply Coupon AUG27
  console.log('9. Applying Coupon AUG27...');
  await passengerPage.applyCoupon('AUG27');
  await formPage.waitForTimeout(3000);

  const finalPrice = await passengerPage.getTotalPayable();
  console.log('10. Final Payable Price:', finalPrice);

  await browser.close();
})();
