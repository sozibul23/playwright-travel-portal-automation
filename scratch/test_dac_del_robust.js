import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://b2c.innovatedemo.com/');
  await page.waitForTimeout(1000);

  // Set Origin
  console.log('Setting Origin DAC...');
  const originBox = page.getByRole('textbox', { name: 'Select' }).first();
  await originBox.click({ force: true });
  await page.waitForTimeout(300);
  const searchOrigin = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  await searchOrigin.fill('dac');
  await page.waitForTimeout(500);
  await page.getByText(/Hazrat Shahjalal/i).first().click();
  await page.waitForTimeout(500);

  // Set Destination DEL
  console.log('Setting Destination DEL...');
  const destBox = page.getByRole('textbox', { name: 'Select' }).nth(1);
  await destBox.click({ force: true });
  await page.waitForTimeout(300);
  const searchDest = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  await searchDest.fill('del');
  await page.waitForTimeout(500);
  await page.locator('li, div, [role="option"]').filter({ hasText: /Delhi|DEL/i }).first().click();
  await page.waitForTimeout(500);

  // Check all available textboxes after setting origin and destination
  const allInputs = await page.$$eval('input', els => els.map((el, i) => ({
    i,
    placeholder: el.placeholder,
    value: el.value,
    className: el.className
  })));
  console.log('All inputs after route selection:', allInputs);

  // Find date input
  const dateInput = page.locator('input[value*="2026"], input[placeholder="Select"]').last();
  await dateInput.click({ force: true });
  await page.waitForTimeout(500);

  const nextBtn = page.locator('.react-calendar__navigation__next-button').first();
  await nextBtn.click();
  await page.waitForTimeout(300);

  const dayTile = page.locator('.react-calendar__month-view__days button:not([disabled])').nth(15);
  await dayTile.click();
  await page.waitForTimeout(400);

  // Click Search
  console.log('Clicking search...');
  await page.locator('button').filter({ hasText: 'Search' }).first().click();

  console.log('Waiting for search results...');
  const selectBtn = page.locator('button').filter({ hasText: /Select|Book Now/i }).first();
  await selectBtn.waitFor({ state: 'visible', timeout: 40000 });
  console.log('✅ Found flight for DAC -> DEL! URL:', page.url());

  await browser.close();
})();
