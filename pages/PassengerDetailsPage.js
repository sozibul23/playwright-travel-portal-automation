import { expect } from '@playwright/test';

/**
 * Passenger Details Page Object Model (POM)
 * Handles traveler info input, ancillary selections (Baggage, Meal, Seat),
 * coupon application, and payment/instant purchase confirmation.
 */
export class PassengerDetailsPage {
  constructor(page) {
    this.page = page;

    // -- Traveler Details fields --
    this.firstNameField = page.getByRole('textbox', { name: 'First/Given Name *' }).filter({ visible: true }).first();
    this.lastNameField = page.getByRole('textbox', { name: 'Surname/Family/Last Name *' }).filter({ visible: true }).first();
    this.passportField = page.getByRole('textbox', { name: 'Passport Number *' }).filter({ visible: true }).first();
    this.mobileField = page.locator('input[placeholder="Enter Mobile Number"]').first();
    this.emailField = page.locator('input[placeholder="example@mail.com"]').first();

    // -- Checkboxes & Final Buttons --
    this.termsCheckbox = page.getByRole('checkbox', { name: /I have read and accept Terms/i });
    this.agreeCheckbox = page.getByRole('checkbox', { name: /I agree and understand/i });
    this.holdFlightBtn = page.getByRole('button', { name: 'Hold Flight' });
    this.instantPurchaseBtn = page.getByRole('button', { name: 'Instant Purchase' });

    // -- Navigation Buttons --
    this.savePassengerBtn = page.getByRole('button', { name: 'Save Passenger' });
    this.nextBtn = page.getByRole('button', { name: 'Next' });

    // -- Ancillaries (Baggage, Meal, Seat) --
    this.addBaggageBtn = page.getByRole('button', { name: 'Add Baggage' });
    this.confirmBaggageBtn = page.getByRole('button', { name: 'Confirm Baggage' });
    this.addMealBtn = page.getByRole('button', { name: 'Add Meal' });
    this.confirmMealBtn = page.getByRole('button', { name: 'Confirm Meals' });
    this.selectSeatBtn = page.getByRole('button', { name: 'Select seat' });
    this.confirmSeatBtn = page.getByRole('button', { name: 'Confirm Seats' });

    // -- Validation error texts --
    this.firstNameError = page.getByText('First name is required');
    this.lastNameError = page.getByText('Last name is required');
    this.passportError = page.getByText('Document number is required');
    this.mobileError = page.getByText('Mobile number is required');
    this.emailError = page.getByText('Email address is required');

    this.travelerSectionHeading = page.getByText('Enter Traveler Details').first();

    // -- Coupon --
    this.couponInput = page.getByRole('textbox', { name: 'Coupon' });
    this.couponApplyBtn = page.getByRole('button', { name: 'Apply' });
  }

  // -- Traveler info fill --
  async fillPassengerInfo({ firstName, lastName, passportNumber, mobile, email }) {
    await this.firstNameField.fill(firstName);
    await this.lastNameField.fill(lastName);

    await this.dismissModals();
    await this.firstNameField.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    await this.firstNameField.fill(firstName);
    await this.lastNameField.fill(lastName);

    if (passportNumber && await this.passportField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.passportField.clear();
      await this.passportField.fill(passportNumber);
    }

    if (mobile && await this.mobileField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.mobileField.focus();
      await this.page.keyboard.press('Control+a');
      await this.page.keyboard.press('Backspace');
      await this.mobileField.pressSequentially(mobile, { delay: 50 });
    }
    if (email && await this.emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.emailField.clear();
      await this.emailField.fill(email);
    }
  }

  // -- Multiple Passenger info fill --
  async fillPassengerInfoAtIndex(index, { firstName, lastName, passportNumber, mobile, email }) {
    const travelerTab = this.page.locator('button, tab, .accordion, div, h4, h5')
      .filter({ hasText: new RegExp(`Traveler ${index + 1}`, 'i') })
      .first();

    if (index > 0 && await travelerTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`PassengerDetailsPage: Clicking tab for Traveler ${index + 1}...`);
      await travelerTab.click({ force: true });
      await this.page.waitForTimeout(500);
    }

    const firstNameField = this.page.getByRole('textbox', { name: /First|Given Name/i }).filter({ visible: true }).first();
    await firstNameField.waitFor({ state: 'visible', timeout: 30000 });
    if (await firstNameField.isEditable().catch(() => false)) {
      await firstNameField.fill(firstName);
    }

