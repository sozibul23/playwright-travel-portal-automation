import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://b2c.innovatedemo.com/');
  await page.waitForTimeout(1000);

  // Click departure date input (the one with date value)
  const dateInput = page.locator('input.sb-input').filter({ hasText: '' }).nth(2);
  await dateInput.click({ force: true });
  await page.waitForTimeout(500);

  // Advance by 1 month
  const nextBtn = page.locator('.react-calendar__navigation__next-button').first();
  await nextBtn.click();
  await page.waitForTimeout(300);

  // Select day
  const days = page.locator('.react-calendar__month-view__days button:not([disabled])');
  console.log('Available days count:', await days.count());
  await days.nth(15).click();
  await page.waitForTimeout(500);

  // Click Search
  console.log('Clicking Search...');
  const searchBtn = page.locator('button').filter({ hasText: 'Search' }).first();
  await searchBtn.click();

  console.log('Waiting for flight results...');
  const selectFlightBtn = page.locator('button').filter({ hasText: /Select|Book Now/i }).first();
  await selectFlightBtn.waitFor({ state: 'visible', timeout: 35000 });
  console.log('✅ Found flight! Clicking Select...');
  await selectFlightBtn.click();

  console.log('Waiting for checkout...');
  await page.waitForURL(/checkout|booking/i, { timeout: 30000 });
  console.log('Checkout URL:', page.url());

  const couponInput = page.getByRole('textbox', { name: 'Coupon' }).or(page.locator('input[placeholder*="Coupon"]'));
  await couponInput.waitFor({ state: 'visible', timeout: 15000 });
  console.log('✅ Coupon input is visible on B2C checkout page!');

  await couponInput.fill('AUG27');
  const applyBtn = page.getByRole('button', { name: 'Apply' }).or(page.locator('button:has-text("Apply")'));
  await applyBtn.click();
  await page.waitForTimeout(2000);

  console.log('✅ Coupon Applied successfully on B2C!');

  await browser.close();
})();
