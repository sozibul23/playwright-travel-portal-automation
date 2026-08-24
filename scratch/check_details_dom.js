import { chromium } from '@playwright/test';
import fs from 'fs';
import { HotelSearchPage } from '../pages/HotelSearchPage.js';
import { HotelDetailsPage } from '../pages/HotelDetailsPage.js';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();

  console.log('Navigating to homepage...');
  await page.goto('https://b2b.innovatedemo.com/');
  await page.waitForTimeout(2000);

  // Close promo modal
  const closeBtn = page.locator('button.btn-circle').first();
  if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click().catch(() => {});

  console.log('Searching for 2 Rooms / 4 Adults...');
  const hotelSearchPage = new HotelSearchPage(page);
  await hotelSearchPage.goToHotelTab();
  await hotelSearchPage.selectDestination('dhaka', null, 0);
  await hotelSearchPage.selectDates();
  await hotelSearchPage.selectGuestsAndRooms(2, 4, 0);
  await hotelSearchPage.selectSupplier('All');
  await hotelSearchPage.clickSearch();

  await page.waitForTimeout(2000);

  const hotelDetailsPage = new HotelDetailsPage(page);
  const detailPage = await hotelDetailsPage.openHotelDetailsTab(0);
  if (!detailPage) {
    console.log('No detail page opened!');
    await browser.close();
    return;
  }

  await detailPage.waitForTimeout(4000);

  const bodyText = await detailPage.innerText('body');
  fs.writeFileSync('scratch/2_room_details_text.txt', bodyText);
  console.log('Saved 2_room_details_text.txt');

  const btns = detailPage.locator('button, a').filter({ hasText: /Book|Choose|Select/i });
  const count = await btns.count();
  console.log(`Found ${count} Book/Choose buttons on 2-room details page.`);

  for (let i = 0; i < count; i++) {
    const txt = await btns.nth(i).innerText().catch(() => '');
    const parentText = await btns.nth(i).evaluate(el => el.closest('tr, div')?.innerText || '').catch(() => '');
    console.log(`Btn #${i}: text="${txt}" | Row text snippet:`, JSON.stringify(parentText.replace(/\n+/g, ' | ').slice(0, 200)));
  }

  await browser.close();
})();
