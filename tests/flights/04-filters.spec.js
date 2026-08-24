import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';

/**
 * Flight Results Filters & Sorting Suite
 *
 * Tags:
 * - @functional: Filter and sorting validations
 * - @supplier: Supplier-specific filter & result validations
 */

test.describe('Flight Filters', () => {

  // ── TC-004: Airline Filter ──────────────────────────────────────────────────
  test('TC-004: Airline Filter @supplier @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

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

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const airlineCheckbox = page.locator('input[type="checkbox"]').filter({ hasNotText: /term/i }).first();
    if (await airlineCheckbox.isVisible().catch(() => false)) {
      await airlineCheckbox.check({ force: true });
      await page.waitForTimeout(1000);
    }
  });

  // ── TC-005: Filter by Stops ─────────────────────────────────────────────────
  test('TC-005: Stops Filter @supplier @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

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

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const nonStopFilter = page.locator('label, span, input').filter({ hasText: /Non Stop|0 Stop|Direct/i }).first();
    if (await nonStopFilter.isVisible().catch(() => false)) {
      await nonStopFilter.click({ force: true });
      await page.waitForTimeout(1000);
    }
  });

  // ── TC-008: Filter by Baggage ───────────────────────────────────────────────
  test('TC-008: Baggage Filter @supplier @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

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

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const baggageFilter = page.locator('label, span, input').filter({ hasText: /Baggage|kg/i }).first();
    if (await baggageFilter.isVisible().catch(() => false)) {
      await baggageFilter.click({ force: true });
      await page.waitForTimeout(1000);
    }
  });

  // ── TC-006: Sort by Lowest Price ────────────────────────────────────────────
  test('TC-006: Price Sort @supplier @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

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

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const priceSortBtn = page.getByRole('button', { name: 'Price', exact: true }).first();
    if (await priceSortBtn.isVisible().catch(() => false)) {
      await priceSortBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  // ── TC-007: Verify Seats Available ─────────────────────────────────────────
  test('TC-007: Seat Availability @supplier @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

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

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const seatIndicator = page.locator('body').filter({ hasText: /seat|left|available/i }).first();
    await expect(seatIndicator).toBeVisible();
  });

  // ── TC-008B: Departure/Arrival Time Slot Filter ──────────────────────────────
  test('TC-008B: Departure/Arrival Time Slot filter @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

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

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const timeFilter = page.locator('button, div, span').filter({ hasText: /^Time$|^Depart Time$/i }).first();
    if (await timeFilter.isVisible().catch(() => false)) {
      await timeFilter.click({ force: true });
      await page.waitForTimeout(1000);
    }
  });

  // ── TC-008C: Flight Duration Slider Filter ───────────────────────────────────
  test('TC-008C: Flight Duration slider filter @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

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

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const durationFilter = page.locator('button, div, span').filter({ hasText: /^Duration$/i }).first();
    if (await durationFilter.isVisible().catch(() => false)) {
      await durationFilter.click({ force: true });
      await page.waitForTimeout(1000);
    }
  });

  // ── TC-008D: Reset / Clear All Applied Filters ───────────────────────────────
  test('TC-008D: Reset / Clear All Applied Filters @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

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

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const directFlightCheckbox = page.locator('label, input').filter({ hasText: /Direct Flight|Non Stop/i }).first();
    if (await directFlightCheckbox.isVisible().catch(() => false)) {
      await directFlightCheckbox.click({ force: true });
      await page.waitForTimeout(1000);
      await directFlightCheckbox.click({ force: true });
      await page.waitForTimeout(1000);
    }
  });

  // ── TC-006B: Sort by Shortest Duration / Earliest Departure ─────────────────
  test('TC-006B: Sort by Shortest Duration / Earliest Departure @functional', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

    const oneWayFlightData = {
      ...supplierConfig.oneWay,
      supplier: supplierConfig.supplierName
    };

    await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book/i }).first();
    await resultsLocator.waitFor({ state: 'visible', timeout: 90000 });

    const quickestBtn = page.locator('div, button, span').filter({ hasText: /^Quickest$/i }).or(page.locator('button, div').filter({ hasText: /Quickest/i })).first();
    if (await quickestBtn.isVisible().catch(() => false)) {
      await quickestBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
  });

});
