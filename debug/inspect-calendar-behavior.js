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

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Close modals
  const closeButtons = page.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle');
  const count = await closeButtons.count();
  for (let i = 0; i < count; i++) {
    const btn = closeButtons.nth(i);
    if (await btn.isVisible()) {
      await btn.click({ force: true });
      await page.waitForTimeout(500);
    }
  }

  // Go to Round Trip
  console.log('Selecting Round Trip...');
  const roundTrip = page.locator('li').filter({ hasText: 'Round Trip' }).first();
  await roundTrip.click();

  // Open datepicker
  console.log('Opening datepicker...');
  const dateInput = page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first();
  await dateInput.click({ force: true });
  await page.waitForTimeout(1000);

  // Select July 15 as departure
  console.log('Clicking July 15 (Departure)...');
  await page.getByLabel('July 15,').first().click();
  await page.waitForTimeout(1000);

  // Check if July 10 is disabled
  console.log('Checking status of July 10 (which is before July 15)...');
  const july10 = page.getByLabel('July 10,').first();
  const classList = await july10.getAttribute('class');
  console.log(`July 10 class attribute: "${classList}"`);

  // Try to click July 10 anyway
  console.log('Attempting to click July 10...');
  await july10.click({ force: true }).catch(err => console.log('Click failed:', err.message));
  await page.waitForTimeout(1000);

  // Check the return date input value
  const returnInput = page.locator('label:has-text("Return Date") + input, textbox[placeholder="mm/dd/yyyy"]').nth(1);
  const returnVal = await returnInput.inputValue().catch(() => 'could not read');
  console.log(`Return Date input value after clicking July 10: "${returnVal}"`);

  await browser.close();
}

run().catch(console.error);
