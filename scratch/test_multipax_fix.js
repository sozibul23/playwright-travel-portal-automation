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

  console.log('Searching flights for Multi-Pax...');
  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 30000 });

  const searchPage = new FlightSearchPage(page);
  await searchPage.selectOneWay();
  await searchPage.setOriginByText('DAC', 'Dhaka');
  await searchPage.setDestinationByText('CGP', 'Chittagong');
  
  const depDate = new Date();
  depDate.setDate(depDate.getDate() + 14);
  await searchPage.setDepartureDate(depDate.toISOString().split('T')[0]);
  await searchPage.setPassengers({ adults: 2, children: 1, infants: 1 });
  await searchPage.selectSupplier('yuehang test');
  await searchPage.search();

  console.log('Flight search submitted. Selecting flight...');
  const resultsPage = new FlightResultsPage(page);
  const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
  const passengerPage = new PassengerDetailsPage(formPage);

  console.log('Filling details for 4 travelers...');
  for (let i = 0; i < 4; i++) {
    console.log(`--- FILLING TRAVELER ${i + 1} ---`);
    const travelerTab = formPage.locator('button, tab, .accordion, div, h4, h5')
      .filter({ hasText: new RegExp(`Traveler ${i + 1}`, 'i') })
      .first();

    if (i > 0 && await travelerTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`Clicking tab for Traveler ${i + 1}...`);
      await travelerTab.click({ force: true });
      await formPage.waitForTimeout(500);
    }

    const pax = generateRandomPassenger();
    const firstNameField = formPage.getByRole('textbox', { name: /First|Given Name/i }).filter({ visible: true }).first();
    await firstNameField.waitFor({ state: 'visible', timeout: 15000 });
    await firstNameField.fill(pax.firstName);

    const lastNameField = formPage.getByRole('textbox', { name: /Surname|Family|Last Name/i }).filter({ visible: true }).first();
    if (await lastNameField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lastNameField.fill(pax.lastName);
    }

    if (pax.passportNumber) {
      const passportField = formPage.getByRole('textbox', { name: /Passport Number/i }).filter({ visible: true }).first();
      if (await passportField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passportField.clear();
        await passportField.fill(pax.passportNumber);
      }
    }

    if (pax.mobile) {
      const mobileField = formPage.locator('input[placeholder="Enter Mobile Number"]').filter({ visible: true }).first();
      if (await mobileField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mobileField.focus();
        await formPage.keyboard.press('Control+a');
        await formPage.keyboard.press('Backspace');
        await mobileField.pressSequentially(pax.mobile, { delay: 30 });
      }
    }

    if (pax.email) {
      const emailField = formPage.locator('input[placeholder="example@mail.com"]').filter({ visible: true }).first();
      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailField.clear();
        await emailField.fill(pax.email);
      }
    }

    console.log(`Traveler ${i + 1} filled successfully.`);
    const nextBtn = formPage.getByRole('button', { name: 'Next', exact: true }).filter({ visible: true }).first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`Clicking Next after Traveler ${i + 1}...`);
      await nextBtn.click({ force: true });
      await formPage.waitForTimeout(500);
    }
  }

  console.log('Navigating through remaining wizard steps to terms checkbox...');
  await passengerPage.clickNext();
  await passengerPage.acceptTermsAndHoldFlight();

  console.log('Final URL:', formPage.url());
  const toast = formPage.locator('body').filter({ hasText: /BOOKING ID|Booking ID|booking id|successfully created/i }).first();
  console.log('Toast visible:', await toast.isVisible({ timeout: 15000 }).catch(() => false));

  await browser.close();
})().catch(console.error);
