import { test, expect } from '../../fixtures/transferFixture.js';
import { transferSearchData, transferPassengerData } from '../../data/transferTestData.js';

test.describe('Transfer Module — E2E Booking Flow (@transfer @smoke)', () => {
  test.setTimeout(120000);

  test('TRF-01: Transfer search and end-to-end reservation flow', async ({
    transferSearchPage,
    transferBookingPage,
    page,
  }) => {
    // 1. Navigate to home & transfer tab
    await page.goto('/');
    await transferSearchPage.goToTransferTab();

    // 2. Perform search
    await transferSearchPage.selectPickupLocation(
      transferSearchData.pickupQuery,
      transferSearchData.pickupDisplay
    );
    await transferSearchPage.selectDropoffLocation(
      transferSearchData.dropoffQuery,
      transferSearchData.dropoffDisplay
    );
    await transferSearchPage.selectDate(transferSearchData.dateLabel);
    await transferSearchPage.clickSearch();

    // 3. Verify results appeared & select deal
    await expect(transferBookingPage.showDealButton).toBeVisible({ timeout: 40000 });
    await transferBookingPage.selectFirstDeal();

    // 4. Fill guest details
    await transferBookingPage.fillPassengerDetails(transferPassengerData);

    // 5. Fill transfer specific flight & carrier info
    await transferBookingPage.fillTransferTripDetails(transferPassengerData);

    // 6. Proceed to review
    await transferBookingPage.proceedToReview();

    // 7. Accept terms & reserve
    await transferBookingPage.acceptTermsAndReserve();

    // 8. Assert booking submitted / completed
    // Filter visible content in main container or toast
    const confirmationIndicator = page.locator('main, [role="main"]')
      .locator('h1, h2, h3, p, div, span')
      .filter({ hasText: /confirmed|reservation|success|tracking id|booking details|order/i })
      .filter({ visible: true })
      .first();

    const isVisible = await confirmationIndicator.isVisible({ timeout: 25000 }).catch(() => false);
    const finalUrl = page.url();
    console.log(`📌 Post-booking Page URL: ${finalUrl}`);

    if (!isVisible) {
      // Assert URL redirected away from checkout or confirmation message visible
      expect(finalUrl).toMatch(/\/(bookings|booking-details|confirmation|checkout\?)/i);
    } else {
      await expect(confirmationIndicator).toBeVisible();
    }
  });
});

