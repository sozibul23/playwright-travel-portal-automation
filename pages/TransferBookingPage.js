import { BasePage } from './BasePage.js';

export class TransferBookingPage extends BasePage {
  constructor(page) {
    super(page);

    // Deals / Results
    this.showDealButton = page.getByRole('link', { name: /show deal/i }).first();
    this.bookNowButton = page.getByRole('button', { name: /book now/i })
      .or(page.getByText('Book Now', { exact: false }))
      .filter({ visible: true })
      .first();

    // Passenger / Lead Guest Form
    this.firstNameInput = page.getByRole('textbox', { name: /first\/given name/i })
      .or(page.locator('input[placeholder*="First" i]'))
      .first();

    this.lastNameInput = page.getByRole('textbox', { name: /last\/family name/i })
      .or(page.locator('input[placeholder*="Last" i]'))
      .first();

    this.mobileInput = page.getByRole('textbox', { name: /enter mobile number/i })
      .or(page.locator('input[type="tel"]'))
      .first();

    this.emailInput = page.getByRole('textbox', { name: /email/i })
      .or(page.locator('input[type="email"]'))
      .first();

    this.noteInput = page.getByRole('textbox', { name: /note/i })
      .or(page.locator('textarea, input[placeholder*="Note" i]'))
      .first();

    // Transfer Specific Details
    this.flightNumberInput = page.getByRole('textbox', { name: /flight number/i })
      .or(page.locator('input[placeholder*="Flight Number" i]'))
      .first();

    this.modeOfTransferSelect = page.getByLabel(/mode of transfer/i)
      .or(page.locator('select[name*="mode" i], select:has-text("FLIGHT")'))
      .first();

    this.directionSelect = page.getByLabel(/direction/i)
      .or(page.locator('select[name*="direction" i]'))
      .first();

    this.carrierNameInput = page.getByRole('textbox', { name: /transfer carrier name/i })
      .or(page.locator('input[placeholder*="Carrier" i]'))
      .first();

    // Next button
    this.nextButton = page.getByRole('button', { name: /next/i }).first();

    // Terms & Conditions Checkboxes
    this.termsCheckbox = page.getByRole('checkbox', { name: /terms/i })
      .or(page.locator('input[type="checkbox"]').first());

    this.agreeCheckbox = page.getByRole('checkbox', { name: /agree and understand/i })
      .or(page.locator('input[type="checkbox"]').nth(1));

    // Pay and Reserve button
    this.payAndReserveButton = page.getByRole('button', { name: /pay and reserve/i })
      .or(page.getByRole('button', { name: /reserve|pay/i }))
      .first();
  }

  async selectFirstDeal() {
    console.log('🚘 Selecting first available transfer deal...');
    await this.showDealButton.waitFor({ state: 'visible', timeout: 35000 });
    await this.showDealButton.click();
    await this.page.waitForTimeout(1000);

    console.log('📝 Clicking Book Now...');
    await this.bookNowButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.bookNowButton.click();
    await this.waitForFullPageLoad(this.page, 2000);
  }

  async fillPassengerDetails(guestData) {
    console.log('👤 Filling Transfer Guest details...');
    await this.waitAndFill(this.firstNameInput, guestData.firstName);
    await this.waitAndFill(this.lastNameInput, guestData.lastName);

    if (await this.mobileInput.isVisible().catch(() => false)) {
      await this.mobileInput.click();
      await this.mobileInput.fill(guestData.mobile);
    }

    await this.waitAndFill(this.emailInput, guestData.email);

    if (guestData.note && (await this.noteInput.isVisible().catch(() => false))) {
      await this.noteInput.fill(guestData.note);
    }
  }

  async fillTransferTripDetails(tripData) {
    console.log('✈️ Filling Transfer Trip details...');
    if (tripData.flightNumber && (await this.flightNumberInput.isVisible().catch(() => false))) {
      await this.flightNumberInput.fill(tripData.flightNumber);
    }

    if (tripData.mode && (await this.modeOfTransferSelect.isVisible().catch(() => false))) {
      await this.modeOfTransferSelect.selectOption(tripData.mode);
    }

    if (tripData.direction && (await this.directionSelect.isVisible().catch(() => false))) {
      await this.directionSelect.selectOption(tripData.direction);
    }

    if (tripData.carrierName && (await this.carrierNameInput.isVisible().catch(() => false))) {
      await this.carrierNameInput.fill(tripData.carrierName);
    }
  }

  async proceedToReview() {
    console.log('➡️ Proceeding to Review step...');
    await this.waitAndClick(this.nextButton);
    await this.page.waitForTimeout(1500);
  }

  async acceptTermsAndReserve() {
    console.log('✅ Accepting Terms & Conditions...');
    const terms = this.page.getByRole('checkbox', { name: /terms/i }).first();
    if (await terms.isVisible().catch(() => false)) {
      await terms.check({ force: true });
    }

    const cancellation = this.page.getByRole('checkbox', { name: /cancellation|agree/i }).first();
    if (await cancellation.isVisible().catch(() => false)) {
      await cancellation.check({ force: true });
    }

    console.log('💳 Clicking Pay and Reserve button...');
    const btn = this.page.getByRole('button', { name: /^pay and reserve$/i })
      .filter({ visible: true })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click({ force: true });

    // Handle any confirmation dialog/modal if it appears
    const confirmModalBtn = this.page.locator('.modal, [role="dialog"]')
      .getByRole('button', { name: /confirm|yes|proceed|ok/i })
      .filter({ visible: true })
      .first();

    if (await confirmModalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('🔘 Clicking modal confirmation button...');
      await confirmModalBtn.click({ force: true });
    }

    await this.page.waitForTimeout(4000);
  }
}

