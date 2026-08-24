/**
 * dump_room_popover_full.js
 * Dumps the full travelers popover HTML after adding 3 rooms.
 * Run: node --experimental-vm-modules scratch/dump_room_popover_full.js
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ storageState: '.auth/user_sadhin123.json' })
    .catch(async () => {
      // Fallback to storageState.json if user-specific auth not found
      return browser.newContext({ storageState: 'storageState.json' });
    });
  const page = await context.newPage();

  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // Dismiss any open modal
  const closeBtn = page.locator('button.btn-circle, button:has-text("Close")').first();
  if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await closeBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }

  // Switch to Hotels tab
  const hotelTab = page.getByRole('listitem').filter({ hasText: /^Hotels$/i }).first();
  await hotelTab.click();
  await page.waitForTimeout(1000);

  // Click Travelers / Guest popover trigger
  const trigger = page.locator('.passengerContainer input.sb-input')
    .or(page.locator('.passengerContainer'))
    .filter({ visible: true })
    .first();
  console.log('Trigger visible:', await trigger.isVisible({ timeout: 3000 }));
  await trigger.click({ force: true });
  await page.waitForTimeout(600);

  // Log popover content BEFORE adding rooms
  const popover = page.locator('.passengerContainer div[class*="lists"]').first();
  console.log('\n--- POPOVER TEXT BEFORE ADD ROOM ---');
  console.log(await popover.innerText().catch(() => 'NOT FOUND'));

  // Count div.collapse blocks BEFORE
  const collapseBefore = await popover.locator('div.collapse').count();
  console.log(`\ndiv.collapse count BEFORE: ${collapseBefore}`);

  // Click Add Room 3 times
  const addRoomBtn = popover.getByRole('button', { name: 'Add Room' })
    .or(popover.locator('button:has-text("Add Room")'))
    .first();

  for (let i = 0; i < 3; i++) {
    console.log(`Clicking Add Room (${i + 1}/3)...`);
    await addRoomBtn.click({ force: true });
    await page.waitForTimeout(400);

    const collapseCount = await popover.locator('div.collapse').count();
    console.log(`  -> div.collapse count after click ${i + 1}: ${collapseCount}`);

    // Also count any other potential room block selectors
    const divCount = await popover.locator('div').count();
    console.log(`  -> total divs in popover: ${divCount}`);
  }

  // Full HTML dump after 3 rooms added
  console.log('\n--- POPOVER TEXT AFTER 3 ADD ROOMS ---');
  console.log(await popover.innerText().catch(() => 'NOT FOUND'));

  const html = await popover.innerHTML().catch(() => 'NOT FOUND');
  fs.writeFileSync('scratch/room_popover_3rooms.html', html);
  console.log('\n✅ Saved full HTML to scratch/room_popover_3rooms.html');

  // Try all possible room block selectors and report counts
  console.log('\n--- ROOM BLOCK SELECTOR PROBE ---');
  const selectors = [
    'div.collapse',
    '[class*="room"]',
    '[class*="Room"]',
    'div[class*="collapse"]',
    'div.collapse-title',
    'label:has-text("Room")',
    'div:has-text("Remove")',
    'div:has(.plusBtn)',
  ];
  for (const sel of selectors) {
    const count = await popover.locator(sel).count();
    console.log(`  "${sel}" → ${count} match(es)`);
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
