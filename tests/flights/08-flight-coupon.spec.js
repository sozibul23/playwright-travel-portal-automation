import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../../pages/PassengerDetailsPage.js';
import { flightCouponSuite } from '../../data/couponTestData.js';

// ─────────────────────────────────────────────────────────────────────────
// 🏢 B2B Flight Coupon Code Validation Suite
// Tags: @coupon @b2b @regression
//
// Verification Strategy (3-layer):
//   1. Price Change  — initialPrice vs finalPrice (most reliable)
//   2. Success Toast — ".alert-success" / "Applied" text
//   3. Coupon Badge  — coupon code row appears in price breakdown
// ─────────────────────────────────────────────────────────────────────────

test.describe('B2B Flight Portal — Dynamic Coupon Suite (@coupon @b2b)', () => {
  test.setTimeout(240000);

  for (const coupon of flightCouponSuite) {
    test(`[${coupon.id}] ${coupon.code} — ${coupon.description} @coupon @b2b`, async ({ page, supplierConfig }) => {
      await page.goto('https://b2b.innovatedemo.com');
      await page.waitForLoadState('domcontentloaded');

      // Dismiss any promo modal that appears on fresh navigation
      const promoModal = page.locator('dialog[open], .modal[open], .modal.modal-open').first();
      if (await promoModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const closeBtn = promoModal.locator('button.btn-circle, button:has-text("✕"), button:has-text("Close"), button:has-text("Accept")').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click({ force: true }).catch(() => {});
        } else {
          await page.keyboard.press('Escape').catch(() => {});
        }
        await promoModal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      }

      const searchPage = new FlightSearchPage(page);
      const resultsPage = new FlightResultsPage(page);

      const isIntl = coupon.routeType === 'international';

      // 🛫 Sabre ITT Sandbox only covers domestic routes.
      // International routes (DAC→DEL) require 'All' supplier.
      const oneWayFlightData = {
        originCode: 'dac',
        originDisplay: 'Dhaka',
        destinationCode: isIntl ? 'del' : 'cxb',
        destinationDisplay: isIntl ? 'Delhi' : 'Cox',
        departureDate: supplierConfig?.oneWay?.departureDate || '2026-09-17',
        supplier: isIntl ? 'All' : 'sabre itt sandbox',
      };

      await searchPage.selectOneWay();
      await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
      await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
      await searchPage.setDepartureDate(oneWayFlightData.departureDate);
      await searchPage.selectSupplier(oneWayFlightData.supplier);
      await searchPage.search();

      const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
      await formPage.bringToFront().catch(() => {});
      await formPage.waitForLoadState('domcontentloaded').catch(() => {});
      await formPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      const passengerPage = new PassengerDetailsPage(formPage);

      const initialPrice = await passengerPage.getTotalPayable();
      console.log(`[B2B Coupon Test] Applying Coupon: ${coupon.code} | Initial Price: ${initialPrice}`);

      // 🎟️ Apply coupon — returns 3-layer verification result
      const result = await passengerPage.applyCoupon(coupon.code);

      // ════════════════════════════════════════════════════════════════
      // SUCCESS path
      // ════════════════════════════════════════════════════════════════
      if (coupon.expectedStatus === 'success') {

        // ✅ Verify coupon was actually applied (price drop OR toast OR badge)
        expect(
          result.applied,
          `❌ Coupon ${coupon.code} NOT applied! ` +
          `Price: ৳${result.priceBefore}→৳${result.priceAfter} | ` +
          `Toast: "${result.toastMessage}" | Badge: ${result.isBadgeVisible}`
        ).toBe(true);

        // ✅ Price must remain non-negative
        expect(result.priceAfter, 'B2B final payable price must be >= 0').toBeGreaterThanOrEqual(0);

        // ✅ Fixed discount coupons: verify exact amount (±5 Tk tolerance)
        if (coupon.type === 'fixed' && coupon.discount) {
          expect(
            Math.abs(result.discountAmount - coupon.discount),
            `Fixed discount mismatch! Expected ৳${coupon.discount} off, got ৳${result.discountAmount}`
          ).toBeLessThanOrEqual(5);
        }

        // ✅ Percentage coupons: portal applies % on base fare (excl. tax).
        //    Verify discount is in realistic 5%–15% window of total fare.
        if (coupon.type === 'percentage') {
          const minExpected = initialPrice * 0.05;
          const maxExpected = initialPrice * 0.15;
          console.log(
            `📊 [B2B 10% Verification] ` +
            `Total: ৳${initialPrice} | Range: ৳${minExpected.toFixed(0)}–৳${maxExpected.toFixed(0)} | ` +
            `Actual discount: ৳${result.discountAmount}`
          );
          expect(result.discountAmount, `Percentage discount out of range! Got ৳${result.discountAmount}`).toBeGreaterThanOrEqual(minExpected);
          expect(result.discountAmount, `Percentage discount out of range! Got ৳${result.discountAmount}`).toBeLessThanOrEqual(maxExpected);
        }

        console.log(`✅ [B2B Coupon OK] ${coupon.code} | Discount: ৳${result.discountAmount} | Final: ৳${result.priceAfter}`);

      // ════════════════════════════════════════════════════════════════
      // ERROR / REJECTION path
      // ════════════════════════════════════════════════════════════════
      } else {
        // ✅ Coupon should NOT have reduced the price
        expect(
          result.discountAmount,
          `Coupon ${coupon.code} should be REJECTED but price dropped by ৳${result.discountAmount}`
        ).toBeLessThanOrEqual(5);  // allow ≤5 Tk rounding noise

        console.log(`ℹ️ [B2B Coupon Rejected] ${coupon.code} | Message: "${result.toastMessage.substring(0, 80)}"`);
      }
    });
  }

  test.afterEach(async ({ context }) => {
    const pages = context.pages();
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close().catch(() => {});
    }
  });
});


