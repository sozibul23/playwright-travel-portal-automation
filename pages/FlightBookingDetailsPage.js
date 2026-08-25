import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * FlightBookingDetailsPage - Page Object Model
 * Handles verification on the Booking Confirmation / Details page (/booking-details/flight)
 * Includes tabs navigation (Itinerary, Fare, Rules, Invoice, etc.) and financial reconciliation.
 */
export class FlightBookingDetailsPage extends BasePage {
  constructor(page) {
    super(page);

    // Header locators
    this.bookingIdLocator = page.locator('h1, h2, h3, p, div')
      .filter({ hasText: /FL[0-9A-Z]{6,}|Booking ID:\s*FL/i })
      .first();

    this.statusBadge = page.locator('.badge, [class*="status"], [class*="ticketed"], div:has-text("Ticketed"), div:has-text("Hold Successful"), div:has-text("Held"), div:has-text("Confirmed")')
      .first();

    // Summary Card (Right Side)
    this.grandTotalContainer = page.locator('div, p, tr')
      .filter({ hasText: /Grand Total/i })
      .last();

    this.publishedFareContainer = page.locator('div, p, tr')
      .filter({ hasText: /Total Published Fare/i })
      .first();

    this.couponDiscountContainer = page.locator('div, p, tr')
      .filter({ hasText: /Discount by Coupon/i })
      .first();
  }

  /**
   * Waits for the page to navigate to /booking-details and settle across any open tabs
   */
  async waitForBookingDetailsPage(timeout = 60000) {
    console.log('⏳ Waiting for booking confirmation and redirect to /booking-details...');
    const context = this.page.context();
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const pages = context.pages();
      for (const p of pages) {
        const url = p.url();
        if (url.includes('/booking-details') || url.includes('/bookings/flight') || url.includes('/pnr')) {
          console.log(`🎯 Found booking details page: ${url}`);
          this.page = p;
          await this.page.bringToFront().catch(() => {});
          await this.page.waitForLoadState('domcontentloaded').catch(() => {});
          await this.page.waitForTimeout(3000);
          return;
        }
      }

      // Check if current page has explicit PNR / Booking reference
      const bookingRef = this.page.locator('body').filter({
        hasText: /Booking ID:\s*FL\d+|PNR:\s*[A-Z0-9]+|Hold Successful/i
      }).first();
      if (await bookingRef.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log('🎯 Found booking reference element on page!');
        await this.page.waitForTimeout(2000);
        return;
      }

      await this.page.waitForTimeout(1000);
    }

