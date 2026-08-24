import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

(async () => {
  const authPath = path.resolve(process.cwd(), '.auth/user_sadhin123.json');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: authPath });
  const page = await context.newPage();

  console.log('Navigating to B2B portal...');
  await page.goto('https://b2b.innovatedemo.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Looking for Hotels tab...');
  const hotelsTab = page.getByText('Hotels').first();
  console.log('Is Hotels tab visible?:', await hotelsTab.isVisible());

  await hotelsTab.click();
  await page.waitForTimeout(3000);

  const isDestinationVisible = await page.getByRole('textbox', { name: 'Select Destination' }).isVisible();
  console.log('Is Select Destination visible after click?:', isDestinationVisible);

  if (!isDestinationVisible) {
    console.log('Trying click on li parent...');
    await page.locator('li:has-text("Hotels")').first().click({ force: true });
    await page.waitForTimeout(3000);
    console.log('Is Select Destination visible after parent click?:', await page.getByRole('textbox', { name: 'Select Destination' }).isVisible());
  }

  await browser.close();
})();
