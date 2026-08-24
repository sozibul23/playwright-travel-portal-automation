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

  // Open datepicker
  console.log('Opening datepicker...');
  const dateInput = page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first();
  await dateInput.click({ force: true });
  await page.waitForTimeout(2000);

  // Dump all flatpickr-day elements
  console.log('Dumping flatpickr days:');
  const days = await page.locator('.flatpickr-day').all();
  console.log(`Found ${days.length} days in DOM`);
  for (let i = 0; i < days.length; i++) {
    const text = await days[i].innerText();
    const visible = await days[i].isVisible();
    const classList = await days[i].getAttribute('class');
    const label = await days[i].getAttribute('aria-label');
    if (visible) {
      console.log(`Day ${i}: visible = ${visible}, text = "${text}", label = "${label}", classes = "${classList}"`);
    }
  }

  await browser.close();
}

run().catch(console.error);
