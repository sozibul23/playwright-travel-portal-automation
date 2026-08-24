import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage.js';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';

dotenv.config();

async function run() {
  const browser = await chromium.launch({ headless: true });
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

  // Dismiss modals
  const openModals = page.locator('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open, div.modal');
  for (let i = 0; i < await openModals.count(); i++) {
    const modal = openModals.nth(i);
    const closeBtn = modal.locator('button.btn-circle, button:has-text("✕"), button:has-text("Close")').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => {});
    }
  }

  const searchPage = new FlightSearchPage(page);
  await searchPage.selectOneWay();
  await searchPage.setOriginByText('cai', 'Cairo - Egypt');
  await searchPage.setDestinationByText('ruh', 'King Khalid International');
  
  // Set date 25 days ahead
  const daysAhead = 25;
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateStr = `${months[date.getMonth()]} ${date.getDate()},`;

  await searchPage.setDepartureDate(dateStr);
  await searchPage.selectSupplier('yuehang test');
  await searchPage.search();

  await page.getByRole('button', { name: /Select Flight|View Fare/i }).first().waitFor({ state: 'visible', timeout: 90000 });
  console.log('Search results loaded!');

  const cardButtons = page.getByRole('button', { name: /Select Flight|View Fare/i });
  const count = await cardButtons.count();
  console.log(`Found ${count} flight card buttons`);

  for (let i = 0; i < Math.min(count, 5); i++) {
    console.log(`\n=================== CARD #${i + 1} ===================`);
    const btn = cardButtons.nth(i);
    
    // Find parent container
    const card = btn.locator('xpath=ancestor::div[.//button[contains(., "View Fare")] or .//button[contains(., "Select Flight")]][last()]');
    const cardText = await card.innerText().catch(() => '');
    console.log('Card text snippet:\n', cardText.slice(0, 350));

    // Try hovering Flight Itinerary
    const itineraryBtn = card.locator('span, button, a').filter({ hasText: /^Flight Itinerary$/i }).or(card.locator('span, button, a').filter({ hasText: /Flight Itinerary/i })).first();
    const hasItinerary = await itineraryBtn.isVisible().catch(() => false);
    console.log('Has Flight Itinerary button:', hasItinerary);

    if (hasItinerary) {
      await itineraryBtn.hover({ force: true }).catch(() => {});
      await itineraryBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);

      // Find all popovers / tooltips in DOM
      const popovers = page.locator('div').filter({ hasText: /Layover/i });
      const popCount = await popovers.count();
      console.log(`Found ${popCount} elements matching 'Layover':`);

      for (let p = 0; p < popCount; p++) {
        const pop = popovers.nth(p);
        if (await pop.isVisible().catch(() => false)) {
          const popText = await pop.innerText().catch(() => '');
          console.log(`\n--- Popover #${p + 1} ---`);
          console.log(popText);

          // Extract HTML snippet to understand structure
          const popHTML = await pop.evaluate(el => el.outerHTML).catch(() => '');
          console.log('Popover HTML snippet:\n', popHTML.slice(0, 500));
          break;
        }
      }
    }
  }

  await browser.close();
}

run().catch(console.error);
