import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../../pages/PassengerDetailsPage.js';
import { FlightCommissionPage } from '../../pages/FlightCommissionPage.js';
import { 
  feesConfig, 
  feesTolerance, 
  pricingRoutes, 
  multiPaxScenarios,
  generateRandomPassenger,
  generateRandomFutureDate 
} from '../../data/testData.js';

/**
 * 🏷️ Flight Fees & FMG Markup Suite
 *
 * Verifies B2B Fees / FMG Markup calculations across multiple routes
 * and different passenger combinations (Single Adult, Multi-Adult, Adult+Child, Adult+Infant, All-Pax),
 * and performs end-to-end full booking completion with post-booking price verification.
 */

async function verifyBookingCreated(page, timeout = 60000) {
  const bookingLocator = page.locator('body').filter({
    hasText: /Booking ID:\s*FL\d+|PNR:\s*[A-Z0-9]+|Booking Code:\s*FL\d+|Hold Successful|Booking Reference:\s*FL\d+|Booking ID\s*:\s*\d+/i
  }).first();

  const isVerified = await Promise.race([
    page.waitForURL(/\/booking-details|\/bookings|\/pnr/i, { timeout }).then(() => true).catch(() => false),
    bookingLocator.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
  ]);

  expect(isVerified, '❌ Booking failed: No generated PNR or Booking ID was returned after holding the flight.').toBe(true);
}

test.describe('Flight Fees & Markup Suite', () => {
  test.describe.configure({ timeout: 360000 });

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

  // ── E2E Full Booking with Fees & Price Verification across Multiple Flights ─
  test('TC-010E: Complete Full Booking & Verify Price/Fees across Multiple Flights @supplier @regression @e2e', async ({ page }) => {
    test.setTimeout(300000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);
    const commissionPage = new FlightCommissionPage(page);

    const bookingPaxSetup = { adults: 1, children: 1, infants: 0 };
    const totalPaxCount = (bookingPaxSetup.adults || 0) + (bookingPaxSetup.children || 0) + (bookingPaxSetup.infants || 0);

    for (const route of pricingRoutes) {
      console.log(`\n🎟️ [E2E Booking & Fee Verification] Starting Full Booking for: ${route.name} (${route.originCode.toUpperCase()} ➔ ${route.destinationCode.toUpperCase()})`);
      const departureDate = generateRandomFutureDate(25, 25);

      // 1. Search Flight
      await searchPage.selectOneWay();
      await searchPage.setOriginByText(route.originCode, route.originDisplay);
      await searchPage.setDestinationByText(route.destinationCode, route.destinationDisplay);
      await searchPage.setDepartureDate(departureDate);
      await searchPage.setPassengers(bookingPaxSetup);
      await searchPage.selectSupplier(route.supplier);
      await searchPage.search();

      // 2. Pre-Booking: Check Fare Summary Fees
      await commissionPage.waitForResults();
      await commissionPage.openFareSummary();

      const preBookingPaxRows = await commissionPage.extractAllPaxFareSummary();
      expect(preBookingPaxRows.length, `Pre-booking fare breakdown rows missing on route: ${route.name}`).toBeGreaterThan(0);

      const preResult = commissionPage.verifyFeesForAllPax(preBookingPaxRows, feesConfig, { tolerance: feesTolerance });
      console.log(`--- [Pre-Booking Fare Check: ${route.name}] ---`);
      commissionPage.printFeesVerificationReport(preResult);
      expect(preResult.passed, `Pre-booking fees mismatch detected on route: ${route.name}`).toBe(true);

      // Close modal before proceeding to booking
      await commissionPage.closeFareSummary();
      await page.waitForTimeout(500);

      // 3. Select Flight & Navigate to Passenger Details Form
      const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
      const passengerPage = new PassengerDetailsPage(formPage);

      // 4. Fill Passenger Details for all travelers
      for (let i = 0; i < totalPaxCount; i++) {
        const uniquePax = generateRandomPassenger();
        await passengerPage.fillPassengerInfoAtIndex(i, uniquePax);
      }

      // 5. Proceed to Booking & Execute Instant Purchase
      await passengerPage.clickNext();
      await passengerPage.clickInstantPurchase();

      // 6. Assert Booking/Purchase Success (Fail test if purchase fails or PNR is missing)
      await verifyBookingCreated(passengerPage.page);
      console.log(`✅ Instant Purchase successfully completed with generated PNR on route: ${route.name}`);

      // 7. Post-Booking: Verify Final Price & Fees on Booking Details Page
      const bookingCommissionPage = new FlightCommissionPage(passengerPage.page);
      const postBookingRows = await bookingCommissionPage.extractAllPaxFareSummary();

      if (postBookingRows.length > 0) {
        const postResult = bookingCommissionPage.verifyFeesForAllPax(postBookingRows, feesConfig, { tolerance: feesTolerance });
        console.log(`--- [Post-Booking Confirmation Fee Check: ${route.name}] ---`);
        bookingCommissionPage.printFeesVerificationReport(postResult);
        expect(postResult.passed, `Post-booking confirmation fees mismatch detected on route: ${route.name}`).toBe(true);
      } else {
        console.log('ℹ️ Booking details page loaded without nested breakdown table, PNR hold verified.');
      }
    }
  });
});


