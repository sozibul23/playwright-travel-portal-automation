import { test, expect } from '../../fixtures/transferFixture.js';
import { transferSearchData } from '../../data/transferTestData.js';

test.describe('Transfer Module — Negative & Validation Tests (@transfer @regression)', () => {
  test.setTimeout(90000);

  test('TRF-NEG-01: Blank search form submission does not navigate to results page', async ({
    transferSearchPage,
    page,
  }) => {
    await page.goto('/');
    await transferSearchPage.goToTransferTab();

    // Click search without selecting pickup or dropoff
    await transferSearchPage.clickSearch();

    // Verify it stays on the search page and does not navigate to results/deals
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/deal');
    expect(currentUrl).not.toContain('/booking');

    // Show Deal button should not appear
    const showDealBtn = page.getByRole('link', { name: /show deal/i }).first();
    const isDealVisible = await showDealBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isDealVisible).toBe(false);
  });

  test('TRF-NEG-02: Calendar disables past dates to prevent booking in the past', async ({
    transferSearchPage,
    page,
  }) => {
    await page.goto('/');
    await transferSearchPage.goToTransferTab();

    // Verify past days in Flatpickr calendar have disabled attribute/class
    const hasDisabledDates = await transferSearchPage.isPastDateDisabled();
    expect(hasDisabledDates).toBe(true);
  });

  test('TRF-NEG-03: Gibberish location search does not yield valid destination options', async ({
    transferSearchPage,
    page,
  }) => {
    await page.goto('/');
    await transferSearchPage.goToTransferTab();

    // Search with random gibberish
    await transferSearchPage.searchGibberish('!@#$%^&*randomxyz999');

    // Suggestion dropdown should not display valid cities
    const validAirportOption = page.locator('div, li')
      .filter({ hasText: /international airport|terminal|united arab emirates/i })
      .filter({ visible: true })
      .first();

    const isVisible = await validAirportOption.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('TRF-NEG-04: Submitting without drop-off location triggers required field modal', async ({
    transferSearchPage,
    page,
  }) => {
    await page.goto('/');
    await transferSearchPage.goToTransferTab();

    // Select only Pickup, leave Drop-off empty
    await transferSearchPage.selectPickupLocation(
      transferSearchData.pickupQuery,
      transferSearchData.pickupDisplay
    );
    await transferSearchPage.clickSearch();

    // Assert validation modal/alert appears
    const modalAlert = page.getByText(/missing required fields|select arrival airport|select drop off/i).first();
    await expect(modalAlert).toBeVisible({ timeout: 5000 });

    // Close the modal to leave a clean state
    const closeBtn = page.getByRole('button', { name: /close/i }).first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  test('TRF-NEG-05: Submitting empty passenger details blocks progression to payment', async ({
    transferSearchPage,
    transferBookingPage,
    page,
  }) => {
    // 1. Search valid transfer
    await page.goto('/');
    await transferSearchPage.searchTransfer(
      transferSearchData.pickupQuery,
      transferSearchData.pickupDisplay,
      transferSearchData.dropoffQuery,
      transferSearchData.dropoffDisplay,
      transferSearchData.dateLabel
    );

    // 2. Select first deal
    await expect(transferBookingPage.showDealButton).toBeVisible({ timeout: 40000 });
    await transferBookingPage.selectFirstDeal();

    // 3. Click Next on Passenger details without filling any fields
    await transferBookingPage.clickNext();

    // 4. Assert step does not advance to Payment (stays on step 2)
    const paymentRadio = page.getByText(/select payment options|account balance/i).first();
    const isPaymentReached = await paymentRadio.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isPaymentReached).toBe(false);

    // Assert Next button or required inputs remain visible
    await expect(transferBookingPage.firstNameInput).toBeVisible();
  });

  test('TRF-NEG-06: Unchecking Terms & Policies triggers acceptance warning modal', async ({
    transferSearchPage,
    transferBookingPage,
    page,
  }) => {
    // 1. Search valid transfer
    await page.goto('/');
    await transferSearchPage.searchTransfer(
      transferSearchData.pickupQuery,
      transferSearchData.pickupDisplay,
      transferSearchData.dropoffQuery,
      transferSearchData.dropoffDisplay,
      transferSearchData.dateLabel
    );

    // 2. Select deal & fill guest info
    await expect(transferBookingPage.showDealButton).toBeVisible({ timeout: 40000 });
    await transferBookingPage.selectFirstDeal();

    await transferBookingPage.fillPassengerDetails({
      firstName: 'Test',
      lastName: 'Negative',
      mobile: '+966 712 343 535',
      email: 'test@innovatesolution.com',
      note: 'Negative test scenario'
    });

    await transferBookingPage.fillTransferTripDetails({
      flightNumber: 'EK123',
      mode: 'FLIGHT',
      direction: 'ARRIVAL',
      carrierName: 'Emirates'
    });

    // 3. Advance to payment
    await transferBookingPage.proceedToReview();

    // 4. Explicitly UNCHECK both terms checkboxes
    console.log('🔘 Unchecking Terms & Conditions checkboxes...');
    const termsCheckboxes = page.getByRole('checkbox');
    const cbCount = await termsCheckboxes.count();
    for (let i = 0; i < cbCount; i++) {
      const cb = termsCheckboxes.nth(i);
      if (await cb.isChecked()) {
        await cb.uncheck({ force: true });
      }
    }

    // 5. Attempt to click Pay and Reserve
    console.log('💳 Attempting to click Pay and Reserve with unchecked terms...');
    const payBtn = page.getByRole('button', { name: /^pay and reserve$/i }).filter({ visible: true }).first();
    await payBtn.click({ force: true });

    // 6. Assert validation modal appears
    const warningModal = page.getByText(/please accept terms & conditions|failed!/i).first();
    await expect(warningModal).toBeVisible({ timeout: 5000 });
  });
});
