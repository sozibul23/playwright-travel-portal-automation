/**
 * FlightCommissionPage - Fare Summary popup থেকে প্রতিটা pax type এর
 * Base Fare / Tax / Discount পড়ে এবং testData.js এর commissionConfig
 * অনুযায়ী expected discount এর সাথে মিলিয়ে দেখে।
 *
 * Commission rate পরিবর্তন হলে শুধু data/testData.js এর commissionConfig
 * এবং commissionTolerance আপডেট করলেই হবে — এই ফাইলে কিছু বদলাতে হবে না।
 */
export class FlightCommissionPage {
  constructor(page) {
    this.page = page;
  }

  // ── STEP 1: Search results লোড হওয়ার জন্য wait ─────────────────────────────
  async waitForResults() {
    const searchPendingBanner = this.page.getByText(/search is not completed/i).first();
    if (await searchPendingBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchPendingBanner.waitFor({ state: 'hidden', timeout: 90000 }).catch(() => { });
    }

    await this.page
      .getByRole('button', { name: 'Fare Summary' })
      .first()
      .waitFor({ state: 'visible', timeout: 60000 });
  }

  // ── STEP 2: "Fare Summary" button ক্লিক করে popup খোলা ─────────────────────
  async openFareSummary() {
    const btn = this.page.getByRole('button', { name: /Fare Summary/i })
      .or(this.page.locator('button:has-text("Fare Summary"), [role="button"]:has-text("Fare Summary"), a:has-text("Fare Summary")'))
      .first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click({ force: true });

    await this.page
      .getByText(/Fare Summary/i)
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });

    await this.page.waitForTimeout(500);
  }

  async openFareSummaryModal() {
    await this.openFareSummary();
  }

  // ── STEP 3: Fare Breakdown grid/table থেকে pax-wise data extract করা ────────
  async extractAllPaxFareSummary() {
    const rawData = await this.page.evaluate(() => {
      // 1. Try HTML Table first
      const tables = Array.from(document.querySelectorAll('table'));
      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr')).map(tr => 
          Array.from(tr.querySelectorAll('th, td')).map(c => (c.textContent || '').trim())
        ).filter(r => r.length >= 4);
        if (rows.length >= 2) return { allRows: rows };
      }

      // 2. Try CSS Grid / container elements
      const grids = Array.from(document.querySelectorAll('[class*="grid-cols-"], [class*="grid"]'));
      for (const grid of grids) {
        const children = Array.from(grid.children);
        if (children.length >= 6) {
          const rowText = children.map(c => (c.textContent || '').trim());
          return { allRows: [rowText] };
        }
      }

      // 3. Try Modal / Popup text scan
      const modal = document.querySelector('dialog[open], .modal[open], .modal.modal-open, .modal-box, div[role="dialog"]');
      if (modal) {
        const rows = Array.from(modal.querySelectorAll('div.flex, div.grid, tr')).map(el => 
          Array.from(el.children).map(c => (c.textContent || '').trim())
        ).filter(r => r.length >= 3);
        if (rows.length > 0) return { allRows: rows };
      }

      return { error: 'No fare breakdown structure found' };
    });

    if (rawData.error || !rawData.allRows || rawData.allRows.length === 0) {
      console.log('⚠️ Fare Summary data row পাওয়া যায়নি, DOM scan:', rawData.error);
      return [];
    }

    const paxRows = [];
    for (const row of rawData.allRows) {
      const rowText = row.join(' ').toLowerCase();
      let paxType = null;
      if (rowText.includes('adult') || rowText.includes('adt')) paxType = 'Adult';
      else if (rowText.includes('child') || rowText.includes('chd') || rowText.includes('c05')) paxType = 'Child';
      else if (rowText.includes('infant') || rowText.includes('inf')) paxType = 'Infant';
      if (!paxType) continue;

      const amounts = row.map(c => this._parseAmount(c)).filter(n => n !== null && n > 0);
      if (amounts.length >= 2) {
        paxRows.push({
          paxType,
          baseFare: amounts[0] || 0,
          tax: amounts[1] || 0,
          discount: amounts.length >= 4 ? amounts[2] : 0,
          subTotal: amounts[amounts.length - 1] || amounts[0]
        });
      }
    }

    return paxRows;
  }

  // ── Helper: "৳ 20,971.54" → 20971.54 ───────────────────────────────────────
  _parseAmount(text) {
    if (!text) return null;
    const num = parseFloat(text.replace(/[৳,\s]/g, '').replace(/[^\d.]/g, ''));
    return isNaN(num) ? null : num;
  }

  // ── STEP 4: প্রতিটা pax এর Discount, config অনুযায়ী expected value এর
  // সাথে মিলছে কিনা verify করা।
  // Expected discount = (baseFare × baseFarePercent/100) + (tax × taxPercent/100)
  verifyDiscountForAllPax(paxRows, commissionConfig = {}, { tolerance = 2.0 } = {}) {
    const results = { passed: true, paxResults: [] };

    if (!paxRows?.length) {
      results.passed = false;
      results.paxResults.push({ paxType: 'N/A', passed: false, reason: 'কোনো pax row পাওয়া যায়নি' });
      return results;
    }

    for (const row of paxRows) {
      const config = commissionConfig[row.paxType] ?? null;
      const hasDiscount = row.discount !== null && row.discount > 0;
      const paxResult = {
        paxType: row.paxType,
        baseFare: row.baseFare,
        tax: row.tax,
        discount: row.discount,
        passed: false,
        checks: [],
      };

      if (!hasDiscount) {
        const expectedZero = !config || ((config.baseFarePercent ?? 0) === 0 && (config.taxPercent ?? 0) === 0);
        paxResult.passed = expectedZero;
        paxResult.checks.push({ name: 'Discount = 0', passed: expectedZero, value: row.discount });
        results.paxResults.push(paxResult);
        if (!paxResult.passed) results.passed = false;
        continue;
      }

      if (!config) {
        paxResult.checks.push({ name: `Config নেই "${row.paxType}" এর জন্য`, passed: false });
        results.paxResults.push(paxResult);
        results.passed = false;
        continue;
      }

      const baseFareComponent = parseFloat(((row.baseFare ?? 0) * (config.baseFarePercent ?? 0) / 100).toFixed(2));
      const taxComponent = parseFloat(((row.tax ?? 0) * (config.taxPercent ?? 0) / 100).toFixed(2));
      const expectedDiscount = parseFloat((baseFareComponent + taxComponent).toFixed(2));
      const diff = Math.abs(row.discount - expectedDiscount);
      const calcMatch = diff <= tolerance;

      paxResult.checks.push({
        name: `Discount = ${config.baseFarePercent}% of BaseFare(${row.baseFare}) + ${config.taxPercent}% of Tax(${row.tax})`,
        passed: calcMatch,
        value: row.discount,
        expected: expectedDiscount,
        diff: parseFloat(diff.toFixed(2)),
        breakdown: { baseFareComponent, taxComponent },
      });

      paxResult.passed = calcMatch;
      results.paxResults.push(paxResult);
      if (!calcMatch) results.passed = false;
    }

    return results;
  }

  // ── Report print — console এ readable summary, debugging এর জন্য কাজে লাগে ─
  printVerificationReport(verificationResult) {
    console.log('\n' + '═'.repeat(60));
    console.log('  ✈️  FLIGHT DISCOUNT/COMMISSION VERIFICATION REPORT');
    console.log('═'.repeat(60));

    for (const p of verificationResult.paxResults) {
      console.log(`\n👤 ${p.paxType}`);
      console.log(`   Base Fare : ৳ ${p.baseFare}`);
      console.log(`   Tax       : ৳ ${p.tax}`);
      console.log(`   Discount  : ৳ ${p.discount}`);
      for (const c of p.checks ?? []) {
        console.log(`   ${c.passed ? '✅' : '❌'} ${c.name}`);
        if (c.expected !== undefined) console.log(`      Got: ৳${c.value}  Expected: ৳${c.expected}  (diff: ${c.diff})`);
      }
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  Overall: ${verificationResult.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═'.repeat(60) + '\n');
  }
}
