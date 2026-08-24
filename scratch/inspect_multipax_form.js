import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../pages/FlightResultsPage.js';
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

  await formPage.waitForTimeout(3000);
  console.log('=== MULTI-PAX PAGE INSPECTION ===');
  console.log('URL:', formPage.url());

  const headings = await formPage.locator('h1, h2, h3, h4, h5, h6, .accordion, button, tab').allInnerTexts();
  console.log('Headings & Tabs:', headings.map(h => h.trim()).filter(Boolean));

  const textboxes = await formPage.getByRole('textbox').all();
  console.log('Total textboxes found:', textboxes.length);

  for (let i = 0; i < textboxes.length; i++) {
    const isVis = await textboxes[i].isVisible();
    const name = await textboxes[i].getAttribute('name') || await textboxes[i].getAttribute('placeholder') || await textboxes[i].getAttribute('aria-label') || 'no-label';
    console.log(`Textbox #${i}: visible=${isVis}, name/placeholder=${name}`);
  }

  await formPage.screenshot({ path: 'scratch/multipax_form.png', fullPage: true });

  await browser.close();
})().catch(console.error);
