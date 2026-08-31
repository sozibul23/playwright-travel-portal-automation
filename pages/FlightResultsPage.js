export class FlightResultsPage {
  constructor(page) {
    this.page = page;
  }

  async selectAndBookFlight({ isRoundTrip = false, airline } = {}) {
    // Search results load হতে অনেক সময় লাগতে পারে — 90s দেওয়া হয়েছে
    const resultsLoadedLocator = this.page
      .getByRole('button', { name: /Select Flight|View Fare|SELECT FLIGHT|Book Now|Book/i })
      .or(this.page.locator('button:has-text("SELECT FLIGHT"), button:has-text("Select"), button:has-text("Book"), .flight-card'))
      .first();
    await resultsLoadedLocator.waitFor({ state: 'visible', timeout: 90000 });

    let formPage; // ── "Book Now" এর পরে Passenger Form যেই page এ থাকে (same page বা popup)
    if (isRoundTrip) {
      formPage = await this._handleRoundTrip();
    } else {
      if (airline) {
        await this._clickAirlineFareButton(airline);
        formPage = await this._clickBookNowFromExpandedCard();
      } else {
        formPage = await this._handleOneWay();
      }
    }

    // Bring page to front and wait for domcontentloaded
    await formPage.bringToFront().catch(() => {});
    await formPage.waitForLoadState('domcontentloaded').catch(() => {});

    // If formPage has a "Price Change" or "Book Now" modal overlay, click "Book Now" inside it
    const modalBookNow = formPage.locator('.modal, .modal-box, [class*="modal"], dialog')
      .locator('button, a, .btn')
      .filter({ hasText: /Book Now/i })
      .first();

    if (await modalBookNow.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('FlightResultsPage: "Price Change / Book Now" modal detected on formPage. Clicking "Book Now"...');
      const popupPromise = formPage.context().waitForEvent('page', { timeout: 10000 }).catch(() => null);
      await modalBookNow.click({ force: true });
      const popup = await popupPromise;
      if (popup) {
        await popup.waitForLoadState();
        formPage = popup;
      }
    }

    const firstNameField = formPage.getByRole('textbox', { name: 'First/Given Name *' })
      .or(formPage.locator('input[name*="firstName"], input[placeholder*="First"]'))
      .first();
    const isFirstNameVisible = await firstNameField.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isFirstNameVisible) {
      const accordionHeader = formPage.locator('h2, h3, button, div').filter({ hasText: /Enter Traveler Details|Adult Traveler/i }).first();
      if (await accordionHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
        await accordionHeader.click({ force: true }).catch(() => {});
      }
    }
    await firstNameField.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    // Dismiss promo/announcement overlay modals (excluding Book Now modals)
    const closeButtons = formPage.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle')
      .filter({ hasNotText: /Book Now/i });
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = closeButtons.nth(i);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ force: true }).catch(() => {});
        await btn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      }
    }

    return formPage;
  }

  async _handleOneWay() {
    await this._clickFirstAvailableFareButton();
    return await this._clickBookNowFromExpandedCard();
  }

  async _handleRoundTrip() {
    const hasRadioFlights = await this.page
      .locator('input[type="radio"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (hasRadioFlights) {
      return await this._handleSplitPanelRoundTrip();
    } else {
      return await this._handleCombinedCardRoundTrip();
    }
  }

  async _handleSplitPanelRoundTrip() {
    const departRadio = this.page.locator('input[type="radio"]').nth(0);
    await departRadio.waitFor({ state: 'visible', timeout: 15000 });
    await departRadio.click();
    await expect(departRadio).toBeChecked({ timeout: 5000 });

    const returnRadio = this.page.locator('input[type="radio"]').nth(1);
    await returnRadio.waitFor({ state: 'visible', timeout: 15000 });
    await returnRadio.click();
    await expect(returnRadio).toBeChecked({ timeout: 5000 });

    const proceedBtn = this.page
      .getByRole('button', { name: /Book Now|Proceed|Continue|Confirm/i })
      .first();
    await proceedBtn.waitFor({ state: 'visible', timeout: 15000 });

    // ── proceedBtn click করার পরে popup tab খুলতে পারে — listener আগে সেট করা ──
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await proceedBtn.click();
    // Awaiting popupPromise right below, so no hard sleep needed

    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState();
      return popup;
    }
    return this.page;
  }

  async _handleCombinedCardRoundTrip() {
    await this._clickFirstAvailableFareButton();
    return await this._clickBookNowFromExpandedCard();
  }

  async _clickAirlineFareButton(airline) {
    console.log(`Searching for flight card of airline: ${airline}`);
    
    const buttons = this.page.locator('button').filter({ hasText: /Select Flight|View Fare/i });
    const count = await buttons.count();
    console.log(`Found ${count} flight buttons on page`);
    
    let targetButton = null;
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const card = btn.locator('xpath=ancestor::div[.//a[contains(., "Quotes")] or .//button[contains(., "Quotes")]][1]');
      const cardText = await card.innerText().catch(() => '');
      
      const hasAirline = cardText.toLowerCase().includes(airline.toLowerCase()) || cardText.includes('6E');
      const isDirect = cardText.match(/Direct Flight|Non-Stop|Non Stop/i);
      
      if (hasAirline && isDirect) {
        console.log(`Found matching direct flight card at index ${i}`);
        targetButton = btn;
        break;
      }
    }
    
    if (!targetButton) {
      console.log('Direct flight card not found, falling back to first airline flight card...');
      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        const card = btn.locator('xpath=ancestor::div[.//a[contains(., "Quotes")] or .//button[contains(., "Quotes")]][1]');
        const cardText = await card.innerText().catch(() => '');
        const hasAirline = cardText.toLowerCase().includes(airline.toLowerCase()) || cardText.includes('6E');
        if (hasAirline) {
          console.log(`Found fallback flight card at index ${i}`);
          targetButton = btn;
          break;
        }
      }
    }
    
    if (!targetButton) {
      throw new Error(`Could not find any flight card for airline: ${airline}`);
    }
 
    await targetButton.waitFor({ state: 'visible', timeout: 15000 });
    
    const text = await targetButton.textContent();
    if (text && text.match(/Select Flight|View Fare/i)) {
      await targetButton.click({ force: true });
      await this.page.locator('button, a, .btn').filter({ hasText: /^Book Now$/i }).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    }
  }

  async _clickFirstAvailableFareButton() {
    // 1. Try 'Select Flight' if any exists directly
    const selectFlightCount = await this.page.getByRole('button', { name: 'Select Flight' }).count();
    for (let i = 0; i < selectFlightCount; i++) {
      const btn = this.page.getByRole('button', { name: 'Select Flight' }).nth(i);
      if (await btn.isVisible()) {
        await btn.click({ force: true });
        await this.page.locator('button, a, .btn').filter({ hasText: /^Book Now$/i }).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        return;
      }
    }

    // 2. Iterate through 'View Fare' buttons to find one that has 'Book Now'
    const viewFareCount = await this.page.getByRole('button', { name: /View Fare|Hide Fare/i }).count();
    
    for (let i = 0; i < viewFareCount; i++) {
      const btn = this.page.getByRole('button', { name: /View Fare|Hide Fare/i }).nth(i);
      if (!(await btn.isVisible().catch(() => false))) continue;

      const btnText = await btn.textContent();
        await btn.click({ force: true });
        await this.page.locator('button, a, .btn').filter({ hasText: /^Book Now$/i }).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

      const bookNowExists = await this.page.locator('button, a, .btn')
        .filter({ hasText: /^Book Now$/i })
        .first()
        .isVisible()
        .catch(() => false);
      if (bookNowExists) {
        return; // Found a bookable flight!
      }

      // If no Book Now appears, hide it and move to the next flight
      const hideBtnText = await btn.textContent();
      if (hideBtnText && hideBtnText.match(/Hide Fare/i)) {
        await btn.click({ force: true });
        await this.page.locator('button, a, .btn').filter({ hasText: /^Book Now$/i }).first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }
    }

    throw new Error('No bookable flight (with "Book Now" button) found in the search results.');
  }

  // ── "Book Now" click → এর ফলে একটা নতুন POPUP TAB খোলে
  async _clickBookNowFromExpandedCard() {
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15000 }).catch(() => null);

    // 1. Target the flight card's action button
    const bookNowBtn = this.page
      .locator('button:has-text("SELECT FLIGHT"), button:has-text("Select Flight"), button:has-text("Book Now"), button:has-text("Book")')
      .filter({ visible: true })
      .first();

    await bookNowBtn.waitFor({ state: 'visible', timeout: 30000 });
    await bookNowBtn.click({ force: true });

    // 2. If a "Price Change / Confirmation" modal opens with 'Book Now', click it
    const modalBookNow = this.page.locator('dialog[open], .modal[open], .modal.modal-open, .modal-box')
      .locator('button, a, .btn')
      .filter({ hasText: /^Book Now$/i })
      .first();

    if (await modalBookNow.isVisible({ timeout: 4000 }).catch(() => false)) {
      await modalBookNow.click({ force: true });
    }

    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      return popup;
    }

    // Check all open pages in context for checkout/booking URL
    const allPages = this.page.context().pages();
    for (const p of allPages) {
      if (p.url().includes('flight/book') || p.url().includes('checkout') || p.url().includes('booking') || p.url().includes('passenger')) {
        await p.waitForLoadState('domcontentloaded').catch(() => {});
        return p;
      }
    }

    return this.page;
  }
}

