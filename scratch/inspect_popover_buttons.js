import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();

  console.log('1. Navigating...');
  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForTimeout(2000);

  // Close modals
  for (let i = 0; i < 3; i++) {
    const m = page.locator('button.btn-circle').first();
    if (await m.isVisible().catch(() => false)) await m.click().catch(() => {});
    await page.waitForTimeout(200);
  }

  // Click Hotels tab if visible
  const hotelTab = page.locator('li').filter({ hasText: /^Hotels$/i }).or(page.locator('li:has-text("Hotels")')).first();
  if (await hotelTab.isVisible().catch(() => false)) {
    await hotelTab.click({ force: true });
    await page.waitForTimeout(500);
  }

  // Open Popover
  const trigger = page.locator('div, input').filter({ hasText: /2 Guest\(s\) in 1 Room|Travelers|Guest/i }).filter({ visible: true }).first();
  await trigger.click({ force: true });
  await page.waitForTimeout(500);

  // Click Add Room twice
  const addRoomBtn = page.locator('button:has-text("Add Room")').first();
  await addRoomBtn.click({ force: true });
  await page.waitForTimeout(200);
  await addRoomBtn.click({ force: true });
  await page.waitForTimeout(200);

  // Inspect popover text and buttons
  const popover = page.locator('.modal-box, div.absolute, div.popover, div[class*="shadow"]').filter({ hasText: /Room 1|Apply/i }).first();
  const text = await popover.innerText().catch(() => '');
  console.log('=== POPOVER TEXT ===');
  console.log(text);

  // Find all buttons inside popover
  const btns = popover.locator('button');
  const count = await btns.count();
  console.log(`=== ${count} BUTTONS IN POPOVER ===`);
  for (let i = 0; i < count; i++) {
    const t = await btns.nth(i).innerText().catch(() => '');
    const cls = await btns.nth(i).getAttribute('class').catch(() => '');
    console.log(`Btn #${i}: text="${t}" class="${cls}"`);
  }

  await browser.close();
})();
