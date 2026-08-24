import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage.js';
import { generateRandomPassenger } from '../data/testData.js';
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

  console.log('Logged in. Searching flights with YueHang...');
  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 30000 });

  const searchPage = new FlightSearchPage(page);
  await searchPage.selectOneWay();
  await searchPage.setOriginByText('DAC', 'Dhaka');
  await searchPage.setDestinationByText('CGP', 'Chittagong');
  
  const depDate = new Date();
  depDate.setDate(depDate.getDate() + 14);
  await searchPage.setDepartureDate(depDate.toISOString().split('T')[0]);
  await searchPage.selectSupplier('yuehang test');
  await searchPage.search();

  console.log('Flight search submitted. Selecting flight...');
  const resultsPage = new FlightResultsPage(page);
  const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
  const passengerPage = new PassengerDetailsPage(formPage);

  console.log('Filling passenger info & holding flight strictly...');
  const pax = generateRandomPassenger();
  await passengerPage.fillPassengerInfo(pax);
  await passengerPage.clickNext();
  await passengerPage.acceptTermsAndHoldFlightOnlyStrict();

  console.log('Waiting on booking details page...');
  await formPage.waitForTimeout(5000);

  const pageText = await formPage.innerText('body');
  console.log('=== BOOKING DETAILS PAGE CONTENT (HOLD STATE) ===');
  console.log(pageText);

  const interactiveElements = await formPage.locator('button, a, .btn, [role="button"], span, div').allInnerTexts();
  console.log('=== ALL TEXT ELEMENTS CONTAINING TIME / HOLD / EXPIRE / TIMER / VOID / REISSUE ===');
  const relevantTexts = interactiveElements
    .map(t => t.replace(/\s+/g, ' ').trim())
    .filter(t => /hold|expire|time|date|timer|cancel|issue|void|reissue|change|status|pnr/i.test(t));
  console.log([...new Set(relevantTexts)]);

  await formPage.screenshot({ path: 'scratch/task7_hold_booking_details.png', fullPage: true });

  await browser.close();
})().catch(console.error);
