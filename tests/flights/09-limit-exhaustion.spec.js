import { test, expect } from '../../fixtures/authFixture.js';
import { FlightSearchPage } from '../../pages/FlightSearchPage.js';
import { FlightResultsPage } from '../../pages/FlightResultsPage.js';
import { PassengerDetailsPage } from '../../pages/PassengerDetailsPage.js';
import { FlightBookingDetailsPage } from '../../pages/FlightBookingDetailsPage.js';
import { generateRandomPassenger } from '../../data/testData.js';

// ─────────────────────────────────────────────────────────────────────────────
// 🔁 B2B Flight Coupon — Usage Limit Exhaustion Cycle (Real E2E)
// Tags: @coupon @limit @exhaustion @e2e @b2b
//
// Assumption: LIMIT1 is configured in admin with a global usage cap of N.
// This test:
//   1. Applies LIMIT1 and completes N real Hold Bookings  (exhaust the limit)
//   2. On attempt N+1 verifies the coupon is fully blocked (price unchanged)
//
// ⚠️  Before each run:
//     - Set LIMIT1_MAX_USES to match the admin-configured cap.
//     - Reset the coupon usage counter from the admin panel to 0.
// ─────────────────────────────────────────────────────────────────────────────

const COUPON_CODE = 'LIMIT01';
const LIMIT1_MAX_USES = 1;   // ← change to match admin config (e.g. 1, 2, 3…)

const ROUTE = {
  originCode: 'dac',
  originDisplay: 'Dhaka',
  destinationCode: 'cxb',
  destinationDisplay: 'Cox',
  supplier: 'sabre itt sandbox',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper — search flight → select → open passenger form in a fresh tab
// ─────────────────────────────────────────────────────────────────────────────
async function openCheckoutForm(page, supplierConfig) {
  await page.goto('https://b2b.innovatedemo.com');
  await page.waitForLoadState('domcontentloaded');

  // Dismiss promo modal if present
  const promoModal = page.locator('dialog[open], .modal[open], .modal.modal-open').first();
  if (await promoModal.isVisible({ timeout: 3000 }).catch(() => false)) {
    const closeBtn = promoModal
      .locator('button.btn-circle, button:has-text("✕"), button:has-text("Close")')
      .first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => { });
    } else {
      await page.keyboard.press('Escape').catch(() => { });
    }
    await promoModal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => { });
  }

  const searchPage = new FlightSearchPage(page);
  const resultsPage = new FlightResultsPage(page);

  await searchPage.selectOneWay();
  await searchPage.setOriginByText(ROUTE.originCode, ROUTE.originDisplay);
  await searchPage.setDestinationByText(ROUTE.destinationCode, ROUTE.destinationDisplay);
  await searchPage.setDepartureDate(supplierConfig?.oneWay?.departureDate || '2026-09-17');
  await searchPage.selectSupplier(ROUTE.supplier);
  await searchPage.search();

  const formPage = await resultsPage.selectAndBookFlight({ isRoundTrip: false });
  await formPage.bringToFront().catch(() => { });
  await formPage.waitForLoadState('domcontentloaded').catch(() => { });
  await formPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

  return formPage;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — fill passenger → clickNext → acceptTermsAndHoldFlight
