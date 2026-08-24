import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage.js';
import { generateRandomPassenger } from '../data/testData.js';

dotenv.config();

async function testRealBooking() {
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
  console.log('Filling passenger info:', pax.firstName, pax.lastName);
  await passengerPage.fillPassengerInfo(pax);
  await passengerPage.clickNext();

  console.log('Accepting terms...');
  await passengerPage.termsCheckbox.waitFor({ state: 'visible', timeout: 30000 });
  await passengerPage.termsCheckbox.check();
  await passengerPage.agreeCheckbox.check();

  const confirmBtn = formPage
    .locator('button')
    .filter({ hasText: /Instant Purchase|Hold Flight|Hold|Confirm|Book Flight|Pay|Issue/i })
    .filter({ visible: true })
    .first();

  console.log('Confirm button text:', await confirmBtn.innerText());
  await confirmBtn.click({ force: true });
  await formPage.waitForTimeout(2000);

  // Check if a modal popped up
  const modalButtons = formPage.locator('.modal-box button, .modal button, dialog button, div[class*="modal"] button').filter({ visible: true });
  console.log('Modal visible buttons count:', await modalButtons.count());
  for (let i = 0; i < await modalButtons.count(); i++) {
    console.log(`Modal button #${i + 1}:`, await modalButtons.nth(i).innerText());
  }

  // Click modal button if any
  const modalConfirmBtn = formPage.locator('.modal-box button, .modal button, dialog button').filter({ hasText: /Confirm|Yes|OK|Proceed|Pay|Hold/i }).first();
  if (await modalConfirmBtn.isVisible().catch(() => false)) {
    console.log('Clicking modal confirm button:', await modalConfirmBtn.innerText());
    await modalConfirmBtn.click({ force: true });
  }

  console.log('Waiting 10 seconds to observe final URL and page text...');
  await formPage.waitForTimeout(10000);

  console.log('Final URL:', formPage.url());
  const bodyText = await formPage.locator('body').innerText();
  console.log('\n--- FINAL BODY TEXT SNIPPET ---');
  console.log(bodyText.slice(0, 1500));
  console.log('------------------------------');

  await browser.close();
}

testRealBooking().catch(console.error);
