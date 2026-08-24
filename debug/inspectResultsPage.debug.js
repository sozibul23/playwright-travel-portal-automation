import { test, expect } from '@playwright/test';
import { FlightSearchPage } from '../pages/FlightSearchPage.js';
import { oneWayFlightData } from '../data/testData.js';

test.setTimeout(180000);

test('DEBUG: inspect flight results buttons', async ({ page }) => {

  await test.step('Step 1: Login', async () => {
    const { LoginPage } = await import('../pages/LoginPage.js');
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USERNAME || 'sadhin123',
      process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com'
    );
    console.log('✅ Step 1: Logged in');
  });

  await test.step('Step 2: Search', async () => {
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const searchPage = new FlightSearchPage(page);
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();
    console.log('✅ Step 2: Search done');
  });

  await test.step('Step 3: Print all buttons on results page', async () => {
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/debug-01-results.png' });
    const filtered = (await page.getByRole('button').allTextContents())
      .map(b => b.trim()).filter(b => b.length > 0);
    console.log('\n🔘 ALL BUTTONS:');
    filtered.forEach((b, i) => console.log(`  [${i}] "${b}"`));
  });

  await test.step('Step 4: Click SQ fare button', async () => {
    // Find the flight card container for SQ or Singapore Airlines
    const sqCard = page.locator('div').filter({ hasText: /Singapore Airlines|SQ \d+/ }).first();
    const fareBtn = sqCard.getByRole('button', { name: 'View Fare' }).first();
    console.log(`\n🎯 Clicking: "View Fare" on SQ flight`);
    await fareBtn.click();
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'test-results/debug-02-after-click.png', fullPage: true });
    const innerText = await page.locator('main').innerText().catch(() => 'NOT FOUND');
    console.log('\n🔘 INNER TEXT on results page after click:\n', innerText.substring(0, 2000));
  });

});