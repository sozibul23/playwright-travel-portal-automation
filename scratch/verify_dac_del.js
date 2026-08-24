import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://b2c.innovatedemo.com/');
  await page.waitForTimeout(1000);

  // Origin DAC
  console.log('Selecting Origin DAC...');
  const originInput = page.locator('input.sb-input').first();
  await originInput.click({ force: true });
  await page.waitForTimeout(400);
  const searchOrigin = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  await searchOrigin.fill('dac');
  await page.waitForTimeout(500);
  await page.getByText(/Hazrat Shahjalal/i).first().click();

  // Destination DEL
  console.log('Selecting Destination DEL (Delhi)...');
  const destInput = page.locator('input.sb-input').nth(1);
  await destInput.click({ force: true });
  await page.waitForTimeout(400);
  const searchDest = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  await searchDest.fill('del');
  await page.waitForTimeout(500);
  await page.locator('li, div, [role="option"]').filter({ hasText: /Delhi|Indira Gandhi|DEL/i }).first().click();

  // Date
  console.log('Selecting Date...');
  const dateInput = page.locator('input.sb-input').filter({ hasText: '' }).nth(2);
  await dateInput.click({ force: true });
  await page.waitForTimeout(400);
  const nextBtn = page.locator('.react-calendar__navigation__next-button').first();
  await nextBtn.click();
  await page.waitForTimeout(300);
  const days = page.locator('.react-calendar__month-view__days button:not([disabled])');
  await days.nth(15).click();
  await page.waitForTimeout(400);

  // Click Search
  console.log('Clicking Search...');
  const searchBtn = page.locator('button').filter({ hasText: 'Search' }).first();
  await searchBtn.click();

  console.log('Waiting for search results for DAC -> DEL...');
  const selectFlightBtn = page.locator('button').filter({ hasText: /Select|Book Now/i }).first();
  await selectFlightBtn.waitFor({ state: 'visible', timeout: 35000 });
  console.log('✅ Found flight for DAC -> DEL! Clicking Select...');
  await selectFlightBtn.click();

  await page.waitForURL(/checkout|booking/i, { timeout: 35000 });
  console.log('✅ Reached checkout page for DAC -> DEL:', page.url());

  const couponInput = page.getByRole('textbox', { name: 'Coupon' });
  console.log('Coupon input visible:', await couponInput.isVisible());

  await browser.close();
})();
