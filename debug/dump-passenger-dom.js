import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto(process.env.BASE_URL + '/login');
  await page.locator('input[placeholder="Username"]').fill(process.env.TEST_USERNAME || 'sadhin123');
  await page.locator('input[placeholder="Password"]').fill(process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com');
  await page.locator('button:has-text("Log In")').click();

  console.log('Waiting for search page...');
  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Set Search params
  await page.locator('label:has-text("Leaving From") + input').first().click();
  await page.getByPlaceholder('Airport code, city, name or country').first().fill('dac');
  await page.waitForTimeout(1000);
  await page.getByRole('option').filter({ hasText: 'Dhaka' }).first().click();

  await page.locator('label:has-text("Going To") + input').first().click();
  await page.getByPlaceholder('Airport code, city, name or country').first().fill('del');
  await page.waitForTimeout(1000);
  await page.getByRole('option').filter({ hasText: 'New Delhi - India' }).first().click();

  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().click();
  await page.getByLabel('July 15,').first().click();

  // Select Supplier and Search
  await page.getByRole('combobox', { name: 'Select Supplier' }).click();
  await page.getByPlaceholder('Search...').fill('TravelRobotFlight-Sandbox');
  await page.getByRole('option', { name: 'TravelRobotFlight-Sandbox', exact: true }).click();
  
  console.log('Searching flights...');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL(/flight\/search/, { timeout: 30000 });

  console.log('Selecting flight...');
  const selectBtn = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
  await selectBtn.waitFor({ state: 'visible', timeout: 30000 });
  
  if ((await selectBtn.textContent()).includes('View Fare')) {
    await selectBtn.click();
    await page.waitForTimeout(2000);
  }

  const popupPromise = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => null);
  await page.getByRole('button', { name: /^Book Now$/i }).first().click({ force: true });
  
  const modalBookNow = page.locator('.modal').getByRole('button', { name: 'Book Now' });
  if (await modalBookNow.isVisible().catch(() => false)) {
    await modalBookNow.click({ force: true });
  }

  const formPage = await popupPromise;
  if (!formPage) {
    console.error('Failed to get form page popup');
    await browser.close();
    return;
  }
  await formPage.waitForLoadState();

  const firstNameField = formPage.getByRole('textbox', { name: 'First/Given Name *' }).first();
  await firstNameField.waitFor({ state: 'visible', timeout: 30000 });
  console.log('Landed on passenger details page!');

  // Dump all input elements
  console.log('Dumping all input fields:');
  const inputs = await formPage.locator('input').all();
  for (let i = 0; i < inputs.length; i++) {
    const html = await inputs[i].evaluate(el => el.outerHTML);
    console.log(`Input ${i}: ${html}`);
  }

  await browser.close();
}

run().catch(console.error);
