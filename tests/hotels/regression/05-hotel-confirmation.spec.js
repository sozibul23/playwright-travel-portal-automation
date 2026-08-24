import { test, expect } from '../../../fixtures/hotelFixture.js';
import { hotelSearchData, hotelGuestData } from '../../../data/testData.js';

// ─────────────────────────────────────────────────────────────────────────
// Sprint 4 — Hotel Booking Confirmation Suite (HTL-37 → HTL-44)
// Tags: @critical, @regression
// ─────────────────────────────────────────────────────────────────────────

test.describe('Sprint 4 — Hotel Booking Confirmation Suite (HTL-37 → HTL-44)', () => {
  test.setTimeout(300000); // 5 min

  // ── Shared helper: search → room select → guest fill → pay ────────────
  async function reachConfirmationPage(hotelSearchPage, hotelDetailsPage, hotelGuestFormPage) {
    await hotelSearchPage.page.goto('/');
    await hotelSearchPage.performSearch(
      hotelSearchData.destinationQuery,
      hotelSearchData.destinationDisplay,
      hotelSearchData.checkInDateLabel,
      hotelSearchData.checkOutDateLabel
    );

    let detailPage = null;
    let success = false;

    for (let cardIdx = 0; cardIdx < 3 && !success; cardIdx++) {
      if (cardIdx > 0) {
        if (detailPage && !detailPage.isClosed()) await detailPage.close().catch(() => {});
        await hotelSearchPage.page.bringToFront().catch(() => {});
      }
      detailPage = await hotelDetailsPage.openHotelDetailsTab(cardIdx);
      if (!detailPage) return null;
      success = await hotelDetailsPage.selectFirstRoom(detailPage);
    }

    if (!success) return null;

    await hotelGuestFormPage.fillGuestDetails(detailPage, hotelGuestData.firstName, hotelGuestData.lastName);
    await hotelGuestFormPage.acceptTermsAndConditions(detailPage);
    await hotelGuestFormPage.clickPayAndReserve(detailPage);

    return detailPage;
  }

  // ── @critical ─────────────────────────────────────────────────────────
  test('HTL-37: Booking confirmation page shows a Tracking ID @critical',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      const detailPage = await reachConfirmationPage(hotelSearchPage, hotelDetailsPage, hotelGuestFormPage);
      if (!detailPage) {
        test.skip(true, 'Could not reach confirmation page — all rates expired.');
        return;
      }

      const trackingId = await hotelBookingConfirmationPage.verifyBookingSuccess(detailPage);
      expect(trackingId, 'Booking Tracking ID must be present after successful payment').toBeTruthy();
      console.log(`✅ HTL-37: Tracking ID confirmed: ${trackingId}`);

      await detailPage.close().catch(() => {});
    }
  );

  test('HTL-38: Booking confirmation URL contains booking_tracking_id parameter @critical',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      const detailPage = await reachConfirmationPage(hotelSearchPage, hotelDetailsPage, hotelGuestFormPage);
      if (!detailPage) {
        test.skip(true, 'Could not reach confirmation page — all rates expired.');
        return;
      }

      await hotelBookingConfirmationPage.verifyBookingSuccess(detailPage);
      expect(detailPage.url()).toContain('booking_tracking_id');
      console.log(`✅ HTL-38: URL contains tracking ID: ${detailPage.url()}`);

      await detailPage.close().catch(() => {});
    }
  );

  // ── @regression ───────────────────────────────────────────────────────
  test('HTL-39: Hotel Voucher download button is present on confirmation page @regression',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      const detailPage = await reachConfirmationPage(hotelSearchPage, hotelDetailsPage, hotelGuestFormPage);
      if (!detailPage) {
        test.skip(true, 'Could not reach confirmation page — all rates expired.');
        return;
      }

      await hotelBookingConfirmationPage.verifyBookingSuccess(detailPage);

      const voucherBtn = detailPage.getByRole('button', { name: /voucher|download|print/i })
        .or(detailPage.locator('a:has-text("Voucher"), a:has-text("Download"), button:has-text("Voucher")'))
        .first();

      const isVisible = await voucherBtn.isVisible({ timeout: 10000 }).catch(() => false);
      expect(isVisible, 'Voucher/Download button should be visible on confirmation page').toBe(true);

      await detailPage.close().catch(() => {});
    }
  );

  test('HTL-40: Hotel Voucher opens or downloads successfully @regression',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      const detailPage = await reachConfirmationPage(hotelSearchPage, hotelDetailsPage, hotelGuestFormPage);
      if (!detailPage) {
        test.skip(true, 'Could not reach confirmation page — all rates expired.');
        return;
      }

      await hotelBookingConfirmationPage.verifyBookingSuccess(detailPage);
      const voucherPage = await hotelBookingConfirmationPage.downloadHotelVoucher(detailPage);
      expect(voucherPage, 'Voucher page or download should be triggered').toBeTruthy();
      console.log('✅ HTL-40: Hotel Voucher generated successfully.');

      await detailPage.close().catch(() => {});
      if (voucherPage && voucherPage !== detailPage) {
        await voucherPage.close().catch(() => {});
      }
    }
  );
});
