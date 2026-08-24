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
    await this.page.getByRole('button', { name: 'Fare Summary' }).first().click();

    await this.page
      .getByText('Fare Summary', { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });

    await this.page.locator('[class*="grid-cols-8"]').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
  }


  // ── STEP 3: Fare Breakdown grid থেকে pax-wise data extract করা ────────────
  // Columns (best-effort, header text matching দিয়ে detect করা হয়):
  // Pax Type | Base Fare | Taxes | AIT | Fees | Discount | Pax Count | Sub Total
  //
  // NOTE: এটা Tailwind এর "grid-cols-8" class এর উপর নির্ভর করে, যা fragile।
  // যদি কখনো এই selector কাজ না করে (UI redesign হলে), সবার আগে এখানে দেখো।

  async extractAllPaxFareSummary() {
    const rawData = await this.page.evaluate(() => {
      const COLS = 8;
      const grids = Array.from(document.querySelectorAll('[class*="grid-cols-8"]'));
      if (grids.length === 0) return { error: 'No grid-cols-8 found', grids: 0 };

      const allRows = [];
      for (const grid of grids) {
        const children = Array.from(grid.children);
        if (children.length >= COLS) {
          allRows.push(children.map((c) => (c.textContent || '').trim()));
        }
      }
      return { allRows, gridCount: grids.length };
    });

    if (rawData.error || !rawData.allRows || rawData.allRows.length < 2) {
      console.log('⚠️  Fare Summary grid থেকে header + data row পাওয়া যায়নি:', rawData.error ?? 'rows < 2');
      return [];
    }

    // Header row থেকে কোন column কোনটা বের করা
    const headerRow = rawData.allRows[0];
    const colIndex = { paxType: 0, baseFare: -1, taxes: -1, discount: -1, subTotal: -1 };
    for (let i = 0; i < headerRow.length; i++) {
      const text = headerRow[i].toLowerCase();
      if (text.includes('base fare') || text.includes('basefare')) colIndex.baseFare = i;
      else if (text.includes('tax') && !text.includes('ait')) colIndex.taxes = i;
      else if (text.includes('discount')) colIndex.discount = i;
      else if (text.includes('sub total') || text.includes('subtotal')) colIndex.subTotal = i;
      else if (text.includes('pax type')) colIndex.paxType = i;
    }

    // Header এর পরের rows থেকে Adult/Child/Infant row গুলো বের করা
    const paxRows = [];
    for (let r = 1; r < rawData.allRows.length; r++) {
      const row = rawData.allRows[r];
      const firstCellText = (row[colIndex.paxType] || '').toLowerCase();

      let paxType = null;
      if (firstCellText.includes('adult')) paxType = 'Adult';
      else if (firstCellText.includes('child')) paxType = 'Child';
      else if (firstCellText.includes('infant')) paxType = 'Infant';
      if (!paxType) continue;

      const getVal = (colIdx) => (colIdx < 0 || colIdx >= row.length ? null : this._parseAmount(row[colIdx]));

      paxRows.push({
        paxType,
        baseFare: getVal(colIndex.baseFare),
        tax: getVal(colIndex.taxes),
        discount: getVal(colIndex.discount),
        subTotal: getVal(colIndex.subTotal),
      });
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
