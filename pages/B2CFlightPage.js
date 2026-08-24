import { BasePage } from './BasePage.js';

export class B2CFlightPage extends BasePage {
  constructor(page) {
    super(page);
    this.couponInput = page.getByRole('textbox', { name: 'Coupon' }).or(page.locator('input[placeholder*="Coupon"], input[name*="coupon"]'));
    this.couponApplyBtn = page.getByRole('button', { name: 'Apply' }).or(page.locator('button:has-text("Apply")'));
    this.searchBtn = page.locator('button').filter({ hasText: 'Search' }).first();
  }

  /**
   * Search for a flight on B2C portal
   * @param {string} from - Origin code (default: 'dac')
   * @param {string} to - Destination code (default: 'cxb')
   */
  async searchFlight(from = 'dac', to = 'cxb') {
    const b2cUrl = process.env.B2C_BASE_URL || 'https://b2c.innovatedemo.com';
    const fromCode = (from || 'dac').toUpperCase();
    const toCode = (to || 'cxb').toUpperCase();

    // Set dynamic active future date (approx ~25 days ahead)
    const today = new Date();
    const flightDate = new Date(today);
    flightDate.setDate(flightDate.getDate() + 25);
    const dateStr = flightDate.toISOString().split('T')[0];

    const searchUrl = `${b2cUrl}/flight/search?trips=${fromCode},${toCode},${dateStr}&cabin_class=Economy&flight=any&baggage=any&adult=1&child=0&child_age=&infant=0&infant_age=&carriers=`;
    await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Select first available flight result on B2C
   */
  async selectFirstFlight() {
    const selectFlightBtn = this.page.locator('button').filter({ hasText: /Select|Book Now|Select Flight/i }).first();
    await selectFlightBtn.waitFor({ state: 'visible', timeout: 35000 });
    await selectFlightBtn.click({ force: true });
    await this.page.waitForURL(/checkout|booking/i, { timeout: 35000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  /**
   * Apply coupon code on checkout page
   * @param {string} couponCode
   */
  async applyCoupon(couponCode) {
    await this.couponInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.couponInput.scrollIntoViewIfNeeded().catch(() => {});
    await this.couponInput.fill('');
    await this.couponInput.fill(couponCode);
    await this.couponApplyBtn.click({ force: true });
    await this.page.waitForTimeout(1500);
  }

  /**
   * Get current total price displayed on checkout page summary
   */
  async getTotalPayable() {
    // Target exact Total Payable line in Customer Summary
    const payableLoc = this.page.locator('div:has(> p:has-text("Total Payable")) p, p:has-text("Total Payable") + p, [class*="payable"]:has-text("৳")')
      .filter({ hasText: /৳|BDT|[0-9]/ })
      .last();

    if (await payableLoc.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = (await payableLoc.innerText().catch(() => '0')).replace(/[^0-9.]/g, '');
      const val = parseFloat(text);
      if (!isNaN(val) && val > 0) return val;
    }

    // Fallback locator
    const priceLoc = this.page.locator('[class*="total"], [class*="payable"], [class*="grand-total"]')
      .filter({ hasNotText: /Meet/i })
      .filter({ hasText: /৳|BDT|\$|USD|[0-9]/ })
      .first();
    const text = (await priceLoc.innerText().catch(() => '0')).replace(/[^0-9.]/g, '');
    return parseFloat(text) || 0;
  }

  /**
   * Get Base Fare from Customer Summary
   */
  async getBaseFare() {
    const baseFareLoc = this.page.locator('div:has(> p:has-text("Base Fare")) p, p:has-text("Base Fare") + *')
      .filter({ hasText: /[0-9]/ })
      .last();
    if (await baseFareLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = (await baseFareLoc.innerText().catch(() => '0')).replace(/[^0-9.]/g, '');
      const val = parseFloat(text);
      if (!isNaN(val) && val > 0) return val;
    }
    return 0;
  }

  /**
   * Get Discount amount displayed on checkout page summary
   */
  async getCouponDiscount() {
    const discountLoc = this.page.locator('p:has-text("Discount by Coupon") + p, :text("Discount by Coupon") + *, [class*="discount"]:has-text("৳")')
      .filter({ hasText: /[0-9]/ })
      .first();
    if (await discountLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = (await discountLoc.innerText().catch(() => '0')).replace(/[^0-9.]/g, '');
      return parseFloat(text) || 0;
    }
    return 0;
  }
}
