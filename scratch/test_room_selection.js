import { chromium } from '@playwright/test';

async function testRooms() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();
  
  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForLoadState('networkidle');

  // Dismiss any promo modals
  const closeBtn = page.locator('.modal button:has-text("✕"), .modal-box button:has-text("✕"), button[aria-label="Close"]').first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click().catch(() => {});
  }

  // Switch to Hotels tab
  const hotelTab = page.locator('button, a, div').filter({ hasText: /^Hotels$/i }).first();
  await hotelTab.click();
  await page.waitForTimeout(500);

  // Trigger
  const trigger = page.locator('input[value*="Guest"], input[placeholder*="Guest"]')
    .or(page.getByRole('textbox').filter({ hasText: /Guest\(s\) in/i }))
    .or(page.getByText(/Guest\(s\) in/i))
    .or(page.getByText('Travelers'))
    .filter({ visible: true })
    .first();

  console.log('Trigger visible:', await trigger.isVisible());
  console.log('Initial trigger value:', await trigger.inputValue().catch(() => 'no val'));
  await trigger.click({ force: true });
  await page.waitForTimeout(500);

  // Popover
  const popover = page.locator('.modal-box, div.absolute, div.popover, div[class*="shadow"]')
    .filter({ hasText: /Room|Adult|Apply/i })
    .filter({ visible: true })
    .first();
  
  console.log('Popover HTML:\n', await popover.evaluate(el => el.innerHTML));

  // Find Add Room button
  const addRoomBtn = popover.getByRole('button', { name: 'Add Room' })
    .or(popover.locator('button:has-text("Add Room")'))
    .first();

  console.log('Add room button visible:', await addRoomBtn.isVisible());
  await addRoomBtn.click({ force: true });
  await page.waitForTimeout(500);

  console.log('Popover HTML after Add Room:\n', await popover.evaluate(el => el.innerHTML));

  // Find Apply button
  const applyBtn = popover.getByRole('button', { name: 'Apply' })
    .or(popover.locator('button:has-text("Apply")'))
    .first();
  console.log('Apply button visible:', await applyBtn.isVisible());
  await applyBtn.click({ force: true });
  await page.waitForTimeout(500);

  console.log('Final trigger value:', await trigger.inputValue().catch(() => 'no val'));

  await browser.close();
}

testRooms().catch(console.error);
