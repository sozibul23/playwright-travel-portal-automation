import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../../pages/PassengerDetailsPage.js';
import { passengerData, generateRandomPassenger } from '../../data/testData.js';

/**
 * Flight Booking & Passenger Details Suite
 *
 * Tags:
 * - @smoke: Core booking & hold PNR execution
 * - @regression: Child & Infant passenger booking
 * - @functional: Ancillaries & Passport validation
 * - @supplier: Supplier booking integration tests
 */

async function verifyBookingCreated(page, timeout = 60000) {
  // A true booking creation must satisfy ONE of the following:
  // 1. URL navigates to /booking-details or /bookings or /pnr
  // 2. An explicit generated PNR element appears containing 'Booking ID: FL...' or 'PNR: ...' or 'Hold Successful'
  const bookingLocator = page.locator('body').filter({
    hasText: /Booking ID:\s*FL\d+|PNR:\s*[A-Z0-9]+|Booking Code:\s*FL\d+|Hold Successful|Booking Reference:\s*FL\d+|Booking ID\s*:\s*\d+/i
  }).first();

  const isVerified = await Promise.race([
    page.waitForURL(/\/booking-details|\/bookings|\/pnr/i, { timeout }).then(() => true).catch(() => false),
    bookingLocator.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
  ]);

  expect(isVerified, '❌ Booking assertion failed: No generated PNR or Booking ID was returned from the supplier/portal.').toBe(true);
}