// ─────────────────────────────────────────────────────────────────────────
// 🧾 B2B Flight Coupon — Hold Booking & Invoice Reconciliation E2E Suite
// Tags: @coupon @invoice @reconciliation @e2e
// Verifies that after applying a coupon and holding/confirming the booking,
// the "Grand Total" matches the "Invoice Amount" under the Invoice tab.
// ─────────────────────────────────────────────────────────────────────────

import { FlightBookingDetailsPage } from '../../pages/FlightBookingDetailsPage.js';
import { generateRandomPassenger } from '../../data/testData.js';

test.describe('B2B Flight Coupon — Hold Booking & Invoice Reconciliation (@coupon @invoice)', () => {
  test.setTimeout(240000);

  test('TC-CPN-E2E-01: Apply Coupon, Complete Hold & Verify Grand Total Matches Invoice Amount @coupon @invoice', async ({ page, supplierConfig }) => {
    await page.goto('https://b2b.innovatedemo.com');
    await page.waitForLoadState('domcontentloaded');

    // Dismiss promo modal if open
    const promoModal = page.locator('dialog[open], .modal[open], .modal.modal-open').first();
    if (await promoModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const closeBtn = promoModal.locator('button.btn-circle, button:has-text("✕"), button:has-text("Close"), button:has-text("Accept")').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
      await promoModal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }

    const searchPage = new FlightSearchPage(page);
    const resultsPage = new FlightResultsPage(page);

    const oneWayFlightData = {
      originCode: 'dac',
      originDisplay: 'Dhaka',
      destinationCode: 'cxb',
      destinationDisplay: 'Cox',
      departureDate: supplierConfig?.oneWay?.departureDate || '2026-09-17',
      supplier: 'sabre itt sandbox',
    };

    // 1. Search Flight
    await searchPage.selectOneWay();
    await searchPage.setOriginByText(oneWayFlightData.originCode, oneWayFlightData.originDisplay);
    await searchPage.setDestinationByText(oneWayFlightData.destinationCode, oneWayFlightData.destinationDisplay);
    await searchPage.setDepartureDate(oneWayFlightData.departureDate);
    await searchPage.selectSupplier(oneWayFlightData.supplier);
    await searchPage.search();

    // 2. Select Flight & Open Passenger Details Form
    const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
    await formPage.bringToFront().catch(() => {});
    await formPage.waitForLoadState('domcontentloaded').catch(() => {});
    await formPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const passengerPage = new PassengerDetailsPage(formPage);

    // 3. Apply Active Coupon (e.g. AUG27)
    const couponCode = 'AUG27';
    const couponResult = await passengerPage.applyCoupon(couponCode);
    expect(couponResult.applied, `❌ Coupon ${couponCode} failed to apply at checkout`).toBe(true);

    // 4. Fill Passenger Details
    const passengerInfo = generateRandomPassenger();
    await passengerPage.fillPassengerInfo(passengerInfo);

    // 5. Complete Wizard & Hold Flight
    await passengerPage.clickNext();
    await passengerPage.acceptTermsAndHoldFlight();

    // 6. Land on Booking Details Page
    const bookingDetailsPage = new FlightBookingDetailsPage(formPage);
    await bookingDetailsPage.waitForBookingDetailsPage(60000);

    const bookingId = await bookingDetailsPage.getBookingId();
    console.log(`🎉 Booking Created Successfully! Booking ID: ${bookingId}`);

    // 6. Verify Financial Reconciliation: Grand Total == Invoice Amount
    const reconciliation = await bookingDetailsPage.verifyInvoiceMatchesGrandTotal();

    expect(
      reconciliation.passed,
      `❌ Invoice Reconciliation Failed! Grand Total: ৳${reconciliation.grandTotal} vs Invoice Amount: ৳${reconciliation.invoiceAmount}`
    ).toBe(true);

    console.log(`🏆 TEST PASSED: Booking ${bookingId} has perfectly matched Grand Total (৳${reconciliation.grandTotal}) and Invoice Amount (৳${reconciliation.invoiceAmount})!`);
  });

  test.afterEach(async ({ context }) => {
    const pages = context.pages();
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close().catch(() => {});
    }
  });
});

