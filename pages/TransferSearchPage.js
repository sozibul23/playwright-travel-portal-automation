import { BasePage } from './BasePage.js';

export class TransferSearchPage extends BasePage {
  constructor(page) {
    super(page);

    this.transferTab = page.getByRole('tab', { name: /transfer/i })
      .or(page.getByRole('link', { name: /transfer/i }))
      .or(page.getByText('Transfer', { exact: true }))
      .filter({ visible: true })
      .first();

    // Pickup & Drop-off input triggers (dropdown triggers)
    this.pickupTrigger = page.getByRole('textbox', { name: 'Select' }).first();
    this.dropoffTrigger = page.getByRole('textbox', { name: 'Select' }).nth(1);

    // Search input inside autocomplete/dropdown
    this.locationSearchInput = page.getByRole('searchbox', { name: /airport code, city, name or/i })
      .or(page.locator('input[placeholder*="Airport code" i]'))
      .first();

    // Date picker input (ensure visible input, excluding flatpickr hidden input)
    this.dateInput = page.getByRole('textbox', { name: /mm\/dd\/yyyy/i })
      .or(page.locator('input[placeholder*="mm/dd/yyyy" i]:not([type="hidden"])'))
      .or(page.locator('input.flatpickr-input:not([type="hidden"])'))
      .filter({ visible: true })
      .first();

    // Search button
    this.searchButton = page.getByRole('button', { name: /search/i }).first();
  }

  async goToTransferTab() {
    console.log('🚗 Navigating to Transfer Tab...');
    await this.waitAndClick(this.transferTab);
    await this.page.waitForTimeout(1000);
  }

  async selectPickupLocation(query, displayName = '') {
    console.log(`📍 Selecting Pickup Location: ${query}...`);
    await this.waitAndClick(this.pickupTrigger);
    await this.locationSearchInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.locationSearchInput.fill(query);
    await this.page.waitForTimeout(800);

    // Select suggestion by display text or first item
    const targetText = displayName || query;
    const suggestion = this.page.locator('div, li, button')
      .filter({ hasText: new RegExp(targetText, 'i') })
      .filter({ visible: true })
      .first();

    if (await suggestion.isVisible({ timeout: 5000 }).catch(() => false)) {
      await suggestion.click();
    } else {
      // Fallback: pick the first available search result
      await this.page.locator('.dropdown-menu div, [role="listbox"] div, ul li')
        .filter({ visible: true })
        .first()
        .click();
    }
  }

  async selectDropoffLocation(query, displayName = '') {
    console.log(`🏁 Selecting Dropoff Location: ${query}...`);
    await this.waitAndClick(this.dropoffTrigger);
    await this.locationSearchInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.locationSearchInput.fill(query);
    await this.page.waitForTimeout(800);

    const targetText = displayName || query;
    const suggestion = this.page.locator('div, li, button')
      .filter({ hasText: new RegExp(targetText, 'i') })
      .filter({ visible: true })
      .first();

    if (await suggestion.isVisible({ timeout: 5000 }).catch(() => false)) {
      await suggestion.click();
    } else {
      await this.page.locator('.dropdown-menu div, [role="listbox"] div, ul li')
        .filter({ visible: true })
        .first()
        .click();
    }
  }

  async selectDate(dateLabel) {
    console.log(`📅 Selecting Transfer Date: ${dateLabel || 'Next available date'}...`);
    await this.waitAndClick(this.dateInput);
    await this.page.waitForTimeout(600);

    const openCalendar = this.page.locator('.flatpickr-calendar.open, .flatpickr-calendar')
      .filter({ visible: true })
      .first();
    await openCalendar.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Try finding by aria-label or text
    if (dateLabel) {
      const cleanLabel = dateLabel.replace(',', '').trim();
      const dateOption = openCalendar.locator(`[aria-label*="${cleanLabel}"]`)
        .or(openCalendar.locator(`[aria-label*="${dateLabel.trim()}"]`))
        .or(this.page.getByLabel(new RegExp(dateLabel, 'i')))
        .filter({ visible: true })
        .first();

      if (await dateOption.isVisible({ timeout: 2500 }).catch(() => false)) {
        await dateOption.click({ force: true });
        return;
      }

      // Try day number inside flatpickr
      const dayMatch = dateLabel.match(/\b(\d{1,2})\b/);
      if (dayMatch) {
        const dayCell = openCalendar.locator('.flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay)')
          .filter({ hasText: new RegExp(`^${dayMatch[1]}$`) })
          .filter({ visible: true })
          .first();
        if (await dayCell.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dayCell.click({ force: true });
          return;
        }
      }
    }

    // Default fallback: select an active future day
    const activeDay = openCalendar.locator('.flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay)')
      .or(this.page.locator('.react-datepicker__day:not(.react-datepicker__day--disabled), [role="gridcell"]:not([aria-disabled="true"])'))
      .filter({ visible: true })
      .nth(5); // 5 days ahead
    if (await activeDay.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activeDay.click({ force: true });
    }
  }

  async clickSearch() {
    console.log('🔍 Clicking Transfer Search button...');
    await this.waitAndClick(this.searchButton);
    await this.waitForFullPageLoad(this.page, 3000);
  }

  async searchTransfer(pickupQuery, pickupDisplay, dropoffQuery, dropoffDisplay, dateLabel) {
    await this.goToTransferTab();
    await this.selectPickupLocation(pickupQuery, pickupDisplay);
    await this.selectDropoffLocation(dropoffQuery, dropoffDisplay);
    await this.selectDate(dateLabel);
    await this.clickSearch();
  }
}