//          returns booking ID string, or null on failure
// ─────────────────────────────────────────────────────────────────────────────
async function completeHoldBooking(formPage) {
  const passengerPage = new PassengerDetailsPage(formPage);

  await passengerPage.fillPassengerInfo(generateRandomPassenger());
  await passengerPage.clickNext();
  await passengerPage.acceptTermsAndHoldFlight();

  const bookingDetailsPage = new FlightBookingDetailsPage(formPage);
  const arrived = await bookingDetailsPage
    .waitForBookingDetailsPage(60000)
    .then(() => true)
    .catch(() => false);

  if (!arrived) return null;
  return bookingDetailsPage.getBookingId().catch(() => null);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEST
// ─────────────────────────────────────────────────────────────────────────────
test.describe(`B2B — ${COUPON_CODE} Usage Limit Exhaustion Cycle (@coupon @limit @exhaustion @e2e)`, () => {
  test.setTimeout(600000); // 10 min — N real bookings take time

  test(
    `TC-LIMIT-CYCLE: Apply ${COUPON_CODE} ${LIMIT1_MAX_USES}x (exhaust limit), then verify N+1 is blocked`,
    async ({ page, supplierConfig }) => {

      const completedBookings = []; // booking IDs from exhaustion phase
      const cycleLog = []; // full result log per attempt

      // ════════════════════════════════════════════════════════════════════
      // PHASE 1 — Exhaust the usage limit (N successful Hold Bookings)
      // ════════════════════════════════════════════════════════════════════
      console.log(`\n${'═'.repeat(65)}`);
      console.log(`🔁 PHASE 1 — Exhaust ${COUPON_CODE} with ${LIMIT1_MAX_USES} real booking(s)`);
      console.log(`${'═'.repeat(65)}`);

      for (let attempt = 1; attempt <= LIMIT1_MAX_USES; attempt++) {
        console.log(`\n--- Attempt ${attempt} of ${LIMIT1_MAX_USES} ---`);

        const formPage = await openCheckoutForm(page, supplierConfig);
        const passengerPage = new PassengerDetailsPage(formPage);

        const initialPrice = await passengerPage.getTotalPayable();
        console.log(`  Initial price : ৳${initialPrice}`);

        // Apply coupon
        const result = await passengerPage.applyCoupon(COUPON_CODE);
        console.log(
          `  Applied       : ${result.applied}\n` +
          `  Price change  : ৳${result.priceBefore} → ৳${result.priceAfter}  (discount ৳${result.discountAmount})\n` +
          `  Toast         : "${result.toastMessage.trim().substring(0, 100)}"`
        );

        // ✅ ASSERT — coupon must be valid during exhaustion phase
        expect(
          result.applied,
          `❌ [Attempt ${attempt}/${LIMIT1_MAX_USES}] ${COUPON_CODE} was REJECTED before the limit was reached!\n` +
          `   Price unchanged. Toast: "${result.toastMessage}"\n` +
          `   → Did you reset the usage counter in the admin panel before running?`
        ).toBe(true);

        expect(result.priceAfter, 'Discounted price must be ≥ 0').toBeGreaterThanOrEqual(0);

        // Complete real Hold Booking → uses one slot from the limit counter
        console.log(`  → Completing Hold Booking (consumes 1 usage slot)...`);
        const bookingId = await completeHoldBooking(formPage);
        completedBookings.push(bookingId ?? `attempt-${attempt}-no-id`);
        console.log(`  ✅ Booking done! ID: ${bookingId ?? 'N/A'}`);

        cycleLog.push({ attempt, phase: 'exhaust', ...result, bookingId });

        // Close tabs spawned by booking flow
        const extras = (await page.context().pages()).filter(p => p !== page);
        for (const p of extras) await p.close().catch(() => { });
      }

      console.log(`\n✅ PHASE 1 complete — ${LIMIT1_MAX_USES} booking(s) done.`);
      console.log(`   Booking IDs: ${completedBookings.join(' | ')}`);

      // ════════════════════════════════════════════════════════════════════
      // PHASE 2 — N+1 attempt: limit is exhausted, must be blocked
      // ════════════════════════════════════════════════════════════════════
      const blockAttempt = LIMIT1_MAX_USES + 1;
      console.log(`\n${'═'.repeat(65)}`);
      console.log(`🚫 PHASE 2 — Attempt #${blockAttempt}: coupon MUST be blocked now`);
      console.log(`${'═'.repeat(65)}`);

      const blockFormPage = await openCheckoutForm(page, supplierConfig);
      const blockPassPage = new PassengerDetailsPage(blockFormPage);

      const priceBeforeBlock = await blockPassPage.getTotalPayable();
      console.log(`  Initial price : ৳${priceBeforeBlock}`);

      const blockResult = await blockPassPage.applyCoupon(COUPON_CODE);
      console.log(
        `  Applied       : ${blockResult.applied}\n` +
        `  Price change  : ৳${blockResult.priceBefore} → ৳${blockResult.priceAfter}  (discount ৳${blockResult.discountAmount})\n` +
        `  Toast         : "${blockResult.toastMessage.trim().substring(0, 120)}"`
      );

      cycleLog.push({ attempt: blockAttempt, phase: 'block', ...blockResult });

      // ✅ CRITICAL ASSERTION — price MUST NOT drop on N+1
      expect(
        blockResult.discountAmount,
        `❌ [USAGE LIMIT BUG] ${COUPON_CODE} was accepted on attempt #${blockAttempt} ` +
        `even though the global usage limit (${LIMIT1_MAX_USES}) was already exhausted!\n` +
        `   Price dropped by ৳${blockResult.discountAmount}. ` +
        `Backend is NOT enforcing the usage cap.`
      ).toBeLessThanOrEqual(5); // ≤ ৳5 rounding noise allowed

      // ✅ UX check — portal should show a human-readable rejection message
      const rejectionPattern = /limit|exceeded|already used|redeemed|maximum|exhausted|not found|invalid/i;
      const hasRejectionMsg = rejectionPattern.test(blockResult.toastMessage);

      if (!hasRejectionMsg) {
        console.warn(
          `  ⚠️  [UX Warning] Coupon correctly blocked (no price drop) ✅\n` +
          `      BUT no clear rejection message shown to user.\n` +
          `      Toast: "${blockResult.toastMessage}" — raise UX bug separately.`
        );
      } else {
        console.log(`  ✅ Rejection message shown: "${blockResult.toastMessage.trim().substring(0, 100)}"`);
      }

      // ════════════════════════════════════════════════════════════════════
      // FINAL SUMMARY
      // ════════════════════════════════════════════════════════════════════
      const blocked = blockResult.discountAmount <= 5;
      const hasUxMsg = hasRejectionMsg;

      console.log(`\n${'═'.repeat(65)}`);
      console.log(`📋 LIMIT EXHAUSTION CYCLE — SUMMARY`);
      console.log(`${'═'.repeat(65)}`);
      console.log(`  Coupon           : ${COUPON_CODE}`);
      console.log(`  Admin limit cap  : ${LIMIT1_MAX_USES} use(s)`);
      console.log(`  Bookings done    : ${completedBookings.length}  → IDs: ${completedBookings.join(', ')}`);
      console.log(`  N+1 blocked?     : ${blocked ? '✅ YES (backend enforcing limit)' : '❌ NO  (BUG — limit not enforced!)'}`);
      console.log(`  UX message shown?: ${hasUxMsg ? '✅ YES' : '⚠️  NO  (UX issue — silent rejection)'}`);
      console.log(`${'═'.repeat(65)}\n`);
    }
  );

  test.afterEach(async ({ context }) => {
    const pages = context.pages();
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close().catch(() => { });
    }
  });
});