    throw new Error(`❌ Timed out waiting for booking details page! Current URL: ${this.page.url()}`);
  }

  /**
   * Extracts Booking ID (e.g. FL2624AUS8AEF4)
   */
  async getBookingId() {
    const el = this.page.locator('h1, h2, h3, p, div').filter({ hasText: /FL[0-9A-Z]{6,}|Booking ID/i }).first();
    const text = await el.innerText().catch(() => '');
    const match = text.match(/FL[0-9A-Z]+/i);
    return match ? match[0] : text.trim();
  }

  /**
   * Reads Grand Total from the right-hand price summary
   * @returns {Promise<number>}
   */
  async getGrandTotal() {
    const grandTotalRow = this.page.locator('div, p, tr, td, li')
      .filter({ hasText: /Grand Total/i })
      .filter({ visible: true })
      .last();

    if (await grandTotalRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rowText = await grandTotalRow.innerText().catch(() => '');
      const numbers = rowText.match(/[\d,]+(\.\d+)?/g);
      if (numbers && numbers.length > 0) {
        const lastNum = numbers[numbers.length - 1].replace(/,/g, '');
        const val = parseFloat(lastNum);
        if (!isNaN(val) && val > 0) return val;
      }
    }

    const fallbackLoc = this.page.locator('text=Grand Total >> xpath=..').locator('text=/৳|[0-9]/').last();
    if (await fallbackLoc.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await fallbackLoc.innerText().catch(() => '0');
      const val = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (!isNaN(val) && val > 0) return val;
    }

    return 0;
  }

  /**
   * Reads the Coupon Discount shown in the summary card
   * @returns {Promise<number>}
   */
  async getCouponDiscountAmount() {
    if (await this.couponDiscountContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await this.couponDiscountContainer.innerText().catch(() => '');
      const match = text.match(/[\d,]+(\.\d+)?/);
      if (match) {
        return parseFloat(match[0].replace(/,/g, ''));
      }
    }
    return 0;
  }

  /**
   * Opens the "Invoice" tab on the booking details page
   */
  async openInvoiceTab() {
    console.log('📄 Navigating to Invoice tab...');
    // Exclude finance menu navbar dropdown items and target the booking tabs
    const invoiceTab = this.page
      .locator('button, a, [role="tab"], li, span, div')
      .filter({ hasNot: this.page.locator('a[href*="/finance/"]') })
      .filter({ hasText: /^Invoice$/i })
      .filter({ visible: true })
      .first();

    await invoiceTab.waitFor({ state: 'visible', timeout: 20000 });
    await invoiceTab.click({ force: true });
    await this.page.waitForTimeout(1500); // Allow table transition/render
  }

  /**
   * Extracts the Invoice Amount from the table under Invoice tab
   * @returns {Promise<number>}
   */
  async getInvoiceAmount() {
    await this.openInvoiceTab();

    // Table rows under Invoice tab
    const invoiceTable = this.page.locator('table, .table, [role="table"]').first();
    await invoiceTable.waitFor({ state: 'visible', timeout: 10000 });

    // Method 1: Find cell under "Invoice Amount" header column
    const headerCells = await invoiceTable.locator('th, thead td').allInnerTexts().catch(() => []);
    const amountColIndex = headerCells.findIndex(h => /Invoice\s*Amount|Amount/i.test(h));

    if (amountColIndex !== -1) {
      const cell = invoiceTable.locator('tbody tr').first().locator('td').nth(amountColIndex);
      if (await cell.isVisible({ timeout: 3000 }).catch(() => false)) {
        const text = await cell.innerText();
        const val = parseFloat(text.replace(/[^0-9.]/g, ''));
        if (!isNaN(val) && val > 0) return val;
      }
    }

    // Method 2: Match cell with currency/number in the first row
    const rowTds = invoiceTable.locator('tbody tr').first().locator('td');
    const tdCount = await rowTds.count();
    for (let i = 0; i < tdCount; i++) {
      const tdText = await rowTds.nth(i).innerText();
      if (/৳|[0-9]{3,}/.test(tdText) && !/INV|202[0-9]/.test(tdText)) {
        const val = parseFloat(tdText.replace(/[^0-9.]/g, ''));
        if (!isNaN(val) && val > 0) return val;
      }
    }

    // Method 3: Fallback regex on table text
    const tableText = await invoiceTable.innerText();
    const matches = tableText.match(/৳\s*[\d,]+(\.\d+)?/g) || tableText.match(/[\d,]+\.\d{2}/g);
    if (matches && matches.length > 0) {
      return parseFloat(matches[0].replace(/[^0-9.]/g, ''));
    }

    return 0;
  }

  /**
   * Financial Reconciliation:
   * Asserts that Grand Total (after coupon) matches the Invoice Amount exactly (±1 Tk rounding tolerance)
   */
  async verifyInvoiceMatchesGrandTotal() {
    const grandTotal = await this.getGrandTotal();
    const invoiceAmount = await this.getInvoiceAmount();
    const couponDiscount = await this.getCouponDiscountAmount();

    console.log(
      `🧾 [Reconciliation Check] ` +
      `Grand Total: ৳${grandTotal} | ` +
      `Invoice Amount: ৳${invoiceAmount} | ` +
      `Coupon Discount: ৳${couponDiscount}`
    );

    expect(
      grandTotal,
      '❌ Failed: Grand Total must be greater than 0 on booking details page!'
    ).toBeGreaterThan(0);

    expect(
      invoiceAmount,
      '❌ Failed: Invoice Amount must be greater than 0 under Invoice tab!'
    ).toBeGreaterThan(0);

    const diff = Math.abs(grandTotal - invoiceAmount);
    expect(
      diff,
      `❌ Financial Mismatch! Grand Total (৳${grandTotal}) does not match Invoice Amount (৳${invoiceAmount}). Difference: ৳${diff.toFixed(2)}`
    ).toBeLessThanOrEqual(1.0); // Allow ≤ ৳1 rounding difference

    console.log(`✅ [Reconciliation PASS] Grand Total (৳${grandTotal}) == Invoice Amount (৳${invoiceAmount})`);

    return {
      passed: true,
      grandTotal,
      invoiceAmount,
      couponDiscount
    };
  }
}
