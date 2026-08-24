import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto(process.env.BASE_URL + '/login');

  console.log('Logging in...');
  await page.locator('input[placeholder="Username"]').fill(process.env.TEST_USERNAME || 'sadhin123');
  await page.locator('input[placeholder="Password"]').fill(process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com');
  await page.locator('button:has-text("Log In")').click();

  console.log('Waiting for search button to be visible...');
  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 15000 });
  
  console.log('Waiting 3 seconds for modals to load...');
  await page.waitForTimeout(3000);

  // Close modals
  console.log('Closing modals...');
  const closeButtons = page.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle');
  const count = await closeButtons.count();
  console.log(`Found ${count} modal close buttons`);
  for (let i = 0; i < count; i++) {
    const btn = closeButtons.nth(i);
    if (await btn.isVisible()) {
      console.log(`Closing modal button ${i}`);
      await btn.click({ force: true });
      await page.waitForTimeout(500);
    }
  }

  // Click One Way
  console.log('Clicking "One Way" tab...');
  const oneWay = page.locator('li').filter({ hasText: /^One Way$/ }).first();
  await oneWay.waitFor({ state: 'visible', timeout: 5000 });
  await oneWay.click();
  console.log('"One Way" tab clicked successfully!');

  // Fill Search Form
  console.log('Filling search form (DAC to CXB)...');
  
  // Origin
  const originInput = page.locator('label:has-text("Leaving From") + input');
  await originInput.click();
  const searchBox1 = page.getByPlaceholder('Airport code, city, name or country').first();
  await searchBox1.fill('DAC');
  await page.waitForTimeout(1000);
  await page.getByRole('option').filter({ hasText: 'Hazrat Shahjalal Intl Airport' }).first().click();

  // Destination
  const destInput = page.locator('label:has-text("Going To") + input');
  await destInput.click();
  const searchBox2 = page.getByPlaceholder('Airport code, city, name or country').first();
  await searchBox2.fill('CXB');
  await page.waitForTimeout(1000);
  await page.getByRole('option').filter({ hasText: "Cox's Bazar Airport" }).first().click();

  console.log('Search form filled successfully!');
  await browser.close();
}

run().catch(console.error);
