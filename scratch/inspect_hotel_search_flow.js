import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { HotelSearchPage } from '../pages/HotelSearchPage.js';
import { HotelDetailsPage } from '../pages/HotelDetailsPage.js';
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

  console.log('Logged in. Executing hotel search for Dhaka...');
  await page.waitForTimeout(2000);

  const hotelSearchPage = new HotelSearchPage(page);
  await hotelSearchPage.goToHotelTab();
  await hotelSearchPage.selectDestination('dhaka', null, 0);
  await hotelSearchPage.selectDates();
  await hotelSearchPage.selectGuestsAndRooms(1, 1, 0);
  await hotelSearchPage.selectSupplier('All');
  await hotelSearchPage.clickSearch();

  console.log('Hotel search submitted. Waiting for search results page...');
  await page.waitForTimeout(5000);
  console.log('Search page URL:', page.url());

  // Wait for hotel result cards
  const resultCards = page.locator('div[class*="card"], div[class*="hotel"], div[class*="result"]').filter({ hasText: /View|Choose|Details|BDT|\$/i });
  console.log('Result cards count:', await resultCards.count());

  const viewBtn = page.getByRole('link', { name: /View All Rooms|View Rooms|View Details|See Details|Choose/i })
    .or(page.locator('a:has-text("View All Rooms"), a:has-text("View Rooms"), button:has-text("View Rooms"), a:has-text("View Details")'))
    .filter({ visible: true })
    .first();

  await viewBtn.waitFor({ state: 'visible', timeout: 60000 });
  console.log('View button text:', await viewBtn.innerText());

  const popupPromise = page.waitForEvent('popup');
  await viewBtn.click({ force: true });
  const detailPage = await popupPromise;

  console.log('Opened detail page popup tab. URL:', detailPage.url());
  await detailPage.waitForTimeout(3000);

  console.log('Taking screenshot of details page initial state...');
  await detailPage.screenshot({ path: 'scratch/hotel_details_initial.png', fullPage: true });

  console.log('Waiting for load states & checking room list elements...');
  await detailPage.waitForLoadState('networkidle').catch(() => {});
  await detailPage.waitForTimeout(5000);

  console.log('Taking screenshot after networkidle...');
  await detailPage.screenshot({ path: 'scratch/hotel_details_loaded.png', fullPage: true });

  const buttons = await detailPage.locator('button, a, .btn, [role="button"]').allInnerTexts();
  console.log('All buttons/links on hotel details page:', buttons.map(b => b.replace(/\s+/g, ' ').trim()).filter(Boolean));

  const pageText = await detailPage.innerText('body');
  console.log('--- DETAILS PAGE BODY TEXT (SNIPPET) ---');
  console.log(pageText.slice(0, 1500));

  await browser.close();
})().catch(console.error);
