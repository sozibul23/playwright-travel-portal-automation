import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage.js';
import { HotelSearchPage } from '../pages/HotelSearchPage.js';
import { HotelDetailsPage } from '../pages/HotelDetailsPage.js';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.BASE_URL || 'https://b2b.innovatedemo.com';
  console.log('Logging in...');
  await page.goto(baseURL + '/login');
  const loginPage = new LoginPage(page);
  await loginPage.login(
    process.env.TEST_USERNAME || 'sadhin123',
    process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com'
  );

  const hotelSearchPage = new HotelSearchPage(page);
  const hotelDetailsPage = new HotelDetailsPage(page);

  const destinations = ['dhaka', 'cox', 'bkk', 'dubai'];
  
  for (const dest of destinations) {
    console.log(`\n--- Testing Destination: "${dest}" ---`);
    await hotelSearchPage.goToHotelTab();
    await hotelSearchPage.selectDestination(dest, null, 0);
    await hotelSearchPage.selectDates();
    await hotelSearchPage.selectSupplier('All');
    await hotelSearchPage.clickSearch();

    const detailPage = await hotelDetailsPage.openHotelDetailsTab(0).catch(() => null);
    if (!detailPage) {
      console.log(`Failed to open details tab for "${dest}"`);
      continue;
    }

    console.log(`Detail page URL for "${dest}": ${detailPage.url()}`);
    const success = await hotelDetailsPage.selectFirstRoom(detailPage);
    console.log(`Destination "${dest}" room selection result: ${success}`);
    if (success) {
      console.log(`🎉 FOUND WORKING DESTINATION: "${dest}"! Checkout URL: ${detailPage.url()}`);
      await detailPage.close().catch(() => {});
      break;
    }
    await detailPage.close().catch(() => {});
  }

  await browser.close();
})();
