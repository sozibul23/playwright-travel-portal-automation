import { BasePage } from './BasePage.js';

export class HotelFilterPage extends BasePage {
  constructor(page) {
    super(page);
    this.clearAllBtn = page.getByRole('button', { name: 'Clear All' });
  }

  /**
   * Filter by star rating
   * @param {number} stars - e.g. 5 for 5-star
   */
  async filterByStarRating(stars = 5) {
    const starCheckbox = this.page.getByRole('checkbox', { name: `${stars} Star` });
    if (await this.isVisibleSafe(starCheckbox, 3000)) {
      await starCheckbox.check();
    }
  }

  /**
   * Filter by specific amenity
   * @param {string} amenityName - e.g. "Pool", "WiFi"
   */
  async filterByAmenity(amenityName = 'Pool') {
    const amenityCheckbox = this.page.getByRole('checkbox', { name: amenityName });
    if (await this.isVisibleSafe(amenityCheckbox, 3000)) {
      await amenityCheckbox.check();
    }
  }

  /**
   * Sort search results
   * @param {string} optionText - e.g. "Price: Low to High"
   */
  async sortBy(optionText = 'Price: Low to High') {
    const sortDropdown = this.page.locator('select.sort-dropdown');
    if (await this.isVisibleSafe(sortDropdown, 3000)) {
      await sortDropdown.selectOption({ label: optionText });
    }
  }

  /**
   * Reset all active filters
   */
  async clearAllFilters() {
    if (await this.isVisibleSafe(this.clearAllBtn, 3000)) {
      await this.clearAllBtn.click();
    }
  }
}
