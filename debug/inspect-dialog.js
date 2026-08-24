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
  await page.waitForTimeout(5000);

  console.log('Checking for active dialogs/modals...');
  const dialogs = await page.locator('dialog, [role="dialog"], .modal').all();
  console.log(`Found ${dialogs.length} dialog(s)`);

  for (let i = 0; i < dialogs.length; i++) {
    const html = await dialogs[i].innerHTML();
    console.log(`--- Dialog ${i} HTML ---`);
    console.log(html);
  }

  await browser.close();
}

run().catch(console.error);
