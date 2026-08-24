/**
 * deep_dump_popover.js — Get full outerHTML of entire passengerContainer after Add Room
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  let context;
  try {
    context = await browser.newContext({ storageState: '.auth/user_sadhin123.json' });
  } catch {
    context = await browser.newContext({ storageState: 'storageState.json' });
  }
  const page = await context.newPage();

  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);

  // Dismiss modal
  const closeBtn = page.locator('button.btn-circle').first();
  if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }

  // Switch to Hotels
  const hotelTab = page.getByRole('listitem').filter({ hasText: /^Hotels$/i }).first();
  await hotelTab.click();
  await page.waitForTimeout(1000);

  // Click trigger
  const trigger = page.locator('.passengerContainer').filter({ visible: true }).first();
  await trigger.click({ force: true });
  await page.waitForTimeout(800);

  // Save full passengerContainer HTML BEFORE add room
  const container = page.locator('.passengerContainer');
  const htmlBefore = await container.evaluate(el => el.outerHTML).catch(() => 'NOT FOUND');
  fs.writeFileSync('scratch/passenger_container_before.html', htmlBefore);
  console.log('Saved passenger_container_before.html');

  // Try clicking "Add Room" using evaluate (bypass any overlay)
  const addRoomResult = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addRoom = buttons.find(b => b.textContent.trim() === 'Add Room');
    if (addRoom) {
      addRoom.click();
      return `Clicked Add Room button. disabled=${addRoom.disabled}, text="${addRoom.textContent.trim()}"`;
    }
    return 'Add Room button NOT FOUND in DOM';
  });
  console.log('JS click result:', addRoomResult);
  await page.waitForTimeout(600);

  // Save full passengerContainer HTML AFTER add room
  const htmlAfter = await container.evaluate(el => el.outerHTML).catch(() => 'NOT FOUND');
  fs.writeFileSync('scratch/passenger_container_after.html', htmlAfter);
  console.log('Saved passenger_container_after.html');

  // Check div.collapse count
  const collapseCount = await container.locator('div.collapse').count();
  console.log('div.collapse count after JS click:', collapseCount);

  // Also check all collapse children
  const allCollapse = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.passengerContainer div.collapse')).map((el, i) => ({
      index: i,
      text: el.innerText.trim().substring(0, 80)
    }));
  });
  console.log('All collapse divs:', JSON.stringify(allCollapse, null, 2));

  await page.waitForTimeout(2000);
  await browser.close();
})();
