import { test, expect } from '../../../fixtures/hotelFixture.js';
import { hotelSearchData, hotelGuestData } from '../../../data/testData.js';

// ─────────────────────────────────────────────────────────────────────────
// 🔥 Hotel Smoke Suite
// Runs on every deploy (CI). Only the most critical happy-path checks.
// Target: ~5 minutes total.
// Tags: @smoke @critical
// ─────────────────────────────────────────────────────────────────────────

test.describe('Hotel Smoke Suite — Critical Path (@smoke @critical)', () => {
  test.setTimeout(60000);

  test('HTL-SMOKE-01: Hotel tab is visible and search renders results @smoke @critical',
    async ({ hotelSearchPage }) => {
      await hotelSearchPage.page.goto('/');
      await hotelSearchPage.goToHotelTab();
      await hotelSearchPage.selectDestination(hotelSearchData.destinationQuery, hotelSearchData.destinationDisplay);
      await hotelSearchPage.selectDates();
      await hotelSearchPage.clickSearch();

      const resultCard = hotelSearchPage.page.locator(
        '.hotel-card, .hotel-item, .card, [data-hotel-id], .hotel-listing-item'
      ).first();
      await expect(resultCard).toBeVisible({ timeout: 35000 });
    }
  );

  test('HTL-SMOKE-02: Full E2E Hotel Booking Happy Path — Search to Tracking ID @smoke @critical',
    async ({
      hotelSearchPage,
      hotelDetailsPage,
      hotelGuestFormPage,
      hotelBookingConfirmationPage,
    }) => {
      test.setTimeout(180000); // 3 min — supplier API can be slow

      // Step 1: Search
      await hotelSearchPage.page.goto('/');
      await hotelSearchPage.performSearch(
        hotelSearchData.destinationQuery,
        hotelSearchData.destinationDisplay,
        hotelSearchData.checkInDateLabel,
        hotelSearchData.checkOutDateLabel
      );

      // Step 2: Open Hotel Details (retry card #2 if card #1 rates expired)
      let detailPage = await hotelDetailsPage.openHotelDetailsTab(0);
      let success = await hotelDetailsPage.selectFirstRoom(detailPage);

      if (!success) {
        console.log('⚠️ Card #1 rates expired. Retrying with Card #2...');
        await detailPage.close().catch(() => {});
        detailPage = await hotelDetailsPage.openHotelDetailsTab(1);
        success = await hotelDetailsPage.selectFirstRoom(detailPage);
      }

      expect(success, 'Should be able to select a room on at least one hotel card').toBeTruthy();

      // Step 3: Guest details
      await hotelGuestFormPage.fillGuestDetails(
        detailPage,
        hotelGuestData.firstName,
        hotelGuestData.lastName
      );

      // Step 4: Terms & Pay
      await hotelGuestFormPage.acceptTermsAndConditions(detailPage);
      await hotelGuestFormPage.clickPayAndReserve(detailPage);

      // Step 5: Confirm
      const trackingId = await hotelBookingConfirmationPage.verifyBookingSuccess(detailPage);
      expect(trackingId, 'Booking Tracking ID must be present').toBeTruthy();
      console.log(`✅ Smoke booking confirmed! Tracking ID: ${trackingId}`);

      await detailPage.close().catch(() => {});
    }
  );
});