    const lastNameField = this.page.getByRole('textbox', { name: /Surname|Family|Last Name/i }).filter({ visible: true }).first();
    if (await lastNameField.isVisible({ timeout: 2000 }).catch(() => false) && await lastNameField.isEditable().catch(() => false)) {
      await lastNameField.fill(lastName);
    }

    if (passportNumber) {
      const passportField = this.page.getByRole('textbox', { name: /Passport Number/i }).filter({ visible: true }).first();
      if (await passportField.isVisible({ timeout: 2000 }).catch(() => false) && await passportField.isEditable().catch(() => false)) {
        await passportField.clear();
        await passportField.fill(passportNumber);
      }
    }

    if (mobile) {
      const mobileField = this.page.locator('input[placeholder="Enter Mobile Number"]').filter({ visible: true }).first();
      if (await mobileField.isVisible({ timeout: 2000 }).catch(() => false) && await mobileField.isEditable().catch(() => false)) {
        await mobileField.focus();
        await this.page.keyboard.press('Control+a');
        await this.page.keyboard.press('Backspace');
        await mobileField.pressSequentially(mobile, { delay: 50 });
      }
    }

    if (email) {
      const emailField = this.page.locator('input[placeholder="example@mail.com"]').filter({ visible: true }).first();
      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false) && await emailField.isEditable().catch(() => false)) {
        await emailField.fill(email);
      }
    }

    const nextBtn = this.page.getByRole('button', { name: 'Next', exact: true }).filter({ visible: true }).first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click({ force: true });
      await this.page.waitForTimeout(500);
    }
  }

  // -- Clear Form --
  async clearForm() {
    await this.firstNameField.clear();
    await this.lastNameField.clear();
    if (await this.passportField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.passportField.clear();
    }
    await this.mobileField.clear();
    await this.emailField.clear();
  }

  // -- Modal dismissal --
  async dismissModals() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForFunction(() => !document.querySelector('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open')).catch(() => {});

    const openModals = this.page.locator('dialog[open], [role="dialog"][open], .modal[open], .modal.modal-open, div.modal');
    const count = await openModals.count().catch(() => 0);
    
    for (let i = 0; i < count; i++) {
      const modal = openModals.nth(i);
      const isVisible = await modal.isVisible().catch(() => false);
      if (isVisible) {
        const closeBtn = modal.locator('button.btn-circle, button:has-text("✕"), button:has-text("Close")').first();
        if (await closeBtn.count() > 0 && await closeBtn.isVisible()) {
          try {
            await closeBtn.click({ force: true, timeout: 2000 });
            await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
          } catch (err) {
            await closeBtn.evaluate(el => el.click()).catch(() => {});
          }
        }
      }
    }
  }

  // -- Ancillary: Add Baggage --
  async addBaggage() {
    if (await this.addBaggageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('PassengerDetailsPage: Clicking "Add Baggage"...');
      await this.addBaggageBtn.click();
      await this.page.waitForTimeout(500);

      const firstBaggageOption = this.page.locator('.group.relative.flex.cursor-pointer, input[type="radio"], [role="radio"]').first();
      if (await firstBaggageOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstBaggageOption.click({ force: true });
      }

      if (await this.confirmBaggageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.confirmBaggageBtn.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  // -- Ancillary: Add Meal --
  async addMeal(mealName = null) {
    if (await this.addMealBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('PassengerDetailsPage: Clicking "Add Meal"...');
      await this.addMealBtn.click();
      await this.page.waitForTimeout(500);

      if (mealName) {
        const specificMeal = this.page.getByText(mealName).first();
        if (await specificMeal.isVisible({ timeout: 3000 }).catch(() => false)) {
          await specificMeal.click();
        }
      } else {
        const firstMeal = this.page.locator('div[class*="cursor-pointer"], .group.relative, [role="option"]').first();
        if (await firstMeal.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstMeal.click();
        }
      }

      if (await this.confirmMealBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.confirmMealBtn.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  // -- Ancillary: Select Seat --
  async selectSeat() {
    if (await this.selectSeatBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('PassengerDetailsPage: Clicking "Select seat"...');
      await this.selectSeatBtn.click();
      await this.page.waitForTimeout(500);

      const seatOption = this.page.locator('div:nth-child(80) > .\\!cursor-help, [class*="cursor-pointer"], [class*="seat"]').first();
      if (await seatOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await seatOption.click({ force: true });
      }

      if (await this.confirmSeatBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.confirmSeatBtn.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  // -- Click Next wizard button --
  async clickNext() {
    await this.dismissModals();
    
    let attempts = 0;
    while (attempts < 10) {
      const isNextVisible = await this.nextBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (!isNextVisible) {
        console.log('PassengerDetailsPage: Next button is no longer visible.');
        break;
      }
      
      console.log(`PassengerDetailsPage: Clicking Next button (wizard step ${attempts + 1})...`);
      await this.nextBtn.click({ force: true });
      await this.page.waitForTimeout(1500);
      await this.dismissModals();

      const isInstantPurchaseVisible = await this.page.getByRole('button', { name: /Instant Purchase|Hold Flight/i }).first().isVisible({ timeout: 1500 }).catch(() => false);
      const isTermsVisible = await this.termsCheckbox.isVisible({ timeout: 1500 }).catch(() => false);
      
      if (isInstantPurchaseVisible || isTermsVisible) {
        console.log('PassengerDetailsPage: Final payment/hold section reached.');
        break;
      }
      
      attempts++;
    }
  }

  // -- Final Checkout / Terms acceptance & Instant Purchase / Payment --
  async acceptTermsAndHoldFlight() {
    await this.dismissModals();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});

    if (this.page.url().includes('booking-details')) {
      console.log('Already on booking details page.');
      return;
    }

    // Step 1: Check all visible terms/agreement checkboxes
    const checkboxes = this.page.locator('input[type="checkbox"]');
    const chkCount = await checkboxes.count();
    for (let i = 0; i < chkCount; i++) {
      const chk = checkboxes.nth(i);
      if (await chk.isVisible({ timeout: 1000 }).catch(() => false)) {
        await chk.check({ force: true }).catch(() => chk.evaluate(el => el.checked = true));
      }
    }

    // Step 2: Confirmation button click (Hold Flight / Instant Purchase)
    const confirmBtn = this.page
      .locator('button, a.btn, .btn')
      .filter({ hasText: /Hold Flight|Instant Purchase|Pay and Reserve|Book Flight|Issue Ticket/i })
      .filter({ visible: true })
      .first();

    if (await confirmBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      const btnText = await confirmBtn.innerText().catch(() => 'Confirmation');
      console.log(`PassengerDetailsPage: Clicking confirmation button ("${btnText.replace(/\n/g, ' ')}")...`);
      await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
      await confirmBtn.click({ force: true }).catch(() => confirmBtn.evaluate(el => el.click()));
      await this.page.waitForTimeout(2000).catch(() => {});
    }

    // Step 3: Handle secondary confirmation modal popup if present
    const modalDialog = this.page.locator('dialog[open], .modal[open], .modal.modal-open, .modal-box, div[role="dialog"]');
    if (await modalDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const modalConfirmBtn = modalDialog
        .locator('button, a')
        .filter({ hasText: /Confirm|Yes|OK|Proceed|Pay|Hold|Purchase/i })
        .first();
      if (await modalConfirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Secondary modal detected after clicking payment/hold. Clicking modal confirm button...');
        await modalConfirmBtn.click({ force: true }).catch(() => {});
      }
    }
  }

  /**
   * Strictly clicks 'Instant Purchase' button only (excludes Hold Flight)
   */
  async clickInstantPurchase() {
    await this.dismissModals();

    // Check all visible checkboxes (terms/agreement)
    const checkboxes = this.page.locator('input[type="checkbox"]');
    const chkCount = await checkboxes.count();
    for (let i = 0; i < chkCount; i++) {
      const chk = checkboxes.nth(i);
      if (await chk.isVisible({ timeout: 1000 }).catch(() => false)) {
        await chk.check({ force: true }).catch(() => chk.evaluate(el => el.checked = true));
      }
    }

    // Strictly target Instant Purchase — explicitly exclude Hold Flight
    const instantBtn = this.page
      .locator('button, a.btn, .btn')
      .filter({ hasText: /Instant Purchase|Pay and Reserve|Issue Ticket/i })
      .filter({ hasNotText: /Hold Flight|Hold/i })
      .filter({ visible: true })
      .first();

    const isAvailable = await instantBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (!isAvailable) {
      throw new Error('❌ "Instant Purchase" button not found or not visible on checkout page.');
    }

    const btnText = await instantBtn.innerText().catch(() => 'Instant Purchase');
    console.log(`PassengerDetailsPage: Clicking Instant Purchase button ("${btnText.replace(/\n/g, ' ')}")...`);
    await instantBtn.scrollIntoViewIfNeeded().catch(() => {});
    await instantBtn.click({ force: true }).catch(() => instantBtn.evaluate(el => el.click()));
    await this.page.waitForTimeout(2000).catch(() => {});

    // Handle secondary confirmation modal if present
    const modalDialog = this.page.locator('dialog[open], .modal[open], .modal.modal-open, .modal-box, div[role="dialog"]');
    if (await modalDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const modalConfirmBtn = modalDialog
        .locator('button, a')
        .filter({ hasText: /Confirm|Yes|OK|Proceed|Pay|Purchase/i })
        .first();
      if (await modalConfirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Secondary modal detected. Clicking confirm...');
        await modalConfirmBtn.click({ force: true }).catch(() => {});
      }
    }
  }


  // -- Strictly clicks "Hold Flight" button only
  async acceptTermsAndHoldFlightOnlyStrict() {
    await this.dismissModals();
    
    if (await this.termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.termsCheckbox.check().catch(() => {});
      await this.agreeCheckbox.check().catch(() => {});
    }
    
    const holdBtn = this.page
      .locator('button, a, .btn')
      .filter({ hasText: /Hold Flight|Hold/i })
      .filter({ hasNotText: /Instant Purchase|Pay and Reserve|Issue Ticket/i })
      .filter({ visible: true })
      .first();

    const isHoldAvailable = await holdBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (!isHoldAvailable) {
      throw new Error('❌ Hold Cancellation Test Failed: Supplier/Flight does not support "Hold Flight" option (Direct purchase or Instant ticketing only).');
    }

    console.log(`PassengerDetailsPage: Strictly clicking Hold Flight button ("${await holdBtn.innerText()}")...`);
    await holdBtn.click({ force: true });

    const modalConfirmBtn = this.page
      .locator('.modal, [role="dialog"], dialog, div[class*="modal"]')
      .locator('button')
      .filter({ hasText: /Confirm|Yes|OK|Proceed|Pay|Hold/i })
      .first();
    if (await modalConfirmBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await modalConfirmBtn.click({ force: true }).catch(() => {});
    }
  }

  async acceptTermsAndHoldFlightOnly() {
    await this.acceptTermsAndHoldFlightOnlyStrict();
  }

  async savePassenger() {
    await this.savePassengerBtn.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async proceedToPayment() {
    await this.clickNext();
  }

  /**
   * Waits until the Total Payable price has a real value (> 0).
   * Polls every 2s up to maxWaitMs. Handles slow supplier API responses.
   * @param {number} maxWaitMs - Max wait time in ms (default: 60000)
   */
  async waitForPriceToLoad(maxWaitMs = 60000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const price = await this.getTotalPayable();
      if (price > 0) return price;
      await this.page.waitForTimeout(2000);
    }
    console.warn('⚠️ [waitForPriceToLoad] Price never exceeded 0 within timeout. Page may not have loaded fully.');
    return 0;
  }

  /**
   * Expands the coupon section if it is hidden inside a collapsed accordion/dropdown.
   * Tries common patterns: "Coupon Code" heading, promo section toggles.
   */
  async expandCouponSection() {
    const couponToggle = this.page.locator(
      'button, div[role="button"], summary, label'
    ).filter({
      hasText: /Coupon Code|Promo Code|Have a coupon|Discount Code|Apply Coupon/i
    }).first();

    if (await couponToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Only click if the input is not already visible
      const inputAlreadyVisible = await this.page
        .locator('input[placeholder*="Coupon" i], input[name*="coupon" i]')
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      if (!inputAlreadyVisible) {
        console.log('PassengerDetailsPage: Expanding coupon accordion section...');
        await couponToggle.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(800);
      }
    }
  }

  async applyCoupon(couponCode) {
    // ── Step 1: Wait for price to fully load (> 0) before proceeding ─────
    const priceBefore = await this.waitForPriceToLoad(60000);
    console.log(`[applyCoupon] Price loaded: ৳${priceBefore} | Applying: ${couponCode}`);

    // ── Step 2: Expand coupon section if it's collapsed ──────────────────
    await this.expandCouponSection();

    // ── Step 3: Locate and fill the coupon input ──────────────────────────
    const couponInput = this.page
      .getByRole('textbox', { name: /Coupon/i })
      .or(this.page.locator('input[placeholder*="Coupon" i], input[name*="coupon" i]'))
      .first();

    await couponInput.waitFor({ state: 'visible', timeout: 30000 });
    await couponInput.scrollIntoViewIfNeeded().catch(() => {});
    await couponInput.fill('');
    await couponInput.fill(couponCode);

    const applyBtn = this.page
      .getByRole('button', { name: /Apply/i })
      .or(this.page.locator('button:has-text("Apply")'))
      .first();
    await applyBtn.click({ force: true });

    // Wait for portal response (toast, badge, or price change)
    await this.page.waitForTimeout(2500);

    // ── Verification Method 1: Success / Error Toast ─────────────────────
    const successToast = this.page.locator(
      '.alert-success, .text-success, [class*="success"], ' +
      'div:has-text("successfully"), div:has-text("Applied"), div:has-text("Discount applied")'
    ).first();
    const errorToast = this.page.locator(
      '.alert-error, .alert-danger, .text-error, .text-danger, [class*="error"], [class*="danger"], ' +
      '[role="alert"], div:has-text("invalid"), div:has-text("expired"), ' +
      'div:has-text("not found"), div:has-text("not applicable"), div:has-text("not eligible")'
    ).first();

    const isSuccessToast = await successToast.isVisible({ timeout: 3000 }).catch(() => false);
    const isErrorToast   = await errorToast.isVisible({ timeout: 1000 }).catch(() => false);
    const toastMessage   = isSuccessToast
      ? await successToast.innerText().catch(() => '')
      : isErrorToast
        ? await errorToast.innerText().catch(() => '')
        : '';

    // ── Verification Method 2: Coupon Badge / Row (shows "-৳2,000") ──────
    const couponBadge = this.page.locator(
      `[class*="coupon"], [class*="discount-row"], ` +
      `div:has-text("${couponCode}"), span:has-text("${couponCode}")`
    ).first();
    const isBadgeVisible = await couponBadge.isVisible({ timeout: 2000 }).catch(() => false);

    // ── Verification Method 3: Price Change ──────────────────────────────
    const priceAfter     = await this.getTotalPayable();
    const discountAmount = priceBefore > 0 ? parseFloat((priceBefore - priceAfter).toFixed(2)) : 0;
    const isPriceReduced = discountAmount > 0;

    // ── Final verdict ─────────────────────────────────────────────────────
    const applied = isSuccessToast || isBadgeVisible || isPriceReduced;

    console.log(
      `🎟️ [Coupon: ${couponCode}] ` +
      `Applied: ${applied} | ` +
      `Price: ৳${priceBefore} → ৳${priceAfter} (Discount: ৳${discountAmount}) | ` +
      `Toast: "${toastMessage.trim().substring(0, 60)}" | ` +
      `Badge visible: ${isBadgeVisible}`
    );

    return { applied, discountAmount, priceAfter, priceBefore, toastMessage, isBadgeVisible };
  }

  async getTotalPayable() {
    for (let i = 0; i < 5; i++) {
      const payableLoc = this.page
        .locator('div:has(> p:has-text("Total Payable")) p, p:has-text("Total Payable") + p, [class*="payable"]:has-text("৳")')
        .filter({ hasText: /৳|BDT|[0-9]/ })
        .last();

      if (await payableLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = (await payableLoc.innerText().catch(() => '0')).replace(/[^0-9.]/g, '');
        const val = parseFloat(text);
        if (!isNaN(val) && val > 0) return val;
      }

      const priceLoc = this.page
        .locator('[class*="total"], [class*="payable"], [class*="grand-total"], .text-primary.font-bold')
        .filter({ hasNotText: /Meet/i })
        .filter({ hasText: /৳|BDT|\$|USD|[0-9]/ })
        .first();
      if (await priceLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = (await priceLoc.innerText().catch(() => '0')).replace(/[^0-9.]/g, '');
        const val = parseFloat(text);
        if (!isNaN(val) && val > 0) return val;
      }
      await this.page.waitForTimeout(1000);
    }
    return 0;
  }

  async getValidationErrors() {
    return this.page.locator('.error, .invalid-feedback, [role="alert"]').allTextContents();
  }
}
