import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();
  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForTimeout(2000);

  // Close modals
  for (let i = 0; i < 3; i++) {
    const m = page.locator('button.btn-circle').first();
    if (await m.isVisible().catch(() => false)) await m.click().catch(() => {});
    await page.waitForTimeout(300);
  }

  // Switch to Hotel tab
  const hotelTab = page.locator('li:has-text("Hotels")').first();
  await hotelTab.click();
  await page.waitForTimeout(1000);

  // Click Guest popover trigger
  const trigger = page.locator('input[value*="Guest"], input[value*="Room"], input[placeholder*="Guest"], div:has-text("Guest(s) in")').filter({ visible: true }).first();
  console.log('Trigger visible:', await trigger.isVisible());
  await trigger.click({ force: true });
  await page.waitForTimeout(1000);

  const popover = page.locator('.modal-box, div.absolute, div.popover, div[class*="shadow"]').filter({ hasText: /Room|Adult|Apply/i }).first();
  const popoverHtml = await popover.innerHTML().catch(() => 'NOT FOUND');
  console.log('--- POPOVER HTML ---');
  console.log(popoverHtml);

  fs.writeFileSync('scratch/popover.html', popoverHtml);
  await browser.close();
})();
