import { test, expect } from '../../../fixtures/hotelFixture.js';
import { hotelSearchData, hotelGuestData } from '../../../data/testData.js';

// ─────────────────────────────────────────────────────────────────────────
// Hotel Module — End-to-End Happy Path Suite
// Tags: @smoke @critical
// Covers: Search → Details → Room Select → Guest Form → Pay → Confirmation → Voucher
// ─────────────────────────────────────────────────────────────────────────

test.describe('Hotel Module — Happy Path End-to-End Suite', () => {

  test('HTL-E2E: Complete Hotel Search, Room Selection, Guest Checkout and Voucher Generation @smoke @critical',
    async ({
      hotelSearchPage,
      hotelDetailsPage,
      hotelGuestFormPage,
      hotelBookingConfirmationPage,
    }) => {
      test.setTimeout(180000); // 3 min — supplier API can be slow

      console.log('[Step 1] Navigating to Hotel Search and executing search query...');
      await hotelSearchPage.page.goto('/');
      await hotelSearchPage.performSearch(
        hotelSearchData.destinationQuery,
        hotelSearchData.destinationDisplay,
        hotelSearchData.checkInDateLabel,
        hotelSearchData.checkOutDateLabel
      );

      console.log('[Step 2] Opening Hotel Details popup tab...');
      let detailPage = await hotelDetailsPage.openHotelDetailsTab(0);

      console.log('[Step 3] Selecting Room from popup tab...');
      let success = await hotelDetailsPage.selectFirstRoom(detailPage);
      if (!success) {
        console.log('Hotel card #1 rates expired. Retrying with Hotel card #2...');
        await detailPage.close().catch(() => {});
        detailPage = await hotelDetailsPage.openHotelDetailsTab(1);
        success = await hotelDetailsPage.selectFirstRoom(detailPage);
      }
      expect(success, 'At least one room must be selectable for E2E test').toBeTruthy();

      console.log('[Step 4] Filling Lead Guest Details...');
      await hotelGuestFormPage.fillGuestDetails(
        detailPage,
        hotelGuestData.firstName,
        hotelGuestData.lastName
      );

      console.log('[Step 5] Accepting Terms & Conditions and clicking Pay and Reserve...');
      await hotelGuestFormPage.acceptTermsAndConditions(detailPage);
      await hotelGuestFormPage.clickPayAndReserve(detailPage);

      console.log('[Step 6] Verifying Booking Success & Extracting Tracking ID...');
      const trackingId = await hotelBookingConfirmationPage.verifyBookingSuccess(detailPage);
      expect(trackingId).toBeTruthy();
      console.log(`Successfully generated Booking Tracking ID: ${trackingId}`);

      console.log('[Step 7] Downloading & Verifying Hotel Voucher...');
      const voucherPage = await hotelBookingConfirmationPage.downloadHotelVoucher(detailPage);
      expect(voucherPage).toBeTruthy();
      console.log('Hotel Voucher generated and verified successfully!');

      await detailPage.close().catch(() => {});
      if (voucherPage && voucherPage !== detailPage) {
        await voucherPage.close().catch(() => {});
      }
    }
  );

});
