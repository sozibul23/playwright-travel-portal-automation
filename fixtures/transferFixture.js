import { test as baseTest, expect } from './authFixture.js';
import { TransferSearchPage } from '../pages/TransferSearchPage.js';
import { TransferBookingPage } from '../pages/TransferBookingPage.js';

/**
 * transferFixture — Extends authFixture to inject Transfer POM Page Objects.
 */
export const test = baseTest.extend({
  transferSearchPage: async ({ page }, use) => {
    await use(new TransferSearchPage(page));
  },
  transferBookingPage: async ({ page }, use) => {
    await use(new TransferBookingPage(page));
  },
});

export { expect };

