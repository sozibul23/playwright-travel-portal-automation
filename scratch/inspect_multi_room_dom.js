import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();
  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForTimeout(2000);

  // Dismiss modals
  const m = page.locator('button.btn-circle').first();
  if (await m.isVisible().catch(() => false)) await m.click().catch(() => {});

  // Switch to Hotel tab
  const hotelTab = page.locator('li:has-text("Hotels")').first();
  await hotelTab.click();
  await page.waitForTimeout(1000);

  // Click Travelers trigger
  const trigger = page.locator('input[value*="Guest"], div:has-text("2 Guest(s) in 1 Room"), div:has-text("Travelers")').filter({ visible: true }).first();
  await trigger.click({ force: true });
  await page.waitForTimeout(500);

  // Click Add Room twice
  const addRoomBtn = page.getByRole('button', { name: 'Add Room' }).or(page.locator('button:has-text("Add Room")')).first();
  await addRoomBtn.click();
  await page.waitForTimeout(300);
  await addRoomBtn.click();
  await page.waitForTimeout(300);

  // Now inspect all Room blocks in popover
  const popover = page.locator('.modal-box, div.absolute, div.popover, div[class*="shadow"]').filter({ hasText: /Room 1|Apply/i }).first();
  const outerHtml = await popover.evaluate(el => el.outerHTML).catch(() => 'NOT FOUND');
  fs.writeFileSync('scratch/multi_room_popover.html', outerHtml);
  console.log('Saved multi_room_popover.html');

  await browser.close();
})();
