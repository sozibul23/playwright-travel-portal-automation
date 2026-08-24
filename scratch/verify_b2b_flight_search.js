import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  // Load saved session state if exists
  const authPath = '.auth/user_sadhin123.json';
  let context;
  if (fs.existsSync(authPath)) {
    context = await browser.newContext({ storageState: authPath });
  } else {
    context = await browser.newContext();
  }

  const page = await context.newPage();
  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForTimeout(2000);

  console.log('Checking Flights form...');
  const searchBtn = page.getByRole('button', { name: 'Search' }).or(page.locator('button:has-text("Search")')).first();
  await searchBtn.waitFor({ state: 'visible', timeout: 30000 });

  console.log('Setting DAC -> DEL on B2B...');
  // Origin
  const originInput = page.locator('input.sb-input[placeholder="Select"]').first();
  await originInput.click({ force: true });
  await page.waitForTimeout(400);
  const searchBox = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  await searchBox.fill('dac');
  await page.waitForTimeout(500);
  await page.locator('div, li, button, span').filter({ hasText: /DAC/i }).filter({ hasText: /Hazrat Shahjalal/i }).last().click();

  // Destination
  const destInput = page.locator('input.sb-input[placeholder="Select"]').nth(1);
  await destInput.click({ force: true });
  await page.waitForTimeout(400);
  const destSearchBox = page.getByRole('searchbox', { name: /Airport code, city|Search/i }).first();
  await destSearchBox.fill('del');
  await page.waitForTimeout(500);
  await page.locator('div, li, button, span').filter({ hasText: /DEL/i }).filter({ hasText: /Delhi/i }).last().click();

  // Select Supplier
  console.log('Selecting Atlas supplier...');
  const supplierTrigger = page.locator('button, div[role="button"]').filter({ hasText: /Supplier|Atlas|TravelRobot|YueHang/i }).first();
  if (await supplierTrigger.isVisible({ timeout: 2000 })) {
    await supplierTrigger.click();
    await page.waitForTimeout(400);
    const atlasOption = page.locator('li, a, div').filter({ hasText: /Atlas/i }).first();
    if (await atlasOption.isVisible({ timeout: 2000 })) {
      await atlasOption.click();
    }
  }

  // Click Search
  console.log('Clicking search on B2B...');
  await searchBtn.click({ force: true });

  console.log('Waiting for flight cards on B2B...');
  const selectBtn = page.getByRole('button', { name: /Select Flight|View Fare|SELECT FLIGHT|Book Now|Book/i }).first();
  await selectBtn.waitFor({ state: 'visible', timeout: 60000 });
  console.log('✅ B2B search results returned!');

  await browser.close();
})();
