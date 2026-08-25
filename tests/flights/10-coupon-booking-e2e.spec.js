import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../../pages/PassengerDetailsPage.js';
import { FlightBookingDetailsPage } from '../../pages/FlightBookingDetailsPage.js';
import { generateRandomPassenger } from '../../data/testData.js';
import { flightCouponSuite } from '../../data/couponTestData.js';

// ─────────────────────────────────────────────────────────────────────────────
// 🎟️ B2B Flight Coupon — Booking E2E Price Verification
// Tags: @coupon @booking @e2e @b2b
//
// For every coupon where expectedStatus === 'success':
//   1. Search flight DAC → CXB (or DAC → DEL for international)
//   2. Apply coupon on checkout form
//   3. Complete booking via Instant Purchase
//   4. On booking details page verify:
//      a. Grand Total > 0
//      b. Grand Total = initialPrice - discountAmount  (±৳5 tolerance)
//      c. "Discount by Coupon" row shows correct discount amount
//      d. Grand Total == Invoice Amount (financial reconciliation)
// ─────────────────────────────────────────────────────────────────────────────

// Filter: only coupons that are expected to succeed and apply a real discount
const SUCCESS_COUPONS = flightCouponSuite.filter(
  c => c.expectedStatus === 'success' && c.type !== 'non_negative_check'
);

