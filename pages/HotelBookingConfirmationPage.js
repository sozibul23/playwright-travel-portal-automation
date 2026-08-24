import { BasePage } from './BasePage.js';

export class HotelBookingConfirmationPage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Finalize booking on the checkout page if a final confirm/pay button exists
   * @param {Page} detailPage - Detail page popup tab
   */
  async confirmCheckoutBooking(detailPage) {
    if (!detailPage || detailPage.isClosed()) return;
    await detailPage.waitForLoadState('domcontentloaded').catch(() => {});

    // Dismiss open 401 or error modal if present before confirming
    const closeBtn = detailPage.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle, .modal button:has-text("Close"), dialog button:has-text("Close"), .modal-box button:has-text("✕")')
      .filter({ visible: true })
      .first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('⚠️ Dismissing open 401/error modal on checkout page...');
      await closeBtn.click({ force: true }).catch(() => closeBtn.evaluate(el => el.click())).catch(() => {});
      await detailPage.waitForTimeout(600).catch(() => {});
    }

    // Ensure terms & conditions / package deal checkboxes are checked (excluding Special Requests)
    const termsCheckboxes = detailPage.getByRole('checkbox', { name: /Terms|Condition|Agree|Understand|Accept|Policy|Package/i })
      .or(detailPage.locator('input[type="checkbox"][name*="term"], input[type="checkbox"][name*="policy"], input[type="checkbox"][name*="package"]'))
      .filter({ visible: true });

    const termsCount = await termsCheckboxes.count().catch(() => 0);
    for (let i = 0; i < termsCount; i++) {
      const cb = termsCheckboxes.nth(i);
      const isChecked = await cb.isChecked().catch(() => false);
      if (!isChecked) {
        await cb.check({ force: true }).catch(async () => {
          await cb.click({ force: true }).catch(() => {});
        });
      }
    }

    // Look for Pay and Reserve / Hold Booking / final confirmation button
    const confirmBtn = detailPage.getByRole('button', { name: /Pay and Reserve|Pay & Reserve|Hold Booking|Hold|Confirm Booking|Confirm & Pay/i })
      .or(detailPage.locator('button:has-text("Pay and Reserve")'))
      .or(detailPage.locator('button:has-text("Hold Booking")'))
      .or(detailPage.locator('button:has-text("Pay & Reserve")'))
      .filter({ visible: true })
      .first();

    if (await confirmBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('Clicking Pay and Reserve / Hold Booking button on checkout page...');
      await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
      await confirmBtn.click({ force: true }).catch(() => {});
      await detailPage.waitForTimeout(3000).catch(() => {});
    }
  }

  /**
   * Verify booking success and retrieve the tracking ID.
   *
   * Portal success pattern (observed): The page stays on /hotel/checkout but appends
   * ?booking_tracking_id=... to the URL. A redirect to /booking-details/ may or may
   * not happen. We check for the tracking ID param FIRST before evaluating the URL path.
   *
   * @param {Page} detailPage - Detail page popup tab
   * @returns {Promise<string>} Real booking tracking / PNR ID
   */
  async verifyBookingSuccess(detailPage) {
    if (!detailPage || detailPage.isClosed()) {
      throw new Error(
        '[BOOKING FAILED] Detail page was closed before booking confirmation was reached. ' +
        'The booking did not complete successfully.'
      );
    }

    console.log('Waiting up to 60s for booking confirmation & status...');

    // Complete final confirmation click if the Pay/Hold button is still visible
    await this.confirmCheckoutBooking(detailPage).catch(err =>
      console.warn(`[WARN] confirmCheckoutBooking error: ${err.message}`)
    );

    // Helper: extract tracking ID from URL query params
    const extractTrackingId = (url) => {
      try {
        const u = new URL(url);
        return u.searchParams.get('booking_tracking_id')
          || u.searchParams.get('tracking_id')
          || u.searchParams.get('pnr')
          || null;
      } catch {
        return null;
      }
    };

    // Wait for the portal to either:
    //  (a) redirect to /booking-details/ or /bookings, OR
    //  (b) stay on /hotel/checkout but append ?booking_tracking_id=... to the URL, OR
    //  (c) show a visible confirmation text on the page
    await Promise.race([
      detailPage.waitForURL(
        url => url.pathname.includes('/booking-details') || url.pathname.includes('/bookings'),
        { timeout: 60000 }
      ).catch(() => {}),
      detailPage.waitForURL(
        url => extractTrackingId(url.toString()) !== null,
        { timeout: 60000 }
      ).catch(() => {}),
      detailPage.getByText(/Booking Confirmed|Confirmed|Booking Details|Download Voucher|Booking Status|Hold Booking/i)
        .first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {})
    ]);

    if (!detailPage || detailPage.isClosed()) {
      throw new Error(
        '[BOOKING FAILED] Detail page closed unexpectedly during confirmation wait. ' +
        'Booking status is unknown — treat as failed.'
      );
    }

    let currentURL = detailPage.url();
    console.log(`Current Page URL after reserve attempt: ${currentURL}`);

    // ── PRIORITY CHECK: Does the URL already contain a tracking ID? ──────────────
    // The portal often stays on /hotel/checkout but adds ?booking_tracking_id=... as
    // its success signal. If it's already there, the booking succeeded — return it.
    let trackingId = extractTrackingId(currentURL);
    if (trackingId) {
      console.log(`✅ Booking confirmed. Tracking ID found in URL: ${trackingId}`);
      return trackingId;
    }

    // ── RETRY: If no tracking ID yet and still on checkout, retry the Pay click ──
    if (currentURL.includes('/hotel/checkout')) {
      console.log('No tracking ID in URL yet — retrying Pay and Reserve / Hold Booking click...');
      await this.confirmCheckoutBooking(detailPage).catch(err =>
        console.warn(`[WARN] Retry confirmCheckoutBooking error: ${err.message}`)
      );

      // Wait again — portal may update URL after retry
      await detailPage.waitForURL(
        url => extractTrackingId(url.toString()) !== null,
        { timeout: 30000 }
      ).catch(() => {});

      if (!detailPage.isClosed()) {
        currentURL = detailPage.url();
        trackingId = extractTrackingId(currentURL);
      }
    }

    // ── FINAL: Still no tracking ID? Check page DOM as last resort ───────────────
    if (!trackingId) {
      const pageIdEl = detailPage.locator(
        '[data-tracking-id], [data-booking-id], .booking-id, .tracking-id, .pnr'
      ).first();
      const elVisible = await pageIdEl.isVisible({ timeout: 5000 }).catch(() => false);
      if (elVisible) {
        trackingId = (await pageIdEl.textContent().catch(() => null))?.trim() || null;
      }
    }

    if (!trackingId) {
      throw new Error(
        `[BOOKING FAILED] No booking tracking ID found after full confirmation wait. ` +
        `Final URL: ${currentURL} — The booking may have failed at the payment stage. ` +
        `Check the 401/error modals in the console output above for the root cause.`
      );
    }

    console.log(`✅ Booking confirmed. Tracking ID: ${trackingId}`);
    return trackingId;
  }

  /**
   * Click Hotel Voucher link or Issue Voucher button, wait for popup/confirmation, and select fare options
   * @param {Page} detailPage - Detail page popup tab
   * @returns {Promise<Page>} Voucher popup tab instance
   */
  async downloadHotelVoucher(detailPage) {
    if (!detailPage || detailPage.isClosed()) return detailPage;

    // 1. Check if an "Issue Voucher" button is present (for held bookings)
    const issueVoucherBtn = detailPage.getByRole('button', { name: 'Issue Voucher', exact: true })
      .or(detailPage.locator('button:has-text("Issue Voucher")'))
      .filter({ visible: true })
      .first();

    if (await issueVoucherBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('Clicking Issue Voucher button on booking details page...');
      await issueVoucherBtn.click({ force: true }).catch(() => issueVoucherBtn.evaluate(el => el.click()));
      await detailPage.waitForTimeout(1000).catch(() => {});

      const confirmIssueBtn = detailPage.getByRole('button', { name: 'Issue Voucher - Confirm' })
        .or(detailPage.locator('button:has-text("Issue Voucher - Confirm")'))
        .filter({ visible: true })
        .first();

      if (await confirmIssueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Clicking Issue Voucher - Confirm button...');
        await confirmIssueBtn.click({ force: true }).catch(() => confirmIssueBtn.evaluate(el => el.click()));
        await detailPage.waitForTimeout(3000).catch(() => {});
      }
    }

    // 2. Locate downloadable Hotel Voucher link
    const voucherLink = detailPage.getByRole('link', { name: 'Hotel Voucher' })
      .or(detailPage.locator('a:has-text("Voucher")'))
      .or(detailPage.locator('a:has-text("Hotel Voucher")'))
      .first();

    if (await voucherLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      const voucherPopupPromise = detailPage.waitForEvent('popup').catch(() => null);
      await voucherLink.click().catch(() => voucherLink.evaluate(el => el.click()));
      const voucherPage = await voucherPopupPromise;
      if (voucherPage) {
        await voucherPage.waitForLoadState('domcontentloaded').catch(() => {});

        const fareDropdown = voucherPage.getByRole('navigation').locator('select[name="fareDropdown"]')
          .or(voucherPage.locator('select[name="fareDropdown"]'))
          .first();

        if (await fareDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
          await fareDropdown.selectOption('with_fare').catch(() => {});
        }
        return voucherPage;
      }
    }
    
    return detailPage;
  }
}
