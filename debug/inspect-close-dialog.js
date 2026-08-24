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

  console.log('Waiting for network to be idle...');
  await page.waitForLoadState('networkidle');
  console.log('Checking for open modals...');
  const openModals = page.locator('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open');
  const count = await openModals.count();
  console.log(`Found ${count} open modals.`);

  if (count > 0) {
    console.log('Pressing Escape key...');
    await page.keyboard.press('Escape');
    
    console.log('Waiting 2 seconds...');
    await page.waitForTimeout(2000);

    const isVisible = await openModals.first().isVisible().catch(() => false);
    console.log('Is modal container visible after Escape?', isVisible);
  }

  await browser.close();
}

run().catch(console.error);
