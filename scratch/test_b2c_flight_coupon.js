import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to B2C...');
  await page.goto('https://b2c.innovatedemo.com/');
  await page.waitForTimeout(1000);

  // Origin
  console.log('Selecting Origin DAC...');
  await page.getByRole('textbox', { name: 'Select' }).first().click();
  const searchOrigin = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  await searchOrigin.fill('dac');
  await page.waitForTimeout(600);
  await page.getByText('Hazrat Shahjalal').first().click();

  // Destination
  console.log('Selecting Destination CXB...');
  await page.getByRole('textbox', { name: 'Select' }).nth(1).click();
  const searchDest = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  await searchDest.fill('cxb');
  await page.waitForTimeout(600);
  await page.getByText(/Cox's Bazar/i).first().click();

  // Date
  console.log('Selecting Date...');
  await page.getByRole('textbox', { name: 'Select' }).nth(2).click();
  await page.waitForTimeout(500);
  const nextBtn = page.locator('.react-calendar__navigation__arrow.react-calendar__navigation__next-button').first();
  if (await nextBtn.isVisible({ timeout: 2000 })) {
    await nextBtn.click();
    await page.waitForTimeout(300);
    await nextBtn.click();
    await page.waitForTimeout(300);
  }
  const dateBtn = page.locator('.react-calendar__tile:not([disabled])').nth(10);
  await dateBtn.click();
  await page.waitForTimeout(500);

  // Click Search
  console.log('Clicking Search...');
  await page.getByRole('button', { name: 'Search' }).click();

  console.log('Waiting for search results...');
  const selectBtn = page.getByRole('button', { name: 'Select' }).first();
  await selectBtn.waitFor({ state: 'visible', timeout: 35000 });
  console.log('✅ Flight results rendered! Clicking Select button...');
  await selectBtn.click();

  await page.waitForTimeout(3000);
  console.log('Current URL after select:', page.url());

  const couponInput = page.getByRole('textbox', { name: 'Coupon' });
  const isCouponVisible = await couponInput.isVisible({ timeout: 15000 });
  console.log('Is coupon input visible on checkout page:', isCouponVisible);

  if (isCouponVisible) {
    await couponInput.fill('AUG27');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Coupon AUG27 applied!');
  }

  await browser.close();
})();
