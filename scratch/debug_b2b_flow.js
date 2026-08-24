import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../pages/PassengerDetailsPage.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('1. Logging in to B2B...');
  await page.goto('https://b2b.innovatedemo.com/login');
  const loginPage = new LoginPage(page);
  await loginPage.login(process.env.TEST_USERNAME_1 || 'sadhin123', process.env.TEST_PASSWORD_1 || 'Innovate@2026');
  await page.waitForTimeout(3000);

  console.log('2. On B2B Home Page URL:', page.url());
  const searchPage = new FlightSearchPage(page);

  console.log('3. Selecting One Way...');
  await searchPage.selectOneWay();
  await page.waitForTimeout(1000);

  console.log('4. Setting Origin...');
  await searchPage.setOriginByText('dac', 'Dhaka');
  await page.waitForTimeout(1000);

  console.log('5. Setting Destination...');
  await searchPage.setDestinationByText('cxb', 'Cox');
  await page.waitForTimeout(1000);

  console.log('6. Setting Date...');
  await searchPage.setDepartureDate('September 18, 2026');
  await page.waitForTimeout(1000);

  console.log('7. Selecting Supplier Atlas...');
  await searchPage.selectSupplier('Atlas SandBox - TripGic');
  await page.waitForTimeout(1000);

  console.log('8. Clicking Search button...');
  await searchPage.search();
  await page.waitForTimeout(5000);

  console.log('9. Search complete. Current URL:', page.url());

  const resultsPage = new FlightResultsPage(page);
  console.log('10. Selecting flight and booking...');
  const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });

  console.log('11. Form Page URL:', formPage.url());
  const passengerPage = new PassengerDetailsPage(formPage);

  const price = await passengerPage.getTotalPayable();
  console.log('12. Initial Price:', price);

  console.log('13. Applying AUG27...');
  await passengerPage.applyCoupon('AUG27');
  await formPage.waitForTimeout(3000);

  const finalPrice = await passengerPage.getTotalPayable();
  console.log('14. Final Price:', finalPrice);

  await browser.close();
})();
