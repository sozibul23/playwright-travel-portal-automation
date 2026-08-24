import { BasePage } from './BasePage.js';

export class HotelGuestFormPage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Fill lead guest details on detailPage for all room guest inputs dynamically.
   *
   * FIX NOTES (HTL-30 → HTL-36):
   *  Multi-room checkout pages have per-room accordion sections. Each section must be
   *  expanded (clicked open) before its First/Last name inputs become visible.
   *  The previous flat filter({ visible: true }) missed collapsed sections entirely.
   *
   * @param {Page}   detailPage  - Detail page popup tab
   * @param {string} firstName   - Lead guest first name
   * @param {string} lastName    - Lead guest last name
   * @param {Array}  guestsList  - Array of guest objects [{firstName, lastName}]
   */
  async fillGuestDetails(detailPage, firstName = 'SADHIN', lastName = 'ISLAM', guestsList = null) {
    if (!detailPage || detailPage.isClosed()) return;
    await this.waitForFullPageLoad(detailPage, 2500);
    await detailPage.waitForURL(/\/hotel\/checkout/i, { timeout: 30000 }).catch(() => {});
    await detailPage.waitForTimeout(800);

    // ── Step 1: Expand all room accordion sections on the checkout page ───────
    // The portal renders each room's guest form inside a collapsible section.
    // We must open each one before trying to locate inputs inside.
    const roomSections = detailPage.locator('div.collapse, [class*="room-section"], [class*="roomSection"]')
      .filter({ visible: true });
    const sectionCount = await roomSections.count().catch(() => 0);
    console.log(`Checkout accordion room sections found: ${sectionCount}`);

    for (let s = 0; s < sectionCount; s++) {
      const section = roomSections.nth(s);
      const alreadyOpen = await section.evaluate(el =>
        el.classList.contains('collapse-open') || el.hasAttribute('open')
      ).catch(() => false);

      if (!alreadyOpen) {
        const radio = section.locator('input[type="radio"]').first();
        if (await radio.isVisible({ timeout: 400 }).catch(() => false)) {
          await radio.check({ force: true }).catch(() => {});
        } else {
          const title = section.locator('.collapse-title, label, h3, h4').first();
          await title.click({ force: true }).catch(() => {});
        }
        await detailPage.waitForTimeout(300);
      }
    }

    // ── Step 2: Locate all First Name and Last Name inputs (now visible) ──────
    const firstNameInputs = detailPage.getByRole('textbox', { name: /First|Given Name/i })
      .or(detailPage.locator('input[name*="lead_guest_first_name"]'))
      .or(detailPage.locator('input[placeholder*="First/Given Name"]'))
      .or(detailPage.locator('input[placeholder*="First"]'))
      .or(detailPage.locator('input[name*="firstName"]'))
      .or(detailPage.locator('input[name*="first_name"]'))
      .filter({ visible: true });

    const lastNameInputs = detailPage.getByRole('textbox', { name: /Surname|Family|Last Name/i })
      .or(detailPage.locator('input[name*="lead_guest_last_name"]'))
      .or(detailPage.locator('input[placeholder*="Surname/Family/Last Name"]'))
      .or(detailPage.locator('input[placeholder*="Surname"]'))
      .or(detailPage.locator('input[placeholder*="Last"]'))
      .or(detailPage.locator('input[name*="lastName"]'))
      .or(detailPage.locator('input[name*="last_name"]'))
      .filter({ visible: true });

    // Wait up to 30s for at least 1 First Name input to render
    await firstNameInputs.first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    await detailPage.waitForTimeout(400);

    const firstCount = await firstNameInputs.count().catch(() => 0);
    const lastCount = await lastNameInputs.count().catch(() => 0);
    console.log(`Filling guest details: ${firstCount} first name input(s), ${lastCount} last name input(s)...`);

    // ── Step 3: Fill First Name inputs ────────────────────────────────────────
    for (let i = 0; i < firstCount; i++) {
      const fn = guestsList && guestsList[i] ? guestsList[i].firstName : `${firstName}${i > 0 ? (i + 1) : ''}`;
      const input = firstNameInputs.nth(i);
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.scrollIntoViewIfNeeded().catch(() => {});
        await input.click({ force: true }).catch(() => {});
        await input.fill('');
        await input.fill(fn);
        await input.dispatchEvent('input').catch(() => {});
        await input.dispatchEvent('change').catch(() => {});
        await detailPage.waitForTimeout(150);
      }
    }

    // ── Step 4: Fill Last Name inputs ─────────────────────────────────────────
    for (let i = 0; i < lastCount; i++) {
      const ln = guestsList && guestsList[i] ? guestsList[i].lastName : `${lastName}${i > 0 ? (i + 1) : ''}`;
      const input = lastNameInputs.nth(i);
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.scrollIntoViewIfNeeded().catch(() => {});
        await input.click({ force: true }).catch(() => {});
        await input.fill('');
        await input.fill(ln);
        await input.dispatchEvent('input').catch(() => {});
        await input.dispatchEvent('change').catch(() => {});
        await detailPage.waitForTimeout(150);
      }
    }

    // Give form inputs 1000ms to register state changes before Next button
    await detailPage.waitForTimeout(1000);

    // ── Step 5: Click Next / Continue if present ──────────────────────────────
    const nextBtn = detailPage.getByRole('button', { name: /Next|Continue/i })
      .or(detailPage.locator('button:has-text("Next")'))
      .filter({ visible: true })
      .first();

    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking Next button on guest details form...');
      await detailPage.waitForTimeout(800);
      await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
      await nextBtn.click({ force: true }).catch(() => nextBtn.evaluate(el => el.click()));
      await detailPage.waitForTimeout(2000);
    }
  }

  /**
   * Accept terms & conditions checkboxes (EXCLUDING Special Requests checkboxes completely)
   * @param {Page} detailPage - Detail page popup tab
   */
  async acceptTermsAndConditions(detailPage) {
    if (!detailPage || detailPage.isClosed()) return;
    await detailPage.waitForLoadState('load').catch(() => {});
    console.log('Checking Terms & Conditions checkboxes (excluding Special Requests)...');
    await detailPage.waitForTimeout(500).catch(() => {});

    // Target specifically terms & conditions / policy / agreement / package deal checkboxes
    const termsCheckboxes = detailPage.getByRole('checkbox', { name: /Terms|Condition|Agree|Understand|Accept|Policy|Package/i })
      .or(detailPage.locator('input[type="checkbox"][name*="term"], input[type="checkbox"][name*="policy"], input[type="checkbox"][name*="package"], input[type="checkbox"][id*="term"]'))
      .or(detailPage.locator('.terms-conditions input[type="checkbox"], .cancellation-policy input[type="checkbox"], div:has-text("Terms") input[type="checkbox"]'))
      .filter({ visible: true });

    let count = await termsCheckboxes.count().catch(() => 0);

    // Fallback: If terms-specific locator returns 0, loop through all checkboxes EXCLUDING Special Requests
    if (count === 0) {
      const allCheckboxes = detailPage.locator('input[type="checkbox"]').filter({ visible: true });
      const total = await allCheckboxes.count().catch(() => 0);
      for (let i = 0; i < total; i++) {
        const cb = allCheckboxes.nth(i);
        const parentText = (await cb.evaluate(el => el.parentElement?.innerText || el.closest('label')?.innerText || el.closest('div')?.innerText || '')).toLowerCase();
        
        // Skip Special Requests checkboxes completely
        const isSpecialRequest = /connecting|side by side|check-in|check-out|twin bed|membership|smoking|high floor|baby cat|special request/i.test(parentText);
        if (!isSpecialRequest) {
          const isChecked = await cb.isChecked().catch(() => false);
          if (!isChecked) {
            await cb.check({ force: true }).catch(async () => {
              await cb.click({ force: true }).catch(() => {});
            });
          }
        }
      }
      return;
    }

    console.log(`Found ${count} Terms & Conditions checkboxes`);
    for (let i = 0; i < count; i++) {
      const cb = termsCheckboxes.nth(i);
      const isChecked = await cb.isChecked().catch(() => false);
      if (!isChecked) {
        await cb.check({ force: true }).catch(async () => {
          await cb.click({ force: true }).catch(() => {});
        });
      }
    }
  }

  /**
   * Submit booking by clicking 'Pay and Reserve' / 'Hold Booking' / 'Reserve' / Submit button
   * @param {Page} detailPage - Detail page popup tab
   */
  async clickPayAndReserve(detailPage) {
    if (!detailPage || detailPage.isClosed()) return;
    await detailPage.waitForLoadState('domcontentloaded').catch(() => {});
    console.log('Clicking Pay and Reserve / Hold Booking button...');

    // Function to dismiss any 401 / network error modal backdrop
    const dismissModalIfPresent = async () => {
      const closeBtn = detailPage.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle, .modal button:has-text("Close"), dialog button:has-text("Close"), .modal-box button:has-text("✕")')
        .filter({ visible: true })
        .first();
      if (await closeBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        console.log('⚠️ Dismissing open 401/error modal on checkout page...');
        await closeBtn.click({ force: true }).catch(() => closeBtn.evaluate(el => el.click())).catch(() => {});
        await detailPage.waitForTimeout(600).catch(() => {});
        return true;
      }
      return false;
    };

    await dismissModalIfPresent();

    const reserveBtn = detailPage.locator('button')
      .filter({ hasText: /Pay and Reserve|Pay & Reserve|Hold Booking|Hold|Reserve|Book Now|Confirm|Pay Now|Proceed|Submit/i })
      .or(detailPage.locator('button[type="submit"]'))
      .filter({ visible: true })
      .first();

    await reserveBtn.scrollIntoViewIfNeeded().catch(() => {});

    let freshLoginDone = false;

    // Try clicking submit button up to 4 times, clearing any overlay modals
    for (let attempt = 1; attempt <= 4; attempt++) {
      const had401 = await dismissModalIfPresent();
      if (had401) {
        console.log('⚠️ Overlay / Error modal dismissed. Re-accepting terms and retrying Pay & Reserve...');
        await this.acceptTermsAndConditions(detailPage).catch(() => {});
        await detailPage.waitForTimeout(500).catch(() => {});
      }

      if (await reserveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`Clicking Pay and Reserve / Hold Booking button (attempt ${attempt})...`);
        await reserveBtn.click({ force: true }).catch(() => reserveBtn.evaluate(el => el.click())).catch(() => {});
        await detailPage.waitForTimeout(2500).catch(() => {});

        // Check if navigation happened or booking confirmation appeared.
        // Portal success pattern: stays on /hotel/checkout but appends ?booking_tracking_id=...
        if (detailPage.isClosed()) return;
        const currentUrl = detailPage.url();
        let hasTrackingId = false;
        try {
          const u = new URL(currentUrl);
          hasTrackingId = !!(
            u.searchParams.get('booking_tracking_id') ||
            u.searchParams.get('tracking_id') ||
            u.searchParams.get('pnr')
          );
        } catch {}

        const isConfirm = hasTrackingId
          || currentUrl.includes('booking-details')
          || currentUrl.includes('confirmation');

        if (isConfirm) {
          console.log('✅ Booking submitted successfully!');
          return;
        }
      }
      await detailPage.waitForTimeout(1000).catch(() => {});
    }
  }
}
