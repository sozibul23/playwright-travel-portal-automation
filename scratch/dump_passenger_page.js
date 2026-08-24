import { chromium } from '@playwright/test';
import * as fs from 'fs';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../pages/FlightResultsPage.js';

async function main() {
  const storageStatePath = 'storageState.json';
  if (!fs.existsSync(storageStatePath)) {
    throw new Error('User login state (storageState.json) not found! Run the login test first or run npm run test:supplier');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ 
    storageState: storageStatePath,
    baseURL: 'https://b2b.innovatedemo.com' 
  });
  const page = await context.newPage();

  console.log('Navigating to dashboard...');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Dismiss modals
  console.log('Dismissing modals...');
  for (let i = 0; i < 5; i++) {
    const modalCloseBtn = page.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle').first();
    if (await modalCloseBtn.isVisible().catch(() => false)) {
      await modalCloseBtn.click({ force: true });
      console.log('Closed a modal');
    }
    await page.waitForTimeout(500);
  }

  // Search flight
  console.log('Searching flight...');
  const searchPage = new FlightSearchPage(page);
  await searchPage.selectOneWay();
  await searchPage.setOriginByText('DAC', 'Dhaka - Bangladesh');
  await searchPage.setDestinationByText('DEL', 'New Delhi - India');
  await searchPage.selectSupplier('TravelRobotFlight-Sandbox');
  await searchPage.search();

  console.log('Search clicked, waiting for results...');
  const resultsPage = new FlightResultsPage(page);
  
  // Wait for results
  await resultsPage.waitForResults();

  console.log('Results loaded. Clicking select and book...');
  const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });

  console.log('Passenger Details page loaded! Dumping input fields...');
  const inputs = await formPage.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select')).map(el => {
      let labelText = '';
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) labelText = lbl.textContent || '';
      }
      if (!labelText) {
        labelText = el.closest('div')?.innerText?.split('\n')?.[0] || '';
      }
      return {
        tagName: el.tagName,
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        ariaLabel: el.getAttribute('aria-label'),
        labelText: labelText.trim(),
        outerHTML: el.outerHTML
      };
    });
  });

  console.log('--- DUMP START ---');
  console.log(JSON.stringify(inputs, null, 2));
  console.log('--- DUMP END ---');

  await browser.close();
}

main().catch(console.error);
