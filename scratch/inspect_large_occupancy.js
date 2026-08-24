import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { HotelSearchPage } from '../pages/HotelSearchPage.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL || 'https://b2b.innovatedemo.com'
  });
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env.TEST_USERNAME || 'sadhin123',
    process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com'
  );

  console.log('Testing Hotel Search for 4 Rooms / 9 Adults / 4 Children...');
  await page.waitForTimeout(2000);

  const hotelSearchPage = new HotelSearchPage(page);
  await hotelSearchPage.goToHotelTab();
  await hotelSearchPage.selectDestination('dhaka', null, 0);
  await hotelSearchPage.selectDates();
  await hotelSearchPage.selectGuestsAndRooms(4, 9, 4);
  await hotelSearchPage.selectSupplier('All');
  await hotelSearchPage.clickSearch();

  console.log('Search clicked. Checking results URL:', page.url());
  await page.waitForTimeout(5000);

  const noHotelsMsg = page.locator('body').filter({ hasText: /No hotels found|No results|adjusting your filters|0 Out Of 0/i }).first();
  const isNoResults = await noHotelsMsg.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('Is "No hotels found" visible for 4 Rooms / 9 Adults?:', isNoResults);

  const cardsCount = await page.locator('div[class*="card"], div[class*="hotel"]').count();
  console.log('Total result card elements found:', cardsCount);

  const pageText = await page.innerText('body');
  console.log('--- PAGE TEXT SNIPPET ---');
  console.log(pageText.slice(0, 1000));

  await browser.close();
})().catch(console.error);
