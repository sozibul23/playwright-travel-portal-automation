import { test, expect } from '../../fixtures/hotelFixture.js';

test('Verify radio input accordion expansion and plus/minus logic', async ({ hotelSearchPage }) => {
  await hotelSearchPage.page.goto('/');
  await hotelSearchPage.goToHotelTab();

  const container = hotelSearchPage.page.locator('.passengerContainer').first();
  const input = container.locator('input.sb-input').first();

  await input.click();
  await hotelSearchPage.page.waitForTimeout(300);

  const popover = hotelSearchPage.page.locator('.passengerContainer div[class*="lists"]').first();
  await popover.waitFor({ state: 'visible' });

  // Add Room 2
  const addRoomBtn = popover.getByRole('button', { name: 'Add Room' }).or(popover.locator('button:has-text("Add Room")')).first();
  await addRoomBtn.click();
  await hotelSearchPage.page.waitForTimeout(300);

  const roomBlocks = popover.locator('div.collapse');
  const count = await roomBlocks.count();
  console.log(`Total room count: ${count}`);

  // Expand Room 1 via radio input
  const room1 = roomBlocks.nth(0);
  await room1.locator('input[type="radio"]').check();
  await hotelSearchPage.page.waitForTimeout(200);

  // Room 1: add 1 adult
  await room1.locator('.plusBtn').first().click();
  await hotelSearchPage.page.waitForTimeout(100);

  // Room 1: add 1 child
  await room1.locator('.plusBtn').nth(1).click();
  await hotelSearchPage.page.waitForTimeout(100);

  // Expand Room 2 via radio input
  const room2 = roomBlocks.nth(1);
  await room2.locator('input[type="radio"]').check();
  await hotelSearchPage.page.waitForTimeout(200);

  // Room 2: add 1 adult
  await room2.locator('.plusBtn').first().click();
  await hotelSearchPage.page.waitForTimeout(100);

  // Room 2: add 1 child
  await room2.locator('.plusBtn').nth(1).click();
  await hotelSearchPage.page.waitForTimeout(100);

  // Apply
  const applyBtn = popover.getByRole('button', { name: 'Apply' }).or(popover.locator('button:has-text("Apply")')).first();
  await applyBtn.click();
  await hotelSearchPage.page.waitForTimeout(400);

  const val = await input.inputValue();
  console.log('Resulting input value:', val);
  expect(val).toContain('2 Room');
  expect(val).toContain('7 Guest');
});
