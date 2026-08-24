import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();

  console.log('Navigating to homepage...');
  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForTimeout(2000);

  // Close promo modals
  const closeBtn = page.locator('button.btn-circle').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click().catch(() => {});
  }

  // Click Hotels tab
  const hotelTab = page.locator('li:has-text("Hotels")').first();
  await hotelTab.click({ force: true });
  await page.waitForTimeout(1000);

  // Click Travelers popover trigger
  const trigger = page.locator('div, input').filter({ hasText: /2 Guest\(s\) in 1 Room|Travelers|Guest/i }).filter({ visible: true }).first();
  await trigger.click({ force: true });
  await page.waitForTimeout(500);

  // Click Add Room twice to create Room 1, Room 2, Room 3
  const addRoomBtn = page.getByRole('button', { name: 'Add Room' }).or(page.locator('button:has-text("Add Room")')).first();
  await addRoomBtn.click();
  await page.waitForTimeout(300);
  await addRoomBtn.click();
  await page.waitForTimeout(300);

  // Inspect popover elements
  const popover = page.locator('.modal-box, div.absolute, div.popover, div[class*="shadow"]').filter({ hasText: /Room 1|Apply/i }).first();

  // Find elements containing "Room 1", "Room 2", "Room 3"
  console.log('--- Room headings / containers inspection ---');
  for (let r = 1; r <= 3; r++) {
    const heading = popover.locator(`h1, h2, h3, h4, h5, h6, div, span, p`).filter({ hasText: new RegExp(`^Room ${r}$`, 'i') }).first();
    const isVis = await heading.isVisible().catch(() => false);
    console.log(`Room ${r} heading visible: ${isVis}`);
    if (isVis) {
      const parentDiv = heading.locator('xpath=ancestor::div[contains(@class, "border") or contains(@class, "p-") or contains(@class, "flex") or contains(@class, "space") or contains(@class, "bg-")][1]');
      const parentText = await parentDiv.innerText().catch(() => '');
      console.log(`Room ${r} container text:`, JSON.stringify(parentText.split('\n')));
    }
  }

  await browser.close();
})();
