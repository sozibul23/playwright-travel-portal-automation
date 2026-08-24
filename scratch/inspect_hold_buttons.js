import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage.js';
import { oneWayFlightData, passengerData } from '../data/testData.js';
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

  console.log('Logged in. Waiting for search page components...');
  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 30000 });

  // Handle promo modals if any
  const openModals = page.locator('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open, div.modal');
  const count = await openModals.count();
  for (let i = 0; i < count; i++) {
    const modal = openModals.nth(i);
    if (await modal.isVisible()) {
      const closeBtn = modal.locator('button.btn-circle, button:has-text("✕"), button:has-text("Close")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click({ force: true }).catch(() => {});
      }
    }
  }

  const searchPage = new FlightSearchPage(page);
  await searchPage.selectOneWay();
  await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
  await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
  await searchPage.setDepartureDate(oneWayFlightData.departureDate);
  await searchPage.selectSupplier(oneWayFlightData.supplier);
  await searchPage.search();

  console.log('Flight search submitted. Waiting for results...');
  const resultsPage = new FlightResultsPage(page);
  const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
  const passengerPage = new PassengerDetailsPage(formPage);

  console.log('Filling passenger info...');
  await passengerPage.fillPassengerInfo(passengerData);
  await passengerPage.clickNext();
  await passengerPage.acceptTermsAndHoldFlight();

  console.log('Waiting for URL redirect to booking details...');
  await formPage.waitForURL(/booking-details/, { timeout: 60000 });
  await formPage.waitForTimeout(5000); // Wait for page to settle

  console.log('Landed on booking details page! Extracting page buttons...');
  const buttons = await formPage.locator('button, a.btn, a').allInnerTexts();
  console.log('--- ALL BUTTONS/LINKS ON BOOKING DETAILS PAGE (HOLD STATE) ---');
  console.log(buttons.map(b => b.trim()).filter(Boolean));

  await formPage.screenshot({ path: 'scratch/hold-details.png', fullPage: true });
  console.log('Screenshot saved to scratch/hold-details.png');

  await browser.close();
})().catch(console.error);