test.describe('B2B Flight Coupon — Booking E2E Price Verification (@coupon @booking @e2e)', () => {
  test.setTimeout(300000); // 5 min per test

  for (const coupon of SUCCESS_COUPONS) {
    test(
      `[${coupon.id}] ${coupon.code} — Complete booking & verify price (${coupon.description})`,
      async ({ page, supplierConfig }) => {

        const isIntl = coupon.routeType === 'international';

        // ── Step 1: Navigate to B2B portal ───────────────────────────────────
        await page.goto('https://b2b.innovatedemo.com');
        await page.waitForLoadState('domcontentloaded');

        // Dismiss promo modal if present
        const promoModal = page.locator('dialog[open], .modal[open], .modal.modal-open').first();
        if (await promoModal.isVisible({ timeout: 3000 }).catch(() => false)) {
          const closeBtn = promoModal
            .locator('button.btn-circle, button:has-text("✕"), button:has-text("Close")')
            .first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click({ force: true }).catch(() => {});
          } else {
            await page.keyboard.press('Escape').catch(() => {});
          }
          await promoModal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        }

        // ── Step 2: Search flight ─────────────────────────────────────────────
        const searchPage  = new FlightSearchPage(page);
        const resultsPage = new FlightResultsPage(page);

        const flightData = {
          originCode:       'dac',
          originDisplay:    'Dhaka',
          destinationCode:  isIntl ? 'del' : 'cxb',
          destinationDisplay: isIntl ? 'Delhi' : 'Cox',
          departureDate:    supplierConfig?.oneWay?.departureDate || '2026-09-17',
          supplier:         isIntl ? 'All' : 'sabre itt sandbox',
        };

        await searchPage.selectOneWay();
        await searchPage.setOriginByText(flightData.originCode, flightData.originDisplay);
        await searchPage.setDestinationByText(flightData.destinationCode, flightData.destinationDisplay);
        await searchPage.setDepartureDate(flightData.departureDate);
        await searchPage.selectSupplier(flightData.supplier);
        await searchPage.search();

        // ── Step 3: Select flight & open checkout form ────────────────────────
        const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
        await formPage.bringToFront().catch(() => {});
        await formPage.waitForLoadState('domcontentloaded').catch(() => {});
        await formPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

        const passengerPage = new PassengerDetailsPage(formPage);

        // ── Step 4: Get initial price & apply coupon ──────────────────────────
        const initialPrice = await passengerPage.getTotalPayable();
        console.log(`\n[${coupon.id}] ${coupon.code} | Initial price: ৳${initialPrice}`);

        const couponResult = await passengerPage.applyCoupon(coupon.code);
        console.log(
          `  Applied: ${couponResult.applied} | ` +
          `৳${couponResult.priceBefore} → ৳${couponResult.priceAfter} | ` +
          `Discount: ৳${couponResult.discountAmount}`
        );

        // ✅ Coupon must be applied on checkout
        expect(
          couponResult.applied,
          `❌ [${coupon.id}] Coupon ${coupon.code} failed to apply on checkout! ` +
          `Toast: "${couponResult.toastMessage}"`
        ).toBe(true);

        const checkoutDiscountAmount = couponResult.discountAmount;
        const checkoutFinalPrice     = couponResult.priceAfter;

        // ── Step 5: Fill passenger & complete via Instant Purchase ────────────
        console.log(`  → Filling passenger info & completing Instant Purchase...`);
        await passengerPage.fillPassengerInfo(generateRandomPassenger());
        await passengerPage.clickNext();
        await passengerPage.clickInstantPurchase();

        // ── Step 6: Wait for booking details page ─────────────────────────────
        const bookingDetailsPage = new FlightBookingDetailsPage(formPage);
        const arrived = await bookingDetailsPage
          .waitForBookingDetailsPage(90000)
          .then(() => true)
          .catch(() => false);

        expect(
          arrived,
          `❌ [${coupon.id}] Booking details page not reached after Instant Purchase! ` +
          `Still on: ${formPage.url()}`
        ).toBe(true);

        const bookingId = await bookingDetailsPage.getBookingId().catch(() => 'N/A');
        console.log(`  ✅ Booking complete! ID: ${bookingId}`);

        // ── Step 7: Verify Grand Total on booking details page ────────────────
        const grandTotal        = await bookingDetailsPage.getGrandTotal();
        const couponDiscount    = await bookingDetailsPage.getCouponDiscountAmount();

        console.log(
          `  📊 Booking Details Page:\n` +
          `     Grand Total     : ৳${grandTotal}\n` +
          `     Coupon Discount : ৳${couponDiscount}\n` +
          `     Checkout Price  : ৳${checkoutFinalPrice}`
        );

        // ✅ Grand Total must be > 0
        expect(
          grandTotal,
          `❌ [${coupon.id}] Grand Total on booking page is 0 or missing!`
        ).toBeGreaterThan(0);

        // ✅ Grand Total must match checkout final price (±৳5 tolerance)
        expect(
          Math.abs(grandTotal - checkoutFinalPrice),
          `❌ [${coupon.id}] Price mismatch! ` +
          `Checkout showed ৳${checkoutFinalPrice} but booking page shows ৳${grandTotal}`
        ).toBeLessThanOrEqual(5);

        // ✅ Discount amount verification by coupon type
        if (coupon.type === 'fixed' && coupon.discount) {
          // Fixed coupons — exact amount (±৳5)
          expect(
            Math.abs(couponDiscount - coupon.discount),
            `❌ [${coupon.id}] Fixed discount wrong on booking page! ` +
            `Expected ৳${coupon.discount}, got ৳${couponDiscount}`
          ).toBeLessThanOrEqual(5);

          console.log(`  ✅ Fixed discount ৳${couponDiscount} matches expected ৳${coupon.discount}`);
        }

        if (coupon.type === 'percentage') {
          // Percentage coupons — realistic range check (5%–15% of initial fare)
          const minExpected = initialPrice * 0.05;
          const maxExpected = initialPrice * 0.15;
          expect(
            couponDiscount,
            `❌ [${coupon.id}] Percentage discount out of range on booking page! Got ৳${couponDiscount}`
          ).toBeGreaterThanOrEqual(minExpected);
          expect(
            couponDiscount,
            `❌ [${coupon.id}] Percentage discount unrealistically high! Got ৳${couponDiscount}`
          ).toBeLessThanOrEqual(maxExpected);

          console.log(`  ✅ Percentage discount ৳${couponDiscount} is within expected range`);
        }

        // ── Step 8: Invoice Reconciliation — Grand Total == Invoice Amount ────
        console.log(`  → Checking Invoice tab reconciliation...`);
        const reconciliation = await bookingDetailsPage.verifyInvoiceMatchesGrandTotal();

        expect(
          reconciliation.passed,
          `❌ [${coupon.id}] Invoice mismatch after coupon! ` +
          `Grand Total ৳${reconciliation.grandTotal} ≠ Invoice ৳${reconciliation.invoiceAmount}`
        ).toBe(true);

        console.log(
          `  ✅ [${coupon.id}] ALL CHECKS PASSED\n` +
          `     Booking ID    : ${bookingId}\n` +
          `     Grand Total   : ৳${grandTotal}\n` +
          `     Discount      : ৳${couponDiscount}\n` +
          `     Invoice match : ✅`
        );
      }
    );
  }

  test.afterEach(async ({ context }) => {
    const pages = context.pages();
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close().catch(() => {});
    }
  });
});
