/**
 * verify_room_add.js — Verify Add Room works after fix, checks actual room count in popover
 * Run: node --experimental-vm-modules scratch/verify_room_add.js
 */
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
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
    await page.waitForTimeout(400);
  }

  // Switch to Hotels
  const hotelTab = page.getByRole('listitem').filter({ hasText: /^Hotels$/i }).first();
  await hotelTab.click();
  await page.waitForTimeout(800);

  // Click trigger
  const trigger = page.locator('.passengerContainer input.sb-input')
    .or(page.locator('.passengerContainer'))
    .filter({ visible: true })
    .first();
  await trigger.click({ force: true });
  await page.waitForTimeout(500);

  // Correct popover locator (fixed)
  const popover = page.locator('.passengerContainer div.flex.flex-col.divide-y')
    .or(page.locator('.passengerContainer div[class*="divide-y"]'))
    .first();

  const passengerContainer = page.locator('.passengerContainer');
  const addRoomBtn = passengerContainer.getByRole('button', { name: 'Add Room' })
    .or(passengerContainer.locator('button:has-text("Add Room")'))
    .filter({ visible: true })
    .first();

  console.log('Popover visible:', await popover.isVisible());
  console.log('Add Room btn visible:', await addRoomBtn.isVisible());
  console.log('div.collapse count BEFORE:', await popover.locator('div.collapse').count());

  // Add 3 rooms
  for (let i = 0; i < 3; i++) {
    await addRoomBtn.click({ force: true });
    await page.waitForTimeout(500);
    const count = await popover.locator('div.collapse').count();
    console.log(`After Add Room click ${i + 1}: div.collapse count = ${count}`);
  }

  // Check room blocks
  const roomBlocks = popover.locator('div.collapse');
  const roomCount = await roomBlocks.count();
  console.log(`\nFinal room count: ${roomCount}`);

  // Read adult counts per room
  for (let r = 0; r < roomCount; r++) {
    const room = roomBlocks.nth(r);
    const adultVal = await room.locator('span.value').first().innerText().catch(() => '?');
    const childVal = await room.locator('span.value').nth(1).innerText().catch(() => '?');
    console.log(`  Room ${r + 1}: adults=${adultVal}, children=${childVal}`);
  }

  // Test adult setting — set Room 1 to 3 adults
  if (roomCount > 0) {
    const room1 = roomBlocks.first();
    // First expand it
    const radio = room1.locator('input[type="radio"]').first();
    await radio.check({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
    const plusBtn = room1.locator('.plusBtn').first();
    await plusBtn.click({ force: true });
    await page.waitForTimeout(200);
    const adultAfter = await room1.locator('span.value').first().innerText().catch(() => '?');
    console.log(`\nRoom 1 adult after +1 click: ${adultAfter} (expected 3)`);
  }

  await page.waitForTimeout(2000);
  await browser.close();
  console.log('\n✅ Verification complete');
})();
