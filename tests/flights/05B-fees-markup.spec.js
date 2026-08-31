import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightCommissionPage } from '../../pages/FlightCommissionPage.js';
import { 
  feesConfig, 
  feesTolerance, 
  pricingRoutes, 
  multiPaxScenarios,
  generateRandomFutureDate 
} from '../../data/testData.js';

/**
 * 🏷️ Flight Fees & FMG Markup Suite
 *
 * Verifies B2B Fees / FMG Markup calculations across multiple routes
 * and different passenger combinations (Single Adult, Multi-Adult, Adult+Child, Adult+Infant, All-Pax).
 */

test.describe('Flight Fees & Markup Suite', () => {
  test.describe.configure({ timeout: 300000 });

  // Skip Firefox as requested
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox is skipped for Fees tests');
  });

  // ── Dynamic Test Execution for Each Pax Combination ────────────────────────
  for (const scenario of multiPaxScenarios) {
    test(`${scenario.id}: Fees & FMG Markup (${scenario.name}) @supplier @regression`, async ({ page }) => {
      test.setTimeout(240000);
      const searchPage = new FlightSearchPage(page);
      const commissionPage = new FlightCommissionPage(page);

      for (const route of pricingRoutes) {
        console.log(`\n🛫 [${scenario.name}] Fees & Markup: ${route.name} (${route.originCode.toUpperCase()} ➔ ${route.destinationCode.toUpperCase()})`);
        const departureDate = generateRandomFutureDate(25, 25);

        // 1. Search Flight with specific Pax combination
        await searchPage.selectOneWay();
        await searchPage.setOriginByText(route.originCode, route.originDisplay);
        await searchPage.setDestinationByText(route.destinationCode, route.destinationDisplay);
        await searchPage.setDepartureDate(departureDate);
        await searchPage.setPassengers(scenario.passengers);
        await searchPage.selectSupplier(route.supplier);
        await searchPage.search();

        // 2. Open Fare Breakdown / Summary
        await commissionPage.waitForResults();
        await commissionPage.openFareSummary();

        // 3. Extract all Pax Breakdown Rows
        const paxRows = await commissionPage.extractAllPaxFareSummary();
        expect(paxRows.length, `Fare breakdown rows could not be extracted for ${scenario.name} on route: ${route.name}`).toBeGreaterThan(0);

        // 4. Verify Fees / FMG Markup for each Pax Type
        const result = commissionPage.verifyFeesForAllPax(paxRows, feesConfig, { tolerance: feesTolerance });
        console.log(`--- [Route: ${route.name} - ${scenario.name}] ---`);
        commissionPage.printFeesVerificationReport(result);

        // 5. Assert result
        expect(result.passed, `Fees calculation mismatch detected for ${scenario.name} on route: ${route.name}`).toBe(true);

        // Close modal before next iteration
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(500);
      }
    });
  }
});

