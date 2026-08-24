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

    if (passportNumber) {
      await this.passportField.clear();
      await this.passportField.fill(passportNumber);
    }

    if (mobile) {
      await this.mobileField.focus();
      await this.page.keyboard.press('Control+a');
      await this.page.keyboard.press('Backspace');
      await this.mobileField.pressSequentially(mobile, { delay: 50 });
    }
    if (email) {
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
      const isInstantPurchaseVisible = await this.page.getByRole('button', { name: /Instant Purchase|Hold Flight/i }).first().isVisible({ timeout: 1500 }).catch(() => false);
      const isTermsVisible = await this.termsCheckbox.isVisible({ timeout: 1500 }).catch(() => false);
      const isCheckoutURL = this.page.url().includes('checkout');
      
      if (isInstantPurchaseVisible || isTermsVisible || isCheckoutURL) {
        console.log('PassengerDetailsPage: Final checkout page reached.');
        break;
      }
      
      const isNextVisible = await this.nextBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (!isNextVisible) {
        console.log('PassengerDetailsPage: Next button is no longer visible.');
        break;
      }
      
      console.log(`PassengerDetailsPage: Clicking Next button (wizard step ${attempts + 1})...`);
      await this.nextBtn.click({ force: true });
      await this.page.waitForTimeout(1000);
      await this.dismissModals();
      attempts++;
    }
  }

  // -- Final Checkout / Terms acceptance & Instant Purchase / Payment --
  async acceptTermsAndHoldFlight() {
    await this.dismissModals();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});

    // Step 1: Initial "Instant Purchase" or "Hold Flight" button click if required to reveal terms checkboxes
    const initialBtn = this.page.getByRole('button', { name: /Instant Purchase|Hold Flight/i }).first();
    if (await initialBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isTermsVisible = await this.termsCheckbox.isVisible({ timeout: 500 }).catch(() => false);
      if (!isTermsVisible) {
        console.log('PassengerDetailsPage: Clicking initial Instant Purchase / Hold Flight to reveal terms...');
        await initialBtn.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(1000);
      }
    }
    
    // Step 2: Check Terms and Conditions checkboxes
    if (await this.termsCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('PassengerDetailsPage: Checking Terms checkbox...');
      await this.termsCheckbox.check().catch(() => {});
    }
    if (await this.agreeCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('PassengerDetailsPage: Checking Agree & Understand checkbox...');
      await this.agreeCheckbox.check().catch(() => {});
    }

    // Step 3: Final confirmation click (Instant Purchase / Hold Flight / Pay)
    const confirmBtn = this.page
      .locator('button')
      .filter({ hasText: /Instant Purchase|Hold Flight|Pay and Reserve|Book Flight|Issue Ticket/i })
      .filter({ visible: true })
      .first();

    await confirmBtn.waitFor({ state: 'visible', timeout: 30000 });
    const btnText = await confirmBtn.innerText().catch(() => 'Confirmation');
    console.log(`PassengerDetailsPage: Clicking final confirmation button ("${btnText.replace(/\n/g, ' ')}")...`);
    await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
    await confirmBtn.click({ force: true }).catch(() => confirmBtn.evaluate(el => el.click()));
    await this.page.waitForTimeout(2000).catch(() => {});

    // Handle secondary modal confirmation if triggered
    const modalConfirmBtn = this.page
      .locator('.modal, [role="dialog"], dialog, div[class*="modal"]')
      .locator('button')
      .filter({ hasText: /Confirm|Yes|OK|Proceed|Pay|Hold|Purchase/i })
      .first();
    if (await modalConfirmBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('Secondary modal detected after clicking payment/hold. Clicking modal confirm button...');
      await modalConfirmBtn.click({ force: true }).catch(() => {});
    }
  }

  /**
   * Click 'Instant Purchase' button directly on /flight/checkout page
   */
  async clickInstantPurchase() {
    await this.acceptTermsAndHoldFlight();
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

  async applyCoupon(couponCode) {
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
    await this.page.waitForTimeout(2000);
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
