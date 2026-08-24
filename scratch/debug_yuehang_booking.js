import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage.js';
import { generateRandomPassenger } from '../data/testData.js';

dotenv.config();

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.BASE_URL || 'https://b2b.innovatedemo.com';
  await page.goto(baseURL + '/login');

  const loginPage = new LoginPage(page);
  await loginPage.login(
    process.env.TEST_USERNAME || 'sadhin123',
    process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com'
  );

  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 30000 });

  const searchPage = new FlightSearchPage(page);
  await searchPage.selectOneWay();
  await searchPage.setOriginByText('cai', 'Cairo - Egypt');
  await searchPage.setDestinationByText('ruh', 'King Khalid International');

  const date = new Date();
  date.setDate(date.getDate() + 25);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateStr = `${months[date.getMonth()]} ${date.getDate()},`;
  await searchPage.setDepartureDate(dateStr);

  await searchPage.selectSupplier('yuehang test');
  await searchPage.search();

  const resultsPage = new FlightResultsPage(page);
  const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
  const passengerPage = new PassengerDetailsPage(formPage);

  const pax = generateRandomPassenger();
  console.log('Filling passenger info:', pax);
  await passengerPage.fillPassengerInfo(pax);
  await passengerPage.clickNext();

  console.log('Clicking accept terms and hold flight...');
  await passengerPage.acceptTermsAndHoldFlight();

  console.log('Waiting 5 seconds to observe post-click state...');
  await formPage.waitForTimeout(5000);

  console.log('Current URL after confirmation click:', formPage.url());
  const bodyText = await formPage.locator('body').innerText();
  console.log('\n--- BODY TEXT SNIPPET AFTER CLICK ---');
  console.log(bodyText.slice(0, 1000));
  console.log('------------------------------------');

  // Check modals or confirmation dialogs
  const modals = formPage.locator('.modal[open], [role="dialog"][open], dialog[open], .modal-box');
  console.log('Open modal count:', await modals.count());
  for (let i = 0; i < await modals.count(); i++) {
    console.log(`Modal #${i + 1} text:`, await modals.nth(i).innerText());
  }

  await browser.close();
}

run().catch(console.error);
