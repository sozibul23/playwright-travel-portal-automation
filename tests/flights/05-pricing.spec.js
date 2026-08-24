import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightCommissionPage } from '../../pages/FlightCommissionPage.js';
import { FlightResultsPage } from '../../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../../pages/PassengerDetailsPage.js';
import { commissionConfig, commissionTolerance } from '../../data/testData.js';

/**
 * Flight Pricing, Commission & Fare Suite
 *
 * Tags:
 * - @regression: Critical fare breakdown calculations & fare change checks
 * - @functional: Currency switching & baggage verifications
 * - @supplier: Supplier pricing validations
 */

test.describe('Flight Pricing', () => {
  test.describe.configure({ timeout: 240000 });

  // ── TC-010B: B2B Commission & Discount Calculation ──────────────────────────
  test('TC-010B: Commission & Discount @supplier @regression', async ({ page, supplierConfig }) => {
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
    const commissionPage = new FlightCommissionPage(formPage);

    await commissionPage.openFareSummaryModal();

    const passengers = [
      { paxType: 'ADT', count: 1, baseFare: 19002.80, grossTax: 13186.92 }
    ];

    const result = await commissionPage.verifyDiscountForAllPax(passengers, commissionConfig);
    commissionPage.printVerificationReport(result);

    expect(result.allPassed, 'B2B Discount / Commission calculation mismatch detected').toBe(true);
  });

  // ── TC-010, TC-011, TC-012: Validate Base Fare, Taxes & Total Fare ──────────
  test('TC-010: Fare Breakdown @supplier @regression', async ({ page, supplierConfig }) => {
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

    const commissionPage = new FlightCommissionPage(page);
    await commissionPage.waitForResults();
    await commissionPage.openFareSummary();

    const paxRows = await commissionPage.extractAllPaxFareSummary();
    expect(paxRows.length, '❌ Fare Summary table rows not found').toBeGreaterThan(0);

    for (const row of paxRows) {
      console.log(`Checking pricing for ${row.paxType}:`, row);
      
      expect(row.baseFare, `Base fare for ${row.paxType} should be greater than 0`).toBeGreaterThan(0);
      expect(row.tax, `Tax for ${row.paxType} should be greater than or equal to 0`).toBeGreaterThanOrEqual(0);
      expect(row.subTotal, `Sub total for ${row.paxType} should be greater than 0`).toBeGreaterThan(0);
      const approxTotal = (row.baseFare || 0) + (row.tax || 0) - (row.discount || 0);
      expect(Math.abs(row.subTotal - approxTotal), `Total fare calculation mismatch for ${row.paxType}`).toBeLessThanOrEqual(5000);
    }
  });

  // ── TC-013: Fare Change Validation ─────────────────────────────────
  test('TC-013: Fare Change Validation @supplier @regression', async ({ page, supplierConfig }) => {
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

    const resultsPage = new FlightResultsPage(page);
    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    const passengerPage = new PassengerDetailsPage(formPage);

    const fareModal = formPage.locator('dialog[open], .modal.modal-open, .modal-box').filter({ hasText: /fare|price|update|change/i }).first();
    if (await fareModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Fare change modal detected. Confirming...');
      const confirmBtn = fareModal.locator('button').filter({ hasText: /Confirm|OK|Accept|Yes|Continue/i }).first();
      await confirmBtn.click();
    }

    await expect(passengerPage.travelerSectionHeading).toBeVisible({ timeout: 30000 });
  });

  // ── TC-014: Currency Validation ───────────────────────────────────────────
  test('TC-014: Currency Validation @supplier @functional', async ({ page, supplierConfig }) => {
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

    const currencyBtn = page.getByRole('button', { name: '৳' }).or(page.locator('button:has-text("৳")')).first();
    await expect(currencyBtn).toBeVisible({ timeout: 15000 });
    await currencyBtn.click();

    const usdOption = page.locator('button, a, [role="option"], li, span').filter({ hasText: /^USD$/i }).or(
      page.locator('button, a, [role="option"], li, span').filter({ hasText: /USD|US Dollar/i })
    ).first();
    
    await expect(usdOption).toBeVisible({ timeout: 15000 });
    await usdOption.click();

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.locator('.loading, .spinner, [class*="spinner"], [class*="loading"]').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const updatedCurrencyBtn = page.getByRole('button', { name: /usd|\$/i }).or(page.locator('button:has-text("USD")')).or(page.locator('button:has-text("$")')).first();
    const updatedBtnVisible = await updatedCurrencyBtn.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (updatedBtnVisible) {
      await expect(updatedCurrencyBtn).toBeVisible();
    } else {
      const cardText = await page.locator('div').filter({ has: resultsLocator }).first().innerText();
      expect(cardText.toLowerCase()).toMatch(/usd|\$/);
    }
  });

  // ── Pricing - Verifying Baggage ────────────────────────────────────────────
  test('Pricing - Verifying Baggage on results page @supplier @functional', async ({ page, supplierConfig }) => {
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

    const baggageInfo = page.locator('body').filter({ hasText: /baggage|kg|bag/i }).first();
    await expect(baggageInfo).toBeVisible();
  });

});
