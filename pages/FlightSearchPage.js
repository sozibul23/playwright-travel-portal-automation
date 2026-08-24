import { clickWhenReady } from '../utils/waitHelper.js';

export class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  // ── Main Service Tab Check ────────────────────────────────────────────────
  async ensureFlightsTabActive() {
    await this.dismissOpenModals();

    // Codegen-confirmed: airport fields are textboxes with placeholder='Select'.
    // They only appear when the Flights service tab is active.
    const flightsFormInput = this.page.locator('input.sb-input[placeholder="Select"]').or(this.page.getByRole('textbox', { name: 'Select' })).first();

    let isFlightsFormVisible = await flightsFormInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isFlightsFormVisible) {
      console.log('✈️ Flights form not active. Clicking the Flights service tab...');

      // Service tabs are <li> elements: Flights, Hotels, Transfer, Activities...
      const flightsServiceTab = this.page
        .locator('li, button, div, a')
        .filter({ hasText: /^Flights$/i })
        .filter({ visible: true })
        .first();

      const tabVisible = await flightsServiceTab.isVisible({ timeout: 5000 }).catch(() => false);
      if (tabVisible) {
        await flightsServiceTab.click({ force: true }).catch(() => { });
        await this.page.waitForTimeout(800);
        isFlightsFormVisible = await flightsFormInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (!isFlightsFormVisible) {
          await flightsServiceTab.evaluate(el => el.click()).catch(() => { });
          await this.page.waitForTimeout(800);
          isFlightsFormVisible = await flightsFormInput.isVisible({ timeout: 3000 }).catch(() => false);
        }
      }

      if (!isFlightsFormVisible) {
        console.log('Re-navigating to / for fresh Flights form load...');
        await this.page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => { });
        await this.page.waitForTimeout(800);
        // Portal defaults to Group Fare on load — explicitly click Flights tab after navigation
        const flightsTabAfterNav = this.page
          .locator('li, button, div, a')
          .filter({ hasText: /^Flights$/i })
          .filter({ visible: true })
          .first();
        if (await flightsTabAfterNav.isVisible({ timeout: 5000 }).catch(() => false)) {
          await flightsTabAfterNav.click({ force: true }).catch(() => { });
          await this.page.waitForTimeout(600);
        }
        await flightsFormInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => { });
      }
    }
  }

  // ── Trip type tabs ────────────────────────────────────────────────────────
  async selectOneWay() {
    await this.ensureFlightsTabActive();

    const btn = this.page.getByText('One Way').filter({ visible: true }).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click({ force: true }).catch(() => btn.evaluate(el => el.click()));
  }

  async selectRoundTrip() {
    await this.ensureFlightsTabActive();

    const returnDateInput = this.page.getByRole('textbox', { name: 'mm/dd/yyyy' }).nth(1);

    const btn = this.page.getByText('Round Trip').filter({ visible: true }).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click({ force: true }).catch(() => btn.evaluate(el => el.click()));

    let isReturnVisible = await returnDateInput.isVisible({ timeout: 1500 }).catch(() => false);
    if (!isReturnVisible) {
      await btn.locator('xpath=..').click({ force: true }).catch(() => { });
      isReturnVisible = await returnDateInput.isVisible({ timeout: 2000 }).catch(() => false);
    }

    if (!isReturnVisible) {
      throw new Error('❌ Round Trip selection failed: Return Date input field did not appear after clicking Round Trip tab.');
    }
  }

  async selectMultiCity() {
    await this.ensureFlightsTabActive();

    const secondOriginInput = this.page.locator('input.sb-input[placeholder="Select"]').or(this.page.getByRole('textbox', { name: 'Select' })).nth(2);

    const btn = this.page.getByText('Multi City').filter({ visible: true }).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click({ force: true }).catch(() => btn.evaluate(el => el.click()));

    let isMultiCityVisible = await secondOriginInput.isVisible({ timeout: 1500 }).catch(() => false);
    if (!isMultiCityVisible) {
      await btn.locator('xpath=..').click({ force: true }).catch(() => { });
      isMultiCityVisible = await secondOriginInput.isVisible({ timeout: 2000 }).catch(() => false);
    }

    if (!isMultiCityVisible) {
      throw new Error('❌ Multi-City selection failed: Second segment origin input did not appear after clicking Multi City tab.');
    }
  }

  // ── Cabin Class ───────────────────────────────────────────────────────────
  async selectCabinClass(targetClass = 'Business Class') {
    await this.ensureFlightsTabActive();
    await this.page.keyboard.press('Escape').catch(() => {});

    // 1. Target the specific Cabin Class trigger button
    const trigger = this.page
      .locator('button, div[role="button"], div.dropdown')
      .filter({ hasText: /Economy|Business Class|Premium-Economy|First-Class/i })
      .filter({ hasNotText: /Flight|Passenger|Supplier|Fare/i })
      .filter({ visible: true })
      .last();

    await trigger.waitFor({ state: 'visible', timeout: 10000 });
    await trigger.click().catch(() => trigger.click({ force: true }));

    // 2. Target the inner <a> or text node for 'Business Class' inside the dropdown menu
    const option = this.page
      .getByText('Business Class', { exact: false })
      .filter({ hasNotText: /Flight|Passenger|Supplier|Fare/i })
      .filter({ visible: true })
      .first();

    const isOptionVisible = await option.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isOptionVisible) {
      await trigger.evaluate(el => el.click()).catch(() => {});
    }

    await option.waitFor({ state: 'visible', timeout: 4000 });
    await option.click({ force: true }).catch(() => option.evaluate(el => el.click()));

    // 3. STRICT ASSERTION: Verify trigger button now shows target class
    const selectedText = await trigger.innerText().catch(() => '');
    if (!selectedText.toLowerCase().includes('business')) {
      throw new Error(`❌ Business Class Selection Failed: Dropdown text still shows '${selectedText}' instead of 'Business Class'`);
    }
  }

  // ── Origin ────────────────────────────────────────────────────────────────
  async setOriginByText(cityOrCode, displayText) {
    await this.setNthOriginByText(0, cityOrCode, displayText);
  }

  async setNthOriginByText(index, cityOrCode, displayText = '') {
    await this.ensureFlightsTabActive();

    const originInput = this.page.locator('input.sb-input').first();
    await originInput.scrollIntoViewIfNeeded().catch(() => { });
    await originInput.click({ force: true });

    const searchBox = this.page.locator('input[placeholder*="Airport code"], input[type="search"]').filter({ visible: true }).first();
    await searchBox.waitFor({ state: 'visible', timeout: 10000 });
    await searchBox.fill(cityOrCode);

    const code = cityOrCode.trim().toUpperCase();
    const option = this.page.locator('div, li, button, span, [role="option"]')
      .filter({ hasText: new RegExp(`\\b${code}\\b`, 'i') })
      .filter({ visible: true })
      .first();

    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click({ force: true }).catch(() => option.evaluate(el => el.click()));
    await searchBox.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }

  // ── Destination ───────────────────────────────────────────────────────────
  async setDestinationByText(cityOrCode, displayText) {
    await this.setNthDestinationByText(0, cityOrCode, displayText);
  }

  async setNthDestinationByText(index, cityOrCode, displayText = '') {
    await this.ensureFlightsTabActive();

    const destInput = this.page.locator('input.sb-input').nth(1);
    await destInput.scrollIntoViewIfNeeded().catch(() => { });
    await destInput.click({ force: true });

    const searchBox = this.page.locator('input[placeholder*="Airport code"], input[type="search"]').filter({ visible: true }).first();
    await searchBox.waitFor({ state: 'visible', timeout: 10000 });
    await searchBox.fill(cityOrCode);

    const code = cityOrCode.trim().toUpperCase();
    const option = this.page.locator('div, li, button, span, [role="option"]')
      .filter({ hasText: new RegExp(`\\b${code}\\b`, 'i') })
      .filter({ visible: true })
      .first();

    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click({ force: true }).catch(() => option.evaluate(el => el.click()));
    await searchBox.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }

  // ── Dates ─────────────────────────────────────────────────────────────────

  /**
   * Calendar এ next month navigate করে যদি target date এখন visible না থাকে।
   * max 3 মাস পর্যন্ত navigate করবে।
   */
  async _navigateCalendarToDate(dateLabel) {
    const openCalendar = this.page.locator('.flatpickr-calendar.open');
    const nextBtn = openCalendar.locator('.flatpickr-next-month, [aria-label="Next month"], .next-month').first();

    // Extract day number (e.g. "20" from "August 20, 2026")
    const dayMatch = dateLabel.match(/\b(\d{1,2})\b/);
    const dayNum = dayMatch ? dayMatch[1] : '';

    const getDayCell = () => {
      if (dayNum) {
        return openCalendar.locator('.flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay)')
          .filter({ hasText: new RegExp(`^${dayNum}$`) })
          .filter({ visible: true })
          .first();
      }
      return openCalendar.locator(`[aria-label*="${dateLabel.trim()}"]`).filter({ visible: true }).first();
    };

    for (let attempt = 0; attempt < 4; attempt++) {
      const target = getDayCell();
      const isVisible = await target.isVisible({ timeout: 500 }).catch(() => false);
      if (isVisible) {
        await target.click({ force: true }).catch(() => { });
        await target.evaluate(el => el.click()).catch(() => { });
        return;
      }
      if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextBtn.click({ force: true }).catch(() => { });
      }
    }

    const fallbackTarget = getDayCell();
    if (await fallbackTarget.isVisible().catch(() => false)) {
      await fallbackTarget.click({ force: true }).catch(() => { });
      await fallbackTarget.evaluate(el => el.click()).catch(() => { });
    }
  }

  async setDepartureDate(dateLabel) {
    await this.setNthDepartureDate(0, dateLabel);
  }

  async setNthDepartureDate(index, dateLabel) {
    const dateInput = this.page.getByRole('textbox', { name: 'mm/dd/yyyy' }).nth(index);
    await clickWhenReady(dateInput);
    await this._navigateCalendarToDate(dateLabel);
  }

  async setReturnDate(departureDateLabel, returnDateLabel) {
    const dateInput = this.page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first();
    await clickWhenReady(dateInput);
    await this._navigateCalendarToDate(departureDateLabel);

    const returnInput = this.page.getByRole('textbox', { name: 'mm/dd/yyyy' }).nth(1);
    await clickWhenReady(returnInput);
    await this._navigateCalendarToDate(returnDateLabel);
  }

  // ── Supplier ─────────────────────────────────────────────────────────────
  async selectSupplier(supplierName) {
    const targetSupplier = (!supplierName || supplierName.toLowerCase() === 'all')
      ? 'All'
      : supplierName.trim();

    await this.page.keyboard.press('Escape').catch(() => {});

    const combobox = this.page.getByRole('combobox', { name: /Select Supplier|Supplier/i })
      .or(this.page.locator('[role="combobox"]').filter({ hasText: /Supplier|All/i }))
      .or(this.page.locator('button, div').filter({ hasText: /^Select Supplier$/i }))
      .filter({ visible: true })
      .first();

    const isVisible = await combobox.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) return;

    const currentText = await combobox.innerText().catch(() => '');
    if (currentText.toLowerCase().includes(targetSupplier.toLowerCase())) {
      return; // Already selected
    }

    await combobox.click({ force: true }).catch(() => combobox.evaluate(el => el.click()));

    const supplierRegex = new RegExp(targetSupplier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const option = (targetSupplier === 'All')
      ? this.page.getByRole('option', { name: 'All', exact: true }).or(this.page.locator('li, [role="option"]').filter({ hasText: /^All$/i })).filter({ visible: true }).first()
      : this.page.getByRole('option', { name: supplierRegex }).or(this.page.locator('li, [role="option"]').filter({ hasText: supplierRegex })).filter({ visible: true }).first();

    const optionVisible = await option.isVisible({ timeout: 3000 }).catch(() => false);
    if (optionVisible) {
      await option.click({ force: true }).catch(() => option.evaluate(el => el.click()));
    } else {
      await this.page.keyboard.press('Escape').catch(() => {});
    }
  }

  // ── Passengers ────────────────────────────────────────────────────────────────────────
  async setPassengers({ adults = 1, children = 0, infants = 0 }) {
    await this.page.keyboard.press('Escape').catch(() => { });

    const passengerBtn = this.page.getByRole('button', { name: /Passenger/i }).first();
    await passengerBtn.click({ force: true }).catch(() => { });

    await this.page.getByRole('button', { name: 'Apply' }).waitFor({ state: 'visible', timeout: 5000 });

    if (adults > 1) {
      const plusBtn = this.page.locator('.plusBtn').nth(0);
      for (let i = 1; i < adults; i++) {
        await plusBtn.evaluate(el => el.click()).catch(() => { });
      }
    }

    if (children > 0) {
      const plusBtn = this.page.locator('.plusBtn').nth(1);
      for (let i = 0; i < children; i++) {
        await plusBtn.evaluate(el => el.click()).catch(() => { });
      }
    }

    if (infants > 0) {
      const plusBtn = this.page.locator('.plusBtn').nth(3);
      for (let i = 0; i < infants; i++) {
        await plusBtn.evaluate(el => el.click()).catch(() => { });
      }
    }

    await this.page.getByRole('button', { name: 'Apply' }).click({ force: true }).catch(() => { });
  }

  async dismissOpenModals() {
    const openModals = this.page.locator('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open');
    const count = await openModals.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const modal = openModals.nth(i);
      const isVisible = await modal.isVisible().catch(() => false);
      if (isVisible) {
        const closeBtn = modal.locator('button.btn-circle, button:has-text("✕"), button:has-text("Close"), button:has-text("Accept"), button.close').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click({ force: true }).catch(() => { });
        } else {
          await modal.evaluate(el => {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            el.removeAttribute('open');
            el.setAttribute('data-state', 'closed');
          }).catch(() => { });
        }
      }
    }

    // Forcefully remove any pointer-blocking modal backdrop overlays
    await this.page.evaluate(() => {
      document.querySelectorAll('.modal-backdrop, [class*="modal-backdrop"]').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' && parseInt(style.zIndex, 10) >= 20) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      });
    }).catch(() => { });
  }

  // ── Search ────────────────────────────────────────────────────────────────
  async search() {
    await this.ensureFlightsTabActive();
    await this.page.keyboard.press('Escape').catch(() => { });

    const searchBtn = this.page.locator('button')
      .filter({ hasText: /^Search$/i })
      .filter({ visible: true })
      .first();

    await searchBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => { });
    await searchBtn.click({ force: true });

    await this.page.waitForURL(/\/flight/i, { timeout: 35000 }).catch(() => { });
    await this.page.waitForLoadState('domcontentloaded').catch(() => { });
  }

  // Negative test এ validation confirm করার জন্য — URL change হওয়া উচিত না
  async clickSearchExpectingValidation() {
    await this.ensureFlightsTabActive();
    await this.page.keyboard.press('Escape').catch(() => { });

    const searchBtn = this.page.locator('#flight_search_button')
      .or(this.page.getByRole('button', { name: 'Search', exact: true }))
      .filter({ visible: true })
      .first();

    await searchBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => { });

    try {
      await searchBtn.click({ timeout: 4000 });
    } catch (err) {
      await searchBtn.evaluate(el => el.click());
    }

    await this.page.waitForLoadState('networkidle').catch(() => { });
  }
}

