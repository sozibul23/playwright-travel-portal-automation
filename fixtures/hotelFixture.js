import { test as baseTest, expect } from './authFixture.js';
import { HotelSearchPage } from '../pages/HotelSearchPage.js';
import { HotelFilterPage } from '../pages/HotelFilterPage.js';
import { HotelDetailsPage } from '../pages/HotelDetailsPage.js';
import { HotelGuestFormPage } from '../pages/HotelGuestFormPage.js';
import { HotelBookingConfirmationPage } from '../pages/HotelBookingConfirmationPage.js';
import { HotelHistoryPage } from '../pages/HotelHistoryPage.js';

/**
 * hotelFixture — Extends authFixture to inject all Hotel POM Page Objects.
 * Test specs can simply destructure { hotelSearchPage, hotelFilterPage, ... } in test definitions.
 */
export const test = baseTest.extend({
  hotelSearchPage: async ({ page }, use) => {
    await use(new HotelSearchPage(page));
  },
  hotelFilterPage: async ({ page }, use) => {
    await use(new HotelFilterPage(page));
  },
  hotelDetailsPage: async ({ page }, use) => {
    await use(new HotelDetailsPage(page));
  },
  hotelGuestFormPage: async ({ page }, use) => {
    await use(new HotelGuestFormPage(page));
  },
  hotelBookingConfirmationPage: async ({ page }, use) => {
    await use(new HotelBookingConfirmationPage(page));
  },
  hotelHistoryPage: async ({ page }, use) => {
    await use(new HotelHistoryPage(page));
  },
});

export { expect };
