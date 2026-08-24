import { BasePage } from './BasePage.js';

export class HotelHistoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.myBookingsMenu = page.getByRole('link', { name: 'Bookings' })
      .or(page.getByRole('link', { name: 'My Bookings' }))
      .or(page.locator('a:has-text("Bookings")'))
      .or(page.locator('*:has-text("Bookings")'))
      .first();

    this.hotelBookingsTab = page.getByRole('tab', { name: 'Hotels' })
      .or(page.getByRole('link', { name: 'Hotel Bookings' }))
      .or(page.locator('a:has-text("Hotel"), button:has-text("Hotel")'))
      .first();
  }

  /**
   * Navigate to Bookings -> Hotel Bookings section
   */
  async goToHotelBookingsHistory() {
    if (await this.myBookingsMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.myBookingsMenu.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }

    if (await this.hotelBookingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.hotelBookingsTab.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    } else {
      // Fallback direct URL navigation if menu dropdown didn't trigger
      await this.page.goto('/hotel/bookings').catch(async () => {
        await this.page.goto('/bookings').catch(() => {});
      });
    }
  }

  /**
   * Verify booking status for a given tracking ID
   * @param {string} trackingId - Booking tracking ID
   * @returns {Promise<string>} Status text (e.g. "Hold", "Confirmed", "Cancelled")
   */
  async getBookingStatus(trackingId) {
    const row = this.page.locator(`tr:has-text("${trackingId}")`);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    const statusCell = row.locator('td.status-cell, span.badge');
    return await statusCell.innerText();
  }

  /**
   * Assert cancel button is hidden when status is Confirmed (HTL-62)
   * @param {string} trackingId - Booking tracking ID
   */
  async assertCancelButtonHiddenForConfirmed(trackingId) {
    const row = this.page.locator(`tr:has-text("${trackingId}")`);
    const cancelBtn = row.locator('button:has-text("Cancel")');
    const isVisible = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      throw new Error(`Cancel button should be hidden for confirmed booking ${trackingId}, but it was visible.`);
    }
  }
}