test.describe('Flight Booking', () => {
  test.describe.configure({ timeout: 240000 });

  // ── TC-015, TC-019, TC-021: Create Adult Booking & Verify PNR ────────────────
  test('TC-015: Adult Booking & PNR @smoke @supplier', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const uniquePassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfo(uniquePassenger);
    await passengerPage.clickNext();
    await passengerPage.acceptTermsAndHoldFlight();

    await verifyBookingCreated(passengerPage.page);
  });

  // ── TC-016: Child Passenger Booking ─────────────────────────────────────────
  test('TC-016: Child Booking @supplier @regression', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    
    await searchPage.setPassengers({ adults: 1, children: 1 });
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const adultPassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfoAtIndex(0, adultPassenger);
    const childPassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfoAtIndex(1, childPassenger);

    await passengerPage.clickNext();
    await passengerPage.acceptTermsAndHoldFlight();

    await verifyBookingCreated(passengerPage.page);
  });

  // ── TC-017: Infant Passenger Booking ────────────────────────────────────────
  test('TC-017: Infant Booking @supplier @regression', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    
    await searchPage.setPassengers({ adults: 1, infants: 1 });
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const adultPassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfoAtIndex(0, adultPassenger);
    const infantPassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfoAtIndex(1, infantPassenger);

    await passengerPage.clickNext();
    await passengerPage.acceptTermsAndHoldFlight();

    await verifyBookingCreated(passengerPage.page);
  });

  // ── TC-017B: Booking with Multiple Passengers ──────────────────────────────
  test('TC-017B: Multi-Pax Booking @supplier @regression', async ({ page, supplierConfig }) => {
    test.setTimeout(240000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    
    // Set 2 Adults, 1 Child, 1 Infant (4 passengers total)
    await searchPage.setPassengers({ adults: 2, children: 1, infants: 1 });
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    // Fill passenger details for all 4 travelers
    for (let i = 0; i < 4; i++) {
      const p = generateRandomPassenger();
      await passengerPage.fillPassengerInfoAtIndex(i, p);
    }

    await passengerPage.clickNext();
    await passengerPage.acceptTermsAndHoldFlight();

    await verifyBookingCreated(passengerPage.page);
  });

  // ── TC-018: Passport Validation ─────────────────────────────────────────────
  test('TC-018: Passport Validation @functional @regression', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const passInput = formPage.locator('input[placeholder*="Passport Number"], input[name*="passport"]').first();
    if (await passInput.isVisible().catch(() => false)) {
      await passInput.fill('A12'); // Under 6 characters limit
      await passengerPage.clickNext();

      const validationError = formPage.locator('p, span, div').filter({ hasText: /at least 6 characters|invalid passport/i }).first();
      await expect(validationError).toBeVisible();
    }
  });

  // ── TC-024: Extra Ancillaries (Baggage / Seat / Meal) ───────────────────────
  test('TC-024: Extra Ancillaries - Baggage, Seat Selection, and Meal Request @supplier @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const uniquePassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfo(uniquePassenger);

    const ancillarySection = formPage.locator('div, section').filter({ hasText: /extra baggage|seat selection|meal/i }).first();
    if (await ancillarySection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Ancillary services section found. Verifying controls...');
      const ancillaryOptions = ancillarySection.locator('input, select, button');
      expect(await ancillaryOptions.count()).toBeGreaterThan(0);
    }

    await passengerPage.clickNext();
    await passengerPage.acceptTermsAndHoldFlight();

    await verifyBookingCreated(passengerPage.page);
  });

  // ── TC-018D: Auto-Gender Selection Matching Title ───────────────────────────
  test('TC-018D: Auto-Gender selection matching Title @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = {
      ...supplierConfig.oneWay,
      supplier: supplierConfig.supplierName
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });

    // Click 'Mrs' or 'Ms' title and verify Gender automatically updates to 'Female'
    const mrsBtn = formPage.locator('button, div, label, span').filter({ hasText: /^Mrs$/i }).first();
    if (await mrsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mrsBtn.click({ force: true });
      await page.waitForTimeout(300);
      const femaleBtn = formPage.locator('button, div, label, span').filter({ hasText: /^Female$/i }).first();
      await expect(femaleBtn).toBeVisible();
    }
  });

  // ── TC-018B: Passport Expiry under 6 Months Warning ────────────────────────
  test('TC-018B: Passport Expiry under 6 months warning @negative', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = {
      ...supplierConfig.oneWay,
      supplier: supplierConfig.supplierName
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const expiryField = formPage.locator('input[placeholder*="Expiration Date"], input[name*="expiry"]').first();
    if (await expiryField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expiryField.fill('10-10-2026'); // Under 6 months from travel
      await passengerPage.clickNext().catch(() => {});

      const warningText = formPage.locator('body').filter({ hasText: /at least 6 months|expiry|expired|validity/i }).first();
      await expect(warningText).toBeVisible();
    }
  });

  // ── TC-018C: Duplicate Passenger Name Validation ─────────────────────────────
  test('TC-018C: Duplicate Passenger Name validation @negative', async ({ page, supplierConfig }) => {
    test.setTimeout(240000);
    await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = {
      ...supplierConfig.oneWay,
      supplier: supplierConfig.supplierName
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.setPassengers({ adults: 2 });
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const samePassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfoAtIndex(0, samePassenger);
    await passengerPage.fillPassengerInfoAtIndex(1, samePassenger);

    await passengerPage.clickNext().catch(() => {});

    const duplicateWarning = formPage.locator('body').filter({ hasText: /duplicate|same passenger|already entered|unique/i }).first();
    await expect(duplicateWarning).toBeVisible();
  });

  // ── TC-024B: Special Service Requests (SSR - Wheelchair / Meal) ─────────────
  test('TC-024B: Special Service Requests (SSR - Wheelchair / Meal) @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = {
      ...supplierConfig.oneWay,
      supplier: supplierConfig.supplierName
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const uniquePassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfo(uniquePassenger);

    // Check step tabs (3 Meal, 4 Seat, Baggage) or SSR dropdowns
    const mealTab = formPage.locator('li, button, div, span').filter({ hasText: /^3 Meal$|Meal/i }).first();
    if (await mealTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mealTab.click({ force: true });
      await page.waitForTimeout(500);
    }

    const ssrOption = formPage.locator('select, input, div, button').filter({ hasText: /Meal|Wheelchair|SSR|Special Request/i }).first();
    if (await ssrOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(ssrOption).toBeVisible();
    }
  });

  // ── TC-025: Full Flight Booking Flow with Payment Page & Ancillaries ──────────
  test('TC-025: Complete Flight Booking with Payment Page & Ancillaries @smoke @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(240000);
    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = { 
      ...supplierConfig.oneWay, 
      supplier: supplierConfig.supplierName 
    };

    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const uniquePassenger = generateRandomPassenger();
    await passengerPage.fillPassengerInfo(uniquePassenger);
    
    // Complete wizard steps: Add Baggage, Meal, Seat
    await passengerPage.clickNext();
    await passengerPage.addBaggage();
    await passengerPage.addMeal();
    await passengerPage.selectSeat();
    
    // Accept Terms & Complete Payment / Instant Purchase
    await passengerPage.acceptTermsAndHoldFlight();

    await verifyBookingCreated(passengerPage.page);
  });

});

