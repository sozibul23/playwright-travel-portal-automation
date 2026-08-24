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

  // Close modals
  for (let i = 0; i < 3; i++) {
    const m = page.locator('button.btn-circle').first();
    if (await m.isVisible().catch(() => false)) await m.click().catch(() => {});
    await page.waitForTimeout(300);
  }

  console.log('Performing Hotel Search for 3 Rooms / 7 Adults / 3 Children...');
  const hotelSearchPage = new HotelSearchPage(page);
  await hotelSearchPage.performSearch('dhaka', null, null, null, 'All', 0);

  await page.waitForTimeout(2000);

  const hotelDetailsPage = new HotelDetailsPage(page);
  const detailPage = await hotelDetailsPage.openHotelDetailsTab(0);

  if (!detailPage) {
    console.log('No detail page opened!');
    await browser.close();
    return;
  }

  await detailPage.waitForTimeout(4000);

  // Dump all room containers / rows on details page
  const roomRows = detailPage.locator('tr, div[class*="room"], div[class*="border"], div[class*="card"], div[class*="item"]').filter({ hasText: /Book|Choose|Select|BDT|Tk|\$|\$/i });
  const count = await roomRows.count();
  console.log(`Found ${count} candidate room rows on details page.`);

  const rowsInfo = [];
  for (let i = 0; i < Math.min(count, 20); i++) {
    const txt = await roomRows.nth(i).innerText().catch(() => '');
    const cleanTxt = txt.replace(/\n+/g, ' | ');
    rowsInfo.push(`Row #${i + 1}: ${cleanTxt}`);
  }

  fs.writeFileSync('scratch/details_rooms_dump.txt', rowsInfo.join('\n\n'));
  console.log('Saved details_rooms_dump.txt');

  const fullHtml = await detailPage.innerHTML('body').catch(() => '');
  fs.writeFileSync('scratch/details_page.html', fullHtml);
  console.log('Saved details_page.html');

  await browser.close();
})();
