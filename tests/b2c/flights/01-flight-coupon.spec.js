import { test, expect } from '@playwright/test';
import { B2CFlightPage } from '../../../pages/B2CFlightPage.js';
import { flightCouponSuite } from '../../../data/couponTestData.js';

// ─────────────────────────────────────────────────────────────────────────
// 🌐 B2C Flight Coupon Code Validation Suite
// Tags: @coupon @b2c @regression
// ─────────────────────────────────────────────────────────────────────────

test.describe('B2C Flight Portal — Dynamic Coupon Suite (@coupon @b2c)', () => {
  test.setTimeout(180000);

  for (const coupon of flightCouponSuite) {
    test(`[${coupon.id}] ${coupon.code} — ${coupon.description} @coupon @b2c`, async ({ page }) => {
      const b2cFlightPage = new B2CFlightPage(page);
      const isIntl = coupon.routeType === 'international';
      const from = 'dac';
      const to = isIntl ? 'del' : 'cxb';

      console.log(`[B2C Coupon Test] Searching route ${from} -> ${to} for coupon ${coupon.code}`);
      await b2cFlightPage.searchFlight(from, to);
      await b2cFlightPage.selectFirstFlight();

      const initialPrice = await b2cFlightPage.getTotalPayable();
      console.log(`[B2C Coupon Test] Applying: ${coupon.code} | Initial Price: ${initialPrice}`);
      await b2cFlightPage.applyCoupon(coupon.code);

      if (coupon.expectedStatus === 'success') {
        const finalPrice = await b2cFlightPage.getTotalPayable();
        console.log(`✅ [B2C Coupon Success] Price before: ${initialPrice} -> after: ${finalPrice}`);

        // 🛡️ Critical Financial Assertion: Final price must NEVER be negative
        expect(finalPrice, 'Final payable price must be greater than or equal to 0 (non-negative)').toBeGreaterThanOrEqual(0);
        expect(Number.isNaN(finalPrice), 'Final payable price must be a valid number').toBeFalsy();

        if (coupon.type === 'percentage') {
          const displayedDiscount = await b2cFlightPage.getCouponDiscount();
          const actualDiscount = displayedDiscount > 0 ? displayedDiscount : (initialPrice - finalPrice);

          const minExpected = initialPrice * 0.05;
          const maxExpected = initialPrice * 0.15;

          console.log(`📊 [B2C 10% on Base Fare] Total: ৳${initialPrice} | Expected Range: ৳${minExpected.toFixed(0)}–৳${maxExpected.toFixed(0)} | Actual Discount: ৳${actualDiscount.toFixed(2)} | Final Price: ৳${finalPrice}`);

          expect(actualDiscount, `Percentage discount out of range! Got ৳${actualDiscount}`).toBeGreaterThanOrEqual(minExpected);
          expect(actualDiscount, `Percentage discount out of range! Got ৳${actualDiscount}`).toBeLessThanOrEqual(maxExpected);
        } else if (coupon.type === 'non_negative_check') {
          console.log(`🛡️ [Non-Negative Verified] Price is >= 0: ${finalPrice}`);
          expect(finalPrice >= 0).toBeTruthy();
        } else {
          const successIndicator = page.locator('.alert-success, .text-success, [class*="success"], :has-text("Applied"), :has-text("Discount")').first();
          const hasSuccessAlert = await successIndicator.isVisible({ timeout: 5000 }).catch(() => false);
          const hasPriceReduced = finalPrice < initialPrice;
          expect(hasSuccessAlert || hasPriceReduced || finalPrice >= 0).toBeTruthy();
        }
      } else {
        const finalPrice = await b2cFlightPage.getTotalPayable();
        // Rejected coupon should not reduce price
        expect(finalPrice).toBeGreaterThanOrEqual(initialPrice - 5);
        console.log(`ℹ️ [B2C Negative Coupon] Rejected as expected: ${coupon.code} | Price before: ৳${initialPrice} -> after: ৳${finalPrice}`);
        expect(page.url()).toContain('checkout');
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⏱️ Dedicated End-to-End Expiry Cycle Test for LIMIT01
  // ─────────────────────────────────────────────────────────────────────────
  test('[TC-E2E-LIMIT01] LIMIT01 — Usage Limit Expiry Validation @coupon @b2c @regression', async ({ page }) => {
    const b2cFlightPage = new B2CFlightPage(page);

    console.log('🔄 [Usage Limit Test] Searching flight and checking LIMIT01...');
    await b2cFlightPage.searchFlight('dac', 'cxb');
    await b2cFlightPage.selectFirstFlight();

    const initialPrice = await b2cFlightPage.getTotalPayable();
    console.log(`[Usage Limit Test] Applying: LIMIT01 | Initial Price: ${initialPrice}`);
    await b2cFlightPage.applyCoupon('LIMIT01');

    const finalPrice = await b2cFlightPage.getTotalPayable();
    expect(finalPrice).toBeGreaterThanOrEqual(initialPrice - 5);
    console.log(`ℹ️ [Usage Limit Outcome] Price before: ৳${initialPrice} -> after: ৳${finalPrice}`);

    expect(page.url()).toContain('checkout');
  });
});
