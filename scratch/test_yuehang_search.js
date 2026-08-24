import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { supplierConfigs } from '../data/supplierTestData.js';

(async () => {
  const browser = await chromium.launch({ headless: true }); // run headless
  const page = await browser.newPage();

  console.log('Logging in...');
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('sadhin123', 'sadhin@innovatesolution.com');

  console.log('Testing Yuehang Search setup...');
  const searchPage = new FlightSearchPage(page);
  const yuehangConfig = supplierConfigs.yuehang;

  console.log('Selecting OneWay...');
  await searchPage.selectOneWay();

  console.log('Setting Origin:', yuehangConfig.oneWay.originCode);
  await searchPage.setOriginByText(yuehangConfig.oneWay.originCode, yuehangConfig.oneWay.originDisplay);

  console.log('Setting Destination:', yuehangConfig.oneWay.destinationCode);
  await searchPage.setDestinationByText(yuehangConfig.oneWay.destinationCode, yuehangConfig.oneWay.destinationDisplay);

  console.log('Setting Departure Date:', yuehangConfig.oneWay.departureDate);
  await searchPage.setDepartureDate(yuehangConfig.oneWay.departureDate);

  console.log('Selecting Supplier:', yuehangConfig.supplierName);
  await searchPage.selectSupplier(yuehangConfig.supplierName);

  console.log('Clicking Search...');
  await searchPage.search();

  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'scratch/yuehang_search_result.png', fullPage: true });
  console.log('Current URL after search:', page.url());

  await browser.close();
})();
