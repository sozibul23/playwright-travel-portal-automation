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
  async fillPassengerInfoAtIndex(index, { firstName, lastName, passportNumber, mobile, email } = {}) {
    await this.dismissModals();

    // 1. Expand / Activate Traveler Tab or Accordion
    const travelerTabSelectors = [
      `text=/Traveler\\s*${index + 1}/i`,
      `text=/Adult\\s*${index + 1}|Adult\\s*Traveler\\s*${index + 1}/i`,
      `text=/Child\\s*${index}|Child\\s*Traveler|Child\\s*${index + 1}|Child/i`,
      `text=/Infant\\s*${index}|Infant\\s*Traveler|Infant\\s*${index + 1}|Infant/i`,
      `button:has-text("Traveler ${index + 1}")`,
      `button:has-text("Child")`,
      `button:has-text("Infant")`,
      `.accordion-button:nth-of-type(${index + 1})`
    ];

    for (const selector of travelerTabSelectors) {
      const tab = this.page.locator(selector).first();
      if (await tab.isVisible({ timeout: 1000 }).catch(() => false)) {
        await tab.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(400);
        break;
      }
    }

    // 2. Locate First Name Field (Card-specific or Index-aware)
    const allFirstNameInputs = this.page
      .getByRole('textbox', { name: /First|Given Name/i })
      .or(this.page.locator('input[name*="firstName"], input[placeholder*="First"], input[name*="givenName"]'))
      .filter({ visible: true });

    const fnCount = await allFirstNameInputs.count();
    const firstNameField = fnCount > index ? allFirstNameInputs.nth(index) : (fnCount > 0 ? allFirstNameInputs.last() : allFirstNameInputs.first());

    await firstNameField.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (await firstNameField.isVisible({ timeout: 2000 }).catch(() => false) && await firstNameField.isEditable().catch(() => false)) {
      await firstNameField.focus();
      await firstNameField.clear().catch(() => {});
      await firstNameField.fill(firstName);
    }

    // 3. Locate Last Name Field (Card-specific or Index-aware)
    const allLastNameInputs = this.page
      .getByRole('textbox', { name: /Surname|Family|Last Name/i })
      .or(this.page.locator('input[name*="lastName"], input[placeholder*="Last"], input[name*="surName"]'))
      .filter({ visible: true });

    const lnCount = await allLastNameInputs.count();
    const lastNameField = lnCount > index ? allLastNameInputs.nth(index) : (lnCount > 0 ? allLastNameInputs.last() : allLastNameInputs.first());

    if (await lastNameField.isVisible({ timeout: 2000 }).catch(() => false) && await lastNameField.isEditable().catch(() => false)) {
      await lastNameField.focus();
      await lastNameField.clear().catch(() => {});
      await lastNameField.fill(lastName);
    }

    // 4. Locate Passport Field
    if (passportNumber) {
      const allPassportInputs = this.page
        .getByRole('textbox', { name: /Passport Number/i })
        .or(this.page.locator('input[name*="passport"], input[placeholder*="Passport"]'))
        .filter({ visible: true });

      const passCount = await allPassportInputs.count();
      const passportField = passCount > index ? allPassportInputs.nth(index) : (passCount > 0 ? allPassportInputs.last() : allPassportInputs.first());

      if (await passportField.isVisible({ timeout: 2000 }).catch(() => false) && await passportField.isEditable().catch(() => false)) {
        await passportField.focus();
        await passportField.clear().catch(() => {});
        await passportField.fill(passportNumber);
      }
    }

    // 5. Locate Mobile Field
    if (mobile) {
      const allMobileInputs = this.page
        .locator('input[placeholder="Enter Mobile Number"], input[name*="mobile"], input[type="tel"]')
        .filter({ visible: true });

      const mobCount = await allMobileInputs.count();
      const mobileField = mobCount > index ? allMobileInputs.nth(index) : (mobCount > 0 ? allMobileInputs.last() : allMobileInputs.first());

      if (await mobileField.isVisible({ timeout: 2000 }).catch(() => false) && await mobileField.isEditable().catch(() => false)) {
        await mobileField.focus();
        await this.page.keyboard.press('Control+a');
        await this.page.keyboard.press('Backspace');
        await mobileField.pressSequentially(mobile, { delay: 30 });
      }
    }

    // 6. Locate Email Field
    if (email) {
      const allEmailInputs = this.page
        .locator('input[placeholder="example@mail.com"], input[name*="email"], input[type="email"]')
        .filter({ visible: true });

      const emailCount = await allEmailInputs.count();
      const emailField = emailCount > index ? allEmailInputs.nth(index) : (emailCount > 0 ? allEmailInputs.last() : allEmailInputs.first());

      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false) && await emailField.isEditable().catch(() => false)) {
        await emailField.focus();
        await emailField.clear().catch(() => {});
        await emailField.fill(email);
      }
    }

    await this.page.waitForTimeout(300);
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
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});

    // 1. Wait for checkout page & Instant Purchase button to be visible
    const instantBtn = this.page
      .getByRole('button', { name: /Instant Purchase/i })
      .or(this.page.locator('button:has-text("Instant Purchase"), [role="button"]:has-text("Instant Purchase")'))
      .filter({ hasNotText: /Hold Flight|Hold/i })
      .filter({ visible: true })
      .first();

    await instantBtn.waitFor({ state: 'visible', timeout: 30000 });
    await instantBtn.scrollIntoViewIfNeeded().catch(() => {});

    // 2. Click specifically on the 2 checkbox boxes & their text
    const termsRow = this.page.locator('div, label, span, p').filter({ hasText: /I have read and accept/i }).first();
    if (await termsRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click on the box area (x=5) and the row
      await termsRow.click({ force: true, position: { x: 5, y: 10 } }).catch(() => {});
      await termsRow.click({ force: true }).catch(() => {});
    }

    const cancelRow = this.page.locator('div, label, span, p').filter({ hasText: /I agree and understand/i }).first();
    if (await cancelRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click on the box area (x=5) and the row
      await cancelRow.click({ force: true, position: { x: 5, y: 10 } }).catch(() => {});
      await cancelRow.click({ force: true }).catch(() => {});
    }

    // Also force-check all input[type="checkbox"] elements via DOM
    const allCheckboxes = this.page.locator('input[type="checkbox"]');
    const chkCount = await allCheckboxes.count();
    for (let i = 0; i < chkCount; i++) {
      const chk = allCheckboxes.nth(i);
      await chk.scrollIntoViewIfNeeded().catch(() => {});
      await chk.click({ force: true }).catch(() => {});
      await chk.check({ force: true }).catch(() => {});
      await chk.evaluate(el => {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('click', { bubbles: true }));
      }).catch(() => {});
    }

    await this.page.waitForTimeout(1000);

    // 3. Click 'Instant Purchase' button
    console.log('PassengerDetailsPage: Clicking Instant Purchase button...');
    await instantBtn.click({ force: true });

    // 4. Handle secondary confirmation popup modal if present (e.g. "Confirm Purchase")
    await this.page.waitForTimeout(1500);
    const modalDialog = this.page.locator('dialog[open], .modal[open], .modal.modal-open, .modal-box, div[role="dialog"]');
    if (await modalDialog.isVisible({ timeout: 4000 }).catch(() => false)) {
      const modalConfirmBtn = modalDialog
        .locator('button, a')
        .filter({ hasText: /Confirm|Yes|OK|Proceed|Pay|Purchase/i })
        .first();
      if (await modalConfirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('PassengerDetailsPage: Clicking confirmation in popup modal...');
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

    // Setup response listener for coupon claim endpoint
    const responsePromise = this.page.waitForResponse(
      res => res.url().includes('discount-coupon') || res.url().includes('coupon'),
      { timeout: 8000 }
    ).catch(() => null);

    const applyBtn = this.page
      .getByRole('button', { name: /Apply/i })
      .or(this.page.locator('button:has-text("Apply")'))
      .first();
    await applyBtn.click({ force: true });

    // Await API response or timeout
    const apiRes = await responsePromise;
    let apiStatus = null;
    let apiReason = '';
    if (apiRes) {
      try {
        const json = await apiRes.json();
        apiStatus = json.status;
        apiReason = json.reason || '';
      } catch (e) {}
    }

    // Wait for DOM update
    await this.page.waitForTimeout(2000);

    // ── Check and dismiss any Error Modal ("Attention!!") ────────────────
    let modalMessage = '';
    const errorModal = this.page.locator('dialog[open], .modal[open], .modal.modal-open, div.modal').filter({
      hasText: /Attention|Invalid|expired|eligible|limit|reason/i
    }).first();

    if (await errorModal.isVisible({ timeout: 1500 }).catch(() => false)) {
      modalMessage = (await errorModal.innerText().catch(() => '')).trim();
      const closeBtn = errorModal.locator('button:has-text("Close"), button.btn-circle, button:has-text("✕")').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
      } else {
        await this.page.keyboard.press('Escape').catch(() => {});
      }
      await errorModal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }

    // ── Verification Method 1: Success / Error Toast ─────────────────────
    const successAlert = this.page.locator(
      '.toast .alert-success, .alert.alert-success, [role="alert"].alert-success, p:has-text("discount is applied by Coupon")'
    ).first();

    const isSuccessToast = (apiStatus === 'success') || await successAlert.isVisible({ timeout: 1000 }).catch(() => false);
    const toastMessage = modalMessage || apiReason;

    // ── Verification Method 2: Coupon Badge / Summary Row (shows "-৳...") ─
    const couponBadge = this.page.locator(
      `p:has-text("Discount by Coupon"), :text("discount is applied by Coupon"), ` +
      `div:has-text("Discount by Coupon ${couponCode}"), span:has-text("${couponCode}")`
    ).first();
    const isBadgeVisible = (apiStatus === 'success') || await couponBadge.isVisible({ timeout: 2000 }).catch(() => false);

    // ── Verification Method 3: Price Change ──────────────────────────────
    const priceAfter     = await this.getTotalPayable();
    const discountAmount = priceBefore > 0 ? parseFloat((priceBefore - priceAfter).toFixed(2)) : 0;
    const isPriceReduced = discountAmount > 0;

    // ── Final verdict ─────────────────────────────────────────────────────
    const applied = (apiStatus === 'success') || isPriceReduced || (isSuccessToast && isBadgeVisible);

    console.log(
      `🎟️ [Coupon: ${couponCode}] ` +
      `Applied: ${applied} | ` +
      `Price: ৳${priceBefore} → ৳${priceAfter} (Discount: ৳${discountAmount}) | ` +
      `Toast/Reason: "${toastMessage.replace(/\n/g, ' ').trim().substring(0, 60)}" | ` +
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
