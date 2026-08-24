import { chromium } from '@playwright/test';
import fs from 'fs';
import { HotelSearchPage } from '../pages/HotelSearchPage.js';

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

  // 2. Perform search for 2 Rooms / 4 Adults
  const hotelSearchPage = new HotelSearchPage(page);
  await hotelSearchPage.goToHotelTab();
  await hotelSearchPage.selectDestination('dhaka', null, 0);
  await hotelSearchPage.selectDates();
  await hotelSearchPage.selectGuestsAndRooms(2, 4, 0);
  await hotelSearchPage.selectSupplier('All');
  await hotelSearchPage.clickSearch();

  await page.waitForTimeout(3000);

  // 3. Open details page for card #1 or card #2
  const viewRoomsBtn = page.locator('a:has-text("View All Rooms"), button:has-text("View All Rooms"), a:has-text("View Rooms")').first();
  await viewRoomsBtn.waitFor({ state: 'visible', timeout: 20000 });
  const popupPromise = page.waitForEvent('popup');
  await viewRoomsBtn.click();
  const detailPage = await popupPromise;

  await detailPage.waitForLoadState('domcontentloaded');
  await detailPage.waitForTimeout(4000);

  console.log('Detail Page URL:', detailPage.url());
  const bodyText = await detailPage.innerText('body');
  fs.writeFileSync('scratch/multi_room_details_text.txt', bodyText);
  console.log('Saved multi_room_details_text.txt');

  await detailPage.screenshot({ path: 'scratch/multi_room_details.png', fullPage: true });
  console.log('Saved multi_room_details.png');

  await browser.close();
})();
