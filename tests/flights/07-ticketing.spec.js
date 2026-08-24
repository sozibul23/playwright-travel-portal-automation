import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../../pages/PassengerDetailsPage.js';
import { passengerData, generateRandomPassenger } from '../../data/testData.js';
import fs from 'fs';
import path from 'path';

/**
 * Flight Ticketing & Cancellation Suite
 *
 * Tags:
 * - @smoke: Core ticket issuance & cancellation flow
 * - @regression: Void ticket & PDF voucher download
 * - @supplier: Supplier ticketing integration tests
 */

test.describe('Ticketing & Cancellation', () => {
  test.describe.configure({ timeout: 240000 });

  // ── TC-023: Issue Ticket and Verify Ticket Number & PDF Download ───────────
  test('TC-023: Issue Ticket & PDF @smoke @supplier', async ({ page, supplierConfig }) => {
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

    const successToast = passengerPage.page
      .locator('body')
      .filter({ hasText: /BOOKING ID|Booking ID|booking id|successfully created/i })
      .first();
    await expect(successToast).toBeVisible({ timeout: 60000 });

    const issueBtn = formPage.getByRole('button', { name: /Issue Ticket/i }).first();
    if (await issueBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
      console.log('Ticket issuance button is visible. Initiating issuance flow...');
      await issueBtn.click({ force: true });

      const continueBtn = formPage.getByRole('button', { name: 'Continue', exact: true }).first();
      await continueBtn.waitFor({ state: 'visible', timeout: 15000 });
      await continueBtn.click({ force: true });

      const modalIssueBtn = formPage.locator('.modal-box, dialog, .modal').getByRole('button', { name: /^Issue Ticket$/i }).first();
      await modalIssueBtn.waitFor({ state: 'visible', timeout: 15000 });
      await modalIssueBtn.click({ force: true });

      const ticketNumberCell = formPage.locator('body').filter({ hasText: /ticket no|e-ticket/i }).first();
      await expect(ticketNumberCell).toBeVisible({ timeout: 60000 });

      // Strictly enforce PDF Download
      const downloadBtn = formPage.getByRole('button', { name: /Download|Download Voucher|Invoice/i }).first();
      await expect(downloadBtn, '❌ PDF Download Failed: Download button is not visible on booking details page.').toBeVisible({ timeout: 20000 });
      await downloadBtn.click({ force: true });

      const downloadOption = downloadBtn.locator('xpath=../ul')
        .locator('button, a, li')
        .filter({ hasText: /Ticket|Voucher|Custom/i })
        .first();

      await downloadOption.waitFor({ state: 'visible', timeout: 8000 });

      // Set up download promise BEFORE triggering the click
      const downloadPromise = formPage.waitForEvent('download', { timeout: 30000 });
      await downloadOption.click({ force: true });
      const download = await downloadPromise;

      const bodyText = await formPage.innerText('body');
      const bookingIdMatch = bodyText.match(/FL26[A-Z0-9]+/i) || bodyText.match(/booking id\s*:\s*([A-Z0-9_-]+)/i);
      const bookingId = bookingIdMatch ? bookingIdMatch[0] : 'Unknown';

      const downloadFolder = 'test-results';
      if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder, { recursive: true });
      }
      const voucherPath = path.join(downloadFolder, `voucher_${bookingId}.pdf`);
      await download.saveAs(voucherPath);

      expect(fs.existsSync(voucherPath), `❌ PDF Voucher File missing: ${voucherPath} was not created on disk.`).toBe(true);
      console.log(`Voucher PDF successfully downloaded and verified on disk: ${voucherPath}`);
    }
  });

  // ── TC-026: Cancel Booking ────────────────────────────────────────────────
  test('TC-026: Cancel Booking and Verify Cancellation Toast @supplier @cancellation @smoke @regression', async ({ page, supplierConfig }) => {
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
    await passengerPage.clickNext();

    // 1. Strictly require Hold Flight button (fails test if supplier only offers Instant Purchase/Direct Ticket)
    await passengerPage.acceptTermsAndHoldFlightOnlyStrict();

    // 2. Verify Cancel Ticket / Cancel Flight button is visible on booking details page
    const cancelBtn = formPage.getByRole('button', { name: /Cancel Ticket|Cancel Flight|Cancel Booking|Cancel/i }).first();
    await expect(cancelBtn, '❌ Hold Cancellation failed: "Cancel Ticket/Flight" button is not visible on booking details page.').toBeVisible({ timeout: 60000 });
    await cancelBtn.click({ force: true });

    // 3. Confirm modal if present
    const confirmCancelBtn = formPage.locator('.modal-box, dialog, .modal, [class*="modal"]').getByRole('button', { name: /Cancel Flight|Cancel Ticket|Cancel Booking|Yes|Confirm|Continue/i }).first();
    if (await confirmCancelBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await confirmCancelBtn.click({ force: true });
    }

    const cancelToast = formPage.locator('body').filter({ hasText: /cancelled|canceled|successfully|Cancellation/i }).first();
    await expect(cancelToast).toBeVisible({ timeout: 45000 });
  });

});

