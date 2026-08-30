import { test, expect } from '../../../fixtures/hotelFixture.js';
import { generateRandomHotelGuests } from '../../../data/testData.js';

// ─────────────────────────────────────────────────────────────────────────
// Sprint 3 — Hotel Occupancy & Booking Suite (HTL-30 → HTL-36)
//
// Tag guide:
//   @smoke    → HTL-30 only (1R/1A, Dubai — fastest & most stable)
//   @critical → HTL-30, HTL-31, HTL-32, HTL-33 (single & small group)
//   @regression → all 7 scenarios
//   @flaky    → HTL-34, HTL-35, HTL-36 (large groups — supplier rate expiry risk)
// ─────────────────────────────────────────────────────────────────────────

test.describe('Sprint 3 — Hotel Occupancy & Booking Suite (HTL-30 to HTL-36)', () => {
  test.setTimeout(480000); // 8 min per test — supplier API latency

  test.beforeEach(async ({ hotelSearchPage }) => {
    await hotelSearchPage.page.goto('/');
  });

  // ─── Shared helper ────────────────────────────────────────────────────
  async function executeOccupancyBookingTest(
    hotelSearchPage,
    hotelDetailsPage,
    hotelGuestFormPage,
    hotelBookingConfirmationPage,
    rooms,
    adults,
    children,
    fakeGuests,
    destination = 'dhaka'
  ) {
    await hotelSearchPage.goToHotelTab();
    await hotelSearchPage.selectDestination(destination, null, 0);
    await hotelSearchPage.selectDates();
    await hotelSearchPage.selectGuestsAndRooms(rooms, adults, children);
    await hotelSearchPage.selectSupplier('All');
    await hotelSearchPage.clickSearch();

    // Try up to 3 hotel cards before giving up
    let detailPage = null;
    let success = false;

    for (let cardIdx = 0; cardIdx < 3 && !success; cardIdx++) {
      if (cardIdx > 0) {
        console.log(`Retrying with Hotel card #${cardIdx + 1}...`);
        if (detailPage && !detailPage.isClosed()) await detailPage.close().catch(() => {});
        await hotelSearchPage.page.bringToFront().catch(() => {});
      }

      detailPage = await hotelDetailsPage.openHotelDetailsTab(cardIdx);

      if (!detailPage) {
        test.skip(true, `Supplier API returned 0 hotels for ${rooms}R/${adults}A/${children}C in ${destination}. Skipping.`);
        return 'NO_HOTELS_FOUND';
      }

      success = await hotelDetailsPage.selectFirstRoom(detailPage);
    }

    if (!success) {
      if (detailPage && !detailPage.isClosed()) await detailPage.close().catch(() => {});
      test.skip(true, `All 3 hotel cards had expired/unavailable rates for ${rooms}R/${adults}A/${children}C in ${destination}. Skipping.`);
      return 'NO_ACTIVE_RATES';
    }

    await hotelGuestFormPage.fillGuestDetails(detailPage, fakeGuests[0].firstName, fakeGuests[0].lastName, fakeGuests);
    await hotelGuestFormPage.acceptTermsAndConditions(detailPage);
    await hotelGuestFormPage.clickPayAndReserve(detailPage);

    const trackingId = await hotelBookingConfirmationPage.verifyBookingSuccess(detailPage);
    expect(trackingId).toBeTruthy();
    console.log(`✅ Booking confirmed! Tracking ID: ${trackingId}`);
    await detailPage.close().catch(() => {});
    return trackingId;
  }

  // ── @smoke @critical ──────────────────────────────────────────────────
  test('HTL-30: Booking — 1 Room for 1 Adult in Dubai (Single Occupancy) @smoke @critical',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      test.setTimeout(480000);
      const fakeGuests = generateRandomHotelGuests(1);
      console.log(`[1 Room / 1 Adult | Dubai] Lead Guest: ${fakeGuests[0].firstName} ${fakeGuests[0].lastName}`);
      const trackingId = await executeOccupancyBookingTest(
        hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage,
        1, 1, 0, fakeGuests, 'dubai'
      );
      console.log(`1 Room / 1 Adult (Dubai) — Tracking ID: ${trackingId}`);
    }
  );

  // ── @critical ─────────────────────────────────────────────────────────
  test('HTL-31: Booking — 1 Room for 2 Adults in Bangkok (Double Occupancy) @critical',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      test.setTimeout(480000);
      const fakeGuests = generateRandomHotelGuests(2);
      console.log(`[1 Room / 2 Adults | Bangkok] Lead Guest: ${fakeGuests[0].firstName} ${fakeGuests[0].lastName}`);
      const trackingId = await executeOccupancyBookingTest(
        hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage,
        1, 2, 0, fakeGuests, 'bangkok'
      );
      console.log(`1 Room / 2 Adults (Bangkok) — Tracking ID: ${trackingId}`);
    }
  );

  test('HTL-32: Booking — 1 Room for 2 Adults, 2 Children in Singapore @critical',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      test.setTimeout(480000);
      const fakeGuests = generateRandomHotelGuests(4);
      console.log(`[1 Room / 2 Adults 2 Children | Singapore] Lead Guest: ${fakeGuests[0].firstName} ${fakeGuests[0].lastName}`);
      const trackingId = await executeOccupancyBookingTest(
        hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage,
        1, 2, 2, fakeGuests, 'singapore'
      );
      console.log(`1 Room / 2 Adults 2 Children (Singapore) — Tracking ID: ${trackingId}`);
    }
  );

  test('HTL-33: Booking — 2 Rooms for 4 Adults, 2 Children in Dhaka @critical',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      test.setTimeout(480000);
      const fakeGuests = generateRandomHotelGuests(6);
      console.log(`[2 Rooms / 4 Adults 2 Children | Dhaka] Lead Guest: ${fakeGuests[0].firstName} ${fakeGuests[0].lastName}`);
      const trackingId = await executeOccupancyBookingTest(
        hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage,
        2, 4, 2, fakeGuests, 'dhaka'
      );
      console.log(`2 Rooms / 4 Adults 2 Children (Dhaka) — Tracking ID: ${trackingId}`);
    }
  );

  // ── @regression @flaky ────────────────────────────────────────────────
  test('HTL-34: Booking — 3 Rooms for 7 Adults, 3 Children in Dubai @regression @flaky',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      test.setTimeout(480000);
      const fakeGuests = generateRandomHotelGuests(10);
      console.log(`[3 Rooms / 7 Adults 3 Children | Dubai] Lead Guest: ${fakeGuests[0].firstName} ${fakeGuests[0].lastName}`);
      const trackingId = await executeOccupancyBookingTest(
        hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage,
        3, 7, 3, fakeGuests, 'dubai'
      );
      console.log(`3 Rooms / 7 Adults 3 Children (Dubai) — Tracking ID: ${trackingId}`);
    }
  );

  test('HTL-35: Booking — 4 Rooms for 9 Adults, 4 Children in Bangkok @regression @flaky',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      test.setTimeout(480000);
      const fakeGuests = generateRandomHotelGuests(13);
      console.log(`[4 Rooms / 9 Adults 4 Children | Bangkok] Lead Guest: ${fakeGuests[0].firstName} ${fakeGuests[0].lastName}`);
      const trackingId = await executeOccupancyBookingTest(
        hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage,
        4, 9, 4, fakeGuests, 'bangkok'
      );
      console.log(`4 Rooms / 9 Adults 4 Children (Bangkok) — Tracking ID: ${trackingId}`);
    }
  );

  test('HTL-36: Booking — 5 Rooms for 7 Adults, 4 Children in Dhaka @regression @flaky',
    async ({ hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage }) => {
      test.setTimeout(480000);
      const fakeGuests = generateRandomHotelGuests(11);
      console.log(`[5 Rooms / 7 Adults 4 Children | Dhaka] Lead Guest: ${fakeGuests[0].firstName} ${fakeGuests[0].lastName}`);
      const trackingId = await executeOccupancyBookingTest(
        hotelSearchPage, hotelDetailsPage, hotelGuestFormPage, hotelBookingConfirmationPage,
        5, 7, 4, fakeGuests, 'dhaka'
      );
      console.log(`5 Rooms / 7 Adults 4 Children (Dhaka) — Tracking ID: ${trackingId}`);
    }
  );
});
