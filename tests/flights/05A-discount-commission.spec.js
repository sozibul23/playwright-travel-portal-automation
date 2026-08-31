import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightCommissionPage } from '../../pages/FlightCommissionPage.js';
import { 
  commissionConfig, 
  commissionTolerance, 
  pricingRoutes, 
  multiPaxSearchData,
  generateRandomFutureDate 
} from '../../data/testData.js';

/**
 * ✈️ Flight Commission & Discount Suite
 *
 * Dedicated test suite to verify B2B Agent Commission / Discount calculations
 * across multiple routes and passenger combinations (Single Pax & Multi-Pax).
 */

test.describe('Flight Commission & Discount Suite', () => {
  test.describe.configure({ timeout: 300000 });

  // Skip Firefox as requested
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox is skipped for Commission tests');
  });

  // ── 1. Single Adult Passenger Commission Verification ──────────────────────
  test('TC-010B: Commission & Discount (Single Adult) @supplier @regression', async ({ page }) => {
    test.setTimeout(240000);
    const searchPage = new FlightSearchPage(page);
    const commissionPage = new FlightCommissionPage(page);

    for (const route of pricingRoutes) {
      console.log(`\n🛫 [Single Pax] Commission & Discount: ${route.name} (${route.originCode.toUpperCase()} ➔ ${route.destinationCode.toUpperCase()})`);
      const departureDate = generateRandomFutureDate(25, 25);

      await searchPage.selectOneWay();
      await searchPage.setOriginByText(route.originCode, route.originDisplay);
      await searchPage.setDestinationByText(route.destinationCode, route.destinationDisplay);
      await searchPage.setDepartureDate(departureDate);
      await searchPage.selectSupplier(route.supplier);
      await searchPage.search();

      // 🛫 Directly on Flight Search Results Page
      await commissionPage.waitForResults();
      await commissionPage.openFareSummary();

      const paxRows = await commissionPage.extractAllPaxFareSummary();
      expect(paxRows.length, `Fare breakdown rows could not be extracted for route: ${route.name}`).toBeGreaterThan(0);

      const result = commissionPage.verifyDiscountForAllPax(paxRows, commissionConfig, { tolerance: commissionTolerance });
      console.log(`--- [Route: ${route.name} - Single Pax] ---`);
      commissionPage.printDiscountVerificationReport(result);

      expect(result.passed, `B2B Discount / Commission calculation mismatch detected on route: ${route.name}`).toBe(true);

      // Close open modal before next search
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(500);
    }
  });

  // ── 2. Multi-Pax (Adult + Child) Commission Verification ───────────────────
  test('TC-010E: Commission & Discount (Multi-Pax: Adult + Child) @supplier @regression', async ({ page }) => {
    test.setTimeout(240000);
    const searchPage = new FlightSearchPage(page);
    const commissionPage = new FlightCommissionPage(page);

    for (const route of pricingRoutes) {
      console.log(`\n👨‍👩‍👧 [Multi-Pax] Commission & Discount: ${route.name} (${route.originCode.toUpperCase()} ➔ ${route.destinationCode.toUpperCase()})`);
      const departureDate = generateRandomFutureDate(25, 25);

      await searchPage.selectOneWay();
      await searchPage.setOriginByText(route.originCode, route.originDisplay);
      await searchPage.setDestinationByText(route.destinationCode, route.destinationDisplay);
      await searchPage.setDepartureDate(departureDate);
      await searchPage.setPassengers(multiPaxSearchData);
      await searchPage.selectSupplier(route.supplier);
      await searchPage.search();

      // 🛫 Directly on Flight Search Results Page
      await commissionPage.waitForResults();
      await commissionPage.openFareSummary();

      const paxRows = await commissionPage.extractAllPaxFareSummary();
      expect(paxRows.length, `Multi-pax fare breakdown rows could not be extracted for route: ${route.name}`).toBeGreaterThan(0);

      const result = commissionPage.verifyDiscountForAllPax(paxRows, commissionConfig, { tolerance: commissionTolerance });
      console.log(`--- [Route: ${route.name} - Multi-Pax] ---`);
      commissionPage.printDiscountVerificationReport(result);

      expect(result.passed, `Multi-Pax B2B Discount calculation mismatch detected on route: ${route.name}`).toBe(true);

      // Close open modal before next search
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(500);
    }
  });
});
