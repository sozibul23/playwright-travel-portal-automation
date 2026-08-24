import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto(process.env.BASE_URL + '/login');

  console.log('Logging in...');
  await page.locator('input[placeholder="Username"]').fill(process.env.TEST_USERNAME || 'sadhin123');
  await page.locator('input[placeholder="Password"]').fill(process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com');
  await page.locator('button:has-text("Log In")').click();

  console.log('Waiting for search page...');
  await page.getByRole('button', { name: 'Search' }).waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Close initial modals
  const closeButtons = page.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle');
  const count = await closeButtons.count();
  for (let i = 0; i < count; i++) {
    const btn = closeButtons.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
    }
  }

  // Click One Way
  await page.locator('li').filter({ hasText: /^One Way$/ }).first().click();

  // Set Origin
  const originInput = page.locator('label:has-text("Leaving From") + input');
  await originInput.click();
  await page.getByPlaceholder('Airport code, city, name or country').first().fill('dac');
  await page.waitForTimeout(1000);
  await page.getByRole('option').filter({ hasText: 'Dhaka' }).first().click();

  // Set Destination
  const destInput = page.locator('label:has-text("Going To") + input');
  await destInput.click();
  await page.getByPlaceholder('Airport code, city, name or country').first().fill('del');
  await page.waitForTimeout(1000);
  await page.getByRole('option').filter({ hasText: 'New Delhi - India' }).first().click();

  // Set Date (July 15, 2026)
  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().click();
  await page.getByLabel('July 15,').first().click();

  // Select Supplier
  const combobox = page.getByRole('combobox', { name: 'Select Supplier' });
  await combobox.click();
  await page.getByPlaceholder('Search...').fill('TravelRobotFlight-Sandbox');
  await page.getByRole('option', { name: 'TravelRobotFlight-Sandbox', exact: true }).click();
  await page.waitForTimeout(500);

  // Click Search
  console.log('Searching flights...');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL(/flight\/search/, { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // Select and Book first flight
  console.log('Selecting and booking flight...');
  const selectBtn = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
  await selectBtn.waitFor({ state: 'visible', timeout: 30000 });
  
  const selectBtnText = await selectBtn.textContent();
  if (selectBtnText.includes('View Fare')) {
    await selectBtn.click();
    await page.waitForTimeout(2000);
  }
  
  // Wait and listen for popup page
  const popupPromise = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => null);
  
  const bookNowBtn = page.getByRole('button', { name: /^Book Now$/i }).first();
  await bookNowBtn.click({ force: true });
  
  const modalBookNow = page.locator('.modal').getByRole('button', { name: 'Book Now' });
  const isModalVisible = await modalBookNow.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
  if (isModalVisible) {
    await modalBookNow.click({ force: true });
  }
  
  const formPage = await popupPromise;
  if (!formPage) {
    throw new Error('Failed to open booking form popup page');
  }
  await formPage.waitForLoadState();
  
  // Helper function to dismiss modals
  async function dismissModals(p) {
    await p.keyboard.press('Escape').catch(() => {});
    await p.waitForTimeout(300);
    const closeButtons = p.locator('.modal-box .btn-circle, .modal .btn-circle, dialog .btn-circle, .modal-box button:has-text("✕"), .modal button:has-text("✕"), .modal-box label:has-text("✕"), .modal label:has-text("✕")');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = closeButtons.nth(i);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ force: true }).catch(() => {});
        await p.waitForTimeout(500);
      }
    }
  }

  await dismissModals(formPage);

  console.log('Filling passenger details...');
  // Fill passenger details
  await formPage.getByRole('textbox', { name: 'First/Given Name *' }).fill('SADHIN');
  await formPage.getByRole('textbox', { name: 'Surname/Family/Last Name *' }).fill('ISLAM');
  const passport = formPage.getByRole('textbox', { name: 'Passport Number *' });
  if (await passport.isVisible()) {
    await passport.fill('A346645345');
  }
  await formPage.locator('section, div').filter({ hasText: 'Adult Traveler' }).getByRole('textbox', { name: 'Enter Mobile Number' }).first().fill('7365445454');
  await formPage.locator('section, div').filter({ hasText: 'Adult Traveler' }).getByRole('textbox', { name: 'E-mail *' }).first().fill('sadhin@innovatesolution.com');
  
  await dismissModals(formPage);

  console.log('Clicking Next...');
  await formPage.getByRole('button', { name: 'Next' }).click();
  await formPage.waitForTimeout(1000);

  // Accept terms
  console.log('Accepting terms and holding flight...');
  await formPage.getByRole('checkbox', { name: /I have read and accept Terms/i }).check();
  await formPage.getByRole('checkbox', { name: /I agree and understand/i }).check();
  await formPage.getByRole('button', { name: 'Hold Flight' }).click();
  
  console.log('Waiting for booking confirmation URL...');
  await formPage.waitForURL(/booking-details/, { timeout: 60000 });
  console.log('Success! Landed on booking details page.');
  
  await formPage.waitForTimeout(5000); // let page render completely
  await formPage.screenshot({ path: 'test-results/booking-details-inspect.png', fullPage: true });
  console.log('Screenshot saved to test-results/booking-details-inspect.png');

  // Extract page information
  const html = await formPage.content();
  fs.writeFileSync('test-results/booking-details-dom.html', html);
  console.log('DOM HTML saved to test-results/booking-details-dom.html');

  // Find buttons & texts of interest
  const buttons = await formPage.locator('button, a.btn').allTextContents();
  console.log('Available buttons on page:', buttons.map(b => b.trim()).filter(Boolean));

  await browser.close();
}

run().catch(console.error);
