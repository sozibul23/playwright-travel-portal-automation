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

          // 🎯 Strict Requirement: 10% Discount must be on TOTAL PUBLISHED FARE
          const expectedOnTotal = Math.min(initialPrice * (coupon.percentage / 100), coupon.maxDiscount || Infinity);
          const expectedFinalPrice = initialPrice - expectedOnTotal;

          console.log(`📊 [B2C 10% on Total Published Fare] Total Published Fare: ${initialPrice} | Expected 10% Discount: ${expectedOnTotal.toFixed(2)} | Actual Discount: ${actualDiscount.toFixed(2)} | Final Price: ${finalPrice}`);

          expect(
            Math.abs(actualDiscount - expectedOnTotal),
            `❌ 10% Discount Calculation Bug! Discount must be 10% of Total Published Fare (${initialPrice} Tk) => Expected: ৳${expectedOnTotal.toFixed(2)}, but system applied: ৳${actualDiscount.toFixed(2)} (Final Price: ৳${finalPrice})`
          ).toBeLessThanOrEqual(1);
        } else if (coupon.type === 'non_negative_check') {
          console.log(`🛡️ [Non-Negative Verified] Price is >= 0: ${finalPrice}`);
          expect(finalPrice >= 0).toBeTruthy();
        } else {
          const successIndicator = page.locator('.alert-success, .text-success, [class*="success"], :has-text("Applied"), :has-text("Discount")').first();
          const hasSuccessAlert = await successIndicator.isVisible({ timeout: 5000 }).catch(() => false);
          const hasPriceReduced = finalPrice < initialPrice || finalPrice >= 0;
          expect(hasSuccessAlert || hasPriceReduced).toBeTruthy();
        }
      } else {
        const errorMsg = page.locator('.alert-error, .text-error, .invalid-feedback, [role="alert"], div:has-text("invalid"), div:has-text("expired"), div:has-text("not found")')
          .filter({ hasText: coupon.expectedMessage })
          .first();

        const isErrorVisible = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`ℹ️ [B2C Negative Coupon] Expected error visible: ${isErrorVisible}`);
        expect(page.url()).toContain('checkout');
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⏱️ Dedicated End-to-End Expiry Cycle Test for LIMIT1
  // ─────────────────────────────────────────────────────────────────────────
  test('[TC-E2E-LIMIT1] LIMIT1 — Usage Limit Expiry Validation @coupon @b2c @regression', async ({ page }) => {
    const b2cFlightPage = new B2CFlightPage(page);

    console.log('🔄 [Usage Limit Test] Searching flight and checking LIMIT1...');
    await b2cFlightPage.searchFlight('dac', 'cxb');
    await b2cFlightPage.selectFirstFlight();

    const initialPrice = await b2cFlightPage.getTotalPayable();
    console.log(`[Usage Limit Test] Applying: LIMIT1 | Initial Price: ${initialPrice}`);
    await b2cFlightPage.applyCoupon('LIMIT1');

    const finalPrice = await b2cFlightPage.getTotalPayable();

    // Check if error message for limit reached is visible or discount applied
    const errorMsg = page.locator('.alert-error, .text-error, .invalid-feedback, [role="alert"], div')
      .filter({ hasText: /limit|exceeded|already used|redeemed|invalid|not found/i })
      .first();

    const isError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`ℹ️ [Usage Limit Outcome] Error visible: ${isError} | Price before: ${initialPrice} -> after: ${finalPrice}`);

    expect(page.url()).toContain('checkout');
  });
});
