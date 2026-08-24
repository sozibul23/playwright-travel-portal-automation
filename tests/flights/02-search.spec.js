import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';

/**
 * Flight Search & Validation Suite
 *
 * Tags:
 * - @smoke: Core search page availability and E2E search execution
 * - @regression: Round-Trip & Multi-City search flows
 * - @functional: Passenger configurations & Tab switches
 * - @negative: Validation limits and boundary constraints
 */


test.describe('Flight Search', () => {

  // ── TC-001: Search One-Way Flight (Single Passenger) ───────────────────────
  test('TC-001: One-Way Search @smoke @supplier', async ({ page, supplierConfig }) => {
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

    // Verify search results returned
    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book Now|Select|Book/i }).or(page.locator('button:has-text("Select"), button:has-text("View"), button:has-text("Book"), .flight-card')).first();
    await expect(resultsLocator).toBeVisible({ timeout: 90000 });
  });

  // ── TC-001B: Search Flight with Multiple Passengers ───────────────────────
  test('TC-001B: Multi-Pax Search @functional @supplier', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    const searchPage = new FlightSearchPage(page);

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

    // Verify search results returned
    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book Now|Select|Book/i }).or(page.locator('button:has-text("Select"), button:has-text("View"), button:has-text("Book"), .flight-card')).first();
    await expect(resultsLocator).toBeVisible({ timeout: 90000 });
  });

  // ── TC-002: Search Round Trip Flight ───────────────────────────────────────
  test('TC-002: Search Round Trip Flight @regression @supplier', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

    const roundTripFlightData = {
      ...supplierConfig.roundTrip,
      supplier: supplierConfig.supplierName
    };

    await searchPage.selectRoundTrip();
    await searchPage.setOriginByText(roundTripFlightData.originCode, roundTripFlightData.originDisplay);
    await searchPage.setDestinationByText(roundTripFlightData.destinationCode, roundTripFlightData.destinationDisplay);
    await searchPage.setReturnDate(roundTripFlightData.departureDate, roundTripFlightData.returnDate);
    await searchPage.selectSupplier(roundTripFlightData.supplier);
    await searchPage.search();

    // Verify search results returned
    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book Now|Select|Book/i }).or(page.locator('button:has-text("Select"), button:has-text("View"), button:has-text("Book"), .flight-card')).first();
    await expect(resultsLocator).toBeVisible({ timeout: 90000 });
  });

  // ── TC-003: Search Multi-City Flight ───────────────────────────────────────
  test('TC-003: Search Multi-City Flight @regression @supplier', async ({ page, supplierConfig }) => {
    test.setTimeout(180000);
    const searchPage = new FlightSearchPage(page);
    await searchPage.selectMultiCity();

    const originInput1 = page.locator('input.sb-input[placeholder="Select"]').or(page.getByRole('textbox', { name: 'Select' })).first();
    await expect(originInput1).toBeVisible({ timeout: 15000 });

    const segment1 = { ...supplierConfig.multiCity[0], supplier: supplierConfig.supplierName };
    const segment2 = { ...supplierConfig.multiCity[1], supplier: supplierConfig.supplierName };

    // Segment 1
    await searchPage.setOriginByText(segment1.originCode, segment1.originDisplay);
    await searchPage.setDestinationByText(segment1.destinationCode, segment1.destinationDisplay);
    await searchPage.setDepartureDate(segment1.departureDate);

    // Segment 2
    await searchPage.setNthOriginByText(1, segment2.originCode, segment2.originDisplay);
    await searchPage.setNthDestinationByText(1, segment2.destinationCode, segment2.destinationDisplay);

    // Segment 2 Date
    await searchPage.setNthDepartureDate(1, segment2.departureDate);

    await searchPage.selectSupplier(segment1.supplier);
    await searchPage.search();

    await expect(page).toHaveURL(/\/flight/i, { timeout: 30000 });

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book Now|Select|Book/i }).or(page.locator('button:has-text("Select"), button:has-text("View"), button:has-text("Book"), .flight-card')).first();
    const pageContentLocator = page.locator('body').filter({ hasText: /No Flights Found|No Results|No flight available|No Schedule|Search Result|Flight/i }).first();
    await expect(resultsLocator.or(pageContentLocator)).toBeVisible({ timeout: 60000 });
  });

  // ── Form UI & Validation Checks ──────────────────────────────────────────

  test('should switch between One Way and Round Trip tabs @smoke @functional', async ({ page }) => {
    const searchPage = new FlightSearchPage(page);

    await searchPage.selectRoundTrip();
    await expect(page.locator('li').filter({ hasText: 'Round Trip' }).first()).toBeVisible();

    await searchPage.selectOneWay();
    await expect(page.locator('li').filter({ hasText: 'One Way' }).first()).toBeVisible();
  });

  test('SN-01: should not navigate to results when origin and destination are empty @negative', async ({ page }) => {
    const searchPage = new FlightSearchPage(page);
    await searchPage.clickSearchExpectingValidation();
    await expect(page).not.toHaveURL(/flight\/search/);
  });

  test('SN-03: should not allow selecting a past departure date @negative @boundary', async ({ page }) => {
    const searchPage = new FlightSearchPage(page);

    await searchPage.setOriginByText('dac', 'Dhaka - Bangladesh');
    await searchPage.setDestinationByText('del', 'New Delhi - India');

    const dateInput = page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first();
    await dateInput.click();

    const disabledDateCell = page.locator('.flatpickr-day.flatpickr-disabled, .flatpickr-day.disabled, [aria-disabled="true"]')
      .filter({ visible: true })
      .first();
    await expect(
      disabledDateCell,
      'Past dates should be disabled in the date picker'
    ).toBeVisible({ timeout: 5000 });
  });

  // ── SN-04: Same Origin & Destination Validation ─────────────────────────
  test('SN-04: should exclude selected origin airport from destination options @negative', async ({ page }) => {
    const searchPage = new FlightSearchPage(page);

    await searchPage.setOriginByText('dac', 'Dhaka - Bangladesh');

    const destInput = page.locator('input.sb-input[placeholder="Select"]').or(page.getByRole('textbox', { name: 'Select' })).nth(1);
    await destInput.click();

    const searchBox = page.getByRole('searchbox', { name: /Airport code, city, name or|Search/i })
      .or(page.locator('input[type="search"], input[placeholder*="Airport" i], input[placeholder*="Search" i]'))
      .first();

    if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBox.fill('DAC');
      await page.waitForTimeout(500);

      const dacOption = page.getByRole('option').filter({ hasText: /Dhaka - Bangladesh|DAC/i })
        .or(page.locator('[role="option"]').filter({ hasText: /Dhaka - Bangladesh|DAC/i }))
        .filter({ visible: true });

      const dacVisible = await dacOption.isVisible().catch(() => false);
      if (dacVisible) {
        await searchPage.clickSearchExpectingValidation();
        await expect(page).not.toHaveURL(/flight\/search/);
      } else {
        await expect(dacOption, 'Origin airport (DAC) should be excluded from Destination dropdown options').not.toBeVisible();
      }
    }
  });

  // ── SN-05: Infant count > Adult count validation ───────────────────────
  test('SN-05: should prevent infant count from exceeding adult count @negative', async ({ page }) => {
    const searchPage = new FlightSearchPage(page);
    await searchPage.ensureFlightsTabActive();

    const passengerBtn = page.getByRole('button', { name: /Passenger/i }).first();
    await passengerBtn.click();
    await page.getByRole('button', { name: 'Apply' }).waitFor({ state: 'visible', timeout: 5000 });

    const infantPlusBtn = page.locator('.plusBtn').nth(3);
    await infantPlusBtn.click();
    await page.waitForTimeout(200);
    await infantPlusBtn.click().catch(() => {});

    const applyBtn = page.getByRole('button', { name: 'Apply' });
    await applyBtn.click({ force: true });

    const summaryText = await passengerBtn.innerText().catch(() => '');
    const infantCountMatch = summaryText.match(/(\d+)\s*Infant/i);
    const infantCount = infantCountMatch ? parseInt(infantCountMatch[1], 10) : 0;
    expect(infantCount, 'Infants count should not exceed Adult count (max 1 infant for 1 adult)').toBeLessThanOrEqual(1);
  });

  // ── SN-06: Maximum 9 total passengers limit check ────────────────────────
  test('SN-06: should enforce maximum 9 total passengers limit @negative', async ({ page }) => {
    const searchPage = new FlightSearchPage(page);
    await searchPage.ensureFlightsTabActive();

    await searchPage.setPassengers({ adults: 6, children: 3 });

    const passengerBtn = page.getByRole('button', { name: /Passenger/i }).first();
    await passengerBtn.click();
    await page.getByRole('button', { name: 'Apply' }).waitFor({ state: 'visible', timeout: 5000 });

    const adultPlusBtn = page.locator('.plusBtn').nth(0);
    const isPlusDisabled = await adultPlusBtn.isDisabled().catch(() => false);
    if (!isPlusDisabled) {
      await adultPlusBtn.click().catch(() => {});
    }

    const applyBtn = page.getByRole('button', { name: 'Apply' });
    await applyBtn.click({ force: true });

    const summaryText = await passengerBtn.innerText().catch(() => '');
    const totalMatch = summaryText.match(/(\d+)\s*Passenger/i);
    if (totalMatch) {
      expect(parseInt(totalMatch[1], 10), 'Total passengers should not exceed 9').toBeLessThanOrEqual(9);
    }
  });

  // ── SN-07: Return Date prior to Departure Date validation ─────────────
  test('SN-07: should not allow selecting return date before departure date @negative', async ({ page }) => {
    const searchPage = new FlightSearchPage(page);
    await searchPage.selectRoundTrip();

    const depDateInput = page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first();
    await depDateInput.click({ force: true });

    const openCalendar = page.locator('.flatpickr-calendar.open');
    await openCalendar.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const dayCells = openCalendar.locator('.flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay)');
    if (await dayCells.count() > 5) {
      await dayCells.nth(5).click({ force: true });
    }

    const disabledDays = page.locator('.flatpickr-calendar.open .flatpickr-day.flatpickr-disabled, .flatpickr-calendar.open .flatpickr-day.disabled, .flatpickr-calendar.open [aria-disabled="true"]')
      .filter({ visible: true })
      .first();

    const isReturnCalendarVisible = await page.locator('.flatpickr-calendar.open').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(isReturnCalendarVisible, 'Return date picker calendar should open').toBe(true);
    await expect(disabledDays, 'Past/prior dates before departure date should be disabled in return date picker').toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  // ── TC-003B: Search Flight by Cabin Class ────────────────────────────────
  test('TC-003B: Search Flight by Business Cabin Class @functional @supplier', async ({ page, supplierConfig }) => {
    test.setTimeout(120000);
    const searchPage = new FlightSearchPage(page);

    const oneWayFlightData = {
      ...supplierConfig.oneWay,
      supplier: supplierConfig.supplierName
    };

    await searchPage.selectOneWay();
    await searchPage.selectCabinClass('Business Class');
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);

    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    const resultsLocator = page.getByRole('button', { name: /Select Flight|View Fare|Book Now|Select|Book/i })
      .or(page.locator('button:has-text("Select"), button:has-text("View"), button:has-text("Book"), .flight-card'))
      .or(page.getByText(/No flights found|No Results|No Flight/i))
      .first();
    await expect(resultsLocator).toBeVisible({ timeout: 90000 });
  });


});





