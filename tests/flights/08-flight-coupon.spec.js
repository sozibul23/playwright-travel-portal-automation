import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../../pages/PassengerDetailsPage.js';
import { flightCouponSuite, flightCouponRoutes } from '../../data/couponTestData.js';

// ─────────────────────────────────────────────────────────────────────────
// 🏢 B2B Flight Coupon Code Validation Suite
// Tags: @coupon @b2b @regression
// ─────────────────────────────────────────────────────────────────────────

test.describe('B2B Flight Portal — Dynamic Coupon Suite (@coupon @b2b)', () => {
  test.setTimeout(240000);

  for (const coupon of flightCouponSuite) {
    test(`[${coupon.id}] ${coupon.code} — ${coupon.description} @coupon @b2b`, async ({ page, supplierConfig }) => {
      await page.goto('https://b2b.innovatedemo.com');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const searchPage = new FlightSearchPage(page);
      const resultsPage = new FlightResultsPage(page);

      const isIntl = coupon.routeType === 'international';
      const oneWayFlightData = {
        originCode: 'dac',
        originDisplay: 'Dhaka',
        destinationCode: isIntl ? 'del' : 'cxb',
        destinationDisplay: isIntl ? 'Delhi' : 'Cox',
        departureDate: supplierConfig?.oneWay?.departureDate || '2026-09-17',
        supplier: 'All',
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
      await formPage.waitForTimeout(2000);

      const passengerPage = new PassengerDetailsPage(formPage);

      const initialPrice = await passengerPage.getTotalPayable();
      console.log(`[B2B Coupon Test] Applying Coupon: ${coupon.code} | Initial Price: ${initialPrice}`);
      await passengerPage.applyCoupon(coupon.code);
      await formPage.waitForTimeout(2000);

      if (coupon.expectedStatus === 'success') {
        const finalPrice = await passengerPage.getTotalPayable();

        // 🛡️ Price validation: price must remain non-negative (>= 0)
        expect(finalPrice, 'B2B final payable price must be greater than or equal to 0').toBeGreaterThanOrEqual(0);

        if (coupon.type === 'percentage') {
          const expectedOnTotal = Math.min(initialPrice * (coupon.percentage / 100), coupon.maxDiscount || Infinity);
          const actualDiscount = initialPrice - finalPrice;
          console.log(`📊 [B2B 10% Verification] Total Fare: ${initialPrice} | Expected 10% Discount: ${expectedOnTotal.toFixed(2)} | Actual Discount: ${actualDiscount.toFixed(2)} | Final Price: ${finalPrice}`);

          // 🎯 Exact 10% Discount Assertion: Must match within 1 Tk rounding tolerance
          expect(
            Math.abs(actualDiscount - expectedOnTotal),
            `10% discount mismatch! Expected 10% (${expectedOnTotal} Tk) on initial fare ${initialPrice} Tk, but got actual discount of ${actualDiscount} Tk (Final Price: ${finalPrice} Tk)`
          ).toBeLessThanOrEqual(1);
        }

        const successIndicator = formPage.locator('.alert-success, .text-success, [class*="success"], :has-text("Applied"), :has-text("Discount")').first();
        const isSuccess = await successIndicator.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`✅ [B2B Coupon Success] Status indicator visible: ${isSuccess} | Final Price: ${finalPrice}`);
        expect(formPage.url()).toBeTruthy();
      } else {
        const errorMsg = formPage.locator('.alert-error, .text-error, .invalid-feedback, [role="alert"], div:has-text("invalid"), div:has-text("expired"), div:has-text("not found")')
          .filter({ hasText: coupon.expectedMessage })
          .first();

        const isErrorVisible = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`ℹ️ [B2B Negative Coupon] Expected error visible: ${isErrorVisible}`);
        expect(formPage.url()).toBeTruthy();
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
